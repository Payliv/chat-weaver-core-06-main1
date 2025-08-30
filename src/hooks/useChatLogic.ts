import { useEffect, useState, useCallback } from "react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageService } from "@/services/imageService";
import { StreamingService } from "@/services/streamingService";
import { AppGeneratorService } from "@/services/appGeneratorService";
import { ModelRouterService } from '@/services/modelRouterService';
import { PromptEngineerService } from '@/services/promptEngineerService';
import { conversationService } from "@/services/conversationService";
import { DocumentGeneratorService } from "@/services/documentGeneratorService";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  model?: string;
}

const initialMessages: Message[] = [];

const isVideoRequest = (message: string): boolean => {
  const videoKeywords = [
    'vidéo', 'video', 'film', 'clip', 'animation', 'séquence',
    'génère une vidéo', 'crée une vidéo', 'fais une vidéo',
    'video of', 'create video', 'generate video', 'make video'
  ];
  return videoKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
};

interface UseChatLogicProps {
  selectedModel: string;
  systemPrompt?: string;
  safeMode?: boolean;
  isLandingMode?: boolean;
  onAuthRequired?: () => void;
  personality?: string;
}

export const useChatLogic = ({ selectedModel, systemPrompt, safeMode, isLandingMode = false, onAuthRequired, personality = 'default' }: UseChatLogicProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showImageControls, setShowImageControls] = useState(false);
  const [autoRouterChoice, setAutoRouterChoice] = useState<string>('');
  const { toast } = useToast();

  const [streamingMessageContent, setStreamingMessageContent] = useState('');
  const [isAssistantStreaming, setIsAssistantStreaming] = useState(false);
  const [currentStreamingModel, setCurrentStreamingModel] = useState('');

  const createNewConversation = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const newConvo = await conversationService.createNewConversation(user.id);
      if (newConvo) {
        setCurrentConversationId(newConvo.id);
        setMessages([]);
      }
    } catch (e) {
      console.error('Nouveau chat échoué', e);
    }
  }, []);

  useEffect(() => {
    const handleSelectConversation = async (e: any) => {
      const id = e?.detail?.id as string;
      if (!id) return;
      setCurrentConversationId(id);
      const msgs = await conversationService.loadMessages(id);
      setMessages(msgs);
    };

    const handleNewConversation = () => {
      setCurrentConversationId(null);
      setMessages([]);
    };

    window.addEventListener('chat:select-conversation', handleSelectConversation);
    window.addEventListener('chat:new-conversation', handleNewConversation);
    
    return () => {
      window.removeEventListener('chat:select-conversation', handleSelectConversation);
      window.removeEventListener('chat:new-conversation', handleNewConversation);
    };
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsAssistantStreaming(true);
    setStreamingMessageContent('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (isLandingMode && onAuthRequired) {
          setMessages(prev => prev.slice(0, -1));
          setIsLoading(false);
          setIsAssistantStreaming(false);
          onAuthRequired();
          return;
        }
        throw new Error('Non authentifié');
      }

      let convoId = currentConversationId;
      if (!convoId) {
        const title = (content.split('\n')[0] || 'Nouvelle conversation').slice(0, 80);
        const newConvo = await conversationService.createNewConversation(user.id, title);
        if (!newConvo) throw new Error('Conversation non créée');
        convoId = newConvo.id;
        setCurrentConversationId(convoId);
      }

      const { data: inserted, error: insertErr } = await supabase.from('messages').insert({
        conversation_id: convoId,
        role: 'user',
        content,
        model: selectedModel
      }).select('id').maybeSingle();
      if (insertErr) throw insertErr;

      if (typeof content === 'string' && content.startsWith('data:')) {
        setIsLoading(false);
        setIsAssistantStreaming(false);
        return;
      }

      const isUpload = typeof content === 'string' && (content.startsWith('data:') || content.startsWith('http'));
      const wantsImage = !isUpload && ImageService.isImageRequest(content);
      const wantsVideo = !isUpload && isVideoRequest(content);
      const wantsApp = !isUpload && AppGeneratorService.isAppGenerationRequest(content);
      const docMatch = content.trim().match(/^\/doc\s+(pdf|docx|pptx)\s+([\s\S]+)/i);

      if (wantsApp || wantsImage || wantsVideo || docMatch || content.startsWith('/tts')) {
        // Handle special commands
        let assistantMessageContent = '';
        let modelUsed = selectedModel;

        if (wantsApp) {
          modelUsed = "app-generator";
          const tempMessage: Message = { id: `temp-${Date.now()}`, content: "🏗️ Génération de l'application en cours...", role: "assistant", timestamp: new Date(), model: modelUsed };
          setMessages(prev => [...prev, tempMessage]);
          setIsAssistantStreaming(false);
          try {
            const generatedApp = await AppGeneratorService.generateApp(content);
            assistantMessageContent = `${generatedApp.html}\n<style>${generatedApp.css}</style>\n<script>${generatedApp.javascript}</script>`;
            toast({ title: "Application générée !", description: "Votre application complète est prête." });
          } finally {
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
          }
        } else if (wantsImage) {
          modelUsed = "image-generator";
          assistantMessageContent = await ImageService.generateImage({ prompt: content, size: "1024x1024" });
        } else if (wantsVideo) {
          assistantMessageContent = "🎬 Pour générer des vidéos, utilisez le Générateur Vidéo accessible via le bouton dans le menu latéral.";
        } else if (content.startsWith('/tts')) {
          assistantMessageContent = "Les commandes TTS sont maintenant disponibles dans Studio TTS. Accédez-y via le menu latéral.";
        } else if (docMatch) {
          const [, format, text] = docMatch;
          if (format === 'pdf') assistantMessageContent = await DocumentGeneratorService.generateSimplePDF(text);
          else if (format === 'docx') assistantMessageContent = await DocumentGeneratorService.generateSimpleDOCX(text);
          else if (format === 'pptx') assistantMessageContent = await DocumentGeneratorService.generateSimplePPTX(text);
        }

        const assistantMessage: Message = { id: (Date.now() + 1).toString(), content: assistantMessageContent, role: "assistant", timestamp: new Date(), model: modelUsed };
        setMessages(prev => [...prev, assistantMessage]);
        await supabase.from('messages').insert({ conversation_id: convoId, role: 'assistant', content: assistantMessageContent, model: modelUsed });
        setIsLoading(false);
        setIsAssistantStreaming(false);
        return;
      }

      let actualModel = selectedModel;
      if (actualModel === 'auto-router') {
        const analysis = ModelRouterService.analyzeTask(content);
        actualModel = ModelRouterService.selectBestModel(analysis);
        setAutoRouterChoice(actualModel);
      }
      setCurrentStreamingModel(actualModel);

      const systemPromptContent = PromptEngineerService.createSystemPrompt({
        taskType: 'general',
        userPersonality: personality as any,
        conversationHistory: messages.map(m => m.content),
        isFirstMessage: messages.length <= 1
      });
      
      const enhancedUserPrompt = PromptEngineerService.enhanceUserPrompt(content, {
        taskType: 'general',
        conversationHistory: messages.map(m => m.content),
        isFirstMessage: messages.length <= 1
      });

      await StreamingService.streamWithFallback({
        messages: [{ role: 'system', content: systemPromptContent }, { role: 'user', content: enhancedUserPrompt }],
        model: actualModel,
        onChunk: (chunk) => setStreamingMessageContent(prev => prev + chunk),
        onComplete: async (fullText) => {
          const assistantMessage: Message = { id: (Date.now() + 1).toString(), content: fullText, role: "assistant", timestamp: new Date(), model: actualModel };
          setMessages(prev => [...prev, assistantMessage]);
          setIsAssistantStreaming(false);
          setStreamingMessageContent('');
          setIsLoading(false);
          await supabase.from('messages').insert({ conversation_id: convoId, role: 'assistant', content: fullText, model: actualModel });
        },
        onError: async (error) => {
          const errorMessage: Message = { id: (Date.now() + 1).toString(), content: `Erreur: ${error.message}`, role: "assistant", timestamp: new Date(), model: actualModel };
          setMessages(prev => [...prev, errorMessage]);
          setIsAssistantStreaming(false);
          setStreamingMessageContent('');
          setIsLoading(false);
          await supabase.from('messages').insert({ conversation_id: convoId, role: 'assistant', content: errorMessage.content, model: actualModel });
        }
      });

    } catch (error) {
      const errorMessage: Message = { id: (Date.now() + 1).toString(), content: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`, role: "assistant", timestamp: new Date(), model: selectedModel };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      setIsAssistantStreaming(false);
    }
  }, [currentConversationId, isLandingMode, onAuthRequired, selectedModel, personality, messages]);

  const handleImageGenerated = useCallback((imageUrl: string) => {
    const assistantMessage: Message = { id: (Date.now() + 1).toString(), content: imageUrl, role: "assistant", timestamp: new Date(), model: "dalle-3" };
    setMessages(prev => [...prev, assistantMessage]);
  }, []);

  return {
    messages,
    isLoading,
    currentConversationId,
    showImageControls,
    autoRouterChoice,
    streamingMessageContent,
    isAssistantStreaming,
    currentStreamingModel,
    createNewConversation,
    handleSendMessage,
    handleImageGenerated,
    selectConversation: setCurrentConversationId,
    handleNewConversation: createNewConversation,
  };
};