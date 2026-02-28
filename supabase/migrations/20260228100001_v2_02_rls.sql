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
CREATE POLICY "Anyone can read settings"
ON public.app_settings FOR SELECT
USING (true);

CREATE POLICY "Only superadmin can update settings"
ON public.app_settings FOR UPDATE
USING (public.is_admin(auth.uid()));

-- ── v2_talent_profiles ─────────────────────────────────────────────────────
CREATE POLICY "Talent reads own profile"
ON public.v2_talent_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Talent inserts own profile"
ON public.v2_talent_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Talent updates own profile"
ON public.v2_talent_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admin reads all profiles"
ON public.v2_talent_profiles FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin updates all profiles"
ON public.v2_talent_profiles FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Client reads vetted visible profiles"
ON public.v2_talent_profiles FOR SELECT
USING (
    public.has_role(auth.uid(), 'client')
    AND status = 'vetted'
    AND visible_to_clients = true
);

-- ── v2_profile_sections ────────────────────────────────────────────────────
CREATE POLICY "Talent reads own sections"
ON public.v2_profile_sections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Talent inserts own sections"
ON public.v2_profile_sections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Talent updates own sections"
ON public.v2_profile_sections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admin reads all sections"
ON public.v2_profile_sections FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin updates all sections"
ON public.v2_profile_sections FOR UPDATE
USING (public.is_admin(auth.uid()));

-- ── v2_documents ───────────────────────────────────────────────────────────
CREATE POLICY "Talent manages own docs"
ON public.v2_documents FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admin reads all docs"
ON public.v2_documents FOR SELECT
USING (public.is_admin(auth.uid()));

-- ── v2_vetting_actions ─────────────────────────────────────────────────────
CREATE POLICY "Talent reads own actions"
ON public.v2_vetting_actions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admin reads all actions"
ON public.v2_vetting_actions FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin inserts actions"
ON public.v2_vetting_actions FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- ── v2_notifications ───────────────────────────────────────────────────────
CREATE POLICY "User reads own notifications"
ON public.v2_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "User marks own notifications read"
ON public.v2_notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Allow RPCs (running as SECURITY DEFINER) to insert notifications
-- by granting INSERT to authenticated via a permissive policy;
-- the actual insert is done only from trusted RPCs.
CREATE POLICY "System inserts notifications"
ON public.v2_notifications FOR INSERT
WITH CHECK (true);
