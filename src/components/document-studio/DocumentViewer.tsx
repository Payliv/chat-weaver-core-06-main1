import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, MessageSquare, Wand2, FileDown, FileUp, Upload } from 'lucide-react';
import type { UploadedFile, RightPanelView } from './types.ts';
import { ChatView } from './ChatView.tsx';

interface DocumentViewerProps {
  selectedFile: UploadedFile | null;
  chatMessages: any[];
  chatLoading: boolean;
  onSendMessage: (message: string) => void;
  onSummarize: (options: { type: string; style: string }) => Promise<string | undefined>;
  onTranslate: (lang: string) => Promise<string | undefined>;
  onConvert: (format: 'pdf' | 'docx') => void;
  isProcessing: boolean;
}

export const DocumentViewer = ({ selectedFile, chatMessages, chatLoading, onSendMessage, onSummarize, onTranslate, onConvert, isProcessing }: DocumentViewerProps) => {
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>('analysis');
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [summaryOptions, setSummaryOptions] = useState({ type: 'long', style: 'simple' });
  const [showTranslateDialog, setShowTranslateDialog] = useState(false);
  const [translateLang, setTranslateLang] = useState('en');

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('text')) return '🗒️';
    return '📁';
  };

  const handleSummarize = async () => {
    setShowSummaryDialog(false);
    const newView = await onSummarize(summaryOptions);
    if (newView) setRightPanelView(newView as RightPanelView);
  };

  const handleTranslate = async () => {
    setShowTranslateDialog(false);
    const newView = await onTranslate(translateLang);
    if (newView) setRightPanelView(newView as RightPanelView);
  };

  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sélectionnez un document</h3>
          <p className="text-muted-foreground mb-4">Uploadez un document pour commencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b bg-card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{getFileIcon(selectedFile.type)}</span>
            <div className="min-w-0">
              <h2 className="font-semibold truncate">{selectedFile.name}</h2>
              <p className="text-sm text-muted-foreground">{new Date(selectedFile.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="default" disabled={isProcessing}><Wand2 className="w-4 h-4 mr-2" />Actions IA</Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DialogTrigger asChild><DropdownMenuItem onSelect={() => setShowSummaryDialog(true)}>Résumer</DropdownMenuItem></DialogTrigger>
                <DialogTrigger asChild><DropdownMenuItem onSelect={() => setShowTranslateDialog(true)}>Traduire</DropdownMenuItem></DialogTrigger>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onConvert('pdf')}><FileDown className="w-4 h-4 mr-2" />Convertir en PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onConvert('docx')}><FileUp className="w-4 h-4 mr-2" />Convertir en Word</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant={rightPanelView === 'analysis' ? 'secondary' : 'ghost'} onClick={() => setRightPanelView('analysis')} className="flex-1"><Eye className="w-4 h-4 mr-2" />Analyse</Button>
          <Button variant={rightPanelView === 'chat' ? 'secondary' : 'ghost'} onClick={() => setRightPanelView('chat')} className="flex-1"><MessageSquare className="w-4 h-4 mr-2" />Chat IA</Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {rightPanelView === 'chat' ? (
          <ChatView messages={chatMessages} isLoading={chatLoading} onSendMessage={onSendMessage} />
        ) : (
          <ScrollArea className="h-full">
            <div className="p-6 prose prose-sm max-w-none">
              {rightPanelView === 'analysis' && selectedFile.analysis && (<div><h3>Analyse du document</h3><pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-secondary/20 p-4 rounded-lg">{selectedFile.analysis}</pre></div>)}
              {rightPanelView === 'summary' && selectedFile.summary && (<div><h3>Résumé ({selectedFile.summary.type})</h3><pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-secondary/20 p-4 rounded-lg">{selectedFile.summary.content}</pre></div>)}
              {rightPanelView === 'translation' && selectedFile.translation && (<div><h3>Traduction ({selectedFile.translation.lang})</h3><pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-secondary/20 p-4 rounded-lg">{selectedFile.translation.content}</pre></div>)}
            </div>
          </ScrollArea>
        )}
      </div>
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Options de résumé</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label>Type de résumé</label><Select value={summaryOptions.type} onValueChange={(v) => setSummaryOptions(o => ({...o, type: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="long">Long</SelectItem><SelectItem value="short">Court</SelectItem></SelectContent></Select></div>
            <div><label>Style</label><Select value={summaryOptions.style} onValueChange={(v) => setSummaryOptions(o => ({...o, style: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="simple">Simple</SelectItem><SelectItem value="academic">Académique</SelectItem></SelectContent></Select></div>
            <Button onClick={handleSummarize}>Générer le résumé</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showTranslateDialog} onOpenChange={setShowTranslateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Options de traduction</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label>Traduire en</label><Select value={translateLang} onValueChange={setTranslateLang}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">Anglais</SelectItem><SelectItem value="es">Espagnol</SelectItem><SelectItem value="de">Allemand</SelectItem><SelectItem value="fr">Français</SelectItem></SelectContent></Select></div>
            <Button onClick={handleTranslate}>Traduire le document</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};