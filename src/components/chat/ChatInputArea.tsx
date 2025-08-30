import React from 'react';
import { ChatInput } from "@/components/ChatInput"; // Assuming ChatInput is already modular
import type { Message } from '@/hooks/useChatLogic';

interface ChatInputAreaProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  selectedModel?: string;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSendMessage,
  disabled,
  isLoading,
  selectedModel,
}) => {
  return (
    <div className="border-t border-border bg-card/30 p-4">
      <ChatInput
        onSendMessage={onSendMessage}
        disabled={disabled}
        isLoading={isLoading}
        selectedModel={selectedModel}
      />
    </div>
  );
};