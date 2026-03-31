-- Comprehensive Email Templates Migration
-- Adds all requested Talent and Client trigger templates

INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status) VALUES

-- TALENT: AUTH & ACCOUNT
('talent_auth_account_created', 'Talent: Account Created', 'Welcome to OPSlyHR! Confirm Your Email', 
'<html><body><h1>Welcome to OPSlyHR!</h1><p>Hi {{first_name}}, your account has been created. Please confirm your email to get started.</p><p><a href="{{verification_link}}">Verify Email</a></p></body></html>', 
'Welcome to OPSlyHR! Hi {{first_name}}, your account has been created. Verify here: {{verification_link}}', 'active'),

('talent_auth_verify_required', 'Talent: Email Verification Required', 'Final Step: Verify Your Email', 
'<html><body><h1>Verify Your Email</h1><p>Please click the link below to verify your email address.</p><p><a href="{{verification_link}}">Verify Email</a></p></body></html>', 
'Verify Your Email: {{verification_link}}', 'active'),

('talent_auth_verified_success', 'Talent: Email Verified Successfully', 'Email Verified! Welcome to the Marketplace', 
'<html><body><h1>Success!</h1><p>Your email has been verified. You can now complete your profile.</p><p><a href="{{dashboard_link}}">Go to Dashboard</a></p></body></html>', 
'Your email has been verified. Dashboard: {{dashboard_link}}', 'active'),

('talent_auth_password_reset', 'Talent: Password Reset Link', 'Reset Your OPSlyHR Password', 
'<html><body><h1>Reset Password</h1><p>Click below to reset your password.</p><p><a href="{{reset_link}}">Reset Password</a></p></body></html>', 
'Reset Password: {{reset_link}}', 'active'),

('talent_auth_password_changed', 'Talent: Password Changed Successfully', 'Security Alert: Password Changed', 
'<html><body><h1>Security Alert</h1><p>Your password was recently changed. If this wasn''t you, contact support immediately.</p></body></html>', 
'Security Alert: Your password was recently changed.', 'active'),

-- TALENT: ONBOARDING & PROFILE
('talent_onboarding_welcome', 'Talent: Welcome after Signup', 'Welcome to the OPSlyHR Network!', 
'<html><body><h1>Welcome!</h1><p>We''re excited to have you in our curated network of operations professionals.</p></body></html>', 
'Welcome to the OPSlyHR Network!', 'active'),

-- TALENT: VETTING
('talent_vetting_submitted', 'Talent: Vetting Request Submitted', 'We''ve Received Your Vetting Request', 
'<html><body><h1>Vetting in Progress</h1><p>Hi {{first_name}}, our team is reviewing your profile. We''ll be in touch soon.</p></body></html>', 
'We''ve received your vetting request.', 'active'),

('talent_vetting_changes_requested', 'Talent: Vetting Changes Requested', 'Action Required: Updates Needed for Your Profile', 
'<html><body><h1>Updates Needed</h1><p>Hi {{first_name}}, our team has reviewed your profile and needs a few more details.</p><p><strong>Feedback:</strong> {{feedback}}</p></body></html>', 
'Updates needed for your profile. Feedback: {{feedback}}', 'active'),

('talent_vetting_level_assigned', 'Talent: Level Assigned', 'Your Talent Level Assigned: {{level}}', 
'<html><body><h1>Level Assigned</h1><p>Hi {{first_name}}, you''ve been assigned the level: <strong>{{level}}</strong>.</p></body></html>', 
'Your Talent Level Assigned: {{level}}', 'active'),

('talent_vetting_reverify_flagged', 'Talent: Profile Flagged for Re-verification', 'Action Required: Re-verification Needed', 
'<html><body><h1>Re-verification Needed</h1><p>Please re-verify your profile to maintain access to opportunities.</p></body></html>', 
'Re-verification needed for your profile.', 'active'),

