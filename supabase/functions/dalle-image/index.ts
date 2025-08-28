import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, size, quality } = await req.json();
    
    // Force l'utilisation de DALL-E 3 indépendamment du modèle frontend
    console.log('🎨 Génération d\'image avec DALL-E 3 (forcé)', { prompt, size, quality });
    
    // 🎯 DALL-E accepte maintenant le français - plus de traduction forcée
    // Le prompt est déjà traité côté client selon les préférences utilisateur
    const enhancedPrompt = prompt;

    console.log('Original prompt:', prompt);
    console.log('Enhanced prompt:', enhancedPrompt);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        size: size || '1024x1024',
        quality: quality || 'hd',
        n: 1
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('dalle-image error:', errText);
      return new Response(JSON.stringify({ error: errText }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const url = data?.data?.[0]?.url;
    if (!url) {
      return new Response(JSON.stringify({ error: 'No image URL returned' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Télécharger l'image et la convertir en base64 pour éviter les problèmes CORS
    try {
      console.log('Downloading image from:', url);
      const imageResponse = await fetch(url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      const base64DataUrl = `data:image/png;base64,${base64Image}`;
      
      console.log('Image converted to base64, size:', base64Image.length);
      
      return new Response(
        JSON.stringify({ image: base64DataUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (downloadError: any) {
      console.error('Error downloading image:', downloadError);
      // En cas d'échec du téléchargement, retourner l'URL originale
      return new Response(
        JSON.stringify({ image: url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error in dalle-image function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: String(error?.message || error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});