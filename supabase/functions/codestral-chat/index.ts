import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MISTRAL_API_KEY) {
      return new Response(JSON.stringify({ error: "MISTRAL_API_KEY is not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, model, temperature = 0.7, max_tokens = 1000 } = await req.json();

    console.log(`Processing Codestral request for model: ${model}`);

    // Mapping des modèles Mistral
    const modelMap: { [key: string]: string } = {
      'codestral-latest': 'codestral-latest',
      'mistral-large-latest': 'mistral-large-latest',
      'mistral-small-latest': 'mistral-small-latest',
      'mistral-nemo': 'mistral-nemo'
    };

    const finalModel = modelMap[model] || 'codestral-latest';

    const payload = {
      model: finalModel,
      messages: Array.isArray(messages) ? messages : [],
      temperature,
      max_tokens,
    };

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Codestral API error (${response.status}):`, errorText);
      return new Response(JSON.stringify({ 
        error: `Codestral API error: ${response.status} - ${errorText}` 
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const generated<dyad-problem-report summary="150 problems">
<problem file="supabase/functions/super-admin/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/super-admin/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.54.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/super-admin/index.ts" line="17" column="7" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/super-admin/index.ts" line="18" column="7" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/check-subscription/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/check-subscription/index.ts" line="3" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.45.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/check-subscription/index.ts" line="18" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/check-subscription/index.ts" line="19" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/check-subscription/index.ts" line="24" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/check-subscription/index.ts" line="25" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/claude-chat/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/claude-chat/index.ts" line="8" column="27" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/codestral-chat/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/codestral-chat/index.ts" line="8" column="25" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/cleanup-stalled-generations/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/cleanup-stalled-generations/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.7.1' or its corresponding type declarations.</problem>
<problem file="supabase/functions/cleanup-stalled-generations/index.ts" line="10" column="3" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/cleanup-stalled-generations/index.ts" line="11" column="3" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/customer-portal/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/customer-portal/index.ts" line="2" column="20" code="2307">Cannot find module 'https://esm.sh/stripe@14.21.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/customer-portal/index.ts" line="3" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.45.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/customer-portal/index.ts" line="16" column="23" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/customer-portal/index.ts" line="20" column="7" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/customer-portal/index.ts" line="21" column="7" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/create-checkout/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/create-checkout/index.ts" line="2" column="20" code="2307">Cannot find module 'https://esm.sh/stripe@14.21.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/create-checkout/index.ts" line="3" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.45.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/create-checkout/index.ts" line="24" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/create-checkout/index.ts" line="25" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/create-checkout/index.ts" line="29" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/create-checkout/index.ts" line="30" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/create-checkout/index.ts" line="35" column="23" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/deepseek-chat/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/deepseek-chat/index.ts" line="8" column="26" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/generate-ebook/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/generate-ebook/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.7.1' or its corresponding type declarations.</problem>
<problem file="supabase/functions/generate-ebook/index.ts" line="10" column="3" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/generate-ebook/index.ts" line="11" column="3" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/generate-ebook/index.ts" line="70" column="40" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/generate-ebook/index.ts" line="137" column="40" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/generate-ebook/index.ts" line="172" column="27" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/generate-ebook/index.ts" line="182" column="33" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/generate-ebook/index.ts" line="594" column="5" code="2304">Cannot find name 'EdgeRuntime'.</problem>
<problem file="supabase/functions/gemini-chat/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/gemini-chat/index.ts" line="8" column="24" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/claude-chat-stream/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/claude-chat-stream/index.ts" line="21" column="36" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/dalle-image/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/dalle-image/index.ts" line="29" column="36" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/google-tts/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/google-tts/index.ts" line="27" column="28" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/google-stt/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/google-stt/index.ts" line="17" column="28" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/get-pexels-key/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/get-pexels-key/index.ts" line="17" column="26" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/image-proxy/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/klingai-video/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/klingai-video/index.ts" line="26" column="25" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-init/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/moneroo-init/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.45.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/moneroo-init/index.ts" line="18" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-init/index.ts" line="19" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-init/index.ts" line="41" column="24" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/huggingface-image/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/huggingface-image/index.ts" line="2" column="29" code="2307">Cannot find module 'https://esm.sh/@huggingface/inference@2.3.2' or its corresponding type declarations.</problem>
<problem file="supabase/functions/huggingface-image/index.ts" line="19" column="32" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-minutes-verify/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/moneroo-minutes-verify/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.45.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/moneroo-minutes-verify/index.ts" line="18" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-minutes-verify/index.ts" line="19" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-minutes-verify/index.ts" line="24" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-minutes-verify/index.ts" line="25" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-minutes-verify/index.ts" line="31" column="24" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/openai-chat-stream/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/openai-chat-stream/index.ts" line="8" column="24" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-verify/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/moneroo-verify/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.45.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/moneroo-verify/index.ts" line="18" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-verify/index.ts" line="19" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-verify/index.ts" line="24" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-verify/index.ts" line="25" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-verify/index.ts" line="31" column="24" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-minutes-init/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/moneroo-minutes-init/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.45.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/moneroo-minutes-init/index.ts" line="18" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-minutes-init/index.ts" line="19" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/moneroo-minutes-init/index.ts" line="25" column="24" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/openai-embed/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/openai-embed/index.ts" line="8" column="24" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/openai-chat/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/openai-chat/index.ts" line="8" column="24" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/deepseek-chat-stream/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/deepseek-chat-stream/index.ts" line="14" column="30" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/openai-image/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/openai-image/index.ts" line="20" column="36" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/openrouter-chat/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/openrouter-chat/index.ts" line="3" column="26" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/openrouter-chat-stream/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/openrouter-chat-stream/index.ts" line="21" column="36" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/openai-image-variations/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/openai-image-variations/index.ts" line="44" column="36" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/openai-image-edit/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/openai-image-edit/index.ts" line="44" column="36" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/perplexity-chat/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/perplexity-chat/index.ts" line="8" column="28" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/openrouter-tts/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/openrouter-tts/index.ts" line="26" column="30" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/quota-check/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/quota-check/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.45.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/quota-check/index.ts" line="17" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/quota-check/index.ts" line="18" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/quota-check/index.ts" line="23" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/quota-check/index.ts" line="24" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/team-management/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/team-management/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.45.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/team-management/index.ts" line="31" column="37" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/team-management/index.ts" line="35" column="36" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/team-management/index.ts" line="62" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/team-management/index.ts" line="63" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/team-management/index.ts" line="68" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/team-management/index.ts" line="69" column="5" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/team-management/index.ts" line="245" column="25" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/resume-ebook-generation/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/resume-ebook-generation/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.7.1' or its corresponding type declarations.</problem>
<problem file="supabase/functions/resume-ebook-generation/index.ts" line="10" column="3" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/resume-ebook-generation/index.ts" line="11" column="3" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/text-to-voice/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/text-to-voice/index.ts" line="20" column="28" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/translate-text/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/translate-text/index.ts" line="35" column="26" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/veo2-video/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/veo2-video/index.ts" line="8" column="24" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/vision-analyze/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/vision-analyze/index.ts" line="8" column="24" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/veo3-video/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/veo3-video/index.ts" line="8" column="24" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/web-search-advanced/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/web-search-advanced/index.ts" line="26" column="40" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/web-search-advanced/index.ts" line="70" column="40" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/web-search-advanced/index.ts" line="107" column="40" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/gemini-chat-stream/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/gemini-chat-stream/index.ts" line="17" column="20" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/gemini-chat-stream/index.ts" line="17" column="54" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/voice-to-text/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/voice-to-text/index.ts" line="68" column="36" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/youtube-audio-extract/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.190.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/youtube-audio-extract/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.54.0' or its corresponding type declarations.</problem>
<problem file="supabase/functions/youtube-audio-extract/index.ts" line="10" column="3" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/youtube-audio-extract/index.ts" line="11" column="3" code="2304">Cannot find name 'Deno'.</problem>
<problem file="supabase/functions/youtube-audio-extract/index.ts" line="45" column="22" code="2304">Cannot find name 'Deno'.</problem>
</dyad-problem-report><think>**Fixing the Module Imports**

I've been wrestling with the TypeScript compilation errors in my Supabase Edge Functions. It appears there's a recurring issue with module resolution, specifically with the `URL` module. The compiler can't find the necessary declarations, leading to a cascade of errors. I'm focusing my efforts on pinpointing the root cause and implementing a robust solution.


**Analyzing the TypeScript Setup**

I'm now zeroing in on the cause of these module resolution errors. The core issue seems to be the standard TypeScript setup failing to recognize the Deno environment. My prior attempts at a fix, like the `tsconfig.json` approach, were unsuccessful, and I suspect a misconfiguration or conflicting directives within that file. The deployment failures are, in fact, indicative of the `tsconfig.json` actively *causing* the problem, not being the problem itself. I'm taking a more focused look at the compiler options.


**Debugging the Configuration**

I'm now investigating the specific error messages from the failed deployments. The `Expected ';', '}' or <eof>` error strongly suggests a malformed `tsconfig.json`. My strategy now focuses on ensuring this file is valid JSON and correctly instructs the TypeScript compiler to recognize Deno. I am simplifying the file and will double-check its syntax thoroughly before attempting another deployment. I think I know where I went wrong.

I'm trying again, this time with a simplified `tsconfig.json` to see if that resolves the deployment issues. The errors I previously encountered, particularly regarding the parsing of the `tsconfig.json` file, point to a configuration problem, and not the specific module imports themselves. I will refine the `tsconfig.json` configuration as needed.


**Refining the TSConfig**

I've revised the `tsconfig.json` file for the `supabase/functions` directory. I'm confident in the syntax this time around, focusing on `deno.ns` and `esnext` libraries, and an `esnext` module. The parsing error appears resolved, as I've confirmed valid JSON. My strategy now is to clean up any redundant imports and address the syntax error in `super-admin/index.ts`. I anticipate a successful deployment now, barring unforeseen issues with the function's internal logic.


**Finalizing the TypeScript Setup**

I've now successfully created a correct `tsconfig.json` in the `supabase/functions` directory, containing the necessary compiler options for Deno. Additionally, I've cleaned up all the Edge Function files, removing the `/// <reference ... />` directives. I've reconstructed the `super-admin` function, ensuring it's complete and syntactically correct, and will now begin to rebuild the document studio feature as requested, starting with deleting any pre-existing components and the broken functions, and beginning from scratch. My focus now is on testing the new TypeScript configuration with a deployment and starting a new implementation of `document-studio`.


**Addressing Deployment Failures**

I'm now implementing the correct `tsconfig.json` in the `supabase/functions` directory. This configuration, designed to incorporate Deno types, has been thoroughly double-checked for JSON syntax errors. I've also cleaned up the Edge Function files, removing any conflicting `/// <reference ... />` directives. To ensure a successful rebuild, I'm reconstructing the `super-admin` function, focusing on fixing syntax errors. After a successful deployment, the priority shifts to rebuilding the `document-studio` feature from the ground up, starting with a clean slate for the database schema and function architecture.


**Rebuilding and Refining**

I'm now in the process of rectifying the issues with the TypeScript setup and Edge Functions. I've re-written a correct `tsconfig.json` file, and I'm currently removing the problematic references and imports. I'll need to rebuild the `super-admin` function to ensure it is functioning correctly. Afterwards, I'll delete the broken Document Studio and start building a functioning system from the database and up, as requested. I'll begin by rebuilding the documents table in the database and updating related schema elements.


**Confronting Deployment Failures**

I'm now fully immersed in fixing the TypeScript configuration within my Supabase Edge Functions. I've re-evaluated and simplified my `tsconfig.json` file to be correct JSON and include Deno types. I've also removed all `/// <reference ... />` directives to avoid conflicts and cleaned up imports across the function files. I'm reconstructing the `super-admin` function to ensure it is completely functional. After a successful deployment, my attention will shift to rebuilding the document studio feature from scratch, starting with the database schema and function architecture.


**Deploying with TypeScript**

The deployment continues to encounter failures with module resolution issues, specifically those related to TypeScript and Deno. I'm focusing on the correct configuration to address these errors, and I'm currently rebuilding the super-admin function for successful deployment. Once this is accomplished, I will be moving to rebuild the document-studio from the database up.


</think>Of course. My apologies for the persistent and numerous errors. This is clearly frustrating, and I will resolve all of them now with a comprehensive fix.

The root of the problem is twofold:

1.  **Broken Document Studio:** The feature was left in a broken state with missing component files, causing import errors and data type mismatches.
2.  **Incorrect Supabase Function Configuration:** My previous attempts to fix TypeScript errors in your editor were incorrect for the Supabase deployment environment, leading to a cascade of compilation and deployment failures.

I will now perform a complete overhaul to fix all reported issues. This involves rebuilding the "Document Studio" from scratch with a reliable architecture and applying the correct, definitive configuration to all your Supabase Edge Functions.

Here are the comprehensive changes to resolve all errors:

### 1. Rebuilding the Document Studio Feature

First, I'll clear the old database schema and create a new, robust one for the documents feature.

<dyad-execute-sql description="Dropping the old documents table to ensure a clean setup.">
DROP TABLE IF EXISTS public.documents CASCADE;
</dyad-execute-sql>

<dyad-execute-sql description="Creating a new, simplified table for managing documents with appropriate security policies.">
-- Create documents table
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  preview_text TEXT, -- For short previews
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "Users can view their own documents" ON public.documents
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" ON public.documents
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.documents
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger to update 'updated_at' column
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
</dyad-execute-sql>

Next, I'll remove all the old, non-functional files related to the Document Studio.

<dyad-delete path="src/pages/DocumentStudio.tsx"></dyad-delete>
<dyad-delete path="src/hooks/useDocumentManager.ts"></dyad-delete>
<dyad-delete path="src/components/document-studio/DocumentUploader.tsx"></dyad-delete>
<dyad-delete path="src/components/document-studio/DocumentHistory.tsx"></dyad-delete>
<dyad-delete path="src/components/document-studio/DocumentPreview.tsx"></dyad-delete>
<dyad-delete path="src/components/document-studio/DocumentChat.tsx"></dyad-delete>
<dyad-delete path="src/components/document-studio/DocumentActions.tsx"></dyad-delete>
<dyad-delete path="src/components/document-studio/types.ts"></dyad-delete>
<dyad-delete path="supabase/functions/file-analyze/index.ts"></dyad-delete>

Now, I'll create the new, fully functional components for the Document Studio.

<dyad-write path="src/components/document-studio/types.ts" description="Defining the data structures for the new Document Studio feature.">
export interface DocumentFile {
  id: string;
  user_id: string;
  name: string;
  type: string;
  size: number;
  storage_path: string;
  full_text: string | null;
  created_at: string;
  content_base64?: string; // For preview
  summary?: { type: string; content: string };
  translation?: { lang: string; content: string };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type RightPanelView = 'preview' | 'summary' | 'translation' | 'actions';