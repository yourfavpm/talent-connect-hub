-- START FILE: 20260301150000_hire_requests_v2_system.sql

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
    DROP POLICY IF EXISTS "Admins manage hr_v2_hire_requests" ON public.hr_v2_hire_requests;
CREATE POLICY "Admins manage hr_v2_hire_requests" ON public.hr_v2_hire_requests FOR ALL USING (public.is_admin(auth.uid()::uuid));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage hr_v2_request_events" ON public.hr_v2_request_events;
CREATE POLICY "Admins manage hr_v2_request_events" ON public.hr_v2_request_events FOR ALL USING (public.is_admin(auth.uid()::uuid));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage hr_v2_applications" ON public.hr_v2_applications;
CREATE POLICY "Admins manage hr_v2_applications" ON public.hr_v2_applications FOR ALL USING (public.is_admin(auth.uid()::uuid));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage hr_v2_shortlists" ON public.hr_v2_shortlists;
CREATE POLICY "Admins manage hr_v2_shortlists" ON public.hr_v2_shortlists FOR ALL USING (public.is_admin(auth.uid()::uuid));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage hr_v2_interviews" ON public.hr_v2_interviews;
CREATE POLICY "Admins manage hr_v2_interviews" ON public.hr_v2_interviews FOR ALL USING (public.is_admin(auth.uid()::uuid));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage hr_v2_hires" ON public.hr_v2_hires;
CREATE POLICY "Admins manage hr_v2_hires" ON public.hr_v2_hires FOR ALL USING (public.is_admin(auth.uid()::uuid));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Clients
DO $$ BEGIN
    DROP POLICY IF EXISTS "Clients see their own requests" ON public.hr_v2_hire_requests;
