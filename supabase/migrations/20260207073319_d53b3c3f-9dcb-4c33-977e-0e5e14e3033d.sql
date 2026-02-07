-- Create table for short URLs
CREATE TABLE public.short_urls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_code TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  document_number TEXT NOT NULL,
  document_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_short_urls_short_code ON public.short_urls(short_code);
CREATE INDEX idx_short_urls_document_number ON public.short_urls(document_number);

-- Enable RLS
ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage short URLs (edge functions use service role)
CREATE POLICY "Service role can manage short_urls"
ON public.short_urls
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow anyone to read short URLs for redirects
CREATE POLICY "Anyone can read short_urls for redirect"
ON public.short_urls
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_short_urls_updated_at
BEFORE UPDATE ON public.short_urls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();