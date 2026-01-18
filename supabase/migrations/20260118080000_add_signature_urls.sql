-- Add signature URL columns to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS client_signature_url TEXT,
ADD COLUMN IF NOT EXISTS talent_signature_url TEXT;

-- Refresh the schema cache (notify PostgREST)
NOTIFY pgrst, 'reload schema';
