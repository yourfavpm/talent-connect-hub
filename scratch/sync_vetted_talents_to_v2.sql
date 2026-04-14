-- ============================================================
-- REPAIR: SYNC LEGACY VETTED TALENTS TO V2
-- ============================================================
-- This script ensures that talents vetted in the V1 system are
-- correctly represented in the V2 profile system so they show 
-- up in the new Client Portal "Browse Talents" view.

BEGIN;

-- 1. UPSERT V2 PROFILES FOR VETTED TALENTS
INSERT INTO public.v2_talent_profiles (
    user_id,
    talent_id,
    status,
    visible_to_clients,
    progress_percent,
    vetting_level_text,
    vetted_at,
    updated_at
)
SELECT 
    t.user_id,
    t.id::text,
    'vetted',
    true,
    100,
    COALESCE(t.primary_role, 'Senior'), -- Use existing role or default
    COALESCE(t.updated_at, NOW()),
    NOW()
FROM public.talents t
WHERE t.vetting_status = 'fully_vetted'
ON CONFLICT (user_id) DO UPDATE SET
    status = 'vetted',
    visible_to_clients = true,
    progress_percent = 100,
    updated_at = NOW()
WHERE v2_talent_profiles.status != 'vetted';

-- 2. ENSURE CORE SECTIONS EXIST AND ARE APPROVED
-- This prevents "Missing data" errors when a client clicks on a profile.

-- Basic Info
INSERT INTO public.v2_profile_sections (user_id, section_key, status, data, approved_at)
SELECT 
    t.user_id, 
    'basic_info', 
    'approved', 
    jsonb_build_object(
        'first_name', t.first_name,
        'last_name', t.last_name,
        'email', t.email,
        'location', t.location,
        'phone', t.phone,
        'bio', t.bio
    ),
    NOW()
FROM public.talents t
WHERE t.vetting_status = 'fully_vetted'
ON CONFLICT (user_id, section_key) DO UPDATE SET
    status = 'approved',
    approved_at = NOW()
WHERE v2_profile_sections.status != 'approved';

-- Professional Details
INSERT INTO public.v2_profile_sections (user_id, section_key, status, data, approved_at)
SELECT 
    t.user_id, 
    'professional_details', 
    'approved', 
    jsonb_build_object(
        'primary_role', t.primary_role,
        'years_experience', t.years_experience,
        'skills', COALESCE(t.skills, '[]'::jsonb)
    ),
    NOW()
FROM public.talents t
WHERE t.vetting_status = 'fully_vetted'
ON CONFLICT (user_id, section_key) DO UPDATE SET
    status = 'approved',
    approved_at = NOW()
WHERE v2_profile_sections.status != 'approved';

-- Work History (Stub if empty)
INSERT INTO public.v2_profile_sections (user_id, section_key, status, data, approved_at)
SELECT 
    t.user_id, 
    'work_history', 
    'approved', 
    '[]'::jsonb,
    NOW()
FROM public.talents t
WHERE t.vetting_status = 'fully_vetted'
ON CONFLICT (user_id, section_key) DO NOTHING;

-- 3. NOTIFY SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';

COMMIT;
