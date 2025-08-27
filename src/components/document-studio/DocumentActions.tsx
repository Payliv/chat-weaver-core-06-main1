import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileSignature, Languages, FileDown, FileUp, Loader2 } from 'lucide-react';
import type { UploadedFile } from './types.ts';

interface DocumentActionsProps {
  selectedFile: UploadedFile | null;
  isProcessing: boolean;
  onSummarize: (options: { type: string; style: string }) => Promise<void>;
  onTranslate: (lang: string) => Promise<void>;
  onConvert: (format: 'pdf' | 'docx') => void;
}

export const DocumentActions = ({ selectedFile, isProcessing, onSummarize, onTranslate, onConvert }: DocumentActionsProps) => {
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [summaryOptions, setSummaryOptions] = useState({ type: 'long', style: 'simple' });
  const [showTranslateDialog, setShowTranslateDialog] = useState(false);
  const [translateLang, setTranslateLang] = useState('en');

  const handleSummarizeClick = async () => {
    setShowSummaryDialog(false);
    await onSummarize(summaryOptions);
  };

  const handleTranslateClick = async () => {
    setShowTranslateDialog(false);
    await onTranslate(translateLang);
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold mb-2">Actions sur le document</h3>
      
      {!selectedFile ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          Sélectionnez un document pour activer les actions.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Résumé */}
          <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" disabled={isProcessing}>
                <FileSignature className="w-4 h-4 mr-2" />
                Résumer le document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Options de résumé</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div><label className="text-sm font-medium">Type de résumé</label><Select value={summaryOptions.type} onValueChange={(v) => setSummaryOptions(o => ({...o, type: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="long">Long et détaillé</SelectItem><SelectItem value="short">Court (contraction)</SelectItem></SelectContent></Select></div>
                <div><label className="text-sm font-medium">Style</label><Select value={summaryOptions.style} onValueChange={(v) => setSummaryOptions(o => ({...o, style: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="simple">Simple</SelectItem><SelectItem value="academic">Académique</SelectItem><SelectItem value="storytelling">Storytelling</SelectItem></SelectContent></Select></div>
                <Button onClick={handleSummarizeClick} className="w-full" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSignature className="w-4 h-4 mr-2" />}
                  Générer le résumé
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Traduction */}
          <Dialog open={showTranslateDialog} onOpenChange={setShowTranslateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" disabled={isProcessing}>
                <Languages className="w-4 h-4 mr-2" />
                Traduire le document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Options de traduction</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div><label className="text-sm font-medium">Traduire en</label><Select value={translateLang} onValueChange={setTranslateLang}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">Anglais</SelectItem><SelectItem value="es">Espagnol</SelectItem><SelectItem value="de">Allemand</SelectItem><SelectItem value="fr">Français</SelectItem></SelectContent></Select></div>
                <Button onClick={handleTranslateClick} className="w-full" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Languages className="w-4 h-4 mr-2" />}
                  Traduire le document
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Conversion */}
          <div className="space-y-2 border-t pt-4 mt-4">
            <h4 className="text-md font-semibold">Convertir le format</h4>
            <Button variant="outline" className="w-full" onClick={() => onConvert('pdf')} disabled={isProcessing || selectedFile.type.includes('pdf')}>
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
              Convertir en PDF
            </Button>
            <Button variant="outline" className="w-full" onClick={() => onConvert('docx')} disabled={isProcessing || selectedFile.type.includes('word')}>
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />}
              Convertir en Word
            </Button>
          </div>

          {/* Affichage des résultats (Résumé/Traduction) */}
          {(selectedFile.summary || selectedFile.translation) && (
            <div className="space-y-3 border-t pt-4 mt-4">
              <h4 className="text-md font-semibold">Résultats</h4>
              {selectedFile.summary && (
                <div className="p-3 bg-secondary/20 rounded-md">
                  <p className="font-medium text-sm flex items-center gap-2"><FileSignature className="w-4 h-4" /> Résumé ({selectedFile.summary.type})</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{selectedFile.summary.content}</p>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => { /* Logic to show full summary */ }}>Voir plus</Button>
                </div>
              )}
              {selectedFile.translation && (
                <div className="p-3 bg-secondary/20 rounded-md">
                  <p className="font-medium text-sm flex items-center gap-2"><Languages className="w-4 h-4" /> Traduction ({selectedFile.translation.lang})</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{selectedFile.translation.content}</p>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => { /* Logic to show full translation */ }}>Voir plus</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};