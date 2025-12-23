-- Create function to notify when job is approved/rejected
CREATE OR REPLACE FUNCTION public.notify_job_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    client_user_id uuid;
BEGIN
    -- Get the client's user_id
    SELECT user_id INTO client_user_id FROM clients WHERE id = NEW.client_id;
    
    -- Only notify on status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Job approved and published
        IF NEW.status = 'published' THEN
            INSERT INTO notifications (user_id, title, message, type, action_url)
            VALUES (client_user_id, 'Job Approved!', 'Your job "' || NEW.title || '" has been approved and is now live.', 'job_approved', '/client/jobs');
        -- Job rejected
        ELSIF NEW.status = 'closed' AND NEW.rejection_reason IS NOT NULL THEN
            INSERT INTO notifications (user_id, title, message, type, action_url)
            VALUES (client_user_id, 'Job Not Approved', 'Your job "' || NEW.title || '" was not approved. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided'), 'job_rejected', '/client/jobs');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for job status changes
DROP TRIGGER IF EXISTS notify_on_job_status_change ON jobs;
CREATE TRIGGER notify_on_job_status_change
AFTER UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION notify_job_status_change();

-- Create function to notify admin when job is submitted
CREATE OR REPLACE FUNCTION public.notify_admin_job_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    admin_record RECORD;
    client_name text;
BEGIN
    -- Get client company name
    SELECT company_name INTO client_name FROM clients WHERE id = NEW.client_id;
    
    -- Notify all admins
    FOR admin_record IN SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'operations_admin')
    LOOP
        INSERT INTO notifications (user_id, title, message, type, action_url)
        VALUES (admin_record.user_id, 'New Job Submitted', 'A new job "' || NEW.title || '" from ' || COALESCE(client_name, 'Unknown Client') || ' needs review.', 'job_submitted', '/admin/jobs');
    END LOOP;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for job submissions
DROP TRIGGER IF EXISTS notify_admin_on_job_submit ON jobs;
CREATE TRIGGER notify_admin_on_job_submit
AFTER INSERT OR UPDATE ON jobs
FOR EACH ROW
WHEN (NEW.status = 'submitted')
EXECUTE FUNCTION notify_admin_job_submitted();

-- Create function to notify when application status changes
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    talent_user_id uuid;
    job_title text;
BEGIN
    -- Get talent user_id and job title
    SELECT user_id INTO talent_user_id FROM talents WHERE id = NEW.talent_id;
    SELECT title INTO job_title FROM jobs WHERE id = NEW.job_id;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Shortlisted
        IF NEW.status = 'shortlisted' THEN
            INSERT INTO notifications (user_id, title, message, type, action_url)
            VALUES (talent_user_id, 'You''ve Been Shortlisted!', 'Great news! You have been shortlisted for "' || job_title || '".', 'shortlisted', '/talent/jobs');
        -- Interview scheduled
        ELSIF NEW.status = 'interview_scheduled' THEN
            INSERT INTO notifications (user_id, title, message, type, action_url)
            VALUES (talent_user_id, 'Interview Scheduled', 'An interview has been scheduled for "' || job_title || '". Check your email for details.', 'interview_scheduled', '/talent/jobs');
        -- Hired
        ELSIF NEW.status = 'hired' THEN
            INSERT INTO notifications (user_id, title, message, type, action_url)
            VALUES (talent_user_id, 'Congratulations! You''re Hired!', 'You have been selected for "' || job_title || '". An offer will be sent shortly.', 'hired', '/talent/jobs');
        -- Rejected
        ELSIF NEW.status = 'rejected' THEN
            INSERT INTO notifications (user_id, title, message, type, action_url)
            VALUES (talent_user_id, 'Application Update', 'Unfortunately, you were not selected for "' || job_title || '". Keep applying!', 'application_rejected', '/talent/jobs');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for application status changes
DROP TRIGGER IF EXISTS notify_on_application_status_change ON job_applications;
CREATE TRIGGER notify_on_application_status_change
AFTER UPDATE ON job_applications
FOR EACH ROW
EXECUTE FUNCTION notify_application_status_change();

-- Create function to notify admin when talent applies
CREATE OR REPLACE FUNCTION public.notify_admin_new_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    admin_record RECORD;
    talent_name text;
    job_title text;
BEGIN
    -- Get talent name and job title
    SELECT first_name || ' ' || last_name INTO talent_name FROM talents WHERE id = NEW.talent_id;
    SELECT title INTO job_title FROM jobs WHERE id = NEW.job_id;
    
    -- Notify all admins
    FOR admin_record IN SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'operations_admin')
    LOOP
        INSERT INTO notifications (user_id, title, message, type, action_url)
        VALUES (admin_record.user_id, 'New Application', talent_name || ' applied for "' || job_title || '".', 'new_application', '/admin/jobs');
    END LOOP;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for new applications
DROP TRIGGER IF EXISTS notify_admin_on_new_application ON job_applications;
CREATE TRIGGER notify_admin_on_new_application
AFTER INSERT ON job_applications
FOR EACH ROW
EXECUTE FUNCTION notify_admin_new_application();

-- Create function to notify on offer creation
CREATE OR REPLACE FUNCTION public.notify_offer_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    talent_user_id uuid;
    client_user_id uuid;
    admin_record RECORD;
BEGIN
    -- Get talent and client user_ids
    SELECT user_id INTO talent_user_id FROM talents WHERE id = NEW.talent_id;
    SELECT user_id INTO client_user_id FROM clients WHERE id = NEW.client_id;
    
    -- Notify talent
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (talent_user_id, 'New Offer Received!', 'You have received an offer for "' || NEW.role_title || '". Review it in your dashboard.', 'offer_received', '/talent/dashboard');
    
    -- Notify admins
    FOR admin_record IN SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'operations_admin')
    LOOP
        INSERT INTO notifications (user_id, title, message, type, action_url)
        VALUES (admin_record.user_id, 'New Offer Created', 'An offer for "' || NEW.role_title || '" has been created.', 'offer_created', '/admin/offers');
    END LOOP;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for offer creation
DROP TRIGGER IF EXISTS notify_on_offer_created ON offers;
CREATE TRIGGER notify_on_offer_created
AFTER INSERT ON offers
FOR EACH ROW
EXECUTE FUNCTION notify_offer_created();

-- Create function to notify on contract creation
CREATE OR REPLACE FUNCTION public.notify_contract_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    talent_user_id uuid;
    client_user_id uuid;
BEGIN
    -- Get talent and client user_ids
    SELECT user_id INTO talent_user_id FROM talents WHERE id = NEW.talent_id;
    SELECT user_id INTO client_user_id FROM clients WHERE id = NEW.client_id;
    
    -- Notify talent
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (talent_user_id, 'Contract Ready for Signing', 'Your contract for "' || NEW.role_title || '" is ready. Please review and sign.', 'contract_ready', '/talent/dashboard');
    
    -- Notify client
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (client_user_id, 'Contract Ready for Signing', 'The contract for "' || NEW.role_title || '" is ready. Please review and sign.', 'contract_ready', '/client/contracts');
    
    RETURN NEW;
END;
$function$;

-- Create trigger for contract creation
DROP TRIGGER IF EXISTS notify_on_contract_created ON contracts;
CREATE TRIGGER notify_on_contract_created
AFTER INSERT ON contracts
FOR EACH ROW
EXECUTE FUNCTION notify_contract_created();