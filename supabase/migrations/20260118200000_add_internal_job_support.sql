-- Add support for internal jobs (jobs created by admin without public posting)
-- These jobs serve as contract foundation when client didn't post publicly

-- Add job_type and visibility fields to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS job_type TEXT CHECK (job_type IN ('public', 'internal')) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS visibility TEXT CHECK (visibility IN ('public', 'private')) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES auth.users(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_visibility ON jobs(visibility);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by_admin ON jobs(created_by_admin_id);

-- Update RLS policies to handle internal jobs
-- Internal jobs should only be visible to:
-- 1. The assigned client
-- 2. The assigned talent (if linked via offer)
-- 3. Admins

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Internal jobs visibility" ON jobs;

-- Create policy for internal job visibility
CREATE POLICY "Internal jobs visibility" ON jobs
FOR SELECT
USING (
  -- Public jobs visible to all authenticated users
  (visibility = 'public' AND job_type = 'public')
  OR
  -- Internal jobs only visible to assigned client, talent, or admins
  (
    visibility = 'private' 
    AND job_type = 'internal'
    AND (
      -- Client can see their internal jobs
      client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
      OR
      -- Talent can see internal jobs they're linked to via offers
      id IN (
        SELECT job_id FROM offers 
        WHERE talent_id IN (
          SELECT id FROM talents WHERE user_id = auth.uid()
        )
      )
      OR
      -- Admins can see all internal jobs
      auth.uid() IN (
        SELECT user_id FROM user_roles 
        WHERE role IN ('super_admin', 'operations_admin')
      )
    )
  )
);

-- Add comment explaining internal jobs
COMMENT ON COLUMN jobs.job_type IS 'Type of job: public (posted by client) or internal (created by admin for direct hires)';
COMMENT ON COLUMN jobs.visibility IS 'Visibility: public (on job board) or private (only visible to client/talent/admin)';
COMMENT ON COLUMN jobs.created_by_admin_id IS 'Admin user who created this internal job (null for client-created jobs)';
