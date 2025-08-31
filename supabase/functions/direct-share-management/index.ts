// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Déclaration globale pour Deno.env.get afin de satisfaire le compilateur TypeScript
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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const log = (step: string, details?: unknown) => console.log(`[DIRECT-SHARE-MANAGEMENT] ${step}`, details ?? "");

// --- Helper Functions ---

const getSupabaseClients = () => {
  log("getSupabaseClients: Initializing service client");
  // @ts-ignore
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  // @ts-ignore
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl) log("getSupabaseClients: SUPABASE_URL is missing!");
  if (!serviceKey) log("getSupabaseClients: SUPABASE_SERVICE_ROLE_KEY is missing!");

  const supabaseService = createClient(
    supabaseUrl,
    serviceKey,
    { auth: { persistSession: false } }
  );
  
  log("getSupabaseClients: Initializing anon client");
  // @ts-ignore
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!anonKey) log("getSupabaseClients: SUPABASE_ANON_KEY is missing!");

  const supabaseAnon = createClient(
    supabaseUrl,
    anonKey
  );
  return { supabaseService, supabaseAnon };
};

const authenticateUser = async (req: Request, supabaseAnon: SupabaseClient): Promise<any> => { // Changed User to any
  log("authenticateUser: start");
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    log("authenticateUser: No authorization header provided");
    throw new Error("No authorization header provided");
  }
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
  if (error) {
    log("authenticateUser: Authentication error", error);
    throw new Error(`Authentication error: ${error.message}`);
  }
  if (!user?.email) {
    log("authenticateUser: User not authenticated or email not available");
    throw new Error("User not authenticated or email not available");
  }
  log("authenticateUser: User authenticated", { userId: user.id, email: user.email });
  return user;
};

const getSharerSubscriptionInfo = async (supabaseService: SupabaseClient, user: any) => { // Changed User to any
  log("getSharerSubscriptionInfo: start", { userId: user.id });
  const { data: subscriber, error: subError } = await supabaseService
    .from('subscribers')
    .select('subscription_tier, subscribed, subscription_end')
    .eq('user_id', user.id)
    .maybeSingle();

  if (subError) {
    log('getSharerSubscriptionInfo: Error fetching subscriber info', subError);
    return {
      subscription: null,
      shareLimit: 0,
      sharerSubscriptionEnd: null,
    };
  }

  const isSubscribed = subscriber?.subscribed ?? false;
  const tier = subscriber?.subscription_tier?.toLowerCase() ?? 'free';
  const sharerSubscriptionEnd = subscriber?.subscription_end;

  let shareLimit = 0; // Default for free tier

  if (isSubscribed) {
    if (tier.includes('pro')) {
      shareLimit = 5; // Pro can share with 5 people
    } else if (tier.includes('business')) {
      shareLimit = 20; // Business can share with 20 people
    } else if (tier.includes('enterprise')) {
      shareLimit = 999; // Effectively unlimited
    }
  }
  log("getSharerSubscriptionInfo: end", { isSubscribed, tier, shareLimit, sharerSubscriptionEnd });
  return {
    subscription: subscriber,
    shareLimit,
    sharerSubscriptionEnd,
  };
};

// --- Action Handlers ---

