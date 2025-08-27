import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DocumentGeneratorService } from '@/services/documentGeneratorService';
import type { UploadedFile, ChatMessage, RightPanelView } from '@/components/document-studio/types';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configuration pour le worker de pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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

  // Ref pour stocker les embeddings du document sélectionné
  const documentEmbeddingsRef = useRef<number[][] | null>(null);
  const documentChunksRef = useRef<string[] | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = useCallback(() => {
    setLoading(true);
    try {
      const savedFiles = localStorage.getItem('document_studio_files');
      if (savedFiles) {
        const files: UploadedFile[] = JSON.parse(savedFiles);
        setUploadedFiles(files);
        if (files.length > 0 && !selectedFile) {
          selectFile(files[0]);
        }
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  const saveFilesToStorage = (files: UploadedFile[]) => {
    localStorage.setItem('document_studio_files', JSON.stringify(files));
  };

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
    setSelectedFile(file);
    if (file) {
      loadChatHistory(file.id);
      // Charger les embeddings et chunks du document sélectionné
      if (file.full_text && (!file.embeddings || file.embeddings.length === 0)) {
        setIsProcessing(true);
        try {
          const chunks = chunkText(file.full_text);
          const embeddings = await generateEmbeddings(chunks);
          documentEmbeddingsRef.current = embeddings;
          documentChunksRef.current = chunks;
          updateFile({ ...file, embeddings });
        } catch (error) {
          console.error('Error generating embeddings for selected file:', error);
          toast({ title: "Erreur", description: "Impossible de générer les embeddings pour le document.", variant: "destructive" });
        } finally {
          setIsProcessing(false);
        }
      } else {
        documentEmbeddingsRef.current = file.embeddings || null;
        documentChunksRef.current = file.full_text ? chunkText(file.full_text) : null;
      }
      setRightPanelView('preview'); // Revenir à la prévisualisation après sélection
    } else {
      setChatMessages([]);
      documentEmbeddingsRef.current = null;
      documentChunksRef.current = null;
    }
  }, [loadChatHistory]);

  const updateFile = (updatedFile: UploadedFile) => {
    const updatedFiles = uploadedFiles.map(f => f.id === updatedFile.id ? updatedFile : f);
    setUploadedFiles(updatedFiles);
    saveFilesToStorage(updatedFiles);
    setSelectedFile(updatedFile);
  };

  const handleFileUpload = async (file: File) => {
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type)) {
      toast({ title: "Format non supporté", description: "Veuillez uploader un fichier .pdf, .docx, ou .txt.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let extractedText = '';
      if (file.type === 'application/pdf') {
        const loadingTask = pdfjs.getDocument({ data: atob(base64Content) });
        const pdf = await loadingTask.promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            text += textContent.items.map((item: any) => item.str).join(' ');
        }
        extractedText = text;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (file.type === 'text/plain') {
        extractedText = await file.text();
      }

      // Générer les embeddings pour le nouveau document
      const chunks = chunkText(extractedText);
      const embeddings = await generateEmbeddings(chunks);

      const newFile: UploadedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        content: base64Content,
        full_text: extractedText,
        created_at: new Date().toISOString(),
        embeddings: embeddings,
      };

      const updatedFiles = [newFile, ...uploadedFiles];
      setUploadedFiles(updatedFiles);
      saveFilesToStorage(updatedFiles);
      selectFile(newFile);

      toast({ title: "Document prêt", description: `${file.name} a été uploadé et son texte extrait.` });
    } catch (error) {
      console.error('Error processing file in handleFileUpload:', error);
      toast({ title: "Erreur", description: `Impossible de traiter le document. Détails: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
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

  const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
    const { data, error } = await supabase.functions.invoke('openai-embed', {
      body: { input: texts }
    });
    if (error) throw error;
    return data.embeddings;
  };

  const findRelevantChunks = async (query: string): Promise<string[]> => {
    if (!documentEmbeddingsRef.current || !documentChunksRef.current) return [];

    const queryEmbedding = (await generateEmbeddings([query]))[0];

    // Calculer la similarité cosinus (simple pour la démo)
    const similarities = documentEmbeddingsRef.current.map((docEmbedding, index) => {
      let dotProduct = 0;
      for (let i = 0; i < queryEmbedding.length; i++) {
        dotProduct += queryEmbedding[i] * docEmbedding[i];
      }
      // Normalisation (assumant que les embeddings sont déjà normalisés)
      return { score: dotProduct, chunk: documentChunksRef.current![index] };
    });

    similarities.sort((a, b) => b.score - a.score);
    return similarities.slice(0, 3).map(s => s.chunk); // Retourne les 3 chunks les plus pertinents
  };

  const sendChatMessage = async (message: string) => {
    if (!selectedFile) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: message, timestamp: new Date().toISOString() };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const relevantChunks = await findRelevantChunks(message);
      const context = `Document: "${selectedFile.name}"\n\nContenu pertinent:\n${relevantChunks.join('\n---\n')}\n\nQuestion:`;
      
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          messages: [
            { role: 'system', content: 'Tu es un assistant IA spécialisé dans l\'analyse de documents. Réponds de manière précise en te basant sur le contenu fourni. Si le contenu pertinent ne contient pas la réponse, indique-le.' },
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
      toast({ title: "Erreur d'envoi", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
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
      toast({ title: "Erreur de résumé", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
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
      toast({ title: "Erreur de traduction", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
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
      toast({ title: "Erreur de conversion", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteFile = (id: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== id);
    setUploadedFiles(updatedFiles);
    saveFilesToStorage(updatedFiles);
    if (selectedFile?.id === id) {
      selectFile(updatedFiles[0] || null);
    }
    localStorage.removeItem(`document_chat_history_${id}`);
    toast({ title: "Fichier supprimé" });
  };

  const downloadFile = (file: UploadedFile, format?: 'pdf' | 'docx' | 'txt') => {
    let dataUri = `data:${file.type};base64,${file.content}`;
    let fileName = file.name;

    if (format === 'txt') {
      dataUri = `data:text/plain;base64,${btoa(file.full_text)}`;
      fileName = `${file.name.split('.')[0]}.txt`;
    } else if (format === 'pdf' && file.type !== 'application/pdf') {
      // Convert to PDF if not already PDF
      handleConvert('pdf');
      return;
    } else if (format === 'docx' && file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Convert to DOCX if not already DOCX
      handleConvert('docx');
      return;
    }

    const link = document.createElement('a');
    link.href = dataUri;
    link.download = fileName;
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