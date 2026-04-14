-- START FILE: 20260412_academy_enrollments.sql

-- ============================================================
-- ACADEMY ENROLLMENTS & TRANSACTIONS
-- ============================================================

-- ── 1. Create custom types first ──────────────────────────────

-- Enum for enrollment status
DO $$ BEGIN
    CREATE TYPE enum_enrollment_status AS ENUM (
        'pending_payment',
        'active',
        'completed',
        'cancelled',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum for transaction status
DO $$ BEGIN
    CREATE TYPE enum_transaction_status AS ENUM (
        'pending',
        'processing',
        'success',
        'failed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ── 2. academy_enrollments table ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.academy_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_phone TEXT,
    student_country TEXT,
    cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
    enrollment_status enum_enrollment_status DEFAULT 'active',
    price_usd DECIMAL(10, 2) NOT NULL,
    price_naira DECIMAL(15, 2),
    currency TEXT DEFAULT 'USD',
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_granted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 3. course_transactions table ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paystack_reference TEXT UNIQUE NOT NULL,
    amount_naira DECIMAL(15, 2) NOT NULL,
    amount_usd DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status enum_transaction_status DEFAULT 'pending',
    payment_method TEXT DEFAULT 'paystack',
    authorization_url TEXT,
    access_code TEXT,
    receipt_url TEXT,
    customer_code TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 4. Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_academy_enrollments_user_id ON academy_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_course_id ON academy_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_status ON academy_enrollments(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_course_transactions_user_id ON course_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_transactions_enrollment_id ON course_transactions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_course_transactions_reference ON course_transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_course_transactions_status ON course_transactions(status);

-- ── 5. RLS Policies ─────────────────────────────────────────────

ALTER TABLE academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_transactions ENABLE ROW LEVEL SECURITY;

-- Enrollment Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own enrollments" ON academy_enrollments;
CREATE POLICY "Users can view their own enrollments" ON academy_enrollments
        FOR SELECT USING (auth.uid()::uuid = user_id::uuid OR public.is_admin(auth.uid()::uuid));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert their own enrollments" ON academy_enrollments;
CREATE POLICY "Users can insert their own enrollments" ON academy_enrollments
        FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins can view all enrollments" ON academy_enrollments;
CREATE POLICY "Admins can view all enrollments" ON academy_enrollments
        FOR SELECT USING (public.is_admin(auth.uid()::uuid));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Transaction Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own transactions" ON course_transactions;
CREATE POLICY "Users can view their own transactions" ON course_transactions
        FOR SELECT USING (auth.uid()::uuid = user_id::uuid OR public.is_admin(auth.uid()::uuid));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert their own transactions" ON course_transactions;
CREATE POLICY "Users can insert their own transactions" ON course_transactions
        FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── 6. Permissions ──────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE ON academy_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON course_transactions TO authenticated;
GRANT ALL ON academy_enrollments TO service_role;
GRANT ALL ON course_transactions TO service_role;


-- END FILE: 20260412_academy_enrollments.sql


-- START FILE: 20260413_academy_automation_final.sql

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

DROP POLICY IF EXISTS "Students can view their own certificates" ON public.academy_certificates;
CREATE POLICY "Students can view their own certificates"
    ON public.academy_certificates FOR SELECT
    USING (auth.uid() = student_id::uuid);

DROP POLICY IF EXISTS "Admins can manage certificates" ON public.academy_certificates;
CREATE POLICY "Admins can manage certificates"
    ON public.academy_certificates FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id::uuid = auth.uid() AND role = 'admin'
    ));

-- 2. Function to generate certificate number
DROP FUNCTION IF EXISTS public.generate_cert_number() CASCADE;
CREATE OR REPLACE FUNCTION public.generate_cert_number()
RETURNS trigger AS $$
BEGIN
    NEW.certificate_number := 'OPS-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8)) || '-' || TO_CHAR(NOW(), 'YYYY');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_cert_number ON public.academy_certificates;
CREATE TRIGGER tr_generate_cert_number BEFORE INSERT ON public.academy_certificates
    FOR EACH ROW EXECUTE FUNCTION public.generate_cert_number();

-- 3. pg_cron Reminders
-- Note: Requires pg_cron extension to be enabled in Supabase Dashboard
-- This script only defines the reminder dispatch logic

DROP FUNCTION IF EXISTS public.dispatch_session_reminders() CASCADE;
CREATE OR REPLACE FUNCTION public.dispatch_session_reminders()
RETURNS void AS $$
DECLARE
    session_record RECORD;
BEGIN
    -- Hourly check for sessions starting in 24h or 1h
    FOR session_record IN 
        SELECT s.*, c.name as cohort_name
        FROM sessions s
        JOIN cohorts c ON s.cohort_id::uuid = c.id::uuid
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


-- END FILE: 20260413_academy_automation_final.sql


-- START FILE: 20260413_academy_hub_core.sql

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
DROP POLICY IF EXISTS "Public can view courses" ON public.academy_courses;
CREATE POLICY "Public can view courses" ON public.academy_courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage courses" ON public.academy_courses;
CREATE POLICY "Admins can manage courses" ON public.academy_courses FOR ALL USING (public.is_admin(auth.uid()::uuid));

-- Recordings: Only enrolled students
DROP POLICY IF EXISTS "Enrolled students can view recordings" ON public.academy_recordings;
CREATE POLICY "Enrolled students can view recordings" ON public.academy_recordings
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE academy_enrollments.cohort_id = academy_recordings.cohort_id
          AND academy_enrollments.user_id::uuid = auth.uid()
          AND academy_enrollments.enrollment_status = 'active'
    ) OR public.is_admin(auth.uid()::uuid)
);

