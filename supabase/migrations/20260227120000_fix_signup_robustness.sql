-- Harden generate_talent_id to use BIGINT and validate format to prevent conversion errors
CREATE OR REPLACE FUNCTION public.generate_talent_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id TEXT;
    counter BIGINT;
BEGIN
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN talent_id ~ '^TAS-VA-[0-9]+$' 
                THEN CAST(SUBSTRING(talent_id FROM 8) AS BIGINT)
                ELSE 0
            END
        ), 
        1000
    ) + 1
    INTO counter
    FROM public.talents;
    
    new_id := 'TAS-VA-' || counter::TEXT;
    RETURN new_id;
END;
$$;

-- Improve handle_new_user trigger with exception handling for talent creation
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
    BEGIN
        INSERT INTO public.profiles (user_id, email, first_name, last_name)
        VALUES (NEW.id, NEW.email, first_name, last_name);
    EXCEPTION WHEN unique_violation THEN
        NULL;
    END;

    -- Create specific role profile based on portal type
    IF portal_type = 'talent' THEN
        BEGIN
            new_talent_id := public.generate_talent_id();
            
            INSERT INTO public.talents (
                user_id, talent_id, first_name, last_name, email, onboarding_completed, onboarding_step
            ) VALUES (
                NEW.id, new_talent_id, COALESCE(first_name, ''), COALESCE(last_name, ''), NEW.email, FALSE, 1
            );
        EXCEPTION 
            WHEN unique_violation THEN
                 NULL;
            WHEN OTHERS THEN
                 RAISE WARNING 'Failed to create talent profile: %', SQLERRM;
        END;
        
    ELSIF portal_type = 'client' THEN
        contact_name := COALESCE(full_name, concat_ws(' ', first_name, last_name));
        IF contact_name IS NULL OR contact_name = '' THEN
            contact_name := 'Unknown Contact';
        END IF;

        IF company_name IS NULL OR company_name = '' THEN
            company_name := 'My Company';
        END IF;

        BEGIN
            new_client_id := public.generate_client_id();
            
            INSERT INTO public.clients (
                user_id, client_id, company_name, primary_contact_name, primary_contact_email, status
            ) VALUES (
                NEW.id, new_client_id, company_name, contact_name, NEW.email, 'pending'
            );
        EXCEPTION 
            WHEN unique_violation THEN
                NULL;
            WHEN OTHERS THEN
                 RAISE WARNING 'Failed to create client profile: %', SQLERRM;
        END;
    END IF;

    -- Ensure we always return NEW to allow auth.users to be created
    RETURN NEW;
END;
$$;
