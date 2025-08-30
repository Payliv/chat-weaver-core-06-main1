import { useEffect, useState, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ImageControls } from "./ImageControls";
import { ModelStatusIndicator } from "./ModelStatusIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { PromptEngineerService } from '@/services/promptEngineerService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageService } from "@/services/imageService";
import { StreamingService } from "@/services/streamingService";
import { StreamingMessage } from "./StreamingMessage";
import { AppGeneratorService } from "@/services/appGeneratorService";
import { useNavigate } from "react-router-dom";
import { ModelRouterService } from '@/services/modelRouterService'; // Corrected import path

interface Message {
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

// Helper: Document request detection
const isDocumentRequest = (message: string): { isDocRequest: boolean; docType?: string; docPrompt?: string } => {
  const docKeywords = [
    'rapport de stage', 'contrat', 'location', 'contrat de travail', 'contrat de prestation',
    'email', 'e-mail', 'lettre de motivation', 'demande de stage', 'demande d\'emploi',
    'devis', 'facture', 'exposé scolaire', 'thèse', 'mémoire', 'document', 'génère un document'
  ];
  
  const lowerMessage = message.toLowerCase();
  for (const keyword of docKeywords) {
    if (lowerMessage.includes(keyword)) {
      return { isDocRequest: true, docType: keyword, docPrompt: message };
    }
  }
  return { isDocRequest: false };
};

interface ChatAreaProps {
  selectedModel: string;
  systemPrompt?: string;
  safeMode?: boolean;
  isLandingMode?: boolean;
  onAuthRequired?: () => void;
  personality?: string;
}

export const ChatArea = ({ selectedModel, systemPrompt, safeMode, isLandingMode = false, onAuthRequired, personality = 'default' }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showImageControls, setShowImageControls] = useState(false);
  const [autoRouterChoice, setAutoRouterChoice] = useState<string>('');
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // State for streaming messages
  const [streamingMessageContent, setStreamingMessageContent] = useState('');
  const [isAssistantStreaming, setIsAssistantStreaming] = useState(false);
  const [currentStreamingModel, setCurrentStreamingModel] = useState('');


  const createNewConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({ title: 'Nouvelle conversation', user_id: user.id })
        .select('id')
        .maybeSingle();
      if (convError) throw convError;
      setCurrentConversationId(conv?.id as string);
      setMessages([]);
    } catch (e) {
      console.error('Nouveau chat échoué', e);
    }
  };

  // Charger la dernière conversation (30 jours)
  useEffect(() => {
    const handleSelectConversation = (e: any) => {
      const id = e?.detail?.id as string;
      if (!id) return;
      setCurrentConversationId(id);
      // Charger messages pour cette conversation
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, streamingMessageContent]);

  const handleSendMessage = async (content: string) => {
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
      // Assurer l'existence d'une conversation
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

      // Sauvegarder le message utilisateur
      const { data: inserted, error: insertErr } = await supabase.from('messages').insert({
        conversation_id: convoId,
        role: 'user',
        content,
        model: selectedModel
      }).select('id').maybeSingle();
      if (insertErr) throw insertErr;
      const insertedMessageId = inserted?.id as string | undefined;

      // OPTIMISATION: Paralléliser tous les appels non-bloquants
      const { data: { user } } = await supabase.auth.getUser();
      
      const parallelTasks = [];
      
      // Tâche 1: Embedding (en arrière-plan)
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

      // Tâche 2: Mise à jour titre conversation (en arrière-plan)
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

      // Exécuter toutes les tâches en parallèle SANS bloquer la génération
      Promise.all(parallelTasks).catch(e => console.warn('Background tasks failed:', e));

      // Si upload (data URL), gérer image/PDF
      if (typeof content === 'string' && content.startsWith('data:')) {
        setIsLoading(false);
        setIsAssistantStreaming(false);
        return;
      }

      const isUpload = typeof content === 'string' && (content.startsWith('data:') || content.startsWith('http'));
      const wantsImage = !isUpload && ImageService.isImageRequest(content);
      const wantsVideo = !isUpload && isVideoRequest(content);
      const wantsApp = !isUpload && AppGeneratorService.isAppGenerationRequest(content);
      const { isDocRequest, docType, docPrompt } = isDocumentRequest(content);
      
      // Génération d'application complète
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

      // Génération d'image si le message la demande
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

      // Génération de vidéo si demandée
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

      // Redirection vers DocumentGenerator pour les requêtes de documents
      if (isDocRequest) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `📝 J'ai détecté une demande de document (${docType}). Je vous redirige vers le Générateur de Documents pour une génération plus précise.`,
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
        navigate(`/document-generator?prompt=${encodeURIComponent(docPrompt || content)}&type=${encodeURIComponent(docType || 'general')}`);
        return;
      }

      // Commandes spéciales désormais gérées par pages dédiées
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

      // Appel IA normal avec streaming
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
          // Save to Supabase
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
          // Save error message to Supabase
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
  };

  const handleImageGenerated = (imageUrl: string) => {
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: imageUrl,
      role: "assistant",
      timestamp: new Date(),
      model: "dalle-3"
    };
    setMessages(prev => [...prev, assistantMessage]);
  };


  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-background">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
            />
          ))}
          {isAssistantStreaming && (
            <StreamingMessage
              content={streamingMessageContent}
              model={currentStreamingModel}
              isStreaming={isAssistantStreaming}
            />
          )}
          {isLoading && !isAssistantStreaming && (
            <ModelStatusIndicator 
              selectedModel={selectedModel}
              isLoading={isLoading}
              autoRouterChoice={autoRouterChoice}
            />
          )}

          {messages.length === 0 && !isLoading && !isAssistantStreaming && (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
              <MessageSquare className="w-16 h-16 text-muted-foreground/50" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Commencez une nouvelle conversation
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Posez une question, demandez de l'aide, ou explorez les possibilités avec l'IA.
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>💡 Essayez: "Explique-moi comment..."</p>
                  <p>🎨 Ou: "Génère une image de..."</p>
                  <p>💻 Ou: "Crée une application..."</p>
                </div>
              </div>
            </div>
          )}
          {/* Invisible element for scrolling to bottom */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {showImageControls && (
        <div className="border-t border-border bg-card/50 p-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              🎨 Studio DALL-E - Génération d'Images IA
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Créez des images avec DALL-E 3, éditez avec DALL-E 2 ou générez des variations
            </p>
          </div>
          <ImageControls onImageGenerated={handleImageGenerated} />
        </div>
      )}
      
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} isLoading={isLoading} selectedModel={selectedModel} />
    </div>
  );
};