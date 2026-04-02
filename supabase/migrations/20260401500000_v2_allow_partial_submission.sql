-- ============================================================
-- V2 Vetting System – Update: Allow Partial Submission
-- ============================================================

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
