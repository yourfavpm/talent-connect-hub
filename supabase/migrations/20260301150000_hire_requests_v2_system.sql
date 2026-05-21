-- ============================================================
-- Hire Requests V2 Module
-- ============================================================

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE public.hr_v2_service_model AS ENUM ('direct_hire', 'trial_to_hire', 'one_time_project', 'offshore');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.hr_v2_request_status AS ENUM ('draft', 'submitted', 'admin_review', 'approved', 'published', 'paused', 'closed', 'hired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.hr_v2_event_type AS ENUM ('CREATED', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'SHORTLISTED', 'INVITED_TO_APPLY', 'APPLIED', 'INTERVIEW_REQUESTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_RESCHEDULED', 'INTERVIEW_COMPLETED', 'HIRED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.hr_v2_app_status AS ENUM ('applied', 'shortlisted', 'rejected', 'invited', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.hr_v2_shortlist_status AS ENUM ('shortlisted', 'interview_requested', 'interview_scheduled', 'interviewed', 'selected', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.hr_v2_interview_status AS ENUM ('pending', 'scheduled', 'reschedule_requested', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.hr_v2_hire_status AS ENUM ('pending_admin_contract', 'contract_sent', 'contract_signed', 'active', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Tables

CREATE TABLE IF NOT EXISTS public.hr_v2_hire_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_org_id UUID,
    service_model public.hr_v2_service_model NOT NULL,
    title TEXT NOT NULL,
    role_summary TEXT,
    responsibilities TEXT,
    requirements TEXT,
    location_preference TEXT,
    timezone_overlap TEXT,
    engagement_type TEXT,
    start_date DATE,
    budget_type TEXT,
    budget_min NUMERIC,
    budget_max NUMERIC,
    fixed_budget NUMERIC,
    contract_duration TEXT,
    hours_per_week INTEGER,
    requires_timesheets BOOLEAN DEFAULT false,
    client_notes TEXT,
    status public.hr_v2_request_status DEFAULT 'draft',
    approved_by_admin_id UUID REFERENCES auth.users(id),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_v2_request_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hire_request_id UUID REFERENCES public.hr_v2_hire_requests(id) ON DELETE CASCADE NOT NULL,
    actor_type TEXT NOT NULL,
    actor_user_id UUID REFERENCES auth.users(id) NOT NULL,
    event_type public.hr_v2_event_type NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_v2_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hire_request_id UUID REFERENCES public.hr_v2_hire_requests(id) ON DELETE CASCADE NOT NULL,
    talent_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    application_note TEXT,
    status public.hr_v2_app_status DEFAULT 'applied',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (hire_request_id, talent_user_id)
);

CREATE TABLE IF NOT EXISTS public.hr_v2_shortlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hire_request_id UUID REFERENCES public.hr_v2_hire_requests(id) ON DELETE CASCADE NOT NULL,
    talent_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    shortlisted_by_admin_id UUID REFERENCES auth.users(id) NOT NULL,
    shortlist_reason TEXT,
    status public.hr_v2_shortlist_status DEFAULT 'shortlisted',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (hire_request_id, talent_user_id)
);

CREATE TABLE IF NOT EXISTS public.hr_v2_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hire_request_id UUID REFERENCES public.hr_v2_hire_requests(id) ON DELETE CASCADE NOT NULL,
    talent_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    scheduled_by_admin_id UUID REFERENCES auth.users(id),
    calendly_link TEXT,
    proposed_times JSONB,
    scheduled_time TIMESTAMPTZ,
    status public.hr_v2_interview_status DEFAULT 'pending',
    meeting_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_v2_hires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hire_request_id UUID REFERENCES public.hr_v2_hire_requests(id) ON DELETE CASCADE NOT NULL,
    talent_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    service_model public.hr_v2_service_model NOT NULL,
    hire_status public.hr_v2_hire_status DEFAULT 'pending_admin_contract',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS Policies

ALTER TABLE public.hr_v2_hire_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_v2_request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_v2_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_v2_shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_v2_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_v2_hires ENABLE ROW LEVEL SECURITY;

-- Admins
DO $$ BEGIN
    CREATE POLICY "Admins manage hr_v2_hire_requests" ON public.hr_v2_hire_requests FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Admins manage hr_v2_request_events" ON public.hr_v2_request_events FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Admins manage hr_v2_applications" ON public.hr_v2_applications FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Admins manage hr_v2_shortlists" ON public.hr_v2_shortlists FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Admins manage hr_v2_interviews" ON public.hr_v2_interviews FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Admins manage hr_v2_hires" ON public.hr_v2_hires FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Clients
DO $$ BEGIN
    CREATE POLICY "Clients see their own requests" ON public.hr_v2_hire_requests FOR SELECT USING (client_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Clients see their own shortlists" ON public.hr_v2_shortlists FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.hr_v2_hire_requests WHERE id = hr_v2_shortlists.hire_request_id AND client_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Clients see their own interviews" ON public.hr_v2_interviews FOR SELECT USING (client_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Clients see their own hires" ON public.hr_v2_hires FOR SELECT USING (client_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Talents
DO $$ BEGIN
    CREATE POLICY "Talents see published requests" ON public.hr_v2_hire_requests FOR SELECT USING (status = 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Talents see their own applications" ON public.hr_v2_applications FOR SELECT USING (talent_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Talents see their own interviews" ON public.hr_v2_interviews FOR SELECT USING (talent_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Talents see their own hires" ON public.hr_v2_hires FOR SELECT USING (talent_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 4. Authoritative RPCs
-- Client RPCs
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
        budget_min, budget_max, fixed_budget, hours_per_week, requires_timesheets, status
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
        'draft'
    ) RETURNING id INTO new_id;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type)
    VALUES (new_id, 'client', auth.uid(), 'CREATED');

    RETURN new_id;
END;
$$;

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

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type)
    VALUES (new_id, 'admin', auth.uid(), 'CREATED');

    RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_v2_submit_request(req_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.has_role(auth.uid(), 'client') THEN
        RAISE EXCEPTION 'Only clients can submit requests';
    END IF;

    UPDATE public.hr_v2_hire_requests
    SET status = 'submitted', updated_at = now()
    WHERE id = req_id AND client_user_id = auth.uid() AND status = 'draft';

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type)
    VALUES (req_id, 'client', auth.uid(), 'SUBMITTED');
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_v2_request_interview(req_id UUID, t_user_id UUID, p_times JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.has_role(auth.uid(), 'client') THEN
        RAISE EXCEPTION 'Only clients can request interviews';
    END IF;

    -- Make sure they are actually shortlisted
    IF NOT EXISTS (SELECT 1 FROM public.hr_v2_shortlists WHERE hire_request_id = req_id AND talent_user_id = t_user_id) THEN
        RAISE EXCEPTION 'Candidate is not shortlisted';
    END IF;

    UPDATE public.hr_v2_shortlists
    SET status = 'interview_requested', updated_at = now()
    WHERE hire_request_id = req_id AND talent_user_id = t_user_id;

    -- Create pending interview
    INSERT INTO public.hr_v2_interviews (hire_request_id, talent_user_id, client_user_id, proposed_times, status)
    VALUES (req_id, t_user_id, auth.uid(), p_times, 'pending');

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type, meta)
    VALUES (req_id, 'client', auth.uid(), 'INTERVIEW_REQUESTED', jsonb_build_object('talent_user_id', t_user_id));
END;
$$;

-- Admin RPCs
CREATE OR REPLACE FUNCTION public.hr_v2_admin_approve_request(req_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can approve requests';
    END IF;

    UPDATE public.hr_v2_hire_requests
    SET status = 'approved', approved_by_admin_id = auth.uid(), updated_at = now()
    WHERE id = req_id;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type)
    VALUES (req_id, 'admin', auth.uid(), 'APPROVED');
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_v2_admin_publish_request(req_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can publish requests';
    END IF;

    UPDATE public.hr_v2_hire_requests
    SET status = 'published', published_at = now(), updated_at = now()
    WHERE id = req_id;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type)
    VALUES (req_id, 'admin', auth.uid(), 'PUBLISHED');
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_v2_admin_shortlist_talent(req_id UUID, t_user_id UUID, reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can shortlist talents';
    END IF;

    INSERT INTO public.hr_v2_shortlists (hire_request_id, talent_user_id, shortlisted_by_admin_id, shortlist_reason)
    VALUES (req_id, t_user_id, auth.uid(), reason)
    ON CONFLICT (hire_request_id, talent_user_id) DO UPDATE
    SET status = 'shortlisted', updated_at = now();

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type, meta)
    VALUES (req_id, 'admin', auth.uid(), 'SHORTLISTED', jsonb_build_object('talent_user_id', t_user_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_v2_admin_invite_talent_to_apply(req_id UUID, t_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can invite talents';
    END IF;

    INSERT INTO public.hr_v2_applications (hire_request_id, talent_user_id, status)
    VALUES (req_id, t_user_id, 'invited')
    ON CONFLICT (hire_request_id, talent_user_id) DO NOTHING;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type, meta)
    VALUES (req_id, 'admin', auth.uid(), 'INVITED_TO_APPLY', jsonb_build_object('talent_user_id', t_user_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_v2_admin_schedule_interview(req_id UUID, t_user_id UUID, c_user_id UUID, c_link TEXT, s_time TIMESTAMPTZ)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can schedule interviews';
    END IF;

    UPDATE public.hr_v2_interviews
    SET status = 'scheduled', calendly_link = c_link, scheduled_time = s_time, scheduled_by_admin_id = auth.uid(), updated_at = now()
    WHERE hire_request_id = req_id AND talent_user_id = t_user_id AND client_user_id = c_user_id
    AND status = 'pending';

    UPDATE public.hr_v2_shortlists
    SET status = 'interview_scheduled', updated_at = now()
    WHERE hire_request_id = req_id AND talent_user_id = t_user_id;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type, meta)
    VALUES (req_id, 'admin', auth.uid(), 'INTERVIEW_SCHEDULED', jsonb_build_object('talent_user_id', t_user_id, 'scheduled_time', s_time));
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_v2_admin_mark_interview_complete(interview_id UUID, notes TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r_id UUID;
    t_id UUID;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can mark interviews complete';
    END IF;

    UPDATE public.hr_v2_interviews
    SET status = 'completed', meeting_notes = notes, updated_at = now()
    WHERE id = interview_id
    RETURNING hire_request_id, talent_user_id INTO r_id, t_id;

    IF r_id IS NOT NULL THEN
        UPDATE public.hr_v2_shortlists
        SET status = 'interviewed', updated_at = now()
        WHERE hire_request_id = r_id AND talent_user_id = t_id;

        INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type, meta)
        VALUES (r_id, 'admin', auth.uid(), 'INTERVIEW_COMPLETED', jsonb_build_object('talent_user_id', t_id));
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.hr_v2_admin_finalize_hire(req_id UUID, t_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    c_user_id UUID;
    s_model public.hr_v2_service_model;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can finalize hires';
    END IF;

    SELECT client_user_id, service_model INTO c_user_id, s_model
    FROM public.hr_v2_hire_requests
    WHERE id = req_id;

    UPDATE public.hr_v2_hire_requests
    SET status = 'hired', updated_at = now()
    WHERE id = req_id;

    INSERT INTO public.hr_v2_hires (hire_request_id, talent_user_id, client_user_id, service_model)
    VALUES (req_id, t_user_id, c_user_id, s_model);

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type, meta)
    VALUES (req_id, 'admin', auth.uid(), 'HIRED', jsonb_build_object('talent_user_id', t_user_id));
END;
$$;

-- Talent RPCs
CREATE OR REPLACE FUNCTION public.hr_v2_talent_apply(req_id UUID, note TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_vetted BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.v2_talent_profiles
        WHERE user_id = auth.uid() AND status = 'vetted'
    ) INTO is_vetted;

    IF NOT is_vetted THEN
        RAISE EXCEPTION 'Only fully vetted talents can apply';
    END IF;

    INSERT INTO public.hr_v2_applications (hire_request_id, talent_user_id, application_note)
    VALUES (req_id, auth.uid(), note);

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type)
    VALUES (req_id, 'talent', auth.uid(), 'APPLIED');
END;
$$;
