-- Add 'accepted' and 'declined' statuses to hr_v2_interview_status
ALTER TYPE public.hr_v2_interview_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE public.hr_v2_interview_status ADD VALUE IF NOT EXISTS 'declined';

-- Add RLS policies for hr_v2_interviews
-- Talents can view their own interviews
DO $$ BEGIN
    CREATE POLICY "Talents can view own interviews" ON public.hr_v2_interviews
        FOR SELECT USING (talent_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Talents can update their own interviews
DO $$ BEGIN
    CREATE POLICY "Talents can update own interviews" ON public.hr_v2_interviews
        FOR UPDATE USING (talent_user_id = auth.uid()) WITH CHECK (talent_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

NOTIFY pgrst, 'reload schema';

-- Drop the old version to avoid PostgREST ambiguity
DROP FUNCTION IF EXISTS public.hr_v2_admin_schedule_interview(UUID, UUID, UUID, TEXT, TIMESTAMPTZ);

-- Update hr_v2_admin_schedule_interview to support meeting_notes
CREATE OR REPLACE FUNCTION public.hr_v2_admin_schedule_interview(req_id UUID, t_user_id UUID, c_user_id UUID, c_link TEXT, s_time TIMESTAMPTZ, m_notes TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.hr_v2_interviews (hire_request_id, talent_user_id, client_user_id, scheduled_by_admin_id, calendly_link, scheduled_time, status, meeting_notes)
    VALUES (req_id, t_user_id, c_user_id, auth.uid(), c_link, s_time, 'pending', m_notes);

    UPDATE public.hr_v2_shortlists
    SET status = 'interview_scheduled', updated_at = now()
    WHERE hire_request_id = req_id AND talent_user_id = t_user_id;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type, meta)
    VALUES (req_id, 'admin', auth.uid(), 'INTERVIEW_SCHEDULED', jsonb_build_object('talent_user_id', t_user_id));
END;
$$;
