-- Force CASCADE delete for all tables referencing cohorts
-- This ensures that deleting a cohort clean up all related data

DO $$ 
BEGIN
    -- 1. academy_enrollments
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_enrollment_cohort') THEN
        ALTER TABLE public.academy_enrollments DROP CONSTRAINT fk_enrollment_cohort;
    END IF;
    ALTER TABLE public.academy_enrollments 
    ADD CONSTRAINT fk_enrollment_cohort 
    FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE CASCADE;

    -- 2. sessions
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sessions_cohort_id_fkey') THEN
        ALTER TABLE public.sessions DROP CONSTRAINT sessions_cohort_id_fkey;
    END IF;
    ALTER TABLE public.sessions 
    ADD CONSTRAINT sessions_cohort_id_fkey 
    FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE CASCADE;

    -- 3. assignments
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assignments_cohort_id_fkey') THEN
        ALTER TABLE public.assignments DROP CONSTRAINT assignments_cohort_id_fkey;
    END IF;
    ALTER TABLE public.assignments 
    ADD CONSTRAINT assignments_cohort_id_fkey 
    FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE CASCADE;

    -- 4. announcements
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'announcements_cohort_id_fkey') THEN
        ALTER TABLE public.announcements DROP CONSTRAINT announcements_cohort_id_fkey;
    END IF;
    ALTER TABLE public.announcements 
    ADD CONSTRAINT announcements_cohort_id_fkey 
    FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE CASCADE;

    -- 5. resources
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'resources_cohort_id_fkey') THEN
        ALTER TABLE public.resources DROP CONSTRAINT resources_cohort_id_fkey;
    END IF;
    ALTER TABLE public.resources 
    ADD CONSTRAINT resources_cohort_id_fkey 
    FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE CASCADE;

END $$;
