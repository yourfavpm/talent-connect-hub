-- REPAIR USER ROLES AND SECURITY FUNCTIONS (COMPREHENSIVE)
-- This script ensures the RBAC system is correctly initialized across the platform.

BEGIN;

-- 1. Ensure public.has_role is robustly defined
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::TEXT = _role
  );
$$;

-- 2. Sync Roles from Profiles and Metadata
-- We look into clients, talents, and auth metadata to ensure everyone has a role.

-- A. From clients table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'client'::public.app_role
FROM public.clients
ON CONFLICT (user_id, role) DO NOTHING;

-- B. From talents table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'talent'::public.app_role
FROM public.talents
ON CONFLICT (user_id, role) DO NOTHING;

-- C. FROM auth.users metadata (for users who haven't completed onboarding)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'client'::public.app_role
FROM auth.users
WHERE (raw_user_meta_data ->> 'portal' = 'client')
   OR (raw_user_meta_data ->> 'portal' = 'client_onboarding')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'talent'::public.app_role
FROM auth.users
WHERE (raw_user_meta_data ->> 'portal' = 'talent')
   OR (raw_user_meta_data ->> 'portal' = 'talent_onboarding')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Ensure RPCs are using the latest public.has_role
-- (No changes needed to RPCs themselves as they reference has_role by name, 
-- but running this ensures the foundation is solid).

COMMIT;
