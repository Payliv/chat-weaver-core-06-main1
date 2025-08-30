import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const getPromptForContentType = (contentType: string, prompt: string, platform?: string) => {
  switch (contentType) {
    case 'instagram_post':
      return `Génère une publication Instagram engageante sur le sujet suivant : "${prompt}". La publication doit inclure un texte captivant, 3-5 hashtags pertinents et des suggestions d'emojis. Le ton doit être adapté pour Instagram.`;
    case 'product_description':
      return `Rédige une fiche produit convaincante pour : "${prompt}". Inclus un titre accrocheur, 3-4 points forts sous forme de liste à puces, et un paragraphe descriptif qui met en avant les bénéfices pour le client.`;
    case 'tweet':
      return `Crée un tweet percutant (moins de 280 caractères) sur : "${prompt}". Inclus un ou deux hashtags pertinents.`;
    case 'linkedin_post':
      return `Rédige un post LinkedIn professionnel sur le sujet : "${prompt}". Le post doit être structuré, informatif et encourager l'engagement.`;
    default:
      return `Génère du contenu pour les réseaux sociaux sur le sujet : "${prompt}". La plateforme cible est ${platform || 'générale'}.`;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const { contentType, prompt, platform } = await req.json();
    if (!contentType || !prompt) {
      throw new Error("contentType and prompt are required");
    }

    const specializedPrompt = getPromptForContentType(contentType, prompt, platform);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es un expert en marketing digital et en création de contenu pour les réseaux sociaux." },
          { role: "user", content: specializedPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ generatedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("social-media-generator error", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});