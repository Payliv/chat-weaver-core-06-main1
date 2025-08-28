export interface DocumentFile {
  id: string;
  user_id: string;
  name: string;
  type: string;
  size: number;
  storage_path: string;
  full_text: string | null;
  created_at: string;
  content_base64?: string; // For preview
  summary?: { type: string; content: string };
  translation?: { lang: string; content: string };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type RightPanelView = 'preview' | 'summary' | 'translation' | 'actions';