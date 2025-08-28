import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Download } from 'lucide-react';
import type { DocumentFile } from './types';

interface DocumentHistoryProps {
  files: DocumentFile[];
  selectedFile: DocumentFile | null;
  onSelectFile: (file: DocumentFile) => void;
  onDeleteFile: (id: string) => void;
  onDownloadFile: (file: DocumentFile) => void;
  loading: boolean;
}

export const DocumentHistory = ({ files, selectedFile, onSelectFile, onDeleteFile, onDownloadFile, loading }: DocumentHistoryProps) => (
  <ScrollArea className="flex-1">
    <div className="p-4 space-y-2">
      {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}
      {!loading && files.map(file => (
        <div
          key={file.id}
          className={`p-2 rounded-lg cursor-pointer ${selectedFile?.id === file.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
          onClick={() => onSelectFile(file)}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium truncate flex-1">{file.name}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  </ScrollArea>
);