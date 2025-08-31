// Déclaration globale de l'objet Deno pour la reconnaissance TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const log = (step: string, details?: unknown) => console.log(`[TEAM-MANAGEMENT] ${step}`, details ?? "");

// --- Helper Functions ---

const getSupabaseClients = () => {
  log("getSupabaseClients: Initializing service client");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl) log("getSupabaseClients: SUPABASE_URL is missing!");
  if (!serviceKey) log("getSupabaseClients: SUPABASE_SERVICE_ROLE_KEY is missing!");

  const supabaseService = createClient(
    supabaseUrl,
    serviceKey,
    { auth: { persistSession: false } }
  );
  
  log("getSupabaseClients: Initializing anon client");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!anonKey) log("getSupabaseClients: SUPABASE_ANON_KEY is missing!");

  const supabaseAnon = createClient(
    supabaseUrl,
    anonKey
  );
  return { supabaseService, supabaseAnon };
};

const authenticateUser = async (req: Request, supabaseAnon: SupabaseClient): Promise<User> => {
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

const getSubscriptionInfo = async (supabaseService: SupabaseClient, user: User) => {
  log("getSubscriptionInfo: start", { userId: user.id });
  const { data: subscriber, error: subError } = await supabaseService
    .from('subscribers')
    .select('subscription_tier, subscribed')
    .eq('user_id', user.id)
    .maybeSingle();

  if (subError) {
    log('getSubscriptionInfo: Error fetching subscriber info', subError);
    return {
      subscription: null,
      teamLimit: 1,
      maxTeams: 1,
    };
  }

  const isSubscribed = subscriber?.subscribed ?? false;
  const tier = subscriber?.subscription_tier?.toLowerCase() ?? 'free';

  let teamLimit = 1; // Default for free tier
  let maxTeams = 1; // Default for free tier

  if (isSubscribed) {
    if (tier.includes('pro')) {
      teamLimit = 5;
      maxTeams = 5;
    } else if (tier.includes('business')) {
      teamLimit = 20;
      maxTeams = 20;
    } else if (tier.includes('enterprise')) {
      teamLimit = 999; // Effectively unlimited
      maxTeams = 999; // Effectively unlimited
    }
  }
  log("getSubscriptionInfo: end", { isSubscribed, tier, teamLimit, maxTeams });
  return {
    subscription: subscriber,
    teamLimit,
    maxTeams,
  };
};

const logTeamActivity = async (supabaseService: SupabaseClient, action: string, teamId: string, adminUserId: string, details: any = {}) => {
  log("logTeamActivity: start", { action, teamId, adminUserId, details });
  try {
    const { error } = await supabaseService.rpc('log_team_activity', {
      p_action: action, p_team_id: teamId, p_admin_user_id: adminUserId,
      p_target_type: 'team', p_target_id: teamId, p_details: details
    });
    if (error) {
      log('logTeamActivity: Failed to log team activity (RPC error)', error);
    } else {
      log('logTeamActivity: Activity logged successfully');
    }
  } catch (error) {
    log('logTeamActivity: Failed to log team activity (catch error)', error);
  }
};

const sendInvitationEmail = async (email: string, teamName: string, inviterName: string, inviteUrl: string) => {
  log("sendInvitationEmail: start", { email, teamName, inviterName, inviteUrl });
  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-invitation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
    },
    body: JSON.stringify({ email, teamName, inviterName, inviteUrl })
  });
  if (!response.ok) {
    const errorText = await response.text();
    log(`sendInvitationEmail: Failed to send email (${response.status})`, errorText);
    throw new Error(`Failed to send email: ${response.statusText}`);
  }
  log("sendInvitationEmail: Email sent successfully");
  return await response.json();
};

// --- Action Handlers ---

