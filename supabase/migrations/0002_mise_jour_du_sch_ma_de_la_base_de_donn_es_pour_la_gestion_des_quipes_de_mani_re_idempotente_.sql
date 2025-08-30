-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Mon équipe',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID, _user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  select exists (
    select 1 from public.team_members
    where team_id = _team_id and user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_owner(_team_id UUID, _user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  select exists (
    select 1 from public.teams
    where id = _team_id and owner_id = _user_id
  );
$$;

-- RLS Policies for teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teams visible to members" ON public.teams;
CREATE POLICY "Teams visible to members" ON public.teams FOR SELECT USING (
  (owner_id = auth.uid()) OR (public.is_team_member(id, auth.uid()))
);
DROP POLICY IF EXISTS "Team owners can insert" ON public.teams;
CREATE POLICY "Team owners can insert" ON public.teams FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Team owners can update" ON public.teams;
CREATE POLICY "Team owners can update" ON public.teams FOR UPDATE USING (owner_id = auth.uid());
DROP POLICY IF EXISTS "Team owners can delete" ON public.teams;
CREATE POLICY "Team owners can delete" ON public.teams FOR DELETE USING (owner_id = auth.uid());

-- RLS Policies for team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view their memberships" ON public.team_members;
CREATE POLICY "Members can view their memberships" ON public.team_members FOR SELECT USING (
  (user_id = auth.uid()) OR (public.is_team_owner(team_id, auth.uid()))
);
DROP POLICY IF EXISTS "Owners can add members" ON public.team_members;
CREATE POLICY "Owners can add members" ON public.team_members FOR INSERT WITH CHECK (public.is_team_owner(team_id, auth.uid()));
DROP POLICY IF EXISTS "Owners can manage memberships" ON public.team_members;
CREATE POLICY "Owners can manage memberships" ON public.team_members FOR UPDATE USING (public.is_team_owner(team_id, auth.uid()));
DROP POLICY IF EXISTS "Owners can remove memberships" ON public.team_members;
CREATE POLICY "Owners can remove memberships" ON public.team_members FOR DELETE USING (public.is_team_owner(team_id, auth.uid()));

-- RLS Policies for team_invitations
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team owners can manage invitations" ON public.team_invitations;
CREATE POLICY "Team owners can manage invitations" ON public.team_invitations FOR ALL USING (public.is_team_owner(team_id, auth.uid()));
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.team_invitations;
CREATE POLICY "Users can view their own invitations" ON public.team_invitations FOR SELECT USING (email = auth.email());

-- Trigger to add owner to team_members on team creation
CREATE OR REPLACE FUNCTION public.add_owner_to_team()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
begin
  insert into public.team_members (team_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

DROP TRIGGER IF EXISTS trg_add_owner_to_team ON public.teams;
CREATE TRIGGER trg_add_owner_to_team
AFTER INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.add_owner_to_team();

-- Trigger to enforce team member limit
CREATE OR REPLACE FUNCTION public.enforce_team_member_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
declare
  member_count int;
begin
  select count(*) into member_count from public.team_members where team_id = new.team_id;
  if member_count >= 3 then
    raise exception 'Team member limit reached (max 3) for team %', new.team_id;
  end if;
  return new;
end;
$$;

DROP TRIGGER IF EXISTS trg_enforce_team_member_limit ON public.team_members;
CREATE TRIGGER trg_enforce_team_member_limit
BEFORE INSERT ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_team_member_limit();