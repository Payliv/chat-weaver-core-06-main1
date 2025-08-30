import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const log = (step: string, details?: unknown) => console.log(`[MONEROO-INIT] ${step}`, details ?? "");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

    try {
      log("Start");
      log("Headers", Object.fromEntries(req.headers.entries()));

      // Require auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Parse body
    const body = await req.json().catch(() => ({}));
    const planRaw = String(body?.plan || "").toLowerCase();
    const durationRaw = String(body?.duration || "monthly"); // Default to monthly
    const allowedPlans = ["starter", "pro", "business"] as const;
    const allowedDurations = ["monthly", "threeMonthly", "twelveMonthly"] as const;

    if (!allowedPlans.includes(planRaw as any)) throw new Error("Invalid plan");
    if (!allowedDurations.includes(durationRaw as any)) throw new Error("Invalid duration");

    const monerooKey = Deno.env.get("MONEROO_SECRET_KEY");
    if (!monerooKey) throw new Error("MONEROO_SECRET_KEY is not set");

    // Define plan pricing with discounts
    const planPricing = {
      starter: {
        monthly: { amount: 7500, name: "Starter (Mensuel)" },
        threeMonthly: { amount: Math.round(7500 * 3 * 0.85), name: "Starter (3 Mois)" }, // 15% discount
        twelveMonthly: { amount: Math.round(7500 * 12 * 0.70), name: "Starter (12 Mois)" }, // 30% discount
      },
      pro: {
        monthly: { amount: 22000, name: "Pro (Mensuel)" },
        threeMonthly: { amount: Math.round(22000 * 3 * 0.85), name: "Pro (3 Mois)" },
        twelveMonthly: { amount: Math.round(22000 * 12 * 0.70), name: "Pro (12 Mois)" },
      },
      business: {
        monthly: { amount: 55000, name: "Business (Mensuel)" },
        threeMonthly: { amount: Math.round(55000 * 3 * 0.85), name: "Business (3 Mois)" },
        twelveMonthly: { amount: Math.round(55000 * 12 * 0.70), name: "Business (12 Mois)" },
      }
    };

    const selectedPlan = planPricing[planRaw as keyof typeof planPricing]?.[durationRaw as keyof typeof planPricing['starter']];
    if (!selectedPlan) throw new Error("Invalid plan or duration selected");

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const returnUrl = `${origin}/billing`;

    // Call Moneroo API to initialize payment
    const monerooResponse = await fetch("https://api.moneroo.io/v1/payments/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${monerooKey}`,
        "Accept": "application/json"
      },
      body: JSON.stringify({
        amount: selectedPlan.amount,
        currency: "XOF", // Assuming XOF as currency
        description: `Abonnement ${selectedPlan.name} - Chatelix`,
        customer: {
          email: user.email,
          first_name: user.user_metadata?.first_name || "User",
          last_name: user.user_metadata?.last_name || "Chatelix"
        },
        return_url: returnUrl,
        metadata: {
          user_id: user.id,
          plan: planRaw,
          duration: durationRaw, // Add duration to metadata
          email: user.email
        }
      })
    });

    if (!monerooResponse.ok) {
      const errorText = await monerooResponse.text();
      log("Moneroo API Error", { status: monerooResponse.status, error: errorText });
      throw new Error(`Payment initialization failed: ${errorText}`);
    }

    const monerooData = await monerooResponse.json();
    log("Payment initialized", { paymentId: monerooData.data?.id, plan: planRaw, duration: durationRaw });

    return new Response(JSON.stringify({ 
      url: monerooData.data?.checkout_url,
      reference: monerooData.data?.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[MONEROO-INIT] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});