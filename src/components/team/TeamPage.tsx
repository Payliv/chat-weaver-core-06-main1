import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, History, CheckCircle, ArrowLeft, Shield, RefreshCw, Calendar, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TeamCard } from '@/components/team/TeamCard';
import type { Team, TeamHistoryItem } from '@/components/team/types';

const setMeta = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

interface TeamData {
  teams: Team[];
  teamLimit: number;
  subscription: string;
}

export default function TeamPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamLimit, setTeamLimit] = useState(1);
  const [subscription, setSubscription] = useState('Gratuit');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamHistory, setTeamHistory] = useState<TeamHistoryItem[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasLoadedTeamsOnce, setHasLoadedTeamsOnce] = useState(false);
  const [teamLoadError, setTeamLoadError] = useState<string | null>(null);
  const [isCreatingDefaultTeam, setIsCreatingDefaultTeam] = useState(false);
  
  const { toast } = useToast();

  const createDefaultTeamForUser = useCallback(async () => {
    if (isCreatingDefaultTeam) return;
    setIsCreatingDefaultTeam(true);
    setTeamLoadError(null); // Clear previous errors
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      toast({
        title: "Création de votre équipe...",
        description: "Une équipe par défaut est en cours de création pour vous.",
        duration: 3000
      });

      const { error } = await supabase.functions.invoke('team-management', {
        body: { action: 'create_team', teamName: 'Mon Équipe' } // Explicitly pass default name
      });

      if (error) throw new Error(error.message || 'Erreur lors de la création de l\'équipe par défaut');
      
      toast({
        title: "Équipe créée !",
        description: "Votre équipe par défaut a été créée avec succès.",
      });
      await loadTeams(); // Reload teams to show the new one
    } catch (error: any) {
      console.error('Error creating default team:', error);
      setTeamLoadError(error.message || "Impossible de créer l'équipe par défaut.");
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'équipe par défaut.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingDefaultTeam(false);
    }
  }, [isCreatingDefaultTeam, toast]);

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      setTeamLoadError(null); // Clear previous errors
      const { data, error } = await supabase.functions.invoke('team-management', { body: { action: 'get_teams' } });
      if (error) throw new Error(error.message || 'Erreur chargement');
      const teamData: TeamData = data;
      setTeams(teamData.teams || []);
      setTeamLimit(teamData.teamLimit || 1);
      setSubscription(teamData.subscription || 'Gratuit');

      if (!hasLoadedTeamsOnce) { // Only attempt to create default team once
        setHasLoadedTeamsOnce(true);
        if ((teamData.teams || []).length === 0) {
          await createDefaultTeamForUser();
        }
      }
    } catch (error: any) {
      console.error('Error loading teams:', error); // Log the actual error
      setTeamLoadError(error.message || "Impossible de charger les équipes.");
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [createDefaultTeamForUser, toast, hasLoadedTeamsOnce]);

  useEffect(() => {
    document.title = 'Gestion d\'équipe - ChAtélix';
    setMeta('description', 'Gérez vos équipes, invitez des membres et collaborez efficacement sur ChAtélix.');
    loadTeams();
  }, [loadTeams]);

  const handleInviteMember = async (teamId: string, email: string) => {
    try {
      const { error } = await supabase.functions.invoke('team-management', { body: { action: 'invite_member', teamId, memberEmail: email } });
      if (error) throw new Error(error.message);
      toast({ title: "Invitation envoyée", description: `Invitation envoyée à ${email}` });
      await loadTeams();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    try {
      const { error } = await supabase.functions.invoke('team-management', { body: { action: 'remove_member', teamId, memberId } });
      if (error) throw new Error(error.message);
      toast({ title: "Membre supprimé" });
      await loadTeams();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase.functions.invoke('team-management', { body: { action: 'cancel_invitation', invitationId } });
      if (error) throw new Error(error.message);
      toast({ title: "Invitation annulée" });
      await loadTeams();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const loadTeamHistory = async (teamId: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase.functions.invoke('team-management', { body: { action: 'get_team_history', teamId } });
      if (error) throw new Error(error.message);
      setTeamHistory(data.history || []);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistoryDialog = (team: Team) => {
    setSelectedTeam(team);
    setShowHistoryDialog(true);
    loadTeamHistory(team.id);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatHistoryAction = (action: string, details: any) => {
    switch (action) {
      case 'create_team': return `Équipe "${details.team_name}" créée`;
      case 'invite_member': return `Invitation envoyée à ${details.invited_email}`;
      case 'accept_invitation': return `Invitation acceptée`;
      case 'remove_member': return `Membre ${details.removed_user_name || 'inconnu'} retiré`;
      case 'cancel_invitation': return `Invitation annulée pour ${details.cancelled_email}`;
      default: return action;
    }
  };

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
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Gestion d'équipe</h1>
                  <p className="text-sm text-muted-foreground">Plan {subscription} - {teams.filter(t => t.isOwner).length}/{teamLimit === 999 ? '∞' : teamLimit} équipes • {teamLimit === 999 ? 'Illimité' : `${teamLimit} membres max`}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadTeams} disabled={loading || isCreatingDefaultTeam} className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading || isCreatingDefaultTeam ? 'animate-spin' : ''}`} /> Actualiser
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-6 py-8">
        {teamLimit <= 1 && (
          <Card className="p-6 mb-6 bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-secondary/10"><Shield className="h-6 w-6 text-secondary" /></div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">Débloquez la collaboration d'équipe</h2>
                <p className="text-muted-foreground">Passez au plan Pro ou supérieur pour inviter des membres.</p>
              </div>
              <Button onClick={() => navigate("/billing")} variant="default">Mettre à niveau</Button>
            </div>
          </Card>
        )}

        <div className="space-y-6">
          {loading && !isCreatingDefaultTeam && !teamLoadError ? (
            <Card className="p-8 text-center">
              <div className="p-4 mx-auto w-fit rounded-full bg-muted/50 mb-4"><Loader2 className="h-8 w-8 text-muted-foreground animate-spin" /></div>
              <h3 className="text-lg font-semibold mb-2">Chargement de vos équipes...</h3>
              <p className="text-muted-foreground mb-4">Veuillez patienter.</p>
            </Card>
          ) : isCreatingDefaultTeam && !teamLoadError ? (
            <Card className="p-8 text-center">
              <div className="p-4 mx-auto w-fit rounded-full bg-primary/10 mb-4"><Users className="h-8 w-8 text-primary animate-pulse" /></div>
              <h3 className="text-lg font-semibold mb-2">Création de votre équipe par défaut...</h3>
              <p className="text-muted-foreground mb-4">Ceci ne devrait prendre que quelques instants.</p>
            </Card>
          ) : teamLoadError ? (
            <Card className="p-8 text-center bg-red-50 border-red-200">
              <div className="p-4 mx-auto w-fit rounded-full bg-red-100 mb-4"><XCircle className="h-8 w-8 text-red-600" /></div>
              <h3 className="text-lg font-semibold mb-2">Erreur de chargement des équipes</h3>
              <p className="text-muted-foreground mb-4">{teamLoadError}</p>
              <Button onClick={loadTeams} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Réessayer
              </Button>
            </Card>
          ) : (
            teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                teamLimit={teamLimit}
                onInviteMember={handleInviteMember}
                onRemoveMember={handleRemoveMember}
                onCancelInvitation={handleCancelInvitation}
                onShowHistory={openHistoryDialog}
              />
            ))
          )}
        </div>

        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Historique de {selectedTeam?.name}</DialogTitle>
              <DialogDescription>Suivez toutes les activités de cette équipe.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] w-full">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : teamHistory.length === 0 ? (
                <div className="text-center py-8"><Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground">Aucun historique.</p></div>
              ) : (
                <div className="space-y-4">
                  {teamHistory.map((item, index) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><CheckCircle className="h-4 w-4 text-primary" /></div>
                        {index < teamHistory.length - 1 && <div className="w-px h-6 bg-border mt-2" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-sm">{formatHistoryAction(item.action, item.details)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}