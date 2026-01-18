-- Fix Storage and Schema Issues (Robust Version)

-- 1. Create or Ensure Storage Bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract_signatures', 'contract_signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Policies (Drop first to avoid exists error if re-running)
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT USING (bucket_id = 'contract_signatures');

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contract_signatures');

-- 2. Ensure Types Exist (Robust Creation)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
        CREATE TYPE public.service_type AS ENUM ('full_time', 'trial_to_hire', 'one_time');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compensation_type') THEN
        CREATE TYPE public.compensation_type AS ENUM ('hourly', 'fixed', 'monthly');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_frequency') THEN
        CREATE TYPE public.billing_frequency AS ENUM ('weekly', 'bi_weekly', 'monthly');
    END IF;
END$$;

-- 3. Modify Contracts Table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS talent_contract_terms TEXT,
ADD COLUMN IF NOT EXISTS client_gross_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS billing_frequency billing_frequency,
ADD COLUMN IF NOT EXISTS compensation_type compensation_type;

-- 4. Reload Schema Cache Trigger
NOTIFY pgrst, 'reload schema';
