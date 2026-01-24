-- Add terms_conditions column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS terms_conditions TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.invoices.terms_conditions IS 'Array of selected term IDs to display on the invoice';