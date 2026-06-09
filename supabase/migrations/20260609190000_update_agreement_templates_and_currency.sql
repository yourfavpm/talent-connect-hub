-- Migration: Update Agreement Templates and Add Currency
-- 1. Drop existing constraints to support new service models
ALTER TABLE public.agreement_templates DROP CONSTRAINT IF EXISTS agreement_templates_service_model_check;
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_service_model_check;
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_service_model_check;

-- 2. Add currency columns
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- 3. Update existing templates to rebrand from Taskive to OpslyHR
UPDATE public.agreement_templates
SET clause_body = REPLACE(
    REPLACE(
        REPLACE(
            REPLACE(clause_body, 'Taskive', 'OpslyHR'), 
            'taskive', 'OpslyHR'
        ),
        'Agreement between Client and OpslyHR', 'Agreement between Client and OpslyHR'
    ),
    'Agreement between Talent and OpslyHR', 'Agreement between Talent and OpslyHR'
);

-- 3. Seed new detailed SLA templates for other service models
-- Remove any existing seeds for these service models to avoid duplicates
DELETE FROM public.agreement_templates WHERE service_model IN ('full_time', 'one_time', 'managed_teams');

-- ==========================================
-- FULL TIME HIRE
-- ==========================================
-- Client Contract
INSERT INTO public.agreement_templates (user_type, service_model, clause_name, clause_body, is_default, version_number)
VALUES (
    'client',
    'full_time',
    'OpslyHR Full Time Hire Contract Agreement',
    '<h2>FULL TIME HIRE PLACEMENT AGREEMENT</h2>
<p>This Agreement is between <strong>{{clientCompany}}</strong> ("Client") and <strong>OpslyHR</strong> ("Agency") for the direct hire placement of <strong>{{talentName}}</strong> ("Talent").</p>

<h3>1. PLACEMENT TERMS</h3>
<p><strong>Role:</strong> {{jobTitle}}<br>
<strong>Start Date:</strong> {{startDate}}<br>
<strong>Working Arrangement:</strong> {{workingArrangement}}</p>

<h3>2. PLACEMENT FEE</h3>
<p>Client agrees to pay OpslyHR a one-time placement fee of <strong>{{currencySymbol}}{{placementFee}}</strong>. This fee is fully earned and due upon the Talent accepting the employment offer from the Client.</p>

<h3>3. PAYMENT TERMS</h3>
<p>Invoices must be paid within 15 days of receipt. Late payments may incur a 1.5% monthly interest charge.</p>

<h3>4. EMPLOYMENT RELATIONSHIP</h3>
<p>Upon the Talent''s start date, the Talent becomes a direct employee of the Client. The Client is solely responsible for all compensation (including the {{compensationType}} salary of {{currencySymbol}}{{clientRate}}), benefits, taxes, withholdings, and legal compliance related to the Talent. OpslyHR is not a co-employer and holds no ongoing liability regarding the Talent''s employment.</p>

<h3>5. REPLACEMENT GUARANTEE</h3>
<p>OpslyHR offers a 90-day replacement guarantee. If the Talent voluntarily resigns or is terminated for cause by the Client within the first 90 days of employment, OpslyHR will provide a replacement candidate of similar qualifications at no additional placement fee.</p>

<h3>6. CONFIDENTIALITY AND NON-SOLICITATION</h3>
<p>Both parties agree to maintain strict confidentiality regarding proprietary business information shared during the recruitment process.</p>

<p><em>By signing this agreement, Client acknowledges and accepts these terms.</em></p>',
    true,
    1
);

-- Talent Contract
INSERT INTO public.agreement_templates (user_type, service_model, clause_name, clause_body, is_default, version_number)
VALUES (
    'talent',
    'full_time',
    'OpslyHR Full Time Hire Contract Agreement',
    '<h2>FULL TIME HIRE EMPLOYMENT AGREEMENT</h2>
<p>This Agreement confirms the placement of <strong>{{talentName}}</strong> (ID: {{talentId}}) with <strong>{{clientCompany}}</strong> ("Client") via <strong>OpslyHR</strong>.</p>

<h3>1. ENGAGEMENT TERMS</h3>
<p><strong>Role:</strong> {{jobTitle}}<br>
<strong>Start Date:</strong> {{startDate}}<br>
<strong>Working Arrangement:</strong> {{workingArrangement}}</p>

<h3>2. DIRECT EMPLOYMENT</h3>
<p>Upon acceptance of the offer, you will be directly employed by the Client. The Client will be responsible for your compensation of <strong>{{currencySymbol}}{{talentRate}}</strong> per {{compensationType}}, as well as any benefits and taxes. OpslyHR is not the employer and holds no liability regarding workplace disputes or payroll.</p>

<h3>3. REPRESENTATION AND PROFESSIONALISM</h3>
<p>You agree to represent your skills, experience, and qualifications truthfully. During the placement, you must conduct yourself with the highest degree of professionalism and honor your commitment to the Client.</p>

<h3>4. CONFIDENTIALITY</h3>
<p>You agree to maintain strict confidentiality regarding any proprietary business information, trade secrets, or operations of the Client disclosed during your employment.</p>

{{employmentTransferClause}}

<p><em>By signing this agreement, you acknowledge and accept these terms.</em></p>',
    true,
    1
);

