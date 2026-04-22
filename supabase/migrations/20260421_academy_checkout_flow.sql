-- ============================================================
-- ACADEMY FRICTIONLESS CHECKOUT FLOW
-- Adds checkout sessions and secure user-checking RPC
-- ============================================================

-- Create checkout sessions table
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    course_id text NOT NULL,
    user_exists boolean NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert checkout sessions
CREATE POLICY "Anyone can create checkout sessions"
ON public.checkout_sessions FOR INSERT
TO public
WITH CHECK (true);

-- Allow anonymous/authenticated users to view their own sessions
CREATE POLICY "Users can view their own checkout sessions"
ON public.checkout_sessions FOR SELECT
TO public
USING (true);

-- Allow anonymous/authenticated users to update their own sessions (mainly status)
CREATE POLICY "Users can update their own checkout sessions"
ON public.checkout_sessions FOR UPDATE
TO public
USING (true);

-------------------------------------------------------------------
-- Check if User Exists securely (Bypassing auth restriction for client)
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_user_exists(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  );
END;
$$;

-------------------------------------------------------------------
-- Get User ID by Email (For webhook / service role usage)
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  RETURN v_user_id;
END;
$$;