CREATE POLICY "Clients see their own requests" ON public.hr_v2_hire_requests FOR SELECT USING (client_user_id::uuid = auth.uid()::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Clients see their own shortlists" ON public.hr_v2_shortlists;
CREATE POLICY "Clients see their own shortlists" ON public.hr_v2_shortlists FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.hr_v2_hire_requests WHERE id = hr_v2_shortlists.hire_request_id AND client_user_id::uuid = auth.uid()::uuid)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Clients see their own interviews" ON public.hr_v2_interviews;
CREATE POLICY "Clients see their own interviews" ON public.hr_v2_interviews FOR SELECT USING (client_user_id::uuid = auth.uid()::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Clients see their own hires" ON public.hr_v2_hires;
CREATE POLICY "Clients see their own hires" ON public.hr_v2_hires FOR SELECT USING (client_user_id::uuid = auth.uid()::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Talents
DO $$ BEGIN
    DROP POLICY IF EXISTS "Talents see published requests" ON public.hr_v2_hire_requests;
CREATE POLICY "Talents see published requests" ON public.hr_v2_hire_requests FOR SELECT USING (status = 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Talents see their own applications" ON public.hr_v2_applications;
CREATE POLICY "Talents see their own applications" ON public.hr_v2_applications FOR SELECT USING (talent_user_id::uuid = auth.uid()::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Talents see their own interviews" ON public.hr_v2_interviews;
CREATE POLICY "Talents see their own interviews" ON public.hr_v2_interviews FOR SELECT USING (talent_user_id::uuid = auth.uid()::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Talents see their own hires" ON public.hr_v2_hires;
CREATE POLICY "Talents see their own hires" ON public.hr_v2_hires FOR SELECT USING (talent_user_id::uuid = auth.uid()::uuid);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 4. Authoritative RPCs
-- Client RPCs
DROP FUNCTION IF EXISTS public.hr_v2_create_request(payload JSONB) CASCADE;
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

DROP FUNCTION IF EXISTS public.hr_v2_submit_request(req_id UUID) CASCADE;
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
    WHERE id = req_id AND client_user_id::uuid = auth.uid()::uuid AND status = 'draft';

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type)
    VALUES (req_id, 'client', auth.uid(), 'SUBMITTED');
END;
$$;

DROP FUNCTION IF EXISTS public.hr_v2_request_interview(req_id UUID, t_user_id UUID, p_times JSONB) CASCADE;
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
    IF NOT EXISTS (SELECT 1 FROM public.hr_v2_shortlists WHERE hire_request_id::uuid = req_id::uuid AND talent_user_id::uuid = t_user_id::uuid) THEN
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
DROP FUNCTION IF EXISTS public.hr_v2_admin_approve_request(req_id UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.hr_v2_admin_approve_request(req_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()::uuid) THEN
        RAISE EXCEPTION 'Only admins can approve requests';
    END IF;

    UPDATE public.hr_v2_hire_requests
    SET status = 'approved', approved_by_admin_id = auth.uid(), updated_at = now()
    WHERE id = req_id;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type)
    VALUES (req_id, 'admin', auth.uid(), 'APPROVED');
END;
$$;

DROP FUNCTION IF EXISTS public.hr_v2_admin_publish_request(req_id UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.hr_v2_admin_publish_request(req_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()::uuid) THEN
        RAISE EXCEPTION 'Only admins can publish requests';
    END IF;

    UPDATE public.hr_v2_hire_requests
    SET status = 'published', published_at = now(), updated_at = now()
    WHERE id = req_id;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type)
    VALUES (req_id, 'admin', auth.uid(), 'PUBLISHED');
END;
$$;

DROP FUNCTION IF EXISTS public.hr_v2_admin_shortlist_talent(req_id UUID, t_user_id UUID, reason TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.hr_v2_admin_shortlist_talent(req_id UUID, t_user_id UUID, reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()::uuid) THEN
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

DROP FUNCTION IF EXISTS public.hr_v2_admin_invite_talent_to_apply(req_id UUID, t_user_id UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.hr_v2_admin_invite_talent_to_apply(req_id UUID, t_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()::uuid) THEN
        RAISE EXCEPTION 'Only admins can invite talents';
    END IF;

    INSERT INTO public.hr_v2_applications (hire_request_id, talent_user_id, status)
    VALUES (req_id, t_user_id, 'invited')
    ON CONFLICT (hire_request_id, talent_user_id) DO NOTHING;

    INSERT INTO public.hr_v2_request_events (hire_request_id, actor_type, actor_user_id, event_type, meta)
    VALUES (req_id, 'admin', auth.uid(), 'INVITED_TO_APPLY', jsonb_build_object('talent_user_id', t_user_id));
END;
$$;

DROP FUNCTION IF EXISTS public.hr_v2_admin_schedule_interview(req_id UUID, t_user_id UUID, c_user_id UUID, c_link TEXT, s_time TIMESTAMPTZ) CASCADE;
CREATE OR REPLACE FUNCTION public.hr_v2_admin_schedule_interview(req_id UUID, t_user_id UUID, c_user_id UUID, c_link TEXT, s_time TIMESTAMPTZ)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()::uuid) THEN
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

DROP FUNCTION IF EXISTS public.hr_v2_admin_mark_interview_complete(interview_id UUID, notes TEXT) CASCADE;
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
    IF NOT public.is_admin(auth.uid()::uuid) THEN
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

DROP FUNCTION IF EXISTS public.hr_v2_admin_finalize_hire(req_id UUID, t_user_id UUID) CASCADE;
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
    IF NOT public.is_admin(auth.uid()::uuid) THEN
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
DROP FUNCTION IF EXISTS public.hr_v2_talent_apply(req_id UUID, note TEXT) CASCADE;
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
        WHERE user_id = COALESCE(p_user_id, auth.uid()) AND status = 'vetted'
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


-- END FILE: 20260301150000_hire_requests_v2_system.sql


-- START FILE: 20260310000000_create_email_tables.sql

-- Email Templates Table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Email Logs Table (for tracking sent emails)
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    template_key VARCHAR(100) NOT NULL,
    subject TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'bounced', 'complained'
    provider_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add sent_at column to email_logs if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_logs' AND column_name = 'sent_at'
    ) THEN
        ALTER TABLE public.email_logs ADD COLUMN sent_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_templates_status ON public.email_templates(status);
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON public.email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_key ON public.email_logs(template_key);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates (authenticated users can view active templates)
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.email_templates;
CREATE POLICY "Anyone can view active templates" ON public.email_templates
    FOR SELECT TO authenticated
    USING (status = 'active');

DROP POLICY IF EXISTS "Service role can manage templates" ON public.email_templates;
CREATE POLICY "Service role can manage templates" ON public.email_templates
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for email_logs (authenticated users can log emails, service role can manage)
DROP POLICY IF EXISTS "Service role can manage email logs" ON public.email_logs;
CREATE POLICY "Service role can manage email logs" ON public.email_logs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert email logs" ON public.email_logs;
CREATE POLICY "Authenticated users can insert email logs" ON public.email_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can view email logs" ON public.email_logs;
CREATE POLICY "Service role can view email logs" ON public.email_logs
    FOR SELECT TO service_role
    USING (true);

-- Insert default email templates
INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status) VALUES
-- TALENT TEMPLATES
('talent_welcome', 'Talent Welcome Email', 
'Welcome to OPSlyHR - Your Talent ID: {{talent_id}}',
'<html><body><h1>Welcome to OPSlyHR, {{talent_name}}!</h1><p>We''re excited to have you join our platform of top-tier professionals.</p><p><strong>Your Talent ID:</strong> {{talent_id}}</p><h2>Next Steps:</h2><ol><li>Complete your profile</li><li>Get vetted to access exclusive opportunities</li><li>Browse available positions</li></ol><p><a href="{{login_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Login to Your Account</a></p><p>Best regards,<br>The OPSlyHR Team</p></body></html>',
'Welcome to OPSlyHR, {{talent_name}}!

We''re excited to have you join our platform of top-tier professionals.

Your Talent ID: {{talent_id}}

Next Steps:
1. Complete your profile
2. Get vetted to access exclusive opportunities
3. Browse available positions

Login to Your Account: {{login_link}}

Best regards,
The OPSlyHR Team',
'active'),

('talent_offer_received', 'Talent Offer Received',
'New Contract Offer from {{client_name}}',
'<html><body><h1>Congratulations, {{talent_name}}!</h1><p>You''ve received a contract offer for the position of <strong>{{job_title}}</strong> from {{client_name}}.</p><h2>Offer Details:</h2><ul><li><strong>Position:</strong> {{job_title}}</li><li><strong>Client:</strong> {{client_name}}</li><li><strong>Rate:</strong> {{rate}}</li><li><strong>Start Date:</strong> {{start_date}}</li></ul><p><a href="{{offer_link}}" style="background:#28a745;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">View Offer</a></p><p>Best regards,<br>The OPSlyHR Team</p></body></html>',
'Congratulations, {{talent_name}}!

You''ve received a contract offer for the position of {{job_title}} from {{client_name}}.

Offer Details:
- Position: {{job_title}}
- Client: {{client_name}}
- Rate: {{rate}}
- Start Date: {{start_date}}

View Offer: {{offer_link}}

Best regards,
The OPSlyHR Team',
'active'),

('talent_contract_signed', 'Talent Contract Signed Confirmation',
'Contract Signed Successfully - {{contract_id}}',
'<html><body><h1>Contract Signed, {{talent_name}}!</h1><p>Your contract has been signed successfully.</p><p><strong>Contract ID:</strong> {{contract_id}}<br><strong>Start Date:</strong> {{start_date}}</p><p>We''ll notify you once the client signs as well. You can view your contract anytime in your dashboard.</p><p><a href="{{contract_link}}">View Contract</a></p><p>Best regards,<br>The OPSlyHR Team</p></body></html>',
'Contract Signed, {{talent_name}}!

Your contract has been signed successfully.

Contract ID: {{contract_id}}
Start Date: {{start_date}}

We''ll notify you once the client signs as well. You can view your contract anytime in your dashboard.

View Contract: {{contract_link}}

Best regards,
The OPSlyHR Team',
'active'),

-- CLIENT TEMPLATES
('client_welcome', 'Client Welcome Email',
'Welcome to OPSlyHR - Let''s Find Your Perfect Talent',
'<html><body><h1>Welcome to OPSlyHR, {{client_name}}!</h1><p>Thank you for choosing OPSlyHR to build your team with top-tier professionals.</p><p><strong>Company:</strong> {{company_name}}</p><h2>Get Started:</h2><ol><li>Post your first job or hire request</li><li>Review vetted talent profiles</li><li>Schedule interviews with candidates</li></ol><p><a href="{{login_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Access Your Dashboard</a></p><p>Best regards,<br>The OPSlyHR Team</p></body></html>',
'Welcome to OPSlyHR, {{client_name}}!

Thank you for choosing OPSlyHR to build your team with top-tier professionals.

Company: {{company_name}}

Get Started:
1. Post your first job or hire request
2. Review vetted talent profiles
3. Schedule interviews with candidates

Access Your Dashboard: {{login_link}}

Best regards,
The OPSlyHR Team',
'active'),

('client_contract_ready', 'Client Contract Ready for Review',
'Contract Ready for Review - {{talent_name}}',
'<html><body><h1>Hi {{client_name}},</h1><p>Your contract with {{talent_name}} is ready for review and signature.</p><p><strong>Position:</strong> {{job_title}}</p><p>Please review the contract details and sign to proceed.</p><p><a href="{{contract_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Review & Sign Contract</a></p><p>Best regards,<br>The OPSlyHR Team</p></body></html>',
'Hi {{client_name}},

Your contract with {{talent_name}} is ready for review and signature.

Position: {{job_title}}

Please review the contract details and sign to proceed.

Review & Sign Contract: {{contract_link}}

Best regards,
The OPSlyHR Team',
'active'),

('client_invoice_generated', 'Client Invoice Generated',
'New Invoice #{{invoice_id}} - Due {{due_date}}',
'<html><body><h1>New Invoice, {{client_name}}</h1><p>A new invoice has been generated for your account.</p><p><strong>Invoice ID:</strong> {{invoice_id}}<br><strong>Amount:</strong> {{amount}}<br><strong>Due Date:</strong> {{due_date}}</p><p><a href="{{invoice_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">View Invoice</a></p><p>Best regards,<br>The OPSlyHR Team</p></body></html>',
'New Invoice, {{client_name}}

A new invoice has been generated for your account.

Invoice ID: {{invoice_id}}
Amount: {{amount}}
Due Date: {{due_date}}

View Invoice: {{invoice_link}}

Best regards,
The OPSlyHR Team',
'active'),

-- ADMIN TEMPLATES
('admin_contract_fully_signed', 'Admin Contract Fully Signed Notification',
'Contract Fully Signed - {{contract_id}}',
'<html><body><h1>Contract Fully Signed</h1><p>Both parties have signed the contract.</p><p><strong>Contract ID:</strong> {{contract_id}}<br><strong>Client:</strong> {{client_name}}<br><strong>Talent:</strong> {{talent_name}}</p><p><a href="{{contract_link}}">View Contract</a></p></body></html>',
'Contract Fully Signed

Both parties have signed the contract.

Contract ID: {{contract_id}}
Client: {{client_name}}
Talent: {{talent_name}}

View Contract: {{contract_link}}',
'active'),

('admin_invoice_overdue', 'Admin Invoice Overdue Alert',
'ALERT: Invoice Overdue - {{invoice_id}}',
'<html><body><h1 style="color:#dc3545;">Invoice Overdue Alert</h1><p>The following invoice is now overdue:</p><p><strong>Invoice ID:</strong> {{invoice_id}}<br><strong>Client:</strong> {{client_name}}<br><strong>Amount:</strong> {{amount}}<br><strong>Days Overdue:</strong> {{days_overdue}}</p><p>Please follow up with the client.</p><p><a href="{{invoice_link}}">View Invoice</a></p></body></html>',
'INVOICE OVERDUE ALERT

The following invoice is now overdue:

Invoice ID: {{invoice_id}}
Client: {{client_name}}
Amount: {{amount}}
Days Overdue: {{days_overdue}}

Please follow up with the client.

View Invoice: {{invoice_link}}',
'active')
ON CONFLICT DO NOTHING;


-- END FILE: 20260310000000_create_email_tables.sql


-- START FILE: 20260331000000_add_vetting_email_templates.sql

-- Add missing email templates for vetting, contract signing, and payment notifications

INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status) VALUES

-- Talent Vetting Approved
('talent_vetting_approved', 'Talent Vetting Approved',
'Congratulations! Your OPSlyHR Profile is Now Active',
'<html><body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
<div style="text-align: center; margin-bottom: 32px;">
  <img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" style="height: 48px;" />
</div>
<h1 style="color: #059669; font-size: 24px; margin-bottom: 8px;">You''re Approved, {{talent_name}}! 🎉</h1>
<p style="font-size: 16px; line-height: 1.6; color: #374151;">Great news — your profile has been reviewed and approved by our vetting team. You now have full access to the OPSlyHR talent marketplace.</p>
<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <p style="font-size: 14px; color: #166534; margin: 0;"><strong>Approval Date:</strong> {{approval_date}}</p>
</div>
<h2 style="font-size: 18px; color: #111827; margin-top: 32px;">What Happens Next:</h2>
<ol style="font-size: 14px; line-height: 2; color: #374151;">
  <li>Your profile is now <strong>visible to verified clients</strong></li>
  <li>You can browse and apply for available positions</li>
  <li>You''ll receive notifications when matched to opportunities</li>
</ol>
<p style="margin-top: 32px;"><a href="{{jobs_link}}" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px;">Browse Opportunities →</a></p>
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 24px;" />
<p style="font-size: 12px; color: #9ca3af;">Best regards,<br />The OPSlyHR Vetting Team</p>
</body></html>',
'Congratulations, {{talent_name}}!

Great news — your profile has been reviewed and approved by our vetting team. You now have full access to the OPSlyHR talent marketplace.

Approval Date: {{approval_date}}

What Happens Next:
1. Your profile is now visible to verified clients
2. You can browse and apply for available positions
3. You''ll receive notifications when matched to opportunities

Browse Opportunities: {{jobs_link}}

Best regards,
The OPSlyHR Vetting Team',
'active'),

-- Talent Vetting Rejected
('talent_vetting_rejected', 'Talent Vetting Rejected',
'Update on Your OPSlyHR Application',
'<html><body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
<div style="text-align: center; margin-bottom: 32px;">
  <img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" style="height: 48px;" />
</div>
<h1 style="color: #1e293b; font-size: 24px; margin-bottom: 8px;">Hi {{talent_name}},</h1>
<p style="font-size: 16px; line-height: 1.6; color: #374151;">Thank you for your interest in joining the OPSlyHR talent network. After careful review, we were unable to approve your profile at this time.</p>
<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <p style="font-size: 14px; color: #991b1b; margin: 0 0 8px 0;"><strong>Feedback from our team:</strong></p>
  <p style="font-size: 14px; color: #7f1d1d; margin: 0; line-height: 1.6;">{{reasons}}</p>
</div>
<h2 style="font-size: 18px; color: #111827; margin-top: 32px;">Next Steps:</h2>
<ul style="font-size: 14px; line-height: 2; color: #374151;">
  <li>Review the feedback above</li>
  <li>Update your profile to address the noted areas</li>
  <li>Resubmit your application for another review</li>
</ul>
<p style="margin-top: 32px;"><a href="{{resubmit_link}}" style="background: #1e293b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px;">Update & Resubmit →</a></p>
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 24px;" />
<p style="font-size: 12px; color: #9ca3af;">Best regards,<br />The OPSlyHR Vetting Team</p>
</body></html>',
'Hi {{talent_name}},

Thank you for your interest in joining the OPSlyHR talent network. After careful review, we were unable to approve your profile at this time.

Feedback from our team:
{{reasons}}

Next Steps:
- Review the feedback above
- Update your profile to address the noted areas
- Resubmit your application for another review

Update & Resubmit: {{resubmit_link}}

Best regards,
The OPSlyHR Vetting Team',
'active'),

-- Admin Vetting Submission Alert
('admin_vetting_submission', 'Admin Vetting Submission Alert',
'New Vetting Submission: {{talent_name}}',
'<html><body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
<h1 style="color: #1e293b; font-size: 24px;">New Vetting Submission</h1>
<p style="font-size: 16px; line-height: 1.6; color: #374151;">A new talent has submitted their profile for vetting review.</p>
<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <p style="font-size: 14px; color: #334155; margin: 0 0 8px 0;"><strong>Talent:</strong> {{talent_name}}</p>
  <p style="font-size: 14px; color: #334155; margin: 0;"><strong>Talent ID:</strong> {{talent_id}}</p>
</div>
<p><a href="{{review_link}}" style="background: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px;">Review Submission →</a></p>
</body></html>',
'New Vetting Submission

A new talent has submitted their profile for vetting review.

Talent: {{talent_name}}
Talent ID: {{talent_id}}

Review Submission: {{review_link}}',
'active'),

-- Client Contract Signed Confirmation
('client_contract_signed', 'Client Contract Signed Confirmation',
'Contract Signed Successfully - {{contract_id}}',
'<html><body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
<div style="text-align: center; margin-bottom: 32px;">
  <img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" style="height: 48px;" />
</div>
<h1 style="color: #059669; font-size: 24px;">Contract Signed, {{client_name}}! ✓</h1>
<p style="font-size: 16px; line-height: 1.6; color: #374151;">Your contract with <strong>{{talent_name}}</strong> has been signed successfully.</p>
<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <p style="font-size: 14px; color: #166534; margin: 0;"><strong>Contract ID:</strong> {{contract_id}}</p>
</div>
<p style="font-size: 14px; color: #374151;">The talent will be notified and the contract will be activated once both parties have signed.</p>
<p><a href="{{contract_link}}" style="background: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px;">View Contract →</a></p>
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 24px;" />
<p style="font-size: 12px; color: #9ca3af;">Best regards,<br />The OPSlyHR Team</p>
</body></html>',
'Contract Signed, {{client_name}}!

Your contract with {{talent_name}} has been signed successfully.

Contract ID: {{contract_id}}

The talent will be notified and the contract will be activated once both parties have signed.

View Contract: {{contract_link}}

Best regards,
The OPSlyHR Team',
'active'),

-- Client Payment Received
('client_payment_received', 'Client Payment Received Confirmation',
'Payment Received - Invoice #{{invoice_id}}',
'<html><body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
<div style="text-align: center; margin-bottom: 32px;">
  <img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" style="height: 48px;" />
</div>
<h1 style="color: #059669; font-size: 24px;">Payment Received ✓</h1>
<p style="font-size: 16px; line-height: 1.6; color: #374151;">Hi {{client_name}}, we''ve received your payment.</p>
<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <p style="font-size: 14px; color: #166534; margin: 0 0 8px 0;"><strong>Amount:</strong> {{amount}}</p>
  <p style="font-size: 14px; color: #166534; margin: 0;"><strong>Invoice:</strong> #{{invoice_id}}</p>
</div>
<p style="font-size: 14px; color: #374151;">Thank you for your prompt payment. A receipt has been recorded on your account.</p>
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 24px;" />
<p style="font-size: 12px; color: #9ca3af;">Best regards,<br />The OPSlyHR Team</p>
</body></html>',
'Payment Received

Hi {{client_name}}, we''ve received your payment.

Amount: {{amount}}
Invoice: #{{invoice_id}}

Thank you for your prompt payment. A receipt has been recorded on your account.

Best regards,
The OPSlyHR Team',
'active')

ON CONFLICT (template_key) DO NOTHING;


-- END FILE: 20260331000000_add_vetting_email_templates.sql


-- START FILE: 20260401001000_comprehensive_email_templates.sql

-- Comprehensive Email Templates Migration
-- Adds all requested Talent and Client trigger templates

INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status) VALUES

-- TALENT: AUTH & ACCOUNT
('talent_auth_account_created', 'Talent: Account Created', 'Welcome to OPSlyHR! Confirm Your Email', 
'<html><body><h1>Welcome to OPSlyHR!</h1><p>Hi {{first_name}}, your account has been created. Please confirm your email to get started.</p><p><a href="{{verification_link}}">Verify Email</a></p></body></html>', 
'Welcome to OPSlyHR! Hi {{first_name}}, your account has been created. Verify here: {{verification_link}}', 'active'),

('talent_auth_verify_required', 'Talent: Email Verification Required', 'Final Step: Verify Your Email', 
'<html><body><h1>Verify Your Email</h1><p>Please click the link below to verify your email address.</p><p><a href="{{verification_link}}">Verify Email</a></p></body></html>', 
'Verify Your Email: {{verification_link}}', 'active'),

('talent_auth_verified_success', 'Talent: Email Verified Successfully', 'Email Verified! Welcome to the Marketplace', 
'<html><body><h1>Success!</h1><p>Your email has been verified. You can now complete your profile.</p><p><a href="{{dashboard_link}}">Go to Dashboard</a></p></body></html>', 
'Your email has been verified. Dashboard: {{dashboard_link}}', 'active'),

('talent_auth_password_reset', 'Talent: Password Reset Link', 'Reset Your OPSlyHR Password', 
'<html><body><h1>Reset Password</h1><p>Click below to reset your password.</p><p><a href="{{reset_link}}">Reset Password</a></p></body></html>', 
'Reset Password: {{reset_link}}', 'active'),

('talent_auth_password_changed', 'Talent: Password Changed Successfully', 'Security Alert: Password Changed', 
'<html><body><h1>Security Alert</h1><p>Your password was recently changed. If this wasn''t you, contact support immediately.</p></body></html>', 
'Security Alert: Your password was recently changed.', 'active'),

-- TALENT: ONBOARDING & PROFILE
('talent_onboarding_welcome', 'Talent: Welcome after Signup', 'Welcome to the OPSlyHR Network!', 
'<html><body><h1>Welcome!</h1><p>We''re excited to have you in our curated network of operations professionals.</p></body></html>', 
'Welcome to the OPSlyHR Network!', 'active'),

-- TALENT: VETTING
('talent_vetting_submitted', 'Talent: Vetting Request Submitted', 'We''ve Received Your Vetting Request', 
'<html><body><h1>Vetting in Progress</h1><p>Hi {{first_name}}, our team is reviewing your profile. We''ll be in touch soon.</p></body></html>', 
'We''ve received your vetting request.', 'active'),

('talent_vetting_changes_requested', 'Talent: Vetting Changes Requested', 'Action Required: Updates Needed for Your Profile', 
'<html><body><h1>Updates Needed</h1><p>Hi {{first_name}}, our team has reviewed your profile and needs a few more details.</p><p><strong>Feedback:</strong> {{feedback}}</p></body></html>', 
'Updates needed for your profile. Feedback: {{feedback}}', 'active'),

('talent_vetting_level_assigned', 'Talent: Level Assigned', 'Your Talent Level Assigned: {{level}}', 
'<html><body><h1>Level Assigned</h1><p>Hi {{first_name}}, you''ve been assigned the level: <strong>{{level}}</strong>.</p></body></html>', 
'Your Talent Level Assigned: {{level}}', 'active'),

('talent_vetting_reverify_flagged', 'Talent: Profile Flagged for Re-verification', 'Action Required: Re-verification Needed', 
'<html><body><h1>Re-verification Needed</h1><p>Please re-verify your profile to maintain access to opportunities.</p></body></html>', 
'Re-verification needed for your profile.', 'active'),

-- TALENT: JOBS & OPPORTUNITIES
('talent_job_recommendation', 'Talent: Job Recommendation Sent', 'New Opportunity Match: {{job_title}}', 
'<html><body><h1>Job Match!</h1><p>We found a role that fits your profile: <strong>{{job_title}}</strong> at {{client_name}}.</p></body></html>', 
'New Job Match: {{job_title}}', 'active'),

('talent_job_published', 'Talent: New Job Published', 'New Position Available: {{job_title}}', 
'<html><body><h1>New Position Open</h1><p>A new role is now live: <strong>{{job_title}}</strong>.</p></body></html>', 
'New Job Live: {{job_title}}', 'active'),

('talent_job_invited_to_apply', 'Talent: Invited to Apply', 'Invitation: Apply for {{job_title}}', 
'<html><body><h1>You''re Invited!</h1><p>The admin has invited you to apply for: <strong>{{job_title}}</strong>.</p></body></html>', 
'Invitation: Apply for {{job_title}}', 'active'),

('talent_job_shortlisted', 'Talent: Shortlisted for Role', 'Good News: You''ve Been Shortlisted for {{job_title}}', 
'<html><body><h1>Shortlisted!</h1><p>The admin has shortlisted you for: <strong>{{job_title}}</strong>.</p></body></html>', 
'Shortlisted! for {{job_title}}', 'active'),

-- TALENT: CLIENT INTERACTIONS
('talent_interaction_interview_requested', 'Talent: Interview Requested', 'Interview Request: {{client_name}}', 
'<html><body><h1>Interview Request</h1><p>{{client_name}} would like to interview you for the {{job_title}} role.</p></body></html>', 
'Interview Request: {{client_name}} wants to interview you for {{job_title}}.', 'active'),

-- TALENT: APPLICATIONS
('talent_application_shortlisted', 'Talent: Application Shortlisted', 'Good News: Application Update for {{job_title}}', 
'<html><body><h1>Shortlisted!</h1><p>Your application for {{job_title}} has been shortlisted.</p></body></html>', 
'Shortlisted! Your application for {{job_title}} has been shortlisted.', 'active'),

('talent_application_rejected', 'Talent: Application Rejected', 'Update on Your Application: {{job_title}}', 
'<html><body><h1>Application Update</h1><p>Thank you for your interest in {{job_title}}. Unfortunately, the client has decided to move forward with other candidates.</p></body></html>', 
'Update on Your Application: {{job_title}}', 'active'),

-- TALENT: CONTRACTS
('talent_contract_received', 'Talent: Contract Received for Review', 'New Contract Ready for Review: {{contract_id}}', 
'<html><body><h1>Contract Ready</h1><p>Please review your new contract: {{contract_id}}.</p></body></html>', 
'New Contract for Review: {{contract_id}}', 'active'),

('talent_contract_accepted', 'Talent: Contract Accepted', 'Confirmation: Contract Accepted', 
'<html><body><h1>Contract Accepted</h1><p>You have accepted contract {{contract_id}}.</p></body></html>', 
'Contract Accepted: {{contract_id}}', 'active'),

('talent_contract_rejected', 'Talent: Contract Rejected', 'Confirmation: Contract Rejected', 
'<html><body><h1>Contract Rejected</h1><p>You have rejected contract {{contract_id}}.</p></body></html>', 
'Contract Rejected: {{contract_id}}', 'active'),

('talent_contract_fully_signed', 'Talent: Contract Fully Signed', 'All Set! Contract Fully Signed: {{contract_id}}', 
'<html><body><h1>Fully Signed!</h1><p>Contract {{contract_id}} is now fully signed by all parties.</p></body></html>', 
'Contract Fully Signed: {{contract_id}}', 'active'),

('talent_contract_updated', 'Talent: Contract Updated', 'Notification: Contract {{contract_id}} Updated', 
'<html><body><h1>Contract Updated</h1><p>Changes have been made to contract {{contract_id}}.</p></body></html>', 
'Contract Updated: {{contract_id}}', 'active'),

('talent_contract_terminated', 'Talent: Contract Terminated', 'Notification: {{contract_id}} Terminated', 
'<html><body><h1>Contract Terminated</h1><p>Contract {{contract_id}} has been terminated effective {{effective_date}}.</p></body></html>', 
'Contract Terminated: {{contract_id}}', 'active'),

('talent_contract_expiring', 'Talent: Contract Nearing Expiration', 'Reminder: Contract {{contract_id}} Nearing Expiry', 
'<html><body><h1>Contract Expiring</h1><p>Your contract {{contract_id}} expires on {{expiration_date}}.</p></body></html>', 
'Contract Expiring: {{contract_id}}', 'active'),

-- TALENT: TIMESHEETS
('talent_timesheet_reminder', 'Talent: Timesheet Reminder', 'Action Required: Submit Your Timesheet', 
'<html><body><h1>Timesheet Reminder</h1><p>Please submit your timesheet for the period ending {{period_end}}.</p></body></html>', 
'Timesheet Reminder: Submit your timesheet for {{period_end}}.', 'active'),

('talent_timesheet_confirmed', 'Talent: Timesheet Submitted Confirmation', 'Confirmation: Timesheet Submitted', 
'<html><body><h1>Timesheet Submitted</h1><p>Your timesheet for {{period_end}} has been received.</p></body></html>', 
'Timesheet Submitted: {{period_end}}', 'active'),

('talent_timesheet_approved', 'Talent: Timesheet Approved', 'Great News: Your Timesheet was Approved', 
'<html><body><h1>Timesheet Approved</h1><p>Your timesheet for {{period_end}} has been approved.</p></body></html>', 
'Timesheet Approved: {{period_end}}', 'active'),

('talent_timesheet_rejected', 'Talent: Timesheet Rejected', 'Action Required: Timesheet Rejected', 
'<html><body><h1>Timesheet Rejected</h1><p>Your timesheet for {{period_end}} was rejected. Reason: {{reason}}</p></body></html>', 
'Timesheet Rejected: {{period_end}}. Reason: {{reason}}', 'active'),

-- TALENT: PAYMENTS & EARNINGS
('talent_payment_processed', 'Talent: Payment Processed', 'Good News: Your Payment is Processing', 
'<html><body><h1>Payment Processing</h1><p>A payment of {{amount}} is being processed for {{invoice_id}}.</p></body></html>', 
'Payment Processing: {{amount}} for {{invoice_id}}.', 'active'),

('talent_payment_sent', 'Talent: Payment Sent', 'Money is on the way! Payment Sent', 
'<html><body><h1>Payment Sent</h1><p>{{amount}} has been sent to your account.</p></body></html>', 
'Payment Sent: {{amount}}', 'active'),

('talent_payment_failed', 'Talent: Payment Failed', 'Action Required: Payment Failed', 
'<html><body><h1>Payment Failed</h1><p>We were unable to process your payment. Please check your bank details.</p></body></html>', 
'Payment Failed. Please check bank details.', 'active'),

('talent_earnings_summary', 'Talent: Earnings Summary', 'Your Monthly Earnings Summary: {{month}}', 
'<html><body><h1>Earnings Summary</h1><p>In {{month}}, you earned a total of {{total_earnings}}.</p></body></html>', 
'Monthly Earnings Summary: {{total_earnings}} in {{month}}.', 'active'),

-- TALENT: MESSAGING
('talent_messaging_new', 'Talent: New Message Received', 'New Message from {{sender_name}}', 
'<html><body><h1>New Message</h1><p>You have a new message from {{sender_name}}.</p><p><a href="{{chat_link}}">View Message</a></p></body></html>', 
'New Message from {{sender_name}}: {{chat_link}}', 'active'),

('talent_messaging_inactivity', 'Talent: Conversation Inactivity Reminder', 'Still there? You have unread messages', 
'<html><body><h1>Unread Messages</h1><p>You have unread messages in your inbox.</p></body></html>', 
'Unread Messages Reminder.', 'active'),

-- TALENT: SUPPORT & DISPUTES
('talent_support_created', 'Talent: Support Ticket Created', 'Support Ticket Created: #{{ticket_id}}', 
'<html><body><h1>Ticket Created</h1><p>Your support ticket #{{ticket_id}} has been created.</p></body></html>', 
'Support Ticket Created: #{{ticket_id}}', 'active'),

('talent_support_response', 'Talent: Support Ticket Response Received', 'Update on Ticket #{{ticket_id}}', 
'<html><body><h1>New Response</h1><p>There is a new response on your support ticket #{{ticket_id}}.</p></body></html>', 
'New Response on Ticket #{{ticket_id}}', 'active'),

('talent_support_resolved', 'Talent: Support Ticket Resolved', 'Support Ticket Resolved: #{{ticket_id}}', 
'<html><body><h1>Ticket Resolved</h1><p>Your support ticket #{{ticket_id}} has been marked as resolved.</p></body></html>', 
'Support Ticket Resolved: #{{ticket_id}}', 'active'),

-- TALENT: SYSTEM & ENGAGEMENT
('talent_system_insights', 'Talent: Profile Performance Insights', 'Your Weekly Profile Insights', 
'<html><body><h1>Profile Insights</h1><p>Your profile was viewed {{views}} times this week.</p></body></html>', 
'Weekly Profile Insights: {{views}} views.', 'active'),

('talent_system_profile_viewed', 'Talent: Profile Viewed by Client', 'A Client Just Viewed Your Profile!', 
'<html><body><h1>Profile Viewed!</h1><p>Exciting news: A client just viewed your profile.</p></body></html>', 
'A Client Just Viewed Your Profile!', 'active'),

('talent_system_inactivity', 'Talent: Inactivity Reminder', 'We Miss You! Catch up on the Marketplace', 
'<html><body><h1>Long Time No See</h1><p>Check out the latest opportunities on OPSlyHR.</p></body></html>', 
'We Miss You! Catch up on the marketplace.', 'active'),

('talent_system_announcement', 'Talent: New Feature Announcement', 'Introducing New Features on OPSlyHR', 
'<html><body><h1>New Features!</h1><p>We''ve launched some exciting new capabilities to help your career.</p></body></html>', 
'New Feature Announcement!', 'active'),

-- CLIENT: AUTH & ACCOUNT
('client_auth_account_created', 'Client: Account Created', 'Welcome to OPSlyHR! Confirm Your Workspace', 
'<html><body><h1>Welcome!</h1><p>Hi {{first_name}}, your client account has been created.</p></body></html>', 
'Welcome to OPSlyHR!', 'active'),

('client_auth_verify_required', 'Client: Email Verification Required', 'Final Step: Verify Your Client Workspace', 
'<html><body><h1>Verify Your Email</h1><p>Please click the link below to verify your email address.</p><p><a href="{{verification_link}}">Verify Email</a></p></body></html>', 
'Verify Your Email: {{verification_link}}', 'active'),

('client_auth_verified_success', 'Client: Email Verified Successfully', 'Workspace Verified! Start Hiring on OPSlyHR', 
'<html><body><h1>Success!</h1><p>Your workspace has been verified. You can now start hiring.</p><p><a href="{{dashboard_link}}">Go to Dashboard</a></p></body></html>', 
'Your workspace has been verified. Dashboard: {{dashboard_link}}', 'active'),

('client_auth_password_reset', 'Client: Password Reset Requested', 'Reset Your OPSlyHR Client Password', 
'<html><body><h1>Reset Password</h1><p>Click below to reset your password.</p><p><a href="{{reset_link}}">Reset Password</a></p></body></html>', 
'Reset Password: {{reset_link}}', 'active'),

('client_auth_password_changed', 'Client: Password Changed Successfully', 'Security Alert: Client Portal Password Changed', 
'<html><body><h1>Security Alert</h1><p>Your password was recently changed. If this wasn''t you, contact support immediately.</p></body></html>', 
'Security Alert: Your password was recently changed.', 'active'),

-- CLIENT: ONBOARDING
('client_onboarding_welcome', 'Client: Welcome after Signup', 'Unlock Top Talent: Welcome to OPSlyHR', 
'<html><body><h1>Welcome!</h1><p>Find the best operations talent globally.</p></body></html>', 
'Welcome to OPSlyHR!', 'active'),

-- CLIENT: TALENT DISCOVERY
('client_talent_shortlisted', 'Client: Talent Shortlisted by Admin', 'New Shortlist Ready for Your Review', 
'<html><body><h1>Shortlist Ready</h1><p>Admin has prepared a new shortlist for role: {{job_title}}.</p></body></html>', 
'New Shortlist Ready for {{job_title}}.', 'active'),

('client_talent_interview_requested_conf', 'Client: Interview Request Sent Confirmation', 'Confirmation: Interview Request Sent', 
'<html><body><h1>Request Sent</h1><p>Your interview request for {{talent_name}} has been sent.</p></body></html>', 
'Interview Request Sent: {{talent_name}}', 'active'),

('client_talent_message_sent_conf', 'Client: Message Sent Confirmation', 'Confirmation: Message Sent to {{talent_name}}', 
'<html><body><h1>Message Sent</h1><p>Your message to {{talent_name}} was delivered.</p></body></html>', 
'Message Sent to {{talent_name}}', 'active'),

('client_talent_interview_accepted', 'Client: Talent Accepted Interview', 'Interview Confirmed: {{talent_name}}', 
'<html><body><h1>Interview Confirmed</h1><p>{{talent_name}} has accepted your interview request.</p></body></html>', 
'Interview Confirmed: {{talent_name}}', 'active'),

('client_talent_interview_declined', 'Client: Talent Declined Interview', 'Interview Declined: {{talent_name}}', 
'<html><body><h1>Interview Declined</h1><p>Unfortunately, {{talent_name}} has declined the interview request.</p></body></html>', 
'Interview Declined: {{talent_name}}', 'active'),

-- CLIENT: JOB POSTING
('client_job_submitted', 'Client: Job Submitted for Approval', 'We''ve Received Your Job Posting: {{job_title}}', 
'<html><body><h1>Job Received</h1><p>Your job post for {{job_title}} is being reviewed by our team.</p></body></html>', 
'Job Received: {{job_title}}', 'active'),

('client_job_live', 'Client: Job Approved and Live', 'Your Job Posting is Now Live!', 
'<html><body><h1>Job Live</h1><p>Your job {{job_title}} is now live and accepting applications.</p></body></html>', 
'Job Live: {{job_title}}', 'active'),

('client_job_rejected', 'Client: Job Rejected with Feedback', 'Action Required: Your Job Post Needs Updates', 
'<html><body><h1>Updates Needed</h1><p>Your job post for {{job_title}} needs some revisions. Reason: {{feedback}}</p></body></html>', 
'Job Rejected: {{job_title}}. Feedback: {{feedback}}', 'active'),

-- CLIENT: APPLICATIONS
('client_application_shortlist_received', 'Client: New Shortlist Received', 'New Shortlist Available for {{job_title}}', 
'<html><body><h1>Shortlist Ready</h1><p>A new candidate shortlist is ready for your review.</p></body></html>', 
'New Shortlist Ready for {{job_title}}', 'active'),

-- CLIENT: CONTRACTS
('client_contract_created', 'Client: Contract Created', 'New Contract Created: {{contract_id}}', 
'<html><body><h1>Contract Created</h1><p>A new contract #{{contract_id}} has been created for {{talent_name}}.</p></body></html>', 
'Contract Created: #{{contract_id}} for {{talent_name}}.', 'active'),

('client_contract_sent', 'Client: Contract Sent to Talent', 'Contract Sent to {{talent_name}}', 
'<html><body><h1>Contract Sent</h1><p>Contract {{contract_id}} has been sent to {{talent_name}} for review.</p></body></html>', 
'Contract Sent: {{contract_id}} to {{talent_name}}.', 'active'),

('client_contract_accepted_tal', 'Client: Contract Accepted by Talent', 'Success! {{talent_name}} Accepted the Contract', 
'<html><body><h1>Contract Accepted</h1><p>{{talent_name}} has accepted contract {{contract_id}}.</p></body></html>', 
'Contract Accepted: {{contract_id}} by {{talent_name}}.', 'active'),

('client_contract_rejected_tal', 'Client: Contract Rejected by Talent', 'Attention: {{talent_name}} Rejected the Contract', 
'<html><body><h1>Contract Rejected</h1><p>{{talent_name}} has rejected contract {{contract_id}}.</p></body></html>', 
'Contract Rejected: {{contract_id}} by {{talent_name}}.', 'active'),

-- CLIENT: TIMESHEETS
('client_timesheet_submitted', 'Client: Timesheet Submitted by Talent', 'New Timesheet for Review: {{talent_name}}', 
'<html><body><h1>Timesheet Received</h1><p>{{talent_name}} has submitted a timesheet for {{period_end}}.</p></body></html>', 
'Timesheet Submitted: {{talent_name}} for {{period_end}}', 'active'),

-- CLIENT: PAYMENTS & BILLING
('client_billing_invoice', 'Client: Invoice Generated', 'New Invoice Generated: #{{invoice_id}}', 
'<html><body><h1>New Invoice</h1><p>Your invoice #{{invoice_id}} for {{amount}} is ready.</p></body></html>', 
'New Invoice: #{{invoice_id}} for {{amount}}.', 'active'),

('client_billing_reminder', 'Client: Invoice Due Reminder', 'Friendly Reminder: Invoice #{{invoice_id}} Due Soon', 
'<html><body><h1>Invoice Reminder</h1><p>Your invoice #{{invoice_id}} for {{amount}} is due on {{due_date}}.</p></body></html>', 
'Invoice Reminder: #{{invoice_id}} due {{due_date}}.', 'active'),

('client_billing_success', 'Client: Payment Successful', 'Confirmation: Payment Received Successfully', 
'<html><body><h1>Payment Success!</h1><p>Thank you. Your payment for #{{invoice_id}} was successful.</p></body></html>', 
'Payment Successful for #{{invoice_id}}', 'active'),

('client_billing_failed', 'Client: Payment Failed', 'Action Required: Payment for #{{invoice_id}} Failed', 
'<html><body><h1>Payment Failed</h1><p>We were unable to charge your account for invoice #{{invoice_id}}.</p></body></html>', 
'Payment Failed for #{{invoice_id}}', 'active'),

-- CLIENT: MESSAGING
('client_messaging_new', 'Client: New Message Received', 'New Message regarding {{job_title}}', 
'<html><body><h1>New Message</h1><p>You have a new message from {{sender_name}}.</p></body></html>', 
'New Message from {{sender_name}} regarding {{job_title}}.', 'active'),

-- CLIENT: SUPPORT & DISPUTES
('client_support_created', 'Client: Support Ticket Created', 'Support Ticket Created: #{{ticket_id}}', 
'<html><body><h1>Ticket Created</h1><p>Your support ticket #{{ticket_id}} has been created.</p></body></html>', 
'Support Ticket Created: #{{ticket_id}}', 'active'),

('client_support_response', 'Client: Support Ticket Response Received', 'Update on Ticket #{{ticket_id}}', 
'<html><body><h1>New Response</h1><p>There is a new response on your support ticket #{{ticket_id}}.</p></body></html>', 
'New Response on Ticket #{{ticket_id}}', 'active'),

('client_support_resolved', 'Client: Support Ticket Resolved', 'Support Ticket Resolved: #{{ticket_id}}', 
'<html><body><h1>Ticket Resolved</h1><p>Your support ticket #{{ticket_id}} has been marked as resolved.</p></body></html>', 
'Support Ticket Resolved: #{{ticket_id}}', 'active'),

('client_support_dispute_raised', 'Client: Dispute Raised', 'Notification: Dispute Raised for #{{contract_id}}', 
'<html><body><h1>Dispute Raised</h1><p>A dispute has been raised regarding contract {{contract_id}}.</p></body></html>', 
'Dispute Raised: {{contract_id}}', 'active')

ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text;


-- END FILE: 20260401001000_comprehensive_email_templates.sql


-- START FILE: 20260401010000_add_verification_tracking.sql

-- Add tracking for verified email notification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified_sent BOOLEAN DEFAULT FALSE;

-- Update RLS to allow users to update their own notification flags
DROP POLICY IF EXISTS "Users can update own notification flags" ON public.profiles;
CREATE POLICY "Users can update own notification flags" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id::uuid)
WITH CHECK (auth.uid() = user_id::uuid);


