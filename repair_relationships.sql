-- ============================================================
-- MASTER DATABASE NORMALIZATION & RELATIONSHIP REPAIR
-- ============================================================
-- This script fixes naming inconsistencies and missing connections
-- across all major business modules.

BEGIN;

-- 1. FIX AUDIT LOGS STRUCTURE
-- Standardize on 'admin_id' and add missing 'module/target_id' columns
DO $$ BEGIN
    -- Rename actor_admin_id to admin_id if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='actor_admin_id') THEN
        ALTER TABLE public.audit_logs RENAME COLUMN actor_admin_id TO admin_id;
    END IF;
    -- Rename user_id to admin_id if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='user_id') THEN
        ALTER TABLE public.audit_logs RENAME COLUMN user_id TO admin_id;
    END IF;
    -- Add admin_id if NEITHER existed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='admin_id') THEN
        ALTER TABLE public.audit_logs ADD COLUMN admin_id UUID;
    END IF;
    -- Add missing module/target_id used by system functions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='module') THEN
        ALTER TABLE public.audit_logs ADD COLUMN module TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='target_id') THEN
        ALTER TABLE public.audit_logs ADD COLUMN target_id TEXT;
    END IF;
END $$;

-- 2. FIX TABLE RELATIONSHIPS (FOREIGN KEYS)

-- Audit Logs -> Admin Users
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_id_fkey;
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_admin_id_fkey;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_admin_id_fkey 
FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON DELETE SET NULL;

-- Support Tickets -> Profiles
-- Re-links support tickets to the public profiles table for join performance
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_profiles_fkey;
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Clients -> Profiles
-- Essential for retrieving contact emails in the clients view
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_user_id_profiles_fkey;
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;
ALTER TABLE public.clients ADD CONSTRAINT clients_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Payouts -> Talents & Contracts
-- Restores functionality to the Payments dashboard
ALTER TABLE public.payouts DROP CONSTRAINT IF EXISTS payouts_talent_id_fkey;
ALTER TABLE public.payouts ADD CONSTRAINT payouts_talent_id_fkey 
FOREIGN KEY (talent_id) REFERENCES public.talents(id) ON DELETE CASCADE;

ALTER TABLE public.payouts DROP CONSTRAINT IF EXISTS payouts_contract_id_fkey;
ALTER TABLE public.payouts ADD CONSTRAINT payouts_contract_id_fkey 
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

-- Contracts -> Clients & Talents
-- Ensures company and talent names show up correctly
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_client_id_fkey;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_talent_id_fkey;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_talent_id_fkey 
FOREIGN KEY (talent_id) REFERENCES public.talents(id) ON DELETE CASCADE;

-- 3. FINAL SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';

COMMIT;
