-- Add preferred_currency and salary_type to hr_v2_hire_requests
ALTER TABLE public.hr_v2_hire_requests
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS salary_type TEXT DEFAULT 'hourly';

-- Update public.hr_v2_create_request RPC
CREATE OR REPLACE FUNCTION public.hr_v2_create_request(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id UUID;
BEGIN
    IF NOT public.has_role(auth.uid(), 'client') THEN
        RAISE EXCEPTION 'Only clients can create requests';
    END IF;

    INSERT INTO public.hr_v2_hire_requests (
        client_user_id, service_model, title, role_summary, responsibilities, requirements,
        location_preference, timezone_overlap, engagement_type, budget_type,
        budget_min, budget_max, fixed_budget, hours_per_week, requires_timesheets, status,
        preferred_currency, salary_type
    ) VALUES (
        auth.uid(),
        (payload->>'service_model')::public.hr_v2_service_model,
        payload->>'title',
        payload->>'role_summary',
        payload->>'responsibilities',
        payload->>'requirements',
        payload->>'location_preference',
        payload->>'timezone_overlap',
        payload->>'engagement_type',
        payload->>'budget_type',
        (payload->>'budget_min')::NUMERIC,
        (payload->>'budget_max')::NUMERIC,
        (payload->>'fixed_budget')::NUMERIC,
        (payload->>'hours_per_week')::INTEGER,
        COALESCE((payload->>'requires_timesheets')::BOOLEAN, false),
        'draft',
        COALESCE(payload->>'preferred_currency', 'USD'),
        COALESCE(payload->>'salary_type', 'hourly')
    ) RETURNING id INTO new_id;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type)
    VALUES (new_id, 'client', auth.uid(), 'CREATED');

    RETURN new_id;
END;
$$;

-- Update public.hr_v2_admin_create_request RPC
CREATE OR REPLACE FUNCTION public.hr_v2_admin_create_request(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id UUID;
    client_uid UUID;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can create requests';
    END IF;

    client_uid := NULLIF(payload->>'client_user_id', '')::UUID;
    IF client_uid IS NULL THEN
        RAISE EXCEPTION 'client_user_id is required';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.clients WHERE user_id = client_uid) THEN
        RAISE EXCEPTION 'Client not found';
    END IF;

    INSERT INTO public.hr_v2_hire_requests (
        client_user_id, service_model, title, role_summary, responsibilities, requirements,
        location_preference, timezone_overlap, engagement_type, budget_type,
        budget_min, budget_max, fixed_budget, hours_per_week, requires_timesheets, status,
        preferred_currency, salary_type
    ) VALUES (
        client_uid,
        (payload->>'service_model')::public.hr_v2_service_model,
        payload->>'title',
        payload->>'role_summary',
        payload->>'responsibilities',
        payload->>'requirements',
        payload->>'location_preference',
        payload->>'timezone_overlap',
        payload->>'engagement_type',
        payload->>'budget_type',
        (payload->>'budget_min')::NUMERIC,
        (payload->>'budget_max')::NUMERIC,
        (payload->>'fixed_budget')::NUMERIC,
        (payload->>'hours_per_week')::INTEGER,
        COALESCE((payload->>'requires_timesheets')::BOOLEAN, false),
        'draft',
        COALESCE(payload->>'preferred_currency', 'USD'),
        COALESCE(payload->>'salary_type', 'hourly')
    ) RETURNING id INTO new_id;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type)
    VALUES (new_id, 'admin', auth.uid(), 'CREATED');

    RETURN new_id;
END;
$$;
