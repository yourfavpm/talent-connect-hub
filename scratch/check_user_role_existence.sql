-- ============================================================
-- SQL Helper: Email Uniqueness Check for Portals
-- Run this in your Supabase SQL Editor to enable robust 
-- email existence and role checking during signup.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_user_role_existence(p_email TEXT)
RETURNS TABLE (
    user_exists BOOLEAN,
    has_client_role BOOLEAN,
    has_talent_role BOOLEAN,
    has_student_role BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT false, false, false, false;
    ELSE
        RETURN QUERY 
        SELECT 
            true,
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'client'),
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'talent'),
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'student');
    END IF;
END;
$$;

-- Grant access to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.check_user_role_existence(TEXT) TO anon, authenticated;