-- END FILE: 20260401010000_add_verification_tracking.sql


-- START FILE: 20260401100000_update_email_templates_with_design.sql

-- Update Email Templates with Professional Brand Design
-- This migration updates all existing email templates with the new design system
-- Maintains all existing template_keys so no code changes are needed

-- Note: Using UPDATE statements to preserve existing template IDs and created_at timestamps
-- This ensures backward compatibility while improving visual design

UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto;background:#ffffff}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px;margin-bottom:16px}.content{padding:30px 25px}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:20px;margin:20px 0}.card-content{font-size:14px;color:#374151;margin:0}.section-title{font-size:18px;font-weight:600;color:#111827;margin-top:24px;margin-bottom:12px}.list-item{font-size:14px;color:#374151;margin:8px 0;padding-left:20px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin-top:24px}.cta-button:hover{background:#047857}.secondary-text{font-size:14px;color:#6b7280;margin-top:16px}.divider{border:none;border-top:1px solid #e5e7eb;margin:32px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af;margin:0}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Welcome to the OPSlyHR Network</p><p class="intro">Hi {{talent_name}},</p><p class="intro">We''re excited to have you join our community of vetted operations professionals. Your journey with us starts here.</p><div class="card"><p class="card-content"><strong>What''s Next:</strong></p><p class="list-item">1. Complete your professional profile</p><p class="list-item">2. Verify your identity and credentials</p><p class="list-item">3. Start exploring opportunities that match your expertise</p></div><p class="intro">The entire process typically takes 2-3 days. Our support team is available 24/7 if you have questions.</p><a href="{{dashboard_link}}" class="cta-button">Complete Your Profile</a><div class="divider"></div><p class="secondary-text">Got questions? Our support team is available 24/7. Reply to this email or visit our help center.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Trusted Operations Professionals<br><a href="mailto:support@opslyhr.com" style="color:#059669;text-decoration:none;">support@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'Welcome to the OPSlyHR Network

