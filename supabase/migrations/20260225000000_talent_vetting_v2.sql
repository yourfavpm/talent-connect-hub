-- Talent Vetting v2: Step-based vetting, change requests, and skill assessment

-- 1. Extend Talent Statuses
DO $$ BEGIN
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'draft';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'submitted';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'in_review';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'changes_requested';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'approved';
    ALTER TYPE public.talent_status ADD VALUE IF NOT EXISTS 'rejected';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Define Skill Levels
DO $$ BEGIN
    CREATE TYPE public.skill_level AS ENUM ('junior', 'mid', 'senior', 'lead');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Define Step Statuses
DO $$ BEGIN
    CREATE TYPE public.step_status AS ENUM ('not_started', 'incomplete', 'submitted', 'in_review', 'changes_requested', 'approved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Update Talents Table (use existing assigned_manager column, add skill assessment fields)
ALTER TABLE public.talents 
ADD COLUMN IF NOT EXISTS overall_skill_level public.skill_level,
ADD COLUMN IF NOT EXISTS skill_assessment_notes TEXT,
ADD COLUMN IF NOT EXISTS skill_assessment_visible_to_clients BOOLEAN DEFAULT TRUE;

-- 5. Create Talent Profile Steps Table
CREATE TABLE IF NOT EXISTS public.talent_profile_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    step_key TEXT NOT NULL, -- basic_info, professional_details, work_history, documents, education, certifications, references, review
    status public.step_status DEFAULT 'not_started',
    last_submitted_at TIMESTAMP WITH TIME ZONE,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (talent_id, step_key)
);

-- 6. Create Step Change Requests Table
CREATE TABLE IF NOT EXISTS public.step_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    step_key TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT
);

-- 7. Enable RLS
ALTER TABLE public.talent_profile_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_change_requests ENABLE ROW LEVEL SECURITY;

-- 8. Policies for Talent Profile Steps
DO $$ BEGIN
CREATE POLICY "Talents can view own step status" 
ON public.talent_profile_steps FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_profile_steps.talent_id AND talents.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Admins can manage step status" 
ON public.talent_profile_steps FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 9. Policies for Step Change Requests
DO $$ BEGIN
CREATE POLICY "Talents can view own change requests" 
ON public.step_change_requests FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.talents WHERE talents.id = step_change_requests.talent_id AND talents.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Admins can manage change requests" 
ON public.step_change_requests FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 10. Initialization function for steps
CREATE OR REPLACE FUNCTION public.init_talent_steps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.talent_profile_steps (talent_id, step_key) VALUES
        (NEW.id, 'basic_info'),
        (NEW.id, 'professional_details'),
        (NEW.id, 'work_history'),
        (NEW.id, 'documents'),
        (NEW.id, 'education'),
        (NEW.id, 'certifications'),
        (NEW.id, 'references'),
        (NEW.id, 'review')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$;

-- 11. Trigger for existing and new talents
DROP TRIGGER IF EXISTS on_talent_created_init_steps ON public.talents;
CREATE TRIGGER on_talent_created_init_steps
    AFTER INSERT ON public.talents
    FOR EACH ROW EXECUTE FUNCTION public.init_talent_steps();

-- 12. Migrate existing talents
DO $$
DECLARE
    talent_record RECORD;
BEGIN
    FOR talent_record IN SELECT id FROM public.talents LOOP
        INSERT INTO public.talent_profile_steps (talent_id, step_key) VALUES
            (talent_record.id, 'basic_info'),
            (talent_record.id, 'professional_details'),
            (talent_record.id, 'work_history'),
            (talent_record.id, 'documents'),
            (talent_record.id, 'education'),
            (talent_record.id, 'certifications'),
            (talent_record.id, 'references'),
            (talent_record.id, 'review')
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- 13. Audit Log Trigger for Vetting Changes
CREATE OR REPLACE FUNCTION public.log_vetting_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (actor_admin_id, action, entity_type, entity_id, metadata)
        VALUES (
            auth.uid(),
            'VETTING_STATUS_UPDATE',
            'talent_step',
            NEW.talent_id,
            jsonb_build_object(
                'step_key', NEW.step_key,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_step_status_updated ON public.talent_profile_steps;
CREATE TRIGGER on_step_status_updated
    AFTER UPDATE ON public.talent_profile_steps
    FOR EACH ROW EXECUTE FUNCTION public.log_vetting_action();
