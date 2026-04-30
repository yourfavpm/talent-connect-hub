-- Add details to profiles for the rich profile view
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'Standard',
ADD COLUMN IF NOT EXISTS academic_gpa DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS honors_list BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS courses_completed INTEGER DEFAULT 0;

-- Add details to assignments for the brief view
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS core_challenge TEXT,
ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES public.profiles(id);

-- Update submissions to handle files and drafts
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS repo_link TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS student_comments TEXT;