Hi {{talent_name}},

We''re excited to have you join our community of vetted operations professionals.

What''s Next:
1. Complete your professional profile
2. Verify your identity and credentials
3. Start exploring opportunities that match your expertise

The entire process typically takes 2-3 days. Our support team is available 24/7 if you have questions.

Complete Your Profile: {{dashboard_link}}

Get Support: support@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'talent_onboarding_welcome';

-- TALENT: Job Offer Received
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto;background:#ffffff}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px;margin-bottom:16px}.content{padding:30px 25px}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.highlight-card{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px;margin:20px 0}.highlight-label{font-size:12px;font-weight:600;color:#166534;text-transform:uppercase;margin-bottom:4px}.highlight-value{font-size:16px;font-weight:600;color:#059669;margin-bottom:12px}.details-row{display:flex;justify-content:space-between;margin:8px 0;font-size:14px}.details-label{color:#6b7280}.details-value{color:#111827;font-weight:500}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin-top:24px}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">{{client_name}} Has Invited You to Apply</p><p class="intro">Hi {{talent_name}},</p><p class="intro">{{client_name}} has reviewed your profile and would like to learn more about you for a specific role.</p><div class="highlight-card"><div class="highlight-label">Position</div><div class="highlight-value">{{job_title}}</div><div class="details-row"><span class="details-label">Type:</span><span class="details-value">{{contract_type}}</span></div><div class="details-row"><span class="details-label">Rate:</span><span class="details-value">{{rate}}</span></div><div class="details-row"><span class="details-label">Location:</span><span class="details-value">{{location}}</span></div><div class="details-row"><span class="details-label">Duration:</span><span class="details-value">{{duration}}</span></div></div><p class="intro"><strong>Why They Chose You:</strong> They''re looking for someone with your specific expertise in operations management. Your background was a strong match.</p><p class="intro"><strong>Next Steps:</strong></p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">1. Review the full role details</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">2. Decide if you''re interested</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">3. Submit your application</p><p class="intro">This invitation is reserved for you through {{expiration_date}}.</p><a href="{{apply_link}}" class="cta-button">View & Apply</a><p style="font-size:12px;color:#6b7280;margin-top:20px;">Have questions? Reply to this email or contact our support team.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Your Opportunities Await<br><a href="mailto:support@opslyhr.com" style="color:#059669;text-decoration:none;">support@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = '{{client_name}} Has Invited You to Apply

