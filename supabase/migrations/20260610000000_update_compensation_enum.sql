-- Migration: Add 'annual' to compensation_type enum
ALTER TYPE public.compensation_type ADD VALUE IF NOT EXISTS 'annual';
