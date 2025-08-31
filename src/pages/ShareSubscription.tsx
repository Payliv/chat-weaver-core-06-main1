import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Mail, Clock, Loader2, CheckCircle, XCircle, RefreshCw, Crown, Shield, UserPlus, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { TeamMember, PendingInvitation, Team } from '@/components/team/types';
import { TeamCard } from '@/components/team/TeamCard'; // Import TeamCard

interface TeamData {
  teams: Team[];
  teamLimit: number;
  subscription: string;
}

type MemberStatus = 'not_found' | 'not_member' | 'invited' | 'member_of_this_team' | 'member_of_other_team';

export default function ShareSubscription() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [teamLimit, setTeamLimit] = useState(1);
  const [subscriptionTier, setSubscriptionTier] = useState('Gratuit');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [memberStatus, setMemberStatus] = useState<MemberStatus>('not_found');
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetInvitationId, setTargetInvitationId] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        navigate('/auth');
        return;
      }
      setUser(authUser);

      const { data, error } = await supabase.functions.invoke('team-management', { body: { action: 'get_teams' } });
      if (error) throw new Error(error.message || 'Erreur chargement des équipes');
      
      const teamData: TeamData = data;
      setUserTeams(teamData.teams || []);
      setTeamLimit(teamData.teamLimit || 1);
      setSubscriptionTier(teamData.subscription || 'Gratuit');

      // Select the first owned team by default
      const firstOwnedTeam = (teamData.teams || []).find(t => t.isOwner);
      if (firstOwnedTeam) {
        setSelectedTeam(firstOwnedTeam);
      } else if (teamData.teams.length > 0) {
        // If no owned team, select the first team the user is a member of
        setSelectedTeam(teamData.teams[0]);
      }

    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const checkMemberStatus = useCallback(async () => {
    if (!inviteEmail.trim() || !selectedTeam) {
      setMemberStatus('not_found');
      setTargetUserId(null);
      setTargetInvitationId(null);
      return;
    }

    // 1. Check if email exists as a user
    const { data: userIdData, error: userIdError } = await supabase.functions.invoke('get-user-id-by-email', {
      body: { email: inviteEmail.trim() }
    });

    if (userIdError || !userIdData?.userId) {
      setMemberStatus('not_found');
      setTargetUserId(null);
      setTargetInvitationId(null);
      return;
    }

    const foundUserId = userIdData.userId;
    setTargetUserId(foundUserId);

    // 2. Check if user is already a member of THIS team
    const isMemberOfThisTeam = selectedTeam.team_members.some(member => member.user_id === foundUserId);
    if (isMemberOfThisTeam) {
      setMemberStatus('member_of_this_team');
      setTargetInvitationId(null);
      return;
    }

    // 3. Check if user has a pending invitation for THIS team
    const pendingInvite = selectedTeam.pendingInvitations.find(inv => inv.email === inviteEmail.trim());
    if (pendingInvite) {
      setMemberStatus('invited');
      setTargetInvitationId(pendingInvite.id);
      return;
    }

    // 4. Check if user is a member of ANY other team (optional, but good for context)
    const isMemberOfOtherTeam = userTeams.some(team => 
      team.id !== selectedTeam.id && team.team_members.some(member => member.user_id === foundUserId)
    );
    if (isMemberOfOtherTeam) {
      setMemberStatus('member_of_other_team');
      setTargetInvitationId(null);
      return;
    }

    setMemberStatus('not_member'); // User exists but is not a member/invited to this team
    setTargetInvitationId(null);

  }, [inviteEmail, selectedTeam, userTeams]);

  useEffect(() => {
    const handler = setTimeout(() => {
      checkMemberStatus();
    }, 500); // Debounce for 500ms
    return () => clearTimeout(handler);
  }, [inviteEmail, checkMemberStatus]);

  const handleShareSubscription = async () => {
    if (!selectedTeam || !inviteEmail.trim()) return;

    setProcessingAction(true);
    try {
      const { error } = await supabase.functions.invoke('team-management', { 
        body: { action: 'invite_member', teamId: selectedTeam.id, memberEmail: inviteEmail.trim() } 
      });
      if (error) throw new Error(error.message);
      toast({ title: "Invitation envoyée", description: `Invitation envoyée à ${inviteEmail.trim()}.` });
      setInviteEmail('');
      await loadUserData(); // Refresh data
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRemoveAccess = async () => {
    if (!selectedTeam || !targetUserId) return;

    setProcessingAction(true);
    try {
      // If user has a pending invitation, cancel it
      if (memberStatus === 'invited' && targetInvitationId) {
        const { error } = await supabase.functions.invoke('team-management', { 
          body: { action: 'cancel_invitation', invitationId: targetInvitationId } 
        });
        if (error) throw new Error(error.message);
        toast({ title: "Invitation annulée", description: `L'invitation pour ${inviteEmail.trim()} a été annulée.` });
      } 
      // If user is a member, remove them
      else if (memberStatus === 'member_of_this_team') {
        const memberToRemove = selectedTeam.team_members.find(m => m.user_id === targetUserId);
        if (!memberToRemove) throw new Error("Membre non trouvé dans l'équipe.");
        
        const { error } = await supabase.functions.invoke('team-management', { 
          body: { action: 'remove_member', teamId: selectedTeam.id, memberId: memberToRemove.id } 
        });
        if (error) throw new Error(error.message);
        toast({ title: "Accès retiré", description: `L'accès de ${inviteEmail.trim()} a été retiré.` });
      } else {
        throw new Error("Action de suppression non valide pour cet utilisateur.");
      }
      
      setInviteEmail('');
      await loadUserData(); // Refresh data
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setProcessingAction(false);
    }
  };

  const isProOrBusiness = subscriptionTier.toLowerCase().includes('pro') || subscriptionTier.toLowerCase().includes('business') || subscriptionTier.toLowerCase().includes('enterprise');
  const canInviteMore = selectedTeam && selectedTeam.isOwner && isProOrBusiness && (selectedTeam.team_members.length + selectedTeam.pendingInvitations.length < teamLimit);

  const getActionButton = () => {
    if (!selectedTeam || !selectedTeam.isOwner || !isProOrBusiness) {
      return (
        <Button disabled className="w-full">
          <Shield className="w-4 h-4 mr-2" /> Mettre à niveau pour partager
        </Button>
      );
    }

    switch (memberStatus) {
      case 'not_found':
        return (
          <Button disabled className="w-full">
            <XCircle className="w-4 h-4 mr-2" /> Utilisateur non trouvé
          </Button>
        );
      case 'not_member':
        return (
          <Button 
            onClick={handleShareSubscription} 
            disabled={processingAction || !canInviteMore || !inviteEmail.trim()}
            className="w-full"
          >
            {processingAction ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
            {processingAction ? 'Envoi...' : 'Partager l\'abonnement'}
          </Button>
        );
      case 'invited':
        return (
          <Button 
            onClick={handleRemoveAccess} 
            disabled={processingAction}
            variant="destructive"
            className="w-full"
          >
            {processingAction ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserX className="w-4 h-4 mr-2" />}
            {processingAction ? 'Annulation...' : 'Annuler l\'invitation'}
          </Button>
        );
      case 'member_of_this_team':
        return (
          <Button 
            onClick={handleRemoveAccess} 
            disabled={processingAction}
            variant="destructive"
            className="w-full"
          >
            {processingAction ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserX className="w-4 h-4 mr-2" />}
            {processingAction ? 'Retrait...' : 'Retirer l\'accès'}
          </Button>
        );
      case 'member_of_other_team':
        return (
          <Button disabled className="w-full">
            <Users className="w-4 h-4 mr-2" /> Déjà membre d'une autre équipe
          </Button>
        );
      default:
        return (
          <Button disabled className="w-full">
            <Mail className="w-4 h-4 mr-2" /> Entrez un email
          </Button>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Chargement des informations d'abonnement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/app")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Partager l'abonnement</h1>
                  <p className="text-sm text-muted-foreground">
                    Plan {subscriptionTier} - Partagez l'accès avec votre équipe.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadUserData} disabled={loading || processingAction} className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading || processingAction ? 'animate-spin' : ''}`} /> Actualiser
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-6 py-8">
        {!isProOrBusiness ? (
          <Card className="p-6 mb-6 bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20">
            <CardContent className="p-0 flex items-center gap-4">
              <div className="p-3 rounded-full bg-secondary/10"><Shield className="h-6 w-6 text-secondary" /></div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">Débloquez la collaboration d'équipe</h2>
                <p className="text-muted-foreground">Passez au plan Pro ou supérieur pour inviter des membres et partager votre abonnement.</p>
              </div>
              <Button onClick={() => navigate("/billing")} variant="default">Mettre à niveau</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {userTeams.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent className="p-0">
                  <div className="p-4 mx-auto w-fit rounded-full bg-muted/50 mb-4"><Users className="h-8 w-8 text-muted-foreground" /></div>
                  <h3 className="text-lg font-semibold mb-2">Aucune équipe trouvée</h3>
                  <p className="text-muted-foreground mb-4">
                    Vous devez être propriétaire d'une équipe pour inviter des membres.
                    Veuillez créer une équipe via la page "Équipe" si vous n'en avez pas.
                  </p>
                  <Button onClick={() => navigate('/team')} variant="outline">Aller à la gestion d'équipe</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-6">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Votre équipe : {selectedTeam?.name}
                  </CardTitle>
                  <CardDescription>
                    Invitez des membres à rejoindre votre équipe et à partager votre abonnement.
                  </CardDescription>
                </CardHeader>

                {selectedTeam && (
                  <div className="space-y-6">
                    {/* Invite/Remove Form */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Gérer l'accès par e-mail
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedTeam.team_members.length + selectedTeam.pendingInvitations.length}/{teamLimit} membres utilisés.
                      </p>
                      <div className="flex gap-2">
                        <Input 
                          type="email" 
                          placeholder="email@exemple.com" 
                          value={inviteEmail} 
                          onChange={(e) => setInviteEmail(e.target.value)} 
                          disabled={processingAction}
                        />
                        {getActionButton()}
                      </div>
                      {!canInviteMore && selectedTeam.isOwner && memberStatus === 'not_member' && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Limite de membres atteinte pour votre plan.
                        </p>
                      )}
                      {!selectedTeam.isOwner && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Seul le propriétaire de l'équipe peut gérer les accès.
                        </p>
                      )}
                    </div>

                    {/* Current Members */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4" /> Membres actuels ({selectedTeam.team_members.length})
                      </h3>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {selectedTeam.team_members.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-4">Aucun membre dans cette équipe.</p>
                          ) : (
                            selectedTeam.team_members.map((member) => (
                              <div key={member.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                                <div className="flex items-center gap-2">
                                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-3 w-3 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{member.profiles?.display_name || `Utilisateur ${member.user_id.slice(-4)}`}</p>
                                    <p className="text-xs text-muted-foreground">{member.role === 'owner' ? 'Propriétaire' : 'Membre'}</p>
                                  </div>
                                </div>
                                {member.role === 'owner' && <Badge variant="secondary" className="flex items-center gap-1"><Crown className="h-3 w-3" /> Propriétaire</Badge>}
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Pending Invitations */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Invitations en attente ({selectedTeam.pendingInvitations.length})
                      </h3>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {selectedTeam.pendingInvitations.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-4">Aucune invitation en attente.</p>
                          ) : (
                            selectedTeam.pendingInvitations.map((invitation) => (
                              <div key={invitation.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                                <div className="flex items-center gap-2">
                                  <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center">
                                    <Mail className="h-3 w-3 text-orange-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{invitation.email}</p>
                                    <p className="text-xs text-muted-foreground">Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                </div>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => handleRemoveAccess()} // Call handleRemoveAccess for consistency
                                  disabled={processingAction}
                                >
                                  Annuler
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}