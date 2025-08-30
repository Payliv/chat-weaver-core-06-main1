import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Download, FileType, Calendar, HardDrive } from 'lucide-react';
import type { DocumentFile } from './types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DocumentHistoryProps {
  files: DocumentFile[];
  selectedFile: DocumentFile | null;
  onSelectFile: (file: DocumentFile) => void;
  onDeleteFile: (id: string) => void;
  onDownloadFile: (file: DocumentFile) => void;
  loading: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const DocumentHistory = ({ files, selectedFile, onSelectFile, onDeleteFile, onDownloadFile, loading }: DocumentHistoryProps) => (
  <ScrollArea className="flex-1">
    <div className="p-4 space-y-2">
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Chargement des documents...</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Aucun document téléversé.</p>
      ) : (
        files.map(file => (
          <div
            key={file.id}
            className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedFile?.id === file.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50 border-transparent'}`}
            onClick={() => onSelectFile(file)}
          >
            <div className="flex items-start gap-3 mb-2">
              <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{file.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <FileType className="w-3 h-3" />
                  <span>{file.type.split('/').pop()?.toUpperCase() || 'FICHIER'}</span>
                  <HardDrive className="w-3 h-3" />
                  <span>{formatFileSize(file.size)}</span>
                  <Calendar className="w-3 h-3" />
                  <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true, locale: fr })}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onDownloadFile(file); }}>
                <Download className="w-4 h-4 mr-2" /> Télécharger
              </Button>
              <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  </ScrollArea>
);