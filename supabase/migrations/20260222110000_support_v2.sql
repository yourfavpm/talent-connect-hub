-- Support Module V2 Enhancements
-- 1. Ensure ticket_replies exists (Fixed definition)
CREATE TABLE IF NOT EXISTS public.ticket_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    is_admin_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enhance support_tickets table
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS unread_by_admin BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 3. Ticket Audit Log
CREATE TABLE IF NOT EXISTS public.ticket_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'status_change', 'priority_change', 'assignment'
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON public.ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_admin ON public.support_tickets(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- 5. RLS Policies
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_audit_log ENABLE ROW LEVEL SECURITY;

-- Replies Policies
CREATE POLICY "Users can view replies for own tickets" ON public.ticket_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE support_tickets.id = ticket_replies.ticket_id 
            AND support_tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all replies" ON public.ticket_replies
    FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can send replies to own tickets" ON public.ticket_replies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE support_tickets.id = ticket_replies.ticket_id 
            AND support_tickets.user_id = auth.uid()
        )
    );

-- Audit Log Policies
CREATE POLICY "Admins can view audit logs" ON public.ticket_audit_log
    FOR SELECT USING (public.is_admin(auth.uid()));

-- 6. Trigger for unread status
CREATE OR REPLACE FUNCTION public.handle_ticket_reply_unread()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_admin_reply THEN
        -- When admin replies, maybe clear the user's unread flag if we had one?
        -- For now, focus on admin's view
        UPDATE public.support_tickets SET unread_by_admin = FALSE WHERE id = NEW.ticket_id;
    ELSE
        -- When user replies, mark as unread for admin
        UPDATE public.support_tickets SET unread_by_admin = TRUE WHERE id = NEW.ticket_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ticket_reply_update_unread
    AFTER INSERT ON public.ticket_replies
    FOR EACH ROW EXECUTE FUNCTION public.handle_ticket_reply_unread();
