import { useEffect, useState, useRef, useCallback } from "react";
import { Document as DocxDocument, Packer, Paragraph } from "docx";
import PptxGenJS from "pptxgenjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ModelRouterService } from '@/services/modelRouterService';
import { PromptEngineerService } from '@/services/promptEngineerService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageService } from "@/services/imageService";
import { StreamingService } from "@/services/streamingService";
import { AppGeneratorService } from "@/services/appGeneratorService";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  model?: string;
}

const initialMessages: Message[] = [];

// Helper: Video request detection
const isVideoRequest = (message: string): boolean => {
  const videoKeywords = [
    'vidéo', 'video', 'film', 'clip', 'animation', 'séquence',
    'génère une vidéo', 'crée une vidéo', 'fais une vidéo',
    'video of', 'create video', 'generate video', 'make video'
  ];
  
  return videoKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );
};

// Helpers: generation of documents
const wrapText = (text: string, max = 90) =>
  text
    .split(/\r?\n/)
    .flatMap((line) => {
      const chunks: string[] = [];
      let current = line;
      while (current.length > max) {
        chunks.push(current.slice(0, max));
        current = current.slice(max);
      }
      chunks.push(current);
      return chunks;
    });

const createPdfDataUrl = async (text: string) => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const lineHeight = fontSize * 1.2;
  const margin = 50;
  
  let currentPage = pdfDoc.addPage();
  const { width, height } = currentPage.getSize();
  let y = height - margin;
  
  const lines = wrapText(text, Math.floor((width - 2 * margin) / (fontSize * 0.6)));
  
  lines.forEach((line) => {
    // Si on n'a plus de place sur la page, créer une nouvelle page
    if (y < margin + lineHeight) {
      currentPage = pdfDoc.addPage();
      y = height - margin;
    }
    
    currentPage.drawText(line || " ", { 
      x: margin, 
      y, 
      size: fontSize, 
      font,
      color: rgb(0, 0, 0)
    });
    y -= lineHeight;
  });
  
  return await pdfDoc.saveAsBase64({ dataUri: true });
};

const createDocxDataUrl = async (text: string) => {
  const doc = new DocxDocument({
    sections: [
      { 
        properties: {}, 
        children: text.split(/\r?\n/).map((line) => new Paragraph({
          text: line || " ",
          spacing: {
            after: 120,
          }
        }))
      },
    ],
  });
  const base64 = await Packer.toBase64String(doc);
  return `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`;
};

