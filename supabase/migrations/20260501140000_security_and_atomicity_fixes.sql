-- ============================================================
-- SECURITY & ATOMICITY FIXES
-- 1. Fix RLS Session/Announcement Exposure
-- 2. Add Atomic Slot Increment Function
-- 3. Fix is_admin() role check
-- ============================================================

-- 1. FIX IS_ADMIN FUNCTION
-- The previous one checked for 'admin' which doesn't exist in the enum.
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'operations_admin', 'vetting_admin', 'finance_admin', 'support_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SECURE SESSIONS RLS
-- Drop the "true" read access policy
DROP POLICY IF EXISTS "Anyone can see sessions" ON public.sessions;
DROP POLICY IF EXISTS "Public read access for sessions" ON public.sessions;

-- Create secure policy: Admins or Enrolled students only
CREATE POLICY "Secure access for sessions" 
ON public.sessions FOR SELECT 
USING (
    public.is_admin() 
    OR EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE user_id = auth.uid()
        AND cohort_id = sessions.cohort_id
        AND enrollment_status = 'active'
    )
);

-- 3. SECURE ANNOUNCEMENTS RLS
-- Drop the "true" read access policy
DROP POLICY IF EXISTS "Anyone can see announcements" ON public.announcements;
DROP POLICY IF EXISTS "Public read access for announcements" ON public.announcements;

-- Create secure policy: Admins or Enrolled students only
CREATE POLICY "Secure access for announcements" 
ON public.announcements FOR SELECT 
USING (
    public.is_admin() 
    OR EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE user_id = auth.uid()
        AND cohort_id = announcements.cohort_id
        AND enrollment_status = 'active'
    )
);

-- 4. ATOMIC SLOT INCREMENT FUNCTION
-- This prevents race conditions during enrollment
CREATE OR REPLACE FUNCTION public.increment_cohort_slots(p_cohort_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.cohorts 
    SET current_slots = COALESCE(current_slots, 0) + 1 
    WHERE id = p_cohort_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SECURE ASSIGNMENTS RLS (Bonus fix as identified in audit)
DROP POLICY IF EXISTS "Anyone can see assignments" ON public.assignments;
CREATE POLICY "Secure access for assignments" 
ON public.assignments FOR SELECT 
USING (
    public.is_admin() 
    OR EXISTS (
        SELECT 1 FROM public.academy_enrollments
        WHERE user_id = auth.uid()
        AND cohort_id = assignments.cohort_id
        AND enrollment_status = 'active'
    )
);

-- 6. SECURE SUBMISSIONS RLS (Ensure students only see their own)
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
CREATE POLICY "Students can view their own submissions" 
ON public.submissions FOR SELECT 
USING (
    auth.uid() = student_id
    OR public.is_admin()
);
