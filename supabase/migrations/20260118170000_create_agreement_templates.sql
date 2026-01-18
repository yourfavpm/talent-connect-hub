-- Agreement Clause Management System
-- Phase 1: Database Schema

-- Create agreement_templates table
CREATE TABLE IF NOT EXISTS agreement_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Classification
    user_type TEXT NOT NULL CHECK (user_type IN ('client', 'talent')),
    service_model TEXT NOT NULL CHECK (service_model IN ('direct_hire', 'trial_to_hire', 'contract_talent')),
    
    -- Content
    clause_name TEXT NOT NULL,
    clause_body TEXT NOT NULL, -- Rich text/HTML
    
    -- Versioning
    version_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    is_default BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(user_type, service_model, version_number)
);

-- Create unique index to ensure only one default per combination
DROP INDEX IF EXISTS idx_one_default_per_combination;
CREATE UNIQUE INDEX idx_one_default_per_combination 
ON agreement_templates (user_type, service_model) 
WHERE (is_default = true AND status = 'active');

-- Other indexes for performance
DROP INDEX IF EXISTS idx_agreement_templates_lookup;
DROP INDEX IF EXISTS idx_agreement_templates_created_by;
DROP INDEX IF EXISTS idx_agreement_templates_status;

CREATE INDEX idx_agreement_templates_lookup ON agreement_templates(user_type, service_model, status, is_default);
CREATE INDEX idx_agreement_templates_created_by ON agreement_templates(created_by);
CREATE INDEX idx_agreement_templates_status ON agreement_templates(status) WHERE status = 'active';

-- Enable RLS
ALTER TABLE agreement_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage agreement templates
CREATE POLICY "Admins can manage agreement templates"
    ON agreement_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('super_admin')
        )
    );

-- Add template tracking fields to contracts table
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS client_agreement_template_id UUID REFERENCES agreement_templates(id),
ADD COLUMN IF NOT EXISTS client_agreement_version INTEGER,
ADD COLUMN IF NOT EXISTS talent_agreement_template_id UUID REFERENCES agreement_templates(id),
ADD COLUMN IF NOT EXISTS talent_agreement_version INTEGER,
ADD COLUMN IF NOT EXISTS agreement_attached_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS agreement_attached_by UUID REFERENCES auth.users(id);

-- Create indexes on contracts for template lookups
CREATE INDEX IF NOT EXISTS idx_contracts_client_template ON contracts(client_agreement_template_id);
CREATE INDEX IF NOT EXISTS idx_contracts_talent_template ON contracts(talent_agreement_template_id);

-- Seed default templates
-- Note: Replace <admin_user_id> with actual admin user ID when running

-- Direct Hire - Client Agreement
INSERT INTO agreement_templates (user_type, service_model, clause_name, clause_body, is_default, version_number)
VALUES (
    'client',
    'direct_hire',
    'Direct Hire Client Agreement v1',
    '<h2>DIRECT HIRE PLACEMENT AGREEMENT</h2>
<p>This Agreement is entered into between <strong>{{clientCompany}}</strong> ("Client") and <strong>Taskive</strong> ("Agency") for the direct hire placement of <strong>{{talentName}}</strong> ("Candidate").</p>

<h3>1. PLACEMENT FEE</h3>
<p>Client agrees to pay Agency a one-time placement fee of <strong>${{placementFee}}</strong>, representing 15% of the Candidate''s annual compensation.</p>

<h3>2. PAYMENT TERMS</h3>
<p>Payment is due within 30 days of the Candidate''s start date of <strong>{{startDate}}</strong>.</p>

<h3>3. GUARANTEE PERIOD</h3>
<p>Agency guarantees the placement for 90 days. If the Candidate voluntarily leaves or is terminated for cause within this period, Agency will provide a replacement candidate at no additional fee.</p>

<h3>4. CLIENT RESPONSIBILITIES</h3>
<p>Client will directly employ the Candidate and is responsible for all employment-related obligations, including but not limited to: salary, benefits, taxes, workers'' compensation, and compliance with employment laws.</p>

<h3>5. REPLACEMENT CLAUSE</h3>
<p>If the Candidate does not meet performance expectations within the guarantee period, Client may request a replacement. Agency will use reasonable efforts to provide a suitable replacement within 60 days.</p>

<h3>6. CONFIDENTIALITY</h3>
<p>Both parties agree to maintain confidentiality of all proprietary information exchanged during this engagement.</p>

<p><em>By signing this agreement, Client acknowledges and accepts these terms.</em></p>',
    true,
    1
) ON CONFLICT DO NOTHING;