DROP POLICY IF EXISTS "Admins can manage recordings" ON public.academy_recordings;
CREATE POLICY "Admins can manage recordings" ON public.academy_recordings FOR ALL USING (public.is_admin(auth.uid()::uuid));

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


-- END FILE: 20260413_academy_hub_core.sql


-- START FILE: 20260413_academy_hub_rich_metadata.sql

-- ============================================================
-- ACADEMY HUB - SCHEMA EXPANSION (Rich Course Metadata)
-- ============================================================

-- Add rich metadata columns to academy_courses
ALTER TABLE public.academy_courses 
ADD COLUMN IF NOT EXISTS tagline text,
ADD COLUMN IF NOT EXISTS learning_outcomes jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS curriculum jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tools jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS what_youll_learn jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS who_is_it_for jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS bonus_description text,
ADD COLUMN IF NOT EXISTS slots_total integer DEFAULT 25,
ADD COLUMN IF NOT EXISTS slots_filled integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_cohort_date text;

-- Update RLS (already exists but ensures all columns are accessible)
-- Policy for public read already exists from previous migration

-- SEED DATA UPDATE (Example for AI Operations)
UPDATE public.academy_courses
SET 
    tagline = 'Master the AI-First Operations Workflow',
    learning_outcomes = '["Automate complex business processes using AI agents", "Design custom GPTs for organizational efficiency", "Architect multi-model operational pipelines"]',
    curriculum = '[
        {"week": 1, "topic": "AI Foundations & Prompt Architecture", "details": ["The Prompt Engineering Framework", "Tool-use & Function Calling", "Temperature & Top-P Tuning"]},
        {"week": 2, "topic": "Process Automation with Zapier/Make AI", "details": ["Trigger mapping", "Multi-step AI chains", "Error handling in AI workflows"]}
    ]',
    tools = '["ChatGPT", "Zapier", "Make.com", "Claude", "Notion AI"]',
    what_youll_learn = '["Advanced Prompt Engineering", "AI Workflow Mapping", "Custom GPT Development", "Agentic Process Automation"]',
    who_is_it_for = '["Operational Leaders", "Executive Assistants", "Efficiency Consultants", "Product Managers"]',
    bonus_description = 'Top students in the flagship cohort will receive a MacBook Air M3 to support their new high-performance career.',
    next_cohort_date = 'May 12, 2026'
