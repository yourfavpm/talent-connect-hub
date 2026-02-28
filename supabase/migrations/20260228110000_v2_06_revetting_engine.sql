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

CREATE POLICY "Talents can view their own audit trail"
    ON public.v2_profile_changes_audit FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit trails"
    ON public.v2_profile_changes_audit FOR SELECT
    USING (public.is_admin(auth.uid()));


-- -----------------------------------------------------------------------------
-- 4. RPC: v2_update_section_post_vet
-- -----------------------------------------------------------------------------
-- Function allowing fully vetted talents to edit their profiles.
-- If they edit a critical section (e.g. skills), it revokes their vetting.
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
