import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Mic, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  selectedModel?: string;
}

export const ChatInput = ({ onSendMessage, disabled, isLoading, selectedModel }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showPasteActions, setShowPasteActions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
        const text = await file.text();
        const header = `Fichier: ${file.name}\n\n`;
        const max = 60000;
        onSendMessage(header + (text.length > max ? text.slice(0, max) + `\n\n[Tronqué, taille ${text.length} caractères]` : text));
      } else {
        const dataUrl = await readFileAsDataUrl(file);
        onSendMessage(dataUrl);
      }
      toast({ title: "Fichier ajouté", description: `${file.name} a été ajouté au chat.` });
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de lire le fichier.", variant: "destructive" });
    } finally {
      e.target.value = ""; // reset input
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        // Ajouter l'audio au chat pour aperçu/téléchargement
        onSendMessage(`data:audio/webm;base64,${base64}`);

        // Voice recognition moved to TTS Studio
        toast({ title: "Enregistrement terminé", description: "Fonctionnalité vocale disponible dans Studio TTS" });
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: "Enregistrement…", description: "Appuyez à nouveau pour arrêter." });
    } catch (err) {
      toast({ title: "Micro non accessible", description: "Autorisez l'accès au micro.", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card/30">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrivez votre message... (Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne)"
                className="min-h-[60px] max-h-[200px] resize-none bg-background border-border pr-24 text-foreground placeholder:text-muted-foreground"
                disabled={disabled}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={handlePickFile}
                  aria-label="Ajouter une image ou un PDF"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={handleMicClick}
                  aria-label={isRecording ? "Arrêter l'enregistrement" : "Dictée vocale"}
                >
                  {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={!message.trim() || disabled}
              className="h-[60px] px-6 bg-gradient-primary hover:opacity-90 transition-opacity shadow-elegant"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Chatelix peut faire des erreurs. Vérifiez les informations importantes.
        </p>
      </div>
    </div>
  );
};
