-- Add university_name and education_status columns, drop highest_qualification
ALTER TABLE public.scholarship_applications
    ADD COLUMN IF NOT EXISTS university_name TEXT,
    ADD COLUMN IF NOT EXISTS education_status TEXT,
    DROP COLUMN IF EXISTS highest_qualification;
