import { useEffect, useState, useRef } from "react";
import { useChatLogic } from '@/hooks/useChatLogic';
import { ChatMessagesDisplay } from './chat/ChatMessagesDisplay';
import { ChatInputArea } from './chat/ChatInputArea';
import { SpecialContentRenderer } from './chat/SpecialContentRenderer';

interface ChatAreaProps {
  selectedModel: string;
  systemPrompt?: string;
  safeMode?: boolean;
  isLandingMode?: boolean;
  onAuthRequired?: () => void;
  personality?: string;
}

export const ChatArea = ({ selectedModel, systemPrompt, safeMode, isLandingMode = false, onAuthRequired, personality = 'default' }: ChatAreaProps) => {
  const {
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
    selectConversation,
    handleNewConversation,
  } = useChatLogic({ selectedModel, systemPrompt, safeMode, isLandingMode, onAuthRequired, personality });

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <ChatMessagesDisplay
        messages={messages}
        isAssistantStreaming={isAssistantStreaming}
        streamingMessageContent={streamingMessageContent}
        isLoading={isLoading}
        selectedModel={selectedModel}
        autoRouterChoice={autoRouterChoice}
      />

      <SpecialContentRenderer
        showImageControls={showImageControls}
        onImageGenerated={handleImageGenerated}
      />
      
      <ChatInputArea
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        isLoading={isLoading}
        selectedModel={selectedModel}
      />
    </div>
  );
};