import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const sql = `
CREATE OR REPLACE FUNCTION public.validate_cohort_enrollment()
RETURNS TRIGGER AS $$
DECLARE
    cohort_open_until TIMESTAMPTZ;
    cohort_status TEXT;
    total_enrolled INT;
    v_max_slots INT;
BEGIN
    -- Validate cohort exists and is open
    SELECT enrollment_end_date, status, current_slots, max_slots
    INTO cohort_open_until, cohort_status, total_enrolled, v_max_slots
    FROM public.cohorts
    WHERE id = NEW.cohort_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cohort does not exist';
    END IF;
    
    -- Check enrollment window
    IF TIMEZONE('utc'::text, NOW()) > cohort_open_until THEN
        RAISE EXCEPTION 'Enrollment period has ended for this cohort';
    END IF;
    
    -- Check enrollment not closed
    IF cohort_status = 'closed' THEN
        RAISE EXCEPTION 'This cohort is closed for enrollment';
    END IF;
    
    -- Check slots availability (only on insert)
    IF TG_OP = 'INSERT' THEN
        IF total_enrolled >= v_max_slots THEN
            RAISE EXCEPTION 'Cohort is full. No more slots available.';
        END IF;
        
        -- Increment current_slots
        UPDATE public.cohorts 
        SET current_slots = current_slots + 1
        WHERE id = NEW.cohort_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
  `;
  
  // We'll use the rest API via rpc to execute if possible, or just print it so the user can run it.
  // Actually we don't have an RPC for raw SQL by default. I will just give the user the SQL.
}
fix();
