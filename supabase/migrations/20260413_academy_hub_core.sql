-- ============================================================
-- ACADEMY HUB - CORE DATABASE SCHEMA (Dynamic Migration)
-- ============================================================

-- ── 1. academy_courses ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.academy_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    duration TEXT,
    level TEXT CHECK (level IN ('Beginner', 'Intermediate')),
    outcome TEXT,
    tools TEXT[],
    price_usd DECIMAL(10, 2) NOT NULL,
    price_naira DECIMAL(15, 2) NOT NULL,
    is_live BOOLEAN DEFAULT true,
    is_flagship BOOLEAN DEFAULT false,
    has_bonus BOOLEAN DEFAULT false,
    bonus_description TEXT,
    image_url TEXT,
    category TEXT,
    curriculum JSONB, -- Stores the CurriculumWeek[] structure
    what_youll_learn TEXT[],
    outcomes TEXT[],
    who_is_it_for TEXT[],
    testimonials JSONB, -- Stores testimonials structure
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_academy_courses_slug ON public.academy_courses(slug);
CREATE INDEX IF NOT EXISTS idx_academy_courses_category ON public.academy_courses(category);

-- ── 2. academy_recordings (ENTITIY) ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.academy_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    recording_url TEXT NOT NULL,
    duration_minutes INT,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recordings_session_id ON public.academy_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_recordings_cohort_id ON public.academy_recordings(cohort_id);

-- ── 3. Linking everything to academy_courses ─────────────────────

-- We need to change the references of cohorts and enrollments from static course slugs to the new academy_courses.id
-- For now, we'll keep course_id as TEXT in some places for backward compatibility or use slugs, 
-- but ideally, we should use the UUID.

ALTER TABLE public.cohorts ADD COLUMN IF NOT EXISTS course_uuid UUID REFERENCES public.academy_courses(id);
ALTER TABLE public.academy_enrollments ADD COLUMN IF NOT EXISTS course_uuid UUID REFERENCES public.academy_courses(id);

-- ── 4. RLS POLICIES ──────────────────────────────────────────────

ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_recordings ENABLE ROW LEVEL SECURITY;

-- Courses: Everyone can view active courses
CREATE POLICY "Public can view courses" ON public.academy_courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses" ON public.academy_courses FOR ALL USING (public.is_admin(auth.uid()));

-- Recordings: Only enrolled students
CREATE POLICY "Enrolled students can view recordings" ON public.academy_recordings
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE academy_enrollments.cohort_id = academy_recordings.cohort_id
          AND academy_enrollments.user_id = auth.uid()
          AND academy_enrollments.enrollment_status = 'active'
    ) OR public.is_admin(auth.uid())
);

CREATE POLICY "Admins can manage recordings" ON public.academy_recordings FOR ALL USING (public.is_admin(auth.uid()));

-- ── 5. SEED DATA ───────────────────────────────────────────────
-- Migrating from academy-courses.ts

INSERT INTO public.academy_courses (
    slug, title, tagline, description, duration, level, outcome, tools, 
    price_naira, price_usd, is_flagship, image_url, has_bonus, bonus_description,
    what_youll_learn, outcomes, who_is_it_for, curriculum
) VALUES 
(
    'ai-automation-for-operations', 
    'AI Automation for Operations', 
    'Build AI-Powered Workflows. Work With Global Clients.',
    'A 4-week intensive program where you master Zapier, Make, Notion AI, and GPT-4 to automate operations.',
    '4 Weeks', 
    'Beginner', 
    'AI Operations Specialist', 
    ARRAY['Zapier', 'Make.com', 'Notion AI', 'GPT-4', 'Airtable', 'Loom'],
    199000, 149, true, 
    'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80',
    true, 'The top-performing graduate of each cohort receives a MacBook Air M2.',
    ARRAY['Build automation workflows', 'Integrate GPT-4', 'Design AI processes'],
    ARRAY['Earn $2,500–$6,000/month', 'Work with global clients'],
    ARRAY['Ops professionals', 'Career switchers'],
    '[{"week": "Week 01", "title": "Foundations", "lessons": ["Logic", "Tools"]}, {"week": "Week 02", "title": "Automation", "lessons": ["Zapier", "Make"]}]'::jsonb
),
(
    'virtual-operations-management', 
    'Virtual Operations Management', 
    'Lead Remote Teams. Build Operating Systems That Scale.',
    'A 6-week intensive covering systems frameworks and leadership skills required to manage remote operations.',
    '6 Weeks', 
    'Intermediate', 
    'Remote Operations Manager', 
    ARRAY['ClickUp', 'Notion', 'Slack', 'Loom', 'Calendly'],
    249000, 179, false, 
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
    false, null,
    ARRAY['Design operating systems', 'Build SOPs', 'Manage distributed teams'],
    ARRAY['Earn $3,000–$7,000/month', 'Start-up infrastructure skills'],
    ARRAY['Ops professionals', 'Project managers'],
    '[{"week": "Week 01", "title": "Architecture", "lessons": ["Structure", "Mandate"]}]'::jsonb
);
