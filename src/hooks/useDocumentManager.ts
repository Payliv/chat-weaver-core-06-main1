import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DocumentGeneratorService } from '@/services/documentGeneratorService';
import type { UploadedFile, ChatMessage } from '@/components/document-studio/types';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configuration pour le worker de pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export const useDocumentManager = () => {
  const { toast } = useToast();

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = useCallback(() => {
    setLoading(true);
    try {
      const savedFiles = localStorage.getItem('uploaded_files');
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
    localStorage.setItem('uploaded_files', JSON.stringify(files));
  };

  const loadChatHistory = useCallback((fileId: string) => {
    const savedChat = localStorage.getItem(`document_chat_${fileId}`);
    if (savedChat) {
      setChatMessages(JSON.parse(savedChat));
    } else {
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Bonjour ! Je peux vous aider à analyser ce document. ${selectedFile?.analysis ? 'Le document a déjà été analysé.' : 'Posez-moi vos questions.'}`,
        timestamp: new Date().toISOString()
      };
      setChatMessages([welcomeMessage]);
    }
  }, [selectedFile?.analysis]);

  const saveChatHistory = (fileId: string, messages: ChatMessage[]) => {
    localStorage.setItem(`document_chat_${fileId}`, JSON.stringify(messages));
  };

  const selectFile = useCallback((file: UploadedFile | null) => {
    setSelectedFile(file);
    if (file) {
      loadChatHistory(file.id);
    } else {
      setChatMessages([]);
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
      console.log('Starting file upload and processing for:', file.name);
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      console.log('File converted to Base64.');

      let extractedText = '';
      if (file.type === 'application/pdf') {
        console.log('Extracting text from PDF...');
        const loadingTask = pdfjs.getDocument({ data: atob(base64Content) });
        const pdf = await loadingTask.promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            text += textContent.items.map((item: any) => item.str).join(' ');
        }
        extractedText = text;
        console.log('PDF text extracted. Length:', extractedText.length);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        console.log('Extracting text from DOCX...');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
        console.log('DOCX text extracted. Length:', extractedText.length);
      } else if (file.type === 'text/plain') {
        console.log('Extracting text from TXT...');
        extractedText = await file.text();
        console.log('TXT text extracted. Length:', extractedText.length);
      }

      const newFile: UploadedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        content: base64Content,
        created_at: new Date().toISOString(),
        full_text: extractedText,
      };
      console.log('File object created, invoking Supabase function...');

      const { data, error } = await supabase.functions.invoke('file-analyze', {
        body: {
          textContent: extractedText,
          fileName: file.name,
          mime: file.type,
          prompt: 'Fournis un résumé détaillé du contenu de ce document. Réponds en JSON avec la clé "summary".'
        }
      });

      if (error) {
        console.error('Supabase function invocation error:', error);
        throw error;
      }
      console.log('Supabase function returned data.');

      try {
        const analysisResult = JSON.parse(data.generatedText);
        newFile.analysis = analysisResult.summary;
        console.log('AI analysis parsed successfully.');
      } catch (parseError) {
        console.warn('Failed to parse AI analysis as JSON, using raw text. Error:', parseError);
        newFile.analysis = data.generatedText;
      }

      const updatedFiles = [newFile, ...uploadedFiles];
      setUploadedFiles(updatedFiles);
      saveFilesToStorage(updatedFiles);
      selectFile(newFile);

      toast({ title: "Fichier traité", description: `${file.name} a été uploadé et analysé.` });
    } catch (error) {
      console.error('Error processing file in handleFileUpload:', error);
      toast({ title: "Erreur", description: `Impossible de traiter le document. Détails: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
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
      return 'summary';
    } catch (error) {
      toast({ title: "Erreur de résumé", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
    return 'analysis';
  };

  const handleTranslate = async (lang: string) => {
    if (!selectedFile?.full_text) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', { body: { text: selectedFile.full_text, targetLang: lang } });
      if (error) throw error;
      
      updateFile({ ...selectedFile, translation: { lang, content: data.translatedText } });
      toast({ title: "Traduction terminée" });
      return 'translation';
    } catch (error) {
      toast({ title: "Erreur de traduction", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
    return 'analysis';
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

  const deleteFile = (id: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== id);
    setUploadedFiles(updatedFiles);
    saveFilesToStorage(updatedFiles);
    if (selectedFile?.id === id) {
      selectFile(updatedFiles[0] || null);
    }
    localStorage.removeItem(`document_chat_${id}`);
    toast({ title: "Fichier supprimé" });
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