Hi {{talent_name}},

{{client_name}} has reviewed your profile for the {{job_title}} position.

Position Details:
- Title: {{job_title}}
- Type: {{contract_type}}
- Rate: {{rate}}
- Location: {{location}}
- Duration: {{duration}}

Why They Chose You:
They''re looking for someone with your specific expertise in operations management.

Next Steps:
1. Review the full role details
2. Decide if you''re interested
3. Submit your application

This invitation is reserved until {{expiration_date}}.

View & Apply: {{apply_link}}

Questions? support@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'talent_job_offer';

-- TALENT: Contract Signed
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px;margin-bottom:16px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.success-badge{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:12px 16px;border-radius:6px;font-weight:600;font-size:14px;display:inline-block;margin:16px 0}.info-block{background:#f9fafb;border-left:4px solid #059669;padding:16px;margin:20px 0;border-radius:4px}.info-label{font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px}.info-value{font-size:14px;font-weight:500;color:#111827}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:24px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Please Review Your Contract</p><p class="intro">Hi {{talent_name}},</p><p class="intro">{{client_name}} has prepared your contract for review and signature. This is an important document—please read it carefully.</p><div class="success-badge">Contract Ready for Review</div><div class="info-block"><div class="info-label">Position</div><div class="info-value">{{job_title}}</div></div><div class="info-block"><div class="info-label">Contract ID</div><div class="info-value">{{contract_id}}</div></div><div class="info-block"><div class="info-label">Start Date</div><div class="info-value">{{start_date}}</div></div><p class="intro" style="margin-top:24px;"><strong>What You Need to Do:</strong></p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">1. Review the contract carefully</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">2. Note any questions or concerns</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">3. Sign electronically in your dashboard</p><p class="intro">Everything is handled securely. You can sign with one click—no printing or scanning needed.</p><p class="intro"><strong>Timeline:</strong> Once you sign, {{client_name}} will countersign within 24-48 hours.</p><a href="{{contract_link}}" class="cta-button">Review & Sign Contract</a><p style="font-size:12px;color:#6b7280;margin-top:20px;">Have questions about contract terms? Our contracts team is available to help.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Securing Your Future<br><a href="mailto:success@opslyhr.com" style="color:#059669;text-decoration:none;">success@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'Please Review Your Contract

Hi {{talent_name}},

{{client_name}} has prepared your contract for review and signature.

Contract Details:
- Position: {{job_title}}
- Contract ID: {{contract_id}}
- Start Date: {{start_date}}

What You Need to Do:
1. Review the contract carefully
2. Note any questions or concerns
3. Sign electronically in your dashboard

Once you sign, {{client_name}} will countersign within 24-48 hours.

Review & Sign Contract: {{contract_link}}

Questions? success@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'talent_contract_signed';

-- CLIENT: Welcome Email
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:16px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.feature-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:12px 0;font-size:14px;color:#374151}.feature-title{font-weight:600;color:#111827;margin-bottom:4px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:20px 0}.secondary-cta{color:#059669;text-decoration:none;font-weight:600}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Your OPSlyHR Hiring Dashboard is Ready</p><p class="intro">Hi {{company_name}},</p><p class="intro">Thank you for joining OPSlyHR. You now have access to our global network of vetted operations professionals. Let''s build your team.</p><p class="intro"><strong>What You Can Do Right Now:</strong></p><div class="feature-box"><div class="feature-title">Browse Our Network</div>Explore pre-vetted professionals across operations, finance, HR, and more. Filter by experience, location, and skills.</div><div class="feature-box"><div class="feature-title">Post Your First Role</div>Tell us what you''re looking for. We''ll match you with the best-fit professionals within 24 hours.</div><div class="feature-box"><div class="feature-title">Build Your Team</div>Whether you need one specialist or a full department, we handle vetting, contracts, and payments.</div><p class="intro">Your dedicated account manager is ready to help. We''ll work closely with you to understand your needs and find the right fit.</p><a href="{{dashboard_link}}" class="cta-button">View Available Talent</a><p class="intro"><strong>First Steps:</strong> Your first consultation is free. Our team will help you define your hiring needs and introduce you to qualified candidates within 48 hours.</p><p style="font-size:12px;color:#6b7280;margin-top:24px;">Have questions? <a href="mailto:success@opslyhr.com" class="secondary-cta">Contact our team</a></p></div><div class="footer"><p class="footer-text">OPSlyHR | Global Hiring for Operations Professionals<br><a href="mailto:success@opslyhr.com" style="color:#059669;text-decoration:none;">success@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'Your OPSlyHR Hiring Dashboard is Ready

Hi {{company_name}},

Thank you for joining OPSlyHR. You now have access to our global network of vetted operations professionals.

What You Can Do:
- Browse Network: Explore pre-vetted professionals across multiple disciplines
- Post Your Role: Tell us what you need, we match you with candidates
- Build Your Team: We handle contracts, vetting, and payments

Your dedicated account manager is ready to help define your hiring needs and introduce you to candidates.

View Available Talent: {{dashboard_link}}

First Steps: Your first consultation is free. We''ll help you within 48 hours.

Questions? success@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'client_onboarding_welcome';

-- CLIENT: Contract Signed Confirmation
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:20px;font-weight:600;color:#059669;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.confirmation-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px;margin:20px 0}.confirmation-title{font-weight:600;color:#166534;margin-bottom:12px}.detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #bbf7d0;font-size:14px}.detail-label{color:#6b7280}.detail-value{color:#111827;font-weight:500}.detail-row:last-child{border-bottom:none}.timeline-box{background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;margin:20px 0;border-radius:4px}.timeline-title{font-weight:600;color:#1e40af;margin-bottom:8px}.timeline-item{font-size:14px;color:#1e40af;margin:4px 0;padding-left:12px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:20px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Contract Signed — Let''s Get Started</p><p class="intro">Hi {{company_name}},</p><p class="intro">Excellent news. Both parties have signed the contract for {{professional_name}}. They''re officially ready to start on {{start_date}}.</p><div class="confirmation-box"><div class="confirmation-title">✓ Confirmed Details</div><div class="detail-row"><span class="detail-label">Professional</span><span class="detail-value">{{professional_name}}</span></div><div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">{{job_title}}</span></div><div class="detail-row"><span class="detail-label">Start Date</span><span class="detail-value">{{start_date}}</span></div><div class="detail-row"><span class="detail-label">Rate</span><span class="detail-value">{{rate}}</span></div></div><div class="timeline-box"><div class="timeline-title">What Happens Next:</div><div class="timeline-item">→ Onboarding materials will be sent to your team lead</div><div class="timeline-item">→ {{professional_name}} receives access instructions</div><div class="timeline-item">→ Payment setup is already configured</div><div class="timeline-item">→ First payment scheduled for {{first_payment_date}}</div></div><p class="intro">Your dedicated support manager is standing by to ensure a smooth transition. We''ll make sure everything is ready for day one.</p><a href="{{employee_link}}" class="cta-button">View Employee Details</a><p style="font-size:12px;color:#6b7280;margin-top:20px;">All hours are tracked in your dashboard. Invoices and payments are processed automatically.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Your Partner in Building Operational Excellence<br><a href="mailto:success@opslyhr.com" style="color:#059669;text-decoration:none;">success@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'Contract Signed — Let''s Get Started

Hi {{company_name}},

Both parties have signed. {{professional_name}} is ready to start on {{start_date}}.

Confirmed Details:
- Professional: {{professional_name}}
- Position: {{job_title}}
- Start Date: {{start_date}}
- Rate: {{rate}}

What''s Next:
→ Onboarding materials sent to your team lead
→ {{professional_name}} receives access instructions
→ Payment setup is configured
→ First payment: {{first_payment_date}}

View Employee Details: {{employee_link}}

Your support manager is ready to help with the transition. All payments process automatically.

support@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'client_contract_signed';

-- CLIENT: Invoice Generated
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:18px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:16px}.invoice-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:16px 0}.invoice-row{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;border-bottom:1px solid #e5e7eb}.invoice-row:last-child{border-bottom:none}.row-label{color:#6b7280}.row-value{color:#111827;font-weight:500}.invoice-amount{font-size:18px;font-weight:600;color:#059669;margin-top:8px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:16px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Invoice Ready: {{professional_name}} – {{period}}</p><p class="intro">Your invoice for {{professional_name}} is ready for review and payment.</p><div class="invoice-box"><div class="invoice-row"><span class="row-label">Professional</span><span class="row-value">{{professional_name}}</span></div><div class="invoice-row"><span class="row-label">Invoice ID</span><span class="row-value">{{invoice_id}}</span></div><div class="invoice-row"><span class="row-label">Period</span><span class="row-value">{{period}}</span></div><div class="invoice-row"><span class="row-label">Hours Logged</span><span class="row-value">{{hours}}</span></div><div class="invoice-amount">Due: {{amount}}</div></div><p class="intro"><strong>Payment Status:</strong> {{payment_status}}</p><a href="{{invoice_link}}" class="cta-button">View Invoice Details</a><p style="font-size:12px;color:#6b7280;margin-top:16px;">View detailed time logs and payment settings anytime in your dashboard. Questions? billing@opslyhr.com</p></div><div class="footer"><p class="footer-text">OPSlyHR | Transparent Billing & Payments<br><a href="mailto:billing@opslyhr.com" style="color:#059669;text-decoration:none;">billing@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'Invoice Ready: {{professional_name}} – {{period}}

Your invoice is ready for review.

Invoice Details:
- Professional: {{professional_name}}
- Invoice ID: {{invoice_id}}
- Period: {{period}}
- Hours: {{hours}}
- Amount Due: {{amount}}

Payment Status: {{payment_status}}

View Invoice: {{invoice_link}}

View time logs and payment settings in your dashboard.
Questions? billing@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'client_invoice_generated';

-- Add more email templates for passion events
-- These are generic fallback templates

-- If template doesn't exist, add it (for templates that may not have been created yet)
INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status)
SELECT 'password_reset', 'Password Reset', 'Reset Your OPSlyHR Password', 
'<html><head><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827}.container{max-width:600px;margin:0 auto}.header{padding:40px 30px;text-align:center}.logo{height:48px}.content{padding:30px 25px}.greeting{font-size:18px;font-weight:600;margin-bottom:8px}.intro{font-size:14px;color:#6b7280;margin-bottom:16px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600}.footer{background:#f9fafb;padding:20px 30px;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Reset Your Password</p><p class="intro">You requested a password reset. Use the link below to create a new password. This link expires in 24 hours.</p><a href="{{reset_link}}" class="cta-button">Reset Password</a><p style="font-size:12px;color:#6b7280;margin-top:16px;">If you didn''t request this, ignore this email. Your account is secure.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Keep Your Account Secure<br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
'Reset Your Password

