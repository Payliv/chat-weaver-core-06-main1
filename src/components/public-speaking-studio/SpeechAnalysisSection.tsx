import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  FileText,
  Brain,
  BarChart2,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AudioRecordingControls } from '@/components/AudioRecordingControls';
import { RecordingState, AudioRecorderService } from '@/services/audioRecorderService';
import { aiService, AIMessage } from '@/services/aiService';
import MarkdownRenderer from '@/components/MarkdownRenderer';

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

interface SpeechAnalysisSectionProps {
  speechText: string;
  setSpeechText: (text: string) => void;
  audioRecorder: AudioRecorderService;
  recordingState: RecordingState;
  handleStartRecording: () => Promise<void>; // Added to props
  handleStopRecording: () => Promise<any | null>; // Added to props
  handlePauseRecording: () => void; // Added to props
  handleResumeRecording: () => void; // Added to props
  isAnalyzingSpeech: boolean;
  setIsAnalyzingSpeech: (isAnalyzing: boolean) => void;
  speechAnalysisResult: SpeechAnalysisResult | null;
  setSpeechAnalysisResult: (result: SpeechAnalysisResult | null) => void;
  analysisProgress: number;
  setAnalysisProgress: (progress: number) => void;
  analysisStep: string;
  setAnalysisStep: (step: string) => void;
}

export const SpeechAnalysisSection: React.FC<SpeechAnalysisSectionProps> = ({
  speechText,
  setSpeechText,
  audioRecorder,
  recordingState,
  handleStartRecording,
  handleStopRecording,
  handlePauseRecording,
  handleResumeRecording,
  isAnalyzingSpeech,
  setIsAnalyzingSpeech,
  speechAnalysisResult,
  setSpeechAnalysisResult,
  analysisProgress,
  setAnalysisStep,
  setAnalysisProgress,
  analysisStep,
}) => {
  const { toast } = useToast();

  const onStopRecordingAndAnalyze = async () => {
    try {
      const recording = await handleStopRecording();
      if (!recording) return;

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

  return (
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
                onPauseRecording={handlePauseRecording}
                onResumeRecording={handleResumeRecording}
                onStopRecording={onStopRecordingAndAnalyze} // Use local handler to trigger analysis
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
  );
};