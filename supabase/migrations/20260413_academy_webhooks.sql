-- ============================================================
-- ACADEMY HUB - EVENT TRIGGERS (Webhooks)
-- ============================================================

-- Function to trigger academy-events Edge Function
CREATE OR REPLACE FUNCTION public.trigger_academy_event()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  event_type text;
BEGIN
  -- Determine event type based on table name
  IF TG_TABLE_NAME = 'sessions' THEN
    event_type := 'session';
    -- Fetch cohort name for the email
    SELECT jsonb_build_object(
      'cohort_id', NEW.cohort_id,
      'title', NEW.title,
      'date', NEW.session_date,
      'time', NEW.start_time,
      'url', NEW.meeting_url,
      'cohort_name', (SELECT name FROM cohorts WHERE id = NEW.cohort_id)
    ) INTO payload;
  
  ELSIF TG_TABLE_NAME = 'announcements' THEN
    event_type := 'announcement';
    SELECT jsonb_build_object(
      'cohort_id', NEW.cohort_id,
      'title', NEW.title,
      'content', NEW.content,
      'cohort_name', (SELECT name FROM cohorts WHERE id = NEW.cohort_id)
    ) INTO payload;

  ELSIF TG_TABLE_NAME = 'assignments' THEN
    event_type := 'assignment';
    SELECT jsonb_build_object(
      'cohort_id', NEW.cohort_id,
      'title', NEW.title,
      'deadline', NEW.deadline_at,
      'cohort_name', (SELECT name FROM cohorts WHERE id = NEW.cohort_id)
    ) INTO payload;

  ELSIF TG_TABLE_NAME = 'submissions' AND (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status = 'reviewed' THEN
    event_type := 'grading';
    -- Find student email for individual notification
    SELECT jsonb_build_object(
      'student_email', (SELECT email FROM profiles WHERE id = NEW.student_id),
      'assignment_title', (SELECT title FROM assignments WHERE id = NEW.assignment_id),
      'status', NEW.status
    ) INTO payload;
  END IF;

  -- Dispatch to Edge Function
  IF payload IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := (SELECT value FROM settings WHERE name = 'edge_function_url') || '/academy-events',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM settings WHERE name = 'service_role_key')
        ),
        body := jsonb_build_object(
          'event_type', event_type,
          'payload', payload
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Triggers
DROP TRIGGER IF EXISTS tr_academy_session_notify ON public.sessions;
CREATE TRIGGER tr_academy_session_notify
  AFTER INSERT ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

DROP TRIGGER IF EXISTS tr_academy_announcement_notify ON public.announcements;
CREATE TRIGGER tr_academy_announcement_notify
  AFTER INSERT ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

DROP TRIGGER IF EXISTS tr_academy_assignment_notify ON public.assignments;
CREATE TRIGGER tr_academy_assignment_notify
  AFTER INSERT ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

DROP TRIGGER IF EXISTS tr_academy_grading_notify ON public.submissions;
CREATE TRIGGER tr_academy_grading_notify
  AFTER UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();
