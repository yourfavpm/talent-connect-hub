-- Migration: Additional Fields for External Jobs
-- Description: Adds salary_range, years_of_experience, and industry to the jobs table.

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS salary_range TEXT,
ADD COLUMN IF NOT EXISTS years_of_experience TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT;

-- Add comments
COMMENT ON COLUMN public.jobs.salary_range IS 'Optional salary range for external jobs (e.g. $50k - $70k)';
COMMENT ON COLUMN public.jobs.years_of_experience IS 'Optional years of experience required (e.g. 3-5 years)';
COMMENT ON COLUMN public.jobs.industry IS 'Optional industry for external job postings';
