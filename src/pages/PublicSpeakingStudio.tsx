import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  FileText,
  Users,
  Lightbulb,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorderService } from '@/services/audioRecorderService';
import { TextToSpeechService, TTSSettings } from '@/services/textToSpeechService'; // Import TextToSpeechService and TTSSettings
import { SpeechAnalysisSection } from '@/components/public-speaking-studio/SpeechAnalysisSection';
import { AudienceSimulationSection, AudienceMessage } from '@/components/public-speaking-studio/AudienceSimulationSection';
import { GuidedExercisesSection } from '@/components/public-speaking-studio/GuidedExercisesSection';

export default function PublicSpeakingStudio() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- Global State for Audio Recording ---
  const [audioRecorder] = useState(() => new AudioRecorderService());
  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    isPaused: false,
    duration: 0,
    size: 0,
    currentRecording: null
  });

  // --- Global State for Text-to-Speech (TTS) ---
  const [ttsSettings, setTtsSettings] = useState<TTSSettings>({
    provider: 'openai',
    voice: 'alloy',
    language: 'fr', // Default to French
    speed: 1.0,
    format: 'mp3'
  });
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);

  // --- Speech Analysis State ---
  const [speechText, setSpeechText] = useState('');
  const [isAnalyzingSpeech, setIsAnalyzingSpeech] = useState(false);
  const [speechAnalysisResult, setSpeechAnalysisResult] = useState<any | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');

  // --- Audience Simulation State ---
  const [audienceMessages, setAudienceMessages] = useState<AudienceMessage[]>([]);
  const [audienceInput, setAudienceInput] = useState('');
  const [isAudienceResponding, setIsAudienceResponding] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('curious');

  // --- Guided Exercises State ---
  const [dailyChallenge, setDailyChallenge] = useState('');
  const [exerciseInput, setExerciseInput] = useState('');
  const [isEvaluatingExercise, setIsEvaluatingExercise] = useState(false);
  const [exerciseFeedback, setExerciseFeedback] = useState('');

  // --- General UI State ---
  const [activeTab, setActiveTab] = useState('analysis');

  // --- Audio Recording Controls (Centralized) ---
  const handleStartRecording = useCallback(async () => {
    try {
      await audioRecorder.startRecording();
      toast({ title: "Enregistrement démarré", description: "Parlez maintenant." });
    } catch (error) {
      toast({ title: "Erreur d'enregistrement", description: error instanceof Error ? error.message : "Impossible de démarrer l'enregistrement", variant: "destructive" });
    }
  }, [audioRecorder, toast]);

  const handleStopRecording = useCallback(async () => {
    try {
      const recording = await audioRecorder.stopRecording();
      toast({ title: "Enregistrement terminé", description: "Audio enregistré." });
      return recording; // Return the recording object
    } catch (error) {
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Erreur lors de l'enregistrement", variant: "destructive" });
      return null;
    }
  }, [audioRecorder, toast]);

  const handlePauseRecording = useCallback(() => {
    audioRecorder.pauseRecording();
    toast({ title: "Enregistrement en pause", description: "Reprenez quand vous êtes prêt." });
  }, [audioRecorder, toast]);

  const handleResumeRecording = useCallback(() => {
    audioRecorder.resumeRecording();
    toast({ title: "Enregistrement repris", description: "Continuez votre discours." });
  }, [audioRecorder, toast]);

  // --- Text-to-Speech Function (Centralized) ---
  const playTextToSpeech = useCallback(async (text: string, lang: string = ttsSettings.language) => {
    setIsTtsPlaying(true);
    try {
      const audio = await TextToSpeechService.playTextAudio(text, { ...ttsSettings, language: lang });
      audio.onended = () => setIsTtsPlaying(false);
      audio.onerror = () => setIsTtsPlaying(false);
    } catch (error) {
      console.error('TTS playback error:', error);
      toast({ title: "Erreur TTS", description: "Impossible de lire l'audio.", variant: "destructive" });
    } finally {
      setIsTtsPlaying(false);
    }
  }, [ttsSettings, toast]);


  useEffect(() => {
    audioRecorder.setStateChangeCallback(setRecordingState);
    return () => {
      audioRecorder.setStateChangeCallback(() => {});
      audioRecorder.stopRecording();
    };
  }, [audioRecorder]);

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
            <SpeechAnalysisSection
              speechText={speechText}
              setSpeechText={setSpeechText}
              audioRecorder={audioRecorder}
              recordingState={recordingState}
              handleStartRecording={handleStartRecording}
              handleStopRecording={handleStopRecording}
              handlePauseRecording={handlePauseRecording}
              handleResumeRecording={handleResumeRecording}
              isAnalyzingSpeech={isAnalyzingSpeech}
              setIsAnalyzingSpeech={setIsAnalyzingSpeech}
              speechAnalysisResult={speechAnalysisResult}
              setSpeechAnalysisResult={setSpeechAnalysisResult}
              analysisProgress={analysisProgress}
              setAnalysisProgress={setAnalysisProgress}
              analysisStep={analysisStep}
              setAnalysisStep={setAnalysisStep}
            />
          </TabsContent>

          {/* Audience Simulation Tab */}
          <TabsContent value="simulation" className="mt-4">
            <AudienceSimulationSection
              audienceMessages={audienceMessages}
              setAudienceMessages={setAudienceMessages}
              audienceInput={audienceInput}
              setAudienceInput={setAudienceInput}
              isAudienceResponding={isAudienceResponding}
              setIsAudienceResponding={setIsAudienceResponding}
              selectedPersona={selectedPersona}
              setSelectedPersona={setSelectedPersona}
              audioRecorder={audioRecorder}
              recordingState={recordingState}
              handleStartRecording={handleStartRecording}
              handleStopRecording={handleStopRecording}
              handlePauseRecording={handlePauseRecording}
              handleResumeRecording={handleResumeRecording}
              ttsSettings={ttsSettings}
              playTextToSpeech={playTextToSpeech}
              isTtsPlaying={isTtsPlaying}
            />
          </TabsContent>

          {/* Exercises & Feedback Tab */}
          <TabsContent value="exercises" className="mt-4">
            <GuidedExercisesSection
              dailyChallenge={dailyChallenge}
              setDailyChallenge={setDailyChallenge}
              exerciseInput={exerciseInput}
              setExerciseInput={setExerciseInput}
              isEvaluatingExercise={isEvaluatingExercise}
              setIsEvaluatingExercise={setIsEvaluatingExercise}
              exerciseFeedback={exerciseFeedback}
              setExerciseFeedback={setExerciseFeedback}
              audioRecorder={audioRecorder}
              recordingState={recordingState}
              handleStartRecording={handleStartRecording}
              handleStopRecording={handleStopRecording}
              handlePauseRecording={handlePauseRecording}
              handleResumeRecording={handleResumeRecording}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}