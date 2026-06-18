-- ============================================================
-- Academy Coupon Codes System
-- Created: 2026-06-18
-- Purpose: Allow admins to create percentage-based coupon codes
--          either scoped to a specific course or globally across
--          all courses. Applicants enter the code at checkout to
--          receive a discount on the Paystack/Kora charge.
-- ============================================================

-- ── Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_coupons (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- NULL course_id = global coupon (works on all courses)
    course_id     TEXT        DEFAULT NULL,
    code          TEXT        NOT NULL,
    discount_pct  NUMERIC(5,2) NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
    max_uses      INT         DEFAULT NULL,   -- NULL = unlimited
    uses          INT         NOT NULL DEFAULT 0,
    expires_at    TIMESTAMPTZ DEFAULT NULL,   -- NULL = never expires
    is_active     BOOLEAN     NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique code per course (NULLs treated as distinct for global coupons,
-- so we use a partial unique index for global ones separately).
CREATE UNIQUE INDEX IF NOT EXISTS uq_course_coupon_per_course
    ON public.course_coupons (course_id, UPPER(code))
    WHERE course_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_global_coupon
    ON public.course_coupons (UPPER(code))
    WHERE course_id IS NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_coupon_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_coupon_updated_at ON public.course_coupons;
CREATE TRIGGER trg_coupon_updated_at
    BEFORE UPDATE ON public.course_coupons
    FOR EACH ROW EXECUTE FUNCTION public.set_coupon_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.course_coupons ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage coupons"
    ON public.course_coupons
    FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.user_roles
            WHERE role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin')
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.user_roles
            WHERE role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin')
        )
    );

-- ── RPC: validate_coupon ─────────────────────────────────────
-- Returns JSONB:
--   { valid: true,  discount_pct: 20, coupon_id: "...", message: "20% off applied" }
--   { valid: false, discount_pct: 0,  coupon_id: null,  message: "Code not found" }
--
-- Lookup order: per-course match → global match
CREATE OR REPLACE FUNCTION public.validate_coupon(
    p_course_slug TEXT,
    p_code        TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coupon public.course_coupons%ROWTYPE;
BEGIN
    -- 1. Look for a per-course coupon first
    SELECT * INTO v_coupon
    FROM public.course_coupons
    WHERE course_id = TRIM(p_course_slug)
      AND UPPER(code) = UPPER(TRIM(p_code))
      AND is_active = true
    LIMIT 1;

    -- 2. Fall back to a global coupon
    IF v_coupon.id IS NULL THEN
        SELECT * INTO v_coupon
        FROM public.course_coupons
        WHERE course_id IS NULL
          AND UPPER(code) = UPPER(TRIM(p_code))
          AND is_active = true
        LIMIT 1;
    END IF;

    -- 3. Not found
    IF v_coupon.id IS NULL THEN
        RETURN jsonb_build_object(
            'valid',        false,
            'discount_pct', 0,
            'coupon_id',    NULL,
            'message',      'Coupon code not found or inactive'
        );
    END IF;

    -- 4. Expired?
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'valid',        false,
            'discount_pct', 0,
            'coupon_id',    NULL,
            'message',      'This coupon has expired'
        );
    END IF;

    -- 5. Max uses reached?
    IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses >= v_coupon.max_uses THEN
        RETURN jsonb_build_object(
            'valid',        false,
            'discount_pct', 0,
            'coupon_id',    NULL,
            'message',      'This coupon has reached its usage limit'
        );
    END IF;

    -- 6. Valid!
    RETURN jsonb_build_object(
        'valid',        true,
        'discount_pct', v_coupon.discount_pct,
        'coupon_id',    v_coupon.id,
        'message',      ROUND(v_coupon.discount_pct) || '% discount applied'
    );
END;
$$;

-- Allow unauthenticated callers (checkout is public / frictionless)
GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT, TEXT) TO anon, authenticated;
