-- ============================================================
-- ACADEMY LIVE COHORTS - Database Schema
-- Supports Live Sessions, Announcements, Assignments, and Certificates
-- ============================================================

-- ── 1. cohorts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT NOT NULL, -- Reference to the static course slug or dynamic course id
    name TEXT NOT NULL,      -- e.g., 'May 2026 Cohort'
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    price_usd DECIMAL(10, 2) NOT NULL,
    price_naira DECIMAL(15, 2),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'ongoing', 'completed', 'cancelled')),
    zoom_link TEXT,          -- Default/Recurrent meeting link
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cohorts_course_id ON public.cohorts(course_id);
CREATE INDEX idx_cohorts_status ON public.cohorts(status);

-- ── 2. sessions (Live Classes) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    duration_minutes INT DEFAULT 60,
    join_link TEXT,
    recording_url TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_cohort_id ON public.sessions(cohort_id);
CREATE INDEX idx_sessions_date ON public.sessions(date);

-- ── 3. announcements ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_announcements_cohort_id ON public.announcements(cohort_id);

-- ── 4. assignments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    deadline_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_assignments_cohort_id ON public.assignments(cohort_id);

-- ── 5. submissions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    link TEXT NOT NULL, -- Link to Google Drive, Loom, etc.
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed')),
    feedback TEXT,
    grade TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON public.submissions(student_id);

-- ── 6. academy_certificates ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academy_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    issue_date TIMESTAMPTZ DEFAULT now(),
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_certificates_student_id ON public.academy_certificates(student_id);

-- ── 7. Update academy_enrollments ────────────────────────────────
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academy_enrollments' AND column_name = 'cohort_id') THEN
        ALTER TABLE public.academy_enrollments ADD COLUMN cohort_id UUID REFERENCES public.cohorts(id);
    END IF;
END $$;

-- ── RLS POLICIES ────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;

-- Cohorts: Public can view sessions/info for SEO or info? 
-- Actually, keep it private or public select for info.
CREATE POLICY "Public can view cohorts" ON public.cohorts FOR SELECT USING (true);

-- Sessions: Only enrolled students can see sessions for their cohort
CREATE POLICY "Enrolled students can view cohort sessions" ON public.sessions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE academy_enrollments.cohort_id = sessions.cohort_id
          AND academy_enrollments.user_id = auth.uid()
          AND academy_enrollments.enrollment_status = 'active'
    ) OR public.is_admin(auth.uid())
);

-- Announcements: Only enrolled students
CREATE POLICY "Enrolled students can view announcements" ON public.announcements
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE academy_enrollments.cohort_id = announcements.cohort_id
          AND academy_enrollments.user_id = auth.uid()
          AND academy_enrollments.enrollment_status = 'active'
    ) OR public.is_admin(auth.uid())
);

-- Assignments: Only enrolled students
CREATE POLICY "Enrolled students can view assignments" ON public.assignments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE academy_enrollments.cohort_id = assignments.cohort_id
          AND academy_enrollments.user_id = auth.uid()
          AND academy_enrollments.enrollment_status = 'active'
    ) OR public.is_admin(auth.uid())
);

-- Submissions: Students can view and manage their own submissions
CREATE POLICY "Students can view own submissions" ON public.submissions
FOR SELECT USING (auth.uid() = student_id OR public.is_admin(auth.uid()));

CREATE POLICY "Students can insert own submissions" ON public.submissions
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own submissions" ON public.submissions
FOR UPDATE USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Certificates: Students can view own certificates
CREATE POLICY "Students can view own certificates" ON public.academy_certificates
FOR SELECT USING (auth.uid() = student_id OR public.is_admin(auth.uid()));

-- ── ADMIN POLICIES ───────────────────────────────────────────────
CREATE POLICY "Admins can manage cohorts" ON public.cohorts FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage sessions" ON public.sessions FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage assignments" ON public.assignments FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage submissions" ON public.submissions FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage certificates" ON public.academy_certificates FOR ALL USING (public.is_admin(auth.uid()));
