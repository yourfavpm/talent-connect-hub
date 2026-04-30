-- ============================================================
-- COMPREHENSIVE ACADEMY FLOW & SECURITY HARMONIZATION
-- ============================================================

-- 1. HARMONIZE IS_ADMIN FUNCTION
-- Ensure all administrative roles are recognized
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND lower(role::text) IN (
            'super_admin', 
            'operations_admin', 
            'vetting_admin', 
            'finance_admin', 
            'support_admin', 
            'talent_manager', 
            'admin', 
            'super admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. BROADEN RLS POLICIES TO INCLUDE 'ENROLLED' STATUS
-- This ensures students see content even if their status hasn't been manually moved to 'active'

-- Assignments
DROP POLICY IF EXISTS "Students can view cohort assignments" ON public.assignments;
CREATE POLICY "Students can view cohort assignments" ON public.assignments
FOR SELECT USING (
    public.is_admin() OR
    cohort_id IN (
        SELECT cohort_id FROM academy_enrollments 
        WHERE user_id = auth.uid() 
        AND enrollment_status IN ('enrolled', 'active', 'completed')
    )
);

-- Sessions
DROP POLICY IF EXISTS "Secure access for sessions" ON public.sessions;
DROP POLICY IF EXISTS "Students can view their cohort sessions" ON public.sessions;
CREATE POLICY "Secure access for sessions" ON public.sessions
FOR SELECT USING (
    public.is_admin() OR
    cohort_id IN (
        SELECT cohort_id FROM academy_enrollments 
        WHERE user_id = auth.uid() 
        AND enrollment_status IN ('enrolled', 'active', 'completed')
    )
);

-- Announcements
DROP POLICY IF EXISTS "Students can view their cohort announcements" ON public.announcements;
CREATE POLICY "Students can view their cohort announcements" ON public.announcements
FOR SELECT USING (
    public.is_admin() OR
    cohort_id IN (
        SELECT cohort_id FROM academy_enrollments 
        WHERE user_id = auth.uid() 
        AND enrollment_status IN ('enrolled', 'active', 'completed')
    )
);

-- 3. UPDATE DASHBOARD RPC
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
    v_certs_count int;
BEGIN
    -- Get Profile Stats
    SELECT full_name, streak_count INTO v_full_name, v_streak_count 
    FROM profiles WHERE user_id = p_user_id;

    -- Get Certificate Count
    SELECT COUNT(*) INTO v_certs_count FROM certificates WHERE student_id = p_user_id;

    -- Get Enrollments (including enrolled and completed)
    SELECT jsonb_agg(e) INTO v_enrollments
    FROM (
        SELECT 
            ae.id, 
            ae.course_id, 
            ae.course_name, 
            ae.cohort_id, 
            ae.progress_percent, 
            ae.enrollment_status,
            c.name as cohort_name,
            c.status as cohort_status,
            c.is_closed as cohort_is_closed
        FROM academy_enrollments ae
        JOIN cohorts c ON ae.cohort_id = c.id
        WHERE ae.user_id = p_user_id AND ae.enrollment_status IN ('enrolled', 'active', 'completed')
    ) e;

    -- Get Next 3 Sessions
    SELECT jsonb_agg(s) INTO v_sessions
    FROM (
        SELECT s.id, s.title, s.session_date, s.start_time, s.meeting_url, c.name as cohort_name
        FROM sessions s
        JOIN cohorts c ON s.cohort_id = c.id
        WHERE s.cohort_id IN (SELECT cohort_id FROM academy_enrollments WHERE user_id = p_user_id AND enrollment_status IN ('enrolled', 'active', 'completed'))
        AND s.session_date >= CURRENT_DATE
        ORDER BY s.session_date ASC, s.start_time ASC
        LIMIT 3
    ) s;

    -- Get Latest 2 Announcements
    SELECT jsonb_agg(a) INTO v_announcements
    FROM (
        SELECT id, title, content, image_url, created_at
        FROM announcements
        WHERE cohort_id IN (SELECT cohort_id FROM academy_enrollments WHERE user_id = p_user_id AND enrollment_status IN ('enrolled', 'active', 'completed'))
        ORDER BY created_at DESC
        LIMIT 2
    ) a;

    -- Get Pending Assignments
    SELECT jsonb_agg(asg) INTO v_assignments
    FROM (
        SELECT a.id, a.title, a.deadline_at, a.allow_late_submissions, c.name as cohort_name
        FROM assignments a
        JOIN cohorts c ON a.cohort_id = c.id
        WHERE a.cohort_id IN (SELECT cohort_id FROM academy_enrollments WHERE user_id = p_user_id AND enrollment_status IN ('enrolled', 'active', 'completed'))
        AND NOT EXISTS (SELECT 1 FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = p_user_id AND s.status != 'draft')
        ORDER BY a.deadline_at ASC
        LIMIT 3
    ) asg;

    -- Calculate Avg Grade
    SELECT ROUND(AVG(grade::numeric), 1) INTO v_avg_grade
    FROM submissions
    WHERE student_id = p_user_id AND grade ~ '^[0-9.]+$';

    RETURN jsonb_build_object(
        'profile', jsonb_build_object(
            'full_name', v_full_name, 
            'streak_count', v_streak_count,
            'certificates_count', COALESCE(v_certs_count, 0)
        ),
        'enrollments', COALESCE(v_enrollments, '[]'::jsonb),
        'sessions', COALESCE(v_sessions, '[]'::jsonb),
        'announcements', COALESCE(v_announcements, '[]'::jsonb),
        'assignments', COALESCE(v_assignments, '[]'::jsonb),
        'avg_grade', v_avg_grade
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
