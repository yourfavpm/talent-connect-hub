-- ============================================================
-- OPSLY CERTIFICATE SYSTEM
-- Migration: Create certificates table and supporting infrastructure
-- ============================================================

-- 1. Create certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id TEXT UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    course_id UUID,
    course_title TEXT NOT NULL,
    course_description TEXT,
    student_name TEXT NOT NULL,
    mentors JSONB DEFAULT '[]'::jsonb,
    completion_date DATE NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    verification_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_certificates_student ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_cohort ON public.certificates(cohort_id);
CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON public.certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);

-- 3. Add is_closed column to cohorts table
ALTER TABLE public.cohorts ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;

-- 4. Enable RLS on certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 4.1 Students can view their own certificates
DROP POLICY IF EXISTS "Students can view their own certificates" ON public.certificates;
CREATE POLICY "Students can view their own certificates"
    ON public.certificates
    FOR SELECT
    USING (auth.uid() = student_id);

-- 4.2 Admins can do everything
DROP POLICY IF EXISTS "Admins can manage all certificates" ON public.certificates;
CREATE POLICY "Admins can manage all certificates"
    ON public.certificates
    FOR ALL
    USING (public.is_admin());

-- 4.3 Public can read active certificates by certificate_id (for verification)
DROP POLICY IF EXISTS "Public can verify active certificates" ON public.certificates;
CREATE POLICY "Public can verify active certificates"
    ON public.certificates
    FOR SELECT
    USING (status = 'active');

-- 5. Function to generate human-readable certificate ID
CREATE OR REPLACE FUNCTION public.generate_certificate_id()
RETURNS TEXT AS $$
DECLARE
    hex_part1 TEXT;
    hex_part2 TEXT;
BEGIN
    hex_part1 := upper(substr(md5(random()::text), 1, 4));
    hex_part2 := upper(substr(md5(random()::text), 1, 4));
    RETURN 'OPSLY-' || hex_part1 || '-' || hex_part2;
END;
$$ LANGUAGE plpgsql;

-- 6. Log completion
DO $$
BEGIN
    RAISE NOTICE '
    ============================================================
    ✅ CERTIFICATE SYSTEM MIGRATION COMPLETE
    ============================================================
    
    CREATED:
    ✓ public.certificates table
    ✓ Indexes on student_id, cohort_id, certificate_id
    ✓ RLS policies (student own, admin all, public verify)
    ✓ is_closed column on cohorts
    ✓ generate_certificate_id() function
    ============================================================
    ';
END $$;
