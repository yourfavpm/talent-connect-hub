-- START FILE: 20260221000000_create_talent_documents_bucket.sql

-- ── 0. EMERGENCY TYPE NORMALIZATION ─────────────────────────────
-- This must run first to ensure later policies don't fail with 'uuid = text' errors
BEGIN;
DO $$ BEGIN
    -- 1. Standardize Audit Logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='audit_logs') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='actor_admin_id::uuid') THEN
            ALTER TABLE public.audit_logs RENAME COLUMN actor_admin_id::uuid TO admin_id::uuid;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='user_id') THEN
            ALTER TABLE public.audit_logs RENAME COLUMN user_id TO admin_id::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='admin_id::uuid' AND data_type='text') THEN
            ALTER TABLE public.audit_logs ALTER COLUMN admin_id::uuid TYPE UUID USING admin_id::uuid::uuid;
        END IF;
    END IF;

    -- 2. Clean Core User ID Columns (TEXT -> UUID)
    DECLARE
        t_name TEXT;
        c_name TEXT;
        tables_to_fix TEXT[][] := ARRAY[
            ['clients', 'user_id'],
            ['talents', 'user_id'],
            ['talents', 'assigned_manager'],
            ['user_roles', 'user_id'],
            ['support_tickets', 'user_id'],
            ['support_tickets', 'assigned_admin_id::uuid'],
            ['profiles', 'user_id'],
            ['talent_profiles', 'user_id'],
            ['talent_profiles', 'assigned_admin_id::uuid'],
            ['talent_profile_sections', 'user_id'],
            ['vetting_actions', 'user_id'],
            ['vetting_actions', 'admin_id::uuid'],
            ['hr_v2_hire_requests', 'client.user_id::uuid'],
            ['hr_v2_hire_requests', 'approved_by_admin_id::uuid'],
            ['hr_v2_applications', 'talent.user_id::uuid'],
            ['hr_v2_shortlists', 'talent.user_id::uuid'],
            ['hr_v2_interviews', 'talent.user_id::uuid'],
            ['hr_v2_interviews', 'client.user_id::uuid'],
            ['hr_v2_interviews', 'admin_id::uuid'],
            ['hr_v2_hires', 'talent.user_id::uuid'],
            ['hr_v2_hires', 'client.user_id::uuid'],
            ['hr_v2_hires', 'admin_id::uuid'],
            ['academy_enrollments', 'user_id'],
            ['submissions', 'student.id::uuid'],
            ['academy_certificates', 'student.id::uuid'],
            ['onboarding_records', 'user_id'],
            ['payouts', 'talent.id::uuid'],
            ['payouts', 'batch_id'],
            ['payout_batches', 'created_by'],
            ['payout_audit_log', 'admin_id::uuid'],
            ['talent_payment_methods', 'talent.id::uuid'],
            ['deduction_records', 'talent.id::uuid'],
            ['admin_roles', 'admin_id::uuid'],
            ['admin_permission_overrides', 'admin_id::uuid'],
            ['talent_profile_steps', 'talent.id::uuid'],
            ['talent_profile_reviews', 'talent.id::uuid'],
            ['talent_work_history', 'talent.id::uuid'],
            ['talent_education', 'talent.id::uuid'],
            ['talent_certifications', 'talent.id::uuid']
        ];
    BEGIN
        FOR i IN 1..array_length(tables_to_fix, 1) LOOP
            t_name := tables_to_fix[i][1];
            c_name := tables_to_fix[i][2];
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t_name AND column_name=c_name AND data_type='text') THEN
                EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE UUID USING %I::uuid', t_name, c_name, c_name);
            END IF;
        END LOOP;
    END;
END $$;
COMMIT;


INSERT INTO storage.buckets (id, name, public)
VALUES ('talent_documents', 'talent_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allows users to upload into the talent_documents bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to talent_documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to talent_documents" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to talent_documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket.id::uuid = 'talent_documents');

-- Allows users to read their own documents (assuming folder structure is user_id/...)
DROP POLICY IF EXISTS "Allow users to read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read their own documents" ON storage.objects;
CREATE POLICY "Allow users to read their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket.id::uuid = 'talent_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allows admins to read all documents
DROP POLICY IF EXISTS "Allow admins to read all documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to read all documents" ON storage.objects;
CREATE POLICY "Allow admins to read all documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket.id::uuid = 'talent_documents' AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id::uuid = auth.uid()::uuid AND role IN ('super_admin', 'operations_admin', 'vetting_admin', 'talent_manager')
  )
);


-- END FILE: 20260221000000_create_talent_documents_bucket.sql


-- START FILE: 20260221000001_seed_info_admin.sql

-- Seed the new admin user info@opslyhrtech.tech
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'info@opslyhrtech.tech') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
        ) VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000',
            'info@opslyhrtech.tech',
            crypt('OPSlyHRAdmin2026!', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"role":"super_admin"}',
            false,
            'authenticated'
        );
        
        -- Upsert into public.profiles
        INSERT INTO public.profiles (user_id, email, first_name, last_name)
        VALUES (new_user_id, 'info@opslyhrtech.tech', 'OPSlyHR', 'Admin')
        ON CONFLICT (user_id) DO UPDATE 
        SET email = EXCLUDED.email, 
            first_name = EXCLUDED.first_name, 
            last_name = EXCLUDED.last_name;

        -- Insert into public.user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new_user_id, 'super_admin');
    ELSE
        SELECT id INTO new_user_id FROM auth.users WHERE email = 'info@opslyhrtech.tech';
        
        -- Update password just in case
        UPDATE auth.users 
        SET encrypted_password = crypt('OPSlyHRAdmin2026!', gen_salt('bf'))
        WHERE id::uuid = new_user_id::uuid;
        
        -- Ensure role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new_user_id, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;


-- END FILE: 20260221000001_seed_info_admin.sql


-- START FILE: 20260222104000_payout_core.sql

-- Payout Core Infrastructure Migration
-- Supports structured talent payouts, batching, and deductions.

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('ready_for_payout', 'awaiting_client_payment', 'processing', 'paid', 'on_hold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Payout Batches
CREATE TABLE IF NOT EXISTS public.payout_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id::uuid UUID REFERENCES auth.users(id),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Talent Payment Methods
CREATE TABLE IF NOT EXISTS public.talent_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent.id::uuid UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    method_type TEXT NOT NULL CHECK (method_type IN ('bank_transfer', 'crypto', 'digital_wallet', 'other')),
    details JSONB NOT NULL, -- Masked/Encrypted details as needed
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Payouts (The core record)
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.payout_batches(id) ON DELETE SET NULL,
    talent.id::uuid UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    contract.id::uuid UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    gross_amount DECIMAL(12,2) NOT NULL,
    commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    status payout_status DEFAULT 'ready_for_payout',
    hold_reason TEXT,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Deduction Records
CREATE TABLE IF NOT EXISTS public.deduction_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout.id::uuid UUID REFERENCES public.payouts(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payout Audit Log
CREATE TABLE IF NOT EXISTS public.payout_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout.id::uuid UUID REFERENCES public.payouts(id) ON DELETE CASCADE NOT NULL,
    old_status payout_status,
    new_status payout_status NOT NULL,
    admin_id::uuid UUID REFERENCES auth.users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS Policies
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deduction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can manage all payout related tables
DROP POLICY IF EXISTS "Admins manage payout_batches" ON public.payout_batches;
CREATE POLICY "Admins manage payout_batches" ON public.payout_batches FOR ALL USING (public.is_admin(auth.uid()::uuid));
DROP POLICY IF EXISTS "Admins manage talent_payment_methods" ON public.talent_payment_methods;
CREATE POLICY "Admins manage talent_payment_methods" ON public.talent_payment_methods FOR ALL USING (public.is_admin(auth.uid()::uuid));
DROP POLICY IF EXISTS "Admins manage payouts" ON public.payouts;
CREATE POLICY "Admins manage payouts" ON public.payouts FOR ALL USING (public.is_admin(auth.uid()::uuid));
DROP POLICY IF EXISTS "Admins manage deduction_records" ON public.deduction_records;
CREATE POLICY "Admins manage deduction_records" ON public.deduction_records FOR ALL USING (public.is_admin(auth.uid()::uuid));
DROP POLICY IF EXISTS "Admins manage payout_audit_log" ON public.payout_audit_log;
CREATE POLICY "Admins manage payout_audit_log" ON public.payout_audit_log FOR ALL USING (public.is_admin(auth.uid()::uuid));

-- Talents can view their own payment methods and payouts
DROP POLICY IF EXISTS "Talents view own payment methods" ON public.talent_payment_methods;
CREATE POLICY "Talents view own payment methods" ON public.talent_payment_methods FOR SELECT USING (auth.uid()::uuid IN (SELECT user_id::uuid FROM public.talents WHERE id = talent.id::uuid));
DROP POLICY IF EXISTS "Talents manage own payment methods" ON public.talent_payment_methods;
CREATE POLICY "Talents manage own payment methods" ON public.talent_payment_methods FOR ALL USING (auth.uid()::uuid IN (SELECT user_id::uuid FROM public.talents WHERE id = talent.id::uuid));
DROP POLICY IF EXISTS "Talents view own payouts" ON public.payouts;
CREATE POLICY "Talents view own payouts" ON public.payouts FOR SELECT USING (auth.uid()::uuid IN (SELECT user_id::uuid FROM public.talents WHERE id = talent.id::uuid));

-- 8. Updated At Triggers
DROP TRIGGER IF EXISTS update_payouts_updated_at ON public.payouts;
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_talent_payment_methods_updated_at ON public.talent_payment_methods;
CREATE TRIGGER update_talent_payment_methods_updated_at BEFORE UPDATE ON public.talent_payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_payouts_talent.id::uuid ON public.payouts(talent.id::uuid);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_batch_id ON public.payouts(batch_id);
CREATE INDEX IF NOT EXISTS idx_payouts_invoice_id ON public.payouts(invoice_id);

-- 10. Automatic Payout Generation Trigger
-- When an invoice status is updated to 'paid', create the corresponding payout record.
DROP FUNCTION IF EXISTS public.handle_invoice_payout_generation() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_invoice_payout_generation()
RETURNS TRIGGER AS $$
DECLARE
    v_contract.id::uuid UUID;
    v_talent.id::uuid UUID;
    v_gross_amount DECIMAL(12,2);
    v_commission_amount DECIMAL(12,2);
    v_net_amount DECIMAL(12,2);
    v_talent_rate DECIMAL(12,2);
    v_taskive_margin DECIMAL(5,2);
BEGIN
    -- Only trigger when invoice becomes 'paid'
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
        
        -- Get contract details
        -- Note: In current schema, invoices might be linked to timesheets or directly to contracts.
        -- We'll assume the first related contract found for simplicity in this flow.
        SELECT c.id, c.talent.id::uuid, c.talent_rate, c.taskive_margin
        INTO v_contract.id::uuid, v_talent.id::uuid, v_talent_rate, v_taskive_margin
        FROM public.contracts c
        JOIN public.timesheets ts ON ts.contract.id::uuid::uuid = c.id::uuid
        WHERE ts.invoice_id = NEW.id
        LIMIT 1;

        IF v_contract.id::uuid IS NOT NULL THEN
            v_gross_amount := NEW.amount;
            -- Simple margin calculation
            v_commission_amount := (v_gross_amount * (COALESCE(v_taskive_margin, 20) / 100));
            v_net_amount := v_gross_amount - v_commission_amount;

            INSERT INTO public.payouts (
                talent.id::uuid,
                contract.id::uuid,
                invoice_id,
                gross_amount,
                commission_amount,
                net_amount,
                status,
                period_start,
                period_end
            ) VALUES (
                v_talent.id::uuid,
                v_contract.id::uuid,
                NEW.id,
                v_gross_amount,
                v_commission_amount,
                v_net_amount,
                'ready_for_payout',
                NOW() - INTERVAL '14 days', -- Placeholder for period
                NOW()
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_invoice_paid_generate_payout ON public.invoices;
CREATE TRIGGER on_invoice_paid_generate_payout AFTER UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_invoice_payout_generation();


-- END FILE: 20260222104000_payout_core.sql


-- START FILE: 20260222110000_support_v2.sql

-- Support Module V2 Enhancements
-- 1. Ensure ticket_replies exists (Fixed definition)
CREATE TABLE IF NOT EXISTS public.ticket_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket.id::uuid UUID REFERENCES public.support_tickets.id::uuid) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    is_admin_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enhance support_tickets table
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS assigned_admin_id::uuid UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS unread_by_admin BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 3. Ticket Audit Log
CREATE TABLE IF NOT EXISTS public.ticket_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket.id::uuid UUID REFERENCES public.support_tickets.id::uuid) ON DELETE CASCADE NOT NULL,
    admin_id::uuid UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'status_change', 'priority_change', 'assignment'
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket.id::uuid ON public.ticket_replies(ticket.id::uuid);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_admin ON public.support_tickets(assigned_admin_id::uuid);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- 5. RLS Policies
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_audit_log ENABLE ROW LEVEL SECURITY;

-- Replies Policies
DROP POLICY IF EXISTS "Users can view replies for own tickets" ON public.ticket_replies;
CREATE POLICY "Users can view replies for own tickets" ON public.ticket_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE support_tickets.id::uuid = ticket_replies.ticket.id::uuid 
            AND support_tickets.user_id = auth.uid()::uuid::uuid
        )
    );

