-- MANUALLY ENSURE SUPER ADMIN PERMISSIONS
-- Run this in your Supabase SQL Editor to grant yourself the required roles.

-- 1. Identify the current admin user (Benita)
-- Replace the email if necessary, but this script will attempt to find the logged-in user's email if possible, 
-- or you can just use your user ID.

DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'info@opslyhr.com'; -- Replace with your admin email if different
BEGIN
    -- Get user ID if not known
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User with email % not found', v_email;
        RETURN;
    END IF;

    -- A. Ensure role in legacy user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'super_admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- B. Ensure role in new admin_roles table (matching the RBAC migration)
    -- First, ensure the 'Super Admin' role exists
    INSERT INTO public.roles (name, description, is_system_role)
    VALUES ('Super Admin', 'Full system access', true)
    ON CONFLICT (name) DO NOTHING;

    -- Then, bind the user to the 'Super Admin' role
    INSERT INTO public.admin_roles (admin_id, role_id)
    SELECT v_user_id, id FROM public.roles WHERE name = 'Super Admin'
    ON CONFLICT DO NOTHING;

    -- C. Ensure record exists in admin_users
    INSERT INTO public.admin_users (id, email, full_name, status)
    VALUES (v_user_id, v_email, 'Primary Admin', 'active')
    ON CONFLICT (id) DO UPDATE SET status = 'active';

    RAISE NOTICE 'Successfully granted Super Admin permissions to %', v_email;
END $$;
