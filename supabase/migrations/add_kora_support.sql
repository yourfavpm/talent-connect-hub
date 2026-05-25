-- Add Kora support to course_transactions table
-- Migration: Add kora_reference column

-- Step 1: Add kora_reference column if it doesn't exist
ALTER TABLE public.course_transactions
ADD COLUMN IF NOT EXISTS kora_reference TEXT UNIQUE;

-- Step 2: Create index for kora_reference for faster lookups
CREATE INDEX IF NOT EXISTS idx_course_transactions_kora_ref 
ON public.course_transactions(kora_reference) 
WHERE kora_reference IS NOT NULL;

-- Step 3: Update payment_method enum to include 'kora' if not already present
-- First, let's check the current enum values in payment_method
-- If needed, we might need to create a new type, but for now we'll just use TEXT

-- Step 4: Add comment to document the new field
COMMENT ON COLUMN public.course_transactions.kora_reference IS 'Payment reference from Kora HQ for kora transactions';

-- Verification queries (can be run manually):
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'course_transactions' AND column_name = 'kora_reference';
