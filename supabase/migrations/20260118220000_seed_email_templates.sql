-- Complete Email Templates Seed Data
-- All 39 email templates for Talent, Client, and Admin portals

-- Clear existing templates if re-running
DELETE FROM email_templates;

-- ============================================
-- TALENT PORTAL TEMPLATES (16)
-- ============================================

-- 1. Welcome Email
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('talent_welcome', 'Talent Welcome Email', 
'Welcome to Taskive - Your Talent ID: {{talent_id}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1 style="color:#0066cc;">Welcome to Taskive, {{talent_name}}!</h1><p>We''re excited to have you join our platform of top-tier professionals.</p><p><strong>Your Talent ID:</strong> {{talent_id}}</p><h2>Next Steps:</h2><ol><li>Complete your profile</li><li>Get vetted to access exclusive opportunities</li><li>Browse available positions</li></ol><p><a href="{{login_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:20px 0;">Login to Your Account</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Welcome to Taskive, {{talent_name}}!

We''re excited to have you join our platform of top-tier professionals.

Your Talent ID: {{talent_id}}

Next Steps:
1. Complete your profile
2. Get vetted to access exclusive opportunities
3. Browse available positions

Login: {{login_link}}

Best regards,
The Taskive Team',
'["talent_name", "talent_id", "login_link"]'::jsonb);

-- 2. Vetting Started
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('talent_vetting_started', 'Vetting Process Started',
'Your Vetting Process Has Started',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{talent_name}},</h1><p>You''ve successfully started the vetting process!</p><p>Please complete all required sections to submit your application for review.</p><p><a href="{{vetting_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:20px 0;">Continue Vetting</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{talent_name}},

You''ve successfully started the vetting process!

Please complete all required sections to submit your application for review.

Continue: {{vetting_link}}

Best regards,
The Taskive Team',
'["talent_name", "vetting_link"]'::jsonb);

-- 3. Vetting Submitted
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('talent_vetting_submitted', 'Vetting Submitted',
'Vetting Application Submitted Successfully',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Thank you, {{talent_name}}!</h1><p>Your vetting application has been submitted on {{submission_date}}.</p><p>Our team will review your application and get back to you within 2-3 business days.</p><p>Best regards,<br>The Taskive Team</p></div>',
'Thank you, {{talent_name}}!

Your vetting application has been submitted on {{submission_date}}.

Our team will review your application and get back to you within 2-3 business days.

Best regards,
The Taskive Team',
'["talent_name", "submission_date"]'::jsonb);

-- 4. Vetting Approved
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('talent_vetting_approved', 'Vetting Approved',
'Congratulations! You''re Now a Vetted Talent',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1 style="color:#28a745;">Congratulations, {{talent_name}}!</h1><p>Your vetting application has been approved on {{approval_date}}.</p><p>You now have access to exclusive job opportunities from top clients.</p><p><a href="{{jobs_link}}" style="background:#28a745;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:20px 0;">Browse Jobs</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Congratulations, {{talent_name}}!

Your vetting application has been approved on {{approval_date}}.

You now have access to exclusive job opportunities from top clients.

Browse Jobs: {{jobs_link}}

Best regards,
The Taskive Team',
'["talent_name", "approval_date", "jobs_link"]'::jsonb);

-- 5. Vetting Rejected
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('talent_vetting_rejected', 'Vetting Not Approved',
'Vetting Application Update',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{talent_name}},</h1><p>Thank you for your interest in joining Taskive.</p><p>Unfortunately, we''re unable to approve your vetting application at this time.</p><p><strong>Reasons:</strong></p><p>{{reasons}}</p><p>You''re welcome to resubmit your application after addressing the feedback above.</p><p><a href="{{resubmit_link}}" style="color:#0066cc;">Resubmit Application</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{talent_name}},

Thank you for your interest in joining Taskive.

Unfortunately, we''re unable to approve your vetting application at this time.

Reasons:
{{reasons}}

You''re welcome to resubmit your application after addressing the feedback above.

Resubmit: {{resubmit_link}}

Best regards,
The Taskive Team',
'["talent_name", "reasons", "resubmit_link"]'::jsonb);

