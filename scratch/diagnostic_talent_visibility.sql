-- TALENT VISIBILITY DIAGNOSTIC
-- Run this if vetted talents are still not appearing in the Client Portal.

-- 1. Check V2 Profiles status and visibility
SELECT 
    p.email, 
    tp.status, 
    tp.visible_to_clients, 
    tp.progress_percent,
    t.vetting_status as legacy_status
FROM public.v2_talent_profiles tp
JOIN public.profiles p ON tp.user_id = p.user_id
JOIN public.talents t ON tp.user_id = t.user_id;

-- 2. Check if the 'basic_info' section is present and approved
-- The Client Portal View (client_visible_talents) REQUIRES 'basic_info' to show the name
SELECT 
    p.email,
    ps.section_key,
    ps.status as section_status
FROM public.v2_profile_sections ps
JOIN public.profiles p ON ps.user_id = p.user_id
WHERE ps.section_key = 'basic_info';

-- 3. Check if the current user has the 'client' role
-- (Replace with your email to check your own permissions)
SELECT p.email, r.role
FROM public.user_roles r
JOIN public.profiles p ON r.user_id = p.user_id
WHERE r.role = 'client';
