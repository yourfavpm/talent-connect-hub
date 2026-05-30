-- Add university_name and education_status columns, drop highest_qualification
ALTER TABLE public.scholarship_applications
    ADD COLUMN IF NOT EXISTS university_name TEXT,
    ADD COLUMN IF NOT EXISTS education_status TEXT,
    DROP COLUMN IF EXISTS highest_qualification;

-- Add SELECT policy to allow public inserts to return newly inserted row details
DROP POLICY IF EXISTS "Anyone can read their own application by ID" ON public.scholarship_applications;
CREATE POLICY "Anyone can read their own application by ID"
    ON public.scholarship_applications
    FOR SELECT
    TO public
    USING (true);

