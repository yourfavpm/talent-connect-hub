-- AUTOMATE CLIENT ROLE ASSIGNMENT
-- This script ensures any user in the 'clients' table automatically gets the 'client' role.

BEGIN;

-- 1. Create the function that performs the assignment
CREATE OR REPLACE FUNCTION public.handle_client_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Insert into user_roles if not already there
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- 2. Create the trigger on public.clients
DROP TRIGGER IF EXISTS on_client_created_assign_role ON public.clients;
CREATE TRIGGER on_client_created_assign_role
    AFTER INSERT OR UPDATE OF user_id ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.handle_client_role_assignment();

-- 3. Backfill: Grant 'client' role to ALL existing users in the clients table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'client'::public.app_role
FROM public.clients
ON CONFLICT (user_id, role) DO NOTHING;

COMMIT;

-- VERIFICATION QUERY
-- SELECT p.email, r.role 
-- FROM public.user_roles r 
-- JOIN public.profiles p ON r.user_id = p.user_id 
-- WHERE r.role = 'client';
