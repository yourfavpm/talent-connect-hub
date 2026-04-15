-- REPAIR & AUTOMATE USER ROLES
-- This script ensures all clients and talents have their correct roles assigned.

BEGIN;

-- 1. Automate role assignment in the signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    portal_type TEXT;
    first_name TEXT;
    last_name TEXT;
    full_name TEXT;
    company_name TEXT;
    new_talent_id TEXT;
    new_client_id TEXT;
    contact_name TEXT;
BEGIN
    portal_type := NEW.raw_user_meta_data ->> 'portal';
    first_name := NEW.raw_user_meta_data ->> 'first_name';
    last_name := NEW.raw_user_meta_data ->> 'last_name';
    full_name := NEW.raw_user_meta_data ->> 'full_name';
    company_name := NEW.raw_user_meta_data ->> 'company_name';

    -- Create Profile (idempotent)
    INSERT INTO public.profiles (user_id, email, first_name, last_name)
    VALUES (NEW.id, NEW.email, first_name, last_name)
    ON CONFLICT (user_id) DO NOTHING;

    -- Create specific role profile and assign ROLE based on portal type
    IF portal_type = 'talent' THEN
        -- Assign Role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'talent')
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Create Talent Profile
        new_talent_id := public.generate_talent_id();
        INSERT INTO public.talents (
            user_id, talent_id, first_name, last_name, email, onboarding_completed, onboarding_step
        ) VALUES (
            NEW.id, new_talent_id, COALESCE(first_name, ''), COALESCE(last_name, ''), NEW.email, FALSE, 1
        ) ON CONFLICT (user_id) DO NOTHING;
        
    ELSIF portal_type = 'client' THEN
        -- Assign Role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'client')
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Create Client Profile
        contact_name := COALESCE(full_name, concat_ws(' ', first_name, last_name));
        IF contact_name IS NULL OR contact_name = '' THEN contact_name := 'Unknown Contact'; END IF;
        IF company_name IS NULL OR company_name = '' THEN company_name := 'My Company'; END IF;

        new_client_id := public.generate_client_id();
        INSERT INTO public.clients (
            user_id, client_id, company_name, primary_contact_name, primary_contact_email, status
        ) VALUES (
            NEW.id, new_client_id, company_name, contact_name, NEW.email, 'pending'
        ) ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Backfill roles for existing users
-- Fix Clients
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'client'::public.app_role 
FROM public.clients
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix Talents
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'talent'::public.app_role 
FROM public.talents
ON CONFLICT (user_id, role) DO NOTHING;

COMMIT;
