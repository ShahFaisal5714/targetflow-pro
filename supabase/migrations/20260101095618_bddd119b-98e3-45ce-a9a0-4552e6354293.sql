-- Add RLS policy for admins to view all projects
CREATE POLICY "Admins can view all projects" 
ON public.projects 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to update any project
CREATE POLICY "Admins can update all projects" 
ON public.projects 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to delete any project
CREATE POLICY "Admins can delete all projects" 
ON public.projects 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));