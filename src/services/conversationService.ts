import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/hooks/useChatLogic';

export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

export const conversationService = {
  async createNewConversation(userId: string, title: string = 'Nouvelle conversation'): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title, user_id: userId })
      .select('id, title, created_at')
      .single();
    if (error) {
      console.error('Create conversation failed', error);
      return null;
    }
    return data;
  },

  async loadConversations(userId: string): Promise<Conversation[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .gte('created_at', thirtyDaysAgo)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Load conversations failed', error);
      return [];
    }
    return data;
  },

  async loadMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('id, content, role, created_at, model')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Load messages failed', error);
      return [];
    }
    return (data || []).map((m: any) => ({
      id: m.id as string,
      content: m.content as string,
      role: m.role as 'user' | 'assistant',
      timestamp: new Date(m.created_at as string),
      model: m.model as string | undefined,
    }));
  },

  async updateConversationTitle(conversationId: string, title: string) {
    try {
      const { data: convRow } = await supabase
        .from('conversations')
        .select('id, title')
        .eq('id', conversationId)
        .maybeSingle();
      const needsTitle = !convRow?.title || convRow.title === 'Nouvelle conversation';
      if (needsTitle && title) {
        await supabase.from('conversations').update({ title }).eq('id', conversationId);
        window.dispatchEvent(new CustomEvent('chat:reload-conversations'));
      }
    } catch (e) {
      console.warn('Update conversation title failed', e);
    }
  }
};