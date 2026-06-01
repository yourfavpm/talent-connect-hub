-- Allow anonymous (unauthenticated) users to view published hire requests
-- This enables the public jobs board to work without authentication
CREATE POLICY "Public can view published hire requests"
    ON public.hr_v2_hire_requests
    FOR SELECT
    TO anon
    USING (status = 'published');
