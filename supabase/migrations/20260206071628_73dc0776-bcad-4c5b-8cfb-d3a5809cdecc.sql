-- Create storage bucket for temporary document PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('document-pdfs', 'document-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read PDFs (for WhatsApp sharing)
CREATE POLICY "Public can view document PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'document-pdfs');

-- Allow authenticated users to upload PDFs
CREATE POLICY "Authenticated users can upload document PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'document-pdfs' AND auth.uid() IS NOT NULL);

-- Allow users to delete their uploaded PDFs
CREATE POLICY "Authenticated users can delete document PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'document-pdfs' AND auth.uid() IS NOT NULL);

-- Create table to track document emails
CREATE TABLE public.document_email_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'invoice', 'proforma', 'quotation'
  document_id UUID NOT NULL,
  document_number TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_email_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their email history"
ON public.document_email_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their email history"
ON public.document_email_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_document_email_history_document 
ON public.document_email_history (document_type, document_id);

CREATE INDEX idx_document_email_history_user 
ON public.document_email_history (user_id);