

-- ============================================================
-- OMEGA SYNC - TYPE SAFETY & RELATIONSHIP REPAIR
-- ============================================================
BEGIN;

-- 1. TYPE NORMALIZATION (Fixing uuid = text errors)
DO $$ BEGIN
    -- AUDIT LOGS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='audit_logs') THEN
        -- Rename any legacy names to admin_id
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='actor_admin_id') THEN
            ALTER TABLE public.audit_logs RENAME COLUMN actor_admin_id TO admin_id;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='user_id') THEN
            ALTER TABLE public.audit_logs RENAME COLUMN user_id TO admin_id;
        END IF;

        -- Ensure admin_id is UUID
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='admin_id' AND data_type='text') THEN
            ALTER TABLE public.audit_logs ALTER COLUMN admin_id TYPE UUID USING admin_id::uuid;
        END IF;

        -- Add missing helper columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='module') THEN
            ALTER TABLE public.audit_logs ADD COLUMN module TEXT;
        END IF;
    END IF;

    -- CLIENTS
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='user_id' AND data_type='text') THEN
        ALTER TABLE public.clients ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
    END IF;
END $$;

-- 2. RELATIONSHIP REPAIR (Foreign Keys)
DO $$ BEGIN
    -- Audit Logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='audit_logs') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='admin_users') THEN
        ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_id_fkey;
        ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON DELETE SET NULL;
    END IF;

    -- Support Tickets
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='support_tickets') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='profiles') THEN
        ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_profiles_fkey;
        ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Clients
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='clients') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='profiles') THEN
        ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_user_id_profiles_fkey;
        ALTER TABLE public.clients ADD CONSTRAINT clients_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Payouts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='payouts') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='talents') THEN
            ALTER TABLE public.payouts DROP CONSTRAINT IF EXISTS payouts_talent_id_fkey;
            ALTER TABLE public.payouts ADD CONSTRAINT payouts_talent_id_fkey FOREIGN KEY (talent_id) REFERENCES public.talents(id) ON DELETE CASCADE;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='contracts') THEN
            ALTER TABLE public.payouts DROP CONSTRAINT IF EXISTS payouts_contract_id_fkey;
            ALTER TABLE public.payouts ADD CONSTRAINT payouts_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 3. POLICY TYPE PATCHES (Fixing Policy uuid = text)
-- We re-create the clashing policies with explicit casts
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='payouts') THEN
        DROP POLICY IF EXISTS "Talents view own payouts" ON public.payouts;
        CREATE POLICY "Talents view own payouts" ON public.payouts FOR SELECT 
        USING (auth.uid() IN (SELECT user_id FROM public.talents WHERE id = talent_id::uuid));
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
