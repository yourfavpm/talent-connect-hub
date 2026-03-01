-- ============================================================
-- Client Talent Module – Data Exposure & Engagement
-- ============================================================

-- 0. Ensure foreign key exists for robust joins in Postgrest
-- Many admin queries use v2_talent_profiles -> talents join via user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_v2tp_talents'
    ) THEN
        ALTER TABLE public.v2_talent_profiles
        ADD CONSTRAINT fk_v2tp_talents
        FOREIGN KEY (user_id) REFERENCES public.talents(user_id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- ── 1. client_visible_talents View ─────────────────────────────────────────
-- Securely exposes non-sensitive talent data for the browse grid.
CREATE OR REPLACE VIEW public.client_visible_talents AS
SELECT
    tp.id as profile_id,
    t.id as talent_id,
    tp.user_id,
    tp.talent_id as display_id,
    -- Anonymized Name (First Name + Last Initial)
    COALESCE(
        (SELECT (data->>'firstName')::text || ' ' || LEFT((data->>'lastName')::text, 1) || '.'
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'basic_info'),
        t.first_name || ' ' || LEFT(t.last_name, 1) || '.'
    ) as anonymized_name,
    -- Headline / Primary Role
    COALESCE(
        (SELECT (data->>'primaryRole')::text
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.primary_role
    ) as headline,
    tp.vetting_level,
    -- Location (City + Country)
    COALESCE(
        (SELECT 
            CASE 
                WHEN (data->>'city') IS NOT NULL AND (data->>'country') IS NOT NULL 
                THEN (data->>'city')::text || ', ' || (data->>'country')::text
                ELSE (data->>'country')::text
            END
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'basic_info'),
        t.country
    ) as location,
    -- Experience
    COALESCE(
        (SELECT (data->>'yearsOfExperience')::int
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.years_of_experience
    ) as years_experience,
    -- Availability
    COALESCE(
        (SELECT (data->>'availability')::text
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.availability::text
    ) as availability,
    -- Skills (Top tags)
    (SELECT (data->'secondarySkills')
     FROM public.v2_profile_sections
     WHERE user_id = tp.user_id AND section_key = 'professional_details') as skills,
    -- Avatar
    p.avatar_url,
    -- Bio for summary
    (SELECT (data->>'shortBio')::text
     FROM public.v2_profile_sections
     WHERE user_id = tp.user_id AND section_key = 'professional_details') as bio,
    tp.vetted_at
FROM public.v2_talent_profiles tp
LEFT JOIN public.talents t ON tp.user_id = t.user_id
LEFT JOIN public.profiles p ON tp.user_id = p.user_id
WHERE tp.status = 'vetted' AND tp.visible_to_clients = true;

-- ── 2. get_client_talent_profile RPC ───────────────────────────────────────
-- Securely returns full professional details for a specific talent.
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
    -- Authorization check: Client or Admin only
    IF NOT (public.has_role(auth.uid(), 'client') OR public.is_admin(auth.uid())) THEN
        RETURN NULL;
    END IF;

    -- Map talent_id (public.talents.id) to user_id and profile
    SELECT t.user_id, p.avatar_url 
    INTO v_user_id, v_avatar_url 
    FROM public.talents t
    LEFT JOIN public.profiles p ON t.user_id = p.user_id
    WHERE t.id = p_talent_id;
    
    -- Ensure vetted status and client visibility
    SELECT * INTO v_profile FROM public.v2_talent_profiles 
    WHERE user_id = v_user_id AND status = 'vetted' AND visible_to_clients = true;

    IF NOT FOUND THEN RETURN NULL; END IF;

    -- Aggregate approved sections data (excluding sensitive documents)
    SELECT jsonb_object_agg(section_key, data) INTO v_sections
    FROM public.v2_profile_sections
    WHERE user_id = v_user_id AND status = 'approved'
    AND section_key IN ('basic_info', 'professional_details', 'work_history', 'education', 'certifications');

    -- Build sanitised output object (Zero PII leak)
    RETURN jsonb_build_object(
        'id', p_talent_id,
        'display_id', v_profile.talent_id,
        'first_name', v_sections->'basic_info'->>'firstName',
        'last_initial', LEFT(v_sections->'basic_info'->>'lastName', 1),
        'avatar_url', v_avatar_url,
        'headline', v_sections->'professional_details'->>'primaryRole',
        'vetting_level', v_profile.vetting_level,
        'years_experience', (v_sections->'professional_details'->>'yearsOfExperience')::int,
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

-- ── 3. interview_requests Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interview_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id     UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    talent_id     UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
    job_id        UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    scheduled_at  TIMESTAMPTZ NOT NULL,
    message       TEXT,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- RLS for interview_requests
ALTER TABLE public.interview_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can manage their own interview requests" ON public.interview_requests;
CREATE POLICY "Clients can manage their own interview requests" 
ON public.interview_requests FOR ALL 
USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = interview_requests.client_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Talents can view their own interview requests" ON public.interview_requests;
CREATE POLICY "Talents can view their own interview requests" 
ON public.interview_requests FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.talents t WHERE t.id = interview_requests.talent_id AND t.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all interview requests" ON public.interview_requests;
CREATE POLICY "Admins can view all interview requests" 
ON public.interview_requests FOR SELECT 
USING (public.is_admin(auth.uid()));

-- ── 4. RLS for v2_profile_sections (Client access to professional data) ──
-- Clients need to read professional_details and other non-PII sections to browse.
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

-- ── 5. RLS for talents (Client access to legacy table during join) ──
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

-- ── 6. RLS for profiles (Client access to avatars) ──
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

-- Grants
GRANT SELECT ON public.client_visible_talents TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_talent_profile(UUID) TO authenticated;
GRANT ALL ON public.interview_requests TO authenticated;
