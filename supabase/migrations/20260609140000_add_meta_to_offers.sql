-- Migration to add meta column to offers for storing service-model specific details

ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

-- Update the admin view or RPCs if any depend on exact columns (usually none do if we use SELECT *)
-- Adding an index on meta could be useful later if we query by it, but not strictly necessary now.
