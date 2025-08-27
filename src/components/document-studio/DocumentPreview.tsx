import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Download, Loader2, FileText } from 'lucide-react';
import type { UploadedFile } from './types.ts';

interface DocumentPreviewProps {
  selectedFile: UploadedFile | null;
  isProcessing: boolean;
  onDownloadFile: (file: UploadedFile, format?: 'pdf' | 'docx' | 'txt') => void;
}

export const DocumentPreview = ({ selectedFile, isProcessing, onDownloadFile }: DocumentPreviewProps) => {
  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun document sélectionné</h3>
          <p className="text-muted-foreground mb-4">Uploadez un document ou sélectionnez-en un dans l'historique.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <h2 className="font-semibold text-lg">{selectedFile.name}</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => onDownloadFile(selectedFile)} disabled={isProcessing}>
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 p-6">
        {isProcessing ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p className="text-sm">Traitement du document...</p>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{selectedFile.full_text}</pre>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};