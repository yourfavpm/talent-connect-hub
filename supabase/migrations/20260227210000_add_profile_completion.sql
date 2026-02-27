-- Migration: Add profile_completion to talents table
-- Run: 2026-02-27

ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100);

-- Index for analytics/sorting if needed
CREATE INDEX IF NOT EXISTS idx_talents_profile_completion ON public.talents(profile_completion);
