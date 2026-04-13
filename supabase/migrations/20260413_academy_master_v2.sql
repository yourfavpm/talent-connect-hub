-- ============================================================
-- ACADEMY HUB - CONSOLIDATED MASTER MIGRATION (V2)
-- ============================================================

-- ── 1. EXTENSIONS & ENUMS ─────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_net; -- Required for webhooks

-- Safely add 'student' role to app_role enum
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';
    END IF;
END $$;

-- Enrollment Status Enum
DO $$ BEGIN
    CREATE TYPE enum_enrollment_status AS ENUM (
        'pending_payment',
        'active',
        'completed',
        'cancelled',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ── 2. CORE TABLES ──────────────────────────────────────────

-- System settings for orchestration
CREATE TABLE IF NOT EXISTS public.settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    value text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Academy Courses (Merged with rich metadata)
CREATE TABLE IF NOT EXISTS public.academy_courses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    tagline text,
    description text,
    price_usd numeric DEFAULT 0,
    price_naira numeric DEFAULT 0,
    duration text,
    level text,
    outcome text,
    is_live boolean DEFAULT false,
    image_url text,
    learning_outcomes jsonb DEFAULT '[]',
    curriculum jsonb DEFAULT '[]',
    tools jsonb DEFAULT '[]',
    what_youll_learn jsonb DEFAULT '[]',
    who_is_it_for jsonb DEFAULT '[]',
    bonus_description text,
    slots_total integer DEFAULT 25,
    slots_filled integer DEFAULT 0,
    next_cohort_date text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Academy Cohorts
CREATE TABLE IF NOT EXISTS public.cohorts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id uuid REFERENCES public.academy_courses(id) ON DELETE CASCADE,
    name text NOT NULL,
    start_date date NOT NULL,
    status text DEFAULT 'open', -- open, full, completed, cancelled
    created_at timestamp with time zone DEFAULT now()
);

-- Enrollment Records
CREATE TABLE IF NOT EXISTS public.academy_enrollments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id text, -- slug reference for legacy sync
    course_name text,
    cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL,
    enrollment_status enum_enrollment_status DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now()
);

-- Live Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
    title text NOT NULL,
    session_date date NOT NULL,
    start_time text NOT NULL,
    meeting_url text,
    recording_url text,
    status text DEFAULT 'scheduled', -- scheduled, live, completed
    created_at timestamp with time zone DEFAULT now()
);

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    deadline_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Submissions & Grading
CREATE TABLE IF NOT EXISTS public.submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    link text NOT NULL,
    status text DEFAULT 'submitted', -- submitted, reviewed
    feedback text,
    grade text,
    created_at timestamp with time zone DEFAULT now()
);

-- Automated Certificates
CREATE TABLE IF NOT EXISTS public.academy_certificates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    enrollment_id uuid REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
    student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id text,
    cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
    certificate_number text UNIQUE,
    issued_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'
);

-- ── 3. RLS & POLICIES ─────────────────────────────────────────

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;

-- Anonymous/Authenticated Read Access
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public read access for academy courses" ON public.academy_courses;
    CREATE POLICY "Public read access for academy courses" ON public.academy_courses FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Anyone can see cohorts" ON public.cohorts;
    CREATE POLICY "Anyone can see cohorts" ON public.cohorts FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Anyone can see sessions" ON public.sessions;
    CREATE POLICY "Anyone can see sessions" ON public.sessions FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Anyone can see announcements" ON public.announcements;
    CREATE POLICY "Anyone can see announcements" ON public.announcements FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.academy_enrollments;
    CREATE POLICY "Students can view their own enrollments" ON public.academy_enrollments FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
    CREATE POLICY "Students can view their own submissions" ON public.submissions FOR SELECT USING (auth.uid() = student_id);
    
    DROP POLICY IF EXISTS "Students can view their own certificates" ON public.academy_certificates;
    CREATE POLICY "Students can view their own certificates" ON public.academy_certificates FOR SELECT USING (auth.uid() = student_id);
END $$;

-- Admin Management
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can manage courses" ON public.academy_courses;
    CREATE POLICY "Admins can manage courses" ON public.academy_courses FOR ALL USING (public.is_admin());

    DROP POLICY IF EXISTS "Admins can manage cohorts" ON public.cohorts;
    CREATE POLICY "Admins can manage cohorts" ON public.cohorts FOR ALL USING (public.is_admin());

    DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.academy_enrollments;
    CREATE POLICY "Admins can manage enrollments" ON public.academy_enrollments FOR ALL USING (public.is_admin());
END $$;

-- ── 4. WEBHOOK TRIGGERS ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.trigger_academy_event()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  event_type text;
  webhook_url text;
  webhook_key text;
BEGIN
  -- Get configuration from settings
  SELECT value INTO webhook_url FROM settings WHERE name = 'edge_function_url';
  SELECT value INTO webhook_key FROM settings WHERE name = 'service_role_key';
  
  IF webhook_url IS NULL OR webhook_key IS NULL THEN
    RETURN NEW; -- Skip if not configured
  END IF;

  -- Determine event type
  IF TG_TABLE_NAME = 'sessions' THEN
    event_type := 'session';
    SELECT jsonb_build_object(
      'cohort_id', NEW.cohort_id,
      'title', NEW.title,
      'date', NEW.session_date,
      'time', NEW.start_time,
      'url', NEW.meeting_url,
      'cohort_name', (SELECT name FROM cohorts WHERE id = NEW.cohort_id)
    ) INTO payload;
  ELSIF TG_TABLE_NAME = 'announcements' THEN
    event_type := 'announcement';
    SELECT jsonb_build_object(
      'cohort_id', NEW.cohort_id,
      'title', NEW.title,
      'content', NEW.content,
      'cohort_name', (SELECT name FROM cohorts WHERE id = NEW.cohort_id)
    ) INTO payload;
  END IF;

  -- Dispatch
  IF payload IS NOT NULL THEN
    PERFORM net.http_post(
        url := webhook_url || '/academy-events',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || webhook_key),
        body := jsonb_build_object('event_type', event_type, 'payload', payload)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (Triggers defined for sessions/announcements/etc)
DROP TRIGGER IF EXISTS tr_academy_session_notify ON public.sessions;
CREATE TRIGGER tr_academy_session_notify AFTER INSERT ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

DROP TRIGGER IF EXISTS tr_academy_announcement_notify ON public.announcements;
CREATE TRIGGER tr_academy_announcement_notify AFTER INSERT ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

-- ── 5. AUTOMATION & DEFAULTS ──────────────────────────────────

-- Certificate numbering logic
CREATE OR REPLACE FUNCTION public.generate_cert_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.certificate_number IS NULL THEN
        NEW.certificate_number := 'OPS-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8)) || '-' || TO_CHAR(NOW(), 'YYYY');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_cert_number ON public.academy_certificates;
CREATE TRIGGER tr_generate_cert_number BEFORE INSERT ON public.academy_certificates FOR EACH ROW EXECUTE FUNCTION public.generate_cert_number();

-- ── 6. SEED DATA (Optional Template) ──────────────────────────
INSERT INTO settings (name, value, description) 
VALUES 
('edge_function_url', 'YOUR_SUPABASE_PROJECT_URL/functions/v1', 'Base URL for Edge Functions'),
('service_role_key', 'YOUR_SERVICE_ROLE_KEY', 'Service role key for internal triggers')
ON CONFLICT (name) DO NOTHING;
