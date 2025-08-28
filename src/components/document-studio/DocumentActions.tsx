import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wand2, FileText, Languages, Loader2, Download } from 'lucide-react';
import type { DocumentFile, ChatMessage } from './types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area'; // Added import

interface DocumentActionsProps {
  selectedFile: DocumentFile | null;
  onSummarize: (text: string) => Promise<void>;
  onTranslate: (text: string, targetLang: string) => Promise<string | null>;
  onConvert: (file: DocumentFile, targetFormat: 'pdf' | 'docx' | 'txt') => Promise<string | null>;
  onSendMessage: (message: string) => void;
}

const SUPPORTED_TRANSLATION_LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'Anglais' },
  { code: 'es', name: 'Espagnol' },
  { code: 'de', name: 'Allemand' },
  { code: 'it', name: 'Italien' },
];

export const DocumentActions = ({ selectedFile, onSummarize, onTranslate, onConvert, onSendMessage }: DocumentActionsProps) => {
  const { toast } = useToast();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!selectedFile?.full_text) {
      toast({ title: "Erreur", description: "Aucun document sélectionné ou texte non extrait.", variant: "destructive" });
      return;
    }
    setIsSummarizing(true);
    try {
      await onSummarize(selectedFile.full_text);
      toast({ title: "Succès", description: "Le résumé a été ajouté au chat." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de résumer le document.", variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleTranslate = async () => {
    if (!selectedFile?.full_text) {
      toast({ title: "Erreur", description: "Aucun document sélectionné ou texte non extrait.", variant: "destructive" });
      return;
    }
    setIsTranslating(true);
    try {
      const result = await onTranslate(selectedFile.full_text, targetLanguage);
      if (result) {
        setTranslatedText(result);
        toast({ title: "Succès", description: "Le document a été traduit." });
      } else {
        toast({ title: "Erreur", description: "La traduction n'a pas retourné de texte.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de traduire le document.", variant: "destructive" });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleConvert = async (targetFormat: 'pdf' | 'docx' | 'txt') => {
    if (!selectedFile) {
      toast({ title: "Erreur", description: "Aucun document sélectionné.", variant: "destructive" });
      return;
    }
    setIsConverting(true);
    setConvertedFileUrl(null);
    try {
      const url = await onConvert(selectedFile, targetFormat);
      if (url) {
        setConvertedFileUrl(url);
        toast({ title: "Succès", description: `Document converti en ${targetFormat.toUpperCase()}.` });
      } else {
        toast({ title: "Erreur", description: "La conversion n'a pas retourné de fichier.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de convertir le document.", variant: "destructive" });
    } finally {
      setIsConverting(false);
    }
  };

  const downloadConvertedFile = () => {
    if (convertedFileUrl) {
      const a = document.createElement('a');
      a.href = convertedFileUrl;
      a.download = `converted-document.${convertedFileUrl.split('.').pop()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const downloadTranslatedText = () => {
    if (translatedText) {
      const blob = new Blob([translatedText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translated-document-${targetLanguage}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-6">
        {/* Summarize */}
        <div className="p-4 border rounded-lg space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Wand2 className="w-4 h-4" /> Résumer le document
          </h3>
          <Button
            onClick={handleSummarize}
            disabled={!selectedFile?.full_text || isSummarizing}
            className="w-full"
          >
            {isSummarizing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Résumé...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" /> Résumer
              </>
            )}
          </Button>
        </div>

        {/* Translate */}
        <div className="p-4 border rounded-lg space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Languages className="w-4 h-4" /> Traduire le document
          </h3>
          <div>
            <Label htmlFor="target-language">Langue cible</Label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger id="target-language">
                <SelectValue placeholder="Sélectionner une langue" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_TRANSLATION_LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleTranslate}
            disabled={!selectedFile?.full_text || isTranslating}
            className="w-full"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traduction...
              </>
            ) : (
              <>
                <Languages className="w-4 h-4 mr-2" /> Traduire
              </>
            )}
          </Button>
          {translatedText && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium">Traduction ({SUPPORTED_TRANSLATION_LANGUAGES.find(l => l.code === targetLanguage)?.name}):</p>
              <div className="p-2 border rounded-md bg-muted text-sm max-h-40 overflow-y-auto">
                {translatedText}
              </div>
              <Button onClick={downloadTranslatedText} size="sm" variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" /> Télécharger la traduction
              </Button>
            </div>
          )}
        </div>

        {/* Convert */}
        <div className="p-4 border rounded-lg space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" /> Convertir le document
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleConvert('pdf')}
              disabled={!selectedFile || isConverting || selectedFile.type === 'application/pdf'}
              variant="outline"
            >
              {isConverting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Vers PDF
            </Button>
            <Button
              onClick={() => handleConvert('docx')}
              disabled={!selectedFile || isConverting || selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
              variant="outline"
            >
              {isConverting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Vers DOCX
            </Button>
            <Button
              onClick={() => handleConvert('txt')} // Added TXT conversion option
              disabled={!selectedFile || isConverting || selectedFile.type === 'text/plain'}
              variant="outline"
            >
              {isConverting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Vers TXT
            </Button>
          </div>
          {convertedFileUrl && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium">Fichier converti :</p>
              <Button onClick={downloadConvertedFile} size="sm" variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" /> Télécharger le fichier converti
              </Button>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};