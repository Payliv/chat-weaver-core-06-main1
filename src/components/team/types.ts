export interface TeamMember {
  id: string;
  role: string;
  user_id: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface TeamHistoryItem {
  id: string;
  action: string;
  created_at: string;
  details: any;
}

export interface Team {
  id: string;
  name: string;
  created_at: string;
  isOwner: boolean;
  userRole?: string;
  team_members: TeamMember[];
  pendingInvitations: PendingInvitation[];
}