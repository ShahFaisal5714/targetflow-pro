import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const handler = async (req: Request): Promise<Response> => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract short code from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const shortCode = pathParts[pathParts.length - 1];

    if (!shortCode) {
      return new Response("Short code not found", { status: 404 });
    }

    // Look up the original URL
    const { data, error } = await supabase
      .from('short_urls')
      .select('original_url')
      .eq('short_code', shortCode)
      .single();

    if (error || !data) {
      return new Response("URL not found", { status: 404 });
    }

    // Redirect to original URL
    return new Response(null, {
      status: 302,
      headers: {
        "Location": data.original_url,
      },
    });
  } catch (error) {
    console.error("Error in redirect function:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

serve(handler);
