-- Rebuild Core Schema for Taskive Master Build
-- Phase 1: Enums and Table Alterations

-- 1. Create New Enums
-- Check logic to avoid errors if they exist, or just CREATE TYPE if not exists logic (Postgres doesn't have IF NOT EXISTS for types easily, so we wrap in DO block or just try/catch if needed, but for migration files sticking to standard CREATE TYPE is usually fine if we assume linear run. We'll use DO blocks for safety).

DO $$ BEGIN
    CREATE TYPE public.service_type AS ENUM ('full_time', 'trial_to_hire', 'one_time');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.compensation_type AS ENUM ('hourly', 'fixed', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.billing_frequency AS ENUM ('weekly', 'bi_weekly', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Modify Offers Table
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS service_type service_type,
ADD COLUMN IF NOT EXISTS client_gross_amount DECIMAL(10,2), -- This overrides hourly_rate for clarity in new model
ADD COLUMN IF NOT EXISTS expected_weekly_hours INTEGER;

-- 3. Modify Contracts Table (The Source of Truth)
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS service_type service_type,
ADD COLUMN IF NOT EXISTS compensation_type compensation_type,
ADD COLUMN IF NOT EXISTS billing_frequency billing_frequency,
ADD COLUMN IF NOT EXISTS billing_settings JSONB DEFAULT '{}'::jsonb, -- Stores billing_day, pay_day, overtime_threshold, etc.
ADD COLUMN IF NOT EXISTS client_gross_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS client_contract_terms TEXT, -- Explicit content signed by Client
ADD COLUMN IF NOT EXISTS talent_contract_terms TEXT, -- Explicit content signed by Talent
ADD COLUMN IF NOT EXISTS termination_reason TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- 4. Invoices Table Updates
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS type compensation_type DEFAULT 'hourly',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb; -- breakdown of overtime etc.

-- 5. Timesheets Validations (Optional: Enforce constraints?)
-- For now, we rely on application logic + existing constraints.

-- 6. Trigger to sync Contract status with notifications (Keeping existing trigger logic but ensuring it handles new statuses if any)

-- Grant permissions for new types/columns
GRANT USAGE ON TYPE public.service_type TO anon, authenticated;
GRANT USAGE ON TYPE public.compensation_type TO anon, authenticated;
GRANT USAGE ON TYPE public.billing_frequency TO anon, authenticated;
