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
BEGIN
    portal_type := NEW.raw_user_meta_data ->> 'portal';
    first_name := NEW.raw_user_meta_data ->> 'first_name';
    last_name := NEW.raw_user_meta_data ->> 'last_name';
    full_name := NEW.raw_user_meta_data ->> 'full_name';
    company_name := NEW.raw_user_meta_data ->> 'company_name';

    -- Create Profile (always)
    INSERT INTO public.profiles (user_id, email, first_name, last_name)
    VALUES (NEW.id, NEW.email, first_name, last_name);

    -- Create specific role profile based on portal type
    IF portal_type = 'talent' THEN
        new_talent_id := public.generate_talent_id();
        
        INSERT INTO public.talents (
            user_id, talent_id, first_name, last_name, email, onboarding_completed, onboarding_step
        ) VALUES (
            NEW.id, new_talent_id, first_name, last_name, NEW.email, FALSE, 1
        );
        -- Note: Role assignment is handled by the assign_talent_role_on_insert trigger on the talents table
        
    ELSIF portal_type = 'client' THEN
        new_client_id := public.generate_client_id();
        
        INSERT INTO public.clients (
            user_id, client_id, company_name, primary_contact_name, primary_contact_email, status
        ) VALUES (
            NEW.id, new_client_id, company_name, full_name, NEW.email, 'pending'
        );
        -- Note: Role assignment is handled by the assign_client_role_on_insert trigger on the clients table
    END IF;

    RETURN NEW;
END;
$$;
