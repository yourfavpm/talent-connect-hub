-- Fix generate_client_id to use BIGINT instead of INTEGER (prevents overflow with large IDs)
CREATE OR REPLACE FUNCTION public.generate_client_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id TEXT;
    counter BIGINT;
BEGIN
    -- Use BIGINT to handle large numbers, and only extract from properly formatted IDs
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN client_id ~ '^CLI-[0-9]+$' 
                THEN CAST(SUBSTRING(client_id FROM 5) AS BIGINT)
                ELSE 0
            END
        ), 
        1000
    ) + 1
    INTO counter
    FROM public.clients;
    
    new_id := 'CLI-' || counter::TEXT;
    RETURN new_id;
END;
$$;


-- Update handle_new_user to create talent/client profiles and assign roles
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
        -- Profile already exists, which is fine, just continue
        NULL;
    END;

    -- Create specific role profile based on portal type
    IF portal_type = 'talent' THEN
        new_talent_id := public.generate_talent_id();
        
        BEGIN
            INSERT INTO public.talents (
                user_id, talent_id, first_name, last_name, email, onboarding_completed, onboarding_step
            ) VALUES (
                NEW.id, new_talent_id, COALESCE(first_name, ''), COALESCE(last_name, ''), NEW.email, FALSE, 1
            );
        EXCEPTION WHEN unique_violation THEN
             -- Talent profile might already exist
             NULL;
        END;
        
    ELSIF portal_type = 'client' THEN
        -- Determine contact name with fallback
        contact_name := COALESCE(full_name, concat_ws(' ', first_name, last_name));
        IF contact_name IS NULL OR contact_name = '' THEN
            contact_name := 'Unknown Contact';
        END IF;

        -- Ensure company name has fallback
        IF company_name IS NULL OR company_name = '' THEN
            company_name := 'My Company';
        END IF;

        new_client_id := public.generate_client_id();
        
        BEGIN
            INSERT INTO public.clients (
                user_id, client_id, company_name, primary_contact_name, primary_contact_email, status
            ) VALUES (
                NEW.id, new_client_id, company_name, contact_name, NEW.email, 'pending'
            );
        EXCEPTION 
            WHEN unique_violation THEN
                -- Client profile already exists
                NULL;
            WHEN OTHERS THEN
                 -- Log other errors but don't stop the user creation if possible, 
                 -- OR raise so we know what failed. 
                 -- For now, let's RAISE to see the real error if it's not unique violation
                 RAISE WARNING 'Failed to create client profile: %', SQLERRM;
                 RAISE;
        END;
    END IF;

    RETURN NEW;
END;
$$;
