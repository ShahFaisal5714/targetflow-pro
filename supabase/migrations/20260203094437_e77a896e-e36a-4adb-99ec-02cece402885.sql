-- Create proforma_invoices table
CREATE TABLE public.proforma_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  proforma_number TEXT NOT NULL,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 5,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  valid_until DATE,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proforma_invoices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own proforma invoices"
ON public.proforma_invoices
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own proforma invoices"
ON public.proforma_invoices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proforma invoices"
ON public.proforma_invoices
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proforma invoices"
ON public.proforma_invoices
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_proforma_invoices_updated_at
BEFORE UPDATE ON public.proforma_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();