-- 6. Profile Updated
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('talent_profile_updated', 'Profile Updated',
'Your Profile Has Been Updated',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{talent_name}},</h1><p>Your profile has been successfully updated.</p><p><strong>Changes made:</strong></p><p>{{changes}}</p><p><a href="{{profile_link}}" style="color:#0066cc;">View Profile</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{talent_name}},

Your profile has been successfully updated.

Changes made:
{{changes}}

View Profile: {{profile_link}}

Best regards,
The Taskive Team',
'["talent_name", "changes", "profile_link"]'::jsonb);

-- 7. Shortlisted for Job
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('talent_shortlisted', 'Shortlisted for Position',
'You''ve Been Shortlisted for {{job_title}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Great news, {{talent_name}}!</h1><p>You''ve been shortlisted for the position of <strong>{{job_title}}</strong> at {{client_name}}.</p><p>The client will review your profile and may reach out for an interview.</p><p>Best regards,<br>The Taskive Team</p></div>',
'Great news, {{talent_name}}!

You''ve been shortlisted for the position of {{job_title}} at {{client_name}}.

The client will review your profile and may reach out for an interview.

Best regards,
The Taskive Team',
'["talent_name", "job_title", "client_name"]'::jsonb);

-- 8. Interview Request
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('talent_interview_request', 'Interview Request',
'Interview Request for {{job_title}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Interview Request, {{talent_name}}!</h1><p>{{client_name}} would like to interview you for the position of <strong>{{job_title}}</strong>.</p><p><strong>Interview Details:</strong></p><p>{{interview_details}}</p><p><a href="{{interview_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:20px 0;">View Details</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Interview Request, {{talent_name}}!

{{client_name}} would like to interview you for the position of {{job_title}}.

Interview Details:
{{interview_details}}

View Details: {{interview_link}}

Best regards,
The Taskive Team',
'["talent_name", "job_title", "client_name", "interview_details", "interview_link"]'::jsonb);

-- 9. Offer Received
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('talent_offer_received', 'Contract Offer Received',
'New Contract Offer from {{client_name}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1 style="color:#28a745;">Congratulations, {{talent_name}}!</h1><p>You''ve received a contract offer for <strong>{{job_title}}</strong> from {{client_name}}.</p><h3>Offer Details:</h3><ul><li><strong>Position:</strong> {{job_title}}</li><li><strong>Client:</strong> {{client_name}}</li><li><strong>Rate:</strong> {{rate}}</li><li><strong>Start Date:</strong> {{start_date}}</li></ul><p><a href="{{offer_link}}" style="background:#28a745;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:20px 0;">View Offer</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Congratulations, {{talent_name}}!

You''ve received a contract offer for {{job_title}} from {{client_name}}.

Offer Details:
- Position: {{job_title}}
- Client: {{client_name}}
- Rate: {{rate}}
- Start Date: {{start_date}}

View Offer: {{offer_link}}

Best regards,
The Taskive Team',
'["talent_name", "job_title", "client_name", "rate", "start_date", "offer_link"]'::jsonb);

-- 10. Contract Signed Confirmation
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('talent_contract_signed', 'Contract Signed',
'Contract Signed Successfully - {{contract_id}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Contract Signed, {{talent_name}}!</h1><p>Your contract has been signed successfully.</p><p><strong>Contract ID:</strong> {{contract_id}}<br><strong>Start Date:</strong> {{start_date}}</p><p>We''ll notify you once the client signs as well.</p><p><a href="{{contract_link}}" style="color:#0066cc;">View Contract</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Contract Signed, {{talent_name}}!

Your contract has been signed successfully.

Contract ID: {{contract_id}}
Start Date: {{start_date}}

We''ll notify you once the client signs as well.

View Contract: {{contract_link}}

Best regards,
The Taskive Team',
'["talent_name", "contract_id", "start_date", "contract_link"]'::jsonb);

-- 11. Contract Pending Reminder
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('talent_contract_reminder', 'Contract Pending Signature',
'Reminder: Contract Awaiting Your Signature',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{talent_name}},</h1><p>You have a contract awaiting your signature.</p><p>Please review and sign the contract to proceed.</p><p><a href="{{contract_link}}" style="background:#ffc107;color:#000;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:20px 0;">Sign Contract</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{talent_name}},

You have a contract awaiting your signature.

Please review and sign the contract to proceed.

Sign Contract: {{contract_link}}

