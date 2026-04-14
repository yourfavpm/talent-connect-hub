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
    vetted_at, 
    updated_at
)
SELECT 
    t.user_id, 
    t.talent_id, 
    'vetted', 
    true, 
    100, 
    COALESCE(t.updated_at, NOW()), 
    NOW()
FROM public.talents t 
WHERE t.vetting_status = 'fully_vetted'
ON CONFLICT (user_id) DO UPDATE SET 
    status = 'vetted', 
    visible_to_clients = true, 
    progress_percent = 100,
    updated_at = NOW();

-- 2. ENSURE BASIC INFO SECTION (using V2 CamelCase keys)
INSERT INTO public.v2_profile_sections (user_id, section_key, status, data, approved_at)
SELECT 
    t.user_id, 
    'basic_info', 
    'approved', 
    jsonb_build_object(
        'firstName', t.first_name, 
        'lastName', t.last_name, 
        'country', t.country, 
        'phone', t.phone,
        'email', t.email
    ), 
    NOW()
FROM public.talents t 
WHERE t.vetting_status = 'fully_vetted'
ON CONFLICT (user_id, section_key) DO UPDATE SET 
    status = 'approved', 
    approved_at = NOW();

-- 3. ENSURE PROFESSIONAL DETAILS SECTION (Fixed secondary_skills handling)
INSERT INTO public.v2_profile_sections (user_id, section_key, status, data, approved_at)
SELECT 
    t.user_id, 
    'professional_details', 
    'approved', 
    jsonb_build_object(
        'primaryRole', t.primary_role, 
        'yearsOfExperience', COALESCE(t.years_of_experience, 0), 
        'secondarySkills', COALESCE(to_jsonb(t.secondary_skills), '[]'::jsonb),
        'availability', COALESCE(t.availability::text, 'full_time'),
        'shortBio', ''
    ), 
    NOW()
FROM public.talents t 
WHERE t.vetting_status = 'fully_vetted'
ON CONFLICT (user_id, section_key) DO UPDATE SET 
    status = 'approved', 
    approved_at = NOW();

-- 4. WORK HISTORY STUB
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

-- 5. NOTIFY SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';

COMMIT;