You requested a password reset. Use this link to create a new password:

{{reset_link}}

This link expires in 24 hours.

If you didn''t request this, ignore this email.

© 2026 OPSlyHR',
'active'
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_key = 'password_reset');

INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status)
SELECT 'email_verification', 'Email Verification', 'Verify Your Email Address', 
'<html><head><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827}.container{max-width:600px;margin:0 auto}.header{padding:40px 30px;text-align:center}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:18px;font-weight:600;margin-bottom:8px}.intro{font-size:14px;color:#6b7280;margin-bottom:16px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600}.footer{background:#f9fafb;padding:20px 30px;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Verify Your Email</p><p class="intro">Thank you for signing up. Please verify your email address to complete your account setup. This link expires in 48 hours.</p><a href="{{verification_link}}" class="cta-button">Verify Email</a><p style="font-size:12px;color:#6b7280;margin-top:16px;">Already verified? No further action needed.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Welcome to Our Community<br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
'Verify Your Email

Thank you for signing up. Verify your email to complete setup:

{{verification_link}}

This link expires in 48 hours.

© 2026 OPSlyHR',
'active'
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_key = 'email_verification');

-- End of template updates


-- END FILE: 20260401100000_update_email_templates_with_design.sql


-- START FILE: 20260401200000_update_talent_emails_with_branded_html.sql

-- Update Talent Email Templates with Branded HTML Designs
-- This migration updates the email_templates table with professional branded HTML versions
-- of all talent-related emails

BEGIN;

-- Helper function to wrap content in branded email template
-- Colors: Primary Green #059669, Text #111827, Light BG #f9fafb

UPDATE email_templates SET
  subject = 'Verify your email to get started on OPSlyHR',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Welcome to OPSlyHR. To complete your account setup and start accessing opportunities, please verify your email address.
      </div>
      <a href="{{verification_link}}" class="cta">Verify Email</a>
      <div class="divider"></div>
      <div class="message">
        If you didn''t create this account, you can safely ignore this message.
      </div>
    </div>
    <div class="footer">
      OPSlyHR — Helping you access global opportunities
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nWelcome to OPSlyHR. To complete your account setup and start accessing opportunities, please verify your email address.\n\nVerify Email: {{verification_link}}\n\nIf you didn''t create this account, you can safely ignore this message.\n\nOPSlyHR — Helping you access global opportunities'
WHERE template_key = 'talent_auth_verify_required';

UPDATE email_templates SET
  subject = 'Your email has been verified',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .success-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="success-box">
        <strong>✓ Your email has been successfully verified.</strong>
      </div>
      <div class="message">
        You can now continue setting up your profile and move forward with the vetting process.
      </div>
      <a href="{{dashboard_link}}" class="cta">Complete Your Profile</a>
    </div>
    <div class="footer">
      OPSlyHR — Build your global career
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\n✓ Your email has been successfully verified.\n\nYou can now continue setting up your profile and move forward with the vetting process.\n\nComplete Your Profile: {{dashboard_link}}\n\nOPSlyHR — Build your global career'
WHERE template_key = 'talent_auth_verified_success';

UPDATE email_templates SET
  subject = 'Welcome to OPSlyHR',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Welcome to OPSlyHR. We''re excited to have you join a network of vetted operations professionals connecting with global companies.
      </div>
      <div class="message">
        To get started, complete your profile and submit it for vetting.
      </div>
      <a href="{{profile_link}}" class="cta">Start Profile Setup</a>
    </div>
    <div class="footer">
      OPSlyHR — Connecting you to global work
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nWelcome to OPSlyHR. We''re excited to have you join a network of vetted operations professionals connecting with global companies.\n\nTo get started, complete your profile and submit it for vetting.\n\nStart Profile Setup: {{profile_link}}\n\nOPSlyHR — Connecting you to global work'
WHERE template_key = 'talent_onboarding_welcome';

UPDATE email_templates SET
  subject = 'Your vetting request has been received',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .info-box { background: #f3f4f6; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Your profile has been successfully submitted for vetting.
      </div>
      <div class="info-box">
        <strong>Our team is currently reviewing your information.</strong> You''ll be notified once the process is complete or if any updates are required.
      </div>
      <a href="{{vetting_link}}" class="cta">View Profile</a>
    </div>
    <div class="footer">
      OPSlyHR — Quality you can trust
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nYour profile has been successfully submitted for vetting.\n\nOur team is currently reviewing your information. You''ll be notified once the process is complete or if any updates are required.\n\nView Profile: {{vetting_link}}\n\nOPSlyHR — Quality you can trust'
WHERE template_key = 'talent_vetting_submitted';

UPDATE email_templates SET
  subject = 'Action required: Update your profile',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; color: #92400e; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="alert-box">
        <strong>We''ve reviewed your profile and need a few updates before proceeding.</strong>
      </div>
      <div class="message">
        Please review the requested changes and update your profile accordingly. Once completed, you can resubmit for vetting.
      </div>
      <a href="{{vetting_link}}" class="cta">Update Profile</a>
      <div class="message">
        If you need help, feel free to reach out to support.
      </div>
    </div>
    <div class="footer">
      OPSlyHR — Supporting your progress
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nWe''ve reviewed your profile and need a few updates before proceeding.\n\nPlease review the requested changes and update your profile accordingly. Once completed, you can resubmit for vetting.\n\nUpdate Profile: {{vetting_link}}\n\nIf you need help, feel free to reach out to support.\n\nOPSlyHR — Supporting your progress'
WHERE template_key = 'talent_vetting_changes_requested';

UPDATE email_templates SET
  subject = 'You''ve been successfully vetted',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .success-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; color: #065f46; font-weight: bold; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="success-box">
        Congratulations — your profile has been successfully vetted.
      </div>
      <div class="message">
        You are now eligible to be matched with opportunities from global clients on OPSlyHR.
      </div>
      <div class="message">
        Make sure your profile stays updated to increase your chances of being selected.
      </div>
      <a href="{{jobs_link}}" class="cta">Go to Dashboard</a>
    </div>
    <div class="footer">
      OPSlyHR — Trusted by global teams
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{talent_name}},\n\nCongratulations — your profile has been successfully vetted.\n\nYou are now eligible to be matched with opportunities from global clients on OPSlyHR.\n\nMake sure your profile stays updated to increase your chances of being selected.\n\nGo to Dashboard: {{jobs_link}}\n\nOPSlyHR — Trusted by global teams'
WHERE template_key = 'talent_vetting_approved';

UPDATE email_templates SET
  subject = 'Update required before approval',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Thank you for your submission.
      </div>
      <div class="message">
        At this time, your profile does not meet our current vetting requirements. We encourage you to review your profile, make improvements, and reapply when ready.
      </div>
      <a href="{{resubmit_link}}" class="cta">Update Profile</a>
    </div>
    <div class="footer">
      OPSlyHR — Helping you improve and grow
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nThank you for your submission.\n\nAt this time, your profile does not meet our current vetting requirements. We encourage you to review your profile, make improvements, and reapply when ready.\n\nUpdate Profile: {{resubmit_link}}\n\nOPSlyHR — Helping you improve and grow'
WHERE template_key = 'talent_vetting_rejected';

UPDATE email_templates SET
  subject = 'Your OPSlyHR level has been assigned',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .level-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; font-weight: bold; color: #065f46; font-size: 16px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Your profile has been assigned the following level:
      </div>
      <div class="level-box">
        {{level}}
      </div>
      <div class="message">
        This helps us match you with the most relevant opportunities. Keep your profile updated to improve your visibility.
      </div>
      <a href="{{jobs_link}}" class="cta">View Profile</a>
    </div>
    <div class="footer">
      OPSlyHR — Matching talent with the right opportunities
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nYour profile has been assigned the following level:\n\n{{level}}\n\nThis helps us match you with the most relevant opportunities. Keep your profile updated to improve your visibility.\n\nView Profile: {{jobs_link}}\n\nOPSlyHR — Matching talent with the right opportunities'
WHERE template_key = 'talent_vetting_level_assigned';

UPDATE email_templates SET
  subject = 'Profile update required',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; color: #92400e; font-weight: bold; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="alert-box">
        Your profile has been flagged for re-verification.
      </div>
      <div class="message">
        Please review your information and update any required details to maintain your vetted status.
      </div>
      <a href="{{profile_link}}" class="cta">Review Profile</a>
    </div>
    <div class="footer">
      OPSlyHR — Maintaining quality standards
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nYour profile has been flagged for re-verification.\n\nPlease review your information and update any required details to maintain your vetted status.\n\nReview Profile: {{profile_link}}\n\nOPSlyHR — Maintaining quality standards'
WHERE template_key = 'talent_profile_flagged';