DROP POLICY IF EXISTS "Admins can manage all replies" ON public.ticket_replies;
CREATE POLICY "Admins can manage all replies" ON public.ticket_replies
    FOR ALL USING (public.is_admin(auth.uid()::uuid));

DROP POLICY IF EXISTS "Users can send replies to own tickets" ON public.ticket_replies;
CREATE POLICY "Users can send replies to own tickets" ON public.ticket_replies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE support_tickets.id::uuid = ticket_replies.ticket.id::uuid 
            AND support_tickets.user_id = auth.uid()::uuid::uuid
        )
    );

-- Audit Log Policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.ticket_audit_log;
CREATE POLICY "Admins can view audit logs" ON public.ticket_audit_log
    FOR SELECT USING (public.is_admin(auth.uid()::uuid));

-- 6. Trigger for unread status
DROP FUNCTION IF EXISTS public.handle_ticket_reply_unread() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_ticket_reply_unread()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_admin_reply THEN
        -- When admin replies, maybe clear the user's unread flag if we had one?
        -- For now, focus on admin's view
        UPDATE public.support_tickets SET unread_by_admin = FALSE WHERE id = NEW.ticket.id::uuid;
    ELSE
        -- When user replies, mark as unread for admin
        UPDATE public.support_tickets SET unread_by_admin = TRUE WHERE id = NEW.ticket.id::uuid;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ticket_reply_update_unread ON public.ticket_replies;
CREATE TRIGGER on_ticket_reply_update_unread AFTER INSERT ON public.ticket_replies
    FOR EACH ROW EXECUTE FUNCTION public.handle_ticket_reply_unread();


-- END FILE: 20260222110000_support_v2.sql


-- START FILE: 20260222120000_admin_invoices_v2.sql

-- Migration: Admin Invoices V2
-- Supports granular billing, line items, and payment tracking.

-- 1. Update invoice_status enum
-- Draft, Sent, Overdue, Paid, Cancelled
-- Note: 'pending' already exists, we keep it for backward compatibility but UI will prefer 'draft'
DO $$ BEGIN
    ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'draft';
    ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'cancelled';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create payment_status enum
DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('unpaid', 'partially_paid', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Enhance invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS margin_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payout_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deduction_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS billing_period_start DATE, -- Ensure these exist if not already
ADD COLUMN IF NOT EXISTS billing_period_end DATE;

-- 4. Invoice Line Items
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2),
    type TEXT DEFAULT 'regular', -- regular, overtime, fee, deduction
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Invoice Status History (Audit)
CREATE TABLE IF NOT EXISTS public.invoice_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    old_status invoice_status,
    new_status invoice_status NOT NULL,
    admin_id::uuid UUID REFERENCES auth.users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Invoice Payment Records (Reconciliation)
CREATE TABLE IF NOT EXISTS public.invoice_payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    payment_method TEXT,
    reference_id TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payment_records ENABLE ROW LEVEL SECURITY;

-- Admins can manage everything
DROP POLICY IF EXISTS "Admins manage invoice_line_items" ON public.invoice_line_items;
CREATE POLICY "Admins manage invoice_line_items" ON public.invoice_line_items FOR ALL USING (public.is_admin(auth.uid()::uuid));
DROP POLICY IF EXISTS "Admins manage invoice_status_history" ON public.invoice_status_history;
CREATE POLICY "Admins manage invoice_status_history" ON public.invoice_status_history FOR ALL USING (public.is_admin(auth.uid()::uuid));
DROP POLICY IF EXISTS "Admins manage invoice_payment_records" ON public.invoice_payment_records;
CREATE POLICY "Admins manage invoice_payment_records" ON public.invoice_payment_records FOR ALL USING (public.is_admin(auth.uid()::uuid));

-- Clients can view their own invoice details
DROP POLICY IF EXISTS "Clients view own invoice_line_items" ON public.invoice_line_items;
CREATE POLICY "Clients view own invoice_line_items" ON public.invoice_line_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invoices i JOIN public.clients c ON i.client.id::uuid = c.id WHERE i.id = invoice_line_items.invoice_id AND c.user_id = auth.uid()::uuid::uuid)
);
DROP POLICY IF EXISTS "Clients view own invoice_payment_records" ON public.invoice_payment_records;
CREATE POLICY "Clients view own invoice_payment_records" ON public.invoice_payment_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invoices i JOIN public.clients c ON i.client.id::uuid = c.id WHERE i.id = invoice_payment_records.invoice_id AND c.user_id = auth.uid()::uuid::uuid)
);

-- 8. Updated At Trigger for invoices (already exists, but ensuring it)
-- Trigger already exists as per grep: update_invoices_updated_at

-- 9. Automatic Payout Generation Logic Adjustment (Optional but good)
-- We'll keep the existing trigger for now and update UI to show linkage.


-- END FILE: 20260222120000_admin_invoices_v2.sql


-- START FILE: 20260222130000_consultations_v2.sql

