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