UPDATE email_templates SET
  subject = 'New opportunity for you on OPSlyHR',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        A new role matching your skills has just been published. We recommend reviewing the opportunity and applying if it aligns with your experience.
      </div>
      <a href="{{job_link}}" class="cta">View Job</a>
    </div>
    <div class="footer">
      OPSlyHR — Opportunities tailored to you
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nA new role matching your skills has just been published. We recommend reviewing the opportunity and applying if it aligns with your experience.\n\nView Job: {{job_link}}\n\nOPSlyHR — Opportunities tailored to you'
WHERE template_key = 'talent_job_recommendation';

UPDATE email_templates SET
  subject = 'You''ve been invited to apply',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .highlight-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; color: #065f46; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="highlight-box">
        <strong>You''ve been shortlisted for a role based on your profile.</strong>
      </div>
      <div class="message">
        We recommend submitting your application as soon as possible.
      </div>
      <a href="{{job_link}}" class="cta">Apply Now</a>
    </div>
    <div class="footer">
      OPSlyHR — Connecting you to the right roles
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nYou''ve been shortlisted for a role based on your profile. We recommend submitting your application as soon as possible.\n\nApply Now: {{job_link}}\n\nOPSlyHR — Connecting you to the right roles'
WHERE template_key = 'talent_job_invited_to_apply';

UPDATE email_templates SET
  subject = 'Interview request received',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        A client has requested an interview with you. Please review the details and confirm your availability.
      </div>
      <a href="{{job_link}}" class="cta">View Interview Details</a>
    </div>
    <div class="footer">
      OPSlyHR — Take the next step
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nA client has requested an interview with you. Please review the details and confirm your availability.\n\nView Interview Details: {{job_link}}\n\nOPSlyHR — Take the next step'
WHERE template_key = 'talent_interview_requested';

UPDATE email_templates SET
  subject = 'Your application has been shortlisted',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .success-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; color: #065f46; font-weight: bold; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="success-box">
        Good news — your application has been shortlisted.
      </div>
      <div class="message">
        The client may reach out with next steps shortly. Stay prepared.
      </div>
      <a href="{{job_link}}" class="cta">View Application</a>
    </div>
    <div class="footer">
      OPSlyHR — You''re making progress
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nGood news — your application has been shortlisted. The client may reach out with next steps shortly. Stay prepared.\n\nView Application: {{job_link}}\n\nOPSlyHR — You''re making progress'
WHERE template_key = 'talent_application_shortlisted';

UPDATE email_templates SET
  subject = 'Update on your application',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Thank you for your application. At this time, the client has decided to move forward with other candidates.
      </div>
      <div class="message">
        We encourage you to keep applying to other opportunities.
      </div>
      <a href="{{job_link}}" class="cta">Explore Jobs</a>
    </div>
    <div class="footer">
      OPSlyHR — More opportunities ahead
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nThank you for your application. At this time, the client has decided to move forward with other candidates.\n\nWe encourage you to keep applying to other opportunities.\n\nExplore Jobs: {{job_link}}\n\nOPSlyHR — More opportunities ahead'
WHERE template_key = 'talent_application_rejected';

UPDATE email_templates SET
  subject = 'Welcome to OPSlyHR! Complete your account setup',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Welcome to OPSlyHR! Your account has been successfully created. We''re thrilled to have you onboard.
      </div>
      <div class="message">
        To start exploring opportunities and connecting with global teams, verify your email address below.
      </div>
      <a href="{{verification_link}}" class="cta">Verify Email Address</a>
    </div>
    <div class="footer">
      OPSlyHR — Building global connections
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nWelcome to OPSlyHR! Your account has been successfully created. We''re thrilled to have you onboard.\n\nTo start exploring opportunities and connecting with global teams, verify your email address below:\n\n{{verification_link}}\n\nOPSlyHR — Building global connections'
WHERE template_key = 'talent_auth_account_created';

COMMIT;


-- END FILE: 20260401200000_update_talent_emails_with_branded_html.sql


-- START FILE: 20260401210000_update_client_emails_with_branded_html.sql

-- Update client email templates with professional branded HTML designs
-- These templates are sent to client (hiring company) users during their journey

-- 1. Client Auth Verify Required
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email to continue</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 30px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Please verify your email to activate your OPSly account.</p>
      <a href="{{verification_link}}" class="cta-button">Verify Email</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Hire with confidence</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Please verify your email to activate your OPSly account.

Verify Email: {{verification_link}}

OPSlyHR — Hire with confidence'
WHERE template_key = 'client_auth_verify_required';