const handleCreateTeam = async (supabaseService: SupabaseClient, user: User, subInfo: any, body: any) => {
  log("handleCreateTeam: start", { userId: user.id, teamNameBody: body.teamName });
  const teamName = body.teamName || 'Mon Équipe';
  
  log("handleCreateTeam: checking existing teams limit", { ownerId: user.id, maxTeams: subInfo.maxTeams });
  const { data: existingTeams, error: existingTeamsError } = await supabaseService.from('teams').select('id', { count: 'exact' }).eq('owner_id', user.id);
  if (existingTeamsError) {
    log("handleCreateTeam: error fetching existing teams", existingTeamsError);
    throw existingTeamsError;
  }
  if ((existingTeams?.length || 0) >= subInfo.maxTeams) {
    log("handleCreateTeam: team limit reached", { current: existingTeams?.length, max: subInfo.maxTeams });
    throw new Error(`Limite d'équipes atteinte (${subInfo.maxTeams}).`);
  }

  log("handleCreateTeam: inserting new team", { name: teamName, owner_id: user.id });
  const { data: team, error: insertTeamError } = await supabaseService.from('teams').insert({ name: teamName, owner_id: user.id }).select().single();
  if (insertTeamError) {
    log("handleCreateTeam: error inserting team", insertTeamError);
    throw insertTeamError;
  }
  if (!team) {
    log("handleCreateTeam: no team returned after insert");
    throw new Error("Failed to create team: no data returned.");
  }

  log("handleCreateTeam: logging activity", { teamId: team.id, userId: user.id, teamName });
  await logTeamActivity(supabaseService, 'create_team', team.id, user.id, { team_name: teamName });
  
  log("handleCreateTeam: completed successfully", { teamId: team.id });
  return { success: true, team };
};

const handleInviteMember = async (supabaseService: SupabaseClient, user: User, subInfo: any, body: any, origin: string) => {
  log("handleInviteMember: start", { userId: user.id, teamId: body.teamId, memberEmail: body.memberEmail });
  const { teamId, memberEmail } = body;
  if (!teamId || !memberEmail) throw new Error("Team ID et email du membre requis");

  const { data: team, error: teamError } = await supabaseService.from('teams').select('id, name').eq('id', teamId).eq('owner_id', user.id).single();
  if (teamError) {
    log("handleInviteMember: error fetching team or user is not owner", teamError);
    throw new Error("Équipe non trouvée ou vous n'êtes pas le propriétaire");
  }
  if (!team) {
    log("handleInviteMember: team not found or user is not owner");
    throw new Error("Équipe non trouvée ou vous n'êtes pas le propriétaire");
  }

  const { count: currentMembers, error: membersCountError } = await supabaseService.from('team_members').select('id', { count: 'exact' }).eq('team_id', teamId);
  if (membersCountError) {
    log("handleInviteMember: error counting current members", membersCountError);
    throw membersCountError;
  }
  const { count: pendingInvitations, error: pendingCountError } = await supabaseService.from('team_invitations').select('id', { count: 'exact' }).eq('team_id', teamId).eq('status', 'pending');
  if (pendingCountError) {
    log("handleInviteMember: error counting pending invitations", pendingCountError);
    throw pendingCountError;
  }
  if ((currentMembers || 0) + (pendingInvitations || 0) >= subInfo.teamLimit) {
    log("handleInviteMember: team member limit reached", { current: currentMembers, pending: pendingInvitations, limit: subInfo.teamLimit });
    throw new Error(`Limite d'équipe atteinte (${subInfo.teamLimit} membres maximum)`);
  }

  const { data: inviterProfile, error: profileError } = await supabaseService.from('profiles').select('display_name').eq('user_id', user.id).maybeSingle();
  if (profileError) log("handleInviteMember: error fetching inviter profile", profileError);
  const inviterName = inviterProfile?.display_name || user.email;

  log("handleInviteMember: upserting invitation", { teamId, memberEmail, invitedBy: user.id });
  const { data: invitation, error: upsertError } = await supabaseService.from('team_invitations').upsert({
    team_id: teamId, email: memberEmail, invited_by: user.id, role: 'member', status: 'pending',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }, { onConflict: 'team_id,email' }).select().single();
  if (upsertError) {
    log("handleInviteMember: error upserting invitation", upsertError);
    throw upsertError;
  }
  if (!invitation) {
    log("handleInviteMember: no invitation returned after upsert");
    throw new Error("Failed to create or update invitation.");
  }

  const inviteUrl = `${origin}/team/accept-invitation?token=${invitation.id}&email=${encodeURIComponent(memberEmail)}`;
  await sendInvitationEmail(memberEmail, team.name, inviterName, inviteUrl);
  await logTeamActivity(supabaseService, 'invite_member', teamId, user.id, { invited_email: memberEmail });

  log("handleInviteMember: completed successfully", { invitationId: invitation.id });
  return { success: true, message: "Invitation envoyée", invitation };
};

