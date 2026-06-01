-- Fix: Talents were missing an INSERT policy on hr_v2_applications.
-- Without this, any attempt to apply for a job returned error 42501
-- (new row violates row-level security policy).

DO $$ BEGIN
    CREATE POLICY "Talents insert own applications"
        ON public.hr_v2_applications
        FOR INSERT
        WITH CHECK (talent_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Also allow talents to update their own applications (e.g. withdraw)
DO $$ BEGIN
    CREATE POLICY "Talents update own applications"
        ON public.hr_v2_applications
        FOR UPDATE
        USING (talent_user_id = auth.uid())
        WITH CHECK (talent_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

NOTIFY pgrst, 'reload schema';
