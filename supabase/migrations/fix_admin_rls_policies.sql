-- FIX MISSING ADMINISTRATIVE RLS POLICIES
-- This script ensures that Super Admins/Managers can actually write to the RBAC tables.

BEGIN;

-- 1. admin_roles: Allow management by team managers
DROP POLICY IF EXISTS "Managers can manage admin_roles" ON public.admin_roles;
CREATE POLICY "Managers can manage admin_roles" ON public.admin_roles 
FOR ALL 
USING (public.has_permission('team.manage'));

-- 2. admin_permission_overrides: Allow management by team managers
DROP POLICY IF EXISTS "Managers can manage admin_overrides" ON public.admin_permission_overrides;
CREATE POLICY "Managers can manage admin_overrides" ON public.admin_permission_overrides 
FOR ALL 
USING (public.has_permission('team.manage'));

-- 3. audit_logs: Ensure they can be inserted (by the system/users)
-- Usually inserted via SECURITY DEFINER functions, but if done via client:
DROP POLICY IF EXISTS "Admins can view audit_logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit_logs" ON public.audit_logs 
FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin')));

-- 4. Verify admin_users policy (should be 'ALL')
DROP POLICY IF EXISTS "Managers can update admin_users" ON public.admin_users;
CREATE POLICY "Managers can update admin_users" ON public.admin_users 
FOR ALL 
USING (public.has_permission('team.manage'));

COMMIT;
