-- ============================================================
-- Installment Payment Support for Academy Enrollments
-- Created: 2026-06-18
-- ============================================================

-- Add installment columns to academy_enrollments
ALTER TABLE public.academy_enrollments
    ADD COLUMN IF NOT EXISTS payment_plan         TEXT    DEFAULT 'full'   CHECK (payment_plan IN ('full', 'installment')),
    ADD COLUMN IF NOT EXISTS installment_1_amount NUMERIC DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS installment_2_amount NUMERIC DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS installment_2_due_date TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS installment_2_paid   BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS installment_2_reference TEXT  DEFAULT NULL;

-- ── Updated RPC with installment support ──────────────────────
CREATE OR REPLACE FUNCTION public.finalize_academy_enrollment(
    p_email               TEXT,
    p_student_name        TEXT,
    p_course_slug         TEXT,
    p_cohort_id           UUID,
    p_course_title        TEXT,
    p_price_naira         NUMERIC,
    p_price_usd           NUMERIC,
    p_paystack_reference  TEXT,
    p_user_id             UUID    DEFAULT NULL,
    p_payment_method      TEXT    DEFAULT 'paystack',
    p_kora_reference      TEXT    DEFAULT NULL,
    -- Coupon parameters
    p_coupon_code         TEXT    DEFAULT NULL,
    p_discount_pct        NUMERIC DEFAULT 0,
    p_final_price_naira   NUMERIC DEFAULT NULL,
    p_final_price_usd     NUMERIC DEFAULT NULL,
    -- Installment parameters
    p_payment_plan        TEXT    DEFAULT 'full',
    p_installment_1_amount NUMERIC DEFAULT NULL,
    p_installment_2_amount NUMERIC DEFAULT NULL,
    p_installment_2_due_date TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id          UUID;
    v_enrollment_id    UUID;
    v_transaction_id   UUID;
    v_kora_ref         TEXT;
    v_paystack_ref     TEXT;
    v_final_naira      NUMERIC;
    v_final_usd        NUMERIC;
    v_charge_amount    NUMERIC;
    v_coupon_id        UUID;
BEGIN
    -- Resolve final prices (apply discount if not already computed by caller)
    v_final_naira := COALESCE(p_final_price_naira, p_price_naira);
    v_final_usd   := COALESCE(p_final_price_usd,   p_price_usd);

    -- For installment plans, the charge amount is installment 1
    v_charge_amount := COALESCE(p_installment_1_amount, v_final_naira);

    -- 1. Resolve User ID (guest checkout allowed)
    IF p_user_id IS NOT NULL THEN
        v_user_id := p_user_id;
    ELSE
        SELECT id INTO v_user_id
        FROM auth.users
        WHERE email = LOWER(TRIM(p_email))
        LIMIT 1;
    END IF;

    -- 2. Check for existing enrollment in this cohort
    SELECT id INTO v_enrollment_id
    FROM public.academy_enrollments
    WHERE student_email = LOWER(TRIM(p_email))
      AND cohort_id = p_cohort_id
    LIMIT 1;

    -- 3. Create enrollment if not exists
    IF v_enrollment_id IS NULL THEN
        INSERT INTO public.academy_enrollments (
            student_id,
            course_id,
            cohort_id,
            course_name,
            student_email,
            student_name,
            enrollment_status,
            price_naira,
            price_usd,
            final_price_naira,
            final_price_usd,
            coupon_code,
            discount_pct,
            payment_plan,
            installment_1_amount,
            installment_2_amount,
            installment_2_due_date,
            installment_2_paid,
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
            v_final_naira,
            v_final_usd,
            UPPER(TRIM(p_coupon_code)),
            p_discount_pct,
            p_payment_plan,
            p_installment_1_amount,
            p_installment_2_amount,
            p_installment_2_due_date,
            false,
            NOW(),
            NOW()
        ) RETURNING id INTO v_enrollment_id;

        -- Increment cohort slots
        UPDATE public.cohorts
        SET current_slots = COALESCE(current_slots, 0) + 1
        WHERE id = p_cohort_id;
    END IF;

    -- 4. Increment coupon uses
    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        SELECT id INTO v_coupon_id
        FROM public.course_coupons
        WHERE UPPER(code) = UPPER(TRIM(p_coupon_code))
          AND (course_id = p_course_slug OR course_id IS NULL)
        ORDER BY (course_id IS NOT NULL) DESC
        LIMIT 1;

        IF v_coupon_id IS NOT NULL THEN
            UPDATE public.course_coupons
            SET uses = uses + 1
            WHERE id = v_coupon_id;
        END IF;
    END IF;

    -- 5. Resolve payment references
    v_paystack_ref := p_paystack_reference;
    v_kora_ref     := p_kora_reference;

    IF p_payment_method = 'kora' AND v_kora_ref IS NULL AND v_paystack_ref IS NOT NULL THEN
        v_kora_ref     := v_paystack_ref;
        v_paystack_ref := NULL;
    END IF;

    -- 6. Record transaction (using the actual charged amount — installment 1 for plans)
    IF p_payment_method = 'kora' THEN
        SELECT id INTO v_transaction_id
        FROM public.course_transactions
        WHERE kora_reference = v_kora_ref
        LIMIT 1;

        IF v_transaction_id IS NULL THEN
            INSERT INTO public.course_transactions (
                enrollment_id, user_id, kora_reference,
                amount_naira, amount_usd, currency, status, payment_method, paid_at
            ) VALUES (
                v_enrollment_id, v_user_id, v_kora_ref,
                v_charge_amount, v_final_usd, 'NGN', 'success', 'kora', NOW()
            );
        END IF;
    ELSE
        SELECT id INTO v_transaction_id
        FROM public.course_transactions
        WHERE paystack_reference = v_paystack_ref
        LIMIT 1;

        IF v_transaction_id IS NULL THEN
            INSERT INTO public.course_transactions (
                enrollment_id, user_id, paystack_reference,
                amount_naira, amount_usd, currency, status, payment_method, paid_at
            ) VALUES (
                v_enrollment_id, v_user_id, v_paystack_ref,
                v_charge_amount, v_final_usd, 'NGN', 'success', 'paystack', NOW()
            );
        END IF;
    END IF;

    RETURN v_enrollment_id;
END;
$$;
