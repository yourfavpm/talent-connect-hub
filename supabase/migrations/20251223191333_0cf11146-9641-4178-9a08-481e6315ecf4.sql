-- Create function to assign talent role when a talent record is created
CREATE OR REPLACE FUNCTION public.assign_talent_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'talent')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
END;
$function$;

-- Create trigger to automatically assign talent role
CREATE TRIGGER assign_talent_role_on_insert
AFTER INSERT ON public.talents
FOR EACH ROW
EXECUTE FUNCTION public.assign_talent_role();

-- Create function to assign client role when a client record is created
CREATE OR REPLACE FUNCTION public.assign_client_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
END;
$function$;

-- Create trigger to automatically assign client role
CREATE TRIGGER assign_client_role_on_insert
AFTER INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.assign_client_role();

-- Add unique constraint to user_roles to prevent duplicate roles
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_unique ON public.user_roles (user_id, role);

-- Backfill existing talents with the talent role
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'talent' FROM public.talents
ON CONFLICT DO NOTHING;

-- Backfill existing clients with the client role
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'client' FROM public.clients
ON CONFLICT DO NOTHING;