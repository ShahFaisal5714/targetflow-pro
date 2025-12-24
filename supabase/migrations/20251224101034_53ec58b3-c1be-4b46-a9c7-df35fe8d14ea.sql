-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can view all quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can update quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can delete quotations" ON public.quotations;

-- Create proper ownership-based policies
CREATE POLICY "Users can view their own quotations" 
ON public.quotations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotations" 
ON public.quotations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotations" 
ON public.quotations 
FOR DELETE 
USING (auth.uid() = user_id);