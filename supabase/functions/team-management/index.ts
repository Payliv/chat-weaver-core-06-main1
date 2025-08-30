/// <reference lib="deno.ns" />
/// <reference types="https://deno.land/std@0.190.0/http/server.ts" />
/// <reference types="https://esm.sh/@supabase/supabase-js@2.45.0" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const log = (step: string, details?: unknown) => console.log(`[TEAM-MANAGEMENT] ${step}`, details ?? "");

// --- Helper Functions ---

const getSupabaseClients = () => {
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  return { supabaseService, supabaseAnon };
};

const authenticateUser = async (req: Request, supabaseAnon: SupabaseClient): Promise<User> => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("No authorization header provided");
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
  if (error) throw new Error(`Authentication error: ${error.message}`);
  if (!user?.email) throw new Error("User not authenticated or email not available");
  return user;
};

const getSubscriptionInfo = async (supabaseService: SupabaseClient, user: User) => {
  const { data: subscription } = await supabaseService
    .from('subscribers')
    .select('subscription_tier, subscribed')
    .eq('email', user.email)
    .single();

  const getTeamLimit = (tier: string | null, subscribed: boolean) => {
    if (!subscribed || !tier) return 1;
    if (tier.toLowerCase().includes('pro')) return 5;
    if (tier.toLowerCase().includes('business')) return 20;
    if (tier.toLowerCase().includes('enterprise')) return 999;
    return 1;
  };

  const getMaxTeams = (tier: string | null, subscribed: boolean) => {
    if (!subscribed || !tier) return 1;
    if (tier.toLowerCase().includes('pro')) return 5;
    if (tier.toLowerCase().includes('business')) return 20;
    if (tier.toLowerCase().includes('enterprise')) return 999;
    return 1;
  };

  return {
    subscription,
    teamLimit: getTeamLimit(subscription?.subscription_tier, subscription?.subscribed),
    maxTeams: getMaxTeams(subscription?.subscription_tier, subscription?.subscribed),
  };
};

const logTeamActivity = async (supabaseService: SupabaseClient, action: string, teamId: string, adminUserId: string, details: any = {}) => {
  try {
    await supabaseService.rpc('log_team_activity', {
      p_action: action, p_team_id: teamId, p_admin_user_id: adminUserId,
      p_target_type: 'team', p_target_id: teamId, p_details: details
    });
  } catch (error) {
    console.error('Failed to log team activity:', error);
  }
};

const sendInvitationEmail = async (email: string, teamName: string, inviterName: string, inviteUrl: string) => {
  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-invitation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
    },
    body: JSON.stringify({ email, teamName, inviterName, inviteUrl })
  });
  if (!response.ok) throw new Error(`Failed to send email: ${response.statusText}`);
  return await response.json();
};

// --- Action Handlers ---

const handleCreateTeam = async (supabaseService: SupabaseClient, user: User, subInfo: any, body: any) => {
  const teamName = body.teamName || 'Mon Équipe'; // Use default if not provided
  const { data: existingTeams } = await supabaseService.from('teams').select('id', { count: 'exact' }).eq('owner_id', user.id);
  if ((existingTeams?.length || 0) >= subInfo.maxTeams) throw new Error(`Limite d'équipes atteinte (${subInfo.maxTeams}).`);

  const { data: team, error } = await supabaseService.from('teams').insert({ name: teamName, owner_id: user.id }).select().single();
  if (error) throw error;

  await logTeamActivity(supabaseService, 'create_team', team.id, user.id, { team_name: teamName });
  return { success: true, team };
};

