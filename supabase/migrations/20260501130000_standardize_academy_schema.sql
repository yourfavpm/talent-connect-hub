-- ============================================================
-- ACADEMY SCHEMA STANDARDIZATION
-- Ensures consistent column names and missing fields for all academy tables
-- ============================================================

-- 1. Standardize Sessions Table
-- Ensure both naming conventions are supported to prevent frontend crashes during transition
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS session_date DATE,
ADD COLUMN IF NOT EXISTS meeting_url TEXT,
ADD COLUMN IF NOT EXISTS start_time TEXT;

-- Sync data if columns exist but are empty
UPDATE public.sessions SET session_date = date::date WHERE session_date IS NULL AND date IS NOT NULL;
UPDATE public.sessions SET meeting_url = join_link WHERE meeting_url IS NULL AND join_link IS NOT NULL;

-- 2. Standardize Announcements Table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Standardize Assignments Table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS core_challenge TEXT,
ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES public.profiles(id);

-- 4. Standardize Submissions Table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS repo_link TEXT,
ADD COLUMN IF NOT EXISTS student_comments TEXT,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Sync submissions link to repo_link for compatibility
UPDATE public.submissions SET repo_link = link WHERE repo_link IS NULL AND link IS NOT NULL;

-- 5. Fix Foreign Key Constraints
-- Drop the problematic constraint if it exists (it points to profiles instead of auth.users)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_enrollment_profile_user') THEN
        ALTER TABLE public.academy_enrollments DROP CONSTRAINT fk_enrollment_profile_user;
    END IF;
END $$;

-- Ensure it references auth.users(id)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_enrollment_user') THEN
        ALTER TABLE public.academy_enrollments 
        ADD CONSTRAINT fk_enrollment_user 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Ensure RLS Policies for new columns (usually handled by table-level policies, but good to check)
-- Existing policies use "FOR ALL" or "FOR SELECT" which cover all columns.
