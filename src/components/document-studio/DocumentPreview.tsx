import type { DocumentFile } from './types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, File, Loader2, FileType } from 'lucide-react'; // Added FileType icon
import { Badge } from '@/components/ui/badge'; // Added Badge for file type

interface DocumentPreviewProps {
  selectedFile: DocumentFile | null;
  isProcessing: boolean; // Added isProcessing prop
}

// Helper function to format text with basic markdown to HTML
const formatTextForDisplay = (text: string | null): string => {
  if (!text) return '';
  let formattedText = text;

  // Convert markdown headers to HTML headings
  formattedText = formattedText.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  formattedText = formattedText.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  formattedText = formattedText.replace(/^# (.*)$/gm, '<h1>$1</h1>');

  // Convert bold markdown to <strong>
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert italic markdown to <em>
  formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Convert newlines to <br> for simple paragraph breaks
  formattedText = formattedText.replace(/\n/g, '<br>');

  return formattedText;
};

export const DocumentPreview = ({ selectedFile, isProcessing }: DocumentPreviewProps) => (
  <div className="flex-1 p-4 overflow-auto">
    {selectedFile ? (
      <Card className="h-full">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">{selectedFile.name}</h2>
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileType className="w-3 h-3" />
              {selectedFile.type.split('/').pop()?.toUpperCase() || 'FICHIER'}
            </Badge>
          </div>
          
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p>Traitement du document...</p>
            </div>
          ) : selectedFile.public_url && selectedFile.type === 'application/pdf' ? (
            <iframe
              src={selectedFile.public_url}
              className="w-full flex-1 border rounded-md"
              title="Document Preview"
            />
          ) : selectedFile.public_url && selectedFile.type.startsWith('image/') ? (
            <img
              src={selectedFile.public_url}
              alt="Document Preview"
              className="w-full h-auto max-h-full object-contain border rounded-md flex-1"
            />
          ) : selectedFile.full_text ? (
            <ScrollArea className="w-full flex-1 border rounded-md p-4 bg-muted/20 text-sm text-foreground">
              <div dangerouslySetInnerHTML={{ __html: formatTextForDisplay(selectedFile.full_text) }} />
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center flex-1 text-muted-foreground">
              <File className="w-8 h-8 mb-2 opacity-50" />
              <p>Aucun aperçu disponible ou texte non extrait.</p>
            </div>
          )}
        </CardContent>
      </Card>
    ) : (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">Sélectionnez un document</p>
        <p className="text-sm">Téléversez ou choisissez un document pour commencer l'analyse.</p>
      </div>
    )}
  </div>
);