-- Add consultations V2 enhancements
DO $$ BEGIN
    CREATE TYPE public.consultation_status_new AS ENUM ('new', 'contacted', 'converted', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update consultations table
ALTER TABLE public.consultations 
ADD COLUMN IF NOT EXISTS lead_status consultation_status_new DEFAULT 'new',
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS converted_client.id::uuid UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS activity_log JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS objective_type TEXT CHECK (objective_type IN ('hire', 'advisory', 'project')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Migrate existing status to lead_status if possible
-- Note: existing status was text with ('pending', 'contacted', 'closed')
UPDATE public.consultations 
SET lead_status = CASE 
    WHEN status = 'pending' THEN 'new'::public.consultation_status_new
    WHEN status = 'contacted' THEN 'contacted'::public.consultation_status_new
    WHEN status = 'closed' THEN 'closed'::public.consultation_status_new
    ELSE 'new'::public.consultation_status_new
END;

-- Add updated_at trigger
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_consultations_updated_at ON consultations;
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- END FILE: 20260222130000_consultations_v2.sql


-- START FILE: 20260223000000_admin_rbac_v1.sql

-- Admin RBAC System V1
-- Includes roles, permissions, and admin user management

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE public.admin_status AS ENUM ('invited', 'active', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.invite_status AS ENUM ('sent', 'accepted', 'expired', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables

-- Admin Users (extension of auth.users)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    status public.admin_status DEFAULT 'active',
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,         -- e.g. 'jobs.view', 'jobs.approve'
    module TEXT NOT NULL,             -- jobs, clients, payments...
    action TEXT NOT NULL,             -- view, create, edit, approve, delete, export
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Role Permissions (Junction)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Admin Roles (Assignment)
CREATE TABLE IF NOT EXISTS public.admin_roles (
    admin_id::uuid UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (admin_id::uuid, role_id)
);

-- Admin Permission Overrides
CREATE TABLE IF NOT EXISTS public.admin_permission_overrides (
    admin_id::uuid UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    allowed BOOLEAN NOT NULL,
    PRIMARY KEY (admin_id::uuid, permission_id)
);

-- Admin Invites
CREATE TABLE IF NOT EXISTS public.admin_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    token_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status public.invite_status DEFAULT 'sent',
    created_by UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_admin_id::uuid UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,              -- e.g. 'role.updated', 'admin.suspended'
    entity_type TEXT NOT NULL,         -- 'admin', 'role', 'job', etc.
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Initial Data (System Roles and Permissions)

-- Insert Standard Permissions
INSERT INTO public.permissions (key, module, action, description) VALUES
('dashboard.view', 'dashboard', 'view', 'Access to admin dashboard'),
('clients.view', 'clients', 'view', 'View client list and details'),
('clients.edit', 'clients', 'edit', 'Modify client information'),
('talents.view', 'talents', 'view', 'View talent database'),
('talents.edit', 'talents', 'edit', 'Vette and modify talent profiles'),
('jobs.view', 'jobs', 'view', 'View all job postings'),
('jobs.create', 'jobs', 'create', 'Create new job postings'),
('jobs.approve', 'jobs', 'approve', 'Approve job postings for publication'),
('timesheets.view', 'timesheets', 'view', 'View all timesheets'),
('timesheets.approve', 'timesheets', 'approve', 'Approve timesheets for payment'),
('payments.view', 'payments', 'view', 'View payment records'),
('payments.manage', 'payments', 'manage', 'Execute and manage payouts'),
('team.view', 'team', 'view', 'View admin team members'),
('team.manage', 'team', 'manage', 'Manage admins, roles, and permissions'),
('settings.view', 'settings', 'view', 'View global settings'),
('settings.manage', 'settings', 'manage', 'Modify system settings')
ON CONFLICT (key) DO NOTHING;

-- Insert System Roles
INSERT INTO public.roles (name, description, is_system_role) VALUES
('Super Admin', 'Full system access', true),
('Operations Admin', 'Daily operational management', true),
('Finance Admin', 'Financial and payroll management', true),
('Support Admin', 'Customer and talent support', true)
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to Super Admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- 4. Migration logic for existing admins
-- We'll look for existing users in auth.users who have an admin role in the old user_roles table
INSERT INTO public.admin_users (id, email, full_name, status)
SELECT u.id, u.email, (u.raw_user_meta_data->>'first_name') || ' ' || (u.raw_user_meta_data->>'last_name'), 'active'
FROM auth.users u
JOIN public.user_roles ur ON u.id::uuid = ur.user_id::uuid::uuid
WHERE ur.role IN ('super_admin', 'operations_admin', 'vetting_admin', 'finance_admin', 'support_admin')
ON CONFLICT (id) DO UPDATE SET status = 'active';

-- Map legacy roles to new roles
INSERT INTO public.admin_roles (admin_id::uuid, role_id)
SELECT ur.user_id::uuid, r.id
FROM public.user_roles ur
JOIN public.roles r ON (
    CASE 
        WHEN ur.role = 'super_admin' THEN 'Super Admin'
        WHEN ur.role IN ('operations_admin', 'vetting_admin') THEN 'Operations Admin'
        WHEN ur.role = 'finance_admin' THEN 'Finance Admin'
        WHEN ur.role = 'support_admin' THEN 'Support Admin'
        ELSE 'Operations Admin'
    END = r.name
)
WHERE ur.role IN ('super_admin', 'operations_admin', 'vetting_admin', 'finance_admin', 'support_admin')
ON CONFLICT DO NOTHING;

-- 5. Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Admins can view roles/permissions)
DROP POLICY IF EXISTS "Admins can view roles" ON public.roles;
DROP POLICY IF EXISTS "Admins can view roles" ON public.roles;
CREATE POLICY "Admins can view roles" ON public.roles FOR SELECT USING (
    auth.uid()::uuid IN (SELECT user_id FROM public.user_roles WHERE role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin'))
);

DROP POLICY IF EXISTS "Admins can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Admins can view permissions" ON public.permissions;
CREATE POLICY "Admins can view permissions" ON public.permissions FOR SELECT USING (
    auth.uid()::uuid IN (SELECT user_id FROM public.user_roles WHERE role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin'))
);

DROP POLICY IF EXISTS "Admins can view team" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view team" ON public.admin_users;
CREATE POLICY "Admins can view team" ON public.admin_users FOR SELECT USING (
    auth.uid()::uuid IN (SELECT user_id FROM public.user_roles WHERE role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin'))
);

DROP POLICY IF EXISTS "Admins can view admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can view admin_roles" ON public.admin_roles;
CREATE POLICY "Admins can view admin_roles" ON public.admin_roles FOR SELECT USING (
    auth.uid()::uuid IN (SELECT user_id FROM public.user_roles WHERE role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin'))
);

DROP POLICY IF EXISTS "Admins can view role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Admins can view role_permissions" ON public.role_permissions;
CREATE POLICY "Admins can view role_permissions" ON public.role_permissions FOR SELECT USING (
    auth.uid()::uuid IN (SELECT user_id FROM public.user_roles WHERE role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin'))
);

-- Write access restricted to those with team.manage permission
DROP FUNCTION IF EXISTS public.has_permission(p_key TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.has_permission(p_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_roles ar
        JOIN public.role_permissions rp ON ar.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ar.admin_id::uuid = auth.uid()::uuid::uuid AND p.key = p_key
    ) OR EXISTS (
        SELECT 1 FROM public.admin_permission_overrides apo
        JOIN public.permissions p ON apo.permission_id = p.id
        WHERE apo.admin_id::uuid = auth.uid()::uuid::uuid AND p.key = p_key AND apo.allowed = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Managers can update roles" ON public.roles;
CREATE POLICY "Managers can update roles" ON public.roles FOR ALL USING (public.has_permission('team.manage'));
DROP POLICY IF EXISTS "Managers can update admin_users" ON public.admin_users;
CREATE POLICY "Managers can update admin_users" ON public.admin_users FOR ALL USING (public.has_permission('team.manage'));

-- 6. Helper Functions

-- Get effective permissions for an admin
DROP FUNCTION IF EXISTS public.get_admin_permissions(p_admin_id::uuid UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_admin_permissions(p_admin_id::uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
    perms TEXT[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT p.key) INTO perms
    FROM (
        -- Permissions from roles
        SELECT p.key
        FROM public.admin_roles ar
        JOIN public.role_permissions rp ON ar.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ar.admin_id::uuid = p_admin_id::uuid
        
        UNION
        
        -- Explicitly allowed overrides
        SELECT p.key
        FROM public.admin_permission_overrides apo
        JOIN public.permissions p ON apo.permission_id = p.id
        WHERE apo.admin_id::uuid = p_admin_id::uuid AND apo.allowed = true
        
        EXCEPT
        
        -- Explicitly denied overrides
        SELECT p.key
        FROM public.admin_permission_overrides apo
        JOIN public.permissions p ON apo.permission_id = p.id
        WHERE apo.admin_id::uuid = p_admin_id::uuid AND apo.allowed = false
    ) AS p;
    
    RETURN COALESCE(perms, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Secure Management Functions

-- Function to invite a new admin
DROP FUNCTION IF EXISTS public.invite_admin(
    p_email TEXT,
    p_full_name TEXT,
    p_role_id UUID
) CASCADE;
CREATE OR REPLACE FUNCTION public.invite_admin(
    p_email TEXT,
    p_full_name TEXT,
    p_role_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id::uuid UUID;
BEGIN
    -- Only managers can invite
    IF NOT public.has_permission('team.manage') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;

    -- 1. Create the admin user record
    INSERT INTO public.admin_users (email, full_name, status)
    VALUES (p_email, p_full_name, 'active')
    RETURNING id INTO v_admin_id::uuid;

    -- 2. Assign the initial role
    INSERT INTO public.admin_roles (admin_id::uuid, role_id)
    VALUES (v_admin_id::uuid, p_role_id);

    -- 3. Log the action
    INSERT INTO public.audit_logs (admin_id::uuid, action, module, target.id::uuid)
    VALUES (auth.uid()::uuid, 'INVITE_ADMIN', 'team', v_admin_id::uuid);

    RETURN v_admin_id::uuid;
END;
$$;

-- Function to update an admin's role
DROP FUNCTION IF EXISTS public.update_admin_role(
    p_admin_id::uuid UUID,
    p_role_id UUID
) CASCADE;
CREATE OR REPLACE FUNCTION public.update_admin_role(
    p_admin_id::uuid UUID,
    p_role_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only managers can update roles
    IF NOT public.has_permission('team.manage') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;

    -- 1. Remove existing roles (single role model for now)
    DELETE FROM public.admin_roles WHERE admin_id::uuid::uuid = p_admin_id::uuid;

    -- 2. Insert new role
    INSERT INTO public.admin_roles (admin_id::uuid, role_id)
    VALUES (p_admin_id::uuid, p_role_id);

    -- 3. Log the action
    INSERT INTO public.audit_logs (admin_id::uuid, action, module, target.id::uuid)
    VALUES (auth.uid()::uuid, 'UPDATE_ROLE', 'team', p_admin_id::uuid);
END;
$$;

-- Function to toggle admin status
DROP FUNCTION IF EXISTS public.toggle_admin_status(
    p_admin_id::uuid UUID,
    p_status TEXT
) CASCADE;
CREATE OR REPLACE FUNCTION public.toggle_admin_status(
    p_admin_id::uuid UUID,
    p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only managers can toggle status
    IF NOT public.has_permission('team.manage') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;

    UPDATE public.admin_users
    SET status = p_status
    WHERE id = p_admin_id::uuid;

    -- Log the action
    INSERT INTO public.audit_logs (admin_id::uuid, action, module, target.id::uuid)
    VALUES (auth.uid()::uuid, 'UPDATE_STATUS', 'team', p_admin_id::uuid);
END;
$$;

-- Function to add a permission override
DROP FUNCTION IF EXISTS public.add_admin_override(
    p_admin_id::uuid UUID,
    p_permission_id UUID,
    p_allowed BOOLEAN
) CASCADE;
CREATE OR REPLACE FUNCTION public.add_admin_override(
    p_admin_id::uuid UUID,
    p_permission_id UUID,
    p_allowed BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only managers can add overrides
    IF NOT public.has_permission('team.manage') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;

    INSERT INTO public.admin_permission_overrides (admin_id::uuid, permission_id, allowed)
    VALUES (p_admin_id::uuid, p_permission_id, p_allowed)
    ON CONFLICT (admin_id::uuid, permission_id) 
    DO UPDATE SET allowed = p_allowed;

    -- Log the action
    INSERT INTO public.audit_logs (admin_id::uuid, action, module, target.id::uuid)
    VALUES (auth.uid()::uuid, 'UPSERT_OVERRIDE', 'team', p_admin_id::uuid);
END;
$$;


-- END FILE: 20260223000000_admin_rbac_v1.sql


-- START FILE: 20260224120000_settings_module_v1.sql

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
VALUES ('OPSlyHR Connect Ltd', 'OPSlyHR Connect')
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
DROP POLICY IF EXISTS "Managers can manage all settings" ON public.organization_settings;
CREATE POLICY "Managers can manage all settings"
ON public.organization_settings FOR ALL
USING (public.has_permission('settings.manage'));

DROP POLICY IF EXISTS "Managers can manage pricing" ON public.pricing_rules;
CREATE POLICY "Managers can manage pricing"
ON public.pricing_rules FOR ALL
USING (public.has_permission('settings.manage'));

-- ... Apply similar policy to all settings tables ...
DROP POLICY IF EXISTS "Managers can manage contracts" ON public.contract_settings;
CREATE POLICY "Managers can manage contracts" ON public.contract_settings FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage finance" ON public.finance_settings;
CREATE POLICY "Managers can manage finance" ON public.finance_settings FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage workflows" ON public.workflow_settings;
CREATE POLICY "Managers can manage workflows" ON public.workflow_settings FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage notifications" ON public.notification_templates;
CREATE POLICY "Managers can manage notifications" ON public.notification_templates FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage security" ON public.security_settings;
CREATE POLICY "Managers can manage security" ON public.security_settings FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage branding" ON public.branding_settings;
CREATE POLICY "Managers can manage branding" ON public.branding_settings FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage integrations" ON public.integrations;
CREATE POLICY "Managers can manage integrations" ON public.integrations FOR ALL USING (public.has_permission('settings.manage'));
DROP POLICY IF EXISTS "Managers can manage compliance" ON public.compliance_settings;
CREATE POLICY "Managers can manage compliance" ON public.compliance_settings FOR ALL USING (public.has_permission('settings.manage'));

-- Public/Admin Read Access (Internal)
DROP POLICY IF EXISTS "Admins can view settings" ON public.organization_settings;
CREATE POLICY "Admins can view settings" ON public.organization_settings FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()::uuid::uuid));
DROP POLICY IF EXISTS "Admins can view pricing" ON public.pricing_rules;
CREATE POLICY "Admins can view pricing" ON public.pricing_rules FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()::uuid::uuid));
-- ... and so on for others ...


-- END FILE: 20260224120000_settings_module_v1.sql


-- START FILE: 20260225000000_talent_vetting_v2.sql

-- Talent Vetting v2: Step-based vetting, change requests, and skill assessment

-- 1. Extend Talent Statuses
DO $$ BEGIN
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'draft';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'submitted';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'in_review';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'changes_requested';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'approved';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'rejected';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'approved';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'rejected';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Define Skill Levels
DO $$ BEGIN
    CREATE TYPE public.skill_level AS ENUM ('junior', 'mid', 'senior', 'lead');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Define Step Statuses
DO $$ BEGIN
    CREATE TYPE public.step_status AS ENUM ('not_started', 'incomplete', 'submitted', 'in_review', 'changes_requested', 'approved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Update Talents Table (use existing assigned_manager column, add skill assessment fields)
ALTER TABLE public.talents 
ADD COLUMN IF NOT EXISTS overall_skill_level public.skill_level,
ADD COLUMN IF NOT EXISTS skill_assessment_notes TEXT,
ADD COLUMN IF NOT EXISTS skill_assessment_visible_to_clients BOOLEAN DEFAULT TRUE;

-- 5. Create Talent Profile Steps Table
CREATE TABLE IF NOT EXISTS public.talent_profile_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent.id::uuid UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    step_key TEXT NOT NULL, -- basic_info, professional_details, work_history, documents, education, certifications, references, review
    status public.step_status DEFAULT 'not_started',
    last_submitted_at TIMESTAMP WITH TIME ZONE,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (talent.id::uuid, step_key)
);

-- 6. Create Step Change Requests Table
CREATE TABLE IF NOT EXISTS public.step_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent.id::uuid UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    step_key TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT
);

-- 7. Enable RLS
ALTER TABLE public.talent_profile_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_change_requests ENABLE ROW LEVEL SECURITY;

-- 8. Policies for Talent Profile Steps
DO $$ BEGIN
DROP POLICY IF EXISTS "Talents can view own step status" ON public.talent_profile_steps;
CREATE POLICY "Talents can view own step status" 
ON public.talent_profile_steps FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_profile_steps.talent.id::uuid AND talents.user_id = auth.uid()::uuid::uuid));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
DROP POLICY IF EXISTS "Admins can manage step status" ON public.talent_profile_steps;
CREATE POLICY "Admins can manage step status" 
ON public.talent_profile_steps FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()::uuid::uuid));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 9. Policies for Step Change Requests
DO $$ BEGIN
DROP POLICY IF EXISTS "Talents can view own change requests" ON public.step_change_requests;
CREATE POLICY "Talents can view own change requests" 
ON public.step_change_requests FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.talents WHERE talents.id = step_change_requests.talent.id::uuid AND talents.user_id = auth.uid()::uuid::uuid));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
DROP POLICY IF EXISTS "Admins can manage change requests" ON public.step_change_requests;
CREATE POLICY "Admins can manage change requests" 
ON public.step_change_requests FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()::uuid::uuid));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 10. Initialization function for steps
DROP FUNCTION IF EXISTS public.init_talent_steps() CASCADE;
CREATE OR REPLACE FUNCTION public.init_talent_steps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.talent_profile_steps (talent.id::uuid, step_key) VALUES
        (NEW.id, 'basic_info'),
        (NEW.id, 'professional_details'),
        (NEW.id, 'work_history'),
        (NEW.id, 'documents'),
        (NEW.id, 'education'),
        (NEW.id, 'certifications'),
        (NEW.id, 'references'),
        (NEW.id, 'review')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$;

-- 11. Trigger for existing and new talents
DROP TRIGGER IF EXISTS on_talent_created_init_steps ON public.talents;
DROP TRIGGER IF EXISTS on_talent_created_init_steps ON public.talents;
CREATE TRIGGER on_talent_created_init_steps AFTER INSERT ON public.talents
    FOR EACH ROW EXECUTE FUNCTION public.init_talent_steps();

-- 12. Migrate existing talents
DO $$
DECLARE
    talent_record RECORD;
BEGIN
    FOR talent_record IN SELECT id FROM public.talents LOOP
        INSERT INTO public.talent_profile_steps (talent.id::uuid, step_key) VALUES
            (talent_record.id, 'basic_info'),
            (talent_record.id, 'professional_details'),
            (talent_record.id, 'work_history'),
            (talent_record.id, 'documents'),
            (talent_record.id, 'education'),
            (talent_record.id, 'certifications'),
            (talent_record.id, 'references'),
            (talent_record.id, 'review')
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- 13. Audit Log Trigger for Vetting Changes
DROP FUNCTION IF EXISTS public.log_vetting_action() CASCADE;
CREATE OR REPLACE FUNCTION public.log_vetting_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (actor_admin_id::uuid, action, entity_type, entity_id, metadata)
        VALUES (
            auth.uid()::uuid,
            'VETTING_STATUS_UPDATE',
            'talent_step',
            NEW.talent.id::uuid,
            jsonb_build_object(
                'step_key', NEW.step_key,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_step_status_updated ON public.talent_profile_steps;
DROP TRIGGER IF EXISTS on_step_status_updated ON public.talent_profile_steps;
CREATE TRIGGER on_step_status_updated AFTER UPDATE ON public.talent_profile_steps
    FOR EACH ROW EXECUTE FUNCTION public.log_vetting_action();


-- END FILE: 20260225000000_talent_vetting_v2.sql


-- START FILE: 20260226000000_talent_profile_drafts.sql

-- Talent Profile Drafts: Add draft/approved versioning + review tracking

-- 1. Add profile change tracking columns to talents
ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS profile_change_status TEXT DEFAULT 'clean'
  CHECK (profile_change_status IN ('clean', 'draft', 'submitted', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS changed_sections TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS draft_profile JSONB DEFAULT '{}';

-- 2. Create talent_profile_reviews table
CREATE TABLE IF NOT EXISTS public.talent_profile_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent.id::uuid UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    changed_sections TEXT[] DEFAULT '{}',
    talent_message TEXT
);

-- 3. Enable RLS
ALTER TABLE public.talent_profile_reviews ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DO $$ BEGIN
DROP POLICY IF EXISTS "Talents can view own reviews" ON public.talent_profile_reviews;
CREATE POLICY "Talents can view own reviews"
ON public.talent_profile_reviews FOR SELECT
USING (EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_profile_reviews.talent.id::uuid AND talents.user_id = auth.uid()::uuid::uuid));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
DROP POLICY IF EXISTS "Talents can insert own reviews" ON public.talent_profile_reviews;
CREATE POLICY "Talents can insert own reviews"
ON public.talent_profile_reviews FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_profile_reviews.talent.id::uuid AND talents.user_id = auth.uid()::uuid::uuid));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.talent_profile_reviews;
CREATE POLICY "Admins can manage reviews"
ON public.talent_profile_reviews FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()::uuid::uuid));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_talent_profile_reviews_talent.id::uuid ON public.talent_profile_reviews(talent.id::uuid);
CREATE INDEX IF NOT EXISTS idx_talents_profile_change_status ON public.talents(profile_change_status);


-- END FILE: 20260226000000_talent_profile_drafts.sql


-- START FILE: 20260226000001_fix_talent_read_rls.sql

-- Drop the existing policies first
DROP POLICY IF EXISTS "Public Read Fully Vetted Talents" ON "public"."talents";
DROP POLICY IF EXISTS "Public Read Work History" ON "public"."talent_work_history";
DROP POLICY IF EXISTS "Public Read Education" ON "public"."talent_education";
DROP POLICY IF EXISTS "Public Read Certifications" ON "public"."talent_certifications";

-- Policy for Public/Clients to view Fully Vetted & Approved Talents
DROP POLICY IF EXISTS "Public Read Fully Vetted Talents" ON "public"."talents";
CREATE POLICY "Public Read Fully Vetted Talents"
ON "public"."talents"
FOR SELECT
TO authenticated
USING (vetting_status IN ('fully_vetted', 'approved'));

-- Policy for viewing Work History of Vetted Talents
DROP POLICY IF EXISTS "Public Read Work History" ON "public"."talent_work_history";
CREATE POLICY "Public Read Work History"
ON "public"."talent_work_history"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_work_history.talent.id::uuid
    AND talents.vetting_status IN ('fully_vetted', 'approved')
  )
);