WHERE slug = 'ai-operations';


-- END FILE: 20260413_academy_hub_rich_metadata.sql


-- START FILE: 20260413_academy_live_cohorts.sql

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

CREATE INDEX IF NOT EXISTS idx_cohorts_course_id ON public.cohorts(course_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON public.cohorts(status);

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

CREATE INDEX IF NOT EXISTS idx_sessions_cohort_id ON public.sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(date);

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

CREATE INDEX IF NOT EXISTS idx_announcements_cohort_id ON public.announcements(cohort_id);

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

CREATE INDEX IF NOT EXISTS idx_assignments_cohort_id ON public.assignments(cohort_id);

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

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions(student_id);

-- Academy Certificates (Consolidated below with certificate_number support)

CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON public.academy_certificates(student_id);

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
DROP POLICY IF EXISTS "Public can view cohorts" ON public.cohorts;
CREATE POLICY "Public can view cohorts" ON public.cohorts FOR SELECT USING (true);

-- Sessions: Only enrolled students can see sessions for their cohort
DROP POLICY IF EXISTS "Enrolled students can view cohort sessions" ON public.sessions;
CREATE POLICY "Enrolled students can view cohort sessions" ON public.sessions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE academy_enrollments.cohort_id = sessions.cohort_id
          AND academy_enrollments.user_id::uuid = auth.uid()
          AND academy_enrollments.enrollment_status = 'active'
    ) OR public.is_admin(auth.uid()::uuid)
);

-- Announcements: Only enrolled students
DROP POLICY IF EXISTS "Enrolled students can view announcements" ON public.announcements;
CREATE POLICY "Enrolled students can view announcements" ON public.announcements
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE academy_enrollments.cohort_id = announcements.cohort_id
          AND academy_enrollments.user_id::uuid = auth.uid()
          AND academy_enrollments.enrollment_status = 'active'
    ) OR public.is_admin(auth.uid()::uuid)
);

-- Assignments: Only enrolled students
DROP POLICY IF EXISTS "Enrolled students can view assignments" ON public.assignments;
CREATE POLICY "Enrolled students can view assignments" ON public.assignments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE academy_enrollments.cohort_id = assignments.cohort_id
          AND academy_enrollments.user_id::uuid = auth.uid()
          AND academy_enrollments.enrollment_status = 'active'
    ) OR public.is_admin(auth.uid()::uuid)
);

-- Submissions: Students can view and manage their own submissions
DROP POLICY IF EXISTS "Students can view own submissions" ON public.submissions;
CREATE POLICY "Students can view own submissions" ON public.submissions
FOR SELECT USING (auth.uid()::uuid = student_id::uuid OR public.is_admin(auth.uid()::uuid));

DROP POLICY IF EXISTS "Students can insert own submissions" ON public.submissions;
CREATE POLICY "Students can insert own submissions" ON public.submissions
FOR INSERT WITH CHECK (auth.uid() = student_id::uuid);

DROP POLICY IF EXISTS "Students can update own submissions" ON public.submissions;
CREATE POLICY "Students can update own submissions" ON public.submissions
FOR UPDATE USING (auth.uid() = student_id::uuid) WITH CHECK (auth.uid() = student_id::uuid);

-- Certificates: Students can view own certificates
DROP POLICY IF EXISTS "Students can view own certificates" ON public.academy_certificates;
CREATE POLICY "Students can view own certificates" ON public.academy_certificates
FOR SELECT USING (auth.uid()::uuid = student_id::uuid OR public.is_admin(auth.uid()::uuid));

