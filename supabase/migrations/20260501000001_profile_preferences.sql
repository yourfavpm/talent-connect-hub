-- Add more granular preferences and track info to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS learning_track TEXT,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'English (US)',
ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_four_digits TEXT;

-- Update profiles to have a learning track if they are enrolled in something
UPDATE public.profiles p
SET learning_track = (
  SELECT c.title 
  FROM public.academy_enrollments e
  JOIN public.academy_courses c ON e.course_id = c.slug
  WHERE e.user_id = p.id
  LIMIT 1
)
WHERE learning_track IS NULL;