const handleAcceptInvitation = async (supabaseService: SupabaseClient, user: User, body: any) => {
    log("handleAcceptInvitation: start", { userId: user.id, invitationId: body.invitationId });
    const { invitationId } = body;
    if (!invitationId) throw new Error("ID d'invitation requis");

    const { data: invitation, error: inviteError } = await supabaseService.from('team_invitations').select('*, teams(name)').eq('id', invitationId).eq('email', user.email).eq('status', 'pending').single();
    if (inviteError || !invitation) {
      log("handleAcceptInvitation: invitation not found or not pending", inviteError);
      throw new Error("Invitation non trouvée ou expirée");
    }
    if (new Date(invitation.expires_at) < new Date()) {
        await supabaseService.from('team_invitations').update({ status: 'expired' }).eq('id', invitationId);
        log("handleAcceptInvitation: invitation expired");
        throw new Error("Cette invitation a expiré");
    }

    log("handleAcceptInvitation: inserting team member", { teamId: invitation.team_id, userId: user.id, role: invitation.role });
    const { error: memberError } = await supabaseService.from('team_members').insert({ team_id: invitation.team_id, user_id: user.id, role: invitation.role });
    if (memberError) {
      log("handleAcceptInvitation: error inserting team member", memberError);
      throw memberError;
    }

    log("handleAcceptInvitation: updating invitation status to accepted", { invitationId });
    await supabaseService.from('team_invitations').update({ status: 'accepted' }).eq('id', invitationId);
    await logTeamActivity(supabaseService, 'accept_invitation', invitation.team_id, user.id, { team_name: invitation.teams?.name });

    log("handleAcceptInvitation: completed successfully", { teamId: invitation.team_id });
    return { success: true, message: `Vous avez rejoint l'équipe ${invitation.teams?.name}`, teamId: invitation.team_id };
};

const handleGetTeams = async (supabaseService: SupabaseClient, user: User, subInfo: any) => {
    log("handleGetTeams: start", { userId: user.id });
    const { data: ownedTeams, error: ownedTeamsError } = await supabaseService.from('teams').select('id, name, created_at, team_members(id, role, user_id, profiles:user_id(display_name, avatar_url))').eq('owner_id', user.id);
    if (ownedTeamsError) log("handleGetTeams: error fetching owned teams", ownedTeamsError);

    const { data: memberTeams, error: memberTeamsError } = await supabaseService.from('team_members').select('role, teams(id, name, created_at, owner_id, team_members(id, role, user_id, profiles:user_id(display_name, avatar_url)))').eq('user_id', user.id);
    if (memberTeamsError) log("handleGetTeams: error fetching member teams", memberTeamsError);
    
    const ownedTeamIds = ownedTeams?.map(t => t.id) || [];
    const { data: pendingInvitations, error: pendingInvitationsError } = ownedTeamIds.length > 0 ? await supabaseService.from('team_invitations').select('*').in('team_id', ownedTeamIds).eq('status', 'pending') : { data: [] };
    if (pendingInvitationsError) log("handleGetTeams: error fetching pending invitations", pendingInvitationsError);

    const allTeams = [
        ...(ownedTeams || []).map(team => ({ ...team, isOwner: true, pendingInvitations: pendingInvitations?.filter(inv => inv.team_id === team.id) || [] })),
        ...(memberTeams || []).map(m => ({ ...m.teams, isOwner: false, userRole: m.role, pendingInvitations: [] }))
    ];
    log("handleGetTeams: end", { teamsCount: allTeams.length, teamLimit: subInfo.teamLimit });
    return { success: true, teams: allTeams, teamLimit: subInfo.teamLimit, subscription: subInfo.subscription?.subscription_tier || 'Gratuit' };
};

const handleRemoveMember = async (supabaseService: SupabaseClient, user: User, body: any) => {
  log("handleRemoveMember: start", { userId: user.id, teamId: body.teamId, memberId: body.memberId });
  const { teamId, memberId } = body;
  if (!teamId || !memberId) throw new Error("Team ID et ID du membre requis");

  const { data: team, error: teamError } = await supabaseService.from('teams').select('id, name').eq('id', teamId).eq('owner_id', user.id).single();
  if (teamError) {
    log("handleRemoveMember: error fetching team or user is not owner", teamError);
    throw new Error("Équipe non trouvée ou vous n'êtes pas le propriétaire");
  }
  if (!team) {
    log("handleRemoveMember: team not found or user is not owner");
    throw new Error("Équipe non trouvée ou vous n'êtes pas le propriétaire");
  }

  const { data: member, error: memberError } = await supabaseService.from('team_members').select('user_id, profiles:user_id(display_name)').eq('id', memberId).eq('team_id', teamId).single();
  if (memberError) {
    log("handleRemoveMember: error fetching member to remove", memberError);
    throw memberError;
  }
  if (!member) {
    log("handleRemoveMember: member not found");
    throw new Error("Membre non trouvé.");
  }

  log("handleRemoveMember: deleting team member", { memberId, teamId });
  const { error: deleteError } = await supabaseService.from('team_members').delete().eq('id', memberId).eq('team_id', teamId);
  if (deleteError) {
    log("handleRemoveMember: error deleting team member", deleteError);
    throw deleteError;
  }

  await logTeamActivity(supabaseService, 'remove_member', teamId, user.id, {
    removed_user_id: member?.user_id,
    removed_user_name: member?.profiles?.display_name,
    team_name: team.name
  });

  log("handleRemoveMember: completed successfully");
  return { success: true, message: "Membre supprimé" };
};

