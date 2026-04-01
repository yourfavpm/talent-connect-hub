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
