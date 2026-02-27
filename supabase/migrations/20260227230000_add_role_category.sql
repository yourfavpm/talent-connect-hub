-- Migration: Add role_category to talents
-- Run: 2026-02-27

ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS role_category TEXT;
