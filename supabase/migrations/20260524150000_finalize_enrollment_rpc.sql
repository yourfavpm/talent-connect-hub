-- Migration to add a secure RPC for finalizing academy enrollments directly from the client.

CREATE OR REPLACE FUNCTION public.finalize_academy_enrollment(
    p_email TEXT,
    p_student_name TEXT,
    p_course_slug TEXT,
    p_cohort_id UUID,
    p_course_title TEXT,
    p_price_naira NUMERIC,
    p_price_usd NUMERIC,
    p_paystack_reference TEXT,
    p_user_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_enrollment_id UUID;
    v_transaction_id UUID;
BEGIN
    -- 1. Resolve User ID
    IF p_user_id IS NOT NULL THEN
        v_user_id := p_user_id;
    ELSE
        SELECT id INTO v_user_id FROM auth.users WHERE email = LOWER(TRIM(p_email)) LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for email %', p_email;
    END IF;

    -- 2. Check for existing enrollment in this cohort
    SELECT id INTO v_enrollment_id 
    FROM public.academy_enrollments 
    WHERE user_id = v_user_id AND cohort_id = p_cohort_id 
    LIMIT 1;

    -- 3. Create Enrollment if it doesn't exist
    IF v_enrollment_id IS NULL THEN
        INSERT INTO public.academy_enrollments (
            user_id, 
            course_id, 
            cohort_id, 
            course_name, 
            student_email, 
            student_name, 
            enrollment_status, 
            price_naira, 
            price_usd, 
            enrollment_date, 
            access_granted_at
        ) VALUES (
            v_user_id, 
            p_course_slug, 
            p_cohort_id, 
            p_course_title, 
            LOWER(TRIM(p_email)), 
            p_student_name, 
            'active', 
            p_price_naira, 
            p_price_usd, 
            NOW(), 
            NOW()
        ) RETURNING id INTO v_enrollment_id;

        -- Increment cohort slots
        UPDATE public.cohorts 
        SET current_slots = current_slots + 1 
        WHERE id = p_cohort_id;
    END IF;

    -- 4. Record Transaction
    SELECT id INTO v_transaction_id
    FROM public.course_transactions
    WHERE paystack_reference = p_paystack_reference
    LIMIT 1;

    IF v_transaction_id IS NULL THEN
        INSERT INTO public.course_transactions (
            enrollment_id, 
            user_id, 
            paystack_reference, 
            amount_naira, 
            amount_usd, 
            currency, 
            status, 
            payment_method, 
            paid_at
        ) VALUES (
            v_enrollment_id, 
            v_user_id, 
            p_paystack_reference, 
            p_price_naira, 
            p_price_usd, 
            'NGN', 
            'success', 
            'paystack', 
            NOW()
        );
    END IF;

    RETURN v_enrollment_id;
END;
$$;