Best regards,
The Taskive Team',
'["talent_name", "contract_link"]'::jsonb);

-- 12-16. Timesheet & Payment Templates
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('talent_timesheet_approved', 'Timesheet Approved',
'Timesheet Approved - {{period}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Timesheet Approved, {{talent_name}}!</h1><p>Your timesheet for {{period}} has been approved.</p><p><strong>Hours:</strong> {{hours}}</p><p>Payment will be processed according to the contract terms.</p><p>Best regards,<br>The Taskive Team</p></div>',
'Timesheet Approved, {{talent_name}}!

Your timesheet for {{period}} has been approved.

Hours: {{hours}}

Payment will be processed according to the contract terms.

Best regards,
The Taskive Team',
'["talent_name", "period", "hours"]'::jsonb),

('talent_timesheet_rejected', 'Timesheet Rejected',
'Timesheet Rejected - {{period}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{talent_name}},</h1><p>Your timesheet for {{period}} has been rejected.</p><p><strong>Reason:</strong> {{reason}}</p><p>Please resubmit with corrections.</p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{talent_name}},

Your timesheet for {{period}} has been rejected.

Reason: {{reason}}

Please resubmit with corrections.

Best regards,
The Taskive Team',
'["talent_name", "period", "reason"]'::jsonb),

('talent_payment_paid', 'Payment Processed',
'Payment Processed - {{amount}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Payment Processed, {{talent_name}}!</h1><p>Your payment has been processed.</p><p><strong>Amount:</strong> {{amount}}<br><strong>Date:</strong> {{date}}</p><p>Best regards,<br>The Taskive Team</p></div>',
'Payment Processed, {{talent_name}}!

Your payment has been processed.

Amount: {{amount}}
Date: {{date}}

Best regards,
The Taskive Team',
'["talent_name", "amount", "date"]'::jsonb),

('talent_payment_upcoming', 'Payment Upcoming',
'Payment Due in 3 Days - {{amount}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{talent_name}},</h1><p>Your payment is scheduled for {{due_date}}.</p><p><strong>Amount:</strong> {{amount}}</p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{talent_name}},

Your payment is scheduled for {{due_date}}.

Amount: {{amount}}

Best regards,
The Taskive Team',
'["talent_name", "amount", "due_date"]'::jsonb),

('talent_payment_dispute', 'Payment Adjustment',
'Payment Amount Adjusted',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{talent_name}},</h1><p>Your payment amount has been adjusted.</p><p><strong>Original:</strong> {{original_amount}}<br><strong>New Amount:</strong> {{new_amount}}<br><strong>Reason:</strong> {{reason}}</p><p>If you have questions, please contact support.</p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{talent_name}},

Your payment amount has been adjusted.

Original: {{original_amount}}
New Amount: {{new_amount}}
Reason: {{reason}}

If you have questions, please contact support.

Best regards,
The Taskive Team',
'["talent_name", "original_amount", "new_amount", "reason"]'::jsonb);

-- ============================================
-- CLIENT PORTAL TEMPLATES (13)
-- ============================================

INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('client_welcome', 'Client Welcome',
'Welcome to Taskive - Let''s Find Your Perfect Talent',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1 style="color:#0066cc;">Welcome to Taskive, {{client_name}}!</h1><p>Thank you for choosing Taskive to build your team with top-tier professionals.</p><p><strong>Company:</strong> {{company_name}}</p><h2>Get Started:</h2><ol><li>Post your first job or hire request</li><li>Review vetted talent profiles</li><li>Schedule interviews with candidates</li></ol><p><a href="{{login_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:20px 0;">Access Your Dashboard</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Welcome to Taskive, {{client_name}}!

Thank you for choosing Taskive to build your team with top-tier professionals.

Company: {{company_name}}

Get Started:
1. Post your first job or hire request
2. Review vetted talent profiles
3. Schedule interviews with candidates

Access Dashboard: {{login_link}}

Best regards,
The Taskive Team',
'["client_name", "company_name", "login_link"]'::jsonb),