-- TALENT: JOBS & OPPORTUNITIES
('talent_job_recommendation', 'Talent: Job Recommendation Sent', 'New Opportunity Match: {{job_title}}', 
'<html><body><h1>Job Match!</h1><p>We found a role that fits your profile: <strong>{{job_title}}</strong> at {{client_name}}.</p></body></html>', 
'New Job Match: {{job_title}}', 'active'),

('talent_job_published', 'Talent: New Job Published', 'New Position Available: {{job_title}}', 
'<html><body><h1>New Position Open</h1><p>A new role is now live: <strong>{{job_title}}</strong>.</p></body></html>', 
'New Job Live: {{job_title}}', 'active'),

('talent_job_invited_to_apply', 'Talent: Invited to Apply', 'Invitation: Apply for {{job_title}}', 
'<html><body><h1>You''re Invited!</h1><p>The admin has invited you to apply for: <strong>{{job_title}}</strong>.</p></body></html>', 
'Invitation: Apply for {{job_title}}', 'active'),

('talent_job_shortlisted', 'Talent: Shortlisted for Role', 'Good News: You''ve Been Shortlisted for {{job_title}}', 
'<html><body><h1>Shortlisted!</h1><p>The admin has shortlisted you for: <strong>{{job_title}}</strong>.</p></body></html>', 
'Shortlisted! for {{job_title}}', 'active'),

-- TALENT: CLIENT INTERACTIONS
('talent_interaction_interview_requested', 'Talent: Interview Requested', 'Interview Request: {{client_name}}', 
'<html><body><h1>Interview Request</h1><p>{{client_name}} would like to interview you for the {{job_title}} role.</p></body></html>', 
'Interview Request: {{client_name}} wants to interview you for {{job_title}}.', 'active'),

-- TALENT: APPLICATIONS
('talent_application_shortlisted', 'Talent: Application Shortlisted', 'Good News: Application Update for {{job_title}}', 
'<html><body><h1>Shortlisted!</h1><p>Your application for {{job_title}} has been shortlisted.</p></body></html>', 
'Shortlisted! Your application for {{job_title}} has been shortlisted.', 'active'),

('talent_application_rejected', 'Talent: Application Rejected', 'Update on Your Application: {{job_title}}', 
'<html><body><h1>Application Update</h1><p>Thank you for your interest in {{job_title}}. Unfortunately, the client has decided to move forward with other candidates.</p></body></html>', 
'Update on Your Application: {{job_title}}', 'active'),

-- TALENT: CONTRACTS
('talent_contract_received', 'Talent: Contract Received for Review', 'New Contract Ready for Review: {{contract_id}}', 
'<html><body><h1>Contract Ready</h1><p>Please review your new contract: {{contract_id}}.</p></body></html>', 
'New Contract for Review: {{contract_id}}', 'active'),

('talent_contract_accepted', 'Talent: Contract Accepted', 'Confirmation: Contract Accepted', 
'<html><body><h1>Contract Accepted</h1><p>You have accepted contract {{contract_id}}.</p></body></html>', 
'Contract Accepted: {{contract_id}}', 'active'),

('talent_contract_rejected', 'Talent: Contract Rejected', 'Confirmation: Contract Rejected', 
'<html><body><h1>Contract Rejected</h1><p>You have rejected contract {{contract_id}}.</p></body></html>', 
'Contract Rejected: {{contract_id}}', 'active'),

('talent_contract_fully_signed', 'Talent: Contract Fully Signed', 'All Set! Contract Fully Signed: {{contract_id}}', 
'<html><body><h1>Fully Signed!</h1><p>Contract {{contract_id}} is now fully signed by all parties.</p></body></html>', 
'Contract Fully Signed: {{contract_id}}', 'active'),

('talent_contract_updated', 'Talent: Contract Updated', 'Notification: Contract {{contract_id}} Updated', 
'<html><body><h1>Contract Updated</h1><p>Changes have been made to contract {{contract_id}}.</p></body></html>', 
'Contract Updated: {{contract_id}}', 'active'),