-- Direct Hire - Talent Agreement
INSERT INTO agreement_templates (user_type, service_model, clause_name, clause_body, is_default, version_number)
VALUES (
    'talent',
    'direct_hire',
    'Direct Hire Talent Agreement v1',
    '<h2>DIRECT HIRE EMPLOYMENT TRANSFER AGREEMENT</h2>
<p>This Agreement confirms the transfer of employment for <strong>{{talentName}}</strong> (ID: {{talentId}}) to <strong>{{clientCompany}}</strong> ("Employer").</p>

<h3>1. EMPLOYMENT TRANSFER</h3>
<p>Effective <strong>{{startDate}}</strong>, you will be directly employed by {{clientCompany}}. Your employment relationship with Taskive will terminate on this date.</p>

<h3>2. COMPENSATION</h3>
<p>Your annual compensation will be <strong>${{talentRate}}</strong> as agreed with {{clientCompany}}. All salary, benefits, and employment terms will be managed directly by {{clientCompany}}.</p>

<h3>3. EMPLOYMENT TERMS</h3>
<p>You will be an at-will employee of {{clientCompany}}, subject to their policies, procedures, and employment agreement.</p>

<h3>4. TASKIVE OBLIGATIONS</h3>
<p>Taskive''s obligations to you will cease upon the employment transfer date. All future employment matters should be directed to {{clientCompany}}.</p>

<h3>5. ACKNOWLEDGMENT</h3>
<p>By signing this agreement, you acknowledge that:</p>
<ul>
    <li>You understand the terms of your direct employment with {{clientCompany}}</li>
    <li>You have reviewed and accepted {{clientCompany}}''s employment offer</li>
    <li>Your relationship with Taskive will terminate as of the start date</li>
</ul>

<p><em>Congratulations on your new role!</em></p>',
    true,
    1
) ON CONFLICT DO NOTHING;

-- Trial-to-Hire - Client Agreement
INSERT INTO agreement_templates (user_type, service_model, clause_name, clause_body, is_default, version_number)
VALUES (
    'client',
    'trial_to_hire',
    'Trial-to-Hire Client Agreement v1',
    '<h2>TRIAL-TO-HIRE SERVICE AGREEMENT</h2>
<p>This Agreement is between <strong>{{clientCompany}}</strong> ("Client") and <strong>Taskive</strong> ("Agency") for talent services provided by <strong>{{talentName}}</strong> ("Contractor").</p>

<h3>1. SERVICE TERMS</h3>
<p><strong>Role:</strong> {{jobTitle}}<br>
<strong>Start Date:</strong> {{startDate}}<br>
<strong>Working Arrangement:</strong> {{workingArrangement}}<br>
<strong>Expected Hours:</strong> {{expectedWeeklyHours}} hours/week</p>

<h3>2. BILLING TERMS</h3>
<p><strong>Rate:</strong> ${{clientRate}}/{{compensationType}}<br>
<strong>Billing Frequency:</strong> {{billingFrequency}}<br>
<strong>Billing Day:</strong> {{billingDay}}</p>

{{overtimeClause}}

<h3>3. TIME TRACKING</h3>
<p><strong>Time Tracking Required:</strong> {{timeTrackingRequired}}</p>
<p>Contractor will submit timesheets for approval. Client will review and approve hours worked. Invoices will be generated based on approved timesheets.</p>

<h3>4. PAYMENT TERMS</h3>
<p>Invoices are due within 15 days of receipt. Late payments may incur a 1.5% monthly interest charge.</p>

<h3>5. CONVERSION TO DIRECT HIRE</h3>
<p>Client may convert Contractor to direct employment at any time by paying a conversion fee equal to 15% of the Contractor''s annual salary.</p>

<h3>6. TERMINATION</h3>
<p>Either party may terminate this agreement with 14 days written notice. Client will be invoiced for all work performed through the termination date.</p>

<h3>7. CONTRACTOR RELATIONSHIP</h3>
<p>Contractor is an independent contractor of Agency, not an employee of Client. Agency is responsible for all employment-related obligations.</p>

<p><em>By signing, Client agrees to these terms and conditions.</em></p>',
    true,
    1
) ON CONFLICT DO NOTHING;

