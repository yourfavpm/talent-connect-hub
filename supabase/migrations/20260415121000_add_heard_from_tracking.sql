-- Migration: Add heard_from tracking for talent leads
-- Description: Adds a column to track how talent heard about the platform

-- 1. Add column to profiles (landing spot for all user types)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS heard_from TEXT;

-- 2. Add column to talents (legacy talent table)
ALTER TABLE public.talents ADD COLUMN IF NOT EXISTS heard_from TEXT;

-- 3. Add column to v2_talent_profiles (modern talent table)
ALTER TABLE public.v2_talent_profiles ADD COLUMN IF NOT EXISTS heard_from TEXT;

-- 4. Update handle_new_user trigger to capture all fields from metadata
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
    v_heard_from TEXT;
BEGIN
    -- Extract metadata
    portal_type := NEW.raw_user_meta_data ->> 'portal';
    first_name := NEW.raw_user_meta_data ->> 'first_name';
    last_name := NEW.raw_user_meta_data ->> 'last_name';
    full_name := NEW.raw_user_meta_data ->> 'full_name';
    company_name := NEW.raw_user_meta_data ->> 'company_name';
    v_heard_from := NEW.raw_user_meta_data ->> 'heard_from';

    -- Create Profile (idempotent)
    BEGIN
        INSERT INTO public.profiles (user_id, email, first_name, last_name, heard_from)
        VALUES (NEW.id, NEW.email, first_name, last_name, v_heard_from)
        ON CONFLICT (user_id) DO UPDATE SET
            heard_from = EXCLUDED.heard_from,
            first_name = COALESCE(profiles.first_name, EXCLUDED.first_name),
            last_name = COALESCE(profiles.last_name, EXCLUDED.last_name);
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to create/update profile: %', SQLERRM;
    END;

    -- Create specific role profile based on portal type
    IF portal_type = 'talent' THEN
        BEGIN
            new_talent_id := public.generate_talent_id();
            
            INSERT INTO public.talents (
                user_id, talent_id, first_name, last_name, email, onboarding_completed, onboarding_step, heard_from
            ) VALUES (
                NEW.id, new_talent_id, COALESCE(first_name, ''), COALESCE(last_name, ''), NEW.email, FALSE, 1, v_heard_from
            ) ON CONFLICT (user_id) DO NOTHING;

            -- Explicitly assign talent role in user_roles
            INSERT INTO public.user_roles (user_id, role)
            VALUES (NEW.id, 'talent'::public.app_role)
            ON CONFLICT (user_id, role) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
             RAISE WARNING 'Failed to create talent profile/role: %', SQLERRM;
        END;
        
    ELSIF portal_type = 'client' THEN
        contact_name := COALESCE(full_name, concat_ws(' ', first_name, last_name));
        IF contact_name IS NULL OR contact_name = '' THEN contact_name := 'Unknown Contact'; END IF;
        IF company_name IS NULL OR company_name = '' THEN company_name := 'My Company'; END IF;

        BEGIN
            new_client_id := public.generate_client_id();
            
            INSERT INTO public.clients (
                user_id, client_id, company_name, primary_contact_name, primary_contact_email, status
            ) VALUES (
                NEW.id, new_client_id, company_name, contact_name, NEW.email, 'pending'
            ) ON CONFLICT (user_id) DO NOTHING;

            -- Explicitly assign client role in user_roles
            INSERT INTO public.user_roles (user_id, role)
            VALUES (NEW.id, 'client'::public.app_role)
            ON CONFLICT (user_id, role) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
             RAISE WARNING 'Failed to create client profile/role: %', SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$;