('talent_contract_terminated', 'Talent: Contract Terminated', 'Notification: {{contract_id}} Terminated', 
'<html><body><h1>Contract Terminated</h1><p>Contract {{contract_id}} has been terminated effective {{effective_date}}.</p></body></html>', 
'Contract Terminated: {{contract_id}}', 'active'),

('talent_contract_expiring', 'Talent: Contract Nearing Expiration', 'Reminder: Contract {{contract_id}} Nearing Expiry', 
'<html><body><h1>Contract Expiring</h1><p>Your contract {{contract_id}} expires on {{expiration_date}}.</p></body></html>', 
'Contract Expiring: {{contract_id}}', 'active'),

-- TALENT: TIMESHEETS
('talent_timesheet_reminder', 'Talent: Timesheet Reminder', 'Action Required: Submit Your Timesheet', 
'<html><body><h1>Timesheet Reminder</h1><p>Please submit your timesheet for the period ending {{period_end}}.</p></body></html>', 
'Timesheet Reminder: Submit your timesheet for {{period_end}}.', 'active'),

('talent_timesheet_confirmed', 'Talent: Timesheet Submitted Confirmation', 'Confirmation: Timesheet Submitted', 
'<html><body><h1>Timesheet Submitted</h1><p>Your timesheet for {{period_end}} has been received.</p></body></html>', 
'Timesheet Submitted: {{period_end}}', 'active'),

('talent_timesheet_approved', 'Talent: Timesheet Approved', 'Great News: Your Timesheet was Approved', 
'<html><body><h1>Timesheet Approved</h1><p>Your timesheet for {{period_end}} has been approved.</p></body></html>', 
'Timesheet Approved: {{period_end}}', 'active'),

('talent_timesheet_rejected', 'Talent: Timesheet Rejected', 'Action Required: Timesheet Rejected', 
'<html><body><h1>Timesheet Rejected</h1><p>Your timesheet for {{period_end}} was rejected. Reason: {{reason}}</p></body></html>', 
'Timesheet Rejected: {{period_end}}. Reason: {{reason}}', 'active'),

-- TALENT: PAYMENTS & EARNINGS
('talent_payment_processed', 'Talent: Payment Processed', 'Good News: Your Payment is Processing', 
'<html><body><h1>Payment Processing</h1><p>A payment of {{amount}} is being processed for {{invoice_id}}.</p></body></html>', 
'Payment Processing: {{amount}} for {{invoice_id}}.', 'active'),

('talent_payment_sent', 'Talent: Payment Sent', 'Money is on the way! Payment Sent', 
'<html><body><h1>Payment Sent</h1><p>{{amount}} has been sent to your account.</p></body></html>', 
'Payment Sent: {{amount}}', 'active'),

('talent_payment_failed', 'Talent: Payment Failed', 'Action Required: Payment Failed', 
'<html><body><h1>Payment Failed</h1><p>We were unable to process your payment. Please check your bank details.</p></body></html>', 
'Payment Failed. Please check bank details.', 'active'),

('talent_earnings_summary', 'Talent: Earnings Summary', 'Your Monthly Earnings Summary: {{month}}', 
'<html><body><h1>Earnings Summary</h1><p>In {{month}}, you earned a total of {{total_earnings}}.</p></body></html>', 
'Monthly Earnings Summary: {{total_earnings}} in {{month}}.', 'active'),

-- TALENT: MESSAGING
('talent_messaging_new', 'Talent: New Message Received', 'New Message from {{sender_name}}', 
'<html><body><h1>New Message</h1><p>You have a new message from {{sender_name}}.</p><p><a href="{{chat_link}}">View Message</a></p></body></html>', 
'New Message from {{sender_name}}: {{chat_link}}', 'active'),

('talent_messaging_inactivity', 'Talent: Conversation Inactivity Reminder', 'Still there? You have unread messages', 
'<html><body><h1>Unread Messages</h1><p>You have unread messages in your inbox.</p></body></html>', 
'Unread Messages Reminder.', 'active'),

