-- Migration: External Job Postings Support
-- Description: Adds columns to support jobs posted from external sites and makes client_id nullable for such jobs.

-- 1. Allow NULL client_id for external jobs
ALTER TABLE public.jobs ALTER COLUMN client_id DROP NOT NULL;

-- 2. Add external support columns to jobs
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS external_url TEXT,
ADD COLUMN IF NOT EXISTS external_company TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- 3. Update job_type enum constraint
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_job_type_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_job_type_check CHECK (job_type IN ('public', 'internal', 'external'));

-- 4. Update RLS policies to ensure external jobs are visible to talent
-- External jobs should be visible to all authenticated users with 'talent' role
DROP POLICY IF EXISTS "Talents can view external jobs" ON public.jobs;
CREATE POLICY "Talents can view external jobs" ON public.jobs 
FOR SELECT 
USING (
    (job_type = 'external' AND status = 'published')
    OR
    (public.has_role(auth.uid(), 'talent') AND status = 'published')
);

-- 5. Add comments
COMMENT ON COLUMN public.jobs.external_url IS 'URL to the job posting on an external site';
COMMENT ON COLUMN public.jobs.external_company IS 'Name of the company for external job postings';
COMMENT ON COLUMN public.jobs.location IS 'Job location (e.g., Remote, Lagos, London)';
