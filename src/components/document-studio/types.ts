export interface UploadedFile {
  id: string;
  name: string;
  type: string; // Mime type
  size: number;
  content: string; // Base64 content
  full_text: string; // Extracted text content
  created_at: string;
  summary?: { type: string; content: string };
  translation?: { lang: string; content: string };
  embeddings?: number[][]; // Embeddings des chunks du document
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type RightPanelView = 'preview' | 'chat' | 'summary' | 'translation';