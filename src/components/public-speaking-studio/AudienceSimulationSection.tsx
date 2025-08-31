import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Play,
  Users,
  Smile,
  Frown,
  Meh,
  Lightbulb,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { aiService, AIMessage } from '@/services/aiService';
import { TypingIndicator } from '@/components/TypingIndicator';

export interface AudienceMessage { // Exported interface
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

interface AudienceSimulationSectionProps {
  audienceMessages: AudienceMessage[];
  setAudienceMessages: (messages: AudienceMessage[]) => void;
  audienceInput: string;
  setAudienceInput: (input: string) => void;
  isAudienceResponding: boolean;
  setIsAudienceResponding: (isResponding: boolean) => void;
  selectedPersona: string;
  setSelectedPersona: (persona: string) => void;
}

export const AudienceSimulationSection: React.FC<AudienceSimulationSectionProps> = ({
  audienceMessages,
  setAudienceMessages,
  audienceInput,
  setAudienceInput,
  isAudienceResponding,
  setIsAudienceResponding,
  selectedPersona,
  setSelectedPersona,
}) => {
  const { toast } = useToast();
  const audienceChatScrollRef = useRef<HTMLDivElement>(null);

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
  }, [selectedPersona, setAudienceMessages, toast]);

  const handleAudienceResponse = async () => {
    if (!audienceInput.trim() || isAudienceResponding) return;

    const userMessage: AudienceMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: audienceInput,
      timestamp: new Date().toISOString()
    };
    setAudienceMessages((prev: AudienceMessage[]) => [...prev, userMessage]);
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
      setAudienceMessages((prev: AudienceMessage[]) => [...prev, aiResponse]);

    } catch (error) {
      console.error('Audience simulation error:', error);
      toast({ title: "Erreur de simulation", description: error instanceof Error ? error.message : "Impossible de simuler l'audience.", variant: "destructive" });
    } finally {
      setIsAudienceResponding(false);
    }
  };

  return (
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
  );
};