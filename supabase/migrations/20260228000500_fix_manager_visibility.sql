-- Migration: Allow talents to view their assigned manager's profile
-- Date: 2026-02-28

-- Add policy to public.profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Talents can view their assigned manager profiles'
    ) THEN
        CREATE POLICY "Talents can view their assigned manager profiles" ON public.profiles
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.talents
                WHERE talents.user_id = auth.uid()
                AND talents.assigned_manager = profiles.user_id
            )
        );
    END IF;
END $$;
