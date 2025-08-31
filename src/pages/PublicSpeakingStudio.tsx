import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Mic,
  FileText,
  Brain,
  MessageSquare,
  BarChart2,
  Lightbulb,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Volume2,
  User,
  Users,
  Smile,
  Frown,
  Meh,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AudioRecordingControls } from '@/components/AudioRecordingControls'; // Corrected import path
import { RecordingState, AudioRecorderService } from '@/services/audioRecorderService';
import { aiService, AIMessage } from '@/services/aiService';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { TypingIndicator } from '@/components/TypingIndicator';

interface SpeechAnalysisResult {
  fluidity: string;
  clarity: string;
  vocabulary: string;
  structure: string;
  emotions: string;
  errorsToAvoid: string;
  overallFeedback: string;
  practicalAdvice: string[];
  score: number;
}

interface AudienceMessage {
  id: string;
  role: 'user' | 'audience';
  content: string;
  timestamp: string;
  persona?: string;
}

const AUDIENCE_PERSONAS = [
  { value: 'curious', label: 'Curieux', icon: Lightbulb, description: 'Pose des questions ouvertes, cherche à comprendre.' },
  { value: 'skeptical', label: 'Sceptique', icon: Frown, description: 'Remet en question les arguments, cherche les failles.' },
  { value: 'professional', label: 'Professionnel', icon: Users, description: 'Attend des faits, des données, un langage formel.' },
  { value: 'friendly', label: 'Amical', icon: Smile, description: 'Encourage, mais peut poser des questions inattendues.' },
  { value: 'neutral', label: 'Neutre', icon: Meh, description: 'Écoute attentivement sans préjugés.' },
];