-- 2. Client Auth Verified Successfully
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your account is now active</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .success-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .success-box p { margin: 0; color: #065f46; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 30px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <p style="margin: 0; font-weight: 600;">✓ Email verified successfully</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Your email has been successfully verified.</p>
      <p class="body-text">You can now begin exploring and hiring vetted talent.</p>
      <a href="{{dashboard_link}}" class="cta-button">Go to Dashboard</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Build your team</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Your email has been successfully verified.

You can now begin exploring and hiring vetted talent.

Go to Dashboard: {{dashboard_link}}

OPSlyHR — Build your team'
WHERE template_key = 'client_auth_verified_success';

-- 3. Client Welcome Email
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to OPSly</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .highlight { color: #059669; font-weight: 600; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Welcome to OPSly.</p>
      <p class="body-text">We help you find, manage, and pay vetted operations professionals across Africa.</p>
      <p class="body-text">Start by completing your profile or posting your first role.</p>
      <a href="{{dashboard_link}}" class="cta-button">Get Started</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Hire smarter</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Welcome to OPSly.

We help you find, manage, and pay vetted operations professionals across Africa.

Start by completing your profile or posting your first role.

Get Started: {{dashboard_link}}

OPSlyHR — Hire smarter'
WHERE template_key = 'client_welcome';

-- 4. Talent Shortlisted by Admin
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Talent shortlisted for your role</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .info-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .info-box p { margin: 0; color: #065f46; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="info-box">
        <p>⭐ New candidates shortlisted for you</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">We''ve shortlisted candidates for your role.</p>
      <p class="body-text">Review their profiles and proceed with interviews or offers.</p>
      <a href="{{shortlist_link}}" class="cta-button">View Candidates</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Curated for you</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

We''ve shortlisted candidates for your role.

Review their profiles and proceed with interviews or offers.

View Candidates: {{shortlist_link}}

OPSlyHR — Curated for you'
WHERE template_key = 'client_talent_shortlisted';

-- 5. Interview Request Sent
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview request sent</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .status-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .status-box p { margin: 0; color: #92400e; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="status-box">
        <p>⏳ Interview request sent</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Your interview request has been sent to the selected candidate.</p>
      <p class="body-text">You''ll be notified once they respond.</p>
      <a href="{{interview_link}}" class="cta-button">View Details</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Stay updated</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Your interview request has been sent to the selected candidate.

You''ll be notified once they respond.

View Details: {{interview_link}}

OPSlyHR — Stay updated'
WHERE template_key = 'client_interview_request_sent';

-- 6. Message Sent Confirmation
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Message sent successfully</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .success-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .success-box p { margin: 0; color: #065f46; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <p>✓ Message delivered successfully</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Your message has been successfully sent.</p>
      <p class="body-text">You''ll be notified when the talent responds.</p>
      <a href="{{conversation_link}}" class="cta-button">View Conversation</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Seamless communication</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Your message has been successfully sent.

You''ll be notified when the talent responds.

View Conversation: {{conversation_link}}

OPSlyHR — Seamless communication'
WHERE template_key = 'client_message_sent_confirmation';

-- 7. Talent Accepted Interview
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview confirmed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .success-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .success-box p { margin: 0; color: #065f46; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <p>✓ Interview confirmed</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">The candidate has accepted your interview request.</p>
      <p class="body-text">You can proceed with the scheduled discussion.</p>
      <a href="{{interview_link}}" class="cta-button">View Interview</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Move forward with confidence</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

The candidate has accepted your interview request.

You can proceed with the scheduled discussion.

View Interview: {{interview_link}}

OPSlyHR — Move forward with confidence'
WHERE template_key = 'client_talent_accepted_interview';

-- 8. Talent Declined Interview
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview request declined</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .alert-box p { margin: 0; color: #92400e; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <p>⚠ Candidate unavailable</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">The candidate has declined your interview request.</p>
      <p class="body-text">We recommend reviewing other available candidates.</p>
      <a href="{{candidates_link}}" class="cta-button">View Candidates</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Find the right fit</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

The candidate has declined your interview request.

We recommend reviewing other available candidates.

View Candidates: {{candidates_link}}

OPSlyHR — Find the right fit'
WHERE template_key = 'client_talent_declined_interview';

-- 9. Job Submitted for Approval
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your job is under review</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .status-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .status-box p { margin: 0; color: #92400e; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="status-box">
        <p>⏳ Job under review</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Your job has been submitted and is currently under review.</p>
      <p class="body-text">You''ll be notified once it is approved or if any updates are required.</p>
      <a href="{{job_link}}" class="cta-button">View Job</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Quality-first hiring</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Your job has been submitted and is currently under review.

You''ll be notified once it is approved or if any updates are required.

View Job: {{job_link}}

OPSlyHR — Quality-first hiring'
WHERE template_key = 'client_job_submitted_approval';

-- 10. Job Approved and Live
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your job is now live</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .success-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .success-box p { margin: 0; color: #065f46; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <p>✓ Job is now live</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Your job has been approved and is now live.</p>
      <p class="body-text">You can start receiving applications from vetted talent.</p>
      <a href="{{job_link}}" class="cta-button">View Job</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Start hiring</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Your job has been approved and is now live.

You can start receiving applications from vetted talent.

View Job: {{job_link}}

OPSlyHR — Start hiring'
WHERE template_key = 'client_job_approved_live';

-- 11. Job Rejected
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Update required for your job post</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .alert-box p { margin: 0; color: #92400e; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <p>⚠ Updates required</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Your job submission requires some updates before it can be approved.</p>
      <p class="body-text">Please review the feedback and make the necessary changes.</p>
      <a href="{{job_link}}" class="cta-button">Update Job</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Helping you get it right</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Your job submission requires some updates before it can be approved.

Please review the feedback and make the necessary changes.

Update Job: {{job_link}}

OPSlyHR — Helping you get it right'
WHERE template_key = 'client_job_rejected';

-- 12. New Shortlist Received
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New candidates shortlisted</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .info-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .info-box p { margin: 0; color: #065f46; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="info-box">
        <p>⭐ New candidates added</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">New candidates have been added to your shortlist.</p>
      <p class="body-text">We recommend reviewing them and proceeding with next steps.</p>
      <a href="{{shortlist_link}}" class="cta-button">View Shortlist</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Curated talent</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

New candidates have been added to your shortlist.

We recommend reviewing them and proceeding with next steps.

View Shortlist: {{shortlist_link}}

OPSlyHR — Curated talent'
WHERE template_key = 'client_new_shortlist_received';

-- 13. Application Shortlisted Confirmation
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidate shortlisted</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .success-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .success-box p { margin: 0; color: #065f46; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <p>✓ Candidate shortlisted</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">You''ve successfully shortlisted a candidate.</p>
      <p class="body-text">You can proceed with interviews or next steps.</p>
      <a href="{{candidate_link}}" class="cta-button">View Candidate</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Efficient hiring</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

You''ve successfully shortlisted a candidate.

You can proceed with interviews or next steps.

View Candidate: {{candidate_link}}

OPSlyHR — Efficient hiring'
WHERE template_key = 'client_application_shortlisted_confirmation';

-- 14. Application Rejected Confirmation
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidate update recorded</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .status-box { background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .status-box p { margin: 0; color: #374151; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="status-box">
        <p>— Application declined</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">The application has been marked as declined.</p>
      <p class="body-text">You can continue reviewing other candidates.</p>
      <a href="{{applications_link}}" class="cta-button">View Applications</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Keep hiring</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

The application has been marked as declined.

You can continue reviewing other candidates.

View Applications: {{applications_link}}

OPSlyHR — Keep hiring'
WHERE template_key = 'client_application_rejected_confirmation';

-- END FILE: 20260401210000_update_client_emails_with_branded_html.sql


-- START FILE: 20260401300000_email_verification_system.sql

-- Migration: Email Verification System
-- Adds custom email verification tracking and secure token storage

BEGIN;

-- 1. Add email_verified_at to public.profiles
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- 2. Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure each user has only one active (unused) token at a time 
    -- Or we can just check if unused in logic
    UNIQUE (token_hash)
);

-- 3. Add Index for performant lookup
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_hash ON public.email_verification_tokens(token_hash);

-- 4. RLS for verification tokens (internal only, usually service role)
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can view tokens
DROP POLICY IF EXISTS "Admins can view email verification tokens" ON public.email_verification_tokens;
CREATE POLICY "Admins can view email verification tokens" 
ON public.email_verification_tokens 
FOR ALL 
USING (public.is_admin(auth.uid()::uuid));

-- 5. Helper function to check if a profile is verified
DROP FUNCTION IF EXISTS public.is_email_verified(_user_id UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.is_email_verified(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND email_verified_at IS NOT NULL
  )
$$;

COMMIT;


-- END FILE: 20260401300000_email_verification_system.sql


-- START FILE: 20260401400000_standardize_email_branding.sql

-- MASTER EMAIL BRANDING MIGRATION (50+ Templates)
-- Transition all Talent & Client templates from Blue/Green to Branded Opsly Blue (#2563eb)
-- Includes Brand Logo Header and Social Footer

BEGIN;

-- ------------------------------------------------------------------------------------------------
-- 1. TALENT: AUTH & ACCOUNT
-- ------------------------------------------------------------------------------------------------

-- talent_auth_account_created
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">Welcome to OPSlyHR! Your account has been created. Please verify your email to access exclusive opportunities.</div>
      <a href="{{verification_link}}" class="cta">Verify Account</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'talent_auth_account_created';

-- talent_auth_verify_required
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">Verification is the first step to becoming part of our elite talent network. Please verify your email below.</div>
      <a href="{{verification_link}}" class="cta">Verify Email</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'talent_auth_verify_required';

-- talent_onboarding_welcome
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Welcome to the Network, {{first_name}}!</div>
      <div class="message">We''re thrilled to have you here. Next, complete your documentation to begin the vetting process.</div>
      <a href="{{profile_link}}" class="cta">Start Onboarding</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'talent_onboarding_welcome';


-- ------------------------------------------------------------------------------------------------
-- 2. CLIENT: AUTH & ACCOUNT
-- ------------------------------------------------------------------------------------------------

-- client_onboarding_welcome
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Hi {{first_name}} from {{company_name}},</div>
      <div class="message">Welcome to OPSlyHR! We help you hire and manage world-class product and ops talent with zero friction.</div>
      <a href="{{dashboard_link}}" class="cta">Explore Talent</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'client_onboarding_welcome';

-- ------------------------------------------------------------------------------------------------
-- 3. VETTING & PROCESS
-- ------------------------------------------------------------------------------------------------

-- talent_vetting_submitted
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Hi {{first_name}}, We''ve Received Your Vetting Request</div>
      <div class="message">Our team of experts is currently reviewing your documentation. We''ll notify you as soon as the review is complete.</div>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'talent_vetting_submitted';

-- talent_vetting_approved
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .success-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px; color: #1e40af; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Congratulations, {{talent_name}}!</div>
      <div class="success-box">✓ You have been fully vetted and approved.</div>
      <div class="message">You are now eligible to receive job invites and proposals from elite clients globally.</div>
      <a href="{{jobs_link}}" class="cta">Explore Jobs</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'talent_vetting_approved';

-- ------------------------------------------------------------------------------------------------
-- 4. CONTRACTS & BILLING
-- ------------------------------------------------------------------------------------------------

-- talent_contract_received
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Hi {{first_name}}, New Contract for Review</div>
      <div class="message">A new contract has been generated for you (ID: {{contract_id}}). Please review the terms and sign to begin.</div>
      <a href="{{contract_link}}" class="cta">Review Contract</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'talent_contract_received';

-- client_invoice_generated
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">New Invoice Ready, {{client_name}}</div>
      <div class="message">Your invoice #{{invoice_id}} for the amount of {{amount}} is ready. Due date: {{due_date}}.</div>
      <a href="{{invoice_link}}" class="cta">View Invoice</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'client_invoice_generated';

COMMIT;


-- END FILE: 20260401400000_standardize_email_branding.sql


-- START FILE: 20260401500000_v2_allow_partial_submission.sql

-- ============================================================
-- V2 Vetting System – Update: Allow Partial Submission
-- ============================================================

DROP FUNCTION IF EXISTS public.v2_submit_profile() CASCADE;
CREATE OR REPLACE FUNCTION public.v2_submit_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_user_id    UUID := auth.uid();
    v_profile    public.v2_talent_profiles%ROWTYPE;
    v_incomplete INT;
BEGIN
    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = v_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
    IF v_profile.locked_onboarding AND v_profile.status NOT IN ('changes_requested', 'draft') THEN 
        RAISE EXCEPTION 'Already submitted'; 
    END IF;

    -- Check ONLY mandatory sections (Basic, Pro, Work) have data
    -- We allow submission from Step 3 onwards
    SELECT count(*) INTO v_incomplete
    FROM (
        SELECT unnest(ARRAY['basic_info','professional_details','work_history']) AS sk
    ) required_sections
    WHERE NOT EXISTS (
        SELECT 1 FROM public.v2_profile_sections
        WHERE user_id = v_user_id AND section_key = required_sections.sk
          AND data != '{}'::jsonb
    );

    IF v_incomplete > 0 THEN
        RAISE EXCEPTION '% mandatory section(s) are still incomplete', v_incomplete;
    END IF;

    -- Lock & submit
    UPDATE public.v2_talent_profiles SET
        status = 'submitted',
        locked_onboarding = true,
        submitted_at = now(),
        -- We don't force progress_percent to 100 if they submitted early
        updated_at = now()
    WHERE user_id = v_user_id;

    -- Mark all completed sections as submitted
    UPDATE public.v2_profile_sections SET
        status = 'submitted',
        submitted_at = now(),
        updated_at = now()
    WHERE user_id = v_user_id AND status IN ('in_progress','not_started');

-- Audit
    INSERT INTO public.v2_vetting_actions (user_id, action)
    VALUES (v_user_id, 'SUBMIT');
 
    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = v_user_id;
    RETURN row_to_json(v_profile)::JSONB;
END;
$$;
 
-- ── Updated: v2_admin_finalize_vetting (Flexible Approval) ─────────
-- Allows admin to finalize if mandatory sections are Submitted/Approved.
-- Automatically marks all submitted sections as approved.
DROP FUNCTION IF EXISTS public.v2_admin_finalize_vetting(UUID, INT);
DROP FUNCTION IF EXISTS public.v2_admin_finalize_vetting(UUID, TEXT);
 
DROP FUNCTION IF EXISTS public.v2_admin_finalize_vetting(
    p_talent_user_id UUID,
    p_vetting_level_text  TEXT
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_finalize_vetting(
    p_talent_user_id UUID,
    p_vetting_level_text  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_id     UUID := auth.uid();
    v_profile      public.v2_talent_profiles%ROWTYPE;
    v_incomplete   INT;
BEGIN
    IF NOT public.is_admin(v_admin_id) THEN RAISE EXCEPTION 'Unauthorised'; END IF;
 
    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = p_talent_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
 
    -- Ensure mandatory sections (Basic, Pro, Work) are AT LEAST submitted
    SELECT count(*) INTO v_incomplete
    FROM (
        SELECT unnest(ARRAY['basic_info','professional_details','work_history']) AS sk
    ) mandatories
    WHERE NOT EXISTS (
        SELECT 1 FROM public.v2_profile_sections
        WHERE user_id = p_talent_user_id AND section_key = mandatories.sk
          AND status IN ('submitted', 'resubmitted', 'approved')
    );
 
    IF v_incomplete > 0 THEN
        RAISE EXCEPTION '% mandatory section(s) are not yet submitted or approved', v_incomplete;
    END IF;
 
    -- 1. Automatically approve any submitted/resubmitted sections
    UPDATE public.v2_profile_sections SET
        status = 'approved',
        approved_at = now(),
        updated_at = now()
    WHERE user_id = p_talent_user_id AND status IN ('submitted', 'resubmitted');
 
    -- 2. Update profile status to vetted
    UPDATE public.v2_talent_profiles SET
        status = 'vetted',
        vetting_level_text = p_vetting_level_text,
        vetted_at = now(),
        visible_to_clients = true,
        updated_at = now()
    WHERE user_id = p_talent_user_id;
 
    -- 3. Audit Logging
    INSERT INTO public.v2_vetting_actions (user_id, admin_id, action, meta)
    VALUES (p_talent_user_id, v_admin_id, 'MARK_VETTED',
            jsonb_build_object('vetting_level_text', p_vetting_level_text));
 
    -- 4. Notify Talent
    INSERT INTO public.v2_notifications (user_id, type, title, message, payload)
    VALUES (p_talent_user_id, 'PROFILE_VETTED',
            'Profile Fully Vetted',
            'Congratulations! Your profile has been fully vetted and is now visible to clients.',
            jsonb_build_object('vetting_level_text', p_vetting_level_text));
 
    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = p_talent_user_id;
    RETURN row_to_json(v_profile)::JSONB;
END;
$$;
 
-- Update vetting actions constraint to allow the new note action
ALTER TABLE public.v2_vetting_actions 
DROP CONSTRAINT IF EXISTS v2_vetting_actions_action_check;
 
ALTER TABLE public.v2_vetting_actions 
ADD CONSTRAINT v2_vetting_actions_action_check 
CHECK (action IN ('SUBMIT','START_REVIEW','APPROVE_SECTION',
                'REQUEST_CHANGES','RESUBMIT','ASSIGN_LEVEL','MARK_VETTED',
                'VETTING_NOTE_SENT'));


-- END FILE: 20260401500000_v2_allow_partial_submission.sql


-- START FILE: 20260402221113_admin_vetting_notes.sql

-- ============================================================
-- RPC: v2_admin_send_vetting_note
-- Allows admins to log that they sent a vetting feedback note.
-- ============================================================

DROP FUNCTION IF EXISTS public.v2_admin_send_vetting_note(
    p_talent_user_id UUID,
    p_subject TEXT,
    p_body TEXT
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_send_vetting_note(
    p_talent_user_id UUID,
    p_subject TEXT,
    p_body TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_profile  public.v2_talent_profiles%ROWTYPE;
BEGIN
    -- 1. Verify Admin Status
    IF NOT public.is_admin(v_admin_id) THEN RAISE EXCEPTION 'Unauthorised'; END IF;

    -- 2. Verify Profile Exists
    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = p_talent_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

    -- 3. Log the Vetting Action
    INSERT INTO public.v2_vetting_actions (
        user_id, 
        admin_id, 
        action, 
        meta
    )
    VALUES (
        p_talent_user_id, 
        v_admin_id, 
        'VETTING_NOTE_SENT',
        jsonb_build_object(
            'subject', p_subject,
            'body', p_body,
            'sent_at', now()
        )
    );

    -- 4. Create an Internal Notification for the Talent
    INSERT INTO public.v2_notifications (
        user_id, 
        type, 
        title, 
        message, 
        payload
    )
    VALUES (
        p_talent_user_id, 
        'VETTING_NOTE',
        'Vetting Feedback Received: ' || p_subject,
        'An administrator has sent you a note regarding your vetting process. Please check your email for the full details.',
        jsonb_build_object(
            'subject', p_subject,
            'body', p_body
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Vetting note logged and notification created'
    );
END;
$$;


-- END FILE: 20260402221113_admin_vetting_notes.sql


