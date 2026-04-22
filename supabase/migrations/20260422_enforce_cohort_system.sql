-- ============================================================
-- ENFORCE COHORT-FIRST ENROLLMENT SYSTEM
-- Critical enforcement migration for User → Enrollment → Cohort → Program
--
-- This migration enforces:
-- 1. All enrollments are tied to specific cohorts
-- 2. Users cannot enroll in a cohort twice (UNIQUE constraint)
-- 3. No enrollment without a cohort
-- 4. All content is cohort-specific
-- 5. Cross-cohort access is prevented via RLS
-- ============================================================

-- ============================================================
-- SECTION 1: ACADEMY ENROLLMENTS - ENFORCE COHORT LINKAGE
-- ============================================================

-- 1.1: Ensure cohort_id is NOT NULL (REQUIRED)
ALTER TABLE public.academy_enrollments 
    ALTER COLUMN cohort_id SET NOT NULL;

-- 1.2: Add UNIQUE constraint to prevent duplicate enrollments in same cohort
ALTER TABLE public.academy_enrollments 
    ADD CONSTRAINT uk_enrollment_user_cohort 
    UNIQUE (user_id, cohort_id);

-- 1.3: Ensure foreign key constraint exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_enrollment_cohort') THEN
        ALTER TABLE public.academy_enrollments 
        ADD CONSTRAINT fk_enrollment_cohort 
        FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 1.4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_user_cohort 
    ON public.academy_enrollments(user_id, cohort_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_cohort_status 
    ON public.academy_enrollments(cohort_id, enrollment_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status 
    ON public.academy_enrollments(user_id, enrollment_status);

-- ============================================================
-- SECTION 2: COHORTS TABLE - ENFORCE STRUCTURE
-- ============================================================

-- 2.1: Ensure cohorts table has all required columns
ALTER TABLE public.cohorts 
    ADD COLUMN IF NOT EXISTS program_id UUID;

ALTER TABLE public.cohorts 
    ADD COLUMN IF NOT EXISTS enrollment_start_date TIMESTAMPTZ;

ALTER TABLE public.cohorts 
    ADD COLUMN IF NOT EXISTS enrollment_end_date TIMESTAMPTZ;

ALTER TABLE public.cohorts 
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming' 
    CHECK (status IN ('upcoming', 'active', 'completed', 'closed'));

-- 2.2: Ensure name is unique per program
ALTER TABLE public.cohorts 
    ADD CONSTRAINT uk_cohort_name_per_program 
    UNIQUE (program_id, name);

-- 2.3: Create status computation function
CREATE OR REPLACE FUNCTION public.compute_cohort_status(
    p_enrollment_start_date TIMESTAMPTZ,
    p_enrollment_end_date TIMESTAMPTZ,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_manual_status TEXT
)
RETURNS TEXT AS $$
DECLARE
    now_utc TIMESTAMPTZ := TIMEZONE('utc'::text, NOW());
BEGIN
    -- If manually closed, respect that
    IF p_manual_status = 'closed' THEN
        RETURN 'closed';
    END IF;
    
    -- If we're before enrollment starts, it's upcoming
    IF now_utc < p_enrollment_start_date THEN
        RETURN 'upcoming';
    END IF;
    
    -- If we're past enrollment end date and start date, it's active/completed
    IF now_utc > p_enrollment_end_date AND now_utc > p_start_date THEN
        RETURN 'completed';
    END IF;
    
    -- If we're between start and end date, it's active
    IF now_utc >= p_start_date AND now_utc < p_end_date THEN
        RETURN 'active';
    END IF;
    
    -- Default to upcoming
    RETURN 'upcoming';
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- SECTION 3: CONTENT TABLES - ENFORCE COHORT LINKAGE
-- ============================================================

-- 3.1: SESSIONS Table - Enforce cohort_id NOT NULL
DO $$ 
BEGIN
    -- Drop any existing constraints that might conflict
    BEGIN
        ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS fk_session_course;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    -- Ensure columns exist
    ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS cohort_id UUID;
    ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_date TIMESTAMPTZ;
    ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS meeting_url TEXT;
    
    -- Make cohort_id NOT NULL
    ALTER TABLE public.sessions 
    ALTER COLUMN cohort_id SET NOT NULL;
    
    -- Add FK
    ALTER TABLE public.sessions 
    ADD CONSTRAINT fk_session_cohort 
    FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE CASCADE;
    
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_sessions_cohort 
    ON public.sessions(cohort_id, session_date);
END $$;

-- 3.2: ASSIGNMENTS Table - Enforce cohort_id NOT NULL
DO $$ 
BEGIN
    -- Ensure columns exist
    ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS cohort_id UUID;
    ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMPTZ;
    
    -- Make cohort_id NOT NULL
    ALTER TABLE public.assignments 
    ALTER COLUMN cohort_id SET NOT NULL;
    
    -- Add/replace FK
    BEGIN
        ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS fk_assignment_course;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    ALTER TABLE public.assignments 
    ADD CONSTRAINT fk_assignment_cohort 
    FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE CASCADE;
    
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_assignments_cohort 
    ON public.assignments(cohort_id, deadline_at);
END $$;

-- 3.3: ANNOUNCEMENTS Table - Enforce cohort_id NOT NULL
DO $$ 
BEGIN
    -- Ensure columns exist
    ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS cohort_id UUID;
    
    -- Make cohort_id NOT NULL
    UPDATE public.announcements SET cohort_id = '00000000-0000-0000-0000-000000000000'::uuid 
    WHERE cohort_id IS NULL;
    
    ALTER TABLE public.announcements 
    ALTER COLUMN cohort_id SET NOT NULL;
    
    -- Add/replace FK
    BEGIN
        ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS fk_announcement_course;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    ALTER TABLE public.announcements 
    ADD CONSTRAINT fk_announcement_cohort 
    FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE CASCADE;
    
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_announcements_cohort 
    ON public.announcements(cohort_id, created_at);
END $$;

-- 3.4: RESOURCES Table - Enforce cohort_id NOT NULL
DO $$ 
BEGIN
    -- Create table if not exists
    CREATE TABLE IF NOT EXISTS public.resources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        resource_type TEXT DEFAULT 'document',
        created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
        updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
    );
    
    CREATE INDEX IF NOT EXISTS idx_resources_cohort 
    ON public.resources(cohort_id, created_at);
END $$;

-- ============================================================
-- SECTION 4: CHECKOUT SESSIONS - ENSURE COHORT TRACKING
-- ============================================================

-- 4.1: Ensure checkout_sessions has cohort_id
ALTER TABLE public.checkout_sessions 
    ADD COLUMN IF NOT EXISTS cohort_id UUID;

ALTER TABLE public.checkout_sessions 
    ADD CONSTRAINT fk_checkout_cohort 
    FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_cohort 
ON public.checkout_sessions(cohort_id, status);

-- ============================================================
-- SECTION 5: ENFORCE RLS POLICIES - COHORT-BASED ACCESS
-- ============================================================

-- 5.1: Drop existing conflicting policies on academy_enrollments
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.academy_enrollments;
DROP POLICY IF EXISTS "Students can view enrollments in their cohorts" ON public.academy_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.academy_enrollments;

-- 5.2: Re-create cohort-enforcing policies for academy_enrollments
CREATE POLICY "Students can ONLY view their own enrollments"
    ON public.academy_enrollments
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR public.is_admin()
    );

