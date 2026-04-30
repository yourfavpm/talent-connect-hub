-- ============================================================
-- ACADEMY DASHBOARD ENHANCEMENTS
-- Adds support for student stats, progress tracking, and rich announcements
-- ============================================================

-- ── 1. Enhance Profiles with Student Stats ──────────────────
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS streak_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_study_hours DECIMAL(10, 2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS global_rank INT,
ADD COLUMN IF NOT EXISTS certificates_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- ── 2. Enhance Announcements with Images ─────────────────────
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ── 3. Enhance Cohorts with Mentors ──────────────────────────
-- Assuming mentors is a JSONB array of { name, title, link, avatar_url }
ALTER TABLE public.cohorts
ADD COLUMN IF NOT EXISTS mentors JSONB DEFAULT '[]'::jsonb;

-- ── 4. Track Enrollment Progress ──────────────────────────────
ALTER TABLE public.academy_enrollments
ADD COLUMN IF NOT EXISTS progress_percent INT DEFAULT 0;

-- ── 5. Add RPC for Streak Maintenance (Optional but good) ────
-- This could be triggered by a cron or when a user logs in.
-- For now, we'll manually update via logic if needed, or just let it be managed by admin.

-- ── 6. Ensure RLS for new columns is handled by existing policies ──
-- Existing policies for profiles, announcements, and cohorts already handle these.
