-- ============================================================
-- COHORT SCHEMA ENHANCEMENT
-- Adds enrollment dates, slots, and duration to cohorts
-- Standardizes session and assignment column names
-- ============================================================

-- ── 1. Update cohorts table ──────────────────────────────────
ALTER TABLE public.cohorts 
ADD COLUMN IF NOT EXISTS enrollment_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS enrollment_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS max_slots INT DEFAULT 25,
ADD COLUMN IF NOT EXISTS current_slots INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_weeks INT DEFAULT 4;

-- ── 2. Standardize sessions table ──────────────────────────────
-- Rename join_link to meeting_url if it exists as join_link
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'join_link') THEN
        ALTER TABLE public.sessions RENAME COLUMN join_link TO meeting_url;
    END IF;
END $$;

-- Ensure meeting_url exists (in case neither did)
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS meeting_url TEXT;

-- ── 3. Standardize assignments table ───────────────────────────
-- Rename due_date to deadline_at if it exists as due_date
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'due_date') THEN
        ALTER TABLE public.assignments RENAME COLUMN due_date TO deadline_at;
    END IF;
END $$;

-- Ensure deadline_at exists
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMPTZ;

-- ── 4. Seed/Update existing cohorts for testing ────────────────
UPDATE public.cohorts 
SET 
    enrollment_start_date = now() - interval '1 week',
    enrollment_end_date = now() + interval '2 weeks',
    max_slots = 30,
    duration_weeks = 4
WHERE enrollment_start_date IS NULL;
