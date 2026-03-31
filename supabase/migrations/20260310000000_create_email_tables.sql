-- Email Templates Table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Email Logs Table (for tracking sent emails)
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    template_key VARCHAR(100) NOT NULL,
    subject TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'bounced', 'complained'
    provider_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add sent_at column to email_logs if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_logs' AND column_name = 'sent_at'
    ) THEN
        ALTER TABLE public.email_logs ADD COLUMN sent_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_templates_status ON public.email_templates(status);
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON public.email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_key ON public.email_logs(template_key);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates (authenticated users can view active templates)
CREATE POLICY "Anyone can view active templates" ON public.email_templates
    FOR SELECT TO authenticated
    USING (status = 'active');

CREATE POLICY "Service role can manage templates" ON public.email_templates
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for email_logs (authenticated users can log emails, service role can manage)
CREATE POLICY "Service role can manage email logs" ON public.email_logs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can insert email logs" ON public.email_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Service role can view email logs" ON public.email_logs
    FOR SELECT TO service_role
    USING (true);

-- Insert default email templates
INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status) VALUES
-- TALENT TEMPLATES
('talent_welcome', 'Talent Welcome Email', 
'Welcome to OPSlyHR - Your Talent ID: {{talent_id}}',
'<html><body><h1>Welcome to OPSlyHR, {{talent_name}}!</h1><p>We''re excited to have you join our platform of top-tier professionals.</p><p><strong>Your Talent ID:</strong> {{talent_id}}</p><h2>Next Steps:</h2><ol><li>Complete your profile</li><li>Get vetted to access exclusive opportunities</li><li>Browse available positions</li></ol><p><a href="{{login_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Login to Your Account</a></p><p>Best regards,<br>The OPSlyHR Team</p></body></html>',
'Welcome to OPSlyHR, {{talent_name}}!

We''re excited to have you join our platform of top-tier professionals.

Your Talent ID: {{talent_id}}

Next Steps:
1. Complete your profile
2. Get vetted to access exclusive opportunities
3. Browse available positions

Login to Your Account: {{login_link}}

Best regards,
The OPSlyHR Team',
'active'),

('talent_offer_received', 'Talent Offer Received',
'New Contract Offer from {{client_name}}',
'<html><body><h1>Congratulations, {{talent_name}}!</h1><p>You''ve received a contract offer for the position of <strong>{{job_title}}</strong> from {{client_name}}.</p><h2>Offer Details:</h2><ul><li><strong>Position:</strong> {{job_title}}</li><li><strong>Client:</strong> {{client_name}}</li><li><strong>Rate:</strong> {{rate}}</li><li><strong>Start Date:</strong> {{start_date}}</li></ul><p><a href="{{offer_link}}" style="background:#28a745;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">View Offer</a></p><p>Best regards,<br>The OPSlyHR Team</p></body></html>',
'Congratulations, {{talent_name}}!

You''ve received a contract offer for the position of {{job_title}} from {{client_name}}.

Offer Details:
- Position: {{job_title}}
- Client: {{client_name}}
- Rate: {{rate}}
- Start Date: {{start_date}}

View Offer: {{offer_link}}

Best regards,
The OPSlyHR Team',
'active'),

('talent_contract_signed', 'Talent Contract Signed Confirmation',
'Contract Signed Successfully - {{contract_id}}',
'<html><body><h1>Contract Signed, {{talent_name}}!</h1><p>Your contract has been signed successfully.</p><p><strong>Contract ID:</strong> {{contract_id}}<br><strong>Start Date:</strong> {{start_date}}</p><p>We''ll notify you once the client signs as well. You can view your contract anytime in your dashboard.</p><p><a href="{{contract_link}}">View Contract</a></p><p>Best regards,<br>The OPSlyHR Team</p></body></html>',
'Contract Signed, {{talent_name}}!

Your contract has been signed successfully.

Contract ID: {{contract_id}}
Start Date: {{start_date}}

We''ll notify you once the client signs as well. You can view your contract anytime in your dashboard.

View Contract: {{contract_link}}

Best regards,
The OPSlyHR Team',
'active'),

