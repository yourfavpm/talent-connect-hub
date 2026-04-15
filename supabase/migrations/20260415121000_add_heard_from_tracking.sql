-- Migration: Add heard_from tracking for talent leads
-- Description: Adds a column to track how talent heard about the platform

-- 1. Add column to profiles (landing spot for all user types)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS heard_from TEXT;

-- 2. Add column to talents (legacy talent table)
ALTER TABLE public.talents ADD COLUMN IF NOT EXISTS heard_from TEXT;

-- 3. Add column to v2_talent_profiles (modern talent table)
ALTER TABLE public.v2_talent_profiles ADD COLUMN IF NOT EXISTS heard_from TEXT;

-- 4. Update handle_new_user trigger to capture the field from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, first_name, last_name, heard_from)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        NEW.raw_user_meta_data ->> 'heard_from'
    );
    RETURN NEW;
END;
$$;
