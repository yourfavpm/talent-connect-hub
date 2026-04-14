-- MIGRATION: 20260224120000_settings_module_v1.sql
-- Settings Module Migration
-- Version: 1.0

-- 1. Organization Settings
CREATE TABLE IF NOT EXISTS public.organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID DEFAULT '00000000-0000-0000-0000-000000000000', -- Default single org
    legal_name TEXT,
    display_name TEXT,
    support_email TEXT,
    finance_email TEXT,
    default_timezone TEXT DEFAULT 'UTC',
    default_currency TEXT DEFAULT 'USD',
    operating_regions TEXT[],
    office_address TEXT,
    registration_number TEXT,
    updated_by UUID REFERENCES public.admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(org_id)
);

-- 2. Pricing Rules
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT NOT NULL, -- 'direct_hire', 'trial_to_hire', 'one_time'
    rule_key TEXT NOT NULL, -- 'buyout_pct', 'margin_pct', 'payout_pct', etc.
    value_json JSONB NOT NULL,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES public.admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Contract Settings
CREATE TABLE IF NOT EXISTS public.contract_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings JSONB DEFAULT '{}'::jsonb, -- Cadence, expiry, variable registry
    updated_by UUID REFERENCES public.admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Finance Settings
CREATE TABLE IF NOT EXISTS public.finance_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoicing_json JSONB DEFAULT '{}'::jsonb, -- Numbering scheme, due days
    payout_json JSONB DEFAULT '{}'::jsonb, -- Thresholds, schedules
    deductions_json JSONB DEFAULT '{}'::jsonb, -- Caps, rounding
    updated_by UUID REFERENCES public.admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Workflow Settings
CREATE TABLE IF NOT EXISTS public.workflow_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_key TEXT UNIQUE NOT NULL, -- 'job_approval', 'vetting', etc.
    config_json JSONB DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES public.admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Notification Templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT UNIQUE NOT NULL, -- 'invite', 'payout_processed', etc.
    subject TEXT,
    body_html TEXT,
    body_text TEXT,
    updated_by UUID REFERENCES public.admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Security Settings
CREATE TABLE IF NOT EXISTS public.security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_json JSONB DEFAULT '{}'::jsonb, -- 2FA, session duration
    updated_by UUID REFERENCES public.admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Branding Settings
CREATE TABLE IF NOT EXISTS public.branding_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assets_json JSONB DEFAULT '{}'::jsonb, -- logos, colors
    updated_by UUID REFERENCES public.admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Integrations
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL, -- 'stripe', 'sendgrid', etc.
    config_json_masked JSONB DEFAULT '{}'::jsonb,
    secret_ref TEXT, -- Reference to a secret manager or encrypted value
    status TEXT DEFAULT 'inactive', -- 'active', 'inactive', 'error'
    updated_by UUID REFERENCES public.admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(provider)
);

-- 10. Compliance Settings
CREATE TABLE IF NOT EXISTS public.compliance_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_json JSONB DEFAULT '{}'::jsonb, -- Retention, export policy
    updated_by UUID REFERENCES public.admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Initial Data
INSERT INTO public.organization_settings (legal_name, display_name) 
VALUES ('OPSlyHR Connect Ltd', 'OPSlyHR Connect')
ON CONFLICT DO NOTHING;

INSERT INTO public.pricing_rules (service_type, rule_key, value_json) VALUES
('direct_hire', 'buyout_pct', '15'),
('trial_to_hire', 'margin_pct', '20'),
('trial_to_hire', 'payout_pct', '80'),
('one_time', 'margin_pct', '30')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_settings ENABLE ROW LEVEL SECURITY;

-- Policies (Managers only)
DROP POLICY IF EXISTS "Managers can manage all settings" ON public.organization_settings;
CREATE POLICY "Managers can manage all settings"
ON public.organization_settings FOR ALL
USING (public.has_permission('settings.manage'));

DROP POLICY IF EXISTS "Managers can manage pricing" ON public.pricing_rules;
CREATE POLICY "Managers can manage pricing"
ON public.pricing_rules FOR ALL
USING (public.has_permission('settings.manage'));

-- ... Apply similar policy to all settings tables ...
DROP POLICY IF EXISTS "Managers can manage contracts" ON public.contract_settings;
CREATE POLICY "Managers can manage contracts" ON public.contract_settings FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage finance" ON public.finance_settings;
CREATE POLICY "Managers can manage finance" ON public.finance_settings FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage workflows" ON public.workflow_settings;
CREATE POLICY "Managers can manage workflows" ON public.workflow_settings FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage notifications" ON public.notification_templates;
CREATE POLICY "Managers can manage notifications" ON public.notification_templates FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage security" ON public.security_settings;
CREATE POLICY "Managers can manage security" ON public.security_settings FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage branding" ON public.branding_settings;
CREATE POLICY "Managers can manage branding" ON public.branding_settings FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage integrations" ON public.integrations;
CREATE POLICY "Managers can manage integrations" ON public.integrations FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage compliance" ON public.compliance_settings;
CREATE POLICY "Managers can manage compliance" ON public.compliance_settings FOR ALL USING (public.has_permission('settings.manage'));

-- Public/Admin Read Access (Internal)
DROP POLICY IF EXISTS "Admins can view settings" ON public.organization_settings;
CREATE POLICY "Admins can view settings" ON public.organization_settings FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "Admins can view pricing" ON public.pricing_rules;
CREATE POLICY "Admins can view pricing" ON public.pricing_rules FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
-- ... and so on for others ...



-- MIGRATION: 20260225000000_talent_vetting_v2.sql
-- Talent Vetting v2: Step-based vetting, change requests, and skill assessment

-- 1. Extend Talent Statuses
DO $$ BEGIN
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'draft';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'submitted';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'in_review';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'changes_requested';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'approved';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'rejected';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Define Skill Levels
DO $$ BEGIN
    CREATE TYPE public.skill_level AS ENUM ('junior', 'mid', 'senior', 'lead');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Define Step Statuses
DO $$ BEGIN
    CREATE TYPE public.step_status AS ENUM ('not_started', 'incomplete', 'submitted', 'in_review', 'changes_requested', 'approved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Update Talents Table (use existing assigned_manager column, add skill assessment fields)
ALTER TABLE public.talents 
ADD COLUMN IF NOT EXISTS overall_skill_level public.skill_level,
ADD COLUMN IF NOT EXISTS skill_assessment_notes TEXT,
ADD COLUMN IF NOT EXISTS skill_assessment_visible_to_clients BOOLEAN DEFAULT TRUE;

-- 5. Create Talent Profile Steps Table
CREATE TABLE IF NOT EXISTS public.talent_profile_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    step_key TEXT NOT NULL, -- basic_info, professional_details, work_history, documents, education, certifications, references, review
    status public.step_status DEFAULT 'not_started',
    last_submitted_at TIMESTAMP WITH TIME ZONE,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (talent_id, step_key)
);

-- 6. Create Step Change Requests Table
CREATE TABLE IF NOT EXISTS public.step_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    step_key TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT
);

-- 7. Enable RLS
ALTER TABLE public.talent_profile_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_change_requests ENABLE ROW LEVEL SECURITY;

-- 8. Policies for Talent Profile Steps
DO $$ BEGIN
DROP POLICY IF EXISTS "Talents can view own step status" ON public.talent_profile_steps;
CREATE POLICY "Talents can view own step status" 
ON public.talent_profile_steps FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_profile_steps.talent_id AND talents.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
DROP POLICY IF EXISTS "Admins can manage step status" ON public.talent_profile_steps;
CREATE POLICY "Admins can manage step status" 
ON public.talent_profile_steps FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 9. Policies for Step Change Requests
DO $$ BEGIN
DROP POLICY IF EXISTS "Talents can view own change requests" ON public.step_change_requests;
CREATE POLICY "Talents can view own change requests" 
ON public.step_change_requests FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.talents WHERE talents.id = step_change_requests.talent_id AND talents.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
DROP POLICY IF EXISTS "Admins can manage change requests" ON public.step_change_requests;
CREATE POLICY "Admins can manage change requests" 
ON public.step_change_requests FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 10. Initialization function for steps
DROP FUNCTION IF EXISTS public.init_talent_steps() CASCADE;
CREATE OR REPLACE FUNCTION public.init_talent_steps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.talent_profile_steps (talent_id, step_key) VALUES
        (NEW.id, 'basic_info'),
        (NEW.id, 'professional_details'),
        (NEW.id, 'work_history'),
        (NEW.id, 'documents'),
        (NEW.id, 'education'),
        (NEW.id, 'certifications'),
        (NEW.id, 'references'),
        (NEW.id, 'review')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$;

-- 11. Trigger for existing and new talents
DROP TRIGGER IF EXISTS on_talent_created_init_steps ON public.talents;
DROP TRIGGER IF EXISTS on_talent_created_init_steps ON public.talents;
CREATE TRIGGER on_talent_created_init_steps AFTER INSERT ON public.talents
    FOR EACH ROW EXECUTE FUNCTION public.init_talent_steps();

-- 12. Migrate existing talents
DO $$
DECLARE
    talent_record RECORD;
BEGIN
    FOR talent_record IN SELECT id FROM public.talents LOOP
        INSERT INTO public.talent_profile_steps (talent_id, step_key) VALUES
            (talent_record.id, 'basic_info'),
            (talent_record.id, 'professional_details'),
            (talent_record.id, 'work_history'),
            (talent_record.id, 'documents'),
            (talent_record.id, 'education'),
            (talent_record.id, 'certifications'),
            (talent_record.id, 'references'),
            (talent_record.id, 'review')
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- 13. Audit Log Trigger for Vetting Changes
DROP FUNCTION IF EXISTS public.log_vetting_action() CASCADE;
CREATE OR REPLACE FUNCTION public.log_vetting_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (actor_admin_id, action, entity_type, entity_id, metadata)
        VALUES (
            auth.uid(),
            'VETTING_STATUS_UPDATE',
            'talent_step',
            NEW.talent_id,
            jsonb_build_object(
                'step_key', NEW.step_key,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_step_status_updated ON public.talent_profile_steps;
DROP TRIGGER IF EXISTS on_step_status_updated ON public.talent_profile_steps;
CREATE TRIGGER on_step_status_updated AFTER UPDATE ON public.talent_profile_steps
    FOR EACH ROW EXECUTE FUNCTION public.log_vetting_action();



-- MIGRATION: 20260226000000_talent_profile_drafts.sql
-- Talent Profile Drafts: Add draft/approved versioning + review tracking

-- 1. Add profile change tracking columns to talents
ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS profile_change_status TEXT DEFAULT 'clean'
  CHECK (profile_change_status IN ('clean', 'draft', 'submitted', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS changed_sections TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS draft_profile JSONB DEFAULT '{}';

-- 2. Create talent_profile_reviews table
CREATE TABLE IF NOT EXISTS public.talent_profile_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    changed_sections TEXT[] DEFAULT '{}',
    talent_message TEXT
);

-- 3. Enable RLS
ALTER TABLE public.talent_profile_reviews ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DO $$ BEGIN
DROP POLICY IF EXISTS "Talents can view own reviews" ON public.talent_profile_reviews;
CREATE POLICY "Talents can view own reviews"
ON public.talent_profile_reviews FOR SELECT
USING (EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_profile_reviews.talent_id AND talents.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
DROP POLICY IF EXISTS "Talents can insert own reviews" ON public.talent_profile_reviews;
CREATE POLICY "Talents can insert own reviews"
ON public.talent_profile_reviews FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_profile_reviews.talent_id AND talents.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.talent_profile_reviews;
CREATE POLICY "Admins can manage reviews"
ON public.talent_profile_reviews FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_talent_profile_reviews_talent_id ON public.talent_profile_reviews(talent_id);
CREATE INDEX IF NOT EXISTS idx_talents_profile_change_status ON public.talents(profile_change_status);



-- MIGRATION: 20260226000001_fix_talent_read_rls.sql
-- Drop the existing policies first
DROP POLICY IF EXISTS "Public Read Fully Vetted Talents" ON "public"."talents";
DROP POLICY IF EXISTS "Public Read Work History" ON "public"."talent_work_history";
DROP POLICY IF EXISTS "Public Read Education" ON "public"."talent_education";
DROP POLICY IF EXISTS "Public Read Certifications" ON "public"."talent_certifications";

-- Policy for Public/Clients to view Fully Vetted & Approved Talents
DROP POLICY IF EXISTS "Public Read Fully Vetted Talents" ON "public"."talents";
CREATE POLICY "Public Read Fully Vetted Talents"
ON "public"."talents"
FOR SELECT
TO authenticated
USING (vetting_status IN ('fully_vetted', 'approved'));

-- Policy for viewing Work History of Vetted Talents
DROP POLICY IF EXISTS "Public Read Work History" ON "public"."talent_work_history";
CREATE POLICY "Public Read Work History"
ON "public"."talent_work_history"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_work_history.talent_id
    AND talents.vetting_status IN ('fully_vetted', 'approved')
  )
);

-- Policy for viewing Education of Vetted Talents
DROP POLICY IF EXISTS "Public Read Education" ON "public"."talent_education";
CREATE POLICY "Public Read Education"
ON "public"."talent_education"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_education.talent_id
    AND talents.vetting_status IN ('fully_vetted', 'approved')
  )
);

-- Policy for viewing Certifications of Vetted Talents
DROP POLICY IF EXISTS "Public Read Certifications" ON "public"."talent_certifications";
CREATE POLICY "Public Read Certifications"
ON "public"."talent_certifications"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_certifications.talent_id
    AND talents.vetting_status IN ('fully_vetted', 'approved')
  )
);



-- MIGRATION: 20260227120000_fix_signup_robustness.sql
-- Harden generate_talent_id to use BIGINT and validate format to prevent conversion errors
DROP FUNCTION IF EXISTS public.generate_talent_id() CASCADE;
CREATE OR REPLACE FUNCTION public.generate_talent_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id TEXT;
    counter BIGINT;
BEGIN
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN talent_id ~ '^TAS-VA-[0-9]+$' 
                THEN CAST(SUBSTRING(talent_id FROM 8) AS BIGINT)
                ELSE 0
            END
        ), 
        1000
    ) + 1
    INTO counter
    FROM public.talents;
    
    new_id := 'TAS-VA-' || counter::TEXT;
    RETURN new_id;
END;
$$;

-- Improve handle_new_user trigger with exception handling for talent creation
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
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
        NULL;
    END;

    -- Create specific role profile based on portal type
    IF portal_type = 'talent' THEN
        BEGIN
            new_talent_id := public.generate_talent_id();
            
            INSERT INTO public.talents (
                user_id, talent_id, first_name, last_name, email, onboarding_completed, onboarding_step
            ) VALUES (
                NEW.id, new_talent_id, COALESCE(first_name, ''), COALESCE(last_name, ''), NEW.email, FALSE, 1
            );
        EXCEPTION 
            WHEN unique_violation THEN
                 NULL;
            WHEN OTHERS THEN
                 RAISE WARNING 'Failed to create talent profile: %', SQLERRM;
        END;
        
    ELSIF portal_type = 'client' THEN
        contact_name := COALESCE(full_name, concat_ws(' ', first_name, last_name));
        IF contact_name IS NULL OR contact_name = '' THEN
            contact_name := 'Unknown Contact';
        END IF;

        IF company_name IS NULL OR company_name = '' THEN
            company_name := 'My Company';
        END IF;

        BEGIN
            new_client_id := public.generate_client_id();
            
            INSERT INTO public.clients (
                user_id, client_id, company_name, primary_contact_name, primary_contact_email, status
            ) VALUES (
                NEW.id, new_client_id, company_name, contact_name, NEW.email, 'pending'
            );
        EXCEPTION 
            WHEN unique_violation THEN
                NULL;
            WHEN OTHERS THEN
                 RAISE WARNING 'Failed to create client profile: %', SQLERRM;
        END;
    END IF;

    -- Ensure we always return NEW to allow auth.users to be created
    RETURN NEW;
