import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Lightbulb,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { aiService, AIMessage } from '@/services/aiService';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface GuidedExercisesSectionProps {
  dailyChallenge: string;
  setDailyChallenge: (challenge: string) => void;
  exerciseInput: string;
  setExerciseInput: (input: string) => void;
  isEvaluatingExercise: boolean;
  setIsEvaluatingExercise: (isEvaluating: boolean) => void;
  exerciseFeedback: string;
  setExerciseFeedback: (feedback: string) => void;
}

export const GuidedExercisesSection: React.FC<GuidedExercisesSectionProps> = ({
  dailyChallenge,
  setDailyChallenge,
  exerciseInput,
  setExerciseInput,
  isEvaluatingExercise,
  setIsEvaluatingExercise,
  exerciseFeedback,
  setExerciseFeedback,
}) => {
  const { toast } = useToast();

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
  );
};