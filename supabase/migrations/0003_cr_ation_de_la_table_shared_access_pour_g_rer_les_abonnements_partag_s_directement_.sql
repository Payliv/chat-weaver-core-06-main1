-- Création de la table shared_access
CREATE TABLE public.shared_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sharer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_email TEXT NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL, -- 'active', 'revoked'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Date d'expiration de l'abonnement du partageur
  UNIQUE (sharer_user_id, shared_with_user_id) -- Un utilisateur ne peut partager qu'une fois avec un autre
);

-- Activation de la sécurité au niveau des lignes (RLS)
ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour la table shared_access
-- Un partageur peut voir et gérer ses propres entrées de partage
CREATE POLICY "Sharer can view their shared access" ON public.shared_access
FOR SELECT TO authenticated USING (auth.uid() = sharer_user_id);

CREATE POLICY "Sharer can create shared access" ON public.shared_access
FOR INSERT TO authenticated WITH CHECK (auth.uid() = sharer_user_id);

CREATE POLICY "Sharer can update their shared access" ON public.shared_access
FOR UPDATE TO authenticated USING (auth.uid() = sharer_user_id);

CREATE POLICY "Sharer can delete their shared access" ON public.shared_access
FOR DELETE TO authenticated USING (auth.uid() = sharer_user_id);

-- L'utilisateur partagé peut voir son propre accès (utile pour l'interface utilisateur)
CREATE POLICY "Shared user can view their access" ON public.shared_access
FOR SELECT TO authenticated USING (auth.uid() = shared_with_user_id);