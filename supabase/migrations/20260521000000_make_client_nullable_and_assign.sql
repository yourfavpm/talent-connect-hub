-- Migration: Make client_user_id nullable and add assign RPC
-- 1) Allow admins to create hire requests without a registered client
-- 2) Provide an RPC to assign a client to an existing request later

DO $$ BEGIN
    -- Add 'ASSIGNED' event type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'hr_v2_event_type' AND e.enumlabel = 'ASSIGNED') THEN
        ALTER TYPE public.hr_v2_event_type ADD VALUE 'ASSIGNED';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- swallow: value may already exist or running on older PG versions
    NULL;
END $$;

-- 1. Make client_user_id nullable
ALTER TABLE IF EXISTS public.hr_v2_hire_requests ALTER COLUMN client_user_id DROP NOT NULL;

-- 2. Update admin create RPC to allow optional client_user_id
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

    -- Accept empty or missing client_user_id; allow admin to create a request without an assigned client
    client_uid := NULLIF(payload->>'client_user_id', '')::UUID;
    IF client_uid IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.clients WHERE user_id = client_uid) THEN
            RAISE EXCEPTION 'Client not found';
        END IF;
    END IF;

    INSERT INTO public.hr_v2_hire_requests (
        client_user_id, service_model, title, role_summary, responsibilities, requirements,
        location_preference, timezone_overlap, engagement_type, budget_type,
        budget_min, budget_max, fixed_budget, hours_per_week, requires_timesheets, status
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
        'draft'
    ) RETURNING id INTO new_id;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type, meta)
    VALUES (new_id, 'admin', auth.uid(), 'CREATED', jsonb_build_object('client_user_id', client_uid));

    RETURN new_id;
END;
$$;

-- 3. Add RPC to assign a client to an existing request (callable by admins)
CREATE OR REPLACE FUNCTION public.hr_v2_assign_request_to_client(req_id UUID, client_uid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can assign clients to requests';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.hr_v2_hire_requests WHERE id = req_id) THEN
        RAISE EXCEPTION 'Hire request not found';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.clients WHERE user_id = client_uid) THEN
        RAISE EXCEPTION 'Client not found';
    END IF;

    UPDATE public.hr_v2_hire_requests
    SET client_user_id = client_uid, updated_at = now()
    WHERE id = req_id;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type, meta)
    VALUES (req_id, 'admin', auth.uid(), 'ASSIGNED', jsonb_build_object('client_user_id', client_uid));
END;
$$;
