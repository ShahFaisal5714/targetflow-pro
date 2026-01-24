-- Add company tracking to backup_history
ALTER TABLE public.backup_history 
ADD COLUMN IF NOT EXISTS company_id uuid,
ADD COLUMN IF NOT EXISTS company_name text;