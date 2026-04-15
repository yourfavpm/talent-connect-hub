-- FIX: TALENT EXPERIENCE CASTING ERROR
-- Resolves "invalid input syntax for type integer: '5-10'" in talent browsing.

BEGIN;

-- 1. Redefine client_visible_talents View
-- We drop the view first because CREATE OR REPLACE cannot change column types (INT -> TEXT)
DROP VIEW IF EXISTS public.client_visible_talents;

-- We cast yearsOfExperience to TEXT to support ranges like '5-10' saved in V2 profiles.
CREATE OR REPLACE VIEW public.client_visible_talents AS
SELECT
    tp.id as profile_id,
    t.id as talent_id,
    tp.user_id,
    -- Anonymized Name
    COALESCE(
        (SELECT (data->>'firstName')::text || ' ' || LEFT((data->>'lastName')::text, 1) || '.'
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'basic_info'),
        t.first_name || ' ' || LEFT(t.last_name, 1) || '.'
    ) as anonymized_name,
    -- Headline
    COALESCE(
        (SELECT (data->>'primaryRole')::text
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.primary_role
    ) as headline,
    tp.vetting_level,
    -- Years Experience (CAST TO TEXT to support ranges)
    COALESCE(
        (SELECT (data->>'yearsOfExperience')::text
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.years_of_experience::text
    ) as years_experience,
    -- Availability
    COALESCE(
        (SELECT (data->>'availability')::text
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.availability::text
    ) as availability,
    -- Skills
    (SELECT (data->'secondarySkills')
     FROM public.v2_profile_sections
     WHERE user_id = tp.user_id AND section_key = 'professional_details') as skills,
    p.avatar_url,
    tp.vetted_at
FROM public.v2_talent_profiles tp
LEFT JOIN public.talents t ON tp.user_id = t.user_id
LEFT JOIN public.profiles p ON tp.user_id = p.user_id
WHERE tp.status = 'vetted' AND tp.visible_to_clients = true;

-- 2. Redefine get_client_talent_profile RPC
CREATE OR REPLACE FUNCTION public.get_client_talent_profile(p_talent_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile RECORD;
    v_sections JSONB;
    v_avatar_url TEXT;
BEGIN
    -- Authorization check
    IF NOT (public.has_role(auth.uid(), 'client') OR public.is_admin(auth.uid())) THEN
        RETURN NULL;
    END IF;

    SELECT t.user_id, p.avatar_url 
    INTO v_user_id, v_avatar_url 
    FROM public.talents t
    LEFT JOIN public.profiles p ON t.user_id = p.user_id
    WHERE t.id = p_talent_id;
    
    SELECT * INTO v_profile FROM public.v2_talent_profiles 
    WHERE user_id = v_user_id AND status = 'vetted' AND visible_to_clients = true;

    IF NOT FOUND THEN RETURN NULL; END IF;

    SELECT jsonb_object_agg(section_key, data) INTO v_sections
    FROM public.v2_profile_sections
    WHERE user_id = v_user_id AND status = 'approved'
    AND section_key IN ('basic_info', 'professional_details', 'work_history', 'education', 'certifications');

    RETURN jsonb_build_object(
        'id', p_talent_id,
        'display_id', v_profile.talent_id,
        'first_name', v_sections->'basic_info'->>'firstName',
        'last_initial', LEFT(v_sections->'basic_info'->>'lastName', 1),
        'avatar_url', v_avatar_url,
        'headline', v_sections->'professional_details'->>'primaryRole',
        'vetting_level', v_profile.vetting_level,
        -- CAST TO TEXT (removal of ::int)
        'years_experience', v_sections->'professional_details'->>'yearsOfExperience',
        'availability', v_sections->'professional_details'->>'availability',
        'location', (v_sections->'basic_info'->>'city') || ', ' || (v_sections->'basic_info'->>'country'),
        'bio', v_sections->'professional_details'->>'shortBio',
        'skills', COALESCE(v_sections->'professional_details'->'secondarySkills', '[]'::jsonb),
        'tools', COALESCE(v_sections->'professional_details'->'toolsFamiliarWith', '[]'::jsonb),
        'languages', COALESCE(v_sections->'professional_details'->'languagesSpoken', '[]'::jsonb),
        'work_history', COALESCE(v_sections->'work_history'->'workHistory', '[]'::jsonb),
        'education', COALESCE(v_sections->'education'->'education', '[]'::jsonb),
        'certifications', COALESCE(v_sections->'certifications'->'certifications', '[]'::jsonb)
    );
END;
$$;

-- 3. Restore Permissions
GRANT SELECT ON public.client_visible_talents TO authenticated;

COMMIT;