-- ── ADMIN POLICIES ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage cohorts" ON public.cohorts;
CREATE POLICY "Admins can manage cohorts" ON public.cohorts FOR ALL USING (public.is_admin(auth.uid()::uuid));
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.sessions;
CREATE POLICY "Admins can manage sessions" ON public.sessions FOR ALL USING (public.is_admin(auth.uid()::uuid));
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.is_admin(auth.uid()::uuid));
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;
CREATE POLICY "Admins can manage assignments" ON public.assignments FOR ALL USING (public.is_admin(auth.uid()::uuid));
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.submissions;
CREATE POLICY "Admins can manage submissions" ON public.submissions FOR ALL USING (public.is_admin(auth.uid()::uuid));
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.academy_certificates;
CREATE POLICY "Admins can manage certificates" ON public.academy_certificates FOR ALL USING (public.is_admin(auth.uid()::uuid));


-- END FILE: 20260413_academy_live_cohorts.sql


-- START FILE: 20260413_academy_master_v2.sql

-- ============================================================
-- ACADEMY HUB - CONSOLIDATED MASTER MIGRATION (V2)
-- ============================================================

-- ── 1. EXTENSIONS & ENUMS ─────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_net; -- Required for webhooks

-- Safely add 'student' role to app_role enum
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';
    END IF;
END $$;

-- Enrollment Status Enum
DO $$ BEGIN
    CREATE TYPE enum_enrollment_status AS ENUM (
        'pending_payment',
        'active',
        'completed',
        'cancelled',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ── 2. CORE TABLES ──────────────────────────────────────────

-- System settings for orchestration
CREATE TABLE IF NOT EXISTS public.settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    value text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Academy Courses (Merged with rich metadata)
CREATE TABLE IF NOT EXISTS public.academy_courses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    tagline text,
    description text,
    price_usd numeric DEFAULT 0,
    price_naira numeric DEFAULT 0,
    duration text,
    level text,
    outcome text,
    is_live boolean DEFAULT false,
    image_url text,
    learning_outcomes jsonb DEFAULT '[]',
    curriculum jsonb DEFAULT '[]',
    tools jsonb DEFAULT '[]',
    what_youll_learn jsonb DEFAULT '[]',
    who_is_it_for jsonb DEFAULT '[]',
    bonus_description text,
    slots_total integer DEFAULT 25,
    slots_filled integer DEFAULT 0,
    next_cohort_date text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Academy Cohorts
CREATE TABLE IF NOT EXISTS public.cohorts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id uuid REFERENCES public.academy_courses(id) ON DELETE CASCADE,
    name text NOT NULL,
    start_date date NOT NULL,
    status text DEFAULT 'open', -- open, full, completed, cancelled
    created_at timestamp with time zone DEFAULT now()
);

-- Live Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
    title text NOT NULL,
    session_date date NOT NULL,
    start_time text NOT NULL,
    meeting_url text,
    recording_url text,
    status text DEFAULT 'scheduled', -- scheduled, live, completed
    created_at timestamp with time zone DEFAULT now()
);

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Assignments (Consolidated above)

-- Submissions & Grading (Consolidated above)

-- Automated Certificates (Consolidated above)

-- ── 3. RLS & POLICIES ─────────────────────────────────────────

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;

-- Anonymous/Authenticated Read Access
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public read access for academy courses" ON public.academy_courses;
    DROP POLICY IF EXISTS "Public read access for academy courses" ON public.academy_courses;
CREATE POLICY "Public read access for academy courses" ON public.academy_courses FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Anyone can see cohorts" ON public.cohorts;
    DROP POLICY IF EXISTS "Anyone can see cohorts" ON public.cohorts;
CREATE POLICY "Anyone can see cohorts" ON public.cohorts FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Anyone can see sessions" ON public.sessions;
    DROP POLICY IF EXISTS "Anyone can see sessions" ON public.sessions;
CREATE POLICY "Anyone can see sessions" ON public.sessions FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Anyone can see announcements" ON public.announcements;
    DROP POLICY IF EXISTS "Anyone can see announcements" ON public.announcements;
