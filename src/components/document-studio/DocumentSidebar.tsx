import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, FileX, MoreHorizontal, Download, Trash2 } from 'lucide-react';
import type { UploadedFile } from './types.ts';

interface DocumentSidebarProps {
  files: UploadedFile[];
  selectedFile: UploadedFile | null;
  onSelectFile: (file: UploadedFile) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteFile: (id: string) => void;
  onDownloadFile: (file: UploadedFile) => void;
  isProcessing: boolean;
}

export const DocumentSidebar = ({ files, selectedFile, onSelectFile, onFileUpload, onDeleteFile, onDownloadFile, isProcessing }: DocumentSidebarProps) => {
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
    <div className="w-full md:w-80 border-r md:border-b-0 border-b bg-card flex-col">
      <div className="p-4 border-b">
        <label className="block">
          <input type="file" accept=".pdf,.docx,.txt" onChange={onFileUpload} className="hidden" />
          <Button className="w-full" variant="default" disabled={isProcessing}>
            <Plus className="w-4 h-4 mr-2" />
            {isProcessing ? 'Traitement...' : 'Ajouter un document'}
          </Button>
        </label>
      </div>
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredFiles.length === 0 ? (
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
                        {file.analysis && <Badge variant="secondary" className="text-xs">Analysé</Badge>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onDownloadFile(file)}><Download className="w-4 h-4 mr-2" />Télécharger</DropdownMenuItem>
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