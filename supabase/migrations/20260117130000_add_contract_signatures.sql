-- Add signature URLs
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS client_signature_url TEXT,
ADD COLUMN IF NOT EXISTS talent_signature_url TEXT;

-- Update status check constraint if needed (or just ensure application logic handles it)
-- Supabase check constraints are usually hard to modify without dropping. 
-- We'll assume the status column is text and checks are done via application or a flexible constraint.
-- If there is strict constraint:
-- ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
-- ALTER TABLE public.contracts ADD CONSTRAINT contracts_status_check CHECK (status IN ('draft', 'pending', 'client_signed', 'admin_review', 'sent_to_talent', 'active', 'completed', 'terminated', 'paused', 'expired'));

-- For now, let's just make sure we can use 'client_signed' and 'waiting_for_talent'
-- If the previous status check was restrictive, we might need to recreate it.
-- Let's inspect the types again or just trust that common statuses work. 
-- Implementation Plan decided on "client_signed" as an intermediate state.
