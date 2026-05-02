-- 1. Add 'enrolled' to enrollment status enum if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'enum_enrollment_status' AND e.enumlabel = 'enrolled') THEN
        ALTER TYPE public.enum_enrollment_status ADD VALUE 'enrolled';
    END IF;
END $$;

-- 2. Update is_admin() to be more comprehensive
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND lower(role::text) IN (
        'admin', 
        'super_admin', 
        'super admin',
        'operations_admin', 
        'operations admin',
        'talent_manager', 
        'talent manager',
        'vetting_admin',
        'finance_admin',
        'support_admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Hardened RLS for Academy Content
-- Assignments
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students can view cohort assignments" ON public.assignments;

CREATE POLICY "Admins can manage assignments" ON public.assignments
    FOR ALL USING (public.is_admin());

CREATE POLICY "Students can view cohort assignments" ON public.assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.academy_enrollments
            WHERE user_id = auth.uid()
            AND cohort_id = assignments.cohort_id
            AND enrollment_status::text IN ('enrolled', 'active', 'completed')
        )
    );

-- Sessions
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.sessions;
DROP POLICY IF EXISTS "Students can view cohort sessions" ON public.sessions;

CREATE POLICY "Admins can manage sessions" ON public.sessions
    FOR ALL USING (public.is_admin());

CREATE POLICY "Students can view cohort sessions" ON public.sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.academy_enrollments
            WHERE user_id = auth.uid()
            AND cohort_id = sessions.cohort_id
            AND enrollment_status::text IN ('enrolled', 'active', 'completed')
        )
    );

-- Announcements
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Students can view cohort announcements" ON public.announcements;

CREATE POLICY "Admins can manage announcements" ON public.announcements
    FOR ALL USING (public.is_admin());

CREATE POLICY "Students can view cohort announcements" ON public.announcements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.academy_enrollments
            WHERE user_id = auth.uid()
            AND cohort_id = announcements.cohort_id
            AND enrollment_status::text IN ('enrolled', 'active', 'completed')
        )
    );

-- 4. Update get_student_dashboard_data RPC
CREATE OR REPLACE FUNCTION public.get_student_dashboard_data(_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    _enrollments JSONB;
    _stats JSONB;
    _next_sessions JSONB;
    _announcements JSONB;
BEGIN
    -- Get Active Enrollments (including 'enrolled' status)
    SELECT jsonb_agg(e) INTO _enrollments
    FROM (
        SELECT 
            ae.id,
            ae.cohort_id,
            ae.enrollment_status,
            ae.progress_percent,
            c.name as cohort_name,
            ac.title as course_name,
            ac.id as course_id
        FROM public.academy_enrollments ae
        JOIN public.cohorts c ON ae.cohort_id = c.id
        JOIN public.academy_courses ac ON c.course_id = ac.id
        WHERE ae.user_id = _user_id
        AND ae.enrollment_status::text IN ('enrolled', 'active', 'completed')
    ) e;

    -- Get Learning Stats
    SELECT jsonb_build_object(
        'courses_completed', COUNT(*) FILTER (WHERE enrollment_status::text = 'completed'),
        'total_points', COALESCE(SUM(progress_percent), 0) -- placeholder for points
    ) INTO _stats
    FROM public.academy_enrollments
    WHERE user_id = _user_id;

    -- Get Upcoming Sessions for Enrolled Cohorts
    SELECT jsonb_agg(s) INTO _next_sessions
    FROM (
        SELECT s.*
        FROM public.sessions s
        JOIN public.academy_enrollments ae ON s.cohort_id = ae.cohort_id
        WHERE ae.user_id = _user_id
        AND ae.enrollment_status::text IN ('enrolled', 'active')
        AND s.session_date >= CURRENT_DATE
        ORDER BY s.session_date ASC, s.start_time ASC
        LIMIT 3
    ) s;

    -- Get Announcements for Enrolled Cohorts
    SELECT jsonb_agg(a) INTO _announcements
    FROM (
        SELECT ann.*
        FROM public.announcements ann
        JOIN public.academy_enrollments ae ON ann.cohort_id = ae.cohort_id
        WHERE ae.user_id = _user_id
        AND ae.enrollment_status::text IN ('enrolled', 'active')
        ORDER BY ann.created_at DESC
        LIMIT 5
    ) a;

    RETURN jsonb_build_object(
        'enrollments', COALESCE(_enrollments, '[]'::jsonb),
        'stats', COALESCE(_stats, '{}'::jsonb),
        'next_sessions', COALESCE(_next_sessions, '[]'::jsonb),
        'announcements', COALESCE(_announcements, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
