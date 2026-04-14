-- Surgical fix for v2_notifications type constraint
-- This script ensures that 'VETTING_NOTE' is an allowed notification type.

DO $$ 
BEGIN
    -- Check if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'v2_notifications' AND table_schema = 'public') THEN
        -- Drop the existing constraint
        ALTER TABLE public.v2_notifications DROP CONSTRAINT IF EXISTS v2_notifications_type_check;
        
        -- Add the expanded constraint
        ALTER TABLE public.v2_notifications ADD CONSTRAINT v2_notifications_type_check 
        CHECK (type IN ('CHANGES_REQUESTED', 'SECTION_APPROVED', 'PROFILE_SUBMITTED', 'PROFILE_VETTED', 'VETTING_NOTE'));
        
        RAISE NOTICE 'v2_notifications_type_check constraint updated successfully.';
    ELSE
        RAISE NOTICE 'Table v2_notifications does not exist. No changes made.';
    END IF;
END $$;
