export interface UploadedFile {
  id: string;
  user_id: string;
  name: string; // Corresponds to original_filename
  type: string; // Corresponds to file_type
  size: number; // Corresponds to file_size
  content: string; // Base64 content for preview
  full_text: string; // Corresponds to extracted_text
  storage_path: string;
  created_at: string;
  summary?: { type: string; content: string };
  translation?: { lang: string; content: string };
  embeddings?: number[][];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type RightPanelView = 'preview' | 'chat' | 'summary' | 'translation' | 'actions';