export default function PublicSpeakingStudio() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Speech Analysis State
  const [speechText, setSpeechText] = useState('');
  const [audioRecorder] = useState(() => new AudioRecorderService());
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    size: 0,
    currentRecording: null
  });
  const [isAnalyzingSpeech, setIsAnalyzingSpeech] = useState(false);
  const [speechAnalysisResult, setSpeechAnalysisResult] = useState<SpeechAnalysisResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');

  // Audience Simulation State
  const [audienceMessages, setAudienceMessages] = useState<AudienceMessage[]>([]);
  const [audienceInput, setAudienceInput] = useState('');
  const [isAudienceResponding, setIsAudienceResponding] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('curious');
  const audienceChatScrollRef = useRef<HTMLDivElement>(null);

  // Guided Exercises State
  const [dailyChallenge, setDailyChallenge] = useState('');
  const [exerciseInput, setExerciseInput] = useState('');
  const [isEvaluatingExercise, setIsEvaluatingExercise] = useState(false);
  const [exerciseFeedback, setExerciseFeedback] = useState('');

  // General UI State
  const [activeTab, setActiveTab] = useState('analysis');

  useEffect(() => {
    audioRecorder.setStateChangeCallback(setRecordingState);
    return () => {
      audioRecorder.setStateChangeCallback(() => {});
      audioRecorder.stopRecording(); // Corrected method call
    };
  }, [audioRecorder]);

  useEffect(() => {
    if (audienceChatScrollRef.current) {
      audienceChatScrollRef.current.scrollTop = audienceChatScrollRef.current.scrollHeight;
    }
  }, [audienceMessages]);

  const handleStartRecording = async () => {
    try {
      await audioRecorder.startRecording();
      toast({ title: "Enregistrement démarré", description: "Parlez maintenant." });
    } catch (error) {
      toast({ title: "Erreur d'enregistrement", description: error instanceof Error ? error.message : "Impossible de démarrer l'enregistrement", variant: "destructive" });
    }
  };

  const handleStopRecording = async () => {
    try {
      const recording = await audioRecorder.stopRecording();
      setIsAnalyzingSpeech(true);
      setAnalysisStep('Transcription de l\'audio...');
      setAnalysisProgress(20);

      const transcribedText = await AudioRecorderService.transcribeRecording(recording);
      setSpeechText(transcribedText);
      toast({ title: "Enregistrement terminé", description: "Audio transcrit avec succès." });
      
      await analyzeSpeech(transcribedText);

    } catch (error) {
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Erreur lors de l'enregistrement", variant: "destructive" });
      setIsAnalyzingSpeech(false);
    }
  };

  const analyzeSpeech = async (textToAnalyze: string) => {
    if (!textToAnalyze.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer du texte ou enregistrer un discours.", variant: "destructive" });
      return;
    }

    setIsAnalyzingSpeech(true);
    setAnalysisStep('Analyse du discours par l\'IA...');
    setAnalysisProgress(50);
    setSpeechAnalysisResult(null);

    try {
      const prompt: AIMessage[] = [
        {
          role: 'system',
          content: `Tu es un coach expert en prise de parole en public. Ton rôle est d'analyser un discours et de fournir un feedback constructif et des conseils pratiques.
          Analyse les aspects suivants : fluidité, clarté, vocabulaire, structure, émotions transmises, et erreurs courantes à éviter.
          Fournis un score global sur 100 et des conseils actionnables.
          Réponds uniquement avec un objet JSON valide au format suivant:
          {
            "fluidity": "Commentaire sur la fluidité",
            "clarity": "Commentaire sur la clarté",
            "vocabulary": "Commentaire sur le vocabulaire",
            "structure": "Commentaire sur la structure",
            "emotions": "Commentaire sur les émotions transmises",
            "errorsToAvoid": "Erreurs spécifiques à éviter",
            "overallFeedback": "Feedback général et points forts",
            "practicalAdvice": ["Conseil 1", "Conseil 2", "Conseil 3"],
            "score": "Score global sur 100"
          }`
        },
        {
          role: 'user',
          content: `Analyse le discours suivant:\n\n${textToAnalyze}`
        }
      ];

      const result = await aiService.generateIntelligent(textToAnalyze, 'gpt-4o-mini', 'default', prompt.map(m => m.content));
      const parsedResult = JSON.parse(result.text) as SpeechAnalysisResult;
      setSpeechAnalysisResult(parsedResult);
      setAnalysisProgress(100);
      setAnalysisStep('Analyse terminée !');
      toast({ title: "Analyse terminée", description: "Votre discours a été analysé." });

    } catch (error) {
      console.error('Speech analysis error:', error);
      toast({ title: "Erreur d'analyse", description: error instanceof Error ? error.message : "Impossible d'analyser le discours.", variant: "destructive" });
    } finally {
      setIsAnalyzingSpeech(false);
      setAnalysisProgress(0);
      setAnalysisStep('');
    }
  };

  const startAudienceSimulation = useCallback(() => {
    setAudienceMessages([]);
    const persona = AUDIENCE_PERSONAS.find(p => p.value === selectedPersona);
    const initialMessage: AudienceMessage = {
      id: crypto.randomUUID(),
      role: 'audience',
      content: `Je suis votre audience "${persona?.label}". Présentez votre sujet, je vous poserai des questions.`,
      timestamp: new Date().toISOString(),
      persona: persona?.label
    };
    setAudienceMessages([initialMessage]);
    toast({ title: "Simulation démarrée", description: `Votre audience est prête : ${persona?.label}.` });
  }, [selectedPersona]);

  const handleAudienceResponse = async () => {
    if (!audienceInput.trim() || isAudienceResponding) return;

    const userMessage: AudienceMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: audienceInput,
      timestamp: new Date().toISOString()
    };
    setAudienceMessages(prev => [...prev, userMessage]);
    setAudienceInput('');
    setIsAudienceResponding(true);

    try {
      const persona = AUDIENCE_PERSONAS.find(p => p.value === selectedPersona);
      const systemPrompt = `Tu es une audience pour un exercice de prise de parole en public. Ton rôle est de poser des questions et de réagir au discours de l'utilisateur en adoptant la persona "${persona?.label}".
      Persona: ${persona?.description}
      Réponds de manière concise et réaliste, comme une vraie personne du public.`;

      const conversationHistory: AIMessage[] = audienceMessages.map(msg => ({
        role: msg.role === 'audience' ? 'assistant' : 'user',
        content: msg.content
      }));

      const result = await aiService.generateIntelligent(audienceInput, 'gpt-4o-mini', 'default', [...conversationHistory, { role: 'system', content: systemPrompt }].map(m => m.content));
      
      const aiResponse: AudienceMessage = {
        id: crypto.randomUUID(),
        role: 'audience',
        content: result.text,
        timestamp: new Date().toISOString(),
        persona: persona?.label
      };
      setAudienceMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('Audience simulation error:', error);
      toast({ title: "Erreur de simulation", description: error instanceof Error ? error.message : "Impossible de simuler l'audience.", variant: "destructive" });
    } finally {
      setIsAudienceResponding(false);
    }
  };

  const generateDailyChallenge = async () => {
    setIsEvaluatingExercise(true);
    setDailyChallenge('');
    try {
      const prompt: AIMessage[] = [
        {
          role: 'system',
          content: `Tu es un coach en prise de parole en public. Génère un défi quotidien pour améliorer la spontanéité et la clarté.
          Le défi doit être une phrase simple comme "Explique-moi le concept de [concept] en 60 secondes." ou "Présente [sujet] comme si tu étais [personnage]."
          Réponds uniquement avec le défi.`
        },
        {
          role: 'user',
          content: 'Génère un nouveau défi quotidien.'
        }
      ];
      const result = await aiService.generateIntelligent('Génère un nouveau défi quotidien.', 'gpt-4o-mini', 'default', prompt.map(m => m.content));
      setDailyChallenge(result.text);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de générer le défi quotidien.", variant: "destructive" });
    } finally {
      setIsEvaluatingExercise(false);
    }
  };

  const evaluateExercise = async () => {
    if (!exerciseInput.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer votre réponse à l'exercice.", variant: "destructive" });
      return;
    }
    setIsEvaluatingExercise(true);
    setExerciseFeedback('');
    try {
      const prompt: AIMessage[] = [
        {
          role: 'system',
          content: `Tu es un coach en prise de parole en public. Évalue la performance de l'utilisateur pour le défi suivant: "${dailyChallenge}".
          Analyse la clarté, la concision, la pertinence et la spontanéité de sa réponse.
          Fournis un feedback constructif et des suggestions d'amélioration.
          Réponds en markdown.`
        },
        {
          role: 'user',
          content: `Voici ma réponse au défi:\n\n${exerciseInput}`
        }
      ];
      const result = await aiService.generateIntelligent(exerciseInput, 'gpt-4o-mini', 'default', prompt.map(m => m.content));
      setExerciseFeedback(result.text);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'évaluer l'exercice.", variant: "destructive" });
    } finally {
      setIsEvaluatingExercise(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/app')}
          className="mb-4 hover:bg-muted/50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au Chat
        </Button>
        
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            Studio Prise de Parole
          </h1>
          <p className="text-muted-foreground">
            Améliorez vos compétences oratoires avec l'IA
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Analyse de Discours
            </TabsTrigger>
            <TabsTrigger value="simulation" className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Simulation d'Audience
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Exercices & Feedback
            </TabsTrigger>
          </TabsList>

          {/* Speech Analysis Tab */}
          <TabsContent value="analysis" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Entrée du Discours
                  </CardTitle>
                  <CardDescription>
                    Écrivez ou enregistrez votre discours pour une analyse IA.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="speech-text">Texte du discours</Label>
                    <Textarea
                      id="speech-text"
                      placeholder="Collez ou écrivez votre discours ici..."
                      value={speechText}
                      onChange={(e) => setSpeechText(e.target.value)}
                      className="min-h-[150px]"
                      disabled={isAnalyzingSpeech}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Enregistrement vocal</Label>
                    <div className="p-3 border rounded-lg">
                      <AudioRecordingControls
                        recordingState={recordingState}
                        onStartRecording={handleStartRecording}
                        onPauseRecording={() => audioRecorder.pauseRecording()}
                        onResumeRecording={() => audioRecorder.resumeRecording()}
                        onStopRecording={handleStopRecording}
                        isTranscribing={isAnalyzingSpeech}
                        compact={true}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => analyzeSpeech(speechText)}
                    disabled={!speechText.trim() || isAnalyzingSpeech}
                    className="w-full"
                  >
                    {isAnalyzingSpeech ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {analysisStep}
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" /> Analyser le discours
                      </>
                    )}
                  </Button>
                  {isAnalyzingSpeech && analysisProgress > 0 && (
                    <Progress value={analysisProgress} className="w-full mt-2" />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5" />
                    Résultats de l'Analyse
                  </CardTitle>
                  <CardDescription>
                    Feedback détaillé et conseils pratiques de l'IA.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {speechAnalysisResult ? (
                    <ScrollArea className="h-[400px] p-4 border rounded-md bg-muted/20">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">Score Global:</h3>
                          <Badge variant="default" className="text-lg px-4 py-2">
                            {speechAnalysisResult.score}/100
                          </Badge>
                        </div>
                        <MarkdownRenderer content={`**Feedback Général:** ${speechAnalysisResult.overallFeedback}`} />
                        <MarkdownRenderer content={`**Fluidité:** ${speechAnalysisResult.fluidity}`} />
                        <MarkdownRenderer content={`**Clarté:** ${speechAnalysisResult.clarity}`} />
                        <MarkdownRenderer content={`**Vocabulaire:** ${speechAnalysisResult.vocabulary}`} />
                        <MarkdownRenderer content={`**Structure:** ${speechAnalysisResult.structure}`} />
                        <MarkdownRenderer content={`**Émotions:** ${speechAnalysisResult.emotions}`} />
                        <MarkdownRenderer content={`**Erreurs à éviter:** ${speechAnalysisResult.errorsToAvoid}`} />
                        <div>
                          <h4 className="font-semibold text-md mb-2">Conseils Pratiques:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {speechAnalysisResult.practicalAdvice.map((advice, index) => (
                              <li key={index} className="text-sm text-muted-foreground">{advice}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune analyse pour le moment.</p>
                      <p className="text-sm mt-1">Soumettez un discours pour obtenir un feedback.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audience Simulation Tab */}
          <TabsContent value="simulation" className="mt-4">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Simulation d'Audience
                </CardTitle>
                <CardDescription>
                  Entraînez-vous à répondre aux questions d'une audience IA.
                </CardDescription>
                </CardHeader>
              <CardContent className="flex-1 flex flex-col p-4">
                <div className="mb-4 flex items-center gap-3">
                  <Label htmlFor="persona-select" className="sr-only">Sélectionner une persona</Label>
                  <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                    <SelectTrigger id="persona-select" className="w-[180px]">
                      <SelectValue placeholder="Sélectionner une persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIENCE_PERSONAS.map(persona => (
                        <SelectItem key={persona.value} value={persona.value}>
                          <div className="flex items-center gap-2">
                            <persona.icon className="w-4 h-4" />
                            {persona.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={startAudienceSimulation} disabled={isAudienceResponding}>
                    <Play className="w-4 h-4 mr-2" /> Démarrer la simulation
                  </Button>
                </div>

                <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/20 mb-4" ref={audienceChatScrollRef}>
                  <div className="space-y-4">
                    {audienceMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                          {msg.role === 'audience' && msg.persona && (
                            <Badge variant="secondary" className="mb-1 text-xs">
                              <Users className="w-3 h-3 mr-1" /> {msg.persona}
                            </Badge>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isAudienceResponding && <TypingIndicator modelName="Audience IA" />}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Textarea
                    value={audienceInput}
                    onChange={(e) => setAudienceInput(e.target.value)}
                    placeholder="Répondez à l'audience..."
                    className="flex-1 min-h-[40px] max-h-[100px]"
                    disabled={isAudienceResponding || audienceMessages.length === 0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAudienceResponse();
                      }
                    }}
                  />
                  <Button onClick={handleAudienceResponse} disabled={!audienceInput.trim() || isAudienceResponding}>
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exercises & Feedback Tab */}
          <TabsContent value="exercises" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Exercice Quotidien
                  </CardTitle>
                  <CardDescription>
                    Relevez un défi pour améliorer votre spontanéité.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={generateDailyChallenge} disabled={isEvaluatingExercise} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" /> Générer un défi
                  </Button>
                  {dailyChallenge && (
                    <div className="p-4 border rounded-md bg-muted/20 space-y-3">
                      <h3 className="font-semibold text-lg">Défi:</h3>
                      <p className="text-primary font-medium text-xl">{dailyChallenge}</p>
                      <div>
                        <Label htmlFor="exercise-input">Votre réponse</Label>
                        <Textarea
                          id="exercise-input"
                          placeholder="Écrivez votre réponse au défi ici..."
                          value={exerciseInput}
                          onChange={(e) => setExerciseInput(e.target.value)}
                          className="min-h-[100px]"
                          disabled={isEvaluatingExercise}
                        />
                      </div>
                      <Button onClick={evaluateExercise} disabled={!exerciseInput.trim() || isEvaluatingExercise} className="w-full">
                        {isEvaluatingExercise ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Évaluation...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" /> Évaluer ma réponse
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Feedback de l'Exercice
                  </CardTitle>
                  <CardDescription>
                    Recevez des conseils personnalisés pour votre performance.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {exerciseFeedback ? (
                    <ScrollArea className="h-[400px] p-4 border rounded-md bg-muted/20">
                      <MarkdownRenderer content={exerciseFeedback} />
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun feedback pour le moment.</p>
                      <p className="text-sm mt-1">Terminez un exercice pour obtenir un feedback.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}