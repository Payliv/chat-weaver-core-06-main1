import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  CreditCard, 
  Settings, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  BarChart3, 
  UserCheck, 
  Crown,
  Shield,
  Menu,
  LogOut,
  MessageSquare
} from "lucide-react";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  subscription?: {
    subscribed: boolean;
    subscription_tier: string;
    subscription_end: string;
  };
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[] | string;
  is_active: boolean;
}

interface Stats {
  totalUsers: number;
  totalRevenue: number;
  activeSubscriptions: number;
  totalConversations: number;
}

interface SystemSettings {
  free_trial_enabled: boolean;
}

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalRevenue: 0, activeSubscriptions: 0, totalConversations: 0 });
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    price: 0,
    features: "",
    is_active: true
  });
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
      });
      // Rediriger vers la page de connexion ou d'accueil
      window.location.href = '/auth';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur est survenue lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: dashboardData } = await supabase.functions.invoke('super-admin', {
        body: { action: 'getDashboardData' }
      });

      if (dashboardData) {
        setUsers(dashboardData.users || []);
        setPlans(dashboardData.plans || []);
        setStats(dashboardData.stats || { totalUsers: 0, totalRevenue: 0, activeSubscriptions: 0, totalConversations: 0 });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du tableau de bord",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async () => {
    try {
      const planData = {
        ...newPlan,
        features: newPlan.features.split(',').map(f => f.trim()).filter(f => f)
      };

      const { data } = await supabase.functions.invoke('super-admin', {
        body: { action: 'createPlan', data: planData }
      });

      if (data) {
        toast({
          title: "Succès",
          description: "Plan créé avec succès",
        });
        setNewPlan({ name: "", description: "", price: 0, features: "", is_active: true });
        loadDashboardData();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le plan",
        variant: "destructive",
      });
    }
  };

  const updatePlan = async (plan: Plan) => {
    try {
      // Traiter les features comme pour la création
      const planData = {
        ...plan,
        features: typeof plan.features === 'string' 
          ? plan.features.split(',').map(f => f.trim()).filter(f => f)
          : plan.features || []
      };

      const { data } = await supabase.functions.invoke('super-admin', {
        body: { action: 'updatePlan', data: planData }
      });

      if (data) {
        toast({
          title: "Succès",
          description: "Plan mis à jour avec succès",
        });
        setEditingPlan(null);
        loadDashboardData();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le plan",
        variant: "destructive",
      });
    }
  };

  const promoteUserToPremium = async (userId: string, tier: string) => {
    try {
      const { data } = await supabase.functions.invoke('super-admin', {
        body: { 
          action: 'promoteUser', 
          data: { 
            userId, 
            tier,
            subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 an
          }
        }
      });

      if (data && data.success) {
        toast({
          title: "Succès",
          description: `Utilisateur promu au plan ${tier}`,
        });
        loadDashboardData();
      } else {
        throw new Error(data?.message || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Promotion error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de promouvoir l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const demoteUser = async (userId: string) => {
    try {
      const { data } = await supabase.functions.invoke('super-admin', {
        body: { 
          action: 'demoteUser', 
          data: { userId }
        }
      });

      if (data && data.success) {
        toast({
          title: "Succès",
          description: "Utilisateur rétrogradé vers le plan gratuit",
        });
        loadDashboardData();
      } else {
        throw new Error(data?.message || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Demotion error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rétrograder l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { data } = await supabase.functions.invoke('super-admin', {
        body: { action: 'deletePlan', data: { id: planId } }
      });

      if (data) {
        toast({
          title: "Succès",
          description: "Plan supprimé avec succès",
        });
        loadDashboardData();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le plan",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Chargement du tableau de bord...</div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'plans', label: 'Plans', icon: CreditCard },
    { id: 'promotions', label: 'Promotions', icon: Crown },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRevenue} FCFA</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalConversations}</div>
                </CardContent>
              </Card>
            </div>
          </>
        );

      case 'users':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>
                Liste de tous les utilisateurs enregistrés avec leurs abonnements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Date d'Inscription</TableHead>
                    <TableHead>Dernière Connexion</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR')
                          : 'Jamais connecté'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.subscription?.subscribed ? "default" : "secondary"}>
                          {user.subscription?.subscribed ? user.subscription.subscription_tier || 'Premium' : 'Gratuit'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!user.subscription?.subscribed ? (
                          <div className="flex gap-1 flex-wrap">
                            {plans.filter(p => p.id !== 'enterprise').map((plan) => (
                              <Button
                                key={plan.id}
                                size="sm"
                                variant={plan.id === 'pro' ? 'default' : 'outline'}
                                onClick={() => promoteUserToPremium(user.id, plan.id)}
                                className={plan.id === 'pro' ? 'bg-gradient-to-r from-primary to-primary/80' : ''}
                              >
                                {plan.id === 'pro' && <Crown className="h-3 w-3 mr-1" />}
                                {plan.name}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => demoteUser(user.id)}
                          >
                            Désactiver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'plans':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Plans d'Abonnement</h3>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un Nouveau Plan</DialogTitle>
                    <DialogDescription>
                      Ajoutez un nouveau plan d'abonnement pour vos utilisateurs
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nom du Plan</Label>
                      <Input
                        id="name"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newPlan.description}
                        onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Prix (FCFA)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newPlan.price}
                        onChange={(e) => setNewPlan({ ...newPlan, price: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="features">Fonctionnalités (séparées par des virgules)</Label>
                      <Textarea
                        id="features"
                        value={newPlan.features}
                        onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                        placeholder="Accès illimité aux IA, Support prioritaire, Équipes..."
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={newPlan.is_active}
                        onCheckedChange={(checked) => setNewPlan({ ...newPlan, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Plan actif</Label>
                    </div>
                    <Button onClick={createPlan} className="w-full">
                      Créer le Plan
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold">{plan.price} FCFA</p>
                      {plan.features && Array.isArray(plan.features) && (
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <span className="mr-2">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-2 pt-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingPlan(plan)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Modifier le Plan</DialogTitle>
                            </DialogHeader>
                            {editingPlan && (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-name">Nom du Plan</Label>
                                  <Input
                                    id="edit-name"
                                    value={editingPlan.name}
                                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-description">Description</Label>
                                  <Textarea
                                    id="edit-description"
                                    value={editingPlan.description || ''}
                                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-price">Prix (FCFA)</Label>
                                  <Input
                                    id="edit-price"
                                    type="number"
                                    value={editingPlan.price}
                                    onChange={(e) => setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) || 0 })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-features">Fonctionnalités (séparées par des virgules)</Label>
                                  <Textarea
                                    id="edit-features"
                                    value={Array.isArray(editingPlan.features) 
                                      ? editingPlan.features.join(', ') 
                                      : editingPlan.features || ''}
                                     onChange={(e) => setEditingPlan({ ...editingPlan, features: e.target.value })}
                                    placeholder="Accès illimité aux IA, Support prioritaire, Équipes..."
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="edit-is_active"
                                    checked={editingPlan.is_active}
                                    onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, is_active: checked })}
                                  />
                                  <Label htmlFor="edit-is_active">Plan actif</Label>
                                </div>
                                <Button onClick={() => updatePlan(editingPlan)} className="w-full">
                                  Mettre à Jour
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deletePlan(plan.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'promotions':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Promotion d'Utilisateurs</CardTitle>
                <CardDescription>
                  Promouvoir manuellement des utilisateurs vers des plans premium
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-medium">Utilisateurs Gratuits</h4>
                  <div className="space-y-2">
                    {users.filter(user => !user.subscription?.subscribed).map(user => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => promoteUserToPremium(user.id, 'premium')}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                          >
                            <Crown className="h-3 w-3 mr-1" />
                            Premium
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => promoteUserToPremium(user.id, 'pro')}
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Pro
                          </Button>
                        </div>
                      </div>
                    ))}
                    {users.filter(user => !user.subscription?.subscribed).length === 0 && (
                      <p className="text-muted-foreground text-center py-8">
                        Aucun utilisateur gratuit à promouvoir
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs Premium</CardTitle>
                <CardDescription>
                  Liste des utilisateurs ayant un abonnement actif
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.filter(user => user.subscription?.subscribed).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Plan: {user.subscription?.subscription_tier || 'Premium'}
                          {user.subscription?.subscription_end && 
                            ` - Expire le ${new Date(user.subscription.subscription_end).toLocaleDateString('fr-FR')}`
                          }
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="default">
                          <Crown className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => demoteUser(user.id)}
                        >
                          Désactiver
                        </Button>
                      </div>
                    </div>
                  ))}
                  {users.filter(user => user.subscription?.subscribed).length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      Aucun utilisateur premium
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres Système</CardTitle>
                <CardDescription>
                  Configuration générale de l'application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div>
                      <h4 className="font-medium">Essai Gratuit</h4>
                      <p className="text-sm text-muted-foreground">
                        Permet aux utilisateurs de continuer sans abonnement
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={freeTrialEnabled ? "default" : "destructive"}>
                        {freeTrialEnabled ? "Activé" : "Désactivé"}
                      </Badge>
                      <Switch
                        checked={freeTrialEnabled}
                        onCheckedChange={setFreeTrialEnabled}
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-800">
                        Essai gratuit désactivé
                      </p>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Les utilisateurs doivent maintenant obligatoirement s'abonner pour accéder à l'application. 
                      Cette modification a été appliquée dans le code de l'application.
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Autres Paramètres</h4>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="text-sm font-medium">Maintenance Mode</p>
                        <p className="text-xs text-muted-foreground">Mettre l'application en maintenance</p>
                      </div>
                      <Switch disabled />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="text-sm font-medium">Nouvelles Inscriptions</p>
                        <p className="text-xs text-muted-foreground">Autoriser les nouvelles inscriptions</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Menu Latéral */}
        <Sidebar className="border-r">
          <SidebarContent>
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-6 h-6 text-orange-600" />
                <span className="text-lg font-bold">Super Admin</span>
              </div>
            </div>
            
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveView(item.id)}
                        isActive={activeView === item.id}
                        className="w-full justify-start"
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto p-4">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Contenu Principal */}
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold">
                    {menuItems.find(item => item.id === activeView)?.label}
                  </h1>
                  <Badge variant="secondary" className="mt-1">
                    Super Administrateur
                  </Badge>
                </div>
              </div>
              
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Retour au Chat</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}