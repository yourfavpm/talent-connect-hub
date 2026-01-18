-- Auto-close jobs when contract is fully signed
-- This trigger runs when a contract's talent_signed_at is updated (meaning both parties have signed)

CREATE OR REPLACE FUNCTION close_job_on_contract_signed()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if both client and talent have signed
    IF NEW.client_signed_at IS NOT NULL AND NEW.talent_signed_at IS NOT NULL THEN
        -- Find the job associated with this contract via the offer
        UPDATE jobs
        SET 
            status = 'closed',
            updated_at = NOW()
        WHERE id IN (
            SELECT job_id 
            FROM offers 
            WHERE id = NEW.offer_id
        );
        
        -- Also update all other applications for this job to 'rejected' (except the hired one)
        UPDATE job_applications
        SET 
            status = 'rejected',
            updated_at = NOW()
        WHERE job_id IN (
            SELECT job_id 
            FROM offers 
            WHERE id = NEW.offer_id
        )
        AND id NOT IN (
            SELECT id 
            FROM job_applications 
            WHERE talent_id = NEW.talent_id 
            AND job_id IN (
                SELECT job_id 
                FROM offers 
                WHERE id = NEW.offer_id
            )
        );
        
        -- Update the hired application to 'hired' status
        UPDATE job_applications
        SET 
            status = 'hired',
            updated_at = NOW()
        WHERE talent_id = NEW.talent_id 
        AND job_id IN (
            SELECT job_id 
            FROM offers 
            WHERE id = NEW.offer_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_close_job_on_contract_signed ON contracts;

-- Create trigger
CREATE TRIGGER trigger_close_job_on_contract_signed
    AFTER UPDATE OF talent_signed_at, client_signed_at ON contracts
    FOR EACH ROW
    WHEN (NEW.talent_signed_at IS NOT NULL AND NEW.client_signed_at IS NOT NULL)
    EXECUTE FUNCTION close_job_on_contract_signed();

-- Add comment
COMMENT ON FUNCTION close_job_on_contract_signed() IS 'Automatically closes a job and rejects other applicants when a contract is fully signed by both client and talent';
