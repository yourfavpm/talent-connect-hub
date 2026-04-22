-- ============================================================
-- COHORT SCHEMA ENHANCEMENT
-- Adds enrollment dates, slots, and duration to cohorts
-- Standardizes session and assignment column names
-- ============================================================

-- ── 1. Update cohorts table ──────────────────────────────────
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cohorts' AND column_name = 'enrollment_start_date') THEN
        ALTER TABLE public.cohorts ADD COLUMN enrollment_start_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cohorts' AND column_name = 'enrollment_end_date') THEN
        ALTER TABLE public.cohorts ADD COLUMN enrollment_end_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cohorts' AND column_name = 'end_date') THEN
        ALTER TABLE public.cohorts ADD COLUMN end_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cohorts' AND column_name = 'price_usd') THEN
        ALTER TABLE public.cohorts ADD COLUMN price_usd DECIMAL(10, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cohorts' AND column_name = 'price_naira') THEN
        ALTER TABLE public.cohorts ADD COLUMN price_naira DECIMAL(15, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cohorts' AND column_name = 'zoom_link') THEN
        ALTER TABLE public.cohorts ADD COLUMN zoom_link TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cohorts' AND column_name = 'max_slots') THEN
        ALTER TABLE public.cohorts ADD COLUMN max_slots INT DEFAULT 25;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cohorts' AND column_name = 'current_slots') THEN
        ALTER TABLE public.cohorts ADD COLUMN current_slots INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cohorts' AND column_name = 'duration_weeks') THEN
        ALTER TABLE public.cohorts ADD COLUMN duration_weeks INT DEFAULT 4;
    END IF;
END $$;

-- ── 2. Standardize sessions table ──────────────────────────────
-- Rename join_link to meeting_url if it exists as join_link AND meeting_url does not exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'join_link') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'meeting_url') THEN
        ALTER TABLE public.sessions RENAME COLUMN join_link TO meeting_url;
    END IF;
END $$;

-- Rename date to session_date if it exists as date AND session_date does not exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'date') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'session_date') THEN
        ALTER TABLE public.sessions RENAME COLUMN date TO session_date;
    END IF;
END $$;

-- Ensure meeting_url and session_date exist
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS meeting_url TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_date TIMESTAMPTZ;

-- ── 3. Standardize assignments table ───────────────────────────
-- Rename due_date to deadline_at if it exists as due_date AND deadline_at does not exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'due_date') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'deadline_at') THEN
        ALTER TABLE public.assignments RENAME COLUMN due_date TO deadline_at;
    END IF;
END $$;

-- Ensure deadline_at exists
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMPTZ;

-- ── 4. Fix Enrollment Relationships (Fixes Dashboard Crash) ──
-- Ensure cohort_id in academy_enrollments is a UUID and has a foreign key
DO $$ 
BEGIN
    -- Add cohort_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academy_enrollments' AND column_name = 'cohort_id') THEN
        ALTER TABLE public.academy_enrollments ADD COLUMN cohort_id UUID;
    ELSE
        -- If it exists, ensure it is UUID type
        ALTER TABLE public.academy_enrollments ALTER COLUMN cohort_id TYPE UUID USING cohort_id::uuid;
    END IF;

    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_enrollment_cohort') THEN
        ALTER TABLE public.academy_enrollments 
        ADD CONSTRAINT fk_enrollment_cohort 
        FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);
    END IF;

    -- Add course_uuid if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academy_enrollments' AND column_name = 'course_uuid') THEN
        ALTER TABLE public.academy_enrollments ADD COLUMN course_uuid UUID REFERENCES public.academy_courses(id);
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.academy_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_cohort_id ON public.academy_enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_uuid ON public.academy_enrollments(course_uuid);

-- ── 5. Seed/Update existing cohorts for testing ────────────────
UPDATE public.cohorts 
SET 
    enrollment_start_date = now() - interval '1 week',
    enrollment_end_date = now() + interval '2 weeks',
    max_slots = 30,
    duration_weeks = 4
WHERE enrollment_start_date IS NULL;
