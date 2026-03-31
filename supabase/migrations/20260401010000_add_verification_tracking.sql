-- Add tracking for verified email notification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified_sent BOOLEAN DEFAULT FALSE;

-- Update RLS to allow users to update their own notification flags
CREATE POLICY "Users can update own notification flags" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
