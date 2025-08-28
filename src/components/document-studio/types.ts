export interface DocumentFile {
  id: string;
  user_id: string;
  name: string;
  type: string;
  size: number;
  storage_path: string;
  full_text: string | null;
  created_at: string;
  content_base64?: string; // For preview (kept for non-PDFs or fallback)
  public_url?: string; // New: Public URL for direct iframe embedding
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}