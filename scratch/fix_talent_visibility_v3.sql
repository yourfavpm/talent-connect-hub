-- FINAL FIX FOR TALENT VISIBILITY (V3)
-- This script fixes the "NULL concatenation" bug and reinforces RLS for Clients.

BEGIN;

-- 1. Create a safer, more resilient view
-- We use CONCAT_WS and individual COALESCE to ensure missing data doesn't hide the talent.
CREATE OR REPLACE VIEW public.client_visible_talents AS
SELECT
    tp.id as profile_id,
    t.id as talent_id,
    tp.user_id,
    tp.talent_id as display_id,
    -- RESILIENT NAME: Never returns NULL if at least one name piece exists
    COALESCE(
        (SELECT CONCAT_WS(' ', data->>'firstName', LEFT(data->>'lastName', 1) || '.')
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'basic_info'
         LIMIT 1),
        CONCAT_WS(' ', t.first_name, LEFT(t.last_name, 1) || '.')
    ) as anonymized_name,
    -- RESILIENT HEADLINE
    COALESCE(
        (SELECT (data->>'primaryRole')::text
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.primary_role,
        'Professional'
    ) as headline,
    tp.vetting_level,
    -- RESILIENT LOCATION
    COALESCE(
        (SELECT 
            CASE 
                WHEN (data->>'city') IS NOT NULL AND (data->>'country') IS NOT NULL 
                THEN (data->>'city')::text || ', ' || (data->>'country')::text
                ELSE (data->>'country')::text
            END
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'basic_info'),
        t.country,
        'Remote'
    ) as location,
    -- Experience
    COALESCE(
        (SELECT (data->>'yearsOfExperience')::int
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.years_of_experience,
        0
    ) as years_experience,
    -- Availability
    COALESCE(
        (SELECT (data->>'availability')::text
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.availability::text,
        'full_time'
    ) as availability,
    -- Skills
    COALESCE(
        (SELECT (data->'secondarySkills')
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        '[]'::jsonb
    ) as skills,
    p.avatar_url,
    (SELECT (data->>'shortBio')::text
     FROM public.v2_profile_sections
     WHERE user_id = tp.user_id AND section_key = 'professional_details') as bio,
    tp.vetted_at
FROM public.v2_talent_profiles tp
LEFT JOIN public.talents t ON tp.user_id = t.user_id
LEFT JOIN public.profiles p ON tp.user_id = p.user_id
WHERE tp.status = 'vetted' AND tp.visible_to_clients = true;

-- 2. REINFORCE RLS (Ensure Client role can read everything needed)
-- v2_talent_profiles
DROP POLICY IF EXISTS "Client reads vetted visible profiles" ON public.v2_talent_profiles;
CREATE POLICY "Client reads vetted visible profiles"
ON public.v2_talent_profiles FOR SELECT
USING (
    (public.has_role(auth.uid(), 'client') OR public.is_admin(auth.uid()))
    AND status = 'vetted'
    AND visible_to_clients = true
);

-- v2_profile_sections
DROP POLICY IF EXISTS "Client reads vetted visible sections" ON public.v2_profile_sections;
CREATE POLICY "Client reads vetted visible sections"
ON public.v2_profile_sections FOR SELECT
USING (
    (public.has_role(auth.uid(), 'client') OR public.is_admin(auth.uid()))
    AND section_key IN ('basic_info', 'professional_details', 'work_history', 'education', 'certifications')
    AND EXISTS (
        SELECT 1 FROM public.v2_talent_profiles tp
        WHERE tp.user_id = v2_profile_sections.user_id
          AND tp.status = 'vetted'
          AND tp.visible_to_clients = true
    )
);

-- profiles (Avatars)
DROP POLICY IF EXISTS "Client reads vetted visible avatars" ON public.profiles;
CREATE POLICY "Client reads vetted visible avatars"
ON public.profiles FOR SELECT
USING (
    (public.has_role(auth.uid(), 'client') OR public.is_admin(auth.uid()))
    AND EXISTS (
        SELECT 1 FROM public.v2_talent_profiles tp
        WHERE tp.user_id = profiles.user_id
          AND tp.status = 'vetted'
          AND tp.visible_to_clients = true
    )
);

-- talents (Legacy fallback)
DROP POLICY IF EXISTS "Client reads vetted visible talents" ON public.talents;
CREATE POLICY "Client reads vetted visible talents"
ON public.talents FOR SELECT
USING (
    (public.has_role(auth.uid(), 'client') OR public.is_admin(auth.uid()))
    AND EXISTS (
        SELECT 1 FROM public.v2_talent_profiles tp
        WHERE tp.user_id = talents.user_id
          AND tp.status = 'vetted'
          AND tp.visible_to_clients = true
    )
);

GRANT SELECT ON public.client_visible_talents TO authenticated;

COMMIT;

-- SUCCESS: View and RLS have been robustified.
