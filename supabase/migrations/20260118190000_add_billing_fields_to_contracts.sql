-- Add critical billing and invoicing fields to contracts table
-- Required for auto-invoicing, billing cycles, and payment scheduling

-- Add compensation and billing configuration fields
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS compensation_type TEXT CHECK (compensation_type IN ('hourly', 'monthly', 'annual')),
ADD COLUMN IF NOT EXISTS service_model TEXT CHECK (service_model IN ('direct_hire', 'trial_to_hire', 'contract_talent')),
ADD COLUMN IF NOT EXISTS billing_frequency TEXT CHECK (billing_frequency IN ('weekly', 'bi_weekly', 'monthly', 'one_time')),
ADD COLUMN IF NOT EXISTS billing_day TEXT CHECK (billing_day IN ('last_day', 'first_day', 'custom')),
ADD COLUMN IF NOT EXISTS expected_weekly_hours INTEGER,
ADD COLUMN IF NOT EXISTS time_tracking_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS overtime_enabled BOOLEAN DEFAULT false;

-- Add client billing fields
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS client_gross_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS billing_details JSONB;

-- Add talent payment fields  
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS talent_payment_frequency TEXT CHECK (talent_payment_frequency IN ('weekly', 'bi_weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS talent_payday TEXT;

-- Add contract lifecycle fields
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS working_arrangement TEXT CHECK (working_arrangement IN ('remote', 'hybrid', 'onsite'));

-- Add indexes for billing queries
CREATE INDEX IF NOT EXISTS idx_contracts_billing_frequency ON contracts(billing_frequency);
CREATE INDEX IF NOT EXISTS idx_contracts_compensation_type ON contracts(compensation_type);
CREATE INDEX IF NOT EXISTS idx_contracts_service_model ON contracts(service_model);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_status_active ON contracts(status) WHERE status = 'active';

-- Add comment explaining the billing logic
COMMENT ON COLUMN contracts.compensation_type IS 'Determines billing method: hourly, monthly, or annual (direct hire only)';
COMMENT ON COLUMN contracts.billing_frequency IS 'Controls invoice generation frequency';
COMMENT ON COLUMN contracts.billing_day IS 'When invoices are issued within the billing period';
COMMENT ON COLUMN contracts.expected_weekly_hours IS 'If set, enables overtime tracking at 1.5x rate';
COMMENT ON COLUMN contracts.time_tracking_required IS 'Derived: true if hourly OR (monthly AND expected_weekly_hours exists)';
COMMENT ON COLUMN contracts.service_model IS 'Determines billing logic branch: direct_hire (15% one-time), trial_to_hire, or contract_talent';
