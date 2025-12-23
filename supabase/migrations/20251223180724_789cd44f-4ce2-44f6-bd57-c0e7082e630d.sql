-- Add assigned_manager column to talents table for talent manager assignment
ALTER TABLE public.talents 
ADD COLUMN IF NOT EXISTS assigned_manager uuid REFERENCES auth.users(id);

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_talents_assigned_manager ON public.talents(assigned_manager);