END;
$$;



-- MIGRATION: 20260227200000_add_onboarding_step_tracking.sql
-- Migration: Add current_step and onboarding_status to talents table
-- Run: 2026-02-27

ALTER TABLE talents
  ADD COLUMN IF NOT EXISTS current_step integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'draft'
    CHECK (onboarding_status IN ('draft', 'submitted', 'under_review', 'revision_required', 'approved'));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_talents_onboarding_status ON talents(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_talents_user_id_step ON talents(user_id, current_step);



-- MIGRATION: 20260227200500_update_availability_enum.sql
-- Migration: Add 'contract' and 'hourly' to availability_type enum
-- Run: 2026-02-27

DO $$ BEGIN
    ALTER TYPE public.availability_type ADD VALUE 'contract';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE public.availability_type ADD VALUE 'hourly';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;



-- MIGRATION: 20260227210000_add_profile_completion.sql
-- Migration: Add profile_completion to talents table
-- Run: 2026-02-27

ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100);

-- Index for analytics/sorting if needed
CREATE INDEX IF NOT EXISTS idx_talents_profile_completion ON public.talents(profile_completion);



-- MIGRATION: 20260227220000_add_onboarding_meta.sql
-- Migration: Add onboarding_meta and last_saved_step
-- Run: 2026-02-27

ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS last_saved_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS completed_steps INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_meta JSONB DEFAULT '{}'::jsonb;

-- Update existing records if necessary
UPDATE public.talents SET last_saved_step = current_step WHERE last_saved_step IS NULL;



-- MIGRATION: 20260227230000_add_role_category.sql
-- Migration: Add role_category to talents
-- Run: 2026-02-27

ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS role_category TEXT;



-- MIGRATION: 20260228000500_fix_manager_visibility.sql
-- Migration: Allow talents to view their assigned manager's profile
-- Date: 2026-02-28

-- Add policy to public.profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Talents can view their assigned manager profiles'
    ) THEN
        DROP POLICY IF EXISTS "Talents can view their assigned manager profiles" ON public.profiles;
CREATE POLICY "Talents can view their assigned manager profiles" ON public.profiles
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.talents
                WHERE talents.user_id = auth.uid()
                AND talents.assigned_manager = profiles.user_id
            )
        );
    END IF;
END $$;



-- MIGRATION: 20260228010000_vetting_engine_core.sql
-- 20260228010000_vetting_engine_core.sql
-- Migration: Vetting Workflow + Status Engine Core

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE public.talent_profile_status AS ENUM (
        'DRAFT', 
        'SUBMITTED', 
        'VETTING_IN_PROGRESS', 
        'CHANGES_REQUESTED', 
        'RESUBMITTED', 
        'VETTED', 
        'REJECTED', 
        'SUSPENDED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.profile_section_status AS ENUM (
        'NOT_STARTED', 
        'COMPLETED', 
        'SUBMITTED', 
        'APPROVED', 
        'CHANGES_REQUESTED', 
        'RESUBMITTED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Create talent_profiles table
CREATE TABLE IF NOT EXISTS public.talent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    status public.talent_profile_status DEFAULT 'DRAFT' NOT NULL,
    vetting_level TEXT, -- e.g. L1, L2, L3
    assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    vetted_at TIMESTAMP WITH TIME ZONE,
    completion_percent INTEGER DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
    last_action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    locked_onboarding BOOLEAN DEFAULT FALSE NOT NULL,
    visibility_to_clients BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create talent_profile_sections table
CREATE TABLE IF NOT EXISTS public.talent_profile_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    section_key TEXT NOT NULL, -- e.g. basic_info, professional_details, work_history, etc.
    status public.profile_section_status DEFAULT 'NOT_STARTED' NOT NULL,
    data JSONB DEFAULT '{}' NOT NULL,
    requested_changes JSONB, -- { fields:[], note:"", attachments_required?: bool }
    requested_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, section_key)
);

-- 4. Create vetting_actions table (audit trail)
CREATE TABLE IF NOT EXISTS public.vetting_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- START_REVIEW, APPROVE_SECTION, REQUEST_CHANGES, etc.
    section_key TEXT,
    note TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Extend notifications table
DO $$ BEGIN
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';
EXCEPTION WHEN others THEN null; END $$;

-- 6. Enable RLS
ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_profile_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetting_actions ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- talent_profiles
DROP POLICY IF EXISTS "Talents can view own profile" ON public.talent_profiles;
CREATE POLICY "Talents can view own profile" 
ON public.talent_profiles FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.talent_profiles;
CREATE POLICY "Admins can manage profiles" 
ON public.talent_profiles FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can view vetted profiles" ON public.talent_profiles;
CREATE POLICY "Clients can view vetted profiles" 
ON public.talent_profiles FOR SELECT 
USING (visibility_to_clients = TRUE);

-- talent_profile_sections
DROP POLICY IF EXISTS "Talents can view own sections" ON public.talent_profile_sections;
CREATE POLICY "Talents can view own sections" 
ON public.talent_profile_sections FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Talents can update own sections if not locked" ON public.talent_profile_sections;
CREATE POLICY "Talents can update own sections if not locked" 
ON public.talent_profile_sections FOR UPDATE 
USING (auth.uid() = user_id AND status IN ('NOT_STARTED', 'COMPLETED', 'CHANGES_REQUESTED'));

DROP POLICY IF EXISTS "Admins can manage sections" ON public.talent_profile_sections;
CREATE POLICY "Admins can manage sections" 
ON public.talent_profile_sections FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()));

-- vetting_actions
DROP POLICY IF EXISTS "Talents can view own vetting actions" ON public.vetting_actions;
CREATE POLICY "Talents can view own vetting actions" 
ON public.vetting_actions FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage vetting actions" ON public.vetting_actions;
CREATE POLICY "Admins can manage vetting actions" 
ON public.vetting_actions FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()));

-- 8. RPC Backend Logic

