import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, FileX, MoreHorizontal, Download, Trash2, Loader2, FileText } from 'lucide-react';
import type { UploadedFile } from './types.ts';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface DocumentHistoryProps {
  files: UploadedFile[];
  selectedFile: UploadedFile | null;
  onSelectFile: (file: UploadedFile) => void;
  onDeleteFile: (id: string) => void;
  onDownloadFile: (file: UploadedFile, format?: 'pdf' | 'docx' | 'txt') => void;
  loading: boolean;
}

export const DocumentHistory = ({ files, selectedFile, onSelectFile, onDeleteFile, onDownloadFile, loading }: DocumentHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('text')) return '🗒️';
    return '📁';
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un document..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Chargement des documents...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileX className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Aucun document</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFiles.map((file) => (
                <div key={file.id} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedFile?.id === file.id ? 'bg-primary/10 border-primary/20 border' : 'hover:bg-accent'}`} onClick={() => onSelectFile(file)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getFileIcon(file.type)}</span>
                        <p className="font-medium truncate text-sm">{file.name}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onDownloadFile(file)}><Download className="w-4 h-4 mr-2" />Télécharger original</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownloadFile(file, 'txt')}><FileText className="w-4 h-4 mr-2" />Télécharger en TXT</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteFile(file.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};