-- HIRE REQUESTS UPDATE RPC
-- Allows clients to save changes to their draft hire requests.

BEGIN;

CREATE OR REPLACE FUNCTION public.hr_v2_update_request(req_id UUID, payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Permission check
    IF NOT public.has_role(auth.uid(), 'client') THEN
        RAISE EXCEPTION 'Only clients can update requests';
    END IF;

    -- 2. Update the record (only if it's a draft and owned by the user)
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

    -- 3. If no row updated, it might not be a draft or not owned by the user
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found, not a draft, or permission denied';
    END IF;

END;
$$;

COMMIT;
