import type { DocumentFile } from './types';
import { Card, CardContent } from '@/components/ui/card';

interface DocumentPreviewProps {
  selectedFile: DocumentFile | null;
  isProcessing: boolean;
  onDownloadFile: (file: DocumentFile) => void;
}

export const DocumentPreview = ({ selectedFile, isProcessing }: DocumentPreviewProps) => (
  <div className="flex-1 p-4 overflow-auto">
    {selectedFile ? (
      <Card className="h-full">
        <CardContent className="p-4">
          <h2 className="font-bold mb-2">{selectedFile.name}</h2>
          {selectedFile.content_base64 ? (
            <iframe
              src={`data:${selectedFile.type};base64,${selectedFile.content_base64}`}
              className="w-full h-[calc(100vh-200px)] border-0"
              title="Document Preview"
            />
          ) : (
            <p>Chargement de l'aperçu...</p>
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