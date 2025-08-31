// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase/supabase-js@2.45.0";

// Workaround for Deno types not being found in some environments
declare global {
  namespace Deno {
    namespace env {
      function get(key: string): string | undefined;
    }
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => console.log(`[CHECK-SUBSCRIPTION] ${step}`, details ?? "");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    log("Start");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    log("User", { id: user.id, email: user.email });

    const nowIso = new Date().toISOString();
    
    // 1. Check for direct subscription
    const { data: directSubscriber, error: directSubError } = await supabaseService
      .from('subscribers')
      .select('email,user_id,subscription_tier,subscription_end,subscribed,minutes_balance,total_minutes_purchased')
      .eq('user_id', user.id)
      .maybeSingle();

    if (directSubError) log('Direct subscriber fetch error', directSubError);

    let active = false;
    let tier: string | null = directSubscriber?.subscription_tier ?? null;
    let endAt: string | null = directSubscriber?.subscription_end ?? null;
    let minutesBalance = directSubscriber?.minutes_balance || 0;
    let totalMinutesPurchased = directSubscriber?.total_minutes_purchased || 0;

    if (endAt) {
      const ends = new Date(endAt).getTime();
      active = ends > Date.now();
    }

    // 2. If not directly subscribed, check for shared access
    if (!active) {
      const { data: sharedAccess, error: sharedAccessError } = await supabaseService
        .from('shared_access')
        .select('sharer_user_id, expires_at')
        .eq('shared_with_user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (sharedAccessError) log('Shared access fetch error', sharedAccessError);

      if (sharedAccess) {
        const sharerSubEnd = sharedAccess.expires_at;
        if (sharerSubEnd) {
          const ends = new Date(sharerSubEnd).getTime();
          if (ends > Date.now()) {
            active = true;
            tier = 'Shared'; // Indicate it's a shared subscription
            endAt = sharerSubEnd;
            // Shared users might not have their own minute balance, or it could be managed differently
            // For now, let's assume shared users get basic access without individual minute balances
            minutesBalance = 0; 
            totalMinutesPurchased = 0;
          }
        }
      }
    }

    // Ensure a row exists in subscribers table for all users, even if not directly subscribed
    // This helps track free generations and other user-specific data
    await supabaseService.from('subscribers').upsert({
      email: user.email,
      user_id: user.id,
      subscribed: active,
      subscription_tier: tier,
      subscription_end: endAt,
      minutes_balance: minutesBalance,
      total_minutes_purchased: totalMinutesPurchased,
      updated_at: nowIso,
    }, { onConflict: 'user_id' }); // Use user_id for conflict to ensure one entry per user

    return new Response(JSON.stringify({
      subscribed: active,
      subscription_tier: tier,
      subscription_end: endAt,
      minutes_balance: minutesBalance,
      total_minutes_purchased: totalMinutesPurchased,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[CHECK-SUBSCRIPTION] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});