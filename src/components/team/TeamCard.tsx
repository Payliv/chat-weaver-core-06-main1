import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Crown, Mail, History, Clock, Trash2, Ban, User } from 'lucide-react';
import type { Team } from './types';

interface TeamCardProps {
  team: Team;
  teamLimit: number;
  onInviteMember: (teamId: string, email: string) => Promise<void>;
  onRemoveMember: (teamId: string, memberId: string) => Promise<void>;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  onShowHistory: (team: Team) => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export const TeamCard = ({ team, teamLimit, onInviteMember, onRemoveMember, onCancelInvitation, onShowHistory }: TeamCardProps) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    setIsInviting(true);
    await onInviteMember(team.id, inviteEmail);
    setIsInviting(false);
    setShowInviteDialog(false);
    setInviteEmail('');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              {team.name}
              {team.isOwner && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Crown className="h-3 w-3" /> Propriétaire
                </Badge>
              )}
              {!team.isOwner && (
                <Badge variant="outline">
                  {team.userRole === 'member' ? 'Membre' : team.userRole}
                </Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              Créée le {formatDate(team.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onShowHistory(team)} className="flex items-center gap-1">
            <History className="h-4 w-4" /> Historique
          </Button>
          {team.isOwner && (
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={team.team_members.length + team.pendingInvitations.length >= teamLimit} className="flex items-center gap-1">
                  <Mail className="h-4 w-4" /> Inviter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inviter un membre dans {team.name}</DialogTitle>
                  <DialogDescription>
                    Envoyez une invitation par email.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="inviteEmail">Adresse email</Label>
                    <Input id="inviteEmail" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="utilisateur@exemple.com" required />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>Annuler</Button>
                    <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
                      {isInviting ? 'Envoi...' : 'Envoyer l\'invitation'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Membres ({team.team_members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Invitations ({team.pendingInvitations.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="space-y-3 mt-4">
          {team.team_members.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Aucun membre.</p>
          ) : (
            team.team_members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.profiles?.display_name || `Utilisateur ${member.user_id.slice(-4)}`}</p>
                    <p className="text-xs text-muted-foreground">{member.role === 'owner' ? 'Propriétaire' : 'Membre'}</p>
                  </div>
                </div>
                {team.isOwner && member.role !== 'owner' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le membre</AlertDialogTitle>
                        <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer ce membre ?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onRemoveMember(team.id, member.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))
          )}
        </TabsContent>
        <TabsContent value="invitations" className="space-y-3 mt-4">
          {team.pendingInvitations.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Aucune invitation en attente.</p>
          ) : (
            team.pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{invitation.email}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> Expire le {formatDate(invitation.expires_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">En attente</Badge>
                  {team.isOwner && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"><Ban className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Annuler l'invitation</AlertDialogTitle>
                          <AlertDialogDescription>Êtes-vous sûr de vouloir annuler cette invitation ?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Non, garder</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onCancelInvitation(invitation.id)} className="bg-destructive hover:bg-destructive/90">Oui, annuler</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};