-- Trial-to-Hire - Talent Agreement
INSERT INTO agreement_templates (user_type, service_model, clause_name, clause_body, is_default, version_number)
VALUES (
    'talent',
    'trial_to_hire',
    'Trial-to-Hire Talent Agreement v1',
    '<h2>INDEPENDENT CONTRACTOR AGREEMENT</h2>
<p>This Agreement is between <strong>{{talentName}}</strong> (ID: {{talentId}}) ("Contractor") and <strong>Taskive</strong> ("Company") for services provided to <strong>{{clientCompany}}</strong> ("Client").</p>

<h3>1. ENGAGEMENT TERMS</h3>
<p><strong>Role:</strong> {{jobTitle}}<br>
<strong>Start Date:</strong> {{startDate}}<br>
<strong>Working Arrangement:</strong> {{workingArrangement}}<br>
<strong>Expected Hours:</strong> {{expectedWeeklyHours}} hours/week</p>

<h3>2. COMPENSATION</h3>
<p><strong>Rate:</strong> ${{talentRate}}/{{compensationType}}<br>
<strong>Payment Frequency:</strong> {{paymentFrequency}}<br>
<strong>Payday:</strong> {{payday}}</p>

{{overtimeClause}}

<h3>3. TIME TRACKING</h3>
<p><strong>Time Tracking Required:</strong> {{timeTrackingRequired}}</p>
<p>You must submit accurate timesheets by the deadline each pay period. Payments will be processed based on approved hours.</p>

<h3>4. INDEPENDENT CONTRACTOR STATUS</h3>
<p>You are an independent contractor, not an employee. You are responsible for:</p>
<ul>
    <li>Your own taxes (1099 reporting)</li>
    <li>Your own insurance and benefits</li>
    <li>Compliance with all applicable laws</li>
</ul>

<h3>5. WORK PRODUCT</h3>
<p>All work product created during this engagement belongs to the Client. You agree to assign all intellectual property rights to Client.</p>

<h3>6. CONFIDENTIALITY</h3>
<p>You agree to maintain strict confidentiality of all Client proprietary information and trade secrets.</p>

<h3>7. TERMINATION</h3>
<p>Either party may terminate this agreement with 14 days written notice. You will be paid for all approved work through the termination date.</p>

<h3>8. CONVERSION OPPORTUNITY</h3>
<p>Client may offer you direct employment at any time. If you accept, this contractor agreement will terminate and you will become a direct employee of Client.</p>

<p><em>By signing, you acknowledge and agree to these terms.</em></p>',
    true,
    1
) ON CONFLICT DO NOTHING;

-- Contract Talent - Client Agreement
INSERT INTO agreement_templates (user_type, service_model, clause_name, clause_body, is_default, version_number)
VALUES (
    'client',
    'contract_talent',
    'Managed Contract Talent Agreement v1',
    '<h2>MANAGED CONTRACT TALENT AGREEMENT</h2>
<p>This Agreement is between <strong>{{clientCompany}}</strong> ("Client") and <strong>Taskive</strong> ("Agency") for ongoing talent services provided by <strong>{{talentName}}</strong> ("Contractor").</p>

<h3>1. SERVICE TERMS</h3>
<p><strong>Role:</strong> {{jobTitle}}<br>
<strong>Start Date:</strong> {{startDate}}<br>
<strong>Duration:</strong> {{duration}}<br>
<strong>Working Arrangement:</strong> {{workingArrangement}}<br>
<strong>Expected Hours:</strong> {{expectedWeeklyHours}} hours/week</p>

<h3>2. BILLING TERMS</h3>
<p><strong>Rate:</strong> ${{clientRate}}/{{compensationType}}<br>
<strong>Billing Frequency:</strong> {{billingFrequency}}<br>
<strong>Billing Day:</strong> {{billingDay}}</p>

{{overtimeClause}}

<h3>3. TIME TRACKING</h3>
<p><strong>Time Tracking Required:</strong> {{timeTrackingRequired}}</p>
<p>Contractor will submit timesheets for approval. Client will review and approve hours worked. Invoices will be generated based on approved timesheets.</p>

<h3>4. PAYMENT TERMS</h3>
<p>Invoices are due within 15 days of receipt. Late payments may incur a 1.5% monthly interest charge.</p>

<h3>5. MANAGED SERVICES</h3>
<p>Agency will handle all contractor management, including:</p>
<ul>
    <li>Payroll and tax compliance</li>
    <li>Performance monitoring</li>
    <li>Timesheet approval workflow</li>
    <li>Contractor support and issue resolution</li>
</ul>

<h3>6. TERMINATION</h3>
<p>Either party may terminate this agreement with 30 days written notice. Client will be invoiced for all work performed through the termination date.</p>

<h3>7. CONTRACTOR RELATIONSHIP</h3>
<p>Contractor is an independent contractor of Agency, not an employee of Client. Agency is responsible for all employment-related obligations.</p>

<p><em>By signing, Client agrees to these terms and conditions.</em></p>',
    true,
    1
) ON CONFLICT DO NOTHING;

-- Contract Talent - Talent Agreement
INSERT INTO agreement_templates (user_type, service_model, clause_name, clause_body, is_default, version_number)
VALUES (
    'talent',
    'contract_talent',
    'Managed Contract Talent Agreement v1',
    '<h2>MANAGED CONTRACTOR AGREEMENT</h2>
<p>This Agreement is between <strong>{{talentName}}</strong> (ID: {{talentId}}) ("Contractor") and <strong>Taskive</strong> ("Company") for ongoing services provided to <strong>{{clientCompany}}</strong> ("Client").</p>

<h3>1. ENGAGEMENT TERMS</h3>
<p><strong>Role:</strong> {{jobTitle}}<br>
<strong>Start Date:</strong> {{startDate}}<br>
<strong>Duration:</strong> {{duration}}<br>
<strong>Working Arrangement:</strong> {{workingArrangement}}<br>
<strong>Expected Hours:</strong> {{expectedWeeklyHours}} hours/week</p>

<h3>2. COMPENSATION</h3>
<p><strong>Rate:</strong> ${{talentRate}}/{{compensationType}}<br>
<strong>Payment Frequency:</strong> {{paymentFrequency}}<br>
<strong>Payday:</strong> {{payday}}</p>

{{overtimeClause}}

<h3>3. TIME TRACKING</h3>
<p><strong>Time Tracking Required:</strong> {{timeTrackingRequired}}</p>
<p>You must submit accurate timesheets by the deadline each pay period. Payments will be processed based on approved hours.</p>

<h3>4. INDEPENDENT CONTRACTOR STATUS</h3>
<p>You are an independent contractor, not an employee. You are responsible for:</p>
<ul>
    <li>Your own taxes (1099 reporting)</li>
    <li>Your own insurance and benefits</li>
    <li>Compliance with all applicable laws</li>
</ul>

<h3>5. MANAGED SUPPORT</h3>
<p>Company will provide:</p>
<ul>
    <li>Timely payment processing</li>
    <li>Timesheet approval workflow</li>
    <li>Performance support</li>
    <li>Issue resolution assistance</li>
</ul>

<h3>6. WORK PRODUCT</h3>
<p>All work product created during this engagement belongs to the Client. You agree to assign all intellectual property rights to Client.</p>

<h3>7. CONFIDENTIALITY</h3>
<p>You agree to maintain strict confidentiality of all Client proprietary information and trade secrets.</p>

<h3>8. TERMINATION</h3>
<p>Either party may terminate this agreement with 30 days written notice. You will be paid for all approved work through the termination date.</p>

<p><em>By signing, you acknowledge and agree to these terms.</em></p>',
    true,
    1
) ON CONFLICT DO NOTHING;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
