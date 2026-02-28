-- ============================================================
-- V2 Vetting System – 04: Triggers & Audit
-- ============================================================

-- Auto-update updated_at on v2_talent_profiles
CREATE OR REPLACE FUNCTION public.v2_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER v2_talent_profiles_updated_at
    BEFORE UPDATE ON public.v2_talent_profiles
    FOR EACH ROW EXECUTE FUNCTION public.v2_set_updated_at();

CREATE TRIGGER v2_profile_sections_updated_at
    BEFORE UPDATE ON public.v2_profile_sections
    FOR EACH ROW EXECUTE FUNCTION public.v2_set_updated_at();

-- Auto-create V2 profile when a talent signs up (or when talent row is created)
CREATE OR REPLACE FUNCTION public.v2_auto_create_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.v2_talent_profiles (user_id, talent_id)
    VALUES (NEW.user_id, NEW.talent_id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS v2_on_talent_created ON public.talents;
CREATE TRIGGER v2_on_talent_created
    AFTER INSERT ON public.talents
    FOR EACH ROW EXECUTE FUNCTION public.v2_auto_create_profile();