CREATE POLICY "Prevent duplicate cohort enrollments for students"
    ON public.academy_enrollments
    FOR INSERT
    WITH CHECK (
        -- Student can only enroll themselves
        auth.uid() = user_id
        OR public.is_admin()
    );

-- 5.3: Create cohort-enforcing policies for sessions
DROP POLICY IF EXISTS "Students can view sessions in their enrolled cohorts" ON public.sessions;
DROP POLICY IF EXISTS "Anyone can view published sessions" ON public.sessions;

CREATE POLICY "Students can view sessions only from their enrolled cohorts"
    ON public.sessions
    FOR SELECT
    USING (
        cohort_id IN (
            SELECT cohort_id FROM public.academy_enrollments
            WHERE user_id = auth.uid()
            AND enrollment_status = 'active'
        )
        OR public.is_admin()
    );

-- 5.4: Create cohort-enforcing policies for assignments
DROP POLICY IF EXISTS "Students can view assignments from their cohorts" ON public.assignments;

CREATE POLICY "Students can view assignments only from their enrolled cohorts"
    ON public.assignments
    FOR SELECT
    USING (
        cohort_id IN (
            SELECT cohort_id FROM public.academy_enrollments
            WHERE user_id = auth.uid()
            AND enrollment_status = 'active'
        )
        OR public.is_admin()
    );

