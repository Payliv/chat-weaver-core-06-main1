import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Mail, Clock, Loader2, CheckCircle, XCircle, RefreshCw, Crown, Shield, UserPlus, UserX, User, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface SharedUser {
  id: string;
  shared_with_user_id: string;
  shared_with_email: string;
  status: 'active' | 'revoked';
  created_at: string;
  expires_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface SharerSubscriptionInfo {
  subscriptionTier: string;
  shareLimit: number;
  sharerSubscriptionEnd: string | null;
}

type MemberStatus = 'not_found' | 'not_subscribed_user' | 'already_shared_by_me' | 'already_subscribed_independently' | 'can_share';

export default function ShareSubscription() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [sharerSubInfo, setSharerSubInfo] = useState<SharerSubscriptionInfo | null>(null);

  const [memberStatus, setMemberStatus] = useState<MemberStatus>('not_found');
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const loadSharerData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        navigate('/auth');
        return;
      }
      setUser(authUser);

      const { data, error } = await supabase.functions.invoke('direct-share-management', { body: { action: 'get_shared_users' } });
      if (error) throw new Error(error.message || 'Erreur chargement des données de partage');
      
      setSharedUsers(data.sharedUsers || []);
      setSharerSubInfo({
        subscriptionTier: data.subscriptionTier || 'Gratuit',
        shareLimit: data.shareLimit || 0,
        sharerSubscriptionEnd: data.sharerSubscriptionEnd || null,
      });

    } catch (error: any) {
      console.error('Error loading sharer data:', error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    loadSharerData();
  }, [loadSharerData]);

  const checkMemberStatus = useCallback(async () => {
    if (!inviteEmail.trim() || !sharerSubInfo) {
      setMemberStatus('not_found');
      setTargetUserId(null);
      return;
    }

    // 1. Check if email exists as a user in auth.users
    const { data: userIdData, error: userIdError } = await supabase.functions.invoke('get-user-id-by-email', {
      body: { email: inviteEmail.trim() }
    });

    if (userIdError || !userIdData?.userId) {
      setMemberStatus('not_subscribed_user'); // User not found in auth.users
      setTargetUserId(null);
      return;
    }

    const foundUserId = userIdData.userId;
    setTargetUserId(foundUserId);

    // 2. Check if user is already shared by me
    const isAlreadySharedByMe = sharedUsers.some(sharedUser => sharedUser.shared_with_user_id === foundUserId);
    if (isAlreadySharedByMe) {
      setMemberStatus('already_shared_by_me');
      return;
    }

    // 3. Check if user is already subscribed independently (not shared by me)
    const { data: targetSubInfo, error: targetSubError } = await supabase.functions.invoke('check-subscription', {
      headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
      body: { userId: foundUserId } // Pass target user ID to check their subscription
    });

    if (targetSubError) {
      console.error('Error checking target user subscription:', targetSubError);
      // Fallback to can_share if we can't verify their subscription
      setMemberStatus('can_share');
      return;
    }

    if (targetSubInfo?.subscribed && targetSubInfo?.subscription_tier !== 'Shared') {
      setMemberStatus('already_subscribed_independently');
      return;
    }

    setMemberStatus('can_share'); // User exists, not shared by me, not independently subscribed
  }, [inviteEmail, sharedUsers, sharerSubInfo]);

  useEffect(() => {
    const handler = setTimeout(() => {
      checkMemberStatus();
    }, 500); // Debounce for 500ms
    return () => clearTimeout(handler);
  }, [inviteEmail, checkMemberStatus]);

  const handleShareSubscription = async () => {
    if (!sharerSubInfo || !inviteEmail.trim()) return;

    setProcessingAction(true);
    try {
      const { error } = await supabase.functions.invoke('direct-share-management', { 
        body: { action: 'share_subscription', targetEmail: inviteEmail.trim() } 
      });
      if (error) throw new Error(error.message);
      toast({ title: "Abonnement partagé", description: `Accès partagé avec ${inviteEmail.trim()}.` });
      setInviteEmail('');
      await loadSharerData(); // Refresh data
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRevokeSubscription = async (emailToRevoke: string) => {
    if (!sharerSubInfo || !emailToRevoke.trim()) return;

    setProcessingAction(true);
    try {
      const { error } = await supabase.functions.invoke('direct-share-management', { 
        body: { action: 'revoke_subscription', targetEmail: emailToRevoke.trim() } 
      });
      if (error) throw new Error(error.message);
      toast({ title: "Accès retiré", description: `L'accès de ${emailToRevoke.trim()} a été retiré.` });
      setInviteEmail('');
      await loadSharerData(); // Refresh data
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setProcessingAction(false);
    }
  };

  const isPremiumSharer = sharerSubInfo?.subscriptionTier.toLowerCase().includes('pro') || sharerSubInfo?.subscriptionTier.toLowerCase().includes('business') || sharerSubInfo?.subscriptionTier.toLowerCase().includes('enterprise');
  const canShareMore = sharerSubInfo && (sharedUsers.length < sharerSubInfo.shareLimit);

  const getActionButton = () => {
    if (!isPremiumSharer) {
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
            <XCircle className="w-4 h-4 mr-2" /> Entrez un email
          </Button>
        );
      case 'not_subscribed_user':
        return (
          <Button disabled className="w-full">
            <XCircle className="w-4 h-4 mr-2" /> Utilisateur non inscrit
          </Button>
        );
      case 'already_shared_by_me':
        return (
          <Button 
            onClick={() => handleRevokeSubscription(inviteEmail.trim())} 
            disabled={processingAction}
            variant="destructive"
            className="w-full"
          >
            {processingAction ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserX className="w-4 h-4 mr-2" />}
            {processingAction ? 'Retrait...' : 'Retirer l\'accès'}
          </Button>
        );
      case 'already_subscribed_independently':
        return (
          <Button disabled className="w-full">
            <Users className="w-4 h-4 mr-2" /> Déjà abonné
          </Button>
        );
      case 'can_share':
        return (
          <Button 
            onClick={handleShareSubscription} 
            disabled={processingAction || !canShareMore || !inviteEmail.trim()}
            className="w-full"
          >
            {processingAction ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
            {processingAction ? 'Partage...' : 'Partager l\'abonnement'}
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
                    Plan {sharerSubInfo?.subscriptionTier || 'Gratuit'} - Partagez l'accès avec votre équipe.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadSharerData} disabled={loading || processingAction} className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading || processingAction ? 'animate-spin' : ''}`} /> Actualiser
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-6 py-8">
        {!isPremiumSharer ? (
          <Card className="p-6 mb-6 bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20">
            <CardContent className="p-0 flex items-center gap-4">
              <div className="p-3 rounded-full bg-secondary/10"><Shield className="h-6 w-6 text-secondary" /></div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">Débloquez le partage d'abonnement</h2>
                <p className="text-muted-foreground">Passez au plan Pro ou supérieur pour partager votre abonnement avec d'autres utilisateurs.</p>
              </div>
              <Button onClick={() => navigate("/billing")} variant="default">Mettre à niveau</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Gérer les accès partagés
                </CardTitle>
                <CardDescription>
                  Invitez des utilisateurs à bénéficier de votre abonnement.
                </CardDescription>
              </CardHeader>

              <div className="space-y-6">
                {/* Message informatif sur le partage */}
                <div className="p-4 border border-blue-300 rounded-lg bg-blue-50/50 text-blue-800 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-sm mb-1">
                      Partagez votre abonnement avec votre équipe !
                    </p>
                    <p className="text-xs">
                      Votre plan actuel ({sharerSubInfo?.subscriptionTier}) vous permet de partager l'accès avec 
                      jusqu'à <strong>{sharerSubInfo?.shareLimit} personnes</strong>.
                      <br />
                      Vous pouvez soit inviter des utilisateurs via leur email (ils devront s'inscrire ou se connecter avec cet email), 
                      soit leur communiquer directement vos identifiants de connexion pour un accès immédiat.
                      <br />
                      <span className="font-semibold">Rappel :</span> Le plan Pro permet de partager avec 5 personnes, et le plan Business avec 20 personnes.
                    </p>
                  </div>
                </div>

                {/* Share/Revoke Form */}
                <div className="p-4 border rounded-lg space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Partager ou retirer l'accès
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {sharedUsers.length}/{sharerSubInfo?.shareLimit || 0} accès partagés utilisés.
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
                  {!canShareMore && memberStatus === 'can_share' && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Limite de partages atteinte pour votre plan.
                    </p>
                  )}
                </div>

                {/* Current Shared Users */}
                <div className="p-4 border rounded-lg space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" /> Utilisateurs avec accès partagé ({sharedUsers.length})
                  </h3>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {sharedUsers.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-4">Aucun utilisateur avec accès partagé.</p>
                      ) : (
                        sharedUsers.map((sharedUser) => (
                          <div key={sharedUser.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{sharedUser.profiles?.display_name || sharedUser.shared_with_email}</p>
                                <p className="text-xs text-muted-foreground">Accès partagé</p>
                              </div>
                            </div>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleRevokeSubscription(sharedUser.shared_with_email)}
                              disabled={processingAction}
                            >
                              Retirer
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}