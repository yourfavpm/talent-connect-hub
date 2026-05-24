-- Add missing RLS policy for talents to view their own shortlists
DO $$ BEGIN
    CREATE POLICY "Talents see their own shortlists" ON public.hr_v2_shortlists FOR SELECT USING (talent_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
