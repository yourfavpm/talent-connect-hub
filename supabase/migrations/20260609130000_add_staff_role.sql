-- Migration to add 'staff' role to client_members and client_invites

-- Update client_members constraint
ALTER TABLE public.client_members DROP CONSTRAINT IF EXISTS client_members_role_check;
ALTER TABLE public.client_members ADD CONSTRAINT client_members_role_check CHECK (role IN ('owner', 'admin', 'manager', 'staff'));

-- Update client_invites constraint
ALTER TABLE public.client_invites DROP CONSTRAINT IF EXISTS client_invites_role_check;
ALTER TABLE public.client_invites ADD CONSTRAINT client_invites_role_check CHECK (role IN ('admin', 'manager', 'staff'));
