-- IMPLEMENT TALENT MANAGER ROLE AND SCOPED PERMISSIONS
-- This migration adds the 'Talent Manager' role and the necessary infrastructure 
-- to restrict their view to assigned talents.

-- Add talent_manager to the legacy app_role enum
-- Note: This must run outside of a transaction block in some Postgres versions
-- so we keep it separate from the main BEGIN/COMMIT block if needed.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'talent_manager';

BEGIN;

-- 1. Create the 'Talent Manager' role
INSERT INTO public.roles (name, description, is_system_role)
VALUES ('Talent Manager', 'Manages assigned talents and matches them with opportunities', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Add 'talent_manager_admin_id' to talents table if not exists
-- (Already exists in v2_talent_profiles but adding to the base talents table for unified access)
ALTER TABLE public.talents 
ADD COLUMN IF NOT EXISTS talent_manager_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Define Permissions for Talent Manager
-- We'll grant them view access to hire requests and their own assigned talents.

-- Note: In the new RBAC system, permissions are stored in public.permissions.
-- Let's ensure these permissions exist.
INSERT INTO public.permissions (key, module, action, description) VALUES
('talents.view_assigned', 'talents', 'view_assigned', 'Can view talents where they are the assigned manager'),
('talents.manage_assigned', 'talents', 'manage_assigned', 'Can edit vetting and profiles for assigned talents'),
('hire_requests.view_all', 'hire_requests', 'view_all', 'Can see the full hiring pipeline to match talents')
ON CONFLICT (key) DO NOTHING;

-- Bind permissions to Talent Manager role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.name = 'Talent Manager' AND p.key IN (
    'talents.view_assigned', 
    'talents.manage_assigned', 
    'hire_requests.view_all',
    'dashboard.view' -- Assuming this exists or needed
)
ON CONFLICT DO NOTHING;

-- 4. RLS POLICIES FOR TALENTS
-- We need to allow Talent Managers to see only their talents (unless they have talents.view_all)

-- A. Policy for talents table
DROP POLICY IF EXISTS "Managers can view assigned talents" ON public.talents;
CREATE POLICY "Managers can view assigned talents" ON public.talents
FOR SELECT
USING (
    public.has_permission('talents.view_all') OR 
    talent_manager_admin_id = auth.uid() OR
    user_id = auth.uid() -- Talent can see themselves
);

DROP POLICY IF EXISTS "Managers can manage assigned talents" ON public.talents;
CREATE POLICY "Managers can manage assigned talents" ON public.talents
FOR ALL
USING (
    public.has_permission('talents.manage_all') OR 
    talent_manager_admin_id = auth.uid()
);

-- B. Policy for v2_talent_profiles table
DROP POLICY IF EXISTS "Managers can view assigned profiles" ON public.v2_talent_profiles;
CREATE POLICY "Managers can view assigned profiles" ON public.v2_talent_profiles
FOR SELECT
USING (
    public.has_permission('talents.view_all') OR 
    talent_manager_admin_id = auth.uid()
);

DROP POLICY IF EXISTS "Managers can manage assigned profiles" ON public.v2_talent_profiles;
CREATE POLICY "Managers can manage assigned profiles" ON public.v2_talent_profiles
FOR ALL
USING (
    public.has_permission('talents.manage_all') OR 
    talent_manager_admin_id = auth.uid()
);

-- C. Hire Requests Policy (Full Visibility for matching)
DROP POLICY IF EXISTS "Admins can view all hire requests" ON public.hr_v2_hire_requests;
CREATE POLICY "Admins can view all hire requests" ON public.hr_v2_hire_requests
FOR SELECT
USING (
    public.has_permission('hire_requests.view_all')
);

-- D. Jobs Policy (Full Visibility for matching)
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
CREATE POLICY "Admins can view all jobs" ON public.jobs
FOR SELECT
USING (
    public.has_permission('hire_requests.view_all')
);

-- E. RBAC Visibility Fixes
-- Patch is_admin to include new roles and be case-insensitive
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
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
      AND lower(role::text) IN ('super_admin', 'operations_admin', 'vetting_admin', 'finance_admin', 'support_admin', 'talent_manager', 'admin', 'super admin')
  )
$$;

-- Ensure Talent Managers and Super Admins (v1) can view the admin list for assignment
DROP POLICY IF EXISTS "Admins can view team" ON public.admin_users;
CREATE POLICY "Admins can view team" ON public.admin_users
FOR SELECT
USING ( public.is_admin(auth.uid()) );

DROP POLICY IF EXISTS "Admins can view role_permissions" ON public.role_permissions;
CREATE POLICY "Admins can view role_permissions" ON public.role_permissions
FOR SELECT
USING ( public.is_admin(auth.uid()) );

DROP POLICY IF EXISTS "Admins can view user_roles" ON public.user_roles;
CREATE POLICY "Admins can view user_roles" ON public.user_roles
FOR SELECT
USING ( auth.uid() = user_id OR public.is_admin(auth.uid()) );

-- F. Talent Visibility of Manager
-- Allow talents to see their assigned manager's name and email
DROP POLICY IF EXISTS "Talents can view their assigned manager" ON public.admin_users;
CREATE POLICY "Talents can view their assigned manager" ON public.admin_users
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.v2_talent_profiles 
        WHERE user_id = auth.uid() 
        AND talent_manager_admin_id = admin_users.id
    ) OR 
    EXISTS (
        SELECT 1 FROM public.talents 
        WHERE user_id = auth.uid() 
        AND talent_manager_admin_id = admin_users.id
    )
);

COMMIT;
