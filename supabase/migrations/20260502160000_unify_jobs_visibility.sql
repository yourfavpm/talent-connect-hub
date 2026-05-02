-- Migration: Unify Jobs Visibility
-- Description: Consolidates and fixes RLS policies for the jobs table to ensure public, internal, and external jobs are visible to the right audiences.

BEGIN;

-- 1. Cleanup existing restrictive or redundant policies
DROP POLICY IF EXISTS "Talents can view published jobs" ON public.jobs;
DROP POLICY IF EXISTS "Internal jobs visibility" ON public.jobs;
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Talents can view external jobs" ON public.jobs;
DROP POLICY IF EXISTS "Public can view published jobs" ON public.jobs;

-- 2. Create Unified Visibility Policies

-- A. Public Visibility: Anyone can see published jobs marked as public or external
CREATE POLICY "Public visibility for published jobs" ON public.jobs
FOR SELECT
USING (
    status = 'published' 
    AND (visibility = 'public' OR job_type = 'external')
);

-- B. Talent Visibility: Authenticated talents can see all published jobs
CREATE POLICY "Talent visibility for jobs" ON public.jobs
FOR SELECT
TO authenticated
USING (
    (status = 'published')
    OR
    -- Allow talents to see internal jobs they are linked to (via offers)
    (
        job_type = 'internal'
        AND id IN (
            SELECT job_id FROM public.offers 
            WHERE talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
        )
    )
);

-- C. Admin Visibility: Full access for all admin roles
-- We use the unified is_admin check which covers all admin types
CREATE POLICY "Admin full access to jobs" ON public.jobs
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- D. Client Visibility: Clients can see and manage their own jobs
CREATE POLICY "Client manage own jobs" ON public.jobs
FOR ALL
TO authenticated
USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
)
WITH CHECK (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
);

COMMIT;