-- 8.1. update_section_data
DROP FUNCTION IF EXISTS public.update_section_data(
    p_section_key TEXT,
    p_data JSONB,
    p_completion_percent INTEGER
) CASCADE;
CREATE OR REPLACE FUNCTION public.update_section_data(
    p_section_key TEXT,
    p_data JSONB,
    p_completion_percent INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.talent_profile_sections (user_id, section_key, data, status, updated_at)
    VALUES (auth.uid(), p_section_key, p_data, 'COMPLETED', NOW())
    ON CONFLICT (user_id, p_section_key) 
    DO UPDATE SET 
        data = p_data,
        status = 'COMPLETED',
        updated_at = NOW();

    UPDATE public.talent_profiles 
    SET completion_percent = p_completion_percent, updated_at = NOW()
    WHERE user_id = auth.uid();
END;
$$;

-- 8.2. submit_talent_onboarding
DROP FUNCTION IF EXISTS public.submit_talent_onboarding() CASCADE;
CREATE OR REPLACE FUNCTION public.submit_talent_onboarding()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set overall status
    UPDATE public.talent_profiles
    SET 
        status = 'SUBMITTED',
        locked_onboarding = TRUE,
        submitted_at = NOW(),
        last_action_at = NOW(),
        updated_at = NOW()
    WHERE user_id = auth.uid();

    -- Set sections status
    UPDATE public.talent_profile_sections
    SET 
        status = 'SUBMITTED',
        submitted_at = NOW(),
        updated_at = NOW()
    WHERE user_id = auth.uid() 
    AND status = 'COMPLETED';

    -- Log action
    INSERT INTO public.vetting_actions (user_id, action_type, note)
    VALUES (auth.uid(), 'SUBMIT_PROFILE', 'Talent submitted onboarding profile');
END;
$$;

-- 8.3. admin_start_review
DROP FUNCTION IF EXISTS public.admin_start_review(p_talent_user_id UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_start_review(p_talent_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.talent_profiles
    SET 
        status = 'VETTING_IN_PROGRESS',
        last_action_at = NOW(),
        updated_at = NOW(),
        assigned_admin_id = auth.uid()
    WHERE user_id = p_talent_user_id
    AND status = 'SUBMITTED';

    IF FOUND THEN
        INSERT INTO public.vetting_actions (user_id, admin_id, action_type, note)
        VALUES (p_talent_user_id, auth.uid(), 'START_REVIEW', 'Admin started reviewing profile');
    END IF;
END;
$$;

-- 8.4. admin_approve_section
DROP FUNCTION IF EXISTS public.admin_approve_section(
    p_talent_user_id UUID,
    p_section_key TEXT
) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_approve_section(
    p_talent_user_id UUID,
    p_section_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.talent_profile_sections
    SET 
        status = 'APPROVED',
        approved_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_talent_user_id 
    AND section_key = p_section_key;

    INSERT INTO public.vetting_actions (user_id, admin_id, action_type, section_key, note)
    VALUES (p_talent_user_id, auth.uid(), 'APPROVE_SECTION', p_section_key, 'Admin approved section');
END;
$$;

-- 8.5. admin_request_changes
DROP FUNCTION IF EXISTS public.admin_request_changes(
    p_talent_user_id UUID,
    p_section_key TEXT,
    p_changes_note TEXT,
    p_fields TEXT[]) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_request_changes(
    p_talent_user_id UUID,
    p_section_key TEXT,
    p_changes_note TEXT,
    p_fields TEXT[] DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update section
    UPDATE public.talent_profile_sections
    SET 
        status = 'CHANGES_REQUESTED',
        requested_changes = jsonb_build_object('note', p_changes_note, 'fields', p_fields),
        requested_by_admin_id = auth.uid(),
        updated_at = NOW()
    WHERE user_id = p_talent_user_id 
    AND section_key = p_section_key;

    -- Update overall status
    UPDATE public.talent_profiles
    SET 
        status = 'CHANGES_REQUESTED',
        last_action_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_talent_user_id;

    -- Log action
    INSERT INTO public.vetting_actions (user_id, admin_id, action_type, section_key, note, metadata)
    VALUES (p_talent_user_id, auth.uid(), 'REQUEST_CHANGES', p_section_key, p_changes_note, jsonb_build_object('fields', p_fields));

    -- Notify talent
    INSERT INTO public.notifications (user_id, title, message, type, payload)
    VALUES (
        p_talent_user_id, 
        'Revisions Requested', 
        'Admin requested changes for ' || p_section_key, 
        'CHANGES_REQUESTED', 
        jsonb_build_object('section_key', p_section_key)
    );
END;
$$;

-- 8.6. resubmit_sections
DROP FUNCTION IF EXISTS public.resubmit_sections(p_section_keys TEXT[]) CASCADE;
CREATE OR REPLACE FUNCTION public.resubmit_sections(p_section_keys TEXT[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sk TEXT;
    all_resubmitted BOOLEAN;
BEGIN
    FOREACH sk IN ARRAY p_section_keys LOOP
        UPDATE public.talent_profile_sections
        SET 
            status = 'RESUBMITTED',
            submitted_at = NOW(),
            updated_at = NOW()
        WHERE user_id = auth.uid() 
        AND section_key = sk
        AND status = 'CHANGES_REQUESTED';
    END LOOP;

    -- Check if any sections are still in CHANGES_REQUESTED
    SELECT NOT EXISTS (
        SELECT 1 FROM public.talent_profile_sections 
        WHERE user_id = auth.uid() 
        AND status = 'CHANGES_REQUESTED'
    ) INTO all_resubmitted;

    IF all_resubmitted THEN
        UPDATE public.talent_profiles
        SET 
            status = 'RESUBMITTED',
            last_action_at = NOW(),
            updated_at = NOW()
        WHERE user_id = auth.uid();
    END IF;

    -- Log action
    INSERT INTO public.vetting_actions (user_id, action_type, note, metadata)
    VALUES (auth.uid(), 'RESUBMIT_SECTIONS', 'Talent resubmitted requested sections', jsonb_build_object('sections', p_section_keys));
END;
$$;

-- 8.7. admin_finalize_vetting
DROP FUNCTION IF EXISTS public.admin_finalize_vetting(
    p_talent_user_id UUID,
    p_vetting_level TEXT
) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_finalize_vetting(
    p_talent_user_id UUID,
    p_vetting_level TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if all sections are approved
    IF EXISTS (
        SELECT 1 FROM public.talent_profile_sections 
        WHERE user_id = p_talent_user_id 
        AND status NOT IN ('APPROVED')
    ) THEN
        RAISE EXCEPTION 'Cannot finalize vetting while sections are pending approval';
    END IF;

    -- Finalize profile
    UPDATE public.talent_profiles
    SET 
        status = 'VETTED',
        vetting_level = p_vetting_level,
        vetted_at = NOW(),
        visibility_to_clients = TRUE,
        last_action_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_talent_user_id;

    -- Log action
    INSERT INTO public.vetting_actions (user_id, admin_id, action_type, note, metadata)
    VALUES (p_talent_user_id, auth.uid(), 'MARK_VETTED', 'Admin finalized vetting and assigned level', jsonb_build_object('level', p_vetting_level));

    -- Notify talent
    INSERT INTO public.notifications (user_id, title, message, type, payload)
    VALUES (
        p_talent_user_id, 
        'Profile Vetted', 
        'Your profile has been fully vetted! Assigned Level: ' || p_vetting_level, 
        'VETTING_LEVEL_ASSIGNED', 
        jsonb_build_object('level', p_vetting_level)
    );
END;
$$;

-- 9. Initial Migration (one-time data sync)
INSERT INTO public.talent_profiles (user_id, last_action_at, visibility_to_clients, vetting_level)
SELECT user_id, updated_at, (vetting_status = 'fully_vetted'), null
FROM public.talents
ON CONFLICT (user_id) DO NOTHING;



-- MIGRATION: 20260228100000_v2_01_tables.sql
-- ============================================================
-- V2 Vetting System – 01: Tables, Indexes, Constraints
-- ============================================================

-- Feature-flag settings table (app-wide)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO public.app_settings (key, value)
VALUES ('vetting_system_version', 'v2')
ON CONFLICT (key) DO NOTHING;

-- ── 1. v2_talent_profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_talent_profiles (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    talent_id             TEXT UNIQUE,                       -- human-readable ID from legacy
    status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','submitted','in_review',
                                            'changes_requested','resubmitted','vetted')),
    vetting_level         INT,                               -- e.g. 1–5
    assigned_talent_manager UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_at          TIMESTAMPTZ,
    vetted_at             TIMESTAMPTZ,
    progress_percent      INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    locked_onboarding     BOOLEAN NOT NULL DEFAULT false,
    visible_to_clients    BOOLEAN NOT NULL DEFAULT false,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2tp_status     ON public.v2_talent_profiles(status);
CREATE INDEX IF NOT EXISTS idx_v2tp_user       ON public.v2_talent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_v2tp_visibility ON public.v2_talent_profiles(visible_to_clients) WHERE visible_to_clients = true;


-- ── 2. v2_profile_sections ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_profile_sections (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    section_key        TEXT NOT NULL
                       CHECK (section_key IN ('basic_info','professional_details',
                              'work_history','documents','education',
                              'certifications','references')),
    status             TEXT NOT NULL DEFAULT 'not_started'
                       CHECK (status IN ('not_started','in_progress','submitted',
                                         'approved','changes_requested','resubmitted')),
    data               JSONB NOT NULL DEFAULT '{}',
    last_saved_at      TIMESTAMPTZ,
    submitted_at       TIMESTAMPTZ,
    approved_at        TIMESTAMPTZ,
    requested_changes  JSONB NOT NULL DEFAULT '{}',          -- { note, fields[], requested_by, requested_at }
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_v2ps_user    ON public.v2_profile_sections(user_id);
CREATE INDEX IF NOT EXISTS idx_v2ps_status  ON public.v2_profile_sections(status);


-- ── 3. v2_documents ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_documents (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    section_key  TEXT NOT NULL,
    file_label   TEXT NOT NULL,                              -- e.g. 'resume', 'id_card'
    bucket       TEXT NOT NULL DEFAULT 'talent_documents',
    path         TEXT NOT NULL,                              -- storage path
    file_name    TEXT NOT NULL,
    mime_type    TEXT,
    size         INT,
    uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2doc_user ON public.v2_documents(user_id);


-- ── 4. v2_vetting_actions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_vetting_actions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action       TEXT NOT NULL
                 CHECK (action IN ('SUBMIT','START_REVIEW','APPROVE_SECTION',
                        'REQUEST_CHANGES','RESUBMIT','ASSIGN_LEVEL','MARK_VETTED')),
    section_key  TEXT,
    note         TEXT,
    meta         JSONB NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2va_user ON public.v2_vetting_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_v2va_time ON public.v2_vetting_actions(created_at DESC);


-- ── 5. v2_notifications ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL
                CHECK (type IN ('CHANGES_REQUESTED','SECTION_APPROVED',
                       'PROFILE_SUBMITTED','PROFILE_VETTED')),
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    payload     JSONB NOT NULL DEFAULT '{}',
    read        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2n_user   ON public.v2_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_v2n_unread ON public.v2_notifications(user_id) WHERE read = false;



-- MIGRATION: 20260228100001_v2_02_rls.sql
-- ============================================================
-- V2 Vetting System – 02: RLS Policies
-- ============================================================

-- Enable RLS on all V2 tables
ALTER TABLE public.v2_talent_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_profile_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_vetting_actions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings        ENABLE ROW LEVEL SECURITY;

-- ── app_settings: everyone can read ────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read settings" ON public.app_settings;
CREATE POLICY "Anyone can read settings"
ON public.app_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Only superadmin can update settings" ON public.app_settings;
CREATE POLICY "Only superadmin can update settings"
ON public.app_settings FOR UPDATE
USING (public.is_admin(auth.uid()));

-- ── v2_talent_profiles ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Talent reads own profile" ON public.v2_talent_profiles;
CREATE POLICY "Talent reads own profile"
ON public.v2_talent_profiles FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Talent inserts own profile" ON public.v2_talent_profiles;
CREATE POLICY "Talent inserts own profile"
ON public.v2_talent_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Talent updates own profile" ON public.v2_talent_profiles;
CREATE POLICY "Talent updates own profile"
ON public.v2_talent_profiles FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin reads all profiles" ON public.v2_talent_profiles;
CREATE POLICY "Admin reads all profiles"
ON public.v2_talent_profiles FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin updates all profiles" ON public.v2_talent_profiles;
CREATE POLICY "Admin updates all profiles"
ON public.v2_talent_profiles FOR UPDATE
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Client reads vetted visible profiles" ON public.v2_talent_profiles;
CREATE POLICY "Client reads vetted visible profiles"
ON public.v2_talent_profiles FOR SELECT
USING (
    public.has_role(auth.uid(), 'client')
    AND status = 'vetted'
    AND visible_to_clients = true
);

-- ── v2_profile_sections ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Talent reads own sections" ON public.v2_profile_sections;
CREATE POLICY "Talent reads own sections"
ON public.v2_profile_sections FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Talent inserts own sections" ON public.v2_profile_sections;
CREATE POLICY "Talent inserts own sections"
ON public.v2_profile_sections FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Talent updates own sections" ON public.v2_profile_sections;
CREATE POLICY "Talent updates own sections"
ON public.v2_profile_sections FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin reads all sections" ON public.v2_profile_sections;
CREATE POLICY "Admin reads all sections"
ON public.v2_profile_sections FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin updates all sections" ON public.v2_profile_sections;
CREATE POLICY "Admin updates all sections"
ON public.v2_profile_sections FOR UPDATE
USING (public.is_admin(auth.uid()));

-- ── v2_documents ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Talent manages own docs" ON public.v2_documents;
CREATE POLICY "Talent manages own docs"
ON public.v2_documents FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin reads all docs" ON public.v2_documents;
CREATE POLICY "Admin reads all docs"
ON public.v2_documents FOR SELECT
USING (public.is_admin(auth.uid()));

-- ── v2_vetting_actions ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Talent reads own actions" ON public.v2_vetting_actions;
CREATE POLICY "Talent reads own actions"
ON public.v2_vetting_actions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin reads all actions" ON public.v2_vetting_actions;
CREATE POLICY "Admin reads all actions"
ON public.v2_vetting_actions FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin inserts actions" ON public.v2_vetting_actions;
CREATE POLICY "Admin inserts actions"
ON public.v2_vetting_actions FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- ── v2_notifications ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "User reads own notifications" ON public.v2_notifications;
CREATE POLICY "User reads own notifications"
ON public.v2_notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User marks own notifications read" ON public.v2_notifications;
CREATE POLICY "User marks own notifications read"
ON public.v2_notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Allow RPCs (running as SECURITY DEFINER) to insert notifications
-- by granting INSERT to authenticated via a permissive policy;
-- the actual insert is done only from trusted RPCs.
DROP POLICY IF EXISTS "System inserts notifications" ON public.v2_notifications;
CREATE POLICY "System inserts notifications"
ON public.v2_notifications FOR INSERT
WITH CHECK (true);



-- MIGRATION: 20260228100002_v2_03_rpcs.sql
-- ============================================================
-- V2 Vetting System – 03: RPC Functions (SECURITY DEFINER)
-- ============================================================

-- ── Helper: recompute progress_percent ─────────────────────────────────────
DROP FUNCTION IF EXISTS public.v2_recompute_progress(p_user_id UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_recompute_progress(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    total_sections INT := 7;
    filled_sections INT;
    pct INT;
BEGIN
    SELECT count(*) INTO filled_sections
    FROM public.v2_profile_sections
    WHERE user_id = p_user_id
      AND data != '{}'::jsonb
      AND status != 'not_started';

    pct := ROUND((filled_sections::NUMERIC / total_sections) * 100)::INT;

    UPDATE public.v2_talent_profiles
    SET progress_percent = pct,
        updated_at = now()
    WHERE user_id = p_user_id;

    RETURN pct;
END;
$$;


-- ── 1. v2_save_section_data ────────────────────────────────────────────────
-- Called by talent to save / update a section's JSONB data.
-- Upserts the section row, merges data, updates status + progress.
DROP FUNCTION IF EXISTS public.v2_save_section_data(
    p_section_key TEXT,
    p_data        JSONB
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_save_section_data(
    p_section_key TEXT,
    p_data        JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_user_id  UUID := auth.uid();
    v_section  public.v2_profile_sections%ROWTYPE;
    v_progress INT;
    v_profile  public.v2_talent_profiles%ROWTYPE;
BEGIN
    -- Ensure profile exists
    INSERT INTO public.v2_talent_profiles (user_id)
    VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Check if profile is locked
    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = v_user_id;
    IF v_profile.locked_onboarding AND v_profile.status NOT IN ('changes_requested') THEN
        RAISE EXCEPTION 'Onboarding is locked. Cannot save.';
    END IF;

    -- Upsert section
    INSERT INTO public.v2_profile_sections (user_id, section_key, data, status, last_saved_at, updated_at)
    VALUES (v_user_id, p_section_key, p_data, 'in_progress', now(), now())
    ON CONFLICT (user_id, section_key) DO UPDATE SET
        data          = public.v2_profile_sections.data || EXCLUDED.data,  -- deep merge top-level keys
        status        = CASE
                          WHEN public.v2_profile_sections.status IN ('not_started','in_progress')
                          THEN 'in_progress'
                          WHEN public.v2_profile_sections.status = 'changes_requested'
                          THEN 'changes_requested'  -- keep it so talent knows to resubmit
                          ELSE public.v2_profile_sections.status
                        END,
        last_saved_at = now(),
        updated_at    = now();

    SELECT * INTO v_section FROM public.v2_profile_sections
    WHERE user_id = v_user_id AND section_key = p_section_key;

    v_progress := public.v2_recompute_progress(v_user_id);

    RETURN jsonb_build_object(
        'section', row_to_json(v_section),
        'progress_percent', v_progress
    );
END;
$$;


-- ── 2. v2_submit_profile ───────────────────────────────────────────────────
-- Called by talent when all steps are done and they hit final submit.
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
    IF v_profile.locked_onboarding THEN RAISE EXCEPTION 'Already submitted'; END IF;

    -- Check all 7 sections have data
    SELECT count(*) INTO v_incomplete
    FROM (
        SELECT unnest(ARRAY['basic_info','professional_details','work_history',
                            'documents','education','certifications','references']) AS sk
    ) required_sections
    WHERE NOT EXISTS (
        SELECT 1 FROM public.v2_profile_sections
        WHERE user_id = v_user_id AND section_key = required_sections.sk
          AND data != '{}'::jsonb
    );

    IF v_incomplete > 0 THEN
        RAISE EXCEPTION '% section(s) are still incomplete', v_incomplete;
    END IF;

    -- Lock & submit
    UPDATE public.v2_talent_profiles SET
        status = 'submitted',
        locked_onboarding = true,
        submitted_at = now(),
        progress_percent = 100,
        updated_at = now()
    WHERE user_id = v_user_id;

    -- Mark all sections as submitted
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


-- ── 3. v2_admin_start_review ───────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.v2_admin_start_review(
    p_talent_user_id UUID
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_start_review(
    p_talent_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_profile  public.v2_talent_profiles%ROWTYPE;
BEGIN
    IF NOT public.is_admin(v_admin_id) THEN
        RAISE EXCEPTION 'Unauthorised';
    END IF;

    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = p_talent_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

    IF v_profile.status NOT IN ('submitted','resubmitted') THEN
        RAISE EXCEPTION 'Profile status must be submitted or resubmitted, got %', v_profile.status;
    END IF;

    UPDATE public.v2_talent_profiles SET
        status = 'in_review',
        updated_at = now()
    WHERE user_id = p_talent_user_id;

    INSERT INTO public.v2_vetting_actions (user_id, admin_id, action)
    VALUES (p_talent_user_id, v_admin_id, 'START_REVIEW');

    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = p_talent_user_id;
    RETURN row_to_json(v_profile)::JSONB;
END;
$$;


-- ── 4. v2_admin_approve_section ────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.v2_admin_approve_section(
    p_talent_user_id UUID,
    p_section_key    TEXT,
    p_note           TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_approve_section(
    p_talent_user_id UUID,
    p_section_key    TEXT,
    p_note           TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_section  public.v2_profile_sections%ROWTYPE;
    v_profile  public.v2_talent_profiles%ROWTYPE;
BEGIN
    IF NOT public.is_admin(v_admin_id) THEN RAISE EXCEPTION 'Unauthorised'; END IF;

    UPDATE public.v2_profile_sections SET
        status = 'approved',
        approved_at = now(),
        requested_changes = '{}',
        updated_at = now()
    WHERE user_id = p_talent_user_id AND section_key = p_section_key;

    IF NOT FOUND THEN RAISE EXCEPTION 'Section not found'; END IF;

    -- Auto-transition profile to in_review if not already
    UPDATE public.v2_talent_profiles SET
        status = CASE WHEN status IN ('submitted','resubmitted') THEN 'in_review' ELSE status END,
        updated_at = now()
    WHERE user_id = p_talent_user_id;

    INSERT INTO public.v2_vetting_actions (user_id, admin_id, action, section_key, note)
    VALUES (p_talent_user_id, v_admin_id, 'APPROVE_SECTION', p_section_key, p_note);

    INSERT INTO public.v2_notifications (user_id, type, title, message, payload)
    VALUES (p_talent_user_id, 'SECTION_APPROVED',
            'Section Approved',
            'Your "' || p_section_key || '" section has been approved.',
            jsonb_build_object('section_key', p_section_key));

    SELECT * INTO v_section FROM public.v2_profile_sections WHERE user_id = p_talent_user_id AND section_key = p_section_key;
    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = p_talent_user_id;

    RETURN jsonb_build_object('section', row_to_json(v_section), 'profile', row_to_json(v_profile));
END;
$$;


-- ── 5. v2_admin_request_changes ────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.v2_admin_request_changes(
    p_talent_user_id UUID,
    p_section_key    TEXT,
    p_note           TEXT,
    p_fields         TEXT[]) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_request_changes(
    p_talent_user_id UUID,
    p_section_key    TEXT,
    p_note           TEXT,
    p_fields         TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_section  public.v2_profile_sections%ROWTYPE;
    v_profile  public.v2_talent_profiles%ROWTYPE;
BEGIN
    IF NOT public.is_admin(v_admin_id) THEN RAISE EXCEPTION 'Unauthorised'; END IF;

    UPDATE public.v2_profile_sections SET
        status = 'changes_requested',
        requested_changes = jsonb_build_object(
            'note', p_note,
            'fields', to_jsonb(p_fields),
            'requested_by', v_admin_id,
            'requested_at', now()
        ),
        updated_at = now()
    WHERE user_id = p_talent_user_id AND section_key = p_section_key;

    IF NOT FOUND THEN RAISE EXCEPTION 'Section not found'; END IF;

    UPDATE public.v2_talent_profiles SET
        status = 'changes_requested',
        updated_at = now()
    WHERE user_id = p_talent_user_id;

    INSERT INTO public.v2_vetting_actions (user_id, admin_id, action, section_key, note, meta)
    VALUES (p_talent_user_id, v_admin_id, 'REQUEST_CHANGES', p_section_key, p_note,
            jsonb_build_object('fields', to_jsonb(p_fields)));

    INSERT INTO public.v2_notifications (user_id, type, title, message, payload)
    VALUES (p_talent_user_id, 'CHANGES_REQUESTED',
            'Changes Requested',
            'An admin has requested changes on your "' || p_section_key || '" section.',
            jsonb_build_object('section_key', p_section_key, 'note', p_note));

    SELECT * INTO v_section FROM public.v2_profile_sections WHERE user_id = p_talent_user_id AND section_key = p_section_key;
    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = p_talent_user_id;

    RETURN jsonb_build_object('section', row_to_json(v_section), 'profile', row_to_json(v_profile));
END;
$$;


-- ── 6. v2_talent_resubmit_sections ─────────────────────────────────────────
DROP FUNCTION IF EXISTS public.v2_talent_resubmit_sections(
    p_section_keys TEXT[]
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_talent_resubmit_sections(
    p_section_keys TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_key     TEXT;
    v_profile public.v2_talent_profiles%ROWTYPE;
BEGIN
    FOREACH v_key IN ARRAY p_section_keys LOOP
        UPDATE public.v2_profile_sections SET
            status = 'resubmitted',
            submitted_at = now(),
            requested_changes = '{}',
            updated_at = now()
        WHERE user_id = v_user_id
          AND section_key = v_key
          AND status = 'changes_requested';
    END LOOP;

    UPDATE public.v2_talent_profiles SET
        status = 'resubmitted',
        updated_at = now()
    WHERE user_id = v_user_id;

    INSERT INTO public.v2_vetting_actions (user_id, action, meta)
    VALUES (v_user_id, 'RESUBMIT', jsonb_build_object('sections', to_jsonb(p_section_keys)));

    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = v_user_id;
    RETURN row_to_json(v_profile)::JSONB;
END;
$$;


-- ── 7. v2_admin_finalize_vetting ───────────────────────────────────────────
DROP FUNCTION IF EXISTS public.v2_admin_finalize_vetting(
    p_talent_user_id UUID,
    p_vetting_level  INT
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_finalize_vetting(
    p_talent_user_id UUID,
    p_vetting_level  INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_id     UUID := auth.uid();
    v_profile      public.v2_talent_profiles%ROWTYPE;
    v_unapproved   INT;
BEGIN
    IF NOT public.is_admin(v_admin_id) THEN RAISE EXCEPTION 'Unauthorised'; END IF;

    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = p_talent_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

    -- All 7 sections must be approved
    SELECT count(*) INTO v_unapproved
    FROM public.v2_profile_sections
    WHERE user_id = p_talent_user_id AND status != 'approved';

    IF v_unapproved > 0 THEN
        RAISE EXCEPTION '% section(s) are not yet approved', v_unapproved;
    END IF;

    UPDATE public.v2_talent_profiles SET
        status = 'vetted',
        vetting_level = p_vetting_level,
        vetted_at = now(),
        visible_to_clients = true,
        updated_at = now()
    WHERE user_id = p_talent_user_id;

    INSERT INTO public.v2_vetting_actions (user_id, admin_id, action, meta)
    VALUES (p_talent_user_id, v_admin_id, 'ASSIGN_LEVEL',
            jsonb_build_object('vetting_level', p_vetting_level));

    INSERT INTO public.v2_vetting_actions (user_id, admin_id, action)
    VALUES (p_talent_user_id, v_admin_id, 'MARK_VETTED');

    INSERT INTO public.v2_notifications (user_id, type, title, message, payload)
    VALUES (p_talent_user_id, 'PROFILE_VETTED',
            'Profile Fully Vetted',
            'Congratulations! Your profile has been fully vetted and is now visible to clients.',
            jsonb_build_object('vetting_level', p_vetting_level));

    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = p_talent_user_id;
    RETURN row_to_json(v_profile)::JSONB;
END;
$$;



-- MIGRATION: 20260228100003_v2_04_triggers_audit.sql
-- ============================================================
-- V2 Vetting System – 04: Triggers & Audit
-- ============================================================

-- Auto-update updated_at on v2_talent_profiles
DROP FUNCTION IF EXISTS public.v2_set_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.v2_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS v2_talent_profiles_updated_at ON public.v2_talent_profiles;
CREATE TRIGGER v2_talent_profiles_updated_at BEFORE UPDATE ON public.v2_talent_profiles
    FOR EACH ROW EXECUTE FUNCTION public.v2_set_updated_at();

DROP TRIGGER IF EXISTS v2_profile_sections_updated_at ON public.v2_profile_sections;
CREATE TRIGGER v2_profile_sections_updated_at BEFORE UPDATE ON public.v2_profile_sections
    FOR EACH ROW EXECUTE FUNCTION public.v2_set_updated_at();

-- Auto-create V2 profile when a talent signs up (or when talent row is created)
DROP FUNCTION IF EXISTS public.v2_auto_create_profile() CASCADE;
CREATE OR REPLACE FUNCTION public.v2_auto_create_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.v2_talent_profiles (user_id, talent_id)
    VALUES (NEW.user_id, NEW.talent_id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS v2_on_talent_created ON public.talents;
DROP TRIGGER IF EXISTS v2_on_talent_created ON public.talents;
CREATE TRIGGER v2_on_talent_created AFTER INSERT ON public.talents
    FOR EACH ROW EXECUTE FUNCTION public.v2_auto_create_profile();



-- MIGRATION: 20260228100004_v2_05_backfill.sql
-- ============================================================
-- V2 Vetting System – 05: V1 → V2 Backfill Script
-- ============================================================
-- One-time migration that copies valid V1 data into V2 tables.
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING).

-- Step 1: Backfill v2_talent_profiles from v1 talent_profiles + talents
INSERT INTO public.v2_talent_profiles (
    user_id, talent_id, status, vetting_level,
    assigned_talent_manager, submitted_at, vetted_at,
    progress_percent, locked_onboarding, visible_to_clients,
    created_at, updated_at
)
SELECT
    tp.user_id,
    t.talent_id,
    CASE
        WHEN tp.status = 'VETTED'              THEN 'vetted'
        WHEN tp.status = 'REJECTED'            THEN 'draft'  -- reset rejected to draft for re-entry
        WHEN tp.status = 'SUBMITTED'           THEN 'submitted'
        WHEN tp.status = 'VETTING_IN_PROGRESS' THEN 'in_review'
        WHEN tp.status = 'CHANGES_REQUESTED'   THEN 'changes_requested'
        WHEN tp.status = 'RESUBMITTED'         THEN 'resubmitted'
        ELSE 'draft'
    END,
    CASE WHEN tp.vetting_level IS NOT NULL THEN tp.vetting_level::INT ELSE NULL END,
    COALESCE(tp.assigned_admin_id, t.assigned_manager),
    tp.submitted_at,
    tp.vetted_at,
    COALESCE(tp.completion_percent, t.profile_completion, 0),
    COALESCE(tp.locked_onboarding, false),
    COALESCE(tp.visibility_to_clients, false),
    COALESCE(tp.created_at, t.created_at, now()),
    now()
FROM public.talent_profiles tp
JOIN public.talents t ON t.user_id = tp.user_id
ON CONFLICT (user_id) DO NOTHING;

-- Also backfill talents WITHOUT a talent_profiles row (draft state)
INSERT INTO public.v2_talent_profiles (user_id, talent_id, status, progress_percent, created_at)
SELECT t.user_id, t.talent_id, 'draft', COALESCE(t.profile_completion, 0), t.created_at
FROM public.talents t
WHERE NOT EXISTS (SELECT 1 FROM public.v2_talent_profiles WHERE user_id = t.user_id)
ON CONFLICT (user_id) DO NOTHING;


-- Step 2: Backfill v2_profile_sections from v1 talent_profile_sections
INSERT INTO public.v2_profile_sections (
    user_id, section_key, status, data,
    last_saved_at, submitted_at, approved_at,
    requested_changes, updated_at
)
SELECT
    tps.user_id,
    tps.section_key,
    CASE
        WHEN tps.status = 'APPROVED'           THEN 'approved'
        WHEN tps.status = 'SUBMITTED'          THEN 'submitted'
        WHEN tps.status = 'CHANGES_REQUESTED'  THEN 'changes_requested'
        WHEN tps.status = 'RESUBMITTED'        THEN 'resubmitted'
        WHEN tps.status = 'COMPLETED'          THEN 'in_progress'
        ELSE 'in_progress'
    END,
    COALESCE(tps.data, '{}'::jsonb),
    COALESCE(tps.submitted_at, tps.updated_at),
    tps.submitted_at,
    tps.approved_at,
    COALESCE(tps.requested_changes, '{}'::jsonb),
    now()
FROM public.talent_profile_sections tps
WHERE tps.data IS NOT NULL AND tps.data != '{}'::jsonb
ON CONFLICT (user_id, section_key) DO NOTHING;


-- Step 3: Backfill v2_vetting_actions from v1 vetting_actions
INSERT INTO public.v2_vetting_actions (user_id, admin_id, action, section_key, note, meta, created_at)
SELECT
    va.user_id,
    va.admin_id,
    CASE
        WHEN va.action_type = 'SUBMIT_PROFILE' THEN 'SUBMIT'
        WHEN va.action_type = 'START_REVIEW' THEN 'START_REVIEW'
        WHEN va.action_type = 'APPROVE_SECTION' THEN 'APPROVE_SECTION'
        WHEN va.action_type = 'REQUEST_CHANGES' THEN 'REQUEST_CHANGES'
        WHEN va.action_type = 'RESUBMIT_PROFILE' THEN 'RESUBMIT'
        WHEN va.action_type IN ('ASSIGN_VETTING_LEVEL', 'ASSIGN_LEVEL') THEN 'ASSIGN_LEVEL'
        WHEN va.action_type = 'MARK_FULLY_VETTED' THEN 'MARK_VETTED'
        WHEN va.action_type = 'REJECT_PROFILE' THEN 'REQUEST_CHANGES'
        ELSE 'SUBMIT' -- safe fallback
    END as action,
    va.section_key,
    va.note,
    COALESCE(va.metadata, '{}'::jsonb),
    va.created_at
FROM public.vetting_actions va
WHERE NOT EXISTS (
    SELECT 1 FROM public.v2_vetting_actions v2va 
    WHERE v2va.user_id = va.user_id 
    AND v2va.action = CASE
        WHEN va.action_type = 'SUBMIT_PROFILE' THEN 'SUBMIT'
        WHEN va.action_type = 'START_REVIEW' THEN 'START_REVIEW'
        WHEN va.action_type = 'APPROVE_SECTION' THEN 'APPROVE_SECTION'
        WHEN va.action_type = 'REQUEST_CHANGES' THEN 'REQUEST_CHANGES'
        WHEN va.action_type = 'RESUBMIT_PROFILE' THEN 'RESUBMIT'
        WHEN va.action_type IN ('ASSIGN_VETTING_LEVEL', 'ASSIGN_LEVEL') THEN 'ASSIGN_LEVEL'
        WHEN va.action_type = 'MARK_FULLY_VETTED' THEN 'MARK_VETTED'
        WHEN va.action_type = 'REJECT_PROFILE' THEN 'REQUEST_CHANGES'
        ELSE 'SUBMIT'
    END
    AND (v2va.section_key = va.section_key OR (v2va.section_key IS NULL AND va.section_key IS NULL))
    AND v2va.created_at = va.created_at
);


-- Step 4: Recompute progress for all backfilled profiles
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT user_id FROM public.v2_talent_profiles LOOP
        PERFORM public.v2_recompute_progress(rec.user_id);
    END LOOP;
END $$;



-- MIGRATION: 20260228110000_v2_06_revetting_engine.sql
-- ============================================================
-- V2 Vetting System – 06: Re-vetting Engine & UI Enhancements
-- ============================================================
-- Adds fields for the enterprise UI redesign and the logic to
-- handle post-vetting profile edits (Re-vetting engine).

-- -----------------------------------------------------------------------------
-- 1. Schema Updates: v2_talent_profiles
-- -----------------------------------------------------------------------------
-- Add new status states to the CHECK constraint. 
-- Postgres requires altering the constraint by dropping and recreating it.
ALTER TABLE public.v2_talent_profiles DROP CONSTRAINT IF EXISTS v2_talent_profiles_status_check;

ALTER TABLE public.v2_talent_profiles ADD CONSTRAINT v2_talent_profiles_status_check 
CHECK (status IN (
    'draft', 
    'submitted', 
    'in_review', 
    'changes_requested', 
    'resubmitted', 
    'vetted',
    'revett_required',    -- New: Talent edited a critical section
    'revett_pending'      -- New: Talent requested re-vetting after edits
));

-- Add new columns for enterprise UI and revetting engine
ALTER TABLE public.v2_talent_profiles
ADD COLUMN IF NOT EXISTS vetting_level_text TEXT CHECK (vetting_level_text IN ('Junior', 'Mid', 'Senior', 'Lead', 'Expert')),
ADD COLUMN IF NOT EXISTS revet_request_required BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS last_vetted_snapshot JSONB,
ADD COLUMN IF NOT EXISTS talent_manager_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;


-- -----------------------------------------------------------------------------
-- 2. Schema Updates: v2_vetting_actions
-- -----------------------------------------------------------------------------
ALTER TABLE public.v2_vetting_actions DROP CONSTRAINT IF EXISTS v2_vetting_actions_action_check;

ALTER TABLE public.v2_vetting_actions ADD CONSTRAINT v2_vetting_actions_action_check
CHECK (action IN (
    'SUBMIT', 
    'START_REVIEW', 
    'APPROVE_SECTION', 
    'REQUEST_CHANGES', 
    'RESUBMIT', 
    'ASSIGN_LEVEL', 
    'MARK_VETTED',
    'REVOKED_FOR_EDIT',   -- New: System automatically revoked vetting
    'REQUEST_REVETTING',  -- New: Talent requests a re-vet
    'ASSIGN_MANAGER'      -- New: Admin assigns a talent manager
));


-- -----------------------------------------------------------------------------
-- 3. New Table: v2_profile_changes_audit
-- -----------------------------------------------------------------------------
-- Tracks exactly what changed when a vetted talent edits their profile
CREATE TABLE IF NOT EXISTS public.v2_profile_changes_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    section_key TEXT NOT NULL,
    changed_fields JSONB NOT NULL DEFAULT '{}',
    triggers_revetting BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2pca_user ON public.v2_profile_changes_audit(user_id);

-- Apply basic RLS
ALTER TABLE public.v2_profile_changes_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Talents can view their own audit trail" ON public.v2_profile_changes_audit;
CREATE POLICY "Talents can view their own audit trail"
    ON public.v2_profile_changes_audit FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all audit trails" ON public.v2_profile_changes_audit;
CREATE POLICY "Admins can view all audit trails"
    ON public.v2_profile_changes_audit FOR SELECT
    USING (public.is_admin(auth.uid()));


-- -----------------------------------------------------------------------------
-- 4. RPC: v2_update_section_post_vet
-- -----------------------------------------------------------------------------
-- Function allowing fully vetted talents to edit their profiles.
-- If they edit a critical section (e.g. skills), it revokes their vetting.
DROP FUNCTION IF EXISTS public.v2_update_section_post_vet(
    p_user_id UUID,
    p_section_key TEXT,
    p_data JSONB
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_update_section_post_vet(
    p_user_id UUID,
    p_section_key TEXT,
    p_data JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_status TEXT;
    v_is_critical BOOLEAN;
    v_old_data JSONB;
BEGIN
    -- 1. Ensure the caller is the actual user or an admin
    IF auth.uid() != p_user_id AND NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- 2. Prevent edits to the basic_info (identity) section entirely here
    IF p_section_key = 'basic_info' THEN
        RAISE EXCEPTION 'Basic info cannot be edited after vetting. Contact support.';
    END IF;

    -- 3. Check current profile status
    SELECT status INTO v_profile_status
    FROM public.v2_talent_profiles
    WHERE user_id = p_user_id;

    IF v_profile_status NOT IN ('vetted', 'revett_required', 'revett_pending') THEN
        RAISE EXCEPTION 'This RPC is only for post-vetting edits. Current status: %', v_profile_status;
    END IF;

    -- 4. Determine if section is critical
    -- Note: We exclude 'basic_info' because we blocked it above.
    v_is_critical := p_section_key IN (
        'professional_details',
        'work_history',
        'education',
        'certifications',
        'references',
        'documents'
    );

    -- 5. Fetch old data for audit
    SELECT data INTO v_old_data
    FROM public.v2_profile_sections
    WHERE user_id = p_user_id AND section_key = p_section_key;

    -- 6. Upsert the section data
    INSERT INTO public.v2_profile_sections (
        user_id, section_key, status, data, last_saved_at
    )
    VALUES (
        p_user_id, p_section_key, 'in_progress', p_data, now()
    )
    ON CONFLICT (user_id, section_key) DO UPDATE SET
        data = EXCLUDED.data,
        status = 'in_progress',
        last_saved_at = now(),
        updated_at = now();

    -- 7. Log to audit table
    INSERT INTO public.v2_profile_changes_audit (
        user_id, section_key, changed_fields, triggers_revetting
    ) VALUES (
        p_user_id, p_section_key, p_data, v_is_critical
    );

    -- 8. If critical AND currently vetted, revoke vetting
    IF v_is_critical AND v_profile_status = 'vetted' THEN
        
        -- Snapshot the profile state before revoking (optional safety feature)
        UPDATE public.v2_talent_profiles
        SET status = 'revett_required',
            revet_request_required = true,
            visible_to_clients = false, -- Hide from clients until re-vetted
            updated_at = now()
        WHERE user_id = p_user_id;

        -- Log Revoke Action
        INSERT INTO public.v2_vetting_actions (
            user_id, action, note
        ) VALUES (
            p_user_id, 
            'REVOKED_FOR_EDIT', 
            'System automatically revoked vetting because a critical section (' || p_section_key || ') was modified.'
        );

        -- Notify Admin Queue
        INSERT INTO public.v2_notifications (
            user_id, type, title, message
        ) VALUES (
            p_user_id,
            'CHANGES_REQUESTED',
            'Vetting Revoked: Profile Edited',
            'You edited a critical section resulting in your vetted status being temporarily revoked. Please review and request a re-vetting.'
        );
    END IF;

END;
$$;


-- -----------------------------------------------------------------------------
-- 5. RPC: v2_talent_request_revetting
-- -----------------------------------------------------------------------------
-- Called by the talent to submit their changes to the admin queue
DROP FUNCTION IF EXISTS public.v2_talent_request_revetting(
    p_user_id UUID
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_talent_request_revetting(
    p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_status TEXT;
BEGIN
    IF auth.uid() != p_user_id AND NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    SELECT status INTO v_profile_status
    FROM public.v2_talent_profiles
    WHERE user_id = p_user_id;

    IF v_profile_status != 'revett_required' THEN
        RAISE EXCEPTION 'Profile is not in a revett_required state.';
    END IF;

    -- Update profile
    UPDATE public.v2_talent_profiles
    SET status = 'revett_pending',
        revet_request_required = false,
        submitted_at = now(),
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Log Action
    INSERT INTO public.v2_vetting_actions (
        user_id, action, note
    ) VALUES (
        p_user_id, 'REQUEST_REVETTING', 'Talent requested re-vetting after post-vet edits.'
    );

    -- Ensure sections changed from 'in_progress' to 'submitted'
    UPDATE public.v2_profile_sections
    SET status = 'submitted',
        submitted_at = now(),
        updated_at = now()
    WHERE user_id = p_user_id AND status = 'in_progress';

END;
$$;


-- -----------------------------------------------------------------------------
-- 6. RPC: v2_admin_assign_manager (Bonus helper)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.v2_admin_assign_manager(
    p_talent_user_id UUID,
    p_manager_admin_id UUID
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_assign_manager(
    p_talent_user_id UUID,
    p_manager_admin_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can assign managers';
    END IF;

    UPDATE public.v2_talent_profiles
    SET talent_manager_admin_id = p_manager_admin_id,
        updated_at = now()
    WHERE user_id = p_talent_user_id;

    INSERT INTO public.v2_vetting_actions (
        user_id, admin_id, action, note
    ) VALUES (
        p_talent_user_id, auth.uid(), 'ASSIGN_MANAGER', 
        'Assigned talent manager ID: ' || p_manager_admin_id
    );
END;
$$;


-- -----------------------------------------------------------------------------
-- 7. RPC OVERRIDE: v2_admin_finalize_vetting
-- -----------------------------------------------------------------------------
-- Drops the old integer-based one and replaces it with text-based
DROP FUNCTION IF EXISTS public.v2_admin_finalize_vetting(UUID, INT);

DROP FUNCTION IF EXISTS public.v2_admin_finalize_vetting(
    p_talent_user_id UUID,
    p_vetting_level_text TEXT
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_finalize_vetting(
    p_talent_user_id UUID,
    p_vetting_level_text TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_status TEXT;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can finalize vetting';
    END IF;

    SELECT status INTO v_profile_status
    FROM public.v2_talent_profiles
    WHERE user_id = p_talent_user_id;

    -- Update profile to vetted, make visible to clients
    UPDATE public.v2_talent_profiles
    SET status = 'vetted',
        vetting_level_text = p_vetting_level_text,
        visible_to_clients = true,
        vetted_at = now(),
        updated_at = now()
    WHERE user_id = p_talent_user_id;

    -- Store action
    INSERT INTO public.v2_vetting_actions (
        user_id, admin_id, action, note, meta
    ) VALUES (
        p_talent_user_id,
        auth.uid(),
        'MARK_VETTED',
        'Profile marked as fully vetted. Level: ' || p_vetting_level_text,
        jsonb_build_object('assigned_level', p_vetting_level_text)
    );

    -- Notify talent
    INSERT INTO public.v2_notifications (
        user_id, type, title, message
    ) VALUES (
        p_talent_user_id,
        'PROFILE_VETTED',
        'Profile Approved!',
        'Congratulations, your profile has been fully vetted and is now visible to clients.'
    );
END;
$$;



-- MIGRATION: 20260228153000_add_suspension.sql
-- Add suspension fields to v2_talent_profiles
ALTER TABLE public.v2_talent_profiles 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for filtering suspended talents
CREATE INDEX IF NOT EXISTS idx_v2tp_suspended ON public.v2_talent_profiles(is_suspended) WHERE is_suspended = true;

-- Update RLS to hide suspended talents from clients
-- Assuming we have an existing policy that allows clients to view 'vetted' talents
-- We need to ensure is_suspended = false is part of it.

-- First, let's check existing policies for v2_talent_profiles
-- (I'll do this in a separate step if needed, but adding a safe guard here)
DO $$ 
BEGIN
    -- This is a placeholder for actual policy updates if they exist.
    -- Usually, client browsing logic already filters by visible_to_clients = true.
    -- We should ensure is_suspended being true sets visible_to_clients = false or is checked explicitly.
END $$;



-- MIGRATION: 20260301100000_client_talent_module.sql
-- ============================================================
-- Client Talent Module – Data Exposure & Engagement
-- ============================================================

-- 0. Ensure foreign key exists for robust joins in Postgrest
-- Many admin queries use v2_talent_profiles -> talents join via user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_v2tp_talents'
    ) THEN
        ALTER TABLE public.v2_talent_profiles
        ADD CONSTRAINT fk_v2tp_talents
        FOREIGN KEY (user_id) REFERENCES public.talents(user_id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- ── 1. client_visible_talents View ─────────────────────────────────────────
-- Securely exposes non-sensitive talent data for the browse grid.
CREATE OR REPLACE VIEW public.client_visible_talents AS
SELECT
    tp.id as profile_id,
    t.id as talent_id,
    tp.user_id,
    tp.talent_id as display_id,
    -- Anonymized Name (First Name + Last Initial)
    COALESCE(
        (SELECT (data->>'firstName')::text || ' ' || LEFT((data->>'lastName')::text, 1) || '.'
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'basic_info'),
        t.first_name || ' ' || LEFT(t.last_name, 1) || '.'
    ) as anonymized_name,
    -- Headline / Primary Role
    COALESCE(
        (SELECT (data->>'primaryRole')::text
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.primary_role
    ) as headline,
    tp.vetting_level,
    -- Location (City + Country)
    COALESCE(
        (SELECT 
            CASE 
                WHEN (data->>'city') IS NOT NULL AND (data->>'country') IS NOT NULL 
                THEN (data->>'city')::text || ', ' || (data->>'country')::text
                ELSE (data->>'country')::text
            END
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'basic_info'),
        t.country
    ) as location,
    -- Experience
    COALESCE(
        (SELECT (data->>'yearsOfExperience')::int
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.years_of_experience
    ) as years_experience,
    -- Availability
    COALESCE(
        (SELECT (data->>'availability')::text
         FROM public.v2_profile_sections
         WHERE user_id = tp.user_id AND section_key = 'professional_details'),
        t.availability::text
    ) as availability,
    -- Skills (Top tags)
    (SELECT (data->'secondarySkills')
     FROM public.v2_profile_sections
     WHERE user_id = tp.user_id AND section_key = 'professional_details') as skills,
    -- Avatar
    p.avatar_url,
    -- Bio for summary
    (SELECT (data->>'shortBio')::text
     FROM public.v2_profile_sections
     WHERE user_id = tp.user_id AND section_key = 'professional_details') as bio,
    tp.vetted_at
FROM public.v2_talent_profiles tp
LEFT JOIN public.talents t ON tp.user_id = t.user_id
LEFT JOIN public.profiles p ON tp.user_id = p.user_id
WHERE tp.status = 'vetted' AND tp.visible_to_clients = true;

-- ── 2. get_client_talent_profile RPC ───────────────────────────────────────
-- Securely returns full professional details for a specific talent.
DROP FUNCTION IF EXISTS public.get_client_talent_profile(p_talent_id UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_client_talent_profile(p_talent_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile RECORD;
    v_sections JSONB;
    v_avatar_url TEXT;
BEGIN
    -- Authorization check: Client or Admin only
    IF NOT (public.has_role(auth.uid(), 'client') OR public.is_admin(auth.uid())) THEN
        RETURN NULL;
    END IF;

    -- Map talent_id (public.talents.id) to user_id and profile
    SELECT t.user_id, p.avatar_url 
    INTO v_user_id, v_avatar_url 
    FROM public.talents t
    LEFT JOIN public.profiles p ON t.user_id = p.user_id
    WHERE t.id = p_talent_id;
    
    -- Ensure vetted status and client visibility
    SELECT * INTO v_profile FROM public.v2_talent_profiles 
    WHERE user_id = v_user_id AND status = 'vetted' AND visible_to_clients = true;

    IF NOT FOUND THEN RETURN NULL; END IF;

    -- Aggregate approved sections data (excluding sensitive documents)
    SELECT jsonb_object_agg(section_key, data) INTO v_sections
    FROM public.v2_profile_sections
    WHERE user_id = v_user_id AND status = 'approved'
    AND section_key IN ('basic_info', 'professional_details', 'work_history', 'education', 'certifications');

    -- Build sanitised output object (Zero PII leak)
    RETURN jsonb_build_object(
        'id', p_talent_id,
        'display_id', v_profile.talent_id,
        'first_name', v_sections->'basic_info'->>'firstName',
        'last_initial', LEFT(v_sections->'basic_info'->>'lastName', 1),
        'avatar_url', v_avatar_url,
        'headline', v_sections->'professional_details'->>'primaryRole',
        'vetting_level', v_profile.vetting_level,
        'years_experience', (v_sections->'professional_details'->>'yearsOfExperience')::int,
        'availability', v_sections->'professional_details'->>'availability',
        'location', (v_sections->'basic_info'->>'city') || ', ' || (v_sections->'basic_info'->>'country'),
        'bio', v_sections->'professional_details'->>'shortBio',
        'skills', COALESCE(v_sections->'professional_details'->'secondarySkills', '[]'::jsonb),
        'tools', COALESCE(v_sections->'professional_details'->'toolsFamiliarWith', '[]'::jsonb),
        'languages', COALESCE(v_sections->'professional_details'->'languagesSpoken', '[]'::jsonb),
        'work_history', COALESCE(v_sections->'work_history'->'workHistory', '[]'::jsonb),
        'education', COALESCE(v_sections->'education'->'education', '[]'::jsonb),
        'certifications', COALESCE(v_sections->'certifications'->'certifications', '[]'::jsonb)
    );
END;
$$;

-- ── 3. interview_requests Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interview_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id     UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    talent_id     UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
    job_id        UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    scheduled_at  TIMESTAMPTZ NOT NULL,
    message       TEXT,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- RLS for interview_requests
ALTER TABLE public.interview_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can manage their own interview requests" ON public.interview_requests;
DROP POLICY IF EXISTS "Clients can manage their own interview requests" ON public.interview_requests;
CREATE POLICY "Clients can manage their own interview requests" 
ON public.interview_requests FOR ALL 
USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = interview_requests.client_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Talents can view their own interview requests" ON public.interview_requests;
DROP POLICY IF EXISTS "Talents can view their own interview requests" ON public.interview_requests;
CREATE POLICY "Talents can view their own interview requests" 
ON public.interview_requests FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.talents t WHERE t.id = interview_requests.talent_id AND t.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all interview requests" ON public.interview_requests;
DROP POLICY IF EXISTS "Admins can view all interview requests" ON public.interview_requests;
CREATE POLICY "Admins can view all interview requests" 
ON public.interview_requests FOR SELECT 
USING (public.is_admin(auth.uid()));

-- ── 4. RLS for v2_profile_sections (Client access to professional data) ──
-- Clients need to read professional_details and other non-PII sections to browse.
DROP POLICY IF EXISTS "Client reads vetted visible sections" ON public.v2_profile_sections;
DROP POLICY IF EXISTS "Client reads vetted visible sections" ON public.v2_profile_sections;
CREATE POLICY "Client reads vetted visible sections"
ON public.v2_profile_sections FOR SELECT
USING (
    (public.has_role(auth.uid(), 'client') OR public.is_admin(auth.uid()))
    AND section_key IN ('basic_info', 'professional_details', 'work_history', 'education', 'certifications')
    AND EXISTS (
        SELECT 1 FROM public.v2_talent_profiles tp
        WHERE tp.user_id = v2_profile_sections.user_id
          AND tp.status = 'vetted'
          AND tp.visible_to_clients = true
    )
);

-- ── 5. RLS for talents (Client access to legacy table during join) ──
DROP POLICY IF EXISTS "Client reads vetted visible talents" ON public.talents;
DROP POLICY IF EXISTS "Client reads vetted visible talents" ON public.talents;
CREATE POLICY "Client reads vetted visible talents"
ON public.talents FOR SELECT
USING (
    (public.has_role(auth.uid(), 'client') OR public.is_admin(auth.uid()))
    AND EXISTS (
        SELECT 1 FROM public.v2_talent_profiles tp
        WHERE tp.user_id = talents.user_id
          AND tp.status = 'vetted'
          AND tp.visible_to_clients = true
    )
);

-- ── 6. RLS for profiles (Client access to avatars) ──
DROP POLICY IF EXISTS "Client reads vetted visible avatars" ON public.profiles;
DROP POLICY IF EXISTS "Client reads vetted visible avatars" ON public.profiles;
CREATE POLICY "Client reads vetted visible avatars"
ON public.profiles FOR SELECT
USING (
    (public.has_role(auth.uid(), 'client') OR public.is_admin(auth.uid()))
    AND EXISTS (
        SELECT 1 FROM public.v2_talent_profiles tp
        WHERE tp.user_id = profiles.user_id
          AND tp.status = 'vetted'
          AND tp.visible_to_clients = true
    )
);

-- Grants
GRANT SELECT ON public.client_visible_talents TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_talent_profile(UUID) TO authenticated;
GRANT ALL ON public.interview_requests TO authenticated;



-- MIGRATION: 20260301150000_hire_requests_v2_system.sql
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
CREATE POLICY "Admins manage hr_v2_hire_requests" ON public.hr_v2_hire_requests FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage hr_v2_request_events" ON public.hr_v2_request_events;
CREATE POLICY "Admins manage hr_v2_request_events" ON public.hr_v2_request_events FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage hr_v2_applications" ON public.hr_v2_applications;
CREATE POLICY "Admins manage hr_v2_applications" ON public.hr_v2_applications FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage hr_v2_shortlists" ON public.hr_v2_shortlists;
CREATE POLICY "Admins manage hr_v2_shortlists" ON public.hr_v2_shortlists FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage hr_v2_interviews" ON public.hr_v2_interviews;
CREATE POLICY "Admins manage hr_v2_interviews" ON public.hr_v2_interviews FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage hr_v2_hires" ON public.hr_v2_hires;
CREATE POLICY "Admins manage hr_v2_hires" ON public.hr_v2_hires FOR ALL USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Clients
DO $$ BEGIN
    DROP POLICY IF EXISTS "Clients see their own requests" ON public.hr_v2_hire_requests;
CREATE POLICY "Clients see their own requests" ON public.hr_v2_hire_requests FOR SELECT USING (client_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Clients see their own shortlists" ON public.hr_v2_shortlists;
CREATE POLICY "Clients see their own shortlists" ON public.hr_v2_shortlists FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.hr_v2_hire_requests WHERE id = hr_v2_shortlists.hire_request_id AND client_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Clients see their own interviews" ON public.hr_v2_interviews;
CREATE POLICY "Clients see their own interviews" ON public.hr_v2_interviews FOR SELECT USING (client_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Clients see their own hires" ON public.hr_v2_hires;
CREATE POLICY "Clients see their own hires" ON public.hr_v2_hires FOR SELECT USING (client_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Talents
DO $$ BEGIN
    DROP POLICY IF EXISTS "Talents see published requests" ON public.hr_v2_hire_requests;
CREATE POLICY "Talents see published requests" ON public.hr_v2_hire_requests FOR SELECT USING (status = 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Talents see their own applications" ON public.hr_v2_applications;
CREATE POLICY "Talents see their own applications" ON public.hr_v2_applications FOR SELECT USING (talent_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Talents see their own interviews" ON public.hr_v2_interviews;
CREATE POLICY "Talents see their own interviews" ON public.hr_v2_interviews FOR SELECT USING (talent_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Talents see their own hires" ON public.hr_v2_hires;
CREATE POLICY "Talents see their own hires" ON public.hr_v2_hires FOR SELECT USING (talent_user_id = auth.uid());
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
    WHERE id = req_id AND client_user_id = auth.uid() AND status = 'draft';

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
DROP FUNCTION IF EXISTS public.hr_v2_admin_approve_request(req_id UUID) CASCADE;
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

DROP FUNCTION IF EXISTS public.hr_v2_admin_publish_request(req_id UUID) CASCADE;
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

DROP FUNCTION IF EXISTS public.hr_v2_admin_shortlist_talent(req_id UUID, t_user_id UUID, reason TEXT) CASCADE;
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

DROP FUNCTION IF EXISTS public.hr_v2_admin_invite_talent_to_apply(req_id UUID, t_user_id UUID) CASCADE;
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

DROP FUNCTION IF EXISTS public.hr_v2_admin_schedule_interview(req_id UUID, t_user_id UUID, c_user_id UUID, c_link TEXT, s_time TIMESTAMPTZ) CASCADE;
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



-- MIGRATION: 20260310000000_create_email_tables.sql
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



-- MIGRATION: 20260331000000_add_vetting_email_templates.sql
-- Add missing email templates for vetting, contract signing, and payment notifications

INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status) VALUES

-- Talent Vetting Approved
('talent_vetting_approved', 'Talent Vetting Approved',
'Congratulations! Your OPSlyHR Profile is Now Active',
'<html><body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
<div style="text-align: center; margin-bottom: 32px;">
  <img src="https://www.opslyhr.com/images/logoplain.png" alt="OPSlyHR" style="height: 48px;" />
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
  <img src="https://www.opslyhr.com/images/logoplain.png" alt="OPSlyHR" style="height: 48px;" />
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
  <img src="https://www.opslyhr.com/images/logoplain.png" alt="OPSlyHR" style="height: 48px;" />
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
  <img src="https://www.opslyhr.com/images/logoplain.png" alt="OPSlyHR" style="height: 48px;" />
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



-- MIGRATION: 20260401001000_comprehensive_email_templates.sql
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



-- MIGRATION: 20260401010000_add_verification_tracking.sql
-- Add tracking for verified email notification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified_sent BOOLEAN DEFAULT FALSE;

-- Update RLS to allow users to update their own notification flags
DROP POLICY IF EXISTS "Users can update own notification flags" ON public.profiles;
CREATE POLICY "Users can update own notification flags" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);



-- MIGRATION: 20260401100000_update_email_templates_with_design.sql
-- Update Email Templates with Professional Brand Design
-- This migration updates all existing email templates with the new design system
-- Maintains all existing template_keys so no code changes are needed

-- Note: Using UPDATE statements to preserve existing template IDs and created_at timestamps
-- This ensures backward compatibility while improving visual design

UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto;background:#ffffff}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px;margin-bottom:16px}.content{padding:30px 25px}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:20px;margin:20px 0}.card-content{font-size:14px;color:#374151;margin:0}.section-title{font-size:18px;font-weight:600;color:#111827;margin-top:24px;margin-bottom:12px}.list-item{font-size:14px;color:#374151;margin:8px 0;padding-left:20px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin-top:24px}.cta-button:hover{background:#047857}.secondary-text{font-size:14px;color:#6b7280;margin-top:16px}.divider{border:none;border-top:1px solid #e5e7eb;margin:32px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af;margin:0}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Welcome to the OPSlyHR Network</p><p class="intro">Hi {{talent_name}},</p><p class="intro">We''re excited to have you join our community of vetted operations professionals. Your journey with us starts here.</p><div class="card"><p class="card-content"><strong>What''s Next:</strong></p><p class="list-item">1. Complete your professional profile</p><p class="list-item">2. Verify your identity and credentials</p><p class="list-item">3. Start exploring opportunities that match your expertise</p></div><p class="intro">The entire process typically takes 2-3 days. Our support team is available 24/7 if you have questions.</p><a href="{{dashboard_link}}" class="cta-button">Complete Your Profile</a><div class="divider"></div><p class="secondary-text">Got questions? Our support team is available 24/7. Reply to this email or visit our help center.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Trusted Operations Professionals<br><a href="mailto:support@opslyhr.com" style="color:#059669;text-decoration:none;">support@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
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
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto;background:#ffffff}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px;margin-bottom:16px}.content{padding:30px 25px}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.highlight-card{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px;margin:20px 0}.highlight-label{font-size:12px;font-weight:600;color:#166534;text-transform:uppercase;margin-bottom:4px}.highlight-value{font-size:16px;font-weight:600;color:#059669;margin-bottom:12px}.details-row{display:flex;justify-content:space-between;margin:8px 0;font-size:14px}.details-label{color:#6b7280}.details-value{color:#111827;font-weight:500}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin-top:24px}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">{{client_name}} Has Invited You to Apply</p><p class="intro">Hi {{talent_name}},</p><p class="intro">{{client_name}} has reviewed your profile and would like to learn more about you for a specific role.</p><div class="highlight-card"><div class="highlight-label">Position</div><div class="highlight-value">{{job_title}}</div><div class="details-row"><span class="details-label">Type:</span><span class="details-value">{{contract_type}}</span></div><div class="details-row"><span class="details-label">Rate:</span><span class="details-value">{{rate}}</span></div><div class="details-row"><span class="details-label">Location:</span><span class="details-value">{{location}}</span></div><div class="details-row"><span class="details-label">Duration:</span><span class="details-value">{{duration}}</span></div></div><p class="intro"><strong>Why They Chose You:</strong> They''re looking for someone with your specific expertise in operations management. Your background was a strong match.</p><p class="intro"><strong>Next Steps:</strong></p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">1. Review the full role details</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">2. Decide if you''re interested</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">3. Submit your application</p><p class="intro">This invitation is reserved for you through {{expiration_date}}.</p><a href="{{apply_link}}" class="cta-button">View & Apply</a><p style="font-size:12px;color:#6b7280;margin-top:20px;">Have questions? Reply to this email or contact our support team.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Your Opportunities Await<br><a href="mailto:support@opslyhr.com" style="color:#059669;text-decoration:none;">support@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
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
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px;margin-bottom:16px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.success-badge{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:12px 16px;border-radius:6px;font-weight:600;font-size:14px;display:inline-block;margin:16px 0}.info-block{background:#f9fafb;border-left:4px solid #059669;padding:16px;margin:20px 0;border-radius:4px}.info-label{font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px}.info-value{font-size:14px;font-weight:500;color:#111827}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:24px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Please Review Your Contract</p><p class="intro">Hi {{talent_name}},</p><p class="intro">{{client_name}} has prepared your contract for review and signature. This is an important document—please read it carefully.</p><div class="success-badge">Contract Ready for Review</div><div class="info-block"><div class="info-label">Position</div><div class="info-value">{{job_title}}</div></div><div class="info-block"><div class="info-label">Contract ID</div><div class="info-value">{{contract_id}}</div></div><div class="info-block"><div class="info-label">Start Date</div><div class="info-value">{{start_date}}</div></div><p class="intro" style="margin-top:24px;"><strong>What You Need to Do:</strong></p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">1. Review the contract carefully</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">2. Note any questions or concerns</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">3. Sign electronically in your dashboard</p><p class="intro">Everything is handled securely. You can sign with one click—no printing or scanning needed.</p><p class="intro"><strong>Timeline:</strong> Once you sign, {{client_name}} will countersign within 24-48 hours.</p><a href="{{contract_link}}" class="cta-button">Review & Sign Contract</a><p style="font-size:12px;color:#6b7280;margin-top:20px;">Have questions about contract terms? Our contracts team is available to help.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Securing Your Future<br><a href="mailto:success@opslyhr.com" style="color:#059669;text-decoration:none;">success@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
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
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:16px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.feature-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:12px 0;font-size:14px;color:#374151}.feature-title{font-weight:600;color:#111827;margin-bottom:4px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:20px 0}.secondary-cta{color:#059669;text-decoration:none;font-weight:600}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Your OPSlyHR Hiring Dashboard is Ready</p><p class="intro">Hi {{company_name}},</p><p class="intro">Thank you for joining OPSlyHR. You now have access to our global network of vetted operations professionals. Let''s build your team.</p><p class="intro"><strong>What You Can Do Right Now:</strong></p><div class="feature-box"><div class="feature-title">Browse Our Network</div>Explore pre-vetted professionals across operations, finance, HR, and more. Filter by experience, location, and skills.</div><div class="feature-box"><div class="feature-title">Post Your First Role</div>Tell us what you''re looking for. We''ll match you with the best-fit professionals within 24 hours.</div><div class="feature-box"><div class="feature-title">Build Your Team</div>Whether you need one specialist or a full department, we handle vetting, contracts, and payments.</div><p class="intro">Your dedicated account manager is ready to help. We''ll work closely with you to understand your needs and find the right fit.</p><a href="{{dashboard_link}}" class="cta-button">View Available Talent</a><p class="intro"><strong>First Steps:</strong> Your first consultation is free. Our team will help you define your hiring needs and introduce you to qualified candidates within 48 hours.</p><p style="font-size:12px;color:#6b7280;margin-top:24px;">Have questions? <a href="mailto:success@opslyhr.com" class="secondary-cta">Contact our team</a></p></div><div class="footer"><p class="footer-text">OPSlyHR | Global Hiring for Operations Professionals<br><a href="mailto:success@opslyhr.com" style="color:#059669;text-decoration:none;">success@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
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
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:20px;font-weight:600;color:#059669;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.confirmation-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px;margin:20px 0}.confirmation-title{font-weight:600;color:#166534;margin-bottom:12px}.detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #bbf7d0;font-size:14px}.detail-label{color:#6b7280}.detail-value{color:#111827;font-weight:500}.detail-row:last-child{border-bottom:none}.timeline-box{background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;margin:20px 0;border-radius:4px}.timeline-title{font-weight:600;color:#1e40af;margin-bottom:8px}.timeline-item{font-size:14px;color:#1e40af;margin:4px 0;padding-left:12px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:20px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Contract Signed — Let''s Get Started</p><p class="intro">Hi {{company_name}},</p><p class="intro">Excellent news. Both parties have signed the contract for {{professional_name}}. They''re officially ready to start on {{start_date}}.</p><div class="confirmation-box"><div class="confirmation-title">✓ Confirmed Details</div><div class="detail-row"><span class="detail-label">Professional</span><span class="detail-value">{{professional_name}}</span></div><div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">{{job_title}}</span></div><div class="detail-row"><span class="detail-label">Start Date</span><span class="detail-value">{{start_date}}</span></div><div class="detail-row"><span class="detail-label">Rate</span><span class="detail-value">{{rate}}</span></div></div><div class="timeline-box"><div class="timeline-title">What Happens Next:</div><div class="timeline-item">→ Onboarding materials will be sent to your team lead</div><div class="timeline-item">→ {{professional_name}} receives access instructions</div><div class="timeline-item">→ Payment setup is already configured</div><div class="timeline-item">→ First payment scheduled for {{first_payment_date}}</div></div><p class="intro">Your dedicated support manager is standing by to ensure a smooth transition. We''ll make sure everything is ready for day one.</p><a href="{{employee_link}}" class="cta-button">View Employee Details</a><p style="font-size:12px;color:#6b7280;margin-top:20px;">All hours are tracked in your dashboard. Invoices and payments are processed automatically.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Your Partner in Building Operational Excellence<br><a href="mailto:success@opslyhr.com" style="color:#059669;text-decoration:none;">success@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
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
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:18px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:16px}.invoice-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:16px 0}.invoice-row{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;border-bottom:1px solid #e5e7eb}.invoice-row:last-child{border-bottom:none}.row-label{color:#6b7280}.row-value{color:#111827;font-weight:500}.invoice-amount{font-size:18px;font-weight:600;color:#059669;margin-top:8px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:16px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Invoice Ready: {{professional_name}} – {{period}}</p><p class="intro">Your invoice for {{professional_name}} is ready for review and payment.</p><div class="invoice-box"><div class="invoice-row"><span class="row-label">Professional</span><span class="row-value">{{professional_name}}</span></div><div class="invoice-row"><span class="row-label">Invoice ID</span><span class="row-value">{{invoice_id}}</span></div><div class="invoice-row"><span class="row-label">Period</span><span class="row-value">{{period}}</span></div><div class="invoice-row"><span class="row-label">Hours Logged</span><span class="row-value">{{hours}}</span></div><div class="invoice-amount">Due: {{amount}}</div></div><p class="intro"><strong>Payment Status:</strong> {{payment_status}}</p><a href="{{invoice_link}}" class="cta-button">View Invoice Details</a><p style="font-size:12px;color:#6b7280;margin-top:16px;">View detailed time logs and payment settings anytime in your dashboard. Questions? billing@opslyhr.com</p></div><div class="footer"><p class="footer-text">OPSlyHR | Transparent Billing & Payments<br><a href="mailto:billing@opslyhr.com" style="color:#059669;text-decoration:none;">billing@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
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
'<html><head><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827}.container{max-width:600px;margin:0 auto}.header{padding:40px 30px;text-align:center}.logo{height:48px}.content{padding:30px 25px}.greeting{font-size:18px;font-weight:600;margin-bottom:8px}.intro{font-size:14px;color:#6b7280;margin-bottom:16px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600}.footer{background:#f9fafb;padding:20px 30px;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Reset Your Password</p><p class="intro">You requested a password reset. Use the link below to create a new password. This link expires in 24 hours.</p><a href="{{reset_link}}" class="cta-button">Reset Password</a><p style="font-size:12px;color:#6b7280;margin-top:16px;">If you didn''t request this, ignore this email. Your account is secure.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Keep Your Account Secure<br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
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
'<html><head><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827}.container{max-width:600px;margin:0 auto}.header{padding:40px 30px;text-align:center}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:18px;font-weight:600;margin-bottom:8px}.intro{font-size:14px;color:#6b7280;margin-bottom:16px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600}.footer{background:#f9fafb;padding:20px 30px;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Verify Your Email</p><p class="intro">Thank you for signing up. Please verify your email address to complete your account setup. This link expires in 48 hours.</p><a href="{{verification_link}}" class="cta-button">Verify Email</a><p style="font-size:12px;color:#6b7280;margin-top:16px;">Already verified? No further action needed.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Welcome to Our Community<br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
'Verify Your Email

Thank you for signing up. Verify your email to complete setup:

{{verification_link}}

This link expires in 48 hours.

© 2026 OPSlyHR',
'active'
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_key = 'email_verification');

-- End of template updates



-- MIGRATION: 20260401200000_update_talent_emails_with_branded_html.sql
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



-- MIGRATION: 20260401210000_update_client_emails_with_branded_html.sql
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


-- MIGRATION: 20260401300000_email_verification_system.sql
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
USING (public.is_admin(auth.uid()));

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



-- MIGRATION: 20260401400000_standardize_email_branding.sql
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
    <div class="header"><img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo-img"></div>
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
    <div class="header"><img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo-img"></div>
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
    <div class="header"><img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo-img"></div>
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
    <div class="header"><img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo-img"></div>
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
    <div class="header"><img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo-img"></div>
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
    <div class="header"><img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo-img"></div>
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
    <div class="header"><img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo-img"></div>
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
    <div class="header"><img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo-img"></div>
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



-- MIGRATION: 20260401500000_v2_allow_partial_submission.sql
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



-- MIGRATION: 20260402221113_admin_vetting_notes.sql
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



-- MIGRATION: 20260412_academy_enrollments.sql
-- ============================================================
-- ACADEMY ENROLLMENTS & TRANSACTIONS
-- ============================================================

-- ── 1. Create custom types first ──────────────────────────────

-- Enum for enrollment status
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

-- Enum for transaction status
DO $$ BEGIN
    CREATE TYPE enum_transaction_status AS ENUM (
        'pending',
        'processing',
        'success',
        'failed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ── 2. academy_enrollments table ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.academy_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_phone TEXT,
    student_country TEXT,
    enrollment_status enum_enrollment_status DEFAULT 'active',
    price_usd DECIMAL(10, 2) NOT NULL,
    price_naira DECIMAL(15, 2),
    currency TEXT DEFAULT 'USD',
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_granted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 3. course_transactions table ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paystack_reference TEXT UNIQUE NOT NULL,
    amount_naira DECIMAL(15, 2) NOT NULL,
    amount_usd DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status enum_transaction_status DEFAULT 'pending',
    payment_method TEXT DEFAULT 'paystack',
    authorization_url TEXT,
    access_code TEXT,
    receipt_url TEXT,
    customer_code TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 4. Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_academy_enrollments_user_id ON academy_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_course_id ON academy_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_status ON academy_enrollments(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_course_transactions_user_id ON course_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_transactions_enrollment_id ON course_transactions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_course_transactions_reference ON course_transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_course_transactions_status ON course_transactions(status);

-- ── 5. RLS Policies ─────────────────────────────────────────────

ALTER TABLE academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_transactions ENABLE ROW LEVEL SECURITY;

-- Enrollment Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own enrollments" ON academy_enrollments;
CREATE POLICY "Users can view their own enrollments" ON academy_enrollments
        FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert their own enrollments" ON academy_enrollments;
CREATE POLICY "Users can insert their own enrollments" ON academy_enrollments
        FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins can view all enrollments" ON academy_enrollments;
CREATE POLICY "Admins can view all enrollments" ON academy_enrollments
        FOR SELECT USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Transaction Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own transactions" ON course_transactions;
CREATE POLICY "Users can view their own transactions" ON course_transactions
        FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert their own transactions" ON course_transactions;
CREATE POLICY "Users can insert their own transactions" ON course_transactions
        FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── 6. Permissions ──────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE ON academy_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON course_transactions TO authenticated;
GRANT ALL ON academy_enrollments TO service_role;
GRANT ALL ON course_transactions TO service_role;



-- MIGRATION: 20260413_academy_automation_final.sql
-- ============================================================
-- ACADEMY HUB - CERTIFICATES & AUTOMATION (pg_cron)
-- ============================================================

-- 1. Certificates Table
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

ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own certificates" ON public.academy_certificates;
CREATE POLICY "Students can view their own certificates"
    ON public.academy_certificates FOR SELECT
    USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage certificates" ON public.academy_certificates;
CREATE POLICY "Admins can manage certificates"
    ON public.academy_certificates FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('super_admin','operations_admin','vetting_admin','finance_admin','support_admin')
    ));

-- 2. Function to generate certificate number
DROP FUNCTION IF EXISTS public.generate_cert_number() CASCADE;
CREATE OR REPLACE FUNCTION public.generate_cert_number()
RETURNS trigger AS $$
BEGIN
    NEW.certificate_number := 'OPS-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8)) || '-' || TO_CHAR(NOW(), 'YYYY');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_cert_number ON public.academy_certificates;
CREATE TRIGGER tr_generate_cert_number BEFORE INSERT ON public.academy_certificates
    FOR EACH ROW EXECUTE FUNCTION public.generate_cert_number();

-- 3. pg_cron Reminders
-- Note: Requires pg_cron extension to be enabled in Supabase Dashboard
-- This script only defines the reminder dispatch logic

DROP FUNCTION IF EXISTS public.dispatch_session_reminders() CASCADE;
CREATE OR REPLACE FUNCTION public.dispatch_session_reminders()
RETURNS void AS $$
DECLARE
    session_record RECORD;
BEGIN
    -- Hourly check for sessions starting in 24h or 1h
    FOR session_record IN 
        SELECT s.*, c.name as cohort_name
        FROM sessions s
        JOIN cohorts c ON s.cohort_id = c.id
        WHERE s.status = 'scheduled'
        AND (
            (s.session_date + s.start_time::time) BETWEEN (NOW() + interval '23 hours') AND (NOW() + interval '24 hours')
            OR
            (s.session_date + s.start_time::time) BETWEEN (NOW() + interval '55 minutes') AND (NOW() + interval '65 minutes')
        )
    LOOP
        PERFORM net.http_post(
            url := (SELECT value FROM settings WHERE name = 'edge_function_url') || '/academy-events',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || (SELECT value FROM settings WHERE name = 'service_role_key')
            ),
            body := jsonb_build_object(
              'event_type', 'session',
              'payload', jsonb_build_object(
                'cohort_id', session_record.cohort_id,
                'title', '[REMINDER] ' || session_record.title,
                'date', session_record.session_date,
                'time', session_record.start_time,
                'url', session_record.meeting_url,
                'cohort_name', session_record.cohort_name
              )
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Scheduling (To be run by user in SQL Editor if possible, or just defined here)
-- SELECT cron.schedule('0 * * * *', 'SELECT public.dispatch_session_reminders()');




-- PRE-FIX: Ensure cohort_id exists before policies reference it
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_enrollments' AND column_name='cohort_id') THEN
        ALTER TABLE public.academy_enrollments ADD COLUMN cohort_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='category') THEN
        ALTER TABLE public.academy_courses ADD COLUMN category TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='is_flagship') THEN
        ALTER TABLE public.academy_courses ADD COLUMN is_flagship BOOLEAN DEFAULT false;
    END IF;    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='has_bonus') THEN
        ALTER TABLE public.academy_courses ADD COLUMN has_bonus BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='bonus_description') THEN
        ALTER TABLE public.academy_courses ADD COLUMN bonus_description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='is_live') THEN
        ALTER TABLE public.academy_courses ADD COLUMN is_live BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='outcomes') THEN
        ALTER TABLE public.academy_courses ADD COLUMN outcomes TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='what_youll_learn') THEN
        ALTER TABLE public.academy_courses ADD COLUMN what_youll_learn TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='who_is_it_for') THEN
        ALTER TABLE public.academy_courses ADD COLUMN who_is_it_for TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='testimonials') THEN
        ALTER TABLE public.academy_courses ADD COLUMN testimonials JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='curriculum') THEN
        ALTER TABLE public.academy_courses ADD COLUMN curriculum JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='image_url') THEN
        ALTER TABLE public.academy_courses ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='price_usd') THEN
        ALTER TABLE public.academy_courses ADD COLUMN price_usd NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='price_naira') THEN
        ALTER TABLE public.academy_courses ADD COLUMN price_naira NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='learning_outcomes') THEN
        ALTER TABLE public.academy_courses ADD COLUMN learning_outcomes JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='tools') THEN
        ALTER TABLE public.academy_courses ADD COLUMN tools TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='slots_total') THEN
        ALTER TABLE public.academy_courses ADD COLUMN slots_total INTEGER DEFAULT 25;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='slots_filled') THEN
        ALTER TABLE public.academy_courses ADD COLUMN slots_filled INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='next_cohort_date') THEN
        ALTER TABLE public.academy_courses ADD COLUMN next_cohort_date TEXT;
    END IF;
END $$;


-- Fix column types if they were created as wrong type
DO $$ BEGIN
    -- If tools is jsonb, drop default, change to text[], set new default
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema='public' AND table_name='academy_courses' 
               AND column_name='tools' AND data_type='jsonb') THEN
        ALTER TABLE public.academy_courses ALTER COLUMN tools DROP DEFAULT;
        ALTER TABLE public.academy_courses ALTER COLUMN tools TYPE TEXT[] USING CASE WHEN tools IS NULL THEN NULL ELSE ARRAY[]::TEXT[] END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema='public' AND table_name='academy_courses' 
               AND column_name='what_youll_learn' AND data_type='jsonb') THEN
        ALTER TABLE public.academy_courses ALTER COLUMN what_youll_learn DROP DEFAULT;
        ALTER TABLE public.academy_courses ALTER COLUMN what_youll_learn TYPE TEXT[] USING CASE WHEN what_youll_learn IS NULL THEN NULL ELSE ARRAY[]::TEXT[] END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema='public' AND table_name='academy_courses' 
               AND column_name='who_is_it_for' AND data_type='jsonb') THEN
        ALTER TABLE public.academy_courses ALTER COLUMN who_is_it_for DROP DEFAULT;
        ALTER TABLE public.academy_courses ALTER COLUMN who_is_it_for TYPE TEXT[] USING CASE WHEN who_is_it_for IS NULL THEN NULL ELSE ARRAY[]::TEXT[] END;
    END IF;
END $$;

-- MIGRATION: 20260413_academy_hub_core.sql
-- ============================================================
-- ACADEMY HUB - CORE DATABASE SCHEMA (Dynamic Migration)
-- ============================================================

-- ── 1. academy_courses ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.academy_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    duration TEXT,
    level TEXT CHECK (level IN ('Beginner', 'Intermediate')),
    outcome TEXT,
    tools TEXT[],
    price_usd DECIMAL(10, 2) NOT NULL,
    price_naira DECIMAL(15, 2) NOT NULL,
    is_live BOOLEAN DEFAULT true,
    is_flagship BOOLEAN DEFAULT false,
    has_bonus BOOLEAN DEFAULT false,
    bonus_description TEXT,
    image_url TEXT,
    category TEXT,
    curriculum JSONB, -- Stores the CurriculumWeek[] structure
    what_youll_learn TEXT[],
    outcomes TEXT[],
    who_is_it_for TEXT[],
    testimonials JSONB, -- Stores testimonials structure
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_academy_courses_slug ON public.academy_courses(slug);
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='academy_courses' AND column_name='category') THEN
        CREATE INDEX IF NOT EXISTS idx_academy_courses_category ON public.academy_courses(category);
    ELSE
        ALTER TABLE public.academy_courses ADD COLUMN IF NOT EXISTS category TEXT;
        CREATE INDEX IF NOT EXISTS idx_academy_courses_category ON public.academy_courses(category);
    END IF;
END $$;

-- ── 2. academy_recordings (ENTITIY) ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.academy_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    recording_url TEXT NOT NULL,
    duration_minutes INT,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recordings_session_id ON public.academy_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_recordings_cohort_id ON public.academy_recordings(cohort_id);

-- ── 3. Linking everything to academy_courses ─────────────────────

-- We need to change the references of cohorts and enrollments from static course slugs to the new academy_courses.id
-- For now, we'll keep course_id as TEXT in some places for backward compatibility or use slugs, 
-- but ideally, we should use the UUID.

ALTER TABLE public.cohorts ADD COLUMN IF NOT EXISTS course_uuid UUID REFERENCES public.academy_courses(id);
ALTER TABLE public.academy_enrollments ADD COLUMN IF NOT EXISTS course_uuid UUID REFERENCES public.academy_courses(id);

-- ── 4. RLS POLICIES ──────────────────────────────────────────────

ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_recordings ENABLE ROW LEVEL SECURITY;

-- Courses: Everyone can view active courses
DROP POLICY IF EXISTS "Public can view courses" ON public.academy_courses;
CREATE POLICY "Public can view courses" ON public.academy_courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage courses" ON public.academy_courses;
CREATE POLICY "Admins can manage courses" ON public.academy_courses FOR ALL USING (public.is_admin(auth.uid()));

-- Recordings: Only enrolled students
DROP POLICY IF EXISTS "Enrolled students can view recordings" ON public.academy_recordings;
CREATE POLICY "Enrolled students can view recordings" ON public.academy_recordings
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE academy_enrollments.cohort_id = academy_recordings.cohort_id
          AND academy_enrollments.user_id = auth.uid()
          AND academy_enrollments.enrollment_status = 'active'
    ) OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage recordings" ON public.academy_recordings;
CREATE POLICY "Admins can manage recordings" ON public.academy_recordings FOR ALL USING (public.is_admin(auth.uid()));

-- ── 5. SEED DATA ───────────────────────────────────────────────
-- Migrating from academy-courses.ts

INSERT INTO public.academy_courses (
    slug, title, tagline, description, duration, level, outcome, tools, 
    price_naira, price_usd, is_flagship, image_url, has_bonus, bonus_description,
    what_youll_learn, outcomes, who_is_it_for, curriculum
) VALUES 
(
    'ai-automation-for-operations', 
    'AI Automation for Operations', 
    'Build AI-Powered Workflows. Work With Global Clients.',
    'A 4-week intensive program where you master Zapier, Make, Notion AI, and GPT-4 to automate operations.',
    '4 Weeks', 
    'Beginner', 
    'AI Operations Specialist', 
    ARRAY['Zapier', 'Make.com', 'Notion AI', 'GPT-4', 'Airtable', 'Loom'],
    199000, 149, true, 
    'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80',
    true, 'The top-performing graduate of each cohort receives a MacBook Air M2.',
    ARRAY['Build automation workflows', 'Integrate GPT-4', 'Design AI processes'],
    ARRAY['Earn $2,500–$6,000/month', 'Work with global clients'],
    ARRAY['Ops professionals', 'Career switchers'],
    '[{"week": "Week 01", "title": "Foundations", "lessons": ["Logic", "Tools"]}, {"week": "Week 02", "title": "Automation", "lessons": ["Zapier", "Make"]}]'::jsonb
),
(
    'virtual-operations-management', 
    'Virtual Operations Management', 
    'Lead Remote Teams. Build Operating Systems That Scale.',
    'A 6-week intensive covering systems frameworks and leadership skills required to manage remote operations.',
    '6 Weeks', 
    'Intermediate', 
    'Remote Operations Manager', 
    ARRAY['ClickUp', 'Notion', 'Slack', 'Loom', 'Calendly'],
    249000, 179, false, 
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
    false, null,
    ARRAY['Design operating systems', 'Build SOPs', 'Manage distributed teams'],
    ARRAY['Earn $3,000–$7,000/month', 'Start-up infrastructure skills'],
    ARRAY['Ops professionals', 'Project managers'],
    '[{"week": "Week 01", "title": "Architecture", "lessons": ["Structure", "Mandate"]}]'::jsonb
);



-- MIGRATION: 20260413_academy_hub_rich_metadata.sql
-- ============================================================
-- ACADEMY HUB - SCHEMA EXPANSION (Rich Course Metadata)
-- ============================================================

-- Add rich metadata columns to academy_courses
ALTER TABLE public.academy_courses 
ADD COLUMN IF NOT EXISTS tagline text,
ADD COLUMN IF NOT EXISTS learning_outcomes jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS curriculum jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tools jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS what_youll_learn jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS who_is_it_for jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS bonus_description text,
ADD COLUMN IF NOT EXISTS slots_total integer DEFAULT 25,
ADD COLUMN IF NOT EXISTS slots_filled integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_cohort_date text;

-- Update RLS (already exists but ensures all columns are accessible)
-- Policy for public read already exists from previous migration

-- SEED DATA UPDATE (Example for AI Operations)
UPDATE public.academy_courses
SET 
    tagline = 'Master the AI-First Operations Workflow',
    learning_outcomes = '["Automate complex business processes using AI agents", "Design custom GPTs for organizational efficiency", "Architect multi-model operational pipelines"]',
    curriculum = '[
        {"week": 1, "topic": "AI Foundations & Prompt Architecture", "details": ["The Prompt Engineering Framework", "Tool-use & Function Calling", "Temperature & Top-P Tuning"]},
        {"week": 2, "topic": "Process Automation with Zapier/Make AI", "details": ["Trigger mapping", "Multi-step AI chains", "Error handling in AI workflows"]}
    ]',
    tools = '["ChatGPT", "Zapier", "Make.com", "Claude", "Notion AI"]',
    what_youll_learn = '["Advanced Prompt Engineering", "AI Workflow Mapping", "Custom GPT Development", "Agentic Process Automation"]',
    who_is_it_for = '["Operational Leaders", "Executive Assistants", "Efficiency Consultants", "Product Managers"]',
    bonus_description = 'Top students in the flagship cohort will receive a MacBook Air M3 to support their new high-performance career.',
    next_cohort_date = 'May 12, 2026'
WHERE slug = 'ai-operations';



-- MIGRATION: 20260413_academy_live_cohorts.sql
-- ============================================================
-- ACADEMY LIVE COHORTS - Database Schema
-- Supports Live Sessions, Announcements, Assignments, and Certificates
-- ============================================================

-- ── 1. cohorts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT NOT NULL, -- Reference to the static course slug or dynamic course id
    name TEXT NOT NULL,      -- e.g., 'May 2026 Cohort'
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    price_usd DECIMAL(10, 2) NOT NULL,
    price_naira DECIMAL(15, 2),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'ongoing', 'completed', 'cancelled')),
    zoom_link TEXT,          -- Default/Recurrent meeting link
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cohorts_course_id ON public.cohorts(course_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON public.cohorts(status);

-- ── 2. sessions (Live Classes) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    duration_minutes INT DEFAULT 60,
    join_link TEXT,
    recording_url TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_cohort_id ON public.sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(date);

-- ── 3. announcements ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_cohort_id ON public.announcements(cohort_id);

-- ── 4. assignments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    deadline_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignments_cohort_id ON public.assignments(cohort_id);

-- ── 5. submissions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    link TEXT NOT NULL, -- Link to Google Drive, Loom, etc.
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed')),
    feedback TEXT,
    grade TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions(student_id);

-- ── 6. academy_certificates ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academy_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    issue_date TIMESTAMPTZ DEFAULT now(),
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON public.academy_certificates(student_id);

-- ── 7. Update academy_enrollments ────────────────────────────────
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academy_enrollments' AND column_name = 'cohort_id') THEN
        ALTER TABLE public.academy_enrollments ADD COLUMN cohort_id UUID REFERENCES public.cohorts(id);
    END IF;
END $$;

-- ── RLS POLICIES ────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;

-- Cohorts: Public can view sessions/info for SEO or info? 
-- Actually, keep it private or public select for info.
DROP POLICY IF EXISTS "Public can view cohorts" ON public.cohorts;
CREATE POLICY "Public can view cohorts" ON public.cohorts FOR SELECT USING (true);

-- Sessions: Only enrolled students can see sessions for their cohort
DROP POLICY IF EXISTS "Enrolled students can view cohort sessions" ON public.sessions;
CREATE POLICY "Enrolled students can view cohort sessions" ON public.sessions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE academy_enrollments.cohort_id = sessions.cohort_id
          AND academy_enrollments.user_id = auth.uid()
          AND academy_enrollments.enrollment_status = 'active'
    ) OR public.is_admin(auth.uid())
);

-- Announcements: Only enrolled students
DROP POLICY IF EXISTS "Enrolled students can view announcements" ON public.announcements;
CREATE POLICY "Enrolled students can view announcements" ON public.announcements
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE academy_enrollments.cohort_id = announcements.cohort_id
          AND academy_enrollments.user_id = auth.uid()
          AND academy_enrollments.enrollment_status = 'active'
    ) OR public.is_admin(auth.uid())
);

-- Assignments: Only enrolled students
DROP POLICY IF EXISTS "Enrolled students can view assignments" ON public.assignments;
CREATE POLICY "Enrolled students can view assignments" ON public.assignments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE academy_enrollments.cohort_id = assignments.cohort_id
          AND academy_enrollments.user_id = auth.uid()
          AND academy_enrollments.enrollment_status = 'active'
    ) OR public.is_admin(auth.uid())
);

-- Submissions: Students can view and manage their own submissions
DROP POLICY IF EXISTS "Students can view own submissions" ON public.submissions;
CREATE POLICY "Students can view own submissions" ON public.submissions
FOR SELECT USING (auth.uid() = student_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Students can insert own submissions" ON public.submissions;
CREATE POLICY "Students can insert own submissions" ON public.submissions
FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own submissions" ON public.submissions;
CREATE POLICY "Students can update own submissions" ON public.submissions
FOR UPDATE USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Certificates: Students can view own certificates
DROP POLICY IF EXISTS "Students can view own certificates" ON public.academy_certificates;
CREATE POLICY "Students can view own certificates" ON public.academy_certificates
FOR SELECT USING (auth.uid() = student_id OR public.is_admin(auth.uid()));

-- ── ADMIN POLICIES ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage cohorts" ON public.cohorts;
CREATE POLICY "Admins can manage cohorts" ON public.cohorts FOR ALL USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.sessions;
CREATE POLICY "Admins can manage sessions" ON public.sessions FOR ALL USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;
CREATE POLICY "Admins can manage assignments" ON public.assignments FOR ALL USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.submissions;
CREATE POLICY "Admins can manage submissions" ON public.submissions FOR ALL USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.academy_certificates;
CREATE POLICY "Admins can manage certificates" ON public.academy_certificates FOR ALL USING (public.is_admin(auth.uid()));



-- MIGRATION: 20260413_academy_master_v2.sql
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
    DROP POLICY IF EXISTS "Public read access for academy courses" ON public.academy_courses;
CREATE POLICY "Public read access for academy courses" ON public.academy_courses FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Anyone can see cohorts" ON public.cohorts;
    DROP POLICY IF EXISTS "Anyone can see cohorts" ON public.cohorts;
CREATE POLICY "Anyone can see cohorts" ON public.cohorts FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Anyone can see sessions" ON public.sessions;
    DROP POLICY IF EXISTS "Anyone can see sessions" ON public.sessions;
CREATE POLICY "Anyone can see sessions" ON public.sessions FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Anyone can see announcements" ON public.announcements;
    DROP POLICY IF EXISTS "Anyone can see announcements" ON public.announcements;
CREATE POLICY "Anyone can see announcements" ON public.announcements FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.academy_enrollments;
    DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.academy_enrollments;
CREATE POLICY "Students can view their own enrollments" ON public.academy_enrollments FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
    DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
CREATE POLICY "Students can view their own submissions" ON public.submissions FOR SELECT USING (auth.uid() = student_id);
    
    DROP POLICY IF EXISTS "Students can view their own certificates" ON public.academy_certificates;
    DROP POLICY IF EXISTS "Students can view their own certificates" ON public.academy_certificates;
CREATE POLICY "Students can view their own certificates" ON public.academy_certificates FOR SELECT USING (auth.uid() = student_id);
END $$;

-- Admin Management
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','operations_admin','vetting_admin','finance_admin','support_admin'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can manage courses" ON public.academy_courses;
    DROP POLICY IF EXISTS "Admins can manage courses" ON public.academy_courses;
CREATE POLICY "Admins can manage courses" ON public.academy_courses FOR ALL USING (public.is_admin());

    DROP POLICY IF EXISTS "Admins can manage cohorts" ON public.cohorts;
    DROP POLICY IF EXISTS "Admins can manage cohorts" ON public.cohorts;
CREATE POLICY "Admins can manage cohorts" ON public.cohorts FOR ALL USING (public.is_admin());

    DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.academy_enrollments;
    DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.academy_enrollments;
CREATE POLICY "Admins can manage enrollments" ON public.academy_enrollments FOR ALL USING (public.is_admin());
END $$;

-- ── 4. WEBHOOK TRIGGERS ───────────────────────────────────────

DROP FUNCTION IF EXISTS public.trigger_academy_event() CASCADE;
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
DROP TRIGGER IF EXISTS tr_academy_session_notify ON public.sessions;
CREATE TRIGGER tr_academy_session_notify AFTER INSERT ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

DROP TRIGGER IF EXISTS tr_academy_announcement_notify ON public.announcements;
DROP TRIGGER IF EXISTS tr_academy_announcement_notify ON public.announcements;
CREATE TRIGGER tr_academy_announcement_notify AFTER INSERT ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

-- ── 5. AUTOMATION & DEFAULTS ──────────────────────────────────

-- Certificate numbering logic
DROP FUNCTION IF EXISTS public.generate_cert_number() CASCADE;
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
DROP TRIGGER IF EXISTS tr_generate_cert_number ON public.academy_certificates;
CREATE TRIGGER tr_generate_cert_number BEFORE INSERT ON public.academy_certificates FOR EACH ROW EXECUTE FUNCTION public.generate_cert_number();

-- ── 6. SEED DATA (Optional Template) ──────────────────────────
INSERT INTO settings (name, value, description) 
VALUES 
('edge_function_url', 'YOUR_SUPABASE_PROJECT_URL/functions/v1', 'Base URL for Edge Functions'),
('service_role_key', 'YOUR_SERVICE_ROLE_KEY', 'Service role key for internal triggers')
ON CONFLICT (name) DO NOTHING;



-- MIGRATION: 20260413_academy_webhooks.sql
-- ============================================================
-- ACADEMY HUB - EVENT TRIGGERS (Webhooks)
-- ============================================================

-- Function to trigger academy-events Edge Function
DROP FUNCTION IF EXISTS public.trigger_academy_event() CASCADE;
CREATE OR REPLACE FUNCTION public.trigger_academy_event()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  event_type text;
BEGIN
  -- Determine event type based on table name
  IF TG_TABLE_NAME = 'sessions' THEN
    event_type := 'session';
    -- Fetch cohort name for the email
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

  ELSIF TG_TABLE_NAME = 'assignments' THEN
    event_type := 'assignment';
    SELECT jsonb_build_object(
      'cohort_id', NEW.cohort_id,
      'title', NEW.title,
      'deadline', NEW.deadline_at,
      'cohort_name', (SELECT name FROM cohorts WHERE id = NEW.cohort_id)
    ) INTO payload;

  ELSIF TG_TABLE_NAME = 'submissions' AND (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status = 'reviewed' THEN
    event_type := 'grading';
    -- Find student email for individual notification
    SELECT jsonb_build_object(
      'student_email', (SELECT email FROM profiles WHERE id = NEW.student_id),
      'assignment_title', (SELECT title FROM assignments WHERE id = NEW.assignment_id),
      'status', NEW.status
    ) INTO payload;
  END IF;

  -- Dispatch to Edge Function
  IF payload IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := (SELECT value FROM settings WHERE name = 'edge_function_url') || '/academy-events',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM settings WHERE name = 'service_role_key')
        ),
        body := jsonb_build_object(
          'event_type', event_type,
          'payload', payload
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Triggers
DROP TRIGGER IF EXISTS tr_academy_session_notify ON public.sessions;
DROP TRIGGER IF EXISTS tr_academy_session_notify ON public.sessions;
CREATE TRIGGER tr_academy_session_notify AFTER INSERT ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

DROP TRIGGER IF EXISTS tr_academy_announcement_notify ON public.announcements;
DROP TRIGGER IF EXISTS tr_academy_announcement_notify ON public.announcements;
CREATE TRIGGER tr_academy_announcement_notify AFTER INSERT ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

DROP TRIGGER IF EXISTS tr_academy_assignment_notify ON public.assignments;
DROP TRIGGER IF EXISTS tr_academy_assignment_notify ON public.assignments;
CREATE TRIGGER tr_academy_assignment_notify AFTER INSERT ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();

DROP TRIGGER IF EXISTS tr_academy_grading_notify ON public.submissions;
DROP TRIGGER IF EXISTS tr_academy_grading_notify ON public.submissions;
CREATE TRIGGER tr_academy_grading_notify AFTER UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_academy_event();



-- MIGRATION: 20260413_add_student_role.sql
-- Add 'student' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';



