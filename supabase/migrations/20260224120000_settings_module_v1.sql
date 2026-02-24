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
VALUES ('Taskive Connect Ltd', 'Taskive Connect')
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
CREATE POLICY "Managers can manage all settings"
ON public.organization_settings FOR ALL
USING (public.has_permission('settings.manage'));

CREATE POLICY "Managers can manage pricing"
ON public.pricing_rules FOR ALL
USING (public.has_permission('settings.manage'));

-- ... Apply similar policy to all settings tables ...
CREATE POLICY "Managers can manage contracts" ON public.contract_settings FOR ALL USING (public.has_permission('settings.manage'));
CREATE POLICY "Managers can manage finance" ON public.finance_settings FOR ALL USING (public.has_permission('settings.manage'));
CREATE POLICY "Managers can manage workflows" ON public.workflow_settings FOR ALL USING (public.has_permission('settings.manage'));
CREATE POLICY "Managers can manage notifications" ON public.notification_templates FOR ALL USING (public.has_permission('settings.manage'));
CREATE POLICY "Managers can manage security" ON public.security_settings FOR ALL USING (public.has_permission('settings.manage'));
CREATE POLICY "Managers can manage branding" ON public.branding_settings FOR ALL USING (public.has_permission('settings.manage'));
CREATE POLICY "Managers can manage integrations" ON public.integrations FOR ALL USING (public.has_permission('settings.manage'));
CREATE POLICY "Managers can manage compliance" ON public.compliance_settings FOR ALL USING (public.has_permission('settings.manage'));

-- Public/Admin Read Access (Internal)
CREATE POLICY "Admins can view settings" ON public.organization_settings FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Admins can view pricing" ON public.pricing_rules FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
-- ... and so on for others ...
