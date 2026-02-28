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