const handleInviteMember = async (supabaseService: SupabaseClient, user: User, subInfo: any, body: any, origin: string) => {
  const { teamId, memberEmail } = body;
  if (!teamId || !memberEmail) throw new Error("Team ID et email du membre requis");

  const { data: team } = await supabaseService.from('teams').select('id, name').eq('id', teamId).eq('owner_id', user.id).single();
  if (!team) throw new Error("Équipe non trouvée ou vous n'êtes pas le propriétaire");

  const { count: currentMembers } = await supabaseService.from('team_members').select('id', { count: 'exact' }).eq('team_id', teamId);
  const { count: pendingInvitations } = await supabaseService.from('team_invitations').select('id', { count: 'exact' }).eq('team_id', teamId).eq('status', 'pending');
  if ((currentMembers || 0) + (pendingInvitations || 0) >= subInfo.teamLimit) throw new Error(`Limite d'équipe atteinte (${subInfo.teamLimit} membres maximum)`);

  const { data: inviterProfile } = await supabaseService.from('profiles').select('display_name').eq('user_id', user.id).maybeSingle();
  const inviterName = inviterProfile?.display_name || user.email;

  const { data: invitation, error } = await supabaseService.from('team_invitations').upsert({
    team_id: teamId, email: memberEmail, invited_by: user.id, role: 'member', status: 'pending',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }, { onConflict: 'team_id,email' }).select().single();
  if (error) throw error;

  const inviteUrl = `${origin}/team/accept-invitation?token=${invitation.id}&email=${encodeURIComponent(memberEmail)}`;
  await sendInvitationEmail(memberEmail, team.name, inviterName, inviteUrl);
  await logTeamActivity(supabaseService, 'invite_member', teamId, user.id, { invited_email: memberEmail });

  return { success: true, message: "Invitation envoyée", invitation };
};

const handleAcceptInvitation = async (supabaseService: SupabaseClient, user: User, body: any) => {
    const { invitationId } = body;
    if (!invitationId) throw new Error("ID d'invitation requis");

    const { data: invitation, error: inviteError } = await supabaseService.from('team_invitations').select('*, teams(name)').eq('id', invitationId).eq('email', user.email).eq('status', 'pending').single();
    if (inviteError || !invitation) throw new Error("Invitation non trouvée ou expirée");
    if (new Date(invitation.expires_at) < new Date()) {
        await supabaseService.from('team_invitations').update({ status: 'expired' }).eq('id', invitationId);
        throw new Error("Cette invitation a expiré");
    }

    const { error: memberError } = await supabaseService.from('team_members').insert({ team_id: invitation.team_id, user_id: user.id, role: invitation.role });
    if (memberError) throw memberError;

    await supabaseService.from('team_invitations').update({ status: 'accepted' }).eq('id', invitationId);
    await logTeamActivity(supabaseService, 'accept_invitation', invitation.team_id, user.id, { team_name: invitation.teams?.name });

    return { success: true, message: `Vous avez rejoint l'équipe ${invitation.teams?.name}`, teamId: invitation.team_id };
};

const handleGetTeams = async (supabaseService: SupabaseClient, user: User, subInfo: any) => {
    const { data: ownedTeams } = await supabaseService.from('teams').select('id, name, created_at, team_members(id, role, user_id, profiles:user_id(display_name, avatar_url))').eq('owner_id', user.id);
    const { data: memberTeams } = await supabaseService.from('team_members').select('role, teams(id, name, created_at, owner_id, team_members(id, role, user_id, profiles:user_id(display_name, avatar_url)))').eq('user_id', user.id);
    
    const ownedTeamIds = ownedTeams?.map(t => t.id) || [];
    const { data: pendingInvitations } = ownedTeamIds.length > 0 ? await supabaseService.from('team_invitations').select('*').in('team_id', ownedTeamIds).eq('status', 'pending') : { data: [] };

    const allTeams = [
        ...(ownedTeams || []).map(team => ({ ...team, isOwner: true, pendingInvitations: pendingInvitations?.filter(inv => inv.team_id === team.id) || [] })),
        ...(memberTeams || []).map(m => ({ ...m.teams, isOwner: false, userRole: m.role, pendingInvitations: [] }))
    ];

    return { success: true, teams: allTeams, teamLimit: subInfo.teamLimit, subscription: subInfo.subscription?.subscription_tier || 'Gratuit' };
};

