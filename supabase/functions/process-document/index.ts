/// <reference lib="deno.ns" />
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

    const { fileBase64, mimeType, prompt } = await req.json();

    if (!fileBase64 || !mimeType) {
      throw new Error('Missing fileBase64 or mimeType');
    }

    // For PDF and DOCX, client-side extraction is now used.
    // This function will primarily handle image-based documents or further AI analysis.
    // If the mimeType is PDF or DOCX, we assume text is already extracted client-side.
    // If it's an image, we use OpenAI Vision.

    let extractedText = '';

    if (mimeType.startsWith('image/')) {
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
                { 
                  type: "text", 
                  text: prompt || "Extrait tout le texte de ce document. Réponds uniquement avec le texte brut, sans aucune introduction ou conclusion." 
                },
                { 
                  type: "image_url", 
                  image_url: { 
                    url: `data:${mimeType};base64,${fileBase64}` 
                  } 
                }
              ]
            }
          ],
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI Vision API error:', errorText);
        throw new Error(`OpenAI Vision API error: ${errorText}`);
      }

      const data = await response.json();
      extractedText = data.choices?.[0]?.message?.content || '';
    } else {
      // For PDF/DOCX/TXT, assume text is already extracted client-side.
      // If this function is called for these types, it's likely for further AI processing
      // based on the already extracted text, not for re-extraction.
      // For now, we'll return an empty string or a placeholder.
      extractedText = "Text extraction handled client-side.";
    }

    return new Response(
      JSON.stringify({ extractedText }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('process-document error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});