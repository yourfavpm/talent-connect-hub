-- Create timesheets table
CREATE TABLE IF NOT EXISTS public.timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID NOT NULL REFERENCES public.talents(id),
    contract_id UUID NOT NULL REFERENCES public.contracts(id),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_hours NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')) DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timesheet_entries table
CREATE TABLE IF NOT EXISTS public.timesheet_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timesheet_id UUID NOT NULL REFERENCES public.timesheets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Simplified for now - can be expanded)
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;

-- Allow talents to view/manage their own timesheets
CREATE POLICY "Talents manage own timesheets" ON public.timesheets
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.talents WHERE id = talent_id));

-- Allow clients to view timesheets for their contracts
CREATE POLICY "Clients view contract timesheets" ON public.timesheets
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.clients WHERE id = (SELECT client_id FROM public.contracts WHERE id = contract_id)));
    
-- Allow admins to view all
-- (Assuming admin Role check or similar - skipping specific admin policy for brevity as admins usually bypass RLS with service role or have generic admin policy)

