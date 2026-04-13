-- ============================================================
-- ACADEMY HUB - CERTIFICATES & AUTOMATION (pg_cron)
-- ============================================================

-- 1. Certificates Table
CREATE TABLE IF NOT EXISTS public.academy_certificates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    enrollment_id uuid REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
    student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id text,
    cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
    certificate_number text UNIQUE,
    issued_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'
);

ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own certificates"
    ON public.academy_certificates FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage certificates"
    ON public.academy_certificates FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- 2. Function to generate certificate number
CREATE OR REPLACE FUNCTION public.generate_cert_number()
RETURNS trigger AS $$
BEGIN
    NEW.certificate_number := 'OPS-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8)) || '-' || TO_CHAR(NOW(), 'YYYY');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_cert_number
    BEFORE INSERT ON public.academy_certificates
    FOR EACH ROW EXECUTE FUNCTION public.generate_cert_number();

-- 3. pg_cron Reminders
-- Note: Requires pg_cron extension to be enabled in Supabase Dashboard
-- This script only defines the reminder dispatch logic

CREATE OR REPLACE FUNCTION public.dispatch_session_reminders()
RETURNS void AS $$
DECLARE
    session_record RECORD;
BEGIN
    -- Hourly check for sessions starting in 24h or 1h
    FOR session_record IN 
        SELECT s.*, c.name as cohort_name
        FROM sessions s
        JOIN cohorts c ON s.cohort_id = c.id
        WHERE s.status = 'scheduled'
        AND (
            (s.session_date + s.start_time::time) BETWEEN (NOW() + interval '23 hours') AND (NOW() + interval '24 hours')
            OR
            (s.session_date + s.start_time::time) BETWEEN (NOW() + interval '55 minutes') AND (NOW() + interval '65 minutes')
        )
    LOOP
        PERFORM net.http_post(
            url := (SELECT value FROM settings WHERE name = 'edge_function_url') || '/academy-events',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || (SELECT value FROM settings WHERE name = 'service_role_key')
            ),
            body := jsonb_build_object(
              'event_type', 'session',
              'payload', jsonb_build_object(
                'cohort_id', session_record.cohort_id,
                'title', '[REMINDER] ' || session_record.title,
                'date', session_record.session_date,
                'time', session_record.start_time,
                'url', session_record.meeting_url,
                'cohort_name', session_record.cohort_name
              )
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Scheduling (To be run by user in SQL Editor if possible, or just defined here)
-- SELECT cron.schedule('0 * * * *', 'SELECT public.dispatch_session_reminders()');
