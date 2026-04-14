-- Admin RBAC System V1
-- Includes roles, permissions, and admin user management

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE public.admin_status AS ENUM ('invited', 'active', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.invite_status AS ENUM ('sent', 'accepted', 'expired', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables

-- Admin Users (extension of auth.users)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    status public.admin_status DEFAULT 'active',
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,         -- e.g. 'jobs.view', 'jobs.approve'
    module TEXT NOT NULL,             -- jobs, clients, payments...
    action TEXT NOT NULL,             -- view, create, edit, approve, delete, export
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Role Permissions (Junction)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Admin Roles (Assignment)
CREATE TABLE IF NOT EXISTS public.admin_roles (
    admin_id UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (admin_id, role_id)
);

-- Admin Permission Overrides
CREATE TABLE IF NOT EXISTS public.admin_permission_overrides (
    admin_id UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    allowed BOOLEAN NOT NULL,
    PRIMARY KEY (admin_id, permission_id)
);

-- Admin Invites
CREATE TABLE IF NOT EXISTS public.admin_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    token_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status public.invite_status DEFAULT 'sent',
    created_by UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,              -- e.g. 'role.updated', 'admin.suspended'
    entity_type TEXT NOT NULL,         -- 'admin', 'role', 'job', etc.
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Initial Data (System Roles and Permissions)

-- Insert Standard Permissions
INSERT INTO public.permissions (key, module, action, description) VALUES
('dashboard.view', 'dashboard', 'view', 'Access to admin dashboard'),
('clients.view', 'clients', 'view', 'View client list and details'),
('clients.edit', 'clients', 'edit', 'Modify client information'),
('talents.view', 'talents', 'view', 'View talent database'),
('talents.edit', 'talents', 'edit', 'Vette and modify talent profiles'),
('jobs.view', 'jobs', 'view', 'View all job postings'),
('jobs.create', 'jobs', 'create', 'Create new job postings'),
('jobs.approve', 'jobs', 'approve', 'Approve job postings for publication'),
('timesheets.view', 'timesheets', 'view', 'View all timesheets'),
('timesheets.approve', 'timesheets', 'approve', 'Approve timesheets for payment'),
('payments.view', 'payments', 'view', 'View payment records'),
('payments.manage', 'payments', 'manage', 'Execute and manage payouts'),
('team.view', 'team', 'view', 'View admin team members'),
('team.manage', 'team', 'manage', 'Manage admins, roles, and permissions'),
('settings.view', 'settings', 'view', 'View global settings'),
('settings.manage', 'settings', 'manage', 'Modify system settings')
ON CONFLICT (key) DO NOTHING;

-- Insert System Roles
INSERT INTO public.roles (name, description, is_system_role) VALUES
('Super Admin', 'Full system access', true),
('Operations Admin', 'Daily operational management', true),
('Finance Admin', 'Financial and payroll management', true),
('Support Admin', 'Customer and talent support', true)
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to Super Admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- 4. Migration logic for existing admins
-- We'll look for existing users in auth.users who have an admin role in the old user_roles table
INSERT INTO public.admin_users (id, email, full_name, status)
SELECT u.id, u.email, (u.raw_user_meta_data->>'first_name') || ' ' || (u.raw_user_meta_data->>'last_name'), 'active'
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role IN ('super_admin', 'operations_admin', 'vetting_admin', 'finance_admin', 'support_admin')
ON CONFLICT (id) DO UPDATE SET status = 'active';

-- Map legacy roles to new roles
INSERT INTO public.admin_roles (admin_id, role_id)
SELECT ur.user_id, r.id
FROM public.user_roles ur
JOIN public.roles r ON (
    CASE 
        WHEN ur.role = 'super_admin' THEN 'Super Admin'
        WHEN ur.role IN ('operations_admin', 'vetting_admin') THEN 'Operations Admin'
        WHEN ur.role = 'finance_admin' THEN 'Finance Admin'
        WHEN ur.role = 'support_admin' THEN 'Support Admin'
        ELSE 'Operations Admin'
    END = r.name
)
WHERE ur.role IN ('super_admin', 'operations_admin', 'vetting_admin', 'finance_admin', 'support_admin')
ON CONFLICT DO NOTHING;

-- 5. Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Admins can view roles/permissions)
DROP POLICY IF EXISTS "Admins can view roles" ON public.roles;
CREATE POLICY "Admins can view roles" ON public.roles FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin'))
);

DROP POLICY IF EXISTS "Admins can view permissions" ON public.permissions;
CREATE POLICY "Admins can view permissions" ON public.permissions FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin'))
);

DROP POLICY IF EXISTS "Admins can view team" ON public.admin_users;
CREATE POLICY "Admins can view team" ON public.admin_users FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin'))
);

