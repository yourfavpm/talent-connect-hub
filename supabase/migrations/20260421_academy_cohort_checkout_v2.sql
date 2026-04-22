-- Add cohort tracking to frictionless checkout flow

-- Add cohort_id to checkout_sessions
ALTER TABLE public.checkout_sessions 
    ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_cohort_id ON public.checkout_sessions(cohort_id);
