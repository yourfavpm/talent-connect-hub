-- ============================================================
-- RPC: v2_admin_send_vetting_note
-- Allows admins to log that they sent a vetting feedback note.
-- ============================================================

CREATE OR REPLACE FUNCTION public.v2_admin_send_vetting_note(
    p_talent_user_id UUID,
    p_subject TEXT,
    p_body TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_profile  public.v2_talent_profiles%ROWTYPE;
BEGIN
    -- 1. Verify Admin Status
    IF NOT public.is_admin(v_admin_id) THEN RAISE EXCEPTION 'Unauthorised'; END IF;

    -- 2. Verify Profile Exists
    SELECT * INTO v_profile FROM public.v2_talent_profiles WHERE user_id = p_talent_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

    -- 3. Log the Vetting Action
    INSERT INTO public.v2_vetting_actions (
        user_id, 
        admin_id, 
        action, 
        meta
    )
    VALUES (
        p_talent_user_id, 
        v_admin_id, 
        'VETTING_NOTE_SENT',
        jsonb_build_object(
            'subject', p_subject,
            'body', p_body,
            'sent_at', now()
        )
    );

    -- 4. Create an Internal Notification for the Talent
    INSERT INTO public.v2_notifications (
        user_id, 
        type, 
        title, 
        message, 
        payload
    )
    VALUES (
        p_talent_user_id, 
        'VETTING_NOTE',
        'Vetting Feedback Received: ' || p_subject,
        'An administrator has sent you a note regarding your vetting process. Please check your email for the full details.',
        jsonb_build_object(
            'subject', p_subject,
            'body', p_body
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Vetting note logged and notification created'
    );
END;
$$;
