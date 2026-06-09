-- ============================================================
-- Opsly SaaS Workforce Management Platform
-- Migration: Client Multi-Tenancy, KPIs, Performance, Messaging
-- Created: 2026-06-09
-- ============================================================

-- ── 1. client_members ────────────────────────────────────────
-- Allows multiple users to belong to a single client workspace.
-- The original clients.user_id remains the workspace owner.
CREATE TABLE IF NOT EXISTS public.client_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'manager'
              CHECK (role IN ('owner', 'admin', 'manager')),
  status      TEXT NOT NULL DEFAULT 'invited'
              CHECK (status IN ('invited', 'active', 'suspended')),
  invited_by  UUID REFERENCES auth.users(id),
  invited_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (client_id, user_id)
);

-- ── 2. client_invites ─────────────────────────────────────────
-- Pending email invitations with secure tokens (7-day expiry).
CREATE TABLE IF NOT EXISTS public.client_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'manager'
              CHECK (role IN ('admin', 'manager')),
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by  UUID REFERENCES auth.users(id) NOT NULL,
  status      TEXT DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 3. client_subscriptions ───────────────────────────────────
-- SaaS plan state per client workspace.
CREATE TABLE IF NOT EXISTS public.client_subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan                 TEXT NOT NULL DEFAULT 'starter'
                       CHECK (plan IN ('starter', 'growth', 'enterprise')),
  status               TEXT NOT NULL DEFAULT 'trialing'
                       CHECK (status IN ('trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '14 days',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end   TIMESTAMP WITH TIME ZONE,
  max_team_members     INTEGER DEFAULT 3,
  stripe_subscription_id TEXT,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 4. talent_kpis ───────────────────────────────────────────
-- KPIs set by client staff (or Opsly admins) for hired talent.
CREATE TABLE IF NOT EXISTS public.talent_kpis (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  talent_user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  set_by_user_id   UUID REFERENCES auth.users(id) NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  target_value     NUMERIC,
  current_value    NUMERIC,
  unit             TEXT,  -- 'tasks', '%', 'calls', 'hours', etc.
  period           TEXT NOT NULL DEFAULT 'monthly'
                   CHECK (period IN ('weekly', 'monthly', 'quarterly')),
  due_date         DATE,
  status           TEXT DEFAULT 'active'
                   CHECK (status IN ('active', 'completed', 'archived')),
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 5. talent_performance_reviews ────────────────────────────
-- Periodic evaluations of hired talent by client staff or admins.
CREATE TABLE IF NOT EXISTS public.talent_performance_reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  talent_user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewed_by_user_id   UUID REFERENCES auth.users(id) NOT NULL,
  review_period         TEXT,   -- 'Q1 2026', 'May 2026'
  overall_score         INTEGER CHECK (overall_score BETWEEN 1 AND 5),
  -- ratings JSONB keys: communication, delivery, availability, quality, collaboration
  ratings               JSONB DEFAULT '{}',
  notes                 TEXT,
  shared_with_talent    BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 6. client_messages ───────────────────────────────────────
-- In-platform messaging between client staff and talent.
CREATE TABLE IF NOT EXISTS public.client_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  sender_user_id      UUID REFERENCES auth.users(id) NOT NULL,
  recipient_user_id   UUID REFERENCES auth.users(id) NOT NULL,
  content             TEXT NOT NULL,
  read_at             TIMESTAMP WITH TIME ZONE,
  attachment_url      TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 7. Helper function: get_my_client_id() ───────────────────
-- Resolves the calling user to their client_id.
-- Works for both workspace owners (clients.user_id) and members (client_members.user_id).
CREATE OR REPLACE FUNCTION public.get_my_client_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Is the caller the workspace owner?
    (SELECT id FROM public.clients WHERE user_id = auth.uid()),
    -- Or are they an active member?
    (SELECT client_id FROM public.client_members
     WHERE user_id = auth.uid() AND status = 'active'
     LIMIT 1)
  );
$$;

-- ── 8. Enable RLS ────────────────────────────────────────────
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

-- ── 9. RLS Policies: client_members ──────────────────────────
CREATE POLICY "Members can view their workspace members"
  ON public.client_members FOR SELECT
  USING (client_id = public.get_my_client_id());

CREATE POLICY "Owners and admins can manage members"
  ON public.client_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clients WHERE id = client_members.client_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.client_members cm
      WHERE cm.client_id = client_members.client_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
        AND cm.status = 'active'
    )
  );

CREATE POLICY "Admins can view all client members"
  ON public.client_members FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ── 10. RLS Policies: client_invites ─────────────────────────
CREATE POLICY "Owners and admins can manage invites"
  ON public.client_invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clients WHERE id = client_invites.client_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.client_members cm
      WHERE cm.client_id = client_invites.client_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
        AND cm.status = 'active'
    )
  );

