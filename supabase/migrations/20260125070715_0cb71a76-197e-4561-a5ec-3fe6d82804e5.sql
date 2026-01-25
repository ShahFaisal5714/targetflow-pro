-- Create table for custom terms and conditions
CREATE TABLE public.custom_invoice_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_invoice_terms ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own custom terms"
ON public.custom_invoice_terms
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom terms"
ON public.custom_invoice_terms
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom terms"
ON public.custom_invoice_terms
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom terms"
ON public.custom_invoice_terms
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_custom_invoice_terms_updated_at
BEFORE UPDATE ON public.custom_invoice_terms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();