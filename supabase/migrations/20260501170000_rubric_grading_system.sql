-- ============================================================
-- RUBRIC-BASED GRADING SYSTEM
-- ============================================================

-- 1. EXTEND ASSIGNMENTS TABLE
ALTER TABLE public.assignments 
ADD COLUMN rubrics JSONB DEFAULT '[]'::jsonb,
ADD COLUMN max_points INT DEFAULT 100;

-- 2. EXTEND SUBMISSIONS TABLE
ALTER TABLE public.submissions
ADD COLUMN rubric_grades JSONB DEFAULT '[]'::jsonb;

-- 3. FUNCTION TO CALCULATE OVERALL COHORT GRADE
CREATE OR REPLACE FUNCTION public.calculate_overall_grade(p_enrollment_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_total_points NUMERIC := 0;
    v_earned_points NUMERIC := 0;
    v_user_id UUID;
    v_cohort_id UUID;
BEGIN
    SELECT user_id, cohort_id INTO v_user_id, v_cohort_id 
    FROM academy_enrollments WHERE id = p_enrollment_id;

    -- Calculate sum of grades / sum of max points
    SELECT 
        COALESCE(SUM(grade::NUMERIC), 0),
        COALESCE(SUM(a.max_points), 0)
    INTO v_earned_points, v_total_points
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    WHERE s.student_id = v_user_id 
    AND a.cohort_id = v_cohort_id
    AND s.status = 'reviewed'
    AND s.grade ~ '^[0-9.]+$';

    IF v_total_points = 0 THEN RETURN 0; END IF;
    RETURN ROUND((v_earned_points / v_total_points) * 100, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER TO AUTO-UPDATE ENROLLMENT PROGRESS/GRADE
CREATE OR REPLACE FUNCTION public.on_submission_graded()
RETURNS TRIGGER AS $$
DECLARE
    v_enrollment_id UUID;
BEGIN
    IF (NEW.status = 'reviewed' AND OLD.status != 'reviewed') OR (NEW.grade != OLD.grade) THEN
        SELECT id INTO v_enrollment_id 
        FROM academy_enrollments 
        WHERE user_id = NEW.student_id 
        AND cohort_id = (SELECT cohort_id FROM assignments WHERE id = NEW.assignment_id);

        IF v_enrollment_id IS NOT NULL THEN
            UPDATE academy_enrollments 
            SET progress_percent = public.calculate_overall_grade(v_enrollment_id)
            WHERE id = v_enrollment_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_submission_graded ON public.submissions;
CREATE TRIGGER tr_on_submission_graded
AFTER UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.on_submission_graded();