-- Allow the invite accept flow to read by token (no auth required — handled in Edge Function)
CREATE POLICY "Anyone can read invite by token for join flow"
  ON public.client_invites FOR SELECT
  USING (true);

CREATE POLICY "Admins can view all invites"
  ON public.client_invites FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ── 11. RLS Policies: client_subscriptions ───────────────────
CREATE POLICY "Workspace members can view their subscription"
  ON public.client_subscriptions FOR SELECT
  USING (client_id = public.get_my_client_id());

CREATE POLICY "Admins can manage all subscriptions"
  ON public.client_subscriptions FOR ALL
  USING (public.is_admin(auth.uid()));

-- ── 12. RLS Policies: talent_kpis ────────────────────────────
-- Client staff can create/manage KPIs for their workspace
CREATE POLICY "Client members can manage KPIs for their workspace"
  ON public.talent_kpis FOR ALL
  USING (client_id = public.get_my_client_id());

-- Talent can view their own KPIs
CREATE POLICY "Talent can view their own KPIs"
  ON public.talent_kpis FOR SELECT
  USING (talent_user_id = auth.uid());

-- Admins can view and create KPIs for any workspace
CREATE POLICY "Admins can manage all KPIs"
  ON public.talent_kpis FOR ALL
  USING (public.is_admin(auth.uid()));

-- ── 13. RLS Policies: talent_performance_reviews ─────────────
CREATE POLICY "Client members can manage reviews for their workspace"
  ON public.talent_performance_reviews FOR ALL
  USING (client_id = public.get_my_client_id());

-- Talent can see reviews that have been explicitly shared with them
CREATE POLICY "Talent can view reviews shared with them"
  ON public.talent_performance_reviews FOR SELECT
  USING (talent_user_id = auth.uid() AND shared_with_talent = TRUE);

CREATE POLICY "Admins can manage all reviews"
  ON public.talent_performance_reviews FOR ALL
  USING (public.is_admin(auth.uid()));

-- ── 14. RLS Policies: client_messages ────────────────────────
CREATE POLICY "Users can view messages they sent or received"
  ON public.client_messages FOR SELECT
  USING (
    (sender_user_id = auth.uid() OR recipient_user_id = auth.uid())
    AND client_id = public.get_my_client_id()
  );

CREATE POLICY "Authenticated users can send messages in their workspace"
  ON public.client_messages FOR INSERT
  WITH CHECK (
    sender_user_id = auth.uid()
    AND client_id = public.get_my_client_id()
  );

CREATE POLICY "Admins can view all messages"
  ON public.client_messages FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ── 15. Update affected RLS policies ─────────────────────────
-- timesheets: expand to allow any active client member to view/approve
DROP POLICY IF EXISTS "Clients can view timesheets for their contracts" ON public.timesheets;
CREATE POLICY "Clients can view timesheets for their contracts"
  ON public.timesheets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts ct
      WHERE ct.id = timesheets.contract_id
        AND ct.client_id = public.get_my_client_id()
    )
  );

DROP POLICY IF EXISTS "Clients can approve timesheets" ON public.timesheets;
CREATE POLICY "Clients can approve timesheets"
  ON public.timesheets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts ct
      WHERE ct.id = timesheets.contract_id
        AND ct.client_id = public.get_my_client_id()
    )
  );

-- contracts: expand to all workspace members
DROP POLICY IF EXISTS "Clients can view own contracts" ON public.contracts;
CREATE POLICY "Clients can view own contracts"
  ON public.contracts FOR SELECT
  USING (client_id = public.get_my_client_id());

DROP POLICY IF EXISTS "Clients can update own contracts" ON public.contracts;
CREATE POLICY "Clients can update own contracts"
  ON public.contracts FOR UPDATE
  USING (client_id = public.get_my_client_id());

-- invoices: expand to all workspace members
DROP POLICY IF EXISTS "Clients can view own invoices" ON public.invoices;
CREATE POLICY "Clients can view own invoices"
  ON public.invoices FOR SELECT
  USING (client_id = public.get_my_client_id());

-- ── 16. updated_at triggers ───────────────────────────────────
CREATE TRIGGER update_client_subscriptions_updated_at
  BEFORE UPDATE ON public.client_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_talent_kpis_updated_at
  BEFORE UPDATE ON public.talent_kpis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 17. Auto-create subscription row on new client ────────────
CREATE OR REPLACE FUNCTION public.init_client_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.client_subscriptions (client_id)
  VALUES (NEW.id)
  ON CONFLICT (client_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_client_created_init_subscription
  AFTER INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.init_client_subscription();

-- Backfill subscription rows for all existing clients
INSERT INTO public.client_subscriptions (client_id)
SELECT id FROM public.clients
ON CONFLICT (client_id) DO NOTHING;
