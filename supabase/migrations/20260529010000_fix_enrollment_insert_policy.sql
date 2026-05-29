-- ============================================================
-- Fix Academy Enrollments Insert Policy for Guest Checkout
-- Created: 2026-05-29
-- Purpose: Allows guest checkouts (unauthenticated / offline bank-transfer submissions)
--          to insert into academy_enrollments table with 'pending_payment' status.
-- ============================================================

-- 1. Drop existing insert policies that restrict insertions based on auth.uid()
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON public.academy_enrollments;
DROP POLICY IF EXISTS "Anyone can insert enrollments" ON public.academy_enrollments;

-- 2. Create the robust new insert policy
CREATE POLICY "Anyone can insert enrollments" ON public.academy_enrollments
    FOR INSERT WITH CHECK (
        student_id = auth.uid() 
        OR student_id IS NULL 
        OR public.is_admin(auth.uid())
    );

-- 3. Grant INSERT privileges to authenticated and anonymous roles
-- This is critical so PostgreSQL permits 'anon' connections to insert before checking RLS policies.
GRANT INSERT ON public.academy_enrollments TO anon, authenticated;

