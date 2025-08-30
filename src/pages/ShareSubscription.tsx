import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Mail, Clock, Loader2, CheckCircle, XCircle, RefreshCw, Crown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { TeamMember, PendingInvitation, Team } from '@/components/team/types';

interface TeamData {
  teams: Team[];
  teamLimit: number;
  subscription: string;
}

export default function ShareSubscription() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [teamLimit, setTeamLimit] = useState(1);
  const [subscriptionTier, setSubscriptionTier] = useState('Gratuit');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

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

  const handleInviteMember = async () => {
    if (!selectedTeam || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      const { error } = await supabase.functions.invoke('team-management', { 
        body: { action: 'invite_member', teamId: selectedTeam.id, memberEmail: inviteEmail } 
      });
      if (error) throw new Error(error.message);
      toast({ title: "Invitation envoyée", description: `Invitation envoyée à ${inviteEmail}` });
      setInviteEmail('');
      await loadUserData(); // Refresh data
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!selectedTeam) return;
    try {
      const { error } = await supabase.functions.invoke('team-management', { 
        body: { action: 'cancel_invitation', invitationId } 
      });
      if (error) throw new Error(error.message);
      toast({ title: "Invitation annulée" });
      await loadUserData(); // Refresh data
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const isProOrBusiness = subscriptionTier.toLowerCase().includes('pro') || subscriptionTier.toLowerCase().includes('business') || subscriptionTier.toLowerCase().includes('enterprise');
  const canInvite = selectedTeam && selectedTeam.isOwner && isProOrBusiness && (selectedTeam.team_members.length + selectedTeam.pendingInvitations.length < teamLimit);

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
              <Button variant="outline" size="sm" onClick={loadUserData} disabled={loading || inviting} className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading || inviting ? 'animate-spin' : ''}`} /> Actualiser
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
        ) : (
          <div className="space-y-6">
            {userTeams.length === 0 ? (
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
                    Votre équipe : {selectedTeam?.name}
                  </CardTitle>
                  <CardDescription>
                    Invitez des membres à rejoindre votre équipe et à partager votre abonnement.
                  </CardDescription>
                </CardHeader>

                {selectedTeam && (
                  <div className="space-y-6">
                    {/* Invite Form */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Inviter un nouveau membre
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
                          disabled={!canInvite || inviting}
                        />
                        <Button 
                          onClick={handleInviteMember} 
                          disabled={!canInvite || inviting || !inviteEmail.trim()}
                        >
                          {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                          {inviting ? 'Envoi...' : 'Inviter'}
                        </Button>
                      </div>
                      {!canInvite && selectedTeam.isOwner && (
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
                                    <p className="text-xs text-muted-foreground">Expire le {formatDate(invitation.expires_at)}</p>
                                  </div>
                                </div>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => handleCancelInvitation(invitation.id)}
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