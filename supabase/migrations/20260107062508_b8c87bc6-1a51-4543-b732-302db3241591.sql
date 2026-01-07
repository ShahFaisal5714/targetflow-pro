-- Add company_id to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS company_id text;

-- Add company_id to delivery_orders table
ALTER TABLE public.delivery_orders 
ADD COLUMN IF NOT EXISTS company_id text;