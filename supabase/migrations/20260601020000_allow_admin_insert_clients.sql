-- Allow admins to insert into public.clients table
DROP POLICY IF EXISTS "Admins can insert clients" ON public.clients;
CREATE POLICY "Admins can insert clients" ON public.clients
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Allow admins to delete clients table records
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
CREATE POLICY "Admins can delete clients" ON public.clients
    FOR DELETE USING (public.is_admin(auth.uid()));
