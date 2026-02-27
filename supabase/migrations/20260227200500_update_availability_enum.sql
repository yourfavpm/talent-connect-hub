-- Migration: Add 'contract' and 'hourly' to availability_type enum
-- Run: 2026-02-27

DO $$ BEGIN
    ALTER TYPE public.availability_type ADD VALUE 'contract';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE public.availability_type ADD VALUE 'hourly';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
