-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.generate_talent_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    new_id TEXT;
    counter INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(talent_id FROM 8) AS INTEGER)), 1000) + 1
    INTO counter
    FROM public.talents;
    
    new_id := 'TAS-VA-' || counter::TEXT;
    RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_client_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    new_id TEXT;
    counter INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(client_id FROM 5) AS INTEGER)), 1000) + 1
    INTO counter
    FROM public.clients;
    
    new_id := 'CLI-' || counter::TEXT;
    RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    new_num TEXT;
    counter INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 5) AS INTEGER)), 10000) + 1
    INTO counter
    FROM public.contracts;
    
    new_num := 'CON-' || counter::TEXT;
    RETURN new_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    new_num TEXT;
    counter INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 10000) + 1
    INTO counter
    FROM public.invoices;
    
    new_num := 'INV-' || counter::TEXT;
    RETURN new_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;