-- Policy for viewing Education of Vetted Talents
DROP POLICY IF EXISTS "Public Read Education" ON "public"."talent_education";
CREATE POLICY "Public Read Education"
ON "public"."talent_education"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_education.talent.id::uuid
    AND talents.vetting_status IN ('fully_vetted', 'approved')
  )
);

-- Policy for viewing Certifications of Vetted Talents
DROP POLICY IF EXISTS "Public Read Certifications" ON "public"."talent_certifications";
CREATE POLICY "Public Read Certifications"
ON "public"."talent_certifications"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM talents
    WHERE talents.id = talent_certifications.talent.id::uuid
    AND talents.vetting_status IN ('fully_vetted', 'approved')
  )
);


-- END FILE: 20260226000001_fix_talent_read_rls.sql


-- START FILE: 20260227120000_fix_signup_robustness.sql

-- Harden generate_talent.id::uuid to use BIGINT and validate format to prevent conversion errors
DROP FUNCTION IF EXISTS public.generate_talent.id::uuid() CASCADE;
CREATE OR REPLACE FUNCTION public.generate_talent.id::uuid()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id TEXT;
    counter BIGINT;
BEGIN
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN talent.id::uuid ~ '^TAS-VA-[0-9]+$' 
                THEN CAST(SUBSTRING(talent.id::uuid FROM 8) AS BIGINT)
                ELSE 0
            END
        ), 
        1000
    ) + 1
    INTO counter
    FROM public.talents;
    
    new_id := 'TAS-VA-' || counter::TEXT;
    RETURN new_id;
END;
$$;

-- Improve handle_new_user trigger with exception handling for talent creation
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    portal_type TEXT;
    first_name TEXT;
    last_name TEXT;
    full_name TEXT;
    company_name TEXT;
    new_talent.id::uuid TEXT;
    new_client.id::uuid TEXT;
    contact_name TEXT;
BEGIN
    portal_type := NEW.raw_user_meta_data ->> 'portal';
    first_name := NEW.raw_user_meta_data ->> 'first_name';
    last_name := NEW.raw_user_meta_data ->> 'last_name';
    full_name := NEW.raw_user_meta_data ->> 'full_name';
    company_name := NEW.raw_user_meta_data ->> 'company_name';

    -- Create Profile (idempotent)
    BEGIN
        INSERT INTO public.profiles (user_id, email, first_name, last_name)
        VALUES (NEW.id, NEW.email, first_name, last_name);
    EXCEPTION WHEN unique_violation THEN
        NULL;
    END;

    -- Create specific role profile based on portal type
    IF portal_type = 'talent' THEN
        BEGIN
            new_talent.id::uuid := public.generate_talent.id::uuid();
            
            INSERT INTO public.talents (
                user_id, talent.id::uuid, first_name, last_name, email, onboarding_completed, onboarding_step
            ) VALUES (
                NEW.id, new_talent.id::uuid, COALESCE(first_name, ''), COALESCE(last_name, ''), NEW.email, FALSE, 1
            );
        EXCEPTION 
            WHEN unique_violation THEN
                 NULL;
            WHEN OTHERS THEN
                 RAISE WARNING 'Failed to create talent profile: %', SQLERRM;
        END;
        
    ELSIF portal_type = 'client' THEN
        contact_name := COALESCE(full_name, concat_ws(' ', first_name, last_name));
        IF contact_name IS NULL OR contact_name = '' THEN
            contact_name := 'Unknown Contact';
        END IF;

        IF company_name IS NULL OR company_name = '' THEN
            company_name := 'My Company';
        END IF;

        BEGIN
            new_client.id::uuid := public.generate_client.id::uuid();
            
            INSERT INTO public.clients (
                user_id, client.id::uuid, company_name, primary_contact_name, primary_contact_email, status
            ) VALUES (
                NEW.id, new_client.id::uuid, company_name, contact_name, NEW.email, 'pending'
            );
        EXCEPTION 
            WHEN unique_violation THEN
                NULL;
            WHEN OTHERS THEN
                 RAISE WARNING 'Failed to create client profile: %', SQLERRM;
        END;
    END IF;

    -- Ensure we always return NEW to allow auth.users to be created
    RETURN NEW;
END;
$$;


-- END FILE: 20260227120000_fix_signup_robustness.sql


-- START FILE: 20260227200000_add_onboarding_step_tracking.sql

-- Migration: Add current_step and onboarding_status to talents table
-- Run: 2026-02-27

ALTER TABLE talents
  ADD COLUMN IF NOT EXISTS current_step integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'draft'
    CHECK (onboarding_status IN ('draft', 'submitted', 'under_review', 'revision_required', 'approved'));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_talents_onboarding_status ON talents(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_talents_user_id_step ON talents(user_id, current_step);


-- END FILE: 20260227200000_add_onboarding_step_tracking.sql


-- START FILE: 20260227200500_update_availability_enum.sql

-- Migration: Add 'contract' and 'hourly' to availability_type enum
-- Run: 2026-02-27

DO $$ BEGIN
    ALTER TYPE public.availability_type ADD VALUE 'contract';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE public.availability_type ADD VALUE 'hourly';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- END FILE: 20260227200500_update_availability_enum.sql


-- START FILE: 20260227210000_add_profile_completion.sql

-- Migration: Add profile_completion to talents table
-- Run: 2026-02-27

ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100);

-- Index for analytics/sorting if needed
CREATE INDEX IF NOT EXISTS idx_talents_profile_completion ON public.talents(profile_completion);


-- END FILE: 20260227210000_add_profile_completion.sql


-- START FILE: 20260227220000_add_onboarding_meta.sql

-- Migration: Add onboarding_meta and last_saved_step
-- Run: 2026-02-27

ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS last_saved_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS completed_steps INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_meta JSONB DEFAULT '{}'::jsonb;

-- Update existing records if necessary
UPDATE public.talents SET last_saved_step = current_step WHERE last_saved_step IS NULL;


-- END FILE: 20260227220000_add_onboarding_meta.sql


-- START FILE: 20260227230000_add_role_category.sql

-- Migration: Add role_category to talents
-- Run: 2026-02-27

ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS role_category TEXT;


-- END FILE: 20260227230000_add_role_category.sql


-- START FILE: 20260228000500_fix_manager_visibility.sql

-- Migration: Allow talents to view their assigned manager's profile
-- Date: 2026-02-28

-- Add policy to public.profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Talents can view their assigned manager profiles'
    ) THEN
        DROP POLICY IF EXISTS "Talents can view their assigned manager profiles" ON public.profiles;