('client_hire_submitted', 'Hire Request Submitted',
'Hire Request Submitted - {{request_id}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{client_name}},</h1><p>Your hire request has been submitted successfully.</p><p><strong>Request ID:</strong> {{request_id}}</p><p>Our team will review and match you with qualified talent.</p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{client_name}},

Your hire request has been submitted successfully.

Request ID: {{request_id}}

Our team will review and match you with qualified talent.

Best regards,
The Taskive Team',
'["client_name", "request_id"]'::jsonb),

('client_interview_sent', 'Interview Request Sent',
'Interview Request Sent to {{talent_name}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{client_name}},</h1><p>Your interview request has been sent to {{talent_name}} for the position of {{job_title}}.</p><p>We''ll notify you when they respond.</p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{client_name}},

Your interview request has been sent to {{talent_name}} for the position of {{job_title}}.

We''ll notify you when they respond.

Best regards,
The Taskive Team',
'["client_name", "talent_name", "job_title"]'::jsonb),

('client_contract_ready', 'Contract Ready',
'Contract Ready for Review - {{talent_name}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{client_name}},</h1><p>Your contract with {{talent_name}} is ready for review and signature.</p><p><strong>Position:</strong> {{job_title}}</p><p><a href="{{contract_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:20px 0;">Review & Sign Contract</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{client_name}},

Your contract with {{talent_name}} is ready for review and signature.

Position: {{job_title}}

Review & Sign: {{contract_link}}

Best regards,
The Taskive Team',
'["client_name", "talent_name", "job_title", "contract_link"]'::jsonb),

('client_contract_signed', 'Contract Signed',
'Contract Signed Successfully - {{contract_id}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Contract Signed, {{client_name}}!</h1><p>Your contract with {{talent_name}} has been signed successfully.</p><p><strong>Contract ID:</strong> {{contract_id}}</p><p>We''ll notify you once the talent signs as well.</p><p><a href="{{contract_link}}" style="color:#0066cc;">View Contract</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Contract Signed, {{client_name}}!

Your contract with {{talent_name}} has been signed successfully.

Contract ID: {{contract_id}}

We''ll notify you once the talent signs as well.

View Contract: {{contract_link}}

Best regards,
The Taskive Team',
'["client_name", "talent_name", "contract_id", "contract_link"]'::jsonb),

('client_contract_reminder', 'Contract Pending',
'Reminder: Contract Awaiting Your Signature',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{client_name}},</h1><p>You have a contract awaiting your signature.</p><p><a href="{{contract_link}}" style="background:#ffc107;color:#000;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:20px 0;">Sign Contract</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{client_name}},

You have a contract awaiting your signature.

Sign Contract: {{contract_link}}

Best regards,
The Taskive Team',
'["client_name", "contract_link"]'::jsonb),

('client_invoice_generated', 'Invoice Generated',
'New Invoice #{{invoice_id}} - Due {{due_date}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>New Invoice, {{client_name}}</h1><p>A new invoice has been generated.</p><p><strong>Invoice ID:</strong> {{invoice_id}}<br><strong>Amount:</strong> {{amount}}<br><strong>Due Date:</strong> {{due_date}}</p><p><a href="{{invoice_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:20px 0;">View Invoice</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'New Invoice, {{client_name}}

Invoice ID: {{invoice_id}}
Amount: {{amount}}
Due Date: {{due_date}}

View Invoice: {{invoice_link}}

Best regards,
The Taskive Team',
'["client_name", "invoice_id", "amount", "due_date", "invoice_link"]'::jsonb),

('client_invoice_due', 'Invoice Due Soon',
'Invoice Due in 3 Days - #{{invoice_id}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{client_name}},</h1><p>Your invoice is due in 3 days.</p><p><strong>Invoice ID:</strong> {{invoice_id}}<br><strong>Amount:</strong> {{amount}}<br><strong>Due Date:</strong> {{due_date}}</p><p><a href="{{invoice_link}}" style="color:#0066cc;">View Invoice</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{client_name}},

Your invoice is due in 3 days.

Invoice ID: {{invoice_id}}
Amount: {{amount}}
Due Date: {{due_date}}

View Invoice: {{invoice_link}}

Best regards,
The Taskive Team',
'["client_name", "invoice_id", "amount", "due_date", "invoice_link"]'::jsonb),

