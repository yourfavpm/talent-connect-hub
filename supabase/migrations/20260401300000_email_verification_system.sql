-- Migration: Email Verification System
-- Adds custom email verification tracking and secure token storage

BEGIN;

-- 1. Add email_verified_at to public.profiles
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- 2. Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure each user has only one active (unused) token at a time 
    -- Or we can just check if unused in logic
    UNIQUE (token_hash)
);

-- 3. Add Index for performant lookup
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_hash ON public.email_verification_tokens(token_hash);

-- 4. RLS for verification tokens (internal only, usually service role)
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can view tokens
CREATE POLICY "Admins can view email verification tokens" 
ON public.email_verification_tokens 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- 5. Helper function to check if a profile is verified
CREATE OR REPLACE FUNCTION public.is_email_verified(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND email_verified_at IS NOT NULL
  )
$$;

COMMIT;
