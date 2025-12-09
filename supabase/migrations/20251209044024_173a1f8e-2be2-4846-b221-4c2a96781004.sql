-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('residential', 'commercial', 'industrial')),
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'quoted', 'in_progress', 'delivered', 'closed')),
  value NUMERIC NOT NULL DEFAULT 0,
  sales_manager TEXT,
  contractor JSONB NOT NULL DEFAULT '{}',
  client JSONB NOT NULL DEFAULT '{}',
  consultant JSONB,
  timeline JSONB NOT NULL DEFAULT '{"startDate": "", "endDate": "", "milestones": []}',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view all projects"
ON public.projects
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();