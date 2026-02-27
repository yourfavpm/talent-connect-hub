-- Migration: Add current_step and onboarding_status to talents table
-- Run: 2026-02-27

ALTER TABLE talents
  ADD COLUMN IF NOT EXISTS current_step integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'draft'
    CHECK (onboarding_status IN ('draft', 'submitted', 'under_review', 'revision_required', 'approved'));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_talents_onboarding_status ON talents(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_talents_user_id_step ON talents(user_id, current_step);
