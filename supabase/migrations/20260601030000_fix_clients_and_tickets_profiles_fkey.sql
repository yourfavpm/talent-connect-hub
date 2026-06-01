-- master relationship fix for clients and support_tickets pointing to profiles
BEGIN;

-- 1. Correct public.clients(user_id) foreign key to reference profiles(user_id)
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_user_id_profiles_fkey;
ALTER TABLE public.clients ADD CONSTRAINT clients_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 2. Correct public.support_tickets(user_id) foreign key to reference profiles(user_id)
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_profiles_fkey;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';

COMMIT;