-- TALENT: SUPPORT & DISPUTES
('talent_support_created', 'Talent: Support Ticket Created', 'Support Ticket Created: #{{ticket_id}}', 
'<html><body><h1>Ticket Created</h1><p>Your support ticket #{{ticket_id}} has been created.</p></body></html>', 
'Support Ticket Created: #{{ticket_id}}', 'active'),

('talent_support_response', 'Talent: Support Ticket Response Received', 'Update on Ticket #{{ticket_id}}', 
'<html><body><h1>New Response</h1><p>There is a new response on your support ticket #{{ticket_id}}.</p></body></html>', 
'New Response on Ticket #{{ticket_id}}', 'active'),

('talent_support_resolved', 'Talent: Support Ticket Resolved', 'Support Ticket Resolved: #{{ticket_id}}', 
'<html><body><h1>Ticket Resolved</h1><p>Your support ticket #{{ticket_id}} has been marked as resolved.</p></body></html>', 
'Support Ticket Resolved: #{{ticket_id}}', 'active'),

-- TALENT: SYSTEM & ENGAGEMENT
('talent_system_insights', 'Talent: Profile Performance Insights', 'Your Weekly Profile Insights', 
'<html><body><h1>Profile Insights</h1><p>Your profile was viewed {{views}} times this week.</p></body></html>', 
'Weekly Profile Insights: {{views}} views.', 'active'),

('talent_system_profile_viewed', 'Talent: Profile Viewed by Client', 'A Client Just Viewed Your Profile!', 
'<html><body><h1>Profile Viewed!</h1><p>Exciting news: A client just viewed your profile.</p></body></html>', 
'A Client Just Viewed Your Profile!', 'active'),

('talent_system_inactivity', 'Talent: Inactivity Reminder', 'We Miss You! Catch up on the Marketplace', 
'<html><body><h1>Long Time No See</h1><p>Check out the latest opportunities on OPSlyHR.</p></body></html>', 
'We Miss You! Catch up on the marketplace.', 'active'),

('talent_system_announcement', 'Talent: New Feature Announcement', 'Introducing New Features on OPSlyHR', 
'<html><body><h1>New Features!</h1><p>We''ve launched some exciting new capabilities to help your career.</p></body></html>', 
'New Feature Announcement!', 'active'),

-- CLIENT: AUTH & ACCOUNT
('client_auth_account_created', 'Client: Account Created', 'Welcome to OPSlyHR! Confirm Your Workspace', 
'<html><body><h1>Welcome!</h1><p>Hi {{first_name}}, your client account has been created.</p></body></html>', 
'Welcome to OPSlyHR!', 'active'),

('client_auth_verify_required', 'Client: Email Verification Required', 'Final Step: Verify Your Client Workspace', 
'<html><body><h1>Verify Your Email</h1><p>Please click the link below to verify your email address.</p><p><a href="{{verification_link}}">Verify Email</a></p></body></html>', 
'Verify Your Email: {{verification_link}}', 'active'),

('client_auth_verified_success', 'Client: Email Verified Successfully', 'Workspace Verified! Start Hiring on OPSlyHR', 
'<html><body><h1>Success!</h1><p>Your workspace has been verified. You can now start hiring.</p><p><a href="{{dashboard_link}}">Go to Dashboard</a></p></body></html>', 
'Your workspace has been verified. Dashboard: {{dashboard_link}}', 'active'),

('client_auth_password_reset', 'Client: Password Reset Requested', 'Reset Your OPSlyHR Client Password', 
'<html><body><h1>Reset Password</h1><p>Click below to reset your password.</p><p><a href="{{reset_link}}">Reset Password</a></p></body></html>', 
'Reset Password: {{reset_link}}', 'active'),

('client_auth_password_changed', 'Client: Password Changed Successfully', 'Security Alert: Client Portal Password Changed', 
'<html><body><h1>Security Alert</h1><p>Your password was recently changed. If this wasn''t you, contact support immediately.</p></body></html>', 
'Security Alert: Your password was recently changed.', 'active'),

-- CLIENT: ONBOARDING
('client_onboarding_welcome', 'Client: Welcome after Signup', 'Unlock Top Talent: Welcome to OPSlyHR', 
'<html><body><h1>Welcome!</h1><p>Find the best operations talent globally.</p></body></html>', 
'Welcome to OPSlyHR!', 'active'),

