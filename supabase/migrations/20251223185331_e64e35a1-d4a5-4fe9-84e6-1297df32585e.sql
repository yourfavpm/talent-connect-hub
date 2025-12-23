-- Add new fields to jobs table for enhanced job posting
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS service_model text,
ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS work_mode text,
ADD COLUMN IF NOT EXISTS salary_type text DEFAULT 'hourly',
ADD COLUMN IF NOT EXISTS experience_required integer,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add comment for clarity
COMMENT ON COLUMN public.jobs.service_model IS 'direct_hire, trial_to_hire, one_time_project, offshore_hiring';
COMMENT ON COLUMN public.jobs.work_mode IS 'remote, onsite, hybrid';
COMMENT ON COLUMN public.jobs.salary_type IS 'hourly, weekly, monthly';