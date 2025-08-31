import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Mail, Clock, Loader2, CheckCircle, XCircle, RefreshCw, Crown, Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { TeamMember, PendingInvitation, Team } from '@/components/team/types';

interface TeamData {
  teams: Team[];
  teamLimit: number;
  subscription: string;
}

type MemberStatus = 'not_found' | 'not_registered' | 'member' | 'invited' | 'loading' | 'idle';

export default function ShareSubscription() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [teamLimit, setTeamLimit] = useState(1);
  const [subscriptionTier, setSubscriptionTier] = useState('Gratuit');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // State for email status check
  const [memberStatus, setMemberStatus] = useState<MemberStatus>('idle');
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetMemberId, setTargetMemberId] = useState<string | null>(null);
  const [targetInvitationId, setTargetInvitationId] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

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

      // Select the first owned team by default for sharing context
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

  const checkMemberStatus = useCallback(async (email: string) => {
    if (!selectedTeam || !email.trim()) {
      setMemberStatus('idle');
      setTargetUserId(null);
      setTargetMemberId(null);
      setTargetInvitationId(null);
      return;
    }

    setIsCheckingEmail(true);
    setMemberStatus('loading');
    setTargetUserId(null);
    setTargetMemberId(null);
    setTargetInvitationId(null);

    try {
      // 1. Check if email is a registered user
      const { data: userIdData, error: userIdError } = await supabase.functions.invoke('get-user-id-by-email', {
        body: { email }
      });

      if (userIdError || !userIdData?.userId) {
        setMemberStatus('not_registered');
        return;
      }
      setTargetUserId(userIdData.userId);

      // 2. Check if already a member of the selected team
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', selectedTeam.id)
        .eq('user_id', userIdData.userId)
        .maybeSingle();

      if (memberError) throw memberError;

      if (memberData) {
        setMemberStatus('member');
        setTargetMemberId(memberData.id);
        return;
      }

      // 3. Check if an invitation is pending for this email
      const { data: invitationData, error: invitationError } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('team_id', selectedTeam.id)
        .eq('email', email)
        .eq('status', 'pending')
        .maybeSingle();

      if (invitationError) throw invitationError;

      if (invitationData) {
        setMemberStatus('invited');
        setTargetInvitationId(invitationData.id);
        return;
      }

      // If user is registered but not a member and not invited
      setMemberStatus('not_found'); // Renamed from 'not_found' to 'can_invite' conceptually
    } catch (error: any) {
      console.error('Error checking member status:', error);
      setMemberStatus('idle');
      toast({ title: "Erreur", description: "Impossible de vérifier le statut de l'e-mail.", variant: "destructive" });
    } finally {
      setIsCheckingEmail(false);
    }
  }, [selectedTeam, toast]);

  useEffect(() => {
    const handler = setTimeout(() => {
      checkMemberStatus(emailInput);
    }, 500); // Debounce email check
    return () => clearTimeout(handler);
  }, [emailInput, checkMemberStatus]);

  const handleShareAccess = async () => {
    if (!selectedTeam || !emailInput.trim()) return;

    setIsActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('team-management', { 
        body: { action: 'invite_member', teamId: selectedTeam.id, memberEmail: emailInput } 
      });
      if (error) throw new Error(error.message);
      toast({ title: "Invitation envoyée", description: `Invitation envoyée à ${emailInput}` });
      setEmailInput('');
      await loadUserData(); // Refresh data
      setMemberStatus('idle');
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveAccess = async () => {
    if (!selectedTeam || !emailInput.trim()) return;

    setIsActionLoading(true);
    try {
      if (memberStatus === 'member' && targetMemberId) {
        const { error } = await supabase.functions.invoke('team-management', { 
          body: { action: 'remove_member', teamId: selectedTeam.id, memberId: targetMemberId } 
        });
        if (error) throw new Error(error.message);
        toast({ title: "Accès retiré", description: `${emailInput} n'est plus membre de l'équipe.` });
      } else if (memberStatus === 'invited' && targetInvitationId) {
        const { error } = await supabase.functions.invoke('team-management', { 
          body: { action: 'cancel_invitation', invitationId: targetInvitationId } 
        });
        if (error) throw new Error(error.message);
        toast({ title: "Invitation annulée", description: `L'invitation pour ${emailInput} a été annulée.` });
      }
      setEmailInput('');
      await loadUserData(); // Refresh data
      setMemberStatus('idle');
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const isProOrBusiness = subscriptionTier.toLowerCase().includes('pro') || subscriptionTier.toLowerCase().includes('business') || subscriptionTier.toLowerCase().includes('enterprise');
  const canInviteMore = selectedTeam && selectedTeam.isOwner && isProOrBusiness && (selectedTeam.team_members.length + selectedTeam.pendingInvitations.length < teamLimit);

  const getButtonLabel = () => {
    if (isCheckingEmail || isActionLoading) return "Chargement...";
    if (memberStatus === 'member') return "Retirer l'accès";
    if (memberStatus === 'invited') return "Annuler l'invitation";
    if (memberStatus === 'not_found' || memberStatus === 'not_registered' || memberStatus === 'idle') return "Partager l'abonnement";
    return "Partager l'abonnement";
  };

  const getButtonAction = () => {
    if (memberStatus === 'member' || memberStatus === 'invited') return handleRemoveAccess;
    return handleShareAccess;
  };

  const isButtonDisabled = !emailInput.trim() || isCheckingEmail || isActionLoading || !selectedTeam || !selectedTeam.isOwner || !isProOrBusiness || (memberStatus === 'not_found' && !canInviteMore);

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
              <Button variant="outline" size="sm" onClick={loadUserData} disabled={loading || isActionLoading || isCheckingEmail} className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading || isActionLoading || isCheckingEmail ? 'animate-spin' : ''}`} /> Actualiser
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-6 py-8">
        {!isProOrBusiness ? (
          <Card className="p-6 mb-6 bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-secondary/10"><Shield className="h-6 w-6 text-secondary" /></div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">Débloquez la collaboration d'équipe</h2>
                <p className="text-muted-foreground">Passez au plan Pro ou supérieur pour inviter des membres et partager votre abonnement.</p>
              </div>
              <Button onClick={() => navigate("/billing")} variant="default">Mettre à niveau</Button>
            </div>
          </Card>
        ) : !selectedTeam ? (
          <Card className="p-8 text-center">
            <div className="p-4 mx-auto w-fit rounded-full bg-muted/50 mb-4"><Users className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="text-lg font-semibold mb-2">Aucune équipe trouvée</h3>
            <p className="text-muted-foreground mb-4">
              Vous devez être propriétaire d'une équipe pour inviter des membres.
              Veuillez créer une équipe via la page "Équipe" si vous n'en avez pas.
            </p>
            <Button onClick={() => navigate('/team')} variant="outline">Aller à la gestion d'équipe</Button>
          </Card>
        ) : (
          <Card className="p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Partager l'abonnement de l'équipe : {selectedTeam?.name}
              </CardTitle>
              <CardDescription>
                Invitez des membres à rejoindre votre équipe et à partager votre abonnement.
              </CardDescription>
            </CardHeader>

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
                    value={emailInput} 
                    onChange={(e) => setEmailInput(e.target.value)} 
                    disabled={isActionLoading}
                  />
                  <Button 
                    onClick={getButtonAction()} 
                    disabled={isButtonDisabled}
                  >
                    {isActionLoading || isCheckingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : (memberStatus === 'member' || memberStatus === 'invited' ? <XCircle className="w-4 h-4" /> : <Mail className="w-4 h-4" />)}
                    {getButtonLabel()}
                  </Button>
                </div>
                
                {emailInput.trim() && memberStatus === 'loading' && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-4 h-4 animate-spin" /> Vérification de l'e-mail...
                  </p>
                )}
                {emailInput.trim() && memberStatus === 'not_registered' && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Cet e-mail n'est pas encore enregistré sur Chatelix. Une invitation sera envoyée.
                  </p>
                )}
                {emailInput.trim() && memberStatus === 'not_found' && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Cet utilisateur est enregistré mais pas encore membre de votre équipe.
                  </p>
                )}
                {emailInput.trim() && memberStatus === 'member' && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Cet utilisateur est déjà membre de votre équipe.
                  </p>
                )}
                {emailInput.trim() && memberStatus === 'invited' && (
                  <p className="text-sm text-orange-600 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Une invitation est déjà en attente pour cet e-mail.
                  </p>
                )}
                {!canInviteMore && selectedTeam.isOwner && (memberStatus === 'not_found' || memberStatus === 'not_registered') && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Limite de membres atteinte pour votre plan.
                  </p>
                )}
                {!selectedTeam.isOwner && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Seul le propriétaire de l'équipe peut inviter des membres.
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
                              <User className="h-3 w-3 text-primary" />
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
                              <p className="text-xs text-muted-foreground">Expire le {formatDate(invitation.expires_at)}</p>
                            </div>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleRemoveAccess()} // Use handleRemoveAccess for consistency
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
          </Card>
        )}
      </main>
    </div>
  );
}