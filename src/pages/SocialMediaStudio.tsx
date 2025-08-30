import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Sparkles, History, Copy, Loader2, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface GenerationHistory {
  id: string;
  content_type: string;
  prompt: string;
  generated_content: string;
  created_at: string;
}

const contentTypes = [
  { value: 'instagram_post', label: 'Post Instagram' },
  { value: 'facebook_post', label: 'Post Facebook' },
  { value: 'tiktok_post', label: 'Post TikTok' },
  { value: 'linkedin_post', label: 'Post LinkedIn' },
  { value: 'tweet', label: 'Tweet (X)' },
  { value: 'product_description', label: 'Fiche Produit' },
  { value: 'youtube_video_script', label: 'Script Vidéo YouTube' },
  { value: 'facebook_video_script', label: 'Script Vidéo Facebook' },
  { value: 'tiktok_video_script', label: 'Script Vidéo TikTok' },
];

export default function SocialMediaStudio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contentType, setContentType] = useState('instagram_post');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [history, setHistory] = useState<GenerationHistory[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from('social_media_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) {
      console.error('Error loading history:', error);
    } else {
      setHistory(data as GenerationHistory[]);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer un sujet ou une description.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setGeneratedContent('');
    try {
      const { data, error } = await supabase.functions.invoke('social-media-generator', {
        body: { contentType, prompt }
      });

      if (error) throw error;

      setGeneratedContent(data.generatedContent);

      // Save to history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('social_media_generations').insert({
          user_id: user.id,
          content_type: contentType,
          prompt,
          generated_content: data.generatedContent
        });
        await loadHistory();
      }
    } catch (error: any) {
      toast({ title: "Erreur de génération", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    // Strip markdown for clean copy
    const plainText = text
      .replace(/^#+\s/gm, '') // remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
      .replace(/\*(.*?)\*/g, '$1') // remove italic
      .replace(/^\s*[-*]\s/gm, ''); // remove list bullets

    navigator.clipboard.writeText(plainText);
    toast({ title: "Copié!", description: "Le contenu a été copié dans le presse-papiers." });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Share2 className="w-8 h-8 text-primary" />
              Social Studio
            </h1>
            <p className="text-muted-foreground">
              Générez du contenu percutant pour vos réseaux sociaux
            </p>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Generator */}
          <Card>
            <CardHeader>
              <CardTitle>Générateur de Contenu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type de contenu</label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Sujet ou description</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Lancement d'une nouvelle collection de chaussures écologiques..."
                  className="min-h-[120px]"
                />
              </div>
              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Générer</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Result and History */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Résultat</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedContent ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-md text-sm">
                      <MarkdownRenderer content={generatedContent} />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedContent)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copier
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Le contenu généré apparaîtra ici.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Historique récent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-4">
                    {history.length > 0 ? history.map(item => (
                      <div key={item.id} className="p-3 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="secondary">{contentTypes.find(ct => ct.value === item.content_type)?.label}</Badge>
                            <p className="text-sm text-muted-foreground mt-1 truncate">"{item.prompt}"</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setGeneratedContent(item.generated_content)}>
                            Voir
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    )) : (
                      <p className="text-muted-foreground text-center py-4">Aucun historique.</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}