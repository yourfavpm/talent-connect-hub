-- Migration: Add close_reason column and admin close RPC for hr_v2_hire_requests

-- 1) Add close_reason column
DO $$ BEGIN
    ALTER TABLE IF EXISTS public.hr_v2_hire_requests ADD COLUMN IF NOT EXISTS close_reason TEXT;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2) Add admin RPC to close a request with reason
CREATE OR REPLACE FUNCTION public.hr_v2_admin_close_request(req_id UUID, reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can close requests';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.hr_v2_hire_requests WHERE id = req_id) THEN
        RAISE EXCEPTION 'Hire request not found';
    END IF;

    UPDATE public.hr_v2_hire_requests
    SET status = 'closed', close_reason = reason, updated_at = now()
    WHERE id = req_id;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type, meta)
    VALUES (req_id, 'admin', auth.uid(), 'CLOSED', jsonb_build_object('reason', reason));
END;
$$;
