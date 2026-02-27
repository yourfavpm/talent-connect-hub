-- Migration: Add onboarding_meta and last_saved_step
-- Run: 2026-02-27

ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS last_saved_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS completed_steps INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_meta JSONB DEFAULT '{}'::jsonb;

-- Update existing records if necessary
UPDATE public.talents SET last_saved_step = current_step WHERE last_saved_step IS NULL;
