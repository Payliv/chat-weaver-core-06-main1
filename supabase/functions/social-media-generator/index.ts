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
    case 'facebook_post':
      return `Rédige une publication Facebook engageante sur le sujet : "${prompt}". Le post doit avoir un ton conversationnel, inclure des emojis pertinents, et se terminer par une question pour encourager les commentaires.`;
    case 'tiktok_post':
      return `Crée une description de post TikTok virale pour une vidéo sur : "${prompt}". La description doit être courte, percutante, inclure 3-5 hashtags tendance et une suggestion de son populaire.`;
    case 'facebook_video_script':
      return `Écris un script pour une courte vidéo Facebook (1-2 minutes) sur le sujet : "${prompt}". Le script doit être structuré avec des scènes, des indications visuelles et le dialogue ou la voix off.`;
    case 'youtube_video_script':
      return `Écris un script détaillé pour une vidéo YouTube (5-10 minutes) sur le sujet : "${prompt}". Le script doit inclure une introduction accrocheuse (hook), le contenu principal divisé en sections claires, et une conclusion avec un appel à l'action (like, subscribe).`;
    case 'tiktok_video_script':
      return `Crée un script pour une vidéo TikTok (15-30 secondes) sur le sujet : "${prompt}". Le script doit être très concis, visuellement dynamique, et suivre un format tendance (ex: "Point de vue:", "3 astuces pour..."). Inclus des suggestions de texte à l'écran.`;
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