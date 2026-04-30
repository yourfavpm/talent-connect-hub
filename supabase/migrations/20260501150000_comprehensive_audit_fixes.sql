-- ============================================================
-- COMPREHENSIVE ACADEMY AUDIT FIXS
-- ============================================================

-- 1. SENSITIVE KEY CLEANUP
-- Remove service_role_key from settings table to prevent exposure
DELETE FROM public.settings WHERE name = 'service_role_key';

-- 2. IMPROVED CERTIFICATE NUMBER GENERATION (Entropy++)
CREATE OR REPLACE FUNCTION public.generate_cert_number()
RETURNS trigger AS $$
DECLARE
    rand_part text;
BEGIN
    IF NEW.certificate_number IS NULL THEN
        -- Use a combination of timestamp hash and longer random string (12 chars total)
        rand_part := UPPER(encode(gen_random_bytes(6), 'hex'));
        NEW.certificate_number := 'OPS-' || rand_part || '-' || TO_CHAR(NOW(), 'YYYY');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. ASSIGNMENT CONTROL (Deadlines & Late Submissions)
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS allow_late_submissions boolean DEFAULT true;

-- 4. GRADING NOTIFICATIONS TRIGGER
-- Function to notify student when grade is updated
CREATE OR REPLACE FUNCTION public.on_grade_update()
RETURNS trigger AS $$
BEGIN
    -- Only trigger if grade has changed and is not null
    IF (OLD.grade IS DISTINCT FROM NEW.grade AND NEW.grade IS NOT NULL) OR 
       (OLD.feedback IS DISTINCT FROM NEW.feedback AND NEW.feedback IS NOT NULL) THEN
        
        -- Insert into academy_notifications (assuming this table exists, or call edge function)
        -- For now, let's just trigger a webhook event
        PERFORM net.http_post(
            url := (SELECT value FROM settings WHERE name = 'edge_function_url') || '/academy-notifications',
            headers := jsonb_build_object('Content-Type', 'application/json'),
            body := jsonb_build_object(
                'event_type', 'grade_updated',
                'payload', jsonb_build_object(
                    'submission_id', NEW.id,
                    'student_id', NEW.student_id,
                    'grade', NEW.grade,
                    'feedback', NEW.feedback,
                    'assignment_title', (SELECT title FROM assignments WHERE id = NEW.assignment_id)
                )
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_notify_grade_update ON public.submissions;
CREATE TRIGGER tr_notify_grade_update 
AFTER UPDATE ON public.submissions 
FOR EACH ROW EXECUTE FUNCTION public.on_grade_update();

-- 5. DASHBOARD CONSOLIDATION RPC
-- Reduces 6+ queries to 1 for the Overview page
CREATE OR REPLACE FUNCTION public.get_student_dashboard_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_full_name text;
    v_streak_count int;
    v_enrollments jsonb;
    v_sessions jsonb;
    v_announcements jsonb;
    v_assignments jsonb;
    v_avg_grade numeric;
BEGIN
    -- Get Profile Stats
    SELECT full_name, streak_count INTO v_full_name, v_streak_count 
    FROM profiles WHERE user_id = p_user_id;

    -- Get Enrollments
    SELECT jsonb_agg(e) INTO v_enrollments
    FROM (
        SELECT id, course_id, course_name, cohort_id, progress_percent, enrollment_status
        FROM academy_enrollments 
        WHERE user_id = p_user_id AND enrollment_status = 'active'
    ) e;

    -- Get Next 3 Sessions
    SELECT jsonb_agg(s) INTO v_sessions
    FROM (
        SELECT s.id, s.title, s.session_date, s.start_time, s.meeting_url, c.name as cohort_name
        FROM sessions s
        JOIN cohorts c ON s.cohort_id = c.id
        WHERE s.cohort_id IN (SELECT cohort_id FROM academy_enrollments WHERE user_id = p_user_id AND enrollment_status = 'active')
        AND s.session_date >= CURRENT_DATE
        ORDER BY s.session_date ASC, s.start_time ASC
        LIMIT 3
    ) s;

    -- Get Latest 2 Announcements
    SELECT jsonb_agg(a) INTO v_announcements
    FROM (
        SELECT id, title, content, image_url, created_at
        FROM announcements
        WHERE cohort_id IN (SELECT cohort_id FROM academy_enrollments WHERE user_id = p_user_id AND enrollment_status = 'active')
        ORDER BY created_at DESC
        LIMIT 2
    ) a;

    -- Get Pending Assignments
    SELECT jsonb_agg(asg) INTO v_assignments
    FROM (
        SELECT a.id, a.title, a.deadline_at, a.allow_late_submissions, c.name as cohort_name
        FROM assignments a
        JOIN cohorts c ON a.cohort_id = c.id
        WHERE a.cohort_id IN (SELECT cohort_id FROM academy_enrollments WHERE user_id = p_user_id AND enrollment_status = 'active')
        AND NOT EXISTS (SELECT 1 FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = p_user_id)
        ORDER BY a.deadline_at ASC
        LIMIT 3
    ) asg;

    -- Calculate Avg Grade
    SELECT ROUND(AVG(grade::numeric), 1) INTO v_avg_grade
    FROM submissions
    WHERE student_id = p_user_id AND grade ~ '^[0-9.]+$';

    RETURN jsonb_build_object(
        'profile', jsonb_build_object('full_name', v_full_name, 'streak_count', v_streak_count),
        'enrollments', COALESCE(v_enrollments, '[]'::jsonb),
        'sessions', COALESCE(v_sessions, '[]'::jsonb),
        'announcements', COALESCE(v_announcements, '[]'::jsonb),
        'assignments', COALESCE(v_assignments, '[]'::jsonb),
        'avg_grade', v_avg_grade
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
