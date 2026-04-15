-- OPSLYHR ULTIMATE FIX V4
-- 1. Fixes Talent Visibility (fixes the "cannot drop columns" error)
-- 2. Repairs User Roles (fixes "Only clients can create requests")
-- 3. Automates Role Assignment for new signups
-- 4. Adds Update RPC for "Save as Draft" feature

BEGIN;

-- ==========================================
-- 1. TALENT VISIBILITY FIX (RESILIENT)
-- ==========================================
-- We must DROP the view because we changed the column structure
DROP VIEW IF EXISTS public.client_visible_talents;

CREATE VIEW public.client_visible_talents AS
SELECT
    tp.id as profile_id,
    t.id as talent_id,
    tp.user_id,
    tp.talent_id as display_id,
    COALESCE(
        (SELECT CONCAT_WS(' ', data->>'firstName', LEFT(data->>'lastName', 1) || '.')
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'basic_info'
         LIMIT 1),
        CONCAT_WS(' ', t.first_name, LEFT(t.last_name, 1) || '.')
    ) as anonymized_name,
    COALESCE(
        (SELECT (data->>'primaryRole')::text
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.primary_role,
        'Professional'
    ) as headline,
    tp.vetting_level,
    COALESCE(
        (SELECT 
            CASE 
                WHEN (data->>'city') IS NOT NULL AND (data->>'country') IS NOT NULL 
                THEN (data->>'city')::text || ', ' || (data->>'country')::text
                ELSE (data->>'country')::text
            END
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'basic_info'),
        t.country,
        'Remote'
    ) as location,
    COALESCE(
        (SELECT (data->>'yearsOfExperience')::int
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.years_of_experience,
        0
    ) as years_experience,
    COALESCE(
        (SELECT (data->>'availability')::text
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.availability::text,
        'full_time'
    ) as availability,
    COALESCE(
        (SELECT (data->'secondarySkills')
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        '[]'::jsonb
    ) as skills,
    p.avatar_url,
    tp.vetted_at
FROM public.v2_talent_profiles tp
LEFT JOIN public.talents t ON tp.user_id = t.user_id
LEFT JOIN public.profiles p ON tp.user_id = p.user_id
WHERE tp.status = 'vetted' AND tp.visible_to_clients = true;

GRANT SELECT ON public.client_visible_talents TO authenticated;

-- ==========================================
-- 2. ROLE AUTOMATION & REPAIR
-- ==========================================
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
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'talent') ON CONFLICT (user_id, role) DO NOTHING;

        new_talent_id := public.generate_talent_id();
        INSERT INTO public.talents (
            user_id, talent_id, first_name, last_name, email, onboarding_completed, onboarding_step
        ) VALUES (
            NEW.id, new_talent_id, COALESCE(first_name, ''), COALESCE(last_name, ''), NEW.email, FALSE, 1
        ) ON CONFLICT (user_id) DO NOTHING;
        
    ELSIF portal_type = 'client' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'client') ON CONFLICT (user_id, role) DO NOTHING;

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

-- Backfill missing roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'client'::public.app_role FROM public.clients
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'talent'::public.app_role FROM public.talents
ON CONFLICT (user_id, role) DO NOTHING;

-- ==========================================
-- 3. HIRE REQUEST UPDATE RPC
-- ==========================================
CREATE OR REPLACE FUNCTION public.hr_v2_update_request(req_id UUID, payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.has_role(auth.uid(), 'client') THEN
        RAISE EXCEPTION 'Only clients can update requests';
    END IF;

    UPDATE public.hr_v2_hire_requests
    SET 
        service_model = COALESCE((payload->>'service_model')::public.hr_v2_service_model, service_model),
        title = COALESCE(payload->>'title', title),
        role_summary = COALESCE(payload->>'role_summary', role_summary),
        responsibilities = COALESCE(payload->>'responsibilities', responsibilities),
        requirements = COALESCE(payload->>'requirements', requirements),
        location_preference = COALESCE(payload->>'location_preference', location_preference),
        timezone_overlap = COALESCE(payload->>'timezone_overlap', timezone_overlap),
        engagement_type = COALESCE(payload->>'engagement_type', engagement_type),
        budget_type = COALESCE(payload->>'budget_type', budget_type),
        budget_min = (payload->>'budget_min')::NUMERIC,
        budget_max = (payload->>'budget_max')::NUMERIC,
        fixed_budget = (payload->>'fixed_budget')::NUMERIC,
        hours_per_week = (payload->>'hours_per_week')::INTEGER,
        requires_timesheets = COALESCE((payload->>'requires_timesheets')::BOOLEAN, requires_timesheets),
        updated_at = now()
    WHERE id = req_id 
      AND client_user_id = auth.uid() 
      AND status = 'draft';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found, not a draft, or permission denied';
    END IF;
END;
$$;

COMMIT;
