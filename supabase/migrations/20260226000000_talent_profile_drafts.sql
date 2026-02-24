-- Talent Profile Drafts: Add draft/approved versioning + review tracking

-- 1. Add profile change tracking columns to talents
ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS profile_change_status TEXT DEFAULT 'clean'
  CHECK (profile_change_status IN ('clean', 'draft', 'submitted', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS changed_sections TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS draft_profile JSONB DEFAULT '{}';

-- 2. Create talent_profile_reviews table
CREATE TABLE IF NOT EXISTS public.talent_profile_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    changed_sections TEXT[] DEFAULT '{}',
    talent_message TEXT
);

-- 3. Enable RLS
ALTER TABLE public.talent_profile_reviews ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DO $$ BEGIN
CREATE POLICY "Talents can view own reviews"
ON public.talent_profile_reviews FOR SELECT
USING (EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_profile_reviews.talent_id AND talents.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Talents can insert own reviews"
ON public.talent_profile_reviews FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_profile_reviews.talent_id AND talents.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE POLICY "Admins can manage reviews"
ON public.talent_profile_reviews FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_talent_profile_reviews_talent_id ON public.talent_profile_reviews(talent_id);
CREATE INDEX IF NOT EXISTS idx_talents_profile_change_status ON public.talents(profile_change_status);
