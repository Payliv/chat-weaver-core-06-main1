import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Starting cleanup of stalled generations...');

    // Find generations that are stuck in progress for more than 3 minutes
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    
    const { data: stalledGenerations, error: fetchError } = await supabase
      .from('ebook_generations')
      .select('*')
      .in('status', ['pending', 'generating_toc', 'generating_chapters', 'assembling'])
      .lt('created_at', threeMinutesAgo);

    if (fetchError) {
      console.error('❌ Error fetching stalled generations:', fetchError);
      throw fetchError;
    }

    if (!stalledGenerations || stalledGenerations.length === 0) {
      console.log('✅ No stalled generations found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No stalled generations found',
          cleaned: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Found ${stalledGenerations.length} stalled generations`);

    // Mark them as failed with appropriate error message
    let cleanedCount = 0;
    for (const generation of stalledGenerations) {
      try {
        const { error: updateError } = await supabase
          .from('ebook_generations')
          .update({
            status: 'failed',
            error_message: 'Génération interrompue automatiquement après 3 minutes d\'inactivité (timeout global atteint).',
            completed_at: new Date().toISOString()
          })
          .eq('id', generation.id);

        if (updateError) {
          console.error(`❌ Error updating generation ${generation.id}:`, updateError);
        } else {
          console.log(`✅ Cleaned stalled generation: ${generation.id} (${generation.title})`);
          cleanedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing generation ${generation.id}:`, error);
      }
    }

    console.log(`🧹 Cleanup completed: ${cleanedCount}/${stalledGenerations.length} generations cleaned`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleaned ${cleanedCount} stalled generations`,
        cleaned: cleanedCount,
        total_found: stalledGenerations.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});