import React, { useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { StreamingMessage } from "@/components/StreamingMessage";
import { ModelStatusIndicator } from "@/components/ModelStatusIndicator";
import { MessageSquare } from "lucide-react";
import type { Message } from '@/hooks/useChatLogic';

interface ChatMessagesDisplayProps {
  messages: Message[];
  isAssistantStreaming: boolean;
  streamingMessageContent: string;
  isLoading: boolean;
  selectedModel: string;
  autoRouterChoice: string;
}

export const ChatMessagesDisplay: React.FC<ChatMessagesDisplayProps> = ({
  messages,
  isAssistantStreaming,
  streamingMessageContent,
  isLoading,
  selectedModel,
  autoRouterChoice,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, streamingMessageContent]);

  return (
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
            model={selectedModel} // Use selectedModel for consistency
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
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};