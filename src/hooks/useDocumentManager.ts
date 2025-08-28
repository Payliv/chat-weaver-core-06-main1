import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { DocumentFile, ChatMessage } from '@/components/document-studio/types';

export const useDocumentManager = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const mappedFiles: DocumentFile[] = data.map((doc: any) => ({
        id: doc.id,
        user_id: doc.user_id,
        name: doc.original_filename,
        type: doc.file_type,
        size: doc.file_size,
        storage_path: doc.storage_path,
        full_text: doc.extracted_text,
        created_at: doc.created_at,
      }));
      setFiles(mappedFiles);

      if (mappedFiles.length > 0) {
        await selectFile(mappedFiles[0]);
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les documents.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const selectFile = async (file: DocumentFile) => {
    setSelectedFile(file);
    setChatMessages([{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Document "${file.name}" chargé. Posez-moi vos questions !`,
      timestamp: new Date().toISOString()
    }]);
    
    if (!file.content_base64) {
      try {
        const { data, error } = await supabase.storage.from('documents').download(file.storage_path);
        if (error) throw error;
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          const updatedFile = { ...file, content_base64: base64 };
          setSelectedFile(updatedFile);
          setFiles(prev => prev.map(f => f.id === file.id ? updatedFile : f));
        };
        reader.readAsDataURL(data);
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de charger l'aperçu du fichier.", variant: "destructive" });
      }
    }
  };

  const uploadFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
      if (uploadError) throw uploadError;

      const reader = new FileReader();
      const fileContentPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64Content = await fileContentPromise;

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('process-document', {
        body: { fileBase64: base64Content, mimeType: file.type }
      });
      if (analysisError) throw analysisError;

      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          original_filename: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          extracted_text: analysisData.extractedText,
          preview_text: analysisData.extractedText.substring(0, 200)
        })
        .select()
        .single();
      if (dbError) throw dbError;

      await loadFiles();
      toast({ title: "Document traité", description: `${file.name} a été analysé avec succès.` });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const sendChatMessage = async (message: string) => {
    if (!selectedFile?.full_text) return;
    setChatLoading(true);
    const newMessages: ChatMessage[] = [...chatMessages, { id: crypto.randomUUID(), role: 'user', content: message, timestamp: new Date().toISOString() }];
    setChatMessages(newMessages);

    try {
      const context = `Contexte du document "${selectedFile.name}":\n\n${selectedFile.full_text.substring(0, 12000)}`;
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          messages: [
            { role: 'system', content: 'Tu es un assistant expert en analyse de documents. Réponds précisément en te basant sur le contexte fourni.' },
            { role: 'user', content: `${context}\n\nQuestion: ${message}` }
          ],
          model: 'gpt-4o-mini'
        }
      });
      if (error) throw error;

      const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: data.generatedText, timestamp: new Date().toISOString() };
      setChatMessages([...newMessages, assistantMessage]);
    } catch (error) {
      toast({ title: "Erreur IA", variant: "destructive" });
    } finally {
      setChatLoading(false);
    }
  };

  return { files, selectedFile, chatMessages, isLoading, isProcessing, chatLoading, selectFile, uploadFile, sendChatMessage };
};