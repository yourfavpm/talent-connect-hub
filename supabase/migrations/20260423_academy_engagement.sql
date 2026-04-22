-- Add mentors to cohorts
ALTER TABLE public.cohorts 
ADD COLUMN IF NOT EXISTS mentors jsonb DEFAULT '[]';

-- Add last announcement check to enrollments for badge logic
ALTER TABLE public.academy_enrollments 
ADD COLUMN IF NOT EXISTS last_announcement_check timestamp with time zone DEFAULT now();

-- Add mentor info to sessions (optional but good for visibility)
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS mentor_id uuid;

-- RLS Policies for new columns (usually inherited from table)
-- No changes needed as table-level RLS is already enabled.

-- Helper for email triggering (Internal)
CREATE TABLE IF NOT EXISTS public.academy_email_queue (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_email text NOT NULL,
    template_type text NOT NULL, -- enrollment, announcement, reminder
    variables jsonb DEFAULT '{}',
    status text DEFAULT 'pending', -- pending, sent, failed
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.academy_email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view queue" ON public.academy_email_queue FOR ALL USING (public.is_admin());