-- 5.5: Create cohort-enforcing policies for announcements
DROP POLICY IF EXISTS "Students can view announcements in their cohorts" ON public.announcements;

CREATE POLICY "Students can view announcements only from their enrolled cohorts"
    ON public.announcements
    FOR SELECT
    USING (
        cohort_id IN (
            SELECT cohort_id FROM public.academy_enrollments
            WHERE user_id = auth.uid()
            AND enrollment_status = 'active'
        )
        OR public.is_admin()
    );

-- 5.6: Create cohort-enforcing policies for resources
DROP POLICY IF EXISTS "Students can view resources in their cohorts" ON public.resources;

CREATE POLICY "Students can view resources only from their enrolled cohorts"
    ON public.resources
    FOR SELECT
    USING (
        cohort_id IN (
            SELECT cohort_id FROM public.academy_enrollments
            WHERE user_id = auth.uid()
            AND enrollment_status = 'active'
        )
        OR public.is_admin()
    );

-- ============================================================
-- SECTION 6: ENFORCE DURING ENROLLMENT STATE TRANSITIONS
-- ============================================================

-- 6.1: Function to validate enrollment before insert/update
CREATE OR REPLACE FUNCTION public.validate_cohort_enrollment()
RETURNS TRIGGER AS $$
DECLARE
    cohort_open_until TIMESTAMPTZ;
    cohort_status TEXT;
    total_enrolled INT;
    max_slots INT;
BEGIN
    -- Validate cohort exists and is open
    SELECT enrollment_end_date, status, current_slots, max_slots
    INTO cohort_open_until, cohort_status, total_enrolled, max_slots
    FROM public.cohorts
    WHERE id = NEW.cohort_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cohort does not exist';
    END IF;
    
    -- Check enrollment window
    IF TIMEZONE('utc'::text, NOW()) > cohort_open_until THEN
        RAISE EXCEPTION 'Enrollment period has ended for this cohort';
    END IF;
    
    -- Check enrollment not closed
    IF cohort_status = 'closed' THEN
        RAISE EXCEPTION 'This cohort is closed for enrollment';
    END IF;
    
    -- Check slots availability (only on insert)
    IF TG_OP = 'INSERT' THEN
        IF total_enrolled >= max_slots THEN
            RAISE EXCEPTION 'Cohort is full. No more slots available.';
        END IF;
        
        -- Increment current_slots
        UPDATE public.cohorts 
        SET current_slots = current_slots + 1
        WHERE id = NEW.cohort_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6.2: Attach trigger to validate enrollment
DROP TRIGGER IF EXISTS trigger_validate_cohort_enrollment ON public.academy_enrollments;

CREATE TRIGGER trigger_validate_cohort_enrollment
    BEFORE INSERT ON public.academy_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_cohort_enrollment();

-- ============================================================
-- SECTION 7: MIGRATION DATA (CRITICAL)
-- ============================================================

