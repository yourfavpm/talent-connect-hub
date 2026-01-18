-- 1. Wipe Data (ORDER MATTERS due to Foreign Keys)
TRUNCATE TABLE 
    public.notifications,
    public.timesheets,
    public.invoices,
    public.contracts,
    public.offers,
    public.job_applications,
    public.jobs
RESTART IDENTITY CASCADE;

-- 2. Lock Approved Timesheets (RLS)
-- Prevent modification if status is approved or rejected (final states)
CREATE POLICY "Prevent update of finalized timesheets"
ON public.timesheets
FOR UPDATE
TO authenticated
USING (
    status NOT IN ('approved', 'rejected') 
    -- Allow admins to theoretically force update? 
    -- Or just lock it strictly. Let's lock strictly for now.
    -- If admin needs to fix, they can delete and recreate or we add special override later.
)
WITH CHECK (
    status NOT IN ('approved', 'rejected')
);
