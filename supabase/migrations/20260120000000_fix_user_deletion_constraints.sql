-- Fix foreign key constraints that block user deletion
-- These columns reference auth.users without ON DELETE SET NULL or CASCADE

-- 1. Fix jobs.created_by_admin_id
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_created_by_admin_id_fkey;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_created_by_admin_id_fkey 
    FOREIGN KEY (created_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Fix talents.admin_id (vetting review)
ALTER TABLE public.talents DROP CONSTRAINT IF EXISTS talents_admin_id_fkey;
ALTER TABLE public.talents ADD CONSTRAINT talents_admin_id_fkey 
    FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Fix applications.shortlisted_by_admin
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_shortlisted_by_admin_fkey;
ALTER TABLE public.applications ADD CONSTRAINT applications_shortlisted_by_admin_fkey 
    FOREIGN KEY (shortlisted_by_admin) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Fix offers.created_by
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_created_by_fkey;
ALTER TABLE public.offers ADD CONSTRAINT offers_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Fix contracts.created_by
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_created_by_fkey;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 6. Fix invoices.approved_by
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_approved_by_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 7. Fix talents.assigned_manager
ALTER TABLE public.talents DROP CONSTRAINT IF EXISTS talents_assigned_manager_fkey;
ALTER TABLE public.talents ADD CONSTRAINT talents_assigned_manager_fkey 
    FOREIGN KEY (assigned_manager) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 8. Fix support_tickets.assigned_to
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_assigned_to_fkey;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_assigned_to_fkey 
    FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 9. Fix contracts.agreement_attached_by
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_agreement_attached_by_fkey;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_agreement_attached_by_fkey 
    FOREIGN KEY (agreement_attached_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 10. Fix agreement_templates.created_by
ALTER TABLE public.agreement_templates DROP CONSTRAINT IF EXISTS agreement_templates_created_by_fkey;
ALTER TABLE public.agreement_templates ADD CONSTRAINT agreement_templates_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 11. Fix audit_logs.user_id (should allow deletion)
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