-- CLIENT: TALENT DISCOVERY
('client_talent_shortlisted', 'Client: Talent Shortlisted by Admin', 'New Shortlist Ready for Your Review', 
'<html><body><h1>Shortlist Ready</h1><p>Admin has prepared a new shortlist for role: {{job_title}}.</p></body></html>', 
'New Shortlist Ready for {{job_title}}.', 'active'),

('client_talent_interview_requested_conf', 'Client: Interview Request Sent Confirmation', 'Confirmation: Interview Request Sent', 
'<html><body><h1>Request Sent</h1><p>Your interview request for {{talent_name}} has been sent.</p></body></html>', 
'Interview Request Sent: {{talent_name}}', 'active'),

('client_talent_message_sent_conf', 'Client: Message Sent Confirmation', 'Confirmation: Message Sent to {{talent_name}}', 
'<html><body><h1>Message Sent</h1><p>Your message to {{talent_name}} was delivered.</p></body></html>', 
'Message Sent to {{talent_name}}', 'active'),

('client_talent_interview_accepted', 'Client: Talent Accepted Interview', 'Interview Confirmed: {{talent_name}}', 
'<html><body><h1>Interview Confirmed</h1><p>{{talent_name}} has accepted your interview request.</p></body></html>', 
'Interview Confirmed: {{talent_name}}', 'active'),

('client_talent_interview_declined', 'Client: Talent Declined Interview', 'Interview Declined: {{talent_name}}', 
'<html><body><h1>Interview Declined</h1><p>Unfortunately, {{talent_name}} has declined the interview request.</p></body></html>', 
'Interview Declined: {{talent_name}}', 'active'),

-- CLIENT: JOB POSTING
('client_job_submitted', 'Client: Job Submitted for Approval', 'We''ve Received Your Job Posting: {{job_title}}', 
'<html><body><h1>Job Received</h1><p>Your job post for {{job_title}} is being reviewed by our team.</p></body></html>', 
'Job Received: {{job_title}}', 'active'),

('client_job_live', 'Client: Job Approved and Live', 'Your Job Posting is Now Live!', 
'<html><body><h1>Job Live</h1><p>Your job {{job_title}} is now live and accepting applications.</p></body></html>', 
'Job Live: {{job_title}}', 'active'),

('client_job_rejected', 'Client: Job Rejected with Feedback', 'Action Required: Your Job Post Needs Updates', 
'<html><body><h1>Updates Needed</h1><p>Your job post for {{job_title}} needs some revisions. Reason: {{feedback}}</p></body></html>', 
'Job Rejected: {{job_title}}. Feedback: {{feedback}}', 'active'),

-- CLIENT: APPLICATIONS
('client_application_shortlist_received', 'Client: New Shortlist Received', 'New Shortlist Available for {{job_title}}', 
'<html><body><h1>Shortlist Ready</h1><p>A new candidate shortlist is ready for your review.</p></body></html>', 
'New Shortlist Ready for {{job_title}}', 'active'),

-- CLIENT: CONTRACTS
('client_contract_created', 'Client: Contract Created', 'New Contract Created: {{contract_id}}', 
'<html><body><h1>Contract Created</h1><p>A new contract #{{contract_id}} has been created for {{talent_name}}.</p></body></html>', 
'Contract Created: #{{contract_id}} for {{talent_name}}.', 'active'),

('client_contract_sent', 'Client: Contract Sent to Talent', 'Contract Sent to {{talent_name}}', 
'<html><body><h1>Contract Sent</h1><p>Contract {{contract_id}} has been sent to {{talent_name}} for review.</p></body></html>', 
'Contract Sent: {{contract_id}} to {{talent_name}}.', 'active'),

('client_contract_accepted_tal', 'Client: Contract Accepted by Talent', 'Success! {{talent_name}} Accepted the Contract', 
'<html><body><h1>Contract Accepted</h1><p>{{talent_name}} has accepted contract {{contract_id}}.</p></body></html>', 
'Contract Accepted: {{contract_id}} by {{talent_name}}.', 'active'),

