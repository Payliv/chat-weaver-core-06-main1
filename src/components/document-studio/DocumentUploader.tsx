import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2 } from 'lucide-react';

interface DocumentUploaderProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
}

export const DocumentUploader = ({ onFileUpload, isProcessing }: DocumentUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="rounded-none border-none shadow-none">
      <CardContent className="p-4 border-b">
        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={onFileUpload} className="hidden" />
        <Button className="w-full" variant="default" disabled={isProcessing} onClick={handleUploadClick}>
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Ajouter un document
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Formats supportés : .pdf, .docx, .txt
        </p>
      </CardContent>
    </Card>
  );
};