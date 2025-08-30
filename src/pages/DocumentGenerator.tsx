import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, FileText, Wand2, Loader2, Download, Mail, Briefcase, GraduationCap, Receipt, Home, Users, Code2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentGeneratorService, DocumentGenerationOptions } from '@/services/documentGeneratorService';
import { aiService } from '@/services/aiService';

const documentTemplates = [
  { id: 'stage_report', name: 'Rapport de Stage', icon: Briefcase, fields: ['company', 'period', 'missions', 'skills'] },
  { id: 'motivation_letter', name: 'Lettre de Motivation', icon: Mail, fields: ['jobTitle', 'company', 'skills'] },
  { id: 'job_application', name: 'Demande d\'Emploi', icon: Users, fields: ['jobTitle', 'company'] },
  { id: 'internship_application', name: 'Demande de Stage', icon: GraduationCap, fields: ['company', 'period'] },
  { id: 'email', name: 'E-mail Professionnel', icon: Mail, fields: ['subject', 'recipient', 'sender'] },
  { id: 'rental_contract', name: 'Contrat de Location', icon: Home, fields: ['landlord', 'tenant', 'address', 'rent'] },
  { id: 'work_contract', name: 'Contrat de Travail', icon: Briefcase, fields: ['employeeName', 'employerName', 'position', 'salary'] },
  { id: 'service_contract', name: 'Contrat de Prestation', icon: Code2, fields: ['clientName', 'providerName', 'services', 'price'] },
  { id: 'quote', name: 'Devis', icon: Receipt, fields: ['clientName', 'items'] },
  { id: 'invoice', name: 'Facture', icon: Receipt, fields: ['clientName', 'items', 'dueDate'] },
  { id: 'school_essay', name: 'Exposé Scolaire', icon: GraduationCap, fields: ['topic', 'level'] },
  { id: 'university_thesis', name: 'Thèse/Mémoire', icon: GraduationCap, fields: ['topic', 'field'] },
];

const fieldLabels: Record<string, string> = {
  company: 'Entreprise',
  period: 'Période (ex: Jan-Juin 2024)',
  missions: 'Missions principales (mots-clés)',
  skills: 'Compétences acquises (mots-clés)',
  jobTitle: 'Intitulé du poste',
  subject: 'Sujet de l\'e-mail',
  recipient: 'Destinataire',
  sender: 'Expéditeur',
  landlord: 'Nom du propriétaire',
  tenant: 'Nom du locataire',
  address: 'Adresse du bien',
  rent: 'Loyer mensuel',
  employeeName: 'Nom de l\'employé',
  employerName: 'Nom de l\'employeur',
  position: 'Poste',
  salary: 'Salaire',
  clientName: 'Nom du client',
  providerName: 'Nom du prestataire',
  services: 'Services/Produits (détaillés)',
  price: 'Prix total',
  items: 'Articles/Services (détaillés)',
  dueDate: 'Date d\'échéance',
  topic: 'Sujet',
  level: 'Niveau (Lycée, Licence, Master)',
  field: 'Domaine d\'étude',
};

const DocumentGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('stage_report');
  const [customPrompt, setCustomPrompt] = useState('');
  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'docx' | 'txt'>('pdf');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedFileUrl, setGeneratedFileUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('generator');

  const selectedTemplate = documentTemplates.find(t => t.id === selectedTemplateId);

  useEffect(() => {
    // Initialize form fields when template changes
    const initialFields: Record<string, string> = {};
    selectedTemplate?.fields.forEach(field => {
      initialFields[field] = '';
    });
    setFormFields(initialFields);
    setGeneratedContent(null);
    setGeneratedFileUrl(null);

    // Handle prompt from URL (if redirected from chat)
    const promptFromUrl = searchParams.get('prompt');
    const typeFromUrl = searchParams.get('type');
    if (promptFromUrl) {
      setCustomPrompt(decodeURIComponent(promptFromUrl));
      if (typeFromUrl && documentTemplates.some(t => t.id === typeFromUrl)) {
        setSelectedTemplateId(typeFromUrl);
      } else {
        // Try to infer template from prompt
        const inferredTemplate = documentTemplates.find(t => promptFromUrl.toLowerCase().includes(t.name.toLowerCase()));
        if (inferredTemplate) {
          setSelectedTemplateId(inferredTemplate.id);
        }
      }
    }
  }, [selectedTemplateId, searchParams]);

  const handleFieldChange = (field: string, value: string) => {
    setFormFields(prev => ({ ...prev, [field]: value }));
  };

  const generateDocument = async () => {
    if (!selectedTemplate && !customPrompt.trim()) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un template ou entrer un prompt personnalisé.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);
    setGeneratedFileUrl(null);

    try {
      let finalPrompt = customPrompt.trim();
      const details: Record<string, string> = { ...formFields };

      if (selectedTemplate) {
        // Build prompt from template fields
        const templatePromptParts: string[] = [];
        templatePromptParts.push(`Génère un ${selectedTemplate.name} en français.`);
        if (finalPrompt) templatePromptParts.push(`Sujet principal: ${finalPrompt}.`);
        
        selectedTemplate.fields.forEach(field => {
          if (formFields[field]) {
            templatePromptParts.push(`${fieldLabels[field]}: ${formFields[field]}.`);
            details[field] = formFields[field]; // Add to details for service
          }
        });
        finalPrompt = templatePromptParts.join('\n');
      }

      // Use AI to generate the content first
      const aiResponse = await DocumentGeneratorService.generateDocument({
        content: finalPrompt,
        type: 'markdown', // Generate as markdown first for content
        template: selectedTemplateId as DocumentGenerationOptions['template'],
        enhanceWithAI: true, // Always enhance for initial content generation
        details: details,
      });
      setGeneratedContent(aiResponse);

      // Then convert to the desired output format
      const fileUrl = await DocumentGeneratorService.generateDocument({
        content: aiResponse,
        type: outputFormat,
        template: selectedTemplateId as DocumentGenerationOptions['template'],
        enhanceWithAI: false, // No AI enhancement for final conversion
        details: details,
      });
      setGeneratedFileUrl(fileUrl);
      setActiveTab('preview');

      toast({ title: "Succès", description: "Document généré avec succès !" });
    } catch (error: any) {
      console.error('Error generating document:', error);
      toast({ title: "Erreur", description: error.message || "Impossible de générer le document.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = () => {
    if (generatedFileUrl) {
      const a = document.createElement('a');
      a.href = generatedFileUrl;
      a.download = `${selectedTemplate?.name || 'document'}.${outputFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au chat
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Générateur de Documents</h1>
              <p className="text-sm text-muted-foreground">Créez divers documents avec l'IA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-80px)]">
        {/* Left Panel: Configuration */}
        <ScrollArea className="w-full md:w-1/3 border-r md:border-b-0 border-b bg-card p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Configuration du Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-select">Type de Document</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder="Sélectionner un type de document" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <template.icon className="w-4 h-4" />
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Détails du {selectedTemplate.name}</h3>
                  {selectedTemplate.fields.map(field => (
                    <div key={field}>
                      <Label htmlFor={field}>{fieldLabels[field]}</Label>
                      <Input
                        id={field}
                        value={formFields[field]}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        placeholder={`Entrez le ${fieldLabels[field].toLowerCase()}...`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Label htmlFor="custom-prompt">Prompt Personnalisé (optionnel)</Label>
                <Textarea
                  id="custom-prompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ajoutez des instructions spécifiques ou un sujet détaillé..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="output-format">Format de Sortie</Label>
                <Select value={outputFormat} onValueChange={(value: 'pdf' | 'docx' | 'txt') => setOutputFormat(value)}>
                  <SelectTrigger id="output-format">
                    <SelectValue placeholder="Sélectionner un format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">DOCX (Word)</SelectItem>
                    <SelectItem value="txt">TXT (Texte brut)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={generateDocument}
                disabled={isGenerating || (!selectedTemplate && !customPrompt.trim())}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" /> Générer le Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </ScrollArea>

        {/* Right Panel: Preview & Download */}
        <div className="flex-1 flex flex-col p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generator">Générateur</TabsTrigger>
              <TabsTrigger value="preview" disabled={!generatedContent}>Aperçu & Téléchargement</TabsTrigger>
            </TabsList>
            <TabsContent value="generator" className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Configurez votre document à gauche et cliquez sur "Générer".</p>
              </div>
            </TabsContent>
            <TabsContent value="preview" className="flex-1 flex flex-col">
              {generatedContent ? (
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Aperçu du Document
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col space-y-4">
                    <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/20 text-sm">
                      <div dangerouslySetInnerHTML={{ __html: generatedContent.replace(/\n/g, '<br/>') }} />
                    </ScrollArea>
                    {generatedFileUrl && (
                      <Button onClick={downloadFile} className="w-full">
                        <Download className="w-4 h-4 mr-2" /> Télécharger le {outputFormat.toUpperCase()}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p>Le document généré apparaîtra ici.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DocumentGenerator;