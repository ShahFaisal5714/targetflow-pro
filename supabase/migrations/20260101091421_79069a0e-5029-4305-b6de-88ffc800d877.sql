-- Fix projects table RLS policies to restrict access to owner only

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all projects" ON public.projects;

-- Drop the overly permissive UPDATE policy  
DROP POLICY IF EXISTS "Users can update projects" ON public.projects;

-- Drop the overly permissive DELETE policy
DROP POLICY IF EXISTS "Users can delete projects" ON public.projects;

-- Create owner-scoped SELECT policy
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create owner-scoped UPDATE policy
CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create owner-scoped DELETE policy
CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);