-- 7.1: Fix any orphaned enrollments (enrollments without cohort_id)
-- These are critical data issues - we cannot create enrollments without cohorts
DO $$ 
DECLARE
    orphaned_count INT;
BEGIN
    SELECT COUNT(*)
    INTO orphaned_count
    FROM public.academy_enrollments
    WHERE cohort_id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE WARNING 'Found % enrollments without cohort_id. These MUST be fixed manually!', orphaned_count;
        RAISE WARNING 'Query to find them: SELECT * FROM public.academy_enrollments WHERE cohort_id IS NULL;';
    END IF;
END $$;

-- ============================================================
-- SECTION 8: VERIFICATION QUERIES
-- ============================================================

-- Verify enforcement is in place:
-- SELECT constraint_name FROM information_schema.table_constraints 
-- WHERE table_name = 'academy_enrollments' 
-- AND constraint_type = 'UNIQUE';

-- SELECT * FROM public.academy_enrollments 
-- WHERE cohort_id IS NULL; -- Should return 0 rows

-- SELECT COUNT(user_id) as duplicate_enrollments_per_user
-- FROM (
--     SELECT user_id, cohort_id, COUNT(*) as cnt
--     FROM public.academy_enrollments
--     GROUP BY user_id, cohort_id
--     HAVING COUNT(*) > 1
-- ) sub; -- Should return 0 rows

-- ============================================================
-- SECTION 9: FUNCTIONS FOR DASHBOARD & API
-- ============================================================

-- 9.1: Function to get user's enrolled cohorts with program info
CREATE OR REPLACE FUNCTION public.get_user_enrolled_cohorts(p_user_id UUID)
RETURNS TABLE (
    enrollment_id UUID,
    cohort_id UUID,
    cohort_name TEXT,
    program_id UUID,
    program_name TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT,
    enrollment_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ae.id,
        ae.cohort_id,
        c.name,
        c.program_id,
        p.title,
        c.start_date,
        c.end_date,
        c.status,
        ae.enrollment_status
    FROM public.academy_enrollments ae
    JOIN public.cohorts c ON ae.cohort_id = c.id
    LEFT JOIN public.academy_programs p ON c.program_id = p.id
    WHERE ae.user_id = p_user_id
    AND ae.enrollment_status = 'active'
    ORDER BY c.start_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 9.2: Function to get cohort's students
CREATE OR REPLACE FUNCTION public.get_cohort_students(p_cohort_id UUID)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    student_email TEXT,
    enrollment_status TEXT,
    enrolled_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ae.user_id,
        COALESCE(u.first_name || ' ' || u.last_name, ae.student_name) as student_name,
        COALESCE(u.email, ae.student_email) as student_email,
        ae.enrollment_status,
        ae.created_at
    FROM public.academy_enrollments ae
    LEFT JOIN public.profiles u ON ae.user_id = u.id
    WHERE ae.cohort_id = p_cohort_id
    ORDER BY ae.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FINAL: Log enforcement completion
-- ============================================================

-- Create a log entry for this enforcement run
DO $$ 
BEGIN
    RAISE NOTICE '
    ============================================================
    ✅ COHORT-FIRST ENFORCEMENT COMPLETE
    ============================================================
    
    ENFORCED:
    ✓ academy_enrollments.cohort_id is NOT NULL
    ✓ UNIQUE constraint: UNIQUE(user_id, cohort_id)
    ✓ All content tables have cohort_id NOT NULL
    ✓ RLS policies enforce cohort-based access
    ✓ Enrollment validation prevents duplicates & overcapacity
    ✓ Helper functions for dashboard queries
    
    CRITICAL: Check for orphaned enrollments!
    SELECT * FROM public.academy_enrollments WHERE cohort_id IS NULL;
    
    USER → ENROLLMENT → COHORT → PROGRAM
    ============================================================
    ';
END $$;
