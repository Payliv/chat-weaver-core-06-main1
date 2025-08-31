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
import { SpeechAnalysisSection } from '@/components/public-speaking-studio/SpeechAnalysisSection'; // Corrected import path
import { AudienceSimulationSection, AudienceMessage } from '@/components/public-speaking-studio/AudienceSimulationSection'; // Corrected import path and imported AudienceMessage
import { GuidedExercisesSection } from '@/components/public-speaking-studio/GuidedExercisesSection'; // Corrected import path

export default function PublicSpeakingStudio() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Global State for Speech Analysis
  const [speechText, setSpeechText] = useState('');
  const [audioRecorder] = useState(() => new AudioRecorderService());
  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    isPaused: false,
    duration: 0,
    size: 0,
    currentRecording: null
  });
  const [isAnalyzingSpeech, setIsAnalyzingSpeech] = useState(false);
  const [speechAnalysisResult, setSpeechAnalysisResult] = useState<any | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');

  // Global State for Audience Simulation
  const [audienceMessages, setAudienceMessages] = useState<AudienceMessage[]>([]); // Corrected type
  const [audienceInput, setAudienceInput] = useState('');
  const [isAudienceResponding, setIsAudienceResponding] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('curious');

  // Global State for Guided Exercises
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
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}