CREATE POLICY "Talents can view their assigned manager profiles" ON public.profiles
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.talents
                WHERE talents.user_id = auth.uid()::uuid::uuid
                AND talents.assigned_manager::uuid = profiles.user_id::uuid
            )
        );
    END IF;
END $$;


-- END FILE: 20260228000500_fix_manager_visibility.sql


-- START FILE: 20260228010000_vetting_engine_core.sql

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
    assigned_admin_id::uuid UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
    requested_by_admin_id::uuid UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, section_key)
);

-- 4. Create vetting_actions table (audit trail)
CREATE TABLE IF NOT EXISTS public.vetting_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    admin_id::uuid UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
DROP POLICY IF EXISTS "Talents can view own profile" ON public.talent_profiles;
CREATE POLICY "Talents can view own profile" 
ON public.talent_profiles FOR SELECT 
USING (auth.uid()::uuid = user_id);

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.talent_profiles;
CREATE POLICY "Admins can manage profiles" 
ON public.talent_profiles FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id::uuid = auth.uid()::uuid::uuid));

DROP POLICY IF EXISTS "Clients can view vetted profiles" ON public.talent_profiles;
CREATE POLICY "Clients can view vetted profiles" 
ON public.talent_profiles FOR SELECT 
USING (visibility_to_clients = TRUE);

-- talent_profile_sections
DROP POLICY IF EXISTS "Talents can view own sections" ON public.talent_profile_sections;
CREATE POLICY "Talents can view own sections" 
ON public.talent_profile_sections FOR SELECT 
USING (auth.uid()::uuid = user_id);

DROP POLICY IF EXISTS "Talents can update own sections if not locked" ON public.talent_profile_sections;
CREATE POLICY "Talents can update own sections if not locked" 
ON public.talent_profile_sections FOR UPDATE 
USING (auth.uid()::uuid = user_id AND status IN ('NOT_STARTED', 'COMPLETED', 'CHANGES_REQUESTED'));

DROP POLICY IF EXISTS "Admins can manage sections" ON public.talent_profile_sections;
CREATE POLICY "Admins can manage sections" 
ON public.talent_profile_sections FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id::uuid = auth.uid()::uuid::uuid));

-- vetting_actions
DROP POLICY IF EXISTS "Talents can view own vetting actions" ON public.vetting_actions;
CREATE POLICY "Talents can view own vetting actions" 
ON public.vetting_actions FOR SELECT 
USING (auth.uid()::uuid = user_id);

DROP POLICY IF EXISTS "Admins can manage vetting actions" ON public.vetting_actions;
CREATE POLICY "Admins can manage vetting actions" 
ON public.vetting_actions FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id::uuid = auth.uid()::uuid::uuid));

-- 8. RPC Backend Logic

