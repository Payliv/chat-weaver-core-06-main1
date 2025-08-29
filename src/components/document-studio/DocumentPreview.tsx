import type { DocumentFile } from './types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentPreviewProps {
  selectedFile: DocumentFile | null;
  isProcessing: boolean;
  onDownloadFile: (file: DocumentFile) => void;
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
          <h2 className="font-bold mb-2">{selectedFile.name}</h2>
          {/* Use public_url for PDF preview, fallback to text or base64 */}
          {selectedFile.public_url && selectedFile.type === 'application/pdf' ? (
            <iframe
              src={selectedFile.public_url}
              className="w-full flex-1 border-0"
              title="Document Preview"
            />
          ) : selectedFile.content_base64 ? (
            <iframe
              src={`data:${selectedFile.type};base64,${selectedFile.content_base64}`}
              className="w-full flex-1 border-0"
              title="Document Preview"
            />
          ) : selectedFile.full_text ? (
            <ScrollArea className="w-full flex-1 border rounded-md p-4 bg-muted/20 text-sm text-foreground">
              <div dangerouslySetInnerHTML={{ __html: formatTextForDisplay(selectedFile.full_text) }} />
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center flex-1 text-muted-foreground">
              <p>Chargement de l'aperçu ou extraction du texte...</p>
            </div>
          )}
        </CardContent>
      </Card>
    ) : (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Sélectionnez ou téléversez un document pour commencer.</p>
      </div>
    )}
  </div>
);