-- CLIENT TEMPLATES
('client_welcome', 'Client Welcome Email',
'Welcome to OPSlyHR - Let''s Find Your Perfect Talent',
'<html><body><h1>Welcome to OPSlyHR, {{client_name}}!</h1><p>Thank you for choosing OPSlyHR to build your team with top-tier professionals.</p><p><strong>Company:</strong> {{company_name}}</p><h2>Get Started:</h2><ol><li>Post your first job or hire request</li><li>Review vetted talent profiles</li><li>Schedule interviews with candidates</li></ol><p><a href="{{login_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Access Your Dashboard</a></p><p>Best regards,<br>The OPSlyHR Team</p></body></html>',
'Welcome to OPSlyHR, {{client_name}}!

Thank you for choosing OPSlyHR to build your team with top-tier professionals.

Company: {{company_name}}

Get Started:
1. Post your first job or hire request
2. Review vetted talent profiles
3. Schedule interviews with candidates

Access Your Dashboard: {{login_link}}

Best regards,
The OPSlyHR Team',
'active'),

('client_contract_ready', 'Client Contract Ready for Review',
'Contract Ready for Review - {{talent_name}}',
'<html><body><h1>Hi {{client_name}},</h1><p>Your contract with {{talent_name}} is ready for review and signature.</p><p><strong>Position:</strong> {{job_title}}</p><p>Please review the contract details and sign to proceed.</p><p><a href="{{contract_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Review & Sign Contract</a></p><p>Best regards,<br>The OPSlyHR Team</p></body></html>',
'Hi {{client_name}},

Your contract with {{talent_name}} is ready for review and signature.

Position: {{job_title}}

Please review the contract details and sign to proceed.

Review & Sign Contract: {{contract_link}}

Best regards,
The OPSlyHR Team',
'active'),

('client_invoice_generated', 'Client Invoice Generated',
'New Invoice #{{invoice_id}} - Due {{due_date}}',
'<html><body><h1>New Invoice, {{client_name}}</h1><p>A new invoice has been generated for your account.</p><p><strong>Invoice ID:</strong> {{invoice_id}}<br><strong>Amount:</strong> {{amount}}<br><strong>Due Date:</strong> {{due_date}}</p><p><a href="{{invoice_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">View Invoice</a></p><p>Best regards,<br>The OPSlyHR Team</p></body></html>',
'New Invoice, {{client_name}}

A new invoice has been generated for your account.

Invoice ID: {{invoice_id}}
Amount: {{amount}}
Due Date: {{due_date}}

View Invoice: {{invoice_link}}

Best regards,
The OPSlyHR Team',
'active'),

-- ADMIN TEMPLATES
('admin_contract_fully_signed', 'Admin Contract Fully Signed Notification',
'Contract Fully Signed - {{contract_id}}',
'<html><body><h1>Contract Fully Signed</h1><p>Both parties have signed the contract.</p><p><strong>Contract ID:</strong> {{contract_id}}<br><strong>Client:</strong> {{client_name}}<br><strong>Talent:</strong> {{talent_name}}</p><p><a href="{{contract_link}}">View Contract</a></p></body></html>',
'Contract Fully Signed

Both parties have signed the contract.

Contract ID: {{contract_id}}
Client: {{client_name}}
Talent: {{talent_name}}

View Contract: {{contract_link}}',
'active'),

('admin_invoice_overdue', 'Admin Invoice Overdue Alert',
'ALERT: Invoice Overdue - {{invoice_id}}',
'<html><body><h1 style="color:#dc3545;">Invoice Overdue Alert</h1><p>The following invoice is now overdue:</p><p><strong>Invoice ID:</strong> {{invoice_id}}<br><strong>Client:</strong> {{client_name}}<br><strong>Amount:</strong> {{amount}}<br><strong>Days Overdue:</strong> {{days_overdue}}</p><p>Please follow up with the client.</p><p><a href="{{invoice_link}}">View Invoice</a></p></body></html>',
'INVOICE OVERDUE ALERT

The following invoice is now overdue:

Invoice ID: {{invoice_id}}
Client: {{client_name}}
Amount: {{amount}}
Days Overdue: {{days_overdue}}

Please follow up with the client.

View Invoice: {{invoice_link}}',
'active')
ON CONFLICT DO NOTHING;
