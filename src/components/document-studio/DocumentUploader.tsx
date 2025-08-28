import { Upload, Loader2 } from 'lucide-react';

interface DocumentUploaderProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
}

export const DocumentUploader = ({ onFileUpload, isProcessing }: DocumentUploaderProps) => (
  <div className="p-4 border-b">
    <label htmlFor="file-upload" className="cursor-pointer">
      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-medium">Traitement en cours...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm font-medium">Téléverser un document</span>
            <span className="text-xs text-muted-foreground">PDF, DOCX, TXT</span>
          </div>
        )}
      </div>
    </label>
    <input id="file-upload" type="file" className="hidden" onChange={onFileUpload} disabled={isProcessing} />
  </div>
);