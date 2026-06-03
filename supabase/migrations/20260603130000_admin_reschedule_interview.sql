CREATE OR REPLACE FUNCTION public.hr_v2_admin_reschedule_interview(interview_id UUID, c_link TEXT, s_time TIMESTAMPTZ, m_notes TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.hr_v2_interviews
    SET status = 'scheduled', calendly_link = c_link, scheduled_time = s_time, meeting_notes = m_notes, updated_at = now()
    WHERE id = interview_id;
END;
$$;