const handleShareSubscription = async (supabaseService: SupabaseClient, user: any, subInfo: any, body: any) => { // Changed User to any
  log("handleShareSubscription: start", { sharerUserId: user.id, targetEmail: body.targetEmail });
  const { targetEmail } = body;
  if (!targetEmail) throw new Error("Email de l l'utilisateur à partager requis");

  if (!subInfo.subscription?.subscribed || subInfo.shareLimit === 0) {
    throw new Error("Votre plan actuel ne permet pas le partage d'abonnement.");
  }

  // 1. Get target user ID
  const { data: userIdData, error: userIdError } = await supabaseService.functions.invoke('get-user-id-by-email', {
    body: { email: targetEmail.trim() }
  });

  if (userIdError || !userIdData?.userId) {
    throw new Error("L'utilisateur avec cet email n'existe pas.");
  }
  const sharedWithUserId = userIdData.userId;

  // 2. Check if target user already has an independent subscription
  const { data: targetSubInfo, error: targetSubError } = await supabaseService
    .from('subscribers')
    .select('subscribed, subscription_tier')
    .eq('user_id', sharedWithUserId)
    .maybeSingle();

  if (targetSubError) {
    log('handleShareSubscription: Error checking target user subscription', targetSubError);
    throw new Error("Erreur lors de la vérification de l'abonnement de l'utilisateur cible.");
  }

  if (targetSubInfo?.subscribed && targetSubInfo?.subscription_tier !== 'Shared') {
    throw new Error("L'utilisateur cible a déjà un abonnement actif et indépendant.");
  }

  // 3. Check share limit
  const { count: currentShares, error: sharesCountError } = await supabaseService.from('shared_access').select('id', { count: 'exact' }).eq('sharer_user_id', user.id);
  if (sharesCountError) throw sharesCountError;
  if ((currentShares || 0) >= subInfo.shareLimit) {
    throw new Error(`Limite de partage atteinte (${subInfo.shareLimit} partages maximum).`);
  }

  // 4. Insert into shared_access
  const { data: sharedAccess, error: insertError } = await supabaseService.from('shared_access').upsert({
    sharer_user_id: user.id,
    shared_with_user_id: sharedWithUserId,
    shared_with_email: targetEmail,
    status: 'active',
    expires_at: subInfo.sharerSubscriptionEnd,
  }, { onConflict: 'sharer_user_id,shared_with_user_id' }).select().single();

  if (insertError) throw insertError;

  log("handleShareSubscription: completed successfully", { sharedAccessId: sharedAccess.id });
  return { success: true, message: `Abonnement partagé avec ${targetEmail}`, sharedAccess };
};

const handleRevokeSubscription = async (supabaseService: SupabaseClient, user: any, body: any) => { // Changed User to any
  log("handleRevokeSubscription: start", { sharerUserId: user.id, targetEmail: body.targetEmail });
  const { targetEmail } = body;
  if (!targetEmail) throw new Error("Email de l'utilisateur à retirer requis");

  // 1. Get target user ID
  const { data: userIdData, error: userIdError } = await supabaseService.functions.invoke('get-user-id-by-email', {
    body: { email: targetEmail.trim() }
  });

  if (userIdError || !userIdData?.userId) {
    throw new Error("L'utilisateur avec cet email n'existe pas.");
  }
  const sharedWithUserId = userIdData.userId;

  // 2. Delete from shared_access
  const { error: deleteError } = await supabaseService.from('shared_access')
    .delete()
    .eq('sharer_user_id', user.id)
    .eq('shared_with_user_id', sharedWithUserId);

  if (deleteError) throw deleteError;

  log("handleRevokeSubscription: completed successfully");
  return { success: true, message: `Accès retiré pour ${targetEmail}` };
};

const handleGetSharedUsers = async (supabaseService: SupabaseClient, user: any, subInfo: any) => { // Changed User to any
  log("handleGetSharedUsers: start", { sharerUserId: user.id });

  const { data: sharedUsers, error: fetchError } = await supabaseService.from('shared_access')
    .select('id, shared_with_user_id, shared_with_email, status, created_at, expires_at, profiles:shared_with_user_id(display_name, avatar_url)')
    .eq('sharer_user_id', user.id);

  if (fetchError) throw fetchError;

  log("handleGetSharedUsers: completed successfully", { sharedUsersCount: sharedUsers.length });
  return { 
    success: true, 
    sharedUsers: sharedUsers || [],
    shareLimit: subInfo.shareLimit,
    sharerSubscriptionEnd: subInfo.sharerSubscriptionEnd,
    subscriptionTier: subInfo.subscription?.subscription_tier || 'Gratuit',
  };
};

// --- Main Serve Function ---

serve(async (req) => {
  log("Serve: Request received", { method: req.method, url: req.url });
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supabaseService, supabaseAnon } = getSupabaseClients();
    const user = await authenticateUser(req, supabaseAnon);
    const sharerSubscriptionInfo = await getSharerSubscriptionInfo(supabaseService, user);
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    log("Serve: Action and body received", { action, body });

    let result;
    switch (action) {
      case 'share_subscription':
        result = await handleShareSubscription(supabaseService, user, sharerSubscriptionInfo, body);
        break;
      case 'revoke_subscription':
        result = await handleRevokeSubscription(supabaseService, user, body);
        break;
      case 'get_shared_users':
        result = await handleGetSharedUsers(supabaseService, user, sharerSubscriptionInfo);
        break;
      default:
        log("Serve: Invalid action", action);
        throw new Error("Action non supportée");
    }

    log("Serve: Action completed successfully", { action, result });
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    log("Serve: ERROR during request processing", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});