-- Create backup_history table to track all backups
CREATE TABLE public.backup_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  filename text NOT NULL,
  format text NOT NULL DEFAULT 'sql',
  size_bytes bigint NOT NULL DEFAULT 0,
  tables_included text[] NOT NULL DEFAULT '{}',
  record_count integer NOT NULL DEFAULT 0,
  backup_type text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'completed',
  content text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- Create policies for backup_history
CREATE POLICY "Users can view their own backup history"
ON public.backup_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backups"
ON public.backup_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups"
ON public.backup_history FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_backup_history_user_created ON public.backup_history (user_id, created_at DESC);