const handleCancelInvitation = async (supabaseService: SupabaseClient, user: User, body: any) => {
  log("handleCancelInvitation: start", { userId: user.id, invitationId: body.invitationId });
  const { invitationId } = body;
  if (!invitationId) throw new Error("ID d'invitation requis");

  const { data: invitation, error: inviteError } = await supabaseService.from('team_invitations').select('team_id, email, teams(name)').eq('id', invitationId).single();
  if (inviteError) {
    log("handleCancelInvitation: error fetching invitation", inviteError);
    throw new Error("Invitation non trouvée");
  }
  if (!invitation) {
    log("handleCancelInvitation: invitation not found");
    throw new Error("Invitation non trouvée");
  }

  const { data: team, error: teamError } = await supabaseService.from('teams').select('id').eq('id', invitation.team_id).eq('owner_id', user.id).single();
  if (teamError) {
    log("handleCancelInvitation: error fetching team or user is not owner", teamError);
    throw new Error("Vous n'êtes pas le propriétaire de cette équipe");
  }
  if (!team) {
    log("handleCancelInvitation: team not found or user is not owner");
    throw new Error("Vous n'êtes pas le propriétaire de cette équipe");
  }

  log("handleCancelInvitation: deleting invitation", { invitationId });
  const { error: deleteError } = await supabaseService.from('team_invitations').delete().eq('id', invitationId);
  if (deleteError) {
    log("handleCancelInvitation: error deleting invitation", deleteError);
    throw deleteError;
  }

  await logTeamActivity(supabaseService, 'cancel_invitation', invitation.team_id, user.id, {
    cancelled_email: invitation.email,
    team_name: invitation.teams?.name,
    invitation_id: invitationId
  });

  log("handleCancelInvitation: completed successfully");
  return { success: true, message: "Invitation annulée" };
};

const handleGetTeamHistory = async (supabaseService: SupabaseClient, user: User, body: any) => {
  log("handleGetTeamHistory: start", { userId: user.id, teamId: body.teamId });
  const { teamId } = body;
  if (!teamId) throw new Error("Team ID requis");

  const { data: teamAccess, error: teamAccessError } = await supabaseService.from('teams').select('id, owner_id').eq('id', teamId).single();
  if (teamAccessError) {
    log("handleGetTeamHistory: error fetching team access", teamAccessError);
    throw new Error("Équipe non trouvée");
  }
  if (!teamAccess) {
    log("handleGetTeamHistory: team not found");
    throw new Error("Équipe non trouvée");
  }

  const isOwner = teamAccess.owner_id === user.id;
  if (!isOwner) {
    const { data: membership, error: membershipError } = await supabaseService.from('team_members').select('id').eq('team_id', teamId).eq('user_id', user.id).maybeSingle();
    if (membershipError) log("handleGetTeamHistory: error fetching membership", membershipError);
    if (!membership) {
      log("handleGetTeamHistory: access denied - user is not owner or member");
      throw new Error("Accès refusé - vous n'êtes pas membre de cette équipe");
    }
  }

  const { data: history, error: historyError } = await supabaseService.from('admin_logs').select('id, action, created_at, details').eq('details->>team_id', teamId).order('created_at', { ascending: false }).limit(50);
  if (historyError) {
    log("handleGetTeamHistory: error fetching history", historyError);
    throw historyError;
  }

  log("handleGetTeamHistory: completed successfully", { historyCount: history?.length });
  return { success: true, history: history || [] };
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
    const subscriptionInfo = await getSubscriptionInfo(supabaseService, user);
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const origin = req.headers.get("origin") || "https://000c91c6-f980-4359-901b-7034686d3ba2.lovableproject.com"; // Fallback origin

    log("Serve: Action and body received", { action, body });

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