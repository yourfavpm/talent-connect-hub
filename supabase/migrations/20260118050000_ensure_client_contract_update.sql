-- Allow clients to update their own contracts (e.g. signing)

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can update their own contracts" 
ON public.contracts 
FOR UPDATE 
TO authenticated
USING (
    client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
);