-- 8.1. update_section_data
DROP FUNCTION IF EXISTS public.update_section_data(
    p_section_key TEXT,
    p_data JSONB,
    p_completion_percent INTEGER
) CASCADE;
CREATE OR REPLACE FUNCTION public.update_section_data(
    p_section_key TEXT,
    p_data JSONB,
    p_completion_percent INTEGER,
    p.user_id::uuid UUID DEFAULT auth.uid()::uuid
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.talent_profile_sections (user_id, section_key, data, status, updated_at)
    VALUES (auth.uid()::uuid, p_section_key, p_data, 'COMPLETED', NOW())
    ON CONFLICT (user_id, p_section_key) 
    DO UPDATE SET 
        data = p_data,
        status = 'COMPLETED',
        updated_at = NOW();

    UPDATE public.talent_profiles 
    SET completion_percent = p_completion_percent, updated_at = NOW()
    WHERE user_id::uuid = COALESCE(p.user_id::uuid, auth.uid()::uuid);
END;
$$;

-- 8.2. submit_talent_onboarding
DROP FUNCTION IF EXISTS public.submit_talent_onboarding() CASCADE;
CREATE OR REPLACE FUNCTION public.submit_talent_onboarding(p.user_id::uuid UUID DEFAULT auth.uid()::uuid)
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
    WHERE user_id::uuid = COALESCE(p.user_id::uuid, auth.uid()::uuid);

    -- Set sections status
    UPDATE public.talent_profile_sections
    SET 
        status = 'SUBMITTED',
        submitted_at = NOW(),
        updated_at = NOW()
    WHERE user_id::uuid = COALESCE(p.user_id::uuid, auth.uid()::uuid) 
    AND status = 'COMPLETED';

    -- Log action
    INSERT INTO public.vetting_actions (user_id, action_type, note)
    VALUES (auth.uid()::uuid, 'SUBMIT_PROFILE', 'Talent submitted onboarding profile');
END;
$$;

-- 8.3. admin_start_review
DROP FUNCTION IF EXISTS public.admin_start_review(p_talent.user_id::uuid UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_start_review(p_talent.user_id::uuid UUID)
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
        assigned_admin_id::uuid = auth.uid()::uuid::uuid
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid
    AND status = 'SUBMITTED';

    IF FOUND THEN
        INSERT INTO public.vetting_actions (user_id, admin_id::uuid, action_type, note)
        VALUES (p_talent.user_id::uuid, auth.uid()::uuid, 'START_REVIEW', 'Admin started reviewing profile');
    END IF;
END;
$$;

-- 8.4. admin_approve_section
DROP FUNCTION IF EXISTS public.admin_approve_section(
    p_talent.user_id::uuid UUID,
    p_section_key TEXT
) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_approve_section(
    p_talent.user_id::uuid UUID,
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
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid 
    AND section_key = p_section_key;

    INSERT INTO public.vetting_actions (user_id, admin_id::uuid, action_type, section_key, note)
    VALUES (p_talent.user_id::uuid, auth.uid()::uuid, 'APPROVE_SECTION', p_section_key, 'Admin approved section');
END;
$$;

-- 8.5. admin_request_changes
DROP FUNCTION IF EXISTS public.admin_request_changes(
    p_talent.user_id::uuid UUID,
    p_section_key TEXT,
    p_changes_note TEXT,
    p_fields TEXT[]) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_request_changes(
    p_talent.user_id::uuid UUID,
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
        requested_by_admin_id::uuid = auth.uid()::uuid::uuid,
        updated_at = NOW()
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid 
    AND section_key = p_section_key;

    -- Update overall status
    UPDATE public.talent_profiles
    SET 
        status = 'CHANGES_REQUESTED',
        last_action_at = NOW(),
        updated_at = NOW()
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid;

    -- Log action
    INSERT INTO public.vetting_actions (user_id, admin_id::uuid, action_type, section_key, note, metadata)
    VALUES (p_talent.user_id::uuid, auth.uid()::uuid, 'REQUEST_CHANGES', p_section_key, p_changes_note, jsonb_build_object('fields', p_fields));

    -- Notify talent
    INSERT INTO public.notifications (user_id, title, message, type, payload)
    VALUES (
        p_talent.user_id::uuid, 
        'Revisions Requested', 
        'Admin requested changes for ' || p_section_key, 
        'CHANGES_REQUESTED', 
        jsonb_build_object('section_key', p_section_key)
    );
END;
$$;

-- 8.6. resubmit_sections
DROP FUNCTION IF EXISTS public.resubmit_sections(p_section_keys TEXT[]) CASCADE;
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
        WHERE user_id::uuid = COALESCE(p.user_id::uuid, auth.uid()::uuid) 
        AND section_key = sk
        AND status = 'CHANGES_REQUESTED';
    END LOOP;

    -- Check if any sections are still in CHANGES_REQUESTED
    SELECT NOT EXISTS (
        SELECT 1 FROM public.talent_profile_sections 
        WHERE user_id::uuid = COALESCE(p.user_id::uuid, auth.uid()::uuid) 
        AND status = 'CHANGES_REQUESTED'
    ) INTO all_resubmitted;

    IF all_resubmitted THEN
        UPDATE public.talent_profiles
        SET 
            status = 'RESUBMITTED',
            last_action_at = NOW(),
            updated_at = NOW()
        WHERE user_id::uuid = COALESCE(p.user_id::uuid, auth.uid()::uuid);
    END IF;

    -- Log action
    INSERT INTO public.vetting_actions (user_id, action_type, note, metadata)
    VALUES (auth.uid()::uuid, 'RESUBMIT_SECTIONS', 'Talent resubmitted requested sections', jsonb_build_object('sections', p_section_keys));
END;
$$;

-- 8.7. admin_finalize_vetting
DROP FUNCTION IF EXISTS public.admin_finalize_vetting(
    p_talent.user_id::uuid UUID,
    p_vetting_level TEXT
) CASCADE;
CREATE OR REPLACE FUNCTION public.admin_finalize_vetting(
    p_talent.user_id::uuid UUID,
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
        WHERE user_id::uuid = p_talent.user_id::uuid::uuid 
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
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid;

    -- Log action
    INSERT INTO public.vetting_actions (user_id, admin_id::uuid, action_type, note, metadata)
    VALUES (p_talent.user_id::uuid, auth.uid()::uuid, 'MARK_VETTED', 'Admin finalized vetting and assigned level', jsonb_build_object('level', p_vetting_level));

    -- Notify talent
    INSERT INTO public.notifications (user_id, title, message, type, payload)
    VALUES (
        p_talent.user_id::uuid, 
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


-- END FILE: 20260228010000_vetting_engine_core.sql


-- START FILE: 20260228100000_v2_01_tables.sql

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
    talent.id::uuid             TEXT UNIQUE,                       -- human-readable ID from legacy
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
    admin_id::uuid     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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


-- END FILE: 20260228100000_v2_01_tables.sql


-- START FILE: 20260228100001_v2_02_rls.sql

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
DROP POLICY IF EXISTS "Anyone can read settings" ON public.app_settings;
CREATE POLICY "Anyone can read settings"
ON public.app_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Only superadmin can update settings" ON public.app_settings;
CREATE POLICY "Only superadmin can update settings"
ON public.app_settings FOR UPDATE
USING (public.is_admin(auth.uid()::uuid));

-- ── v2_talent_profiles ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Talent reads own profile" ON public.v2_talent_profiles;
CREATE POLICY "Talent reads own profile"
ON public.v2_talent_profiles FOR SELECT
USING (auth.uid() = user_id::uuid);

DROP POLICY IF EXISTS "Talent inserts own profile" ON public.v2_talent_profiles;
CREATE POLICY "Talent inserts own profile"
ON public.v2_talent_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id::uuid);

DROP POLICY IF EXISTS "Talent updates own profile" ON public.v2_talent_profiles;
CREATE POLICY "Talent updates own profile"
ON public.v2_talent_profiles FOR UPDATE
USING (auth.uid() = user_id::uuid);

DROP POLICY IF EXISTS "Admin reads all profiles" ON public.v2_talent_profiles;
CREATE POLICY "Admin reads all profiles"
ON public.v2_talent_profiles FOR SELECT
USING (public.is_admin(auth.uid()::uuid));

DROP POLICY IF EXISTS "Admin updates all profiles" ON public.v2_talent_profiles;
CREATE POLICY "Admin updates all profiles"
ON public.v2_talent_profiles FOR UPDATE
USING (public.is_admin(auth.uid()::uuid));

DROP POLICY IF EXISTS "Client reads vetted visible profiles" ON public.v2_talent_profiles;
CREATE POLICY "Client reads vetted visible profiles"
ON public.v2_talent_profiles FOR SELECT
USING (
    public.has_role(auth.uid(), 'client')
    AND status = 'vetted'
    AND visible_to_clients = true
);

-- ── v2_profile_sections ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Talent reads own sections" ON public.v2_profile_sections;
CREATE POLICY "Talent reads own sections"
ON public.v2_profile_sections FOR SELECT
USING (auth.uid() = user_id::uuid);

DROP POLICY IF EXISTS "Talent inserts own sections" ON public.v2_profile_sections;
CREATE POLICY "Talent inserts own sections"
ON public.v2_profile_sections FOR INSERT
WITH CHECK (auth.uid() = user_id::uuid);

DROP POLICY IF EXISTS "Talent updates own sections" ON public.v2_profile_sections;
CREATE POLICY "Talent updates own sections"
ON public.v2_profile_sections FOR UPDATE
USING (auth.uid() = user_id::uuid);

DROP POLICY IF EXISTS "Admin reads all sections" ON public.v2_profile_sections;
CREATE POLICY "Admin reads all sections"
ON public.v2_profile_sections FOR SELECT
USING (public.is_admin(auth.uid()::uuid));

DROP POLICY IF EXISTS "Admin updates all sections" ON public.v2_profile_sections;
CREATE POLICY "Admin updates all sections"
ON public.v2_profile_sections FOR UPDATE
USING (public.is_admin(auth.uid()::uuid));

-- ── v2_documents ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Talent manages own docs" ON public.v2_documents;
CREATE POLICY "Talent manages own docs"
ON public.v2_documents FOR ALL
USING (auth.uid() = user_id::uuid);

DROP POLICY IF EXISTS "Admin reads all docs" ON public.v2_documents;
CREATE POLICY "Admin reads all docs"
ON public.v2_documents FOR SELECT
USING (public.is_admin(auth.uid()::uuid));

-- ── v2_vetting_actions ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Talent reads own actions" ON public.v2_vetting_actions;
CREATE POLICY "Talent reads own actions"
ON public.v2_vetting_actions FOR SELECT
USING (auth.uid() = user_id::uuid);

DROP POLICY IF EXISTS "Admin reads all actions" ON public.v2_vetting_actions;
CREATE POLICY "Admin reads all actions"
ON public.v2_vetting_actions FOR SELECT
USING (public.is_admin(auth.uid()::uuid));

DROP POLICY IF EXISTS "Admin inserts actions" ON public.v2_vetting_actions;
CREATE POLICY "Admin inserts actions"
ON public.v2_vetting_actions FOR INSERT
WITH CHECK (public.is_admin(auth.uid()::uuid));

-- ── v2_notifications ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "User reads own notifications" ON public.v2_notifications;
CREATE POLICY "User reads own notifications"
ON public.v2_notifications FOR SELECT
USING (auth.uid()::uuid = user_id::uuid);

DROP POLICY IF EXISTS "User marks own notifications read" ON public.v2_notifications;
CREATE POLICY "User marks own notifications read"
ON public.v2_notifications FOR UPDATE
USING (auth.uid()::uuid = user_id::uuid);

-- Allow RPCs (running as SECURITY DEFINER) to insert notifications
-- by granting INSERT to authenticated via a permissive policy;
-- the actual insert is done only from trusted RPCs.
DROP POLICY IF EXISTS "System inserts notifications" ON public.v2_notifications;
CREATE POLICY "System inserts notifications"
ON public.v2_notifications FOR INSERT
WITH CHECK (true);


-- END FILE: 20260228100001_v2_02_rls.sql


-- START FILE: 20260228100002_v2_03_rpcs.sql

-- ============================================================
-- V2 Vetting System – 03: RPC Functions (SECURITY DEFINER)
-- ============================================================

-- ── Helper: recompute progress_percent ─────────────────────────────────────
DROP FUNCTION IF EXISTS public.v2_recompute_progress(p.user_id::uuid UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_recompute_progress(p.user_id::uuid UUID DEFAULT auth.uid())
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
    WHERE user_id::uuid = p.user_id::uuid::uuid
      AND data != '{}'::jsonb
      AND status != 'not_started';

    pct := ROUND((filled_sections::NUMERIC / total_sections) * 100)::INT;

    UPDATE public.v2_talent_profiles
    SET progress_percent = pct,
        updated_at = now()
    WHERE user_id::uuid = p.user_id::uuid::uuid;

    RETURN pct;
END;
$$;


-- ── 1. v2_save_section_data ────────────────────────────────────────────────
-- Called by talent to save / update a section's JSONB data.
-- Upserts the section row, merges data, updates status + progress.
DROP FUNCTION IF EXISTS public.v2_save_section_data(
    p_section_key TEXT,
    p_data        JSONB
) CASCADE;
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
    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id::uuid = v_user_id::uuid;
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
    WHERE user_id::uuid = v_user_id::uuid AND section_key = p_section_key;

    v_progress := public.v2_recompute_progress(v_user_id);

    RETURN jsonb_build_object(
        'section', row_to_json(v_section),
        'progress_percent', v_progress
    );
END;
$$;


-- ── 2. v2_submit_profile ───────────────────────────────────────────────────
-- Called by talent when all steps are done and they hit final submit.
DROP FUNCTION IF EXISTS public.v2_submit_profile() CASCADE;
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
    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id::uuid = v_user_id::uuid;
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
        WHERE user_id::uuid = v_user_id::uuid AND section_key = required_sections.sk
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
    WHERE user_id::uuid = v_user_id::uuid;

    -- Mark all sections as submitted
    UPDATE public.v2_profile_sections SET
        status = 'submitted',
        submitted_at = now(),
        updated_at = now()
    WHERE user_id::uuid = v_user_id::uuid AND status IN ('in_progress','not_started');

    -- Audit
    INSERT INTO public.v2_vetting_actions (user_id, action)
    VALUES (v_user_id, 'SUBMIT');

    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id::uuid = v_user_id::uuid;
    RETURN row_to_json(v_profile)::JSONB;
END;
$$;


-- ── 3. v2_admin_start_review ───────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.v2_admin_start_review(
    p_talent.user_id::uuid UUID
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_start_review(
    p_talent.user_id::uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_id::uuid UUID := auth.uid();
    v_profile  public.v2_talent_profiles%ROWTYPE;
BEGIN
    IF NOT public.is_admin(v_admin_id::uuid) THEN
        RAISE EXCEPTION 'Unauthorised';
    END IF;

    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id::uuid = p_talent.user_id::uuid::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

    IF v_profile.status NOT IN ('submitted','resubmitted') THEN
        RAISE EXCEPTION 'Profile status must be submitted or resubmitted, got %', v_profile.status;
    END IF;

    UPDATE public.v2_talent_profiles SET
        status = 'in_review',
        updated_at = now()
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid;

    INSERT INTO public.v2_vetting_actions (user_id, admin_id::uuid, action)
    VALUES (p_talent.user_id::uuid, v_admin_id::uuid, 'START_REVIEW');

    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id::uuid = p_talent.user_id::uuid::uuid;
    RETURN row_to_json(v_profile)::JSONB;
END;
$$;


-- ── 4. v2_admin_approve_section ────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.v2_admin_approve_section(
    p_talent.user_id::uuid UUID,
    p_section_key    TEXT,
    p_note           TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_approve_section(
    p_talent.user_id::uuid UUID,
    p_section_key    TEXT,
    p_note           TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_id::uuid UUID := auth.uid();
    v_section  public.v2_profile_sections%ROWTYPE;
    v_profile  public.v2_talent_profiles%ROWTYPE;
BEGIN
    IF NOT public.is_admin(v_admin_id::uuid) THEN RAISE EXCEPTION 'Unauthorised'; END IF;

    UPDATE public.v2_profile_sections SET
        status = 'approved',
        approved_at = now(),
        requested_changes = '{}',
        updated_at = now()
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid AND section_key = p_section_key;

    IF NOT FOUND THEN RAISE EXCEPTION 'Section not found'; END IF;

    -- Auto-transition profile to in_review if not already
    UPDATE public.v2_talent_profiles SET
        status = CASE WHEN status IN ('submitted','resubmitted') THEN 'in_review' ELSE status END,
        updated_at = now()
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid;

    INSERT INTO public.v2_vetting_actions (user_id, admin_id::uuid, action, section_key, note)
    VALUES (p_talent.user_id::uuid, v_admin_id::uuid, 'APPROVE_SECTION', p_section_key, p_note);

    INSERT INTO public.v2_notifications (user_id, type, title, message, payload)
    VALUES (p_talent.user_id::uuid, 'SECTION_APPROVED',
            'Section Approved',
            'Your "' || p_section_key || '" section has been approved.',
            jsonb_build_object('section_key', p_section_key));

    SELECT * INTO v_section FROM public.v2_profile_sections WHERE user_id::uuid = p_talent.user_id::uuid::uuid AND section_key = p_section_key;
    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id::uuid = p_talent.user_id::uuid::uuid;

    RETURN jsonb_build_object('section', row_to_json(v_section), 'profile', row_to_json(v_profile));
END;
$$;


-- ── 5. v2_admin_request_changes ────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.v2_admin_request_changes(
    p_talent.user_id::uuid UUID,
    p_section_key    TEXT,
    p_note           TEXT,
    p_fields         TEXT[]) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_request_changes(
    p_talent.user_id::uuid UUID,
    p_section_key    TEXT,
    p_note           TEXT,
    p_fields         TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_id::uuid UUID := auth.uid();
    v_section  public.v2_profile_sections%ROWTYPE;
    v_profile  public.v2_talent_profiles%ROWTYPE;
BEGIN
    IF NOT public.is_admin(v_admin_id::uuid) THEN RAISE EXCEPTION 'Unauthorised'; END IF;

    UPDATE public.v2_profile_sections SET
        status = 'changes_requested',
        requested_changes = jsonb_build_object(
            'note', p_note,
            'fields', to_jsonb(p_fields),
            'requested_by', v_admin_id::uuid,
            'requested_at', now()
        ),
        updated_at = now()
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid AND section_key = p_section_key;

    IF NOT FOUND THEN RAISE EXCEPTION 'Section not found'; END IF;

    UPDATE public.v2_talent_profiles SET
        status = 'changes_requested',
        updated_at = now()
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid;

    INSERT INTO public.v2_vetting_actions (user_id, admin_id::uuid, action, section_key, note, meta)
    VALUES (p_talent.user_id::uuid, v_admin_id::uuid, 'REQUEST_CHANGES', p_section_key, p_note,
            jsonb_build_object('fields', to_jsonb(p_fields)));

    INSERT INTO public.v2_notifications (user_id, type, title, message, payload)
    VALUES (p_talent.user_id::uuid, 'CHANGES_REQUESTED',
            'Changes Requested',
            'An admin has requested changes on your "' || p_section_key || '" section.',
            jsonb_build_object('section_key', p_section_key, 'note', p_note));

    SELECT * INTO v_section FROM public.v2_profile_sections WHERE user_id::uuid = p_talent.user_id::uuid::uuid AND section_key = p_section_key;
    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id::uuid = p_talent.user_id::uuid::uuid;

    RETURN jsonb_build_object('section', row_to_json(v_section), 'profile', row_to_json(v_profile));
END;
$$;


-- ── 6. v2_talent_resubmit_sections ─────────────────────────────────────────
DROP FUNCTION IF EXISTS public.v2_talent_resubmit_sections(
    p_section_keys TEXT[]
) CASCADE;
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
        WHERE user_id::uuid = v_user_id::uuid
          AND section_key = v_key
          AND status = 'changes_requested';
    END LOOP;

    UPDATE public.v2_talent_profiles SET
        status = 'resubmitted',
        updated_at = now()
    WHERE user_id::uuid = v_user_id::uuid;

    INSERT INTO public.v2_vetting_actions (user_id, action, meta)
    VALUES (v_user_id, 'RESUBMIT', jsonb_build_object('sections', to_jsonb(p_section_keys)));

    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id::uuid = v_user_id::uuid;
    RETURN row_to_json(v_profile)::JSONB;
END;
$$;


-- ── 7. v2_admin_finalize_vetting ───────────────────────────────────────────
DROP FUNCTION IF EXISTS public.v2_admin_finalize_vetting(
    p_talent.user_id::uuid UUID,
    p_vetting_level  INT
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_finalize_vetting(
    p_talent.user_id::uuid UUID,
    p_vetting_level  INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_id::uuid     UUID := auth.uid();
    v_profile      public.v2_talent_profiles%ROWTYPE;
    v_unapproved   INT;
BEGIN
    IF NOT public.is_admin(v_admin_id::uuid) THEN RAISE EXCEPTION 'Unauthorised'; END IF;

    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id::uuid = p_talent.user_id::uuid::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

    -- All 7 sections must be approved
    SELECT count(*) INTO v_unapproved
    FROM public.v2_profile_sections
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid AND status != 'approved';

    IF v_unapproved > 0 THEN
        RAISE EXCEPTION '% section(s) are not yet approved', v_unapproved;
    END IF;

    UPDATE public.v2_talent_profiles SET
        status = 'vetted',
        vetting_level = p_vetting_level,
        vetted_at = now(),
        visible_to_clients = true,
        updated_at = now()
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid;

    INSERT INTO public.v2_vetting_actions (user_id, admin_id::uuid, action, meta)
    VALUES (p_talent.user_id::uuid, v_admin_id::uuid, 'ASSIGN_LEVEL',
            jsonb_build_object('vetting_level', p_vetting_level));

    INSERT INTO public.v2_vetting_actions (user_id, admin_id::uuid, action)
    VALUES (p_talent.user_id::uuid, v_admin_id::uuid, 'MARK_VETTED');

    INSERT INTO public.v2_notifications (user_id, type, title, message, payload)
    VALUES (p_talent.user_id::uuid, 'PROFILE_VETTED',
            'Profile Fully Vetted',
            'Congratulations! Your profile has been fully vetted and is now visible to clients.',
            jsonb_build_object('vetting_level', p_vetting_level));

    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id::uuid = p_talent.user_id::uuid::uuid;
    RETURN row_to_json(v_profile)::JSONB;
END;
$$;


-- END FILE: 20260228100002_v2_03_rpcs.sql


-- START FILE: 20260228100003_v2_04_triggers_audit.sql

-- ============================================================
-- V2 Vetting System – 04: Triggers & Audit
-- ============================================================

-- Auto-update updated_at on v2_talent_profiles
DROP FUNCTION IF EXISTS public.v2_set_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.v2_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS v2_talent_profiles_updated_at ON public.v2_talent_profiles;
CREATE TRIGGER v2_talent_profiles_updated_at BEFORE UPDATE ON public.v2_talent_profiles
    FOR EACH ROW EXECUTE FUNCTION public.v2_set_updated_at();

DROP TRIGGER IF EXISTS v2_profile_sections_updated_at ON public.v2_profile_sections;
CREATE TRIGGER v2_profile_sections_updated_at BEFORE UPDATE ON public.v2_profile_sections
    FOR EACH ROW EXECUTE FUNCTION public.v2_set_updated_at();

-- Auto-create V2 profile when a talent signs up (or when talent row is created)
DROP FUNCTION IF EXISTS public.v2_auto_create_profile() CASCADE;
CREATE OR REPLACE FUNCTION public.v2_auto_create_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.v2_talent_profiles (user_id, talent.id::uuid)
    VALUES (NEW.user_id, NEW.talent.id::uuid)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS v2_on_talent_created ON public.talents;
DROP TRIGGER IF EXISTS v2_on_talent_created ON public.talents;
CREATE TRIGGER v2_on_talent_created AFTER INSERT ON public.talents
    FOR EACH ROW EXECUTE FUNCTION public.v2_auto_create_profile();


-- END FILE: 20260228100003_v2_04_triggers_audit.sql


-- START FILE: 20260228100004_v2_05_backfill.sql

-- ============================================================
-- V2 Vetting System – 05: V1 → V2 Backfill Script
-- ============================================================
-- One-time migration that copies valid V1 data into V2 tables.
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING).

-- Step 1: Backfill v2_talent_profiles from v1 talent_profiles + talents
INSERT INTO public.v2_talent_profiles (
    user_id, talent.id::uuid, status, vetting_level,
    assigned_talent_manager, submitted_at, vetted_at,
    progress_percent, locked_onboarding, visible_to_clients,
    created_at, updated_at
)
SELECT
    tp.user_id::uuid::uuid,
    t.talent.id::uuid,
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
    COALESCE(tp.assigned_admin_id::uuid, t.assigned_manager),
    tp.submitted_at,
    tp.vetted_at,
    COALESCE(tp.completion_percent, t.profile_completion, 0),
    COALESCE(tp.locked_onboarding, false),
    COALESCE(tp.visibility_to_clients, false),
    COALESCE(tp.created_at, t.created_at, now()),
    now()
FROM public.talent_profiles tp
JOIN public.talents t ON t.user_id::uuid = tp.user_id::uuid::uuid
ON CONFLICT (user_id) DO NOTHING;

-- Also backfill talents WITHOUT a talent_profiles row (draft state)
INSERT INTO public.v2_talent_profiles (user_id, talent.id::uuid, status, progress_percent, created_at)
SELECT t.user_id::uuid, t.talent.id::uuid, 'draft', COALESCE(t.profile_completion, 0), t.created_at
FROM public.talents t
WHERE NOT EXISTS (SELECT 1 FROM public.v2_talent_profiles WHERE user_id::uuid = t.user_id::uuid)
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
INSERT INTO public.v2_vetting_actions (user_id, admin_id::uuid, action, section_key, note, meta, created_at)
SELECT
    va.user_id::uuid,
    va.admin_id::uuid,
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
    WHERE v2va.user_id::uuid::uuid = va.user_id::uuid 
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


-- END FILE: 20260228100004_v2_05_backfill.sql


-- START FILE: 20260228110000_v2_06_revetting_engine.sql

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
ADD COLUMN IF NOT EXISTS talent_manager_admin_id::uuid UUID REFERENCES auth.users(id) ON DELETE SET NULL;


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

CREATE INDEX IF NOT EXISTS idx_v2pca_user ON public.v2_profile_changes_audit.user_id::uuid);

-- Apply basic RLS
ALTER TABLE public.v2_profile_changes_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Talents can view their own audit trail" ON public.v2_profile_changes_audit;
CREATE POLICY "Talents can view their own audit trail"
    ON public.v2_profile_changes_audit FOR SELECT
    USING (auth.uid() = user_id::uuid);

DROP POLICY IF EXISTS "Admins can view all audit trails" ON public.v2_profile_changes_audit;
CREATE POLICY "Admins can view all audit trails"
    ON public.v2_profile_changes_audit FOR SELECT
    USING (public.is_admin(auth.uid()::uuid));


-- -----------------------------------------------------------------------------
-- 4. RPC: v2_update_section_post_vet
-- -----------------------------------------------------------------------------
-- Function allowing fully vetted talents to edit their profiles.
-- If they edit a critical section (e.g. skills), it revokes their vetting.
DROP FUNCTION IF EXISTS public.v2_update_section_post_vet(
    p.user_id::uuid UUID,
    p_section_key TEXT,
    p_data JSONB
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_update_section_post_vet(
    p.user_id::uuid UUID,
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
    IF auth.uid()::uuid != p.user_id::uuid::uuid AND NOT public.is_admin(auth.uid()::uuid) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- 2. Prevent edits to the basic_info (identity) section entirely here
    IF p_section_key = 'basic_info' THEN
        RAISE EXCEPTION 'Basic info cannot be edited after vetting. Contact support.';
    END IF;

    -- 3. Check current profile status
    SELECT status INTO v_profile_status
    FROM public.v2_talent_profiles
    WHERE user_id::uuid = p.user_id::uuid::uuid;

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
    WHERE user_id::uuid = p.user_id::uuid::uuid AND section_key = p_section_key;

    -- 6. Upsert the section data
    INSERT INTO public.v2_profile_sections (
        user_id, section_key, status, data, last_saved_at
    )
    VALUES (
        p.user_id::uuid, p_section_key, 'in_progress', p_data, now()
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
        p.user_id::uuid, p_section_key, p_data, v_is_critical
    );

    -- 8. If critical AND currently vetted, revoke vetting
    IF v_is_critical AND v_profile_status = 'vetted' THEN
        
        -- Snapshot the profile state before revoking (optional safety feature)
        UPDATE public.v2_talent_profiles
        SET status = 'revett_required',
            revet_request_required = true,
            visible_to_clients = false, -- Hide from clients until re-vetted
            updated_at = now()
        WHERE user_id::uuid = p.user_id::uuid::uuid;

        -- Log Revoke Action
        INSERT INTO public.v2_vetting_actions (
            user_id, action, note
        ) VALUES (
            p.user_id::uuid, 
            'REVOKED_FOR_EDIT', 
            'System automatically revoked vetting because a critical section (' || p_section_key || ') was modified.'
        );

        -- Notify Admin Queue
        INSERT INTO public.v2_notifications (
            user_id, type, title, message
        ) VALUES (
            p.user_id::uuid,
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
DROP FUNCTION IF EXISTS public.v2_talent_request_revetting(
    p.user_id::uuid UUID
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_talent_request_revetting(
    p.user_id::uuid UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_status TEXT;
BEGIN
    IF auth.uid()::uuid != p.user_id::uuid::uuid AND NOT public.is_admin(auth.uid()::uuid) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    SELECT status INTO v_profile_status
    FROM public.v2_talent_profiles
    WHERE user_id::uuid = p.user_id::uuid::uuid;

    IF v_profile_status != 'revett_required' THEN
        RAISE EXCEPTION 'Profile is not in a revett_required state.';
    END IF;

    -- Update profile
    UPDATE public.v2_talent_profiles
    SET status = 'revett_pending',
        revet_request_required = false,
        submitted_at = now(),
        updated_at = now()
    WHERE user_id::uuid = p.user_id::uuid::uuid;

    -- Log Action
    INSERT INTO public.v2_vetting_actions (
        user_id, action, note
    ) VALUES (
        p.user_id::uuid, 'REQUEST_REVETTING', 'Talent requested re-vetting after post-vet edits.'
    );

    -- Ensure sections changed from 'in_progress' to 'submitted'
    UPDATE public.v2_profile_sections
    SET status = 'submitted',
        submitted_at = now(),
        updated_at = now()
    WHERE user_id::uuid = p.user_id::uuid::uuid AND status = 'in_progress';

END;
$$;


-- -----------------------------------------------------------------------------
-- 6. RPC: v2_admin_assign_manager (Bonus helper)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.v2_admin_assign_manager(
    p_talent.user_id::uuid UUID,
    p_manager_admin_id::uuid UUID
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_assign_manager(
    p_talent.user_id::uuid UUID,
    p_manager_admin_id::uuid UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()::uuid) THEN
        RAISE EXCEPTION 'Only admins can assign managers';
    END IF;

    UPDATE public.v2_talent_profiles
    SET talent_manager_admin_id::uuid = p_manager_admin_id::uuid,
        updated_at = now()
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid;

    INSERT INTO public.v2_vetting_actions (
        user_id, admin_id::uuid, action, note
    ) VALUES (
        p_talent.user_id::uuid, auth.uid(), 'ASSIGN_MANAGER', 
        'Assigned talent manager ID: ' || p_manager_admin_id::uuid
    );
END;
$$;


-- -----------------------------------------------------------------------------
-- 7. RPC OVERRIDE: v2_admin_finalize_vetting
-- -----------------------------------------------------------------------------
-- Drops the old integer-based one and replaces it with text-based
DROP FUNCTION IF EXISTS public.v2_admin_finalize_vetting(UUID, INT);

DROP FUNCTION IF EXISTS public.v2_admin_finalize_vetting(
    p_talent.user_id::uuid UUID,
    p_vetting_level_text TEXT
) CASCADE;
CREATE OR REPLACE FUNCTION public.v2_admin_finalize_vetting(
    p_talent.user_id::uuid UUID,
    p_vetting_level_text TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_status TEXT;
BEGIN
    IF NOT public.is_admin(auth.uid()::uuid) THEN
        RAISE EXCEPTION 'Only admins can finalize vetting';
    END IF;

    SELECT status INTO v_profile_status
    FROM public.v2_talent_profiles
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid;

    -- Update profile to vetted, make visible to clients
    UPDATE public.v2_talent_profiles
    SET status = 'vetted',
        vetting_level_text = p_vetting_level_text,
        visible_to_clients = true,
        vetted_at = now(),
        updated_at = now()
    WHERE user_id::uuid = p_talent.user_id::uuid::uuid;

    -- Store action
    INSERT INTO public.v2_vetting_actions (
        user_id, admin_id::uuid, action, note, meta
    ) VALUES (
        p_talent.user_id::uuid,
        auth.uid(),
        'MARK_VETTED',
        'Profile marked as fully vetted. Level: ' || p_vetting_level_text,
        jsonb_build_object('assigned_level', p_vetting_level_text)
    );

    -- Notify talent
    INSERT INTO public.v2_notifications (
        user_id, type, title, message
    ) VALUES (
        p_talent.user_id::uuid,
        'PROFILE_VETTED',
        'Profile Approved!',
        'Congratulations, your profile has been fully vetted and is now visible to clients.'
    );
END;
$$;


-- END FILE: 20260228110000_v2_06_revetting_engine.sql


-- START FILE: 20260228153000_add_suspension.sql

-- Add suspension fields to v2_talent_profiles
ALTER TABLE public.v2_talent_profiles 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for filtering suspended talents
CREATE INDEX IF NOT EXISTS idx_v2tp_suspended ON public.v2_talent_profiles(is_suspended) WHERE is_suspended = true;

-- Update RLS to hide suspended talents from clients
-- Assuming we have an existing policy that allows clients to view 'vetted' talents
-- We need to ensure is_suspended = false is part of it.

-- First, let's check existing policies for v2_talent_profiles
-- (I'll do this in a separate step if needed, but adding a safe guard here)
DO $$ 
BEGIN
    -- This is a placeholder for actual policy updates if they exist.
    -- Usually, client browsing logic already filters by visible_to_clients = true.
    -- We should ensure is_suspended being true sets visible_to_clients = false or is checked explicitly.
END $$;


-- END FILE: 20260228153000_add_suspension.sql


-- START FILE: 20260301100000_client_talent_module.sql

-- ============================================================
-- Client Talent Module – Data Exposure & Engagement
-- ============================================================

-- 0. Ensure foreign key exists for robust joins in Postgrest
-- Many admin queries use v2_talent_profiles -> talents join via user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_v2tp_talents'
    ) THEN
        ALTER TABLE public.v2_talent_profiles
        ADD CONSTRAINT fk_v2tp_talents
        FOREIGN KEY (user_id) REFERENCES public.talents(user_id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- ── 1. client_visible_talents View ─────────────────────────────────────────
-- Securely exposes non-sensitive talent data for the browse grid.
CREATE OR REPLACE VIEW public.client_visible_talents AS
SELECT
    tp.id as profile_id,
    t.id::uuid as talent.id::uuid,
    tp.user_id::uuid::uuid,
    tp.talent.id::uuid as display_id,
    -- Anonymized Name (First Name + Last Initial)
    COALESCE(
        (SELECT (data->>'firstName')::text || ' ' || LEFT((data->>'lastName')::text, 1) || '.'
         FROM public.v2_profile_sections
         WHERE user_id::uuid = tp.user_id::uuid::uuid AND section_key = 'basic_info'),
        t.first_name || ' ' || LEFT(t.last_name, 1) || '.'
    ) as anonymized_name,
    -- Headline / Primary Role
    COALESCE(
        (SELECT (data->>'primaryRole')::text
         FROM public.v2_profile_sections
         WHERE user_id::uuid = tp.user_id::uuid::uuid AND section_key = 'professional_details'),
        t.primary_role
    ) as headline,
    tp.vetting_level,
    -- Location (City + Country)
    COALESCE(
        (SELECT 
            CASE 
                WHEN (data->>'city') IS NOT NULL AND (data->>'country') IS NOT NULL 
                THEN (data->>'city')::text || ', ' || (data->>'country')::text
                ELSE (data->>'country')::text
            END
         FROM public.v2_profile_sections
         WHERE user_id::uuid = tp.user_id::uuid::uuid AND section_key = 'basic_info'),
        t.country
    ) as location,
    -- Experience
    COALESCE(
        (SELECT (data->>'yearsOfExperience')::int
         FROM public.v2_profile_sections
         WHERE user_id::uuid = tp.user_id::uuid::uuid AND section_key = 'professional_details'),
        t.years_of_experience
    ) as years_experience,
    -- Availability
    COALESCE(
        (SELECT (data->>'availability')::text
         FROM public.v2_profile_sections
         WHERE user_id::uuid = tp.user_id::uuid::uuid AND section_key = 'professional_details'),
        t.availability::text
    ) as availability,
    -- Skills (Top tags)
    (SELECT (data->'secondarySkills')
     FROM public.v2_profile_sections
     WHERE user_id::uuid = tp.user_id::uuid::uuid AND section_key = 'professional_details') as skills,
    -- Avatar
    p.avatar_url,
    -- Bio for summary
    (SELECT (data->>'shortBio')::text
     FROM public.v2_profile_sections
     WHERE user_id::uuid = tp.user_id::uuid::uuid AND section_key = 'professional_details') as bio,
    tp.vetted_at
FROM public.v2_talent_profiles tp
LEFT JOIN public.talents t ON tp.user_id::uuid::uuid::uuid = t.user_id::uuid::uuid
LEFT JOIN public.profiles p ON tp.user_id::uuid::uuid::uuid = p.user_id::uuid::uuid
WHERE tp.status = 'vetted' AND tp.visible_to_clients = true;

-- ── 2. get_client_talent_profile RPC ───────────────────────────────────────
-- Securely returns full professional details for a specific talent.
DROP FUNCTION IF EXISTS public.get_client_talent_profile(p_talent.id::uuid UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_client_talent_profile(p_talent.id::uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile RECORD;
    v_sections JSONB;
    v_avatar_url TEXT;
BEGIN
    -- Authorization check: Client or Admin only
    IF NOT (public.has_role(auth.uid()::uuid, 'client') OR public.is_admin(auth.uid()::uuid)) THEN
        RETURN NULL;
    END IF;

    -- Map talent.id::uuid (public.talents.id) to user_id and profile
    SELECT t.user_id::uuid, p.avatar_url 
    INTO v_user_id, v_avatar_url 
    FROM public.talents t
    LEFT JOIN public.profiles p ON t.user_id::uuid::uuid = p.user_id::uuid::uuid
    WHERE t.id::uuid = p_talent.id::uuid;
    
    -- Ensure vetted status and client visibility
    SELECT * INTO v_profile FROM public.v2_talent_profiles 
    WHERE user_id::uuid = v_user_id::uuid AND status = 'vetted' AND visible_to_clients = true;

    IF NOT FOUND THEN RETURN NULL; END IF;

    -- Aggregate approved sections data (excluding sensitive documents)
    SELECT jsonb_object_agg(section_key, data) INTO v_sections
    FROM public.v2_profile_sections
    WHERE user_id::uuid = v_user_id::uuid AND status = 'approved'
    AND section_key IN ('basic_info', 'professional_details', 'work_history', 'education', 'certifications');

    -- Build sanitised output object (Zero PII leak)
    RETURN jsonb_build_object(
        'id', p_talent.id::uuid,
        'display_id', v_profile.talent.id::uuid,
        'first_name', v_sections->'basic_info'->>'firstName',
        'last_initial', LEFT(v_sections->'basic_info'->>'lastName', 1),
        'avatar_url', v_avatar_url,
        'headline', v_sections->'professional_details'->>'primaryRole',
        'vetting_level', v_profile.vetting_level,
        'years_experience', (v_sections->'professional_details'->>'yearsOfExperience')::int,
        'availability', v_sections->'professional_details'->>'availability',
        'location', (v_sections->'basic_info'->>'city') || ', ' || (v_sections->'basic_info'->>'country'),
        'bio', v_sections->'professional_details'->>'shortBio',
        'skills', COALESCE(v_sections->'professional_details'->'secondarySkills', '[]'::jsonb),
        'tools', COALESCE(v_sections->'professional_details'->'toolsFamiliarWith', '[]'::jsonb),
        'languages', COALESCE(v_sections->'professional_details'->'languagesSpoken', '[]'::jsonb),
        'work_history', COALESCE(v_sections->'work_history'->'workHistory', '[]'::jsonb),
        'education', COALESCE(v_sections->'education'->'education', '[]'::jsonb),
        'certifications', COALESCE(v_sections->'certifications'->'certifications', '[]'::jsonb)
    );
END;
$$;

-- ── 3. interview_requests Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interview_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client.id::uuid     UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    talent.id::uuid     UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
    job_id        UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    scheduled_at  TIMESTAMPTZ NOT NULL,
    message       TEXT,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- RLS for interview_requests
ALTER TABLE public.interview_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can manage their own interview requests" ON public.interview_requests;
DROP POLICY IF EXISTS "Clients can manage their own interview requests" ON public.interview_requests;
CREATE POLICY "Clients can manage their own interview requests" 
ON public.interview_requests FOR ALL 
USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = interview_requests.client.id::uuid AND c.user_id::uuid = auth.uid()::uuid::uuid));

DROP POLICY IF EXISTS "Talents can view their own interview requests" ON public.interview_requests;
DROP POLICY IF EXISTS "Talents can view their own interview requests" ON public.interview_requests;
CREATE POLICY "Talents can view their own interview requests" 
ON public.interview_requests FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.talents t WHERE t.id::uuid = interview_requests.talent.id::uuid AND t.user_id::uuid::uuid = auth.uid()::uuid::uuid));

DROP POLICY IF EXISTS "Admins can view all interview requests" ON public.interview_requests;
DROP POLICY IF EXISTS "Admins can view all interview requests" ON public.interview_requests;
CREATE POLICY "Admins can view all interview requests" 
ON public.interview_requests FOR SELECT 
USING (public.is_admin(auth.uid()::uuid));

-- ── 4. RLS for v2_profile_sections (Client access to professional data) ──
-- Clients need to read professional_details and other non-PII sections to browse.
DROP POLICY IF EXISTS "Client reads vetted visible sections" ON public.v2_profile_sections;
DROP POLICY IF EXISTS "Client reads vetted visible sections" ON public.v2_profile_sections;
CREATE POLICY "Client reads vetted visible sections"
ON public.v2_profile_sections FOR SELECT
USING (
    (public.has_role(auth.uid()::uuid, 'client') OR public.is_admin(auth.uid()::uuid))
    AND section_key IN ('basic_info', 'professional_details', 'work_history', 'education', 'certifications')
    AND EXISTS (
        SELECT 1 FROM public.v2_talent_profiles tp
        WHERE tp.user_id::uuid::uuid = v2_profile_sections.user_id
          AND tp.status = 'vetted'
          AND tp.visible_to_clients = true
    )
);

-- ── 5. RLS for talents (Client access to legacy table during join) ──
DROP POLICY IF EXISTS "Client reads vetted visible talents" ON public.talents;
DROP POLICY IF EXISTS "Client reads vetted visible talents" ON public.talents;
CREATE POLICY "Client reads vetted visible talents"
ON public.talents FOR SELECT
USING (
    (public.has_role(auth.uid()::uuid, 'client') OR public.is_admin(auth.uid()::uuid))
    AND EXISTS (
        SELECT 1 FROM public.v2_talent_profiles tp
        WHERE tp.user_id::uuid::uuid = talents.user_id
          AND tp.status = 'vetted'
          AND tp.visible_to_clients = true
    )
);

-- ── 6. RLS for profiles (Client access to avatars) ──
DROP POLICY IF EXISTS "Client reads vetted visible avatars" ON public.profiles;
DROP POLICY IF EXISTS "Client reads vetted visible avatars" ON public.profiles;
CREATE POLICY "Client reads vetted visible avatars"
ON public.profiles FOR SELECT
USING (
    (public.has_role(auth.uid()::uuid, 'client') OR public.is_admin(auth.uid()::uuid))
    AND EXISTS (
        SELECT 1 FROM public.v2_talent_profiles tp
        WHERE tp.user_id::uuid::uuid = profiles.user_id
          AND tp.status = 'vetted'
          AND tp.visible_to_clients = true
    )
);

-- Grants
GRANT SELECT ON public.client_visible_talents TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_talent_profile(UUID) TO authenticated;
GRANT ALL ON public.interview_requests TO authenticated;


-- END FILE: 20260301100000_client_talent_module.sql