const createPptxDataUrl = async (text: string) => {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'A4', width: 10, height: 7.5 });
  
  // Diviser le texte en slides si trop long
  const maxCharsPerSlide = 800;
  const textChunks = [];
  
  if (text.length <= maxCharsPerSlide) {
    textChunks.push(text);
  } else {
    const paragraphs = text.split('\n');
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length > maxCharsPerSlide && currentChunk) {
        textChunks.push(currentChunk.trim());
        currentChunk = paragraph + '\n';
      } else {
        currentChunk += paragraph + '\n';
      }
    }
    
    if (currentChunk.trim()) {
      textChunks.push(currentChunk.trim());
    }
  }
  
  textChunks.forEach((chunk, index) => {
    const slide = pptx.addSlide();
    slide.addText(chunk, { 
      x: 0.5, 
      y: 1, 
      w: 9, 
      h: 5.5, 
      fontSize: 16,
      color: '000000',
      align: 'left',
      valign: 'top',
      wrap: true
    });
    
    if (textChunks.length > 1) {
      slide.addText(`${index + 1} / ${textChunks.length}`, {
        x: 8.5,
        y: 6.5,
        w: 1,
        h: 0.5,
        fontSize: 12,
        color: '666666'
      });
    }
  });
  
  const base64 = await pptx.write({ outputType: "base64" });
  return `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${base64}`;
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

  // State for streaming messages
  const [streamingMessageContent, setStreamingMessageContent] = useState('');
  const [isAssistantStreaming, setIsAssistantStreaming] = useState(false);
  const [currentStreamingModel, setCurrentStreamingModel] = useState('');

  const createNewConversation = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({ title: 'Nouvelle conversation', user_id: user.id })
        .select('id')
        .maybeSingle();
      if (convError) throw convError;
      if (!conv) throw new Error('Conversation non créée');
      setCurrentConversationId(conv.id as string);
      setMessages([]);
    } catch (e) {
      console.error('Nouveau chat échoué', e);
    }
  }, []);

  useEffect(() => {
    const handleSelectConversation = (e: any) => {
      const id = e?.detail?.id as string;
      if (!id) return;
      setCurrentConversationId(id);
      (async () => {
        const { data: msgs } = await supabase
          .from('messages')
          .select('id, content, role, created_at, model')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true });
        if (msgs) {
          setMessages(msgs.map((m: any) => ({
            id: m.id as string,
            content: m.content as string,
            role: m.role as 'user' | 'assistant',
            timestamp: new Date(m.created_at as string),
            model: m.model as string | undefined,
          }))
          );
        } else {
          setMessages([]);
        }
      })();
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
      let convoId = currentConversationId;
      if (!convoId) {
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
        const title = (content.split('\n')[0] || 'Nouvelle conversation').slice(0, 80);
        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .insert({ title, user_id: user.id })
          .select('id')
          .maybeSingle();
        if (convError) throw convError;
        if (!conv) throw new Error('Conversation non créée');
        convoId = conv.id as string;
        setCurrentConversationId(convoId);
      }

      const { data: inserted, error: insertErr } = await supabase.from('messages').insert({
        conversation_id: convoId,
        role: 'user',
        content,
        model: selectedModel
      }).select('id').maybeSingle();
      if (insertErr) throw insertErr;
      const insertedMessageId = inserted?.id as string | undefined;

      const { data: { user } } = await supabase.auth.getUser();
      
      const parallelTasks = [];
      
      if (user?.id) {
        parallelTasks.push(
          supabase.functions.invoke('openai-embed', { body: { input: [content] } })
            .then(({ data: embedRes, error: embedErr }) => {
              if (!embedErr && embedRes?.embeddings?.[0]) {
                return (supabase as any).from('embeddings').insert({
                  conversation_id: convoId,
                  message_id: insertedMessageId,
                  user_id: user.id,
                  content,
                  embedding: embedRes.embeddings[0] as any,
                });
              }
            })
            .catch(e => console.warn('Embedding store failed', e))
        );
      }

      parallelTasks.push(
        (async () => {
          try {
            const firstLine = String(content).split('\n')[0].trim();
            const candidate = firstLine ? firstLine.slice(0, 80) : 'Conversation';
            const { data: convRow } = await supabase
              .from('conversations')
              .select('id, title')
              .eq('id', convoId)
              .maybeSingle();
            const needsTitle = !convRow?.title || convRow.title === 'Nouvelle conversation';
            if (needsTitle && candidate) {
              await supabase.from('conversations').update({ title: candidate }).eq('id', convoId);
              window.dispatchEvent(new CustomEvent('chat:reload-conversations'));
            }
          } catch (e) {
            console.warn('Maj titre conversation échouée', e);
          }
        })()
      );

      Promise.all(parallelTasks).catch(e => console.warn('Background tasks failed:', e));

      if (typeof content === 'string' && content.startsWith('data:')) {
        setIsLoading(false);
        setIsAssistantStreaming(false);
        return;
      }

      const isUpload = typeof content === 'string' && (content.startsWith('data:') || content.startsWith('http'));
      const wantsImage = !isUpload && ImageService.isImageRequest(content);
      const wantsVideo = !isUpload && isVideoRequest(content);
      const wantsApp = !isUpload && AppGeneratorService.isAppGenerationRequest(content);
      
      if (wantsApp) {
        try {
          console.log("🏗️ Début génération application complète");
          
          const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            content: "🏗️ Génération de l'application en cours... Cela peut prendre quelques minutes.",
            role: "assistant",
            timestamp: new Date(),
            model: "app-generator"
          };
          setMessages(prev => [...prev, tempMessage]);
          setIsAssistantStreaming(false);

          const generatedApp = await AppGeneratorService.generateApp(content);
          
          setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
          
          const webContent = `${generatedApp.html}\n<style>${generatedApp.css}</style>\n<script>${generatedApp.javascript}</script>`;
          
          const appMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: webContent,
            role: "assistant",
            timestamp: new Date(),
            model: "app-generator"
          };
          
          setMessages(prev => [...prev, appMessage]);
          
          await supabase.from('messages').insert({
            conversation_id: convoId,
            role: 'assistant',
            content: webContent,
            model: "app-generator"
          });
          
          toast({
            title: "Application générée !",
            description: "Votre application complète est prête.",
          });
          
          return;
        } catch (error) {
          console.error("❌ Erreur génération app:", error);
          
          setMessages(prev => prev.filter(m => m.id.startsWith('temp-')));
          
          const errorMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: `Erreur génération application: ${error instanceof Error ? error.message : "Échec de la génération"}`,
            role: "assistant",
            timestamp: new Date(),
            model: "app-generator"
          };
          setMessages(prev => [...prev, errorMessage]);
          
          await supabase.from('messages').insert({
            conversation_id: convoId,
            role: 'assistant',
            content: errorMessage.content,
            model: "app-generator"
          });
          
          return;
        } finally {
          setIsLoading(false);
          setIsAssistantStreaming(false);
        }
      }

      if (wantsImage) {
        console.log("🎨 Génération d'image détectée");
        try {
          const imageUrl = await ImageService.generateImage({ prompt: content, size: "1024x1024" });
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: imageUrl,
            role: "assistant",
            timestamp: new Date(),
            model: "image-generator"
          };
          setMessages(prev => [...prev, assistantMessage]);
          await supabase.from('messages').insert({
            conversation_id: convoId,
            role: 'assistant',
            content: imageUrl,
            model: "image-generator"
          });
          return;
        } catch (error) {
          console.error("❌ Erreur génération image:", error);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Erreur génération image: ${error instanceof Error ? error.message : "Échec de la génération"}`,
            role: "assistant",
            timestamp: new Date(),
            model: selectedModel
          };
          setMessages(prev => [...prev, errorMessage]);
          await supabase.from('messages').insert({
            conversation_id: convoId,
            role: 'assistant',
            content: errorMessage.content,
            model: selectedModel
          });
          return;
        } finally {
          setIsLoading(false);
          setIsAssistantStreaming(false);
        }
      }

      if (wantsVideo) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "🎬 Pour générer des vidéos, utilisez le Générateur Vidéo accessible via le bouton dans le menu latéral. Il propose des modèles VEO2 et VEO3 avec des prompts optimisés pour la génération vidéo.",
          role: "assistant",
          timestamp: new Date(),
          model: selectedModel
        };
        setMessages(prev => [...prev, assistantMessage]);
        await supabase.from('messages').insert({
          conversation_id: convoId,
          role: 'assistant',
          content: assistantMessage.content,
          model: selectedModel
        });
        setIsLoading(false);
        setIsAssistantStreaming(false);
        return;
      }

      if (content.startsWith('/tts')) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Les commandes TTS sont maintenant disponibles dans Studio TTS. Accédez-y via le menu latéral.",
          role: "assistant",
          timestamp: new Date(),
          model: selectedModel
        };
        setMessages(prev => [...prev, assistantMessage]);
        await supabase.from('messages').insert({
          conversation_id: convoId,
          role: 'assistant',
          content: assistantMessage.content,
          model: selectedModel
        });
        setIsLoading(false);
        setIsAssistantStreaming(false);
        return;
      }

      const docMatch = content.trim().match(/^\/doc\s+(pdf|docx|pptx)\s+([\s\S]+)/i);
      if (docMatch) {
        const [, format, text] = docMatch;
        let dataUrl = '';
        if (format === 'pdf') {
          dataUrl = await createPdfDataUrl(text);
        } else if (format === 'docx') {
          dataUrl = await createDocxDataUrl(text);
        } else if (format === 'pptx') {
          dataUrl = await createPptxDataUrl(text);
        }
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: dataUrl,
          role: "assistant",
          timestamp: new Date(),
          model: selectedModel
        };
        setMessages(prev => [...prev, assistantMessage]);
        await supabase.from('messages').insert({
          conversation_id: convoId,
          role: 'assistant',
          content: dataUrl,
          model: selectedModel
        });
        setIsLoading(false);
        setIsAssistantStreaming(false);
        return;
      }

      let actualModel = selectedModel;
      let analysis = null;

      if (actualModel === 'auto-router') {
        console.log("🤖 Routage automatique activé");
        analysis = ModelRouterService.analyzePrompt(content);
        actualModel = ModelRouterService.selectBestModel(analysis);
        setAutoRouterChoice(actualModel);
        console.log(`🎯 Modèle sélectionné automatiquement: ${actualModel}`);
      }
      setCurrentStreamingModel(actualModel);

      const taskType = analysis?.type || 'general';
      const systemPromptContent = PromptEngineerService.createSystemPrompt({
        taskType,
        userPersonality: personality as any,
        conversationHistory: messages.map(m => m.content),
        isFirstMessage: messages.length === 0
      });
      
      const enhancedUserPrompt = PromptEngineerService.enhanceUserPrompt(content, {
        taskType,
        conversationHistory: messages.map(m => m.content),
        isFirstMessage: messages.length === 0
      });

      const messagesForStream = [
        { role: 'system', content: systemPromptContent },
        { role: 'user', content: enhancedUserPrompt }
      ];

      await StreamingService.streamWithFallback({
        messages: messagesForStream,
        model: actualModel,
        onChunk: (chunk) => {
          setStreamingMessageContent(prev => prev + chunk);
        },
        onComplete: async (fullText) => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: fullText,
            role: "assistant",
            timestamp: new Date(),
            model: actualModel
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsAssistantStreaming(false);
          setStreamingMessageContent('');
          setIsLoading(false);
          await supabase.from('messages').insert({
            conversation_id: convoId,
            role: 'assistant',
            content: fullText,
            model: actualModel
          });
        },
        onError: async (error) => {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
            role: "assistant",
            timestamp: new Date(),
            model: actualModel
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsAssistantStreaming(false);
          setStreamingMessageContent('');
          setIsLoading(false);
          await supabase.from('messages').insert({
            conversation_id: convoId,
            role: 'assistant',
            content: errorMessage.content,
            model: actualModel
          });
        }
      });

    } catch (error) {
      console.error('Erreur envoi message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
        role: "assistant",
        timestamp: new Date(),
        model: selectedModel
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      setIsAssistantStreaming(false);
    }
  }, [currentConversationId, isLandingMode, onAuthRequired, selectedModel, personality, messages]);

  const handleImageGenerated = useCallback((imageUrl: string) => {
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: imageUrl,
      role: "assistant",
      timestamp: new Date(),
      model: "dalle-3"
    };
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
    selectConversation: setCurrentConversationId, // Expose setter for external control
    handleNewConversation: createNewConversation, // Alias for clarity
  };
};