DROP POLICY IF EXISTS "Admins can view admin_roles" ON public.admin_roles;
CREATE POLICY "Admins can view admin_roles" ON public.admin_roles FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin'))
);

DROP POLICY IF EXISTS "Admins can view role_permissions" ON public.role_permissions;
CREATE POLICY "Admins can view role_permissions" ON public.role_permissions FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin'))
);

-- Write access restricted to those with team.manage permission
CREATE OR REPLACE FUNCTION public.has_permission(p_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_roles ar
        JOIN public.role_permissions rp ON ar.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ar.admin_id = auth.uid() AND p.key = p_key
    ) OR EXISTS (
        SELECT 1 FROM public.admin_permission_overrides apo
        JOIN public.permissions p ON apo.permission_id = p.id
        WHERE apo.admin_id = auth.uid() AND p.key = p_key AND apo.allowed = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Managers can update roles" ON public.roles FOR ALL USING (public.has_permission('team.manage'));
CREATE POLICY "Managers can update admin_users" ON public.admin_users FOR ALL USING (public.has_permission('team.manage'));

-- 6. Helper Functions

-- Get effective permissions for an admin
CREATE OR REPLACE FUNCTION public.get_admin_permissions(p_admin_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    perms TEXT[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT p.key) INTO perms
    FROM (
        -- Permissions from roles
        SELECT p.key
        FROM public.admin_roles ar
        JOIN public.role_permissions rp ON ar.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ar.admin_id = p_admin_id
        
        UNION
        
        -- Explicitly allowed overrides
        SELECT p.key
        FROM public.admin_permission_overrides apo
        JOIN public.permissions p ON apo.permission_id = p.id
        WHERE apo.admin_id = p_admin_id AND apo.allowed = true
        
        EXCEPT
        
        -- Explicitly denied overrides
        SELECT p.key
        FROM public.admin_permission_overrides apo
        JOIN public.permissions p ON apo.permission_id = p.id
        WHERE apo.admin_id = p_admin_id AND apo.allowed = false
    ) AS p;
    
    RETURN COALESCE(perms, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Secure Management Functions

-- Function to invite a new admin
CREATE OR REPLACE FUNCTION public.invite_admin(
    p_email TEXT,
    p_full_name TEXT,
    p_role_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Only managers can invite
    IF NOT public.has_permission('team.manage') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;

    -- 1. Create the admin user record
    INSERT INTO public.admin_users (email, full_name, status)
    VALUES (p_email, p_full_name, 'active')
    RETURNING id INTO v_admin_id;

    -- 2. Assign the initial role
    INSERT INTO public.admin_roles (admin_id, role_id)
    VALUES (v_admin_id, p_role_id);

    -- 3. Log the action
    INSERT INTO public.audit_logs (admin_id, action, module, target_id)
    VALUES (auth.uid(), 'INVITE_ADMIN', 'team', v_admin_id);

    RETURN v_admin_id;
END;
$$;

-- Function to update an admin's role
CREATE OR REPLACE FUNCTION public.update_admin_role(
    p_admin_id UUID,
    p_role_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only managers can update roles
    IF NOT public.has_permission('team.manage') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;

    -- 1. Remove existing roles (single role model for now)
    DELETE FROM public.admin_roles WHERE admin_id = p_admin_id;

    -- 2. Insert new role
    INSERT INTO public.admin_roles (admin_id, role_id)
    VALUES (p_admin_id, p_role_id);

    -- 3. Log the action
    INSERT INTO public.audit_logs (admin_id, action, module, target_id)
    VALUES (auth.uid(), 'UPDATE_ROLE', 'team', p_admin_id);
END;
$$;

-- Function to toggle admin status
CREATE OR REPLACE FUNCTION public.toggle_admin_status(
    p_admin_id UUID,
    p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only managers can toggle status
    IF NOT public.has_permission('team.manage') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;

    UPDATE public.admin_users
    SET status = p_status
    WHERE id = p_admin_id;

    -- Log the action
    INSERT INTO public.audit_logs (admin_id, action, module, target_id)
    VALUES (auth.uid(), 'UPDATE_STATUS', 'team', p_admin_id);
END;
$$;

-- Function to add a permission override
CREATE OR REPLACE FUNCTION public.add_admin_override(
    p_admin_id UUID,
    p_permission_id UUID,
    p_allowed BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only managers can add overrides
    IF NOT public.has_permission('team.manage') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;

    INSERT INTO public.admin_permission_overrides (admin_id, permission_id, allowed)
    VALUES (p_admin_id, p_permission_id, p_allowed)
    ON CONFLICT (admin_id, permission_id) 
    DO UPDATE SET allowed = p_allowed;

    -- Log the action
    INSERT INTO public.audit_logs (admin_id, action, module, target_id)
    VALUES (auth.uid(), 'UPSERT_OVERRIDE', 'team', p_admin_id);
END;
$$;
