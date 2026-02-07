import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { originalUrl, documentNumber, documentType } = await req.json();

    if (!originalUrl || !documentNumber || !documentType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if short URL already exists for this document
    const { data: existing } = await supabase
      .from('short_urls')
      .select('short_code')
      .eq('document_number', documentNumber)
      .eq('document_type', documentType)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ shortCode: existing.short_code }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate very short code: 4 chars from doc number + 4 random chars
    const docPrefix = documentNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toLowerCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const shortCode = `${docPrefix}${randomSuffix}`;

    // Insert new short URL
    const { error: insertError } = await supabase
      .from('short_urls')
      .insert({
        short_code: shortCode,
        original_url: originalUrl,
        document_number: documentNumber,
        document_type: documentType,
      });

    if (insertError) {
      console.error('Error inserting short URL:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create short URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ shortCode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Shorten URL error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
