import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, model, temperature, max_tokens, max_completion_tokens } = await req.json();

    // Nettoyer le modèle : supprimer les préfixes provider
    let cleanModel = model || "gpt-4.1-2025-04-14";
    
    // Supprimer tous les préfixes de providers
    if (cleanModel.includes('/')) {
      const parts = cleanModel.split('/');
      cleanModel = parts[parts.length - 1]; // Prendre la dernière partie après le dernier '/'
      console.log(`🧹 Cleaned model name: ${model} -> ${cleanModel}`);
    }

    // Mapper GPT-5 vers GPT-4 en backend (après nettoyage)
    let actualModel = cleanModel;
    if (cleanModel.startsWith('gpt-5')) {
      if (cleanModel.includes('mini')) {
        actualModel = "gpt-4o-mini";
      } else if (cleanModel.includes('nano')) {
        actualModel = "gpt-4o-mini"; // Utiliser mini pour nano aussi
      } else {
        actualModel = "gpt-4o"; // GPT-5 standard -> GPT-4o
      }
      console.log(`🔄 Mapping ${cleanModel} -> ${actualModel}`);
    }

    // Support nouveaux modèles OpenAI (GPT-4.1, O3, etc.) vs anciens (GPT-4o)
    const isNewModel = actualModel && (actualModel.startsWith('gpt-4.1') || 
                                actualModel.startsWith('o3-') || actualModel.startsWith('o4-'));
    
    const payload: any = {
      model: actualModel,
      messages: Array.isArray(messages) ? messages : [],
    };

    // Nouveaux modèles utilisent max_completion_tokens, anciens max_tokens
    if (isNewModel) {
      if (max_completion_tokens) payload.max_completion_tokens = max_completion_tokens;
      // Temperature par défaut 1.0 pour nouveaux modèles
    } else {
      if (temperature !== undefined) payload.temperature = temperature;
      if (max_tokens) payload.max_tokens = max_tokens;
    }

    console.log(`🤖 Model: ${actualModel}, Payload:`, JSON.stringify(payload, null, 2));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const generatedText = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ generatedText, raw: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("openai-chat error", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});