import React from 'react';
import { ImageControls } from "@/components/ImageControls";
import { CardContent } from '@/components/ui/card';
import { Image } from 'lucide-react'; // Using Image icon for DALL-E studio
import type { Message } from '@/hooks/useChatLogic';

interface SpecialContentRendererProps {
  showImageControls: boolean;
  onImageGenerated: (imageUrl: string, type: 'generation' | 'edit' | 'variation') => void;
}

export const SpecialContentRenderer: React.FC<SpecialContentRendererProps> = ({
  showImageControls,
  onImageGenerated,
}) => {
  if (!showImageControls) return null;

  return (
    <div className="border-t border-border bg-card/50 p-4">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Image className="w-4 h-4" />
          Studio DALL-E - Génération d'Images IA
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Créez des images avec DALL-E 3, éditez avec DALL-E 2 ou générez des variations
        </p>
      </div>
      <ImageControls onImageGenerated={onImageGenerated} />
    </div>
  );
};