CREATE POLICY "Anyone can see announcements" ON public.announcements FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.academy_enrollments;
    DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.academy_enrollments;
CREATE POLICY "Students can view their own enrollments" ON public.academy_enrollments FOR SELECT USING (auth.uid() = user_id::uuid);

    DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
    DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
CREATE POLICY "Students can view their own submissions" ON public.submissions FOR SELECT USING (auth.uid() = student_id::uuid);
    
    DROP POLICY IF EXISTS "Students can view their own certificates" ON public.academy_certificates;
    DROP POLICY IF EXISTS "Students can view their own certificates" ON public.academy_certificates;
CREATE POLICY "Students can view their own certificates" ON public.academy_certificates FOR SELECT USING (auth.uid() = student_id::uuid);
END $$;

-- Admin Management
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid()) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id::uuid = COALESCE(p_user_id, auth.uid()) 
        AND role IN (
            'super_admin', 'admin', 'talent_manager', 'operations_manager', 
            'billing_manager', 'support_manager', 'operations_admin', 
            'vetting_admin', 'finance_admin', 'support_admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Role Check
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id::uuid = p_user_id 
        AND role = p_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can manage courses" ON public.academy_courses;
    DROP POLICY IF EXISTS "Admins can manage courses" ON public.academy_courses;
CREATE POLICY "Admins can manage courses" ON public.academy_courses FOR ALL USING (public.is_admin());

    DROP POLICY IF EXISTS "Admins can manage cohorts" ON public.cohorts;
    DROP POLICY IF EXISTS "Admins can manage cohorts" ON public.cohorts;
CREATE POLICY "Admins can manage cohorts" ON public.cohorts FOR ALL USING (public.is_admin());

    DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.academy_enrollments;
    DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.academy_enrollments;
CREATE POLICY "Admins can manage enrollments" ON public.academy_enrollments FOR ALL USING (public.is_admin());
END $$;

-- ── 4. WEBHOOK TRIGGERS ───────────────────────────────────────

DROP FUNCTION IF EXISTS public.trigger_academy_event() CASCADE;
CREATE OR REPLACE FUNCTION public.trigger_academy_event()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  event_type text;
  webhook_url text;
  webhook_key text;
BEGIN
  -- Get configuration from settings
  SELECT value INTO webhook_url FROM settings WHERE name = 'edge_function_url';
  SELECT value INTO webhook_key FROM settings WHERE name = 'service_role_key';
  
  IF webhook_url IS NULL OR webhook_key IS NULL THEN
    RETURN NEW; -- Skip if not configured
  END IF;

  -- Determine event type
  IF TG_TABLE_NAME = 'sessions' THEN
    event_type := 'session';
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
  END IF;

  -- Dispatch
  IF payload IS NOT NULL THEN
    PERFORM net.http_post(
        url := webhook_url || '/academy-events',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || webhook_key),
        body := jsonb_build_object('event_type', event_type, 'payload', payload)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (Triggers defined for sessions/announcements/etc)
DROP TRIGGER IF EXISTS tr_academy_session_notify ON public.sessions;
DROP TRIGGER IF EXISTS tr_academy_session_notify ON public.sessions;
CREATE TRIGGER tr_academy_session_notify AFTER INSERT ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

DROP TRIGGER IF EXISTS tr_academy_announcement_notify ON public.announcements;
DROP TRIGGER IF EXISTS tr_academy_announcement_notify ON public.announcements;
CREATE TRIGGER tr_academy_announcement_notify AFTER INSERT ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

-- ── 5. AUTOMATION & DEFAULTS ──────────────────────────────────

-- Certificate numbering logic
DROP FUNCTION IF EXISTS public.generate_cert_number() CASCADE;
CREATE OR REPLACE FUNCTION public.generate_cert_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.certificate_number IS NULL THEN
        NEW.certificate_number := 'OPS-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8)) || '-' || TO_CHAR(NOW(), 'YYYY');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_cert_number ON public.academy_certificates;
DROP TRIGGER IF EXISTS tr_generate_cert_number ON public.academy_certificates;
CREATE TRIGGER tr_generate_cert_number BEFORE INSERT ON public.academy_certificates FOR EACH ROW EXECUTE FUNCTION public.generate_cert_number();

-- ── 6. SEED DATA (Optional Template) ──────────────────────────
INSERT INTO settings (name, value, description) 
VALUES 
('edge_function_url', 'YOUR_SUPABASE_PROJECT_URL/functions/v1', 'Base URL for Edge Functions'),
('service_role_key', 'YOUR_SERVICE_ROLE_KEY', 'Service role key for internal triggers')
ON CONFLICT (name) DO NOTHING;


-- END FILE: 20260413_academy_master_v2.sql


-- START FILE: 20260413_academy_webhooks.sql

-- ============================================================
-- ACADEMY HUB - EVENT TRIGGERS (Webhooks)
-- ============================================================

-- Function to trigger academy-events Edge Function
DROP FUNCTION IF EXISTS public.trigger_academy_event() CASCADE;
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
DROP TRIGGER IF EXISTS tr_academy_session_notify ON public.sessions;
CREATE TRIGGER tr_academy_session_notify AFTER INSERT ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

DROP TRIGGER IF EXISTS tr_academy_announcement_notify ON public.announcements;
DROP TRIGGER IF EXISTS tr_academy_announcement_notify ON public.announcements;
CREATE TRIGGER tr_academy_announcement_notify AFTER INSERT ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

DROP TRIGGER IF EXISTS tr_academy_assignment_notify ON public.assignments;
DROP TRIGGER IF EXISTS tr_academy_assignment_notify ON public.assignments;
CREATE TRIGGER tr_academy_assignment_notify AFTER INSERT ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

DROP TRIGGER IF EXISTS tr_academy_grading_notify ON public.submissions;
DROP TRIGGER IF EXISTS tr_academy_grading_notify ON public.submissions;
CREATE TRIGGER tr_academy_grading_notify AFTER UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();


-- END FILE: 20260413_academy_webhooks.sql


-- START FILE: 20260413_add_student_role.sql

-- Add 'student' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';


-- END FILE: 20260413_add_student_role.sql


-- ============================================================
-- FINAL OMEGA SYNC - REPAIR & NORMALIZATION
-- ============================================================
BEGIN;

DO $$ BEGIN
    -- 1. Standardize Audit Logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='audit_logs') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='actor_admin_id') THEN
            ALTER TABLE public.audit_logs RENAME COLUMN actor_admin_id TO admin_id;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='user_id') THEN
            ALTER TABLE public.audit_logs RENAME COLUMN user_id TO admin_id;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='admin_id' AND data_type='text') THEN
            ALTER TABLE public.audit_logs ALTER COLUMN admin_id TYPE UUID USING admin_id::uuid;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='module') THEN
            ALTER TABLE public.audit_logs ADD COLUMN module TEXT;
        END IF;
    END IF;

    -- 2. Clean Clients user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='user_id' AND data_type='text') THEN
        ALTER TABLE public.clients ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
    END IF;

    -- 3. Notifications Fix
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='v2_notifications') THEN
        ALTER TABLE public.v2_notifications DROP CONSTRAINT IF EXISTS v2_notifications_type_check;
        ALTER TABLE public.v2_notifications ADD CONSTRAINT v2_notifications_type_check 
        CHECK (type IN ('CHANGES_REQUESTED','SECTION_APPROVED','PROFILE_SUBMITTED','PROFILE_VETTED','VETTING_NOTE'));
    END IF;

    -- Audit Logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='audit_logs') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='admin_users') THEN
        ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_id_fkey;
        ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON DELETE SET NULL;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