('client_invoice_overdue', 'Invoice Overdue',
'URGENT: Invoice Overdue - #{{invoice_id}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1 style="color:#dc3545;">Invoice Overdue, {{client_name}}</h1><p>Your invoice is now overdue.</p><p><strong>Invoice ID:</strong> {{invoice_id}}<br><strong>Amount:</strong> {{amount}}<br><strong>Days Overdue:</strong> {{days_overdue}}</p><p>Please make payment as soon as possible.</p><p><a href="{{invoice_link}}" style="background:#dc3545;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:20px 0;">Pay Now</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'INVOICE OVERDUE, {{client_name}}

Invoice ID: {{invoice_id}}
Amount: {{amount}}
Days Overdue: {{days_overdue}}

Please make payment as soon as possible.

Pay Now: {{invoice_link}}

Best regards,
The Taskive Team',
'["client_name", "invoice_id", "amount", "days_overdue", "invoice_link"]'::jsonb),

('client_payment_received', 'Payment Received',
'Payment Received - Thank You!',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Thank you, {{client_name}}!</h1><p>We''ve received your payment.</p><p><strong>Amount:</strong> {{amount}}<br><strong>Invoice ID:</strong> {{invoice_id}}</p><p>Best regards,<br>The Taskive Team</p></div>',
'Thank you, {{client_name}}!

We''ve received your payment.

Amount: {{amount}}
Invoice ID: {{invoice_id}}

Best regards,
The Taskive Team',
'["client_name", "amount", "invoice_id"]'::jsonb),

('client_timesheet_approval', 'Timesheet Pending Approval',
'Timesheet Awaiting Approval - {{talent_name}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{client_name}},</h1><p>{{talent_name}} has submitted a timesheet for {{period}}.</p><p>Please review and approve.</p><p><a href="{{timesheet_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:20px 0;">Review Timesheet</a></p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{client_name}},

{{talent_name}} has submitted a timesheet for {{period}}.

Please review and approve.

Review: {{timesheet_link}}

Best regards,
The Taskive Team',
'["client_name", "talent_name", "period", "timesheet_link"]'::jsonb),

('client_trial_end', 'Trial Period Ending',
'Trial Period Ending in 2 Days - {{talent_name}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{client_name}},</h1><p>The trial period for {{talent_name}} ends on {{end_date}}.</p><p>Please confirm if you''d like to continue the contract.</p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{client_name}},

The trial period for {{talent_name}} ends on {{end_date}}.

Please confirm if you''d like to continue the contract.

Best regards,
The Taskive Team',
'["client_name", "talent_name", "end_date"]'::jsonb),

('client_contract_status', 'Contract Status Update',
'Contract Status Changed - {{talent_name}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Hi {{client_name}},</h1><p>The contract with {{talent_name}} has been {{status}}.</p><p>Best regards,<br>The Taskive Team</p></div>',
'Hi {{client_name}},

The contract with {{talent_name}} has been {{status}}.

Best regards,
The Taskive Team',
'["client_name", "talent_name", "status"]'::jsonb);

-- ============================================
-- ADMIN PORTAL TEMPLATES (10)
-- ============================================

INSERT INTO email_templates (template_key, name, subject, body_html, body_text, variables) VALUES
('admin_hire_request', 'Admin: New Hire Request',
'New Hire Request from {{client_name}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>New Hire Request</h1><p><strong>Client:</strong> {{client_name}}<br><strong>Position:</strong> {{job_title}}</p><p><a href="{{request_link}}" style="color:#0066cc;">Review Request</a></p></div>',
'New Hire Request

Client: {{client_name}}
Position: {{job_title}}

Review: {{request_link}}',
'["client_name", "job_title", "request_link"]'::jsonb),

('admin_interview_request', 'Admin: Interview Request',
'New Interview Request',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>New Interview Request</h1><p><strong>Client:</strong> {{client_name}}<br><strong>Talent:</strong> {{talent_name}}<br><strong>Position:</strong> {{job_title}}</p></div>',
'New Interview Request

Client: {{client_name}}
Talent: {{talent_name}}
Position: {{job_title}}',
'["client_name", "talent_name", "job_title"]'::jsonb),

