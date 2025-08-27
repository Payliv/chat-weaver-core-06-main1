import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Bot } from "lucide-react";

interface TypingIndicatorProps {
  modelName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ modelName = "AI" }) => {
  return (
    <div className="flex gap-4">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarFallback className="bg-message-assistant text-foreground">
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
          <span className="text-sm text-muted-foreground ml-2">
            {modelName} est en train de générer...
          </span>
        </div>
      </Card>
    </div>
  );
};