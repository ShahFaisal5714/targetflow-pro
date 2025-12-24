-- Create companies table
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  logo_url text,
  email text,
  phone text,
  address text,
  website text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own companies"
ON public.companies FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own companies"
ON public.companies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies"
ON public.companies FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies"
ON public.companies FOR DELETE
USING (auth.uid() = user_id);

-- Add company_id to projects table
ALTER TABLE public.projects ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- Add company_id to quotations table
ALTER TABLE public.quotations ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- Create trigger for updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();