('admin_vetting_submission', 'Admin: Vetting Submission',
'New Vetting Submission from {{talent_name}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>New Vetting Submission</h1><p><strong>Talent:</strong> {{talent_name}}<br><strong>Talent ID:</strong> {{talent_id}}</p><p><a href="{{review_link}}" style="color:#0066cc;">Review Application</a></p></div>',
'New Vetting Submission

Talent: {{talent_name}}
Talent ID: {{talent_id}}

Review: {{review_link}}',
'["talent_name", "talent_id", "review_link"]'::jsonb),

('admin_contract_client_signed', 'Admin: Client Signed',
'Contract Signed by Client - {{contract_id}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Client Signed Contract</h1><p><strong>Client:</strong> {{client_name}}<br><strong>Contract ID:</strong> {{contract_id}}</p></div>',
'Client Signed Contract

Client: {{client_name}}
Contract ID: {{contract_id}}',
'["client_name", "contract_id"]'::jsonb),

('admin_contract_talent_signed', 'Admin: Talent Signed',
'Contract Signed by Talent - {{contract_id}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Talent Signed Contract</h1><p><strong>Talent:</strong> {{talent_name}}<br><strong>Contract ID:</strong> {{contract_id}}</p></div>',
'Talent Signed Contract

Talent: {{talent_name}}
Contract ID: {{contract_id}}',
'["talent_name", "contract_id"]'::jsonb),

('admin_contract_fully_signed', 'Admin: Contract Fully Signed',
'Contract Fully Signed - {{contract_id}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1 style="color:#28a745;">Contract Fully Signed</h1><p><strong>Contract ID:</strong> {{contract_id}}<br><strong>Client:</strong> {{client_name}}<br><strong>Talent:</strong> {{talent_name}}</p><p><a href="{{contract_link}}" style="color:#0066cc;">View Contract</a></p></div>',
'Contract Fully Signed

Contract ID: {{contract_id}}
Client: {{client_name}}
Talent: {{talent_name}}

View: {{contract_link}}',
'["contract_id", "client_name", "talent_name", "contract_link"]'::jsonb),

('admin_invoice_generated', 'Admin: Invoice Generated',
'Invoice Generated - {{invoice_id}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Invoice Generated</h1><p><strong>Invoice ID:</strong> {{invoice_id}}<br><strong>Client:</strong> {{client_name}}<br><strong>Amount:</strong> {{amount}}</p></div>',
'Invoice Generated

Invoice ID: {{invoice_id}}
Client: {{client_name}}
Amount: {{amount}}',
'["invoice_id", "client_name", "amount"]'::jsonb),

('admin_payment_received', 'Admin: Payment Received',
'Payment Received from {{client_name}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1 style="color:#28a745;">Payment Received</h1><p><strong>Client:</strong> {{client_name}}<br><strong>Amount:</strong> {{amount}}<br><strong>Invoice ID:</strong> {{invoice_id}}</p></div>',
'Payment Received

Client: {{client_name}}
Amount: {{amount}}
Invoice ID: {{invoice_id}}',
'["client_name", "amount", "invoice_id"]'::jsonb),

('admin_invoice_overdue', 'Admin: Invoice Overdue',
'ALERT: Invoice Overdue - {{invoice_id}}',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1 style="color:#dc3545;">Invoice Overdue Alert</h1><p><strong>Invoice ID:</strong> {{invoice_id}}<br><strong>Client:</strong> {{client_name}}<br><strong>Amount:</strong> {{amount}}<br><strong>Days Overdue:</strong> {{days_overdue}}</p><p>Please follow up with the client.</p><p><a href="{{invoice_link}}" style="color:#0066cc;">View Invoice</a></p></div>',
'INVOICE OVERDUE ALERT

Invoice ID: {{invoice_id}}
Client: {{client_name}}
Amount: {{amount}}
Days Overdue: {{days_overdue}}

Please follow up with the client.

View: {{invoice_link}}',
'["invoice_id", "client_name", "amount", "days_overdue", "invoice_link"]'::jsonb),

('admin_timesheet_pending', 'Admin: Timesheet Pending',
'Timesheet Pending Approval',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1>Timesheet Pending Approval</h1><p><strong>Talent:</strong> {{talent_name}}<br><strong>Client:</strong> {{client_name}}<br><strong>Period:</strong> {{period}}</p></div>',
'Timesheet Pending Approval

Talent: {{talent_name}}
Client: {{client_name}}
Period: {{period}}',
'["talent_name", "client_name", "period"]'::jsonb);
