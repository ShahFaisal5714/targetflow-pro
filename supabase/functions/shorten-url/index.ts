import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ShortenUrlRequest {
  originalUrl: string;
  documentNumber: string;
  documentType: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { originalUrl, documentNumber, documentType }: ShortenUrlRequest = await req.json();

    if (!originalUrl || !documentNumber) {
      throw new Error("Missing required fields: originalUrl or documentNumber");
    }

    // Generate a short code based on document number
    // Clean the document number to create a URL-friendly slug
    const shortCode = documentNumber
      .replace(/[^a-zA-Z0-9-]/g, '')
      .toLowerCase();

    // Check if this document already has a short URL
    const { data: existing } = await supabase
      .from('short_urls')
      .select('short_code')
      .eq('document_number', documentNumber)
      .single();

    if (existing) {
      // Update the existing URL
      await supabase
        .from('short_urls')
        .update({ original_url: originalUrl, updated_at: new Date().toISOString() })
        .eq('document_number', documentNumber);

      const shortUrl = `${supabaseUrl}/functions/v1/redirect/${existing.short_code}`;
      return new Response(JSON.stringify({ success: true, shortUrl }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create new short URL entry
    const { error } = await supabase
      .from('short_urls')
      .insert({
        short_code: shortCode,
        original_url: originalUrl,
        document_number: documentNumber,
        document_type: documentType,
      });

    if (error) {
      // If duplicate short_code, append a random suffix
      const uniqueCode = `${shortCode}-${Date.now().toString(36).slice(-4)}`;
      await supabase
        .from('short_urls')
        .insert({
          short_code: uniqueCode,
          original_url: originalUrl,
          document_number: documentNumber,
          document_type: documentType,
        });

      const shortUrl = `${supabaseUrl}/functions/v1/redirect/${uniqueCode}`;
      return new Response(JSON.stringify({ success: true, shortUrl }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const shortUrl = `${supabaseUrl}/functions/v1/redirect/${shortCode}`;

    return new Response(JSON.stringify({ success: true, shortUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in shorten-url function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
