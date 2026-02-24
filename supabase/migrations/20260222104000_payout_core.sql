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
    admin_id UUID REFERENCES auth.users(id),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Talent Payment Methods
CREATE TABLE IF NOT EXISTS public.talent_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
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
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
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
    payout_id UUID REFERENCES public.payouts(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payout Audit Log
CREATE TABLE IF NOT EXISTS public.payout_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_id UUID REFERENCES public.payouts(id) ON DELETE CASCADE NOT NULL,
    old_status payout_status,
    new_status payout_status NOT NULL,
    admin_id UUID REFERENCES auth.users(id),
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
CREATE POLICY "Admins manage payout_batches" ON public.payout_batches FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage talent_payment_methods" ON public.talent_payment_methods FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage payouts" ON public.payouts FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage deduction_records" ON public.deduction_records FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage payout_audit_log" ON public.payout_audit_log FOR ALL USING (public.is_admin(auth.uid()));

-- Talents can view their own payment methods and payouts
CREATE POLICY "Talents view own payment methods" ON public.talent_payment_methods FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.talents WHERE id = talent_id));
CREATE POLICY "Talents manage own payment methods" ON public.talent_payment_methods FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.talents WHERE id = talent_id));
CREATE POLICY "Talents view own payouts" ON public.payouts FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.talents WHERE id = talent_id));

-- 8. Updated At Triggers
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_talent_payment_methods_updated_at BEFORE UPDATE ON public.talent_payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_payouts_talent_id ON public.payouts(talent_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_batch_id ON public.payouts(batch_id);
CREATE INDEX IF NOT EXISTS idx_payouts_invoice_id ON public.payouts(invoice_id);

-- 10. Automatic Payout Generation Trigger
-- When an invoice status is updated to 'paid', create the corresponding payout record.
CREATE OR REPLACE FUNCTION public.handle_invoice_payout_generation()
RETURNS TRIGGER AS $$
DECLARE
    v_contract_id UUID;
    v_talent_id UUID;
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
        SELECT c.id, c.talent_id, c.talent_rate, c.taskive_margin
        INTO v_contract_id, v_talent_id, v_talent_rate, v_taskive_margin
        FROM public.contracts c
        JOIN public.timesheets ts ON ts.contract_id = c.id
        WHERE ts.invoice_id = NEW.id
        LIMIT 1;

        IF v_contract_id IS NOT NULL THEN
            v_gross_amount := NEW.amount;
            -- Simple margin calculation
            v_commission_amount := (v_gross_amount * (COALESCE(v_taskive_margin, 20) / 100));
            v_net_amount := v_gross_amount - v_commission_amount;

            INSERT INTO public.payouts (
                talent_id,
                contract_id,
                invoice_id,
                gross_amount,
                commission_amount,
                net_amount,
                status,
                period_start,
                period_end
            ) VALUES (
                v_talent_id,
                v_contract_id,
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

CREATE TRIGGER on_invoice_paid_generate_payout
    AFTER UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_invoice_payout_generation();
