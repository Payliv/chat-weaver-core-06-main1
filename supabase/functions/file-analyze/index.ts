import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { fileBase64, textContent, fileName, mime, prompt } = await req.json();

    if (mime.includes('image')) {
      // Handle image analysis with Vision API
      if (!fileBase64) {
        throw new Error('Missing fileBase64 for image analysis');
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt || 'Analyse cette image en détail.' },
                { type: "image_url", image_url: { url: `data:${mime};base64,${fileBase64}` } }
              ]
            }
          ],
          max_tokens: 2000
        })
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      return new Response(JSON.stringify({ generatedText: data.choices?.[0]?.message?.content }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } else {
      // Handle document analysis with text content
      if (!textContent) {
        throw new Error('Missing textContent for document analysis');
      }

      const analysisPrompt = prompt || 'Fournis un résumé détaillé du contenu de ce document. Réponds en JSON avec la clé "summary".';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Tu es un assistant expert en analyse de documents. Tu fournis des analyses détaillées, structurées et pertinentes en français." },
            { role: "user", content: `${analysisPrompt}\n\nVoici le contenu du document "${fileName}":\n\n${textContent.substring(0, 16000)}` }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      return new Response(JSON.stringify({ generatedText: data.choices?.[0]?.message?.content }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error: any) {
    console.error('file-analyze error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});