-- ============================================================
-- V2 Vetting System – 03: RPC Functions (SECURITY DEFINER)
-- ============================================================

-- ── Helper: recompute progress_percent ─────────────────────────────────────
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
