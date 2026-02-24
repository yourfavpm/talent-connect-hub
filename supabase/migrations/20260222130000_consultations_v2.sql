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
ADD COLUMN IF NOT EXISTS converted_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
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
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
