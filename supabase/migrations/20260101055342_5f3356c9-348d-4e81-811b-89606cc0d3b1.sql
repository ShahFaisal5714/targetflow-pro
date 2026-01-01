-- Fix products table RLS policies to restrict access to owner only

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all products" ON public.products;

-- Drop the overly permissive UPDATE policy  
DROP POLICY IF EXISTS "Users can update products" ON public.products;

-- Drop the overly permissive DELETE policy
DROP POLICY IF EXISTS "Users can delete products" ON public.products;

-- Create owner-scoped SELECT policy
CREATE POLICY "Users can view their own products" 
ON public.products 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create owner-scoped UPDATE policy
CREATE POLICY "Users can update their own products" 
ON public.products 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create owner-scoped DELETE policy
CREATE POLICY "Users can delete their own products" 
ON public.products 
FOR DELETE 
USING (auth.uid() = user_id);