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
    admin_id UUID REFERENCES auth.users(id),
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
CREATE POLICY "Admins manage invoice_line_items" ON public.invoice_line_items FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage invoice_status_history" ON public.invoice_status_history FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage invoice_payment_records" ON public.invoice_payment_records FOR ALL USING (public.is_admin(auth.uid()));

-- Clients can view their own invoice details
CREATE POLICY "Clients view own invoice_line_items" ON public.invoice_line_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invoices i JOIN public.clients c ON i.client_id = c.id WHERE i.id = invoice_line_items.invoice_id AND c.user_id = auth.uid())
);
CREATE POLICY "Clients view own invoice_payment_records" ON public.invoice_payment_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invoices i JOIN public.clients c ON i.client_id = c.id WHERE i.id = invoice_payment_records.invoice_id AND c.user_id = auth.uid())
);

-- 8. Updated At Trigger for invoices (already exists, but ensuring it)
-- Trigger already exists as per grep: update_invoices_updated_at

-- 9. Automatic Payout Generation Logic Adjustment (Optional but good)
-- We'll keep the existing trigger for now and update UI to show linkage.