const handleRemoveMember = async (supabaseService: SupabaseClient, user: User, body: any) => {
  const { teamId, memberId } = body;
  if (!teamId || !memberId) throw new Error("Team ID et ID du membre requis");

  const { data: team } = await supabaseService.from('teams').select('id, name').eq('id', teamId).eq('owner_id', user.id).single();
  if (!team) throw new Error("Équipe non trouvée ou vous n'êtes pas le propriétaire");

  const { data: member } = await supabaseService.from('team_members').select('user_id, profiles:user_id(display_name)').eq('id', memberId).eq('team_id', teamId).single();

  const { error } = await supabaseService.from('team_members').delete().eq('id', memberId).eq('team_id', teamId);
  if (error) throw error;

  await logTeamActivity(supabaseService, 'remove_member', teamId, user.id, {
    removed_user_id: member?.user_id,
    removed_user_name: member?.profiles?.display_name,
    team_name: team.name
  });

  return { success: true, message: "Membre supprimé" };
};

const handleCancelInvitation = async (supabaseService: SupabaseClient, user: User, body: any) => {
  const { invitationId } = body;
  if (!invitationId) throw new Error("ID d'invitation requis");

  const { data: invitation } = await supabaseService.from('team_invitations').select('team_id, email, teams(name)').eq('id', invitationId).single();
  if (!invitation) throw new Error("Invitation non trouvée");

  const { data: team } = await supabaseService.from('teams').select('id').eq('id', invitation.team_id).eq('owner_id', user.id).single();
  if (!team) throw new Error("Vous n'êtes pas le propriétaire de cette équipe");

  const { error } = await supabaseService.from('team_invitations').delete().eq('id', invitationId);
  if (error) throw error;

  await logTeamActivity(supabaseService, 'cancel_invitation', invitation.team_id, user.id, {
    cancelled_email: invitation.email,
    team_name: invitation.teams?.name,
    invitation_id: invitationId
  });

  return { success: true, message: "Invitation annulée" };
};

const handleGetTeamHistory = async (supabaseService: SupabaseClient, user: User, body: any) => {
  const { teamId } = body;
  if (!teamId) throw new Error("Team ID requis");

  const { data: teamAccess } = await supabaseService.from('teams').select('id, owner_id').eq('id', teamId).single();
  if (!teamAccess) throw new Error("Équipe non trouvée");

  const isOwner = teamAccess.owner_id === user.id;
  if (!isOwner) {
    const { data: membership } = await supabaseService.from('team_members').select('id').eq('team_id', teamId).eq('user_id', user.id).maybeSingle();
    if (!membership) throw new Error("Accès refusé - vous n'êtes pas membre de cette équipe");
  }

  const { data: history } = await supabaseService.from('admin_logs').select('id, action, created_at, details').eq('details->>team_id', teamId).order('created_at', { ascending: false }).limit(50);

  return { success: true, history: history || [] };
};

// --- Main Serve Function ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supabaseService, supabaseAnon } = getSupabaseClients();
    const user = await authenticateUser(req, supabaseAnon);
    const subscriptionInfo = await getSubscriptionInfo(supabaseService, user);
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const origin = req.headers.get("origin") || "https://000c91c6-f980-4359-901b-7034686d3ba2.lovableproject.com";

    let result;
    switch (action) {
      case 'create_team':
        result = await handleCreateTeam(supabaseService, user, subscriptionInfo, body);
        break;
      case 'invite_member':
        result = await handleInviteMember(supabaseService, user, subscriptionInfo, body, origin);
        break;
      case 'accept_invitation':
        result = await handleAcceptInvitation(supabaseService, user, body);
        break;
      case 'get_teams':
        result = await handleGetTeams(supabaseService, user, subscriptionInfo);
        break;
      case 'remove_member':
        result = await handleRemoveMember(supabaseService, user, body);
        break;
      case 'cancel_invitation':
        result = await handleCancelInvitation(supabaseService, user, body);
        break;
      case 'get_team_history':
        result = await handleGetTeamHistory(supabaseService, user, body);
        break;
      default:
        throw new Error("Action non supportée");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    log("ERROR", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});