-- ==========================================
-- ONE-TIME PROJECT
-- ==========================================
-- Client Contract
INSERT INTO public.agreement_templates (user_type, service_model, clause_name, clause_body, is_default, version_number)
VALUES (
    'client',
    'one_time',
    'OpslyHR One-Time Project Contract Agreement',
    '<h2>ONE-TIME PROJECT SERVICE AGREEMENT</h2>
<p>This Agreement is between <strong>{{clientCompany}}</strong> ("Client") and <strong>OpslyHR</strong> ("Agency") for project services provided by <strong>{{talentName}}</strong> ("Contractor").</p>

<h3>1. PROJECT TERMS</h3>
<p><strong>Project Title:</strong> {{jobTitle}}<br>
<strong>Start Date:</strong> {{startDate}}<br>
<strong>Expected Duration:</strong> {{duration}}<br>
<strong>Working Arrangement:</strong> {{workingArrangement}}</p>

<h3>2. BILLING TERMS</h3>
<p><strong>Total Project Fee:</strong> {{currencySymbol}}{{clientRate}}<br>
<strong>Billing Frequency:</strong> {{billingFrequency}}</p>

<h3>3. DELIVERABLES AND ACCEPTANCE</h3>
<p>The Contractor will submit deliverables as defined in the scope: {{jobDescription}}. The Client has 5 business days to review and request reasonable revisions. If no revisions are requested within 5 days, the deliverable is deemed accepted and the associated payment becomes due.</p>

<h3>4. PAYMENT TERMS</h3>
<p>Invoices are due within 15 days of receipt. Late payments may incur a 1.5% monthly interest charge.</p>

<h3>5. INTELLECTUAL PROPERTY (IP) RIGHTS</h3>
<p>Upon full and final payment of the total project fee, all intellectual property rights, copyrights, and ownership of the final deliverables produced by the Contractor under this agreement will transfer entirely to the Client.</p>

<h3>6. CONTRACTOR RELATIONSHIP</h3>
<p>OpslyHR acts as the intermediary platform. The Contractor operates as an independent contractor, not an employee of the Client.</p>

<p><em>By signing this agreement, Client acknowledges and accepts these terms.</em></p>',
    true,
    1
);

-- Talent Contract
INSERT INTO public.agreement_templates (user_type, service_model, clause_name, clause_body, is_default, version_number)
VALUES (
    'talent',
    'one_time',
    'OpslyHR One-Time Project Contract Agreement',
    '<h2>ONE-TIME PROJECT CONTRACTOR AGREEMENT</h2>
<p>This Agreement is between <strong>{{talentName}}</strong> (ID: {{talentId}}) ("Contractor") and <strong>OpslyHR</strong> ("Company") for project services provided to <strong>{{clientCompany}}</strong> ("Client").</p>

<h3>1. PROJECT TERMS</h3>
<p><strong>Project Title:</strong> {{jobTitle}}<br>
<strong>Start Date:</strong> {{startDate}}<br>
<strong>Expected Duration:</strong> {{duration}}<br>
<strong>Working Arrangement:</strong> {{workingArrangement}}</p>

<h3>2. COMPENSATION</h3>
<p><strong>Project Net Payout:</strong> {{currencySymbol}}{{talentRate}}<br>
<strong>Payment Frequency:</strong> {{paymentFrequency}}</p>

<h3>3. PROJECT SCOPE AND DELIVERABLES</h3>
<p>You agree to execute the fixed-scope project as defined in the Job Description: {{jobDescription}}. You commit to delivering high-quality work within the agreed-upon timeline.</p>

<h3>4. INTELLECTUAL PROPERTY ASSIGNMENT</h3>
<p>You agree that all work product, code, designs, and other deliverables created under this project are "works made for hire." Upon receiving full payment, you automatically assign all copyrights and intellectual property rights to the Client. You may not reuse or distribute the deliverables.</p>

<h3>5. INDEPENDENT CONTRACTOR STATUS</h3>
<p>You are an independent contractor, not an employee. You are responsible for your own taxes, equipment, and insurance.</p>

<h3>6. CONFIDENTIALITY</h3>
<p>You must maintain absolute confidentiality regarding all Client data and systems accessed during the execution of this project.</p>

<p><em>By signing this agreement, you acknowledge and accept these terms.</em></p>',
    true,
    1
);

