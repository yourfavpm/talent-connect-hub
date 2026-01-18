-- Add missing columns to contracts table if they don't exist
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS client_contract_terms TEXT,
ADD COLUMN IF NOT EXISTS talent_contract_terms TEXT,
ADD COLUMN IF NOT EXISTS client_gross_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS billing_frequency public.billing_frequency,
ADD COLUMN IF NOT EXISTS compensation_type public.compensation_type;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
