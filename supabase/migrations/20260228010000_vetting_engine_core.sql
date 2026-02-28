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
CREATE POLICY "Talents can view own profile" 
ON public.talent_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage profiles" 
ON public.talent_profiles FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Clients can view vetted profiles" 
ON public.talent_profiles FOR SELECT 
USING (visibility_to_clients = TRUE);

-- talent_profile_sections
CREATE POLICY "Talents can view own sections" 
ON public.talent_profile_sections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Talents can update own sections if not locked" 
ON public.talent_profile_sections FOR UPDATE 
USING (auth.uid() = user_id AND status IN ('NOT_STARTED', 'COMPLETED', 'CHANGES_REQUESTED'));

CREATE POLICY "Admins can manage sections" 
ON public.talent_profile_sections FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()));

-- vetting_actions
CREATE POLICY "Talents can view own vetting actions" 
ON public.vetting_actions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage vetting actions" 
ON public.vetting_actions FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()));

-- 8. RPC Backend Logic

-- 8.1. update_section_data
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
