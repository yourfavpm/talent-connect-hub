-- ============================================================
-- ACADEMY SCHEMA STANDARDIZATION & RLS HARMONIZATION
-- Ensures student_id is used consistently across all tables and policies
-- ============================================================

-- 1. Standardize academy_enrollments column name
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'academy_enrollments' AND column_name = 'user_id') THEN
        ALTER TABLE public.academy_enrollments RENAME COLUMN user_id TO student_id;
    END IF;
END $$;

-- 2. Update RLS Policies for academy_enrollments
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.academy_enrollments;
CREATE POLICY "Students can view their own enrollments" ON public.academy_enrollments
FOR SELECT USING (student_id = auth.uid() OR public.is_admin());

-- 3. Update RLS Policies for Assignments
DROP POLICY IF EXISTS "Students can view cohort assignments" ON public.assignments;
CREATE POLICY "Students can view cohort assignments" ON public.assignments
FOR SELECT USING (
    public.is_admin() OR
    cohort_id IN (
        SELECT cohort_id FROM academy_enrollments 
        WHERE student_id = auth.uid() 
        AND enrollment_status IN ('enrolled', 'active', 'completed')
    )
);

-- 4. Update RLS Policies for Sessions
DROP POLICY IF EXISTS "Students can view their cohort sessions" ON public.sessions;
CREATE POLICY "Students can view their cohort sessions" ON public.sessions
FOR SELECT USING (
    public.is_admin() OR
    cohort_id IN (
        SELECT cohort_id FROM academy_enrollments 
        WHERE student_id = auth.uid() 
        AND enrollment_status IN ('enrolled', 'active', 'completed')
    )
);

-- 5. Update RLS Policies for Announcements
DROP POLICY IF EXISTS "Students can view their cohort announcements" ON public.announcements;
CREATE POLICY "Students can view their cohort announcements" ON public.announcements
FOR SELECT USING (
    public.is_admin() OR
    cohort_id IN (
        SELECT cohort_id FROM academy_enrollments 
        WHERE student_id = auth.uid() 
        AND enrollment_status IN ('enrolled', 'active', 'completed')
    )
);

-- 6. Update RLS Policies for Submissions
DROP POLICY IF EXISTS "Students can view own submissions" ON public.submissions;
CREATE POLICY "Students can view own submissions" ON public.submissions
FOR SELECT USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Students can create submissions" ON public.submissions;
CREATE POLICY "Students can create submissions" ON public.submissions
FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can update own draft submissions" ON public.submissions;
CREATE POLICY "Students can update own draft submissions" ON public.submissions
FOR UPDATE USING (student_id = auth.uid() AND (is_draft = true OR status = 'draft'));

-- 7. Update Dashboard RPC
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
        WHERE ae.student_id = p_user_id AND ae.enrollment_status IN ('enrolled', 'active', 'completed')
    ) e;

    -- Get Next 3 Sessions
    SELECT jsonb_agg(s) INTO v_sessions
    FROM (
        SELECT s.id, s.title, s.session_date, s.start_time, s.meeting_url, c.name as cohort_name
        FROM sessions s
        JOIN cohorts c ON s.cohort_id = c.id
        WHERE s.cohort_id IN (SELECT cohort_id FROM academy_enrollments WHERE student_id = p_user_id AND enrollment_status IN ('enrolled', 'active', 'completed'))
        AND s.session_date >= CURRENT_DATE
        ORDER BY s.session_date ASC, s.start_time ASC
        LIMIT 3
    ) s;

    -- Get Latest 2 Announcements
    SELECT jsonb_agg(a) INTO v_announcements
    FROM (
        SELECT id, title, content, image_url, created_at
        FROM announcements
        WHERE cohort_id IN (SELECT cohort_id FROM academy_enrollments WHERE student_id = p_user_id AND enrollment_status IN ('enrolled', 'active', 'completed'))
        ORDER BY created_at DESC
        LIMIT 2
    ) a;

    -- Get Pending Assignments
    SELECT jsonb_agg(asg) INTO v_assignments
    FROM (
        SELECT a.id, a.title, a.deadline_at, a.allow_late_submissions, c.name as cohort_name
        FROM assignments a
        JOIN cohorts c ON a.cohort_id = c.id
        WHERE a.cohort_id IN (SELECT cohort_id FROM academy_enrollments WHERE student_id = p_user_id AND enrollment_status IN ('enrolled', 'active', 'completed'))
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
