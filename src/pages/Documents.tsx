import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Download, 
  Trash2, 
  Upload, 
  MessageSquare, 
  Eye, 
  Globe, 
  RefreshCw,
  Search,
  ArrowLeft,
  Plus,
  Bot,
  User,
  Send,
  MoreHorizontal,
  FileX,
  Wand2,
  Languages,
  FileUp,
  FileDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentGeneratorService } from '@/services/documentGeneratorService';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // base64
  created_at: string;
  full_text?: string;
  analysis?: string;
  summary?: { type: string; content: string };
  translation?: { lang: string; content: string };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

type RightPanelView = 'analysis' | 'summary' | 'translation' | 'chat';

export default function Documents() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Data state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>('analysis');
  const [chatInput, setChatInput] = useState('');
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Dialog states
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [summaryOptions, setSummaryOptions] = useState({ type: 'long', style: 'simple' });
  const [showTranslateDialog, setShowTranslateDialog] = useState(false);
  const [translateLang, setTranslateLang] = useState('en');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (rightPanelView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, rightPanelView]);

  useEffect(() => {
    if (selectedFile) {
      loadChatHistory(selectedFile.id);
      setRightPanelView('analysis');
    } else {
      setChatMessages([]);
    }
  }, [selectedFile?.id]);

  const loadData = () => {
    setLoading(true);
    try {
      const savedFiles = localStorage.getItem('uploaded_files');
      if (savedFiles) {
        const files = JSON.parse(savedFiles);
        setUploadedFiles(files);
        if (files.length > 0 && !selectedFile) {
          setSelectedFile(files[0]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = (fileId: string) => {
    const savedChat = localStorage.getItem(`document_chat_${fileId}`);
    if (savedChat) {
      setChatMessages(JSON.parse(savedChat));
    } else {
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Bonjour ! Je peux vous aider à analyser ce document. ${selectedFile?.analysis ? 'Le document a déjà été analysé.' : 'Posez-moi vos questions.'}`,
        timestamp: new Date().toISOString()
      };
      setChatMessages([welcomeMessage]);
    }
  };

  const saveChatHistory = (messages: ChatMessage[]) => {
    if (selectedFile) {
      localStorage.setItem(`document_chat_${selectedFile.id}`, JSON.stringify(messages));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type)) {
      toast({
        title: "Format non supporté",
        description: "Veuillez uploader un fichier .pdf, .docx, ou .txt.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        const base64Content = result.split(',')[1];
        
        const newFile: UploadedFile = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          content: base64Content,
          created_at: new Date().toISOString()
        };

        // Extract text and analyze
        const { data, error } = await supabase.functions.invoke('file-analyze', {
          body: {
            fileBase64: base64Content,
            fileName: file.name,
            mime: file.type,
            prompt: 'Extrais l\'intégralité du texte de ce document. Ensuite, fournis un résumé détaillé de son contenu. Réponds en JSON avec les clés "full_text" et "summary".'
          }
        });

        if (error) throw error;

        try {
          const analysisResult = JSON.parse(data.generatedText);
          newFile.full_text = analysisResult.full_text;
          newFile.analysis = analysisResult.summary;
        } catch {
          newFile.analysis = data.generatedText;
        }

        const updatedFiles = [newFile, ...uploadedFiles];
        setUploadedFiles(updatedFiles);
        localStorage.setItem('uploaded_files', JSON.stringify(updatedFiles));
        setSelectedFile(newFile);

        toast({
          title: "Fichier traité",
          description: `${file.name} a été uploadé et analysé.`,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter le document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedFile || chatLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const context = `Document: "${selectedFile.name}"\n\nContenu:\n${selectedFile.full_text?.substring(0, 8000)}\n\nQuestion:`;

      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          messages: [
            { role: 'system', content: 'Tu es un assistant IA spécialisé dans l\'analyse de documents. Réponds de manière précise en te basant sur le contenu fourni.' },
            { role: 'user', content: `${context}\n${userMessage.content}` }
          ],
          model: 'gpt-4o-mini'
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.generatedText || 'Désolé, je n\'ai pas pu traiter votre demande.',
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setChatMessages(finalMessages);
      saveChatHistory(finalMessages);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedFile?.full_text) return;
    setShowSummaryDialog(false);
    setIsProcessing(true);
    try {
      const prompt = `Fais un résumé ${summaryOptions.type === 'long' ? 'détaillé' : 'court (contraction)'} du texte suivant, dans un style ${summaryOptions.style}. Texte: ${selectedFile.full_text}`;
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: { messages: [{ role: 'user', content: prompt }], model: 'gpt-4o-mini' }
      });
      if (error) throw error;
      
      const updatedFile = { ...selectedFile, summary: { type: `${summaryOptions.type}/${summaryOptions.style}`, content: data.generatedText } };
      updateSelectedFile(updatedFile);
      setRightPanelView('summary');
      toast({ title: "Résumé généré" });
    } catch (error) {
      toast({ title: "Erreur de résumé", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async () => {
    if (!selectedFile?.full_text) return;
    setShowTranslateDialog(false);
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text: selectedFile.full_text, targetLang: translateLang }
      });
      if (error) throw error;
      
      const updatedFile = { ...selectedFile, translation: { lang: translateLang, content: data.translatedText } };
      updateSelectedFile(updatedFile);
      setRightPanelView('translation');
      toast({ title: "Traduction terminée" });
    } catch (error) {
      toast({ title: "Erreur de traduction", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvert = async (format: 'pdf' | 'docx') => {
    if (!selectedFile?.full_text) return;
    setIsProcessing(true);
    try {
      const dataUri = await DocumentGeneratorService.generateDocument({
        content: selectedFile.full_text,
        type: format
      });
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = `${selectedFile.name.split('.')[0]}.${format}`;
      a.click();
      toast({ title: `Conversion en ${format.toUpperCase()} réussie` });
    } catch (error) {
      toast({ title: "Erreur de conversion", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSelectedFile = (updatedFile: UploadedFile) => {
    setSelectedFile(updatedFile);
    const updatedFiles = uploadedFiles.map(f => f.id === updatedFile.id ? updatedFile : f);
    setUploadedFiles(updatedFiles);
    localStorage.setItem('uploaded_files', JSON.stringify(updatedFiles));
  };

  const deleteFile = (id: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== id);
    setUploadedFiles(updatedFiles);
    localStorage.setItem('uploaded_files', JSON.stringify(updatedFiles));
    if (selectedFile?.id === id) {
      setSelectedFile(updatedFiles[0] || null);
    }
    toast({ title: "Fichier supprimé" });
  };

  const downloadFile = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = `data:${file.type};base64,${file.content}`;
    link.download = file.name;
    link.click();
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('text')) return '🗒️';
    return '📁';
  };

  const filteredFiles = uploadedFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Studio Documents</h1>
              <p className="text-sm text-muted-foreground">Analysez, traduisez et convertissez vos documents</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
        <div className={`${selectedFile ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r md:border-b-0 border-b bg-card flex-col`}>
          <div className="p-4 border-b">
            <label className="block">
              <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" />
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
                    <div key={file.id} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedFile?.id === file.id ? 'bg-primary/10 border-primary/20 border' : 'hover:bg-accent'}`} onClick={() => setSelectedFile(file)}>
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
                            <DropdownMenuItem onClick={() => downloadFile(file)}><Download className="w-4 h-4 mr-2" />Télécharger</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteFile(file.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>
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

        <div className={`${selectedFile ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {selectedFile ? (
            <>
              <div className="border-b bg-card p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="md:hidden flex-shrink-0"><ArrowLeft className="w-4 h-4" /></Button>
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
                        <DropdownMenuItem onClick={() => handleConvert('pdf')}><FileDown className="w-4 h-4 mr-2" />Convertir en PDF</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleConvert('docx')}><FileUp className="w-4 h-4 mr-2" />Convertir en Word</DropdownMenuItem>
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
                  <div className="flex flex-col h-full">
                    <ScrollArea className="flex-1 p-4"><div className="space-y-4">{chatMessages.map((message) => (<div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>{message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}</div><div className={`px-4 py-3 rounded-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}><div className="text-sm whitespace-pre-wrap">{message.content}</div><div className={`text-xs mt-2 opacity-70`}>{new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div></div></div></div>))} {chatLoading && (<div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><Bot className="w-4 h-4" /></div><div className="bg-secondary px-4 py-3 rounded-lg"><div className="flex items-center gap-1"><div className="w-2 h-2 bg-current rounded-full animate-pulse" /><div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} /><div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} /></div></div></div>)}</div><div ref={messagesEndRef} /></ScrollArea>
                    <div className="border-t p-4"><div className="flex gap-2"><Input placeholder="Posez votre question..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }} disabled={chatLoading} className="flex-1" /><Button onClick={sendChatMessage} disabled={!chatInput.trim() || chatLoading} size="sm"><Send className="w-4 h-4" /></Button></div></div>
                  </div>
                ) : (
                  <ScrollArea className="h-full"><div className="p-6 prose prose-sm max-w-none">
                    {rightPanelView === 'analysis' && selectedFile.analysis && (<div><h3>Analyse du document</h3><pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-secondary/20 p-4 rounded-lg">{selectedFile.analysis}</pre></div>)}
                    {rightPanelView === 'summary' && selectedFile.summary && (<div><h3>Résumé ({selectedFile.summary.type})</h3><pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-secondary/20 p-4 rounded-lg">{selectedFile.summary.content}</pre></div>)}
                    {rightPanelView === 'translation' && selectedFile.translation && (<div><h3>Traduction ({selectedFile.translation.lang})</h3><pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-secondary/20 p-4 rounded-lg">{selectedFile.translation.content}</pre></div>)}
                  </div></ScrollArea>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center"><div className="text-center"><Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">Sélectionnez un document</h3><p className="text-muted-foreground mb-4">Uploadez un document pour commencer</p><label><input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" /><Button><Plus className="w-4 h-4 mr-2" />Ajouter un document</Button></label></div></div>
          )}
        </div>
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
}