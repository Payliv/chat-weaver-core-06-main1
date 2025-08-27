import { supabase } from '@/integrations/supabase/client';
import { ErrorHandlingService } from './errorHandlingService';
import { ModelRecommendationService } from './modelRecommendationService';

export interface StreamingOptions {
  messages: Array<{ role: string; content: string }>;
  model: string;
  temperature?: number;
  maxTokens?: number;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Service de streaming universel pour tous les providers IA
 * Supporte OpenAI, Claude, Gemini, DeepSeek, OpenRouter avec 400+ modèles
 */
export class StreamingService {
  
  /**
   * Démarre un stream optimisé avec n'importe quel modèle
   */
  static async streamGeneration(options: StreamingOptions): Promise<void> {
    const { messages, model, temperature = 0.7, maxTokens = 2000, onChunk, onComplete, onError } = options;
    
    try {
      console.log('🚀 Starting optimized stream with model:', model);
      
      const provider = this.detectProvider(model);
      const functionName = this.getFunctionName(provider);
      
      // Support streaming pour TOUS les modèles, y compris GPT-5/O3/O4
      const streamingPayload = {
        messages,
        model,
        temperature,
        max_tokens: maxTokens,
        max_completion_tokens: maxTokens, // Support GPT-5/O3/O4
        stream: true
      };

      console.log(`📡 Calling ${functionName} for provider ${provider}`);

      // Direct streaming call to avoid double API calls
      const streamResponse = await fetch(`https://jeurznrjcohqbevrzses.supabase.co/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || 'anonymous'}`
        },
        body: JSON.stringify(streamingPayload)
      });

      if (!streamResponse.ok) {
        const errorText = await streamResponse.text();
        console.error(`❌ Stream response failed for ${model}:`, errorText);
        throw new Error(`Streaming failed: ${streamResponse.statusText} - ${errorText}`);
      }

      const reader = streamResponse.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader');
      }

      let fullText = '';
      let chunkBuffer = '';
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Optimisation: décodage en chunks plus large
          chunkBuffer += decoder.decode(value, { stream: true });
          const lines = chunkBuffer.split('\n');
          chunkBuffer = lines.pop() || ''; // Garde la dernière ligne partielle

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || 
                              parsed.choices?.[0]?.message?.content ||
                              parsed.content;
                
                if (content) {
                  fullText += content;
                  // Émission immédiate du chunk
                  onChunk?.(content);
                }
              } catch (parseError) {
                // Silencieux pour éviter le spam de logs
              }
            }
          }
        }
        
        onComplete?.(fullText);
      } finally {
        reader.releaseLock();
      }
      
    } catch (error) {
      console.error(`❌ Streaming error for ${model}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log détaillé pour debugging
      if (errorMessage.includes('OpenAI is requiring a key')) {
        console.error('🔑 OpenAI API key required for this model via OpenRouter');
      } else if (errorMessage.includes('403')) {
        console.error('🚫 Access denied - check API key configuration');
      } else if (errorMessage.includes('rate limit')) {
        console.error('⏰ Rate limit exceeded');
      }
      
      onError?.(error as Error);
    }
  }

  /**
   * Détecte le provider basé sur le nom du modèle - Priorité aux clés API directes
   */
  private static detectProvider(model: string): 'openai' | 'claude' | 'gemini' | 'deepseek' | 'openrouter' {
    console.log(`🔍 Detecting provider for model: ${model}`);
    
    // PRIORITÉ 1: Modèles OpenAI - utiliser clé API directe
    if (model.startsWith('openai/') || model.includes('gpt-4') || model.includes('gpt-3') || 
        model.includes('o1') || model.includes('gpt') || model.includes('chatgpt')) {
      console.log(`🤖 OpenAI model detected, using direct API key`);
      return 'openai';
    }
    
    // PRIORITÉ 2: Modèles Google/Gemini - utiliser clé API directe
    if (model.startsWith('google/') || model.includes('gemini') || model.includes('bard')) {
      console.log(`🧠 Google/Gemini model detected, using direct API key`);
      return 'gemini';
    }
    
    // PRIORITÉ 3: Modèles DeepSeek - utiliser clé API directe
    if (model.startsWith('deepseek/') || model.includes('deepseek')) {
      console.log(`🚀 DeepSeek model detected, using direct API key`);
      return 'deepseek';
    }
    
    // PRIORITÉ 4: Modèles Claude - utiliser clé API directe si disponible
    if (model.startsWith('anthropic/') || model.includes('claude')) {
      console.log(`👑 Claude model detected, using direct API key`);
      return 'claude';
    }
    
    // FALLBACK: Autres modèles via OpenRouter (Meta, Mistral, Cohere, etc.)
    if (model.startsWith('meta/') || model.startsWith('mistralai/') || model.startsWith('cohere/') ||
        model.startsWith('perplexity/') || model.startsWith('nvidia/') || model.startsWith('x-ai/')) {
      console.log(`📦 Third-party model, routing to OpenRouter`);
      return 'openrouter';
    }
    
    // Par défaut, utiliser OpenRouter
    console.log(`📦 Unknown model, fallback to OpenRouter: ${model}`);
    return 'openrouter';
  }

  /**
   * Obtient le nom de la fonction edge correspondante (streaming prioritaire)
   */
  private static getFunctionName(provider: string): string {
    const functions = {
      openai: 'openai-chat-stream',
      claude: 'claude-chat-stream', 
      gemini: 'gemini-chat-stream',
      deepseek: 'deepseek-chat-stream',
      openrouter: 'openrouter-chat-stream'
    };
    
    return functions[provider as keyof typeof functions] || 'openrouter-chat-stream';
  }

  /**
   * Stream avec fallback automatique intelligent pour GPT-5
   */
  static async streamWithFallback(options: StreamingOptions): Promise<void> {
    try {
      await this.streamGeneration(options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`🔄 Primary streaming failed for ${options.model}, attempting intelligent fallback:`, errorMessage);
      
      // Fallback spécifique pour GPT-5 qui nécessite une clé OpenAI
      let fallbackModel = 'gpt-4o-mini';
      
      if (options.model.includes('gpt-5') || options.model.includes('openai/gpt-5')) {
        console.log('🔄 GPT-5 fallback: trying direct OpenAI models');
        // Essayer d'abord GPT-4o pour maintenir la qualité
        fallbackModel = 'gpt-4.1-2025-04-14';
      } else if (options.model.includes('o3-') || options.model.includes('o4-')) {
        console.log('🔄 O3/O4 fallback: trying GPT-4.1');
        fallbackModel = 'gpt-4.1-2025-04-14';
      } else {
        // Analyser l'erreur et recommander un modèle de fallback
        const errorInfo = ErrorHandlingService.analyzeError(error);
        fallbackModel = errorInfo.fallbackModel || 'gpt-4o-mini';
        
        // Si on a un prompt, utiliser le service de recommandation
        if (options.messages.length > 0) {
          const prompt = options.messages[options.messages.length - 1]?.content || '';
          if (prompt.trim().length > 10) {
            const analysis = ModelRecommendationService.analyzePrompt(prompt);
            const recommendedModel = ModelRecommendationService.getBestModelForTask(analysis);
            if (recommendedModel && !recommendedModel.includes('gpt-5')) {
              fallbackModel = recommendedModel;
            }
          }
        }
      }
      
      const fallbackOptions = {
        ...options,
        model: fallbackModel
      };
      
      console.log(`🔄 Attempting fallback with ${fallbackModel}`);
      
      try {
        await this.streamGeneration(fallbackOptions);
      } catch (fallbackError) {
        console.warn(`🔄 First fallback failed, trying final fallback`);
        // Dernier recours : modèle le plus stable
        const finalFallbackOptions = {
          ...options,
          model: 'gpt-4o-mini'
        };
        
        try {
          await this.streamGeneration(finalFallbackOptions);
        } catch (finalError) {
          console.error('❌ All fallback attempts failed:', finalError);
          throw new Error(`Streaming failed for all models. Original error: ${errorMessage}`);
        }
      }
    }
  }

  /**
   * Teste la disponibilité du streaming pour un modèle
   */
  static async testStreaming(model: string): Promise<boolean> {
    try {
      const provider = this.detectProvider(model);
      const functionName = this.getFunctionName(provider);
      
      // Utiliser le client Supabase pour les tests aussi
      const testResult = await supabase.functions.invoke(functionName, {
        body: {
          messages: [{ role: 'user', content: 'test' }],
          model,
          stream: false, // Test sans streaming d'abord
          max_tokens: 1
        }
      });

      return !testResult.error;
    } catch {
      return false;
    }
  }
}