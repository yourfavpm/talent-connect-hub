-- REPAIR USER ROLES AND SECURITY FUNCTIONS
-- This script ensures the RBAC system is correctly initialized and roles are assigned.

-- 1. Ensure public.has_role is robustly defined
-- The app_role enum likely already exists, but we'll cast to text for flexibility
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
  )
$$;

-- 2. Bulk Assign 'client' role to existing clients
-- We look into the public.clients table and ensure every user there has the 'client' role
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'client'::public.app_role
FROM public.clients
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Bulk Assign 'talent' role to existing talents
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'talent'::public.app_role
FROM public.talents
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Verify your current user has the correct role (Optional diagnostic)
-- SELECT role FROM public.user_roles WHERE user_id = auth.uid();

-- 5. Fix hr_v2_create_request if it was missing the role check or had a typo
-- (You may need to run your specific RPC definition again after this to ensure it picks up the latest has_role)