-- ==========================================
-- MANAGED TEAMS
-- ==========================================
-- Client Contract
INSERT INTO public.agreement_templates (user_type, service_model, clause_name, clause_body, is_default, version_number)
VALUES (
    'client',
    'managed_teams',
    'OpslyHR Managed Teams Contract Agreement',
    '<h2>MANAGED TEAMS SERVICE AGREEMENT</h2>
<p>This Agreement is between <strong>{{clientCompany}}</strong> ("Client") and <strong>OpslyHR</strong> ("Agency") for managed team services provided by <strong>{{talentName}}</strong> ("Team Member").</p>

<h3>1. SERVICE TERMS</h3>
<p><strong>Role:</strong> {{jobTitle}}<br>
<strong>Start Date:</strong> {{startDate}}<br>
<strong>Duration:</strong> {{duration}}<br>
<strong>Working Arrangement:</strong> {{workingArrangement}}<br>
<strong>Expected Hours:</strong> {{expectedWeeklyHours}} hours/week</p>

<h3>2. BILLING TERMS</h3>
<p><strong>Rate:</strong> {{currencySymbol}}{{clientRate}}/{{compensationType}}<br>
<strong>Billing Frequency:</strong> {{billingFrequency}}<br>
<strong>Billing Day:</strong> {{billingDay}}</p>

{{overtimeClause}}

<h3>3. TIME TRACKING AND SLA</h3>
<p><strong>Time Tracking Required:</strong> {{timeTrackingRequired}}</p>
<p>OpslyHR guarantees an uptime and availability SLA for the managed team. OpslyHR handles all payroll, taxes, and benefits for the team members while the Client directs the day-to-day functional tasks.</p>

<h3>4. PAYMENT TERMS</h3>
<p>Invoices are due within 15 days of receipt. Late payments may incur a 1.5% monthly interest charge.</p>

<h3>5. RESOURCE CONTINUITY AND REPLACEMENT</h3>
<p>OpslyHR guarantees business continuity. If a team member underperforms or resigns, OpslyHR will provision a qualified replacement within 14 business days at no additional recruitment cost to the Client.</p>

<h3>6. INTELLECTUAL PROPERTY AND SECURITY</h3>
<p>All work produced by the Managed Team is the exclusive property of the Client. The team will adhere to the Client''s cybersecurity and data protection protocols.</p>

<p><em>By signing this agreement, Client acknowledges and accepts these terms.</em></p>',
    true,
    1
);

-- Talent Contract
INSERT INTO public.agreement_templates (user_type, service_model, clause_name, clause_body, is_default, version_number)
VALUES (
    'talent',
    'managed_teams',
    'OpslyHR Managed Teams Contract Agreement',
    '<h2>MANAGED TEAMS CONTRACTOR AGREEMENT</h2>
<p>This Agreement is between <strong>{{talentName}}</strong> (ID: {{talentId}}) ("Team Member") and <strong>OpslyHR</strong> ("Company") for managed team services provided to <strong>{{clientCompany}}</strong> ("Client").</p>

<h3>1. ENGAGEMENT TERMS</h3>
<p><strong>Role:</strong> {{jobTitle}}<br>
<strong>Start Date:</strong> {{startDate}}<br>
<strong>Duration:</strong> {{duration}}<br>
<strong>Working Arrangement:</strong> {{workingArrangement}}<br>
<strong>Expected Hours:</strong> {{expectedWeeklyHours}} hours/week</p>

<h3>2. COMPENSATION</h3>
<p><strong>Net Rate:</strong> {{currencySymbol}}{{talentRate}}/{{compensationType}}<br>
<strong>Payment Frequency:</strong> {{paymentFrequency}}<br>
<strong>Payday:</strong> {{payday}}</p>

{{overtimeClause}}

<h3>3. TIME TRACKING AND AVAILABILITY</h3>
<p><strong>Time Tracking Required:</strong> {{timeTrackingRequired}}</p>
<p>You are expected to maintain availability and perform duties for the expected weekly hours. You must submit accurate timesheets to maintain SLA compliance.</p>

<h3>4. PERFORMANCE AND CONDUCT</h3>
<p>You will take functional direction from the Client while remaining under the HR management of OpslyHR. You must adhere strictly to the Client''s operational guidelines and code of conduct.</p>

<h3>5. INTELLECTUAL PROPERTY</h3>
<p>You acknowledge that all work product created during the engagement are "works made for hire" and are the sole property of the Client. You waive all rights to such intellectual property.</p>

<h3>6. CONFIDENTIALITY</h3>
<p>You agree to strictly adhere to all data security, privacy, and confidentiality policies. Any breach is grounds for immediate termination.</p>

<p><em>By signing this agreement, you acknowledge and accept these terms.</em></p>',
    true,
    1
);