('client_contract_rejected_tal', 'Client: Contract Rejected by Talent', 'Attention: {{talent_name}} Rejected the Contract', 
'<html><body><h1>Contract Rejected</h1><p>{{talent_name}} has rejected contract {{contract_id}}.</p></body></html>', 
'Contract Rejected: {{contract_id}} by {{talent_name}}.', 'active'),

-- CLIENT: TIMESHEETS
('client_timesheet_submitted', 'Client: Timesheet Submitted by Talent', 'New Timesheet for Review: {{talent_name}}', 
'<html><body><h1>Timesheet Received</h1><p>{{talent_name}} has submitted a timesheet for {{period_end}}.</p></body></html>', 
'Timesheet Submitted: {{talent_name}} for {{period_end}}', 'active'),

-- CLIENT: PAYMENTS & BILLING
('client_billing_invoice', 'Client: Invoice Generated', 'New Invoice Generated: #{{invoice_id}}', 
'<html><body><h1>New Invoice</h1><p>Your invoice #{{invoice_id}} for {{amount}} is ready.</p></body></html>', 
'New Invoice: #{{invoice_id}} for {{amount}}.', 'active'),

('client_billing_reminder', 'Client: Invoice Due Reminder', 'Friendly Reminder: Invoice #{{invoice_id}} Due Soon', 
'<html><body><h1>Invoice Reminder</h1><p>Your invoice #{{invoice_id}} for {{amount}} is due on {{due_date}}.</p></body></html>', 
'Invoice Reminder: #{{invoice_id}} due {{due_date}}.', 'active'),

('client_billing_success', 'Client: Payment Successful', 'Confirmation: Payment Received Successfully', 
'<html><body><h1>Payment Success!</h1><p>Thank you. Your payment for #{{invoice_id}} was successful.</p></body></html>', 
'Payment Successful for #{{invoice_id}}', 'active'),

('client_billing_failed', 'Client: Payment Failed', 'Action Required: Payment for #{{invoice_id}} Failed', 
'<html><body><h1>Payment Failed</h1><p>We were unable to charge your account for invoice #{{invoice_id}}.</p></body></html>', 
'Payment Failed for #{{invoice_id}}', 'active'),

-- CLIENT: MESSAGING
('client_messaging_new', 'Client: New Message Received', 'New Message regarding {{job_title}}', 
'<html><body><h1>New Message</h1><p>You have a new message from {{sender_name}}.</p></body></html>', 
'New Message from {{sender_name}} regarding {{job_title}}.', 'active'),

-- CLIENT: SUPPORT & DISPUTES
('client_support_created', 'Client: Support Ticket Created', 'Support Ticket Created: #{{ticket_id}}', 
'<html><body><h1>Ticket Created</h1><p>Your support ticket #{{ticket_id}} has been created.</p></body></html>', 
'Support Ticket Created: #{{ticket_id}}', 'active'),

('client_support_response', 'Client: Support Ticket Response Received', 'Update on Ticket #{{ticket_id}}', 
'<html><body><h1>New Response</h1><p>There is a new response on your support ticket #{{ticket_id}}.</p></body></html>', 
'New Response on Ticket #{{ticket_id}}', 'active'),

('client_support_resolved', 'Client: Support Ticket Resolved', 'Support Ticket Resolved: #{{ticket_id}}', 
'<html><body><h1>Ticket Resolved</h1><p>Your support ticket #{{ticket_id}} has been marked as resolved.</p></body></html>', 
'Support Ticket Resolved: #{{ticket_id}}', 'active'),

('client_support_dispute_raised', 'Client: Dispute Raised', 'Notification: Dispute Raised for #{{contract_id}}', 
'<html><body><h1>Dispute Raised</h1><p>A dispute has been raised regarding contract {{contract_id}}.</p></body></html>', 
'Dispute Raised: {{contract_id}}', 'active')

ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text;
