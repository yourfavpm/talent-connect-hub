-- ============================================================
-- Update academy_enrollments & finalize_academy_enrollment
-- to support coupon discounts
-- Created: 2026-06-18
-- ============================================================

-- Add discount tracking columns to academy_enrollments
ALTER TABLE public.academy_enrollments
    ADD COLUMN IF NOT EXISTS coupon_code     TEXT        DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS discount_pct    NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS final_price_naira NUMERIC   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS final_price_usd   NUMERIC   DEFAULT NULL;

-- ── Updated RPC ───────────────────────────────────────────────
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
    -- NEW: coupon parameters
    p_coupon_code         TEXT    DEFAULT NULL,
    p_discount_pct        NUMERIC DEFAULT 0,
    p_final_price_naira   NUMERIC DEFAULT NULL,
    p_final_price_usd     NUMERIC DEFAULT NULL
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
    v_coupon_id        UUID;
BEGIN
    -- Resolve final prices (apply discount if not already computed by caller)
    v_final_naira := COALESCE(p_final_price_naira, p_price_naira);
    v_final_usd   := COALESCE(p_final_price_usd,   p_price_usd);

    -- 1. Resolve User ID (guest checkout allowed — v_user_id may stay NULL)
    IF p_user_id IS NOT NULL THEN
        v_user_id := p_user_id;
    ELSE
        SELECT id INTO v_user_id
        FROM auth.users
        WHERE email = LOWER(TRIM(p_email))
        LIMIT 1;
    END IF;

    -- 2. Check for existing enrollment in this cohort by email
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
            NOW(),
            NOW()
        ) RETURNING id INTO v_enrollment_id;

        -- Increment cohort slots
        UPDATE public.cohorts
        SET current_slots = COALESCE(current_slots, 0) + 1
        WHERE id = p_cohort_id;
    END IF;

    -- 4. Increment coupon uses (find by code + course / global)
    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        -- Per-course match first, then global
        SELECT id INTO v_coupon_id
        FROM public.course_coupons
        WHERE UPPER(code) = UPPER(TRIM(p_coupon_code))
          AND (course_id = p_course_slug OR course_id IS NULL)
        ORDER BY (course_id IS NOT NULL) DESC   -- prefer per-course match
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

    -- 6. Record transaction (using discounted final price)
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
                v_final_naira, v_final_usd, 'NGN', 'success', 'kora', NOW()
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
                v_final_naira, v_final_usd, 'NGN', 'success', 'paystack', NOW()
            );
        END IF;
    END IF;

    RETURN v_enrollment_id;
END;
$$;
