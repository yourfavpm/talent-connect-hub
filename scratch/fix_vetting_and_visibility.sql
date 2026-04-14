-- Fix V2 Vetting Actions constraint to allow VETTING_NOTE_SENT
ALTER TABLE public.v2_vetting_actions 
DROP CONSTRAINT IF EXISTS v2_vetting_actions_action_check;

ALTER TABLE public.v2_vetting_actions
ADD CONSTRAINT v2_vetting_actions_action_check 
CHECK (action IN ('SUBMIT','START_REVIEW','APPROVE_SECTION','REQUEST_CHANGES','RESUBMIT','ASSIGN_LEVEL','MARK_VETTED', 'VETTING_NOTE_SENT'));

-- Ensure client_visible_talents view is robust (Security check)
-- No changes needed to the view itself yet, but let's ensure the visibility flag is never null
ALTER TABLE public.v2_talent_profiles
ALTER COLUMN visible_to_clients SET DEFAULT false,
ALTER COLUMN visible_to_clients SET NOT NULL;

-- Ensure roles are correct for clients to see these talents
-- (This is just a diagnostic query, but useful to have in history)
-- SELECT count(*) FROM public.client_visible_talents;
