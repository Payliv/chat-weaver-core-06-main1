import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DocumentGeneratorService } from '@/services/documentGeneratorService';
import type { UploadedFile, ChatMessage, RightPanelView } from '@/components/document-studio/types';

const CHUNK_SIZE = 1000; // Caractères par chunk pour les embeddings et l'IA
const CHUNK_OVERLAP = 100; // Chevauchement entre les chunks

export const useDocumentStudio = () => {
  const { toast } = useToast();

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>('preview');

  const documentEmbeddingsRef = useRef<number[][] | null>(null);
  const documentChunksRef = useRef<string[] | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, user_id, original_filename, file_type, file_size, storage_path, extracted_text, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const files: UploadedFile[] = data.map(doc => ({
        id: doc.id,
        user_id: doc.user_id,
        name: doc.original_filename,
        type: doc.file_type,
        size: doc.file_size,
        content: '', // Will be loaded on demand
        full_text: doc.extracted_text || '',
        storage_path: doc.storage_path,
        created_at: doc.created_at,
      }));

      setUploadedFiles(files);
      if (files.length > 0 && !selectedFile) {
        await selectFile(files[0]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      toast({ title: "Erreur", description: "Impossible de charger les documents.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadChatHistory = useCallback((fileId: string) => {
    const savedChat = localStorage.getItem(`document_chat_history_${fileId}`);
    if (savedChat) {
      setChatMessages(JSON.parse(savedChat));
    } else {
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Bonjour ! Le document est prêt. Vous pouvez maintenant me poser des questions sur son contenu ou utiliser les actions IA pour le résumer ou le traduire.`,
        timestamp: new Date().toISOString()
      };
      setChatMessages([welcomeMessage]);
    }
  }, []);

  const saveChatHistory = (fileId: string, messages: ChatMessage[]) => {
    localStorage.setItem(`document_chat_history_${fileId}`, JSON.stringify(messages));
  };

  const selectFile = useCallback(async (file: UploadedFile | null) => {
    if (file && file.id === selectedFile?.id) return;

    setSelectedFile(file);
    if (file) {
      loadChatHistory(file.id);
      
      // Load file content for preview
      if (!file.content) {
        setIsProcessing(true);
        try {
          const { data, error } = await supabase.storage.from('documents').download(file.storage_path);
          if (error) throw error;
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Content = (reader.result as string).split(',')[1];
            const updatedFile = { ...file, content: base64Content };
            setSelectedFile(updatedFile);
            const updatedFiles = uploadedFiles.map(f => f.id === file.id ? updatedFile : f);
            setUploadedFiles(updatedFiles);
          };
          reader.readAsDataURL(data);
        } catch (error) {
          console.error("Error downloading file content:", error);
          toast({ title: "Erreur", description: "Impossible de charger le contenu du fichier.", variant: "destructive" });
        } finally {
          setIsProcessing(false);
        }
      }

      if (file.full_text) {
        documentChunksRef.current = chunkText(file.full_text);
        // Embeddings should be handled separately if needed
      }
      setRightPanelView('preview');
    } else {
      setChatMessages([]);
      documentEmbeddingsRef.current = null;
      documentChunksRef.current = null;
    }
  }, [loadChatHistory, selectedFile, uploadedFiles]);

  const updateFile = (updatedFile: UploadedFile) => {
    const updatedFiles = uploadedFiles.map(f => f.id === updatedFile.id ? updatedFile : f);
    setUploadedFiles(updatedFiles);
    setSelectedFile(updatedFile);
  };

  const handleFileUpload = async (file: File) => {
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type)) {
      toast({ title: "Format non supporté", description: "Veuillez uploader un fichier .pdf, .docx, ou .txt.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
      if (uploadError) throw uploadError;

      let extractedText = '';
      const reader = new FileReader();
      const fileContentPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64Content = await fileContentPromise;

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('file-analyze', {
        body: {
          fileBase64: base64Content,
          fileName: file.name,
          mime: file.type,
          prompt: 'Extrait tout le texte de ce document. Réponds uniquement avec le texte brut.'
        }
      });

      if (analysisError) throw analysisError;
      extractedText = analysisData.generatedText || '';

      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          original_filename: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          extracted_text: extractedText,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      await loadFiles();
      toast({ title: "Document téléversé", description: `${file.name} a été ajouté avec succès.` });
    } catch (error: any) {
      console.error('Error processing file:', error);
      toast({ title: "Erreur", description: error.message || `Impossible de traiter le document.`, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const chunkText = (text: string): string[] => {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
      chunks.push(text.substring(i, i + CHUNK_SIZE));
    }
    return chunks;
  };

  const sendChatMessage = async (message: string) => {
    if (!selectedFile) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: message, timestamp: new Date().toISOString() };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const context = `Document: "${selectedFile.name}"\n\nContenu:\n${selectedFile.full_text?.substring(0, 8000)}\n\nQuestion:`;
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          messages: [
            { role: 'system', content: 'Tu es un assistant IA spécialisé dans l\'analyse de documents. Réponds de manière précise en te basant sur le contenu fourni.' },
            { role: 'user', content: `${context}\n${message}` }
          ],
          model: 'gpt-4o-mini'
        }
      });
      if (error) throw error;

      const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: data.generatedText || 'Désolé, je n\'ai pas pu traiter votre demande.', timestamp: new Date().toISOString() };
      const finalMessages = [...updatedMessages, assistantMessage];
      setChatMessages(finalMessages);
      saveChatHistory(selectedFile.id, finalMessages);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSummarize = async (options: { type: string; style: string }) => {
    if (!selectedFile?.full_text) return;
    setIsProcessing(true);
    try {
      const prompt = `Fais un résumé ${options.type === 'long' ? 'détaillé' : 'court (contraction)'} du texte suivant, dans un style ${options.style}. Texte: ${selectedFile.full_text}`;
      const { data, error } = await supabase.functions.invoke('openai-chat', { body: { messages: [{ role: 'user', content: prompt }], model: 'gpt-4o-mini' } });
      if (error) throw error;
      
      updateFile({ ...selectedFile, summary: { type: `${options.type}/${options.style}`, content: data.generatedText } });
      toast({ title: "Résumé généré" });
      setRightPanelView('summary');
    } catch (error) {
      toast({ title: "Erreur de résumé", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async (lang: string) => {
    if (!selectedFile?.full_text) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', { body: { text: selectedFile.full_text, targetLang: lang } });
      if (error) throw error;
      
      updateFile({ ...selectedFile, translation: { lang, content: data.translatedText } });
      toast({ title: "Traduction terminée" });
      setRightPanelView('translation');
    } catch (error) {
      toast({ title: "Erreur de traduction", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvert = async (format: 'pdf' | 'docx') => {
    if (!selectedFile?.full_text) return;
    setIsProcessing(true);
    try {
      const dataUri = await DocumentGeneratorService.generateDocument({ content: selectedFile.full_text, type: format });
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = `${selectedFile.name.split('.')[0]}.${format}`;
      a.click();
      toast({ title: `Conversion en ${format.toUpperCase()} réussie` });
    } catch (error) {
      toast({ title: "Erreur de conversion", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteFile = async (id: string) => {
    const fileToDelete = uploadedFiles.find(f => f.id === id);
    if (!fileToDelete) return;

    try {
      await supabase.storage.from('documents').remove([fileToDelete.storage_path]);
      await supabase.from('documents').delete().eq('id', id);
      
      const updatedFiles = uploadedFiles.filter(f => f.id !== id);
      setUploadedFiles(updatedFiles);
      if (selectedFile?.id === id) {
        selectFile(updatedFiles[0] || null);
      }
      localStorage.removeItem(`document_chat_history_${id}`);
      toast({ title: "Fichier supprimé" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer le fichier.", variant: "destructive" });
    }
  };

  const downloadFile = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = `data:${file.type};base64,${file.content}`;
    link.download = file.name;
    link.click();
  };

  return {
    uploadedFiles,
    selectedFile,
    chatMessages,
    loading,
    isProcessing,
    chatLoading,
    rightPanelView,
    setRightPanelView,
    selectFile,
    handleFileUpload,
    sendChatMessage,
    handleSummarize,
    handleTranslate,
    handleConvert,
    deleteFile,
    downloadFile,
  };
};