export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // base64
  created_at: string;
  full_text?: string;
  analysis?: string;
  summary?: { type: string; content: string };
  translation?: { lang: string; content: string };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type RightPanelView = 'analysis' | 'summary' | 'translation' | 'chat';