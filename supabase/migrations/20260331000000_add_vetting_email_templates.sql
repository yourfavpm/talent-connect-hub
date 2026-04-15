-- Add missing email templates for vetting, contract signing, and payment notifications

INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status) VALUES

-- Talent Vetting Approved
('talent_vetting_approved', 'Talent Vetting Approved',
'Congratulations! Your OPSlyHR Profile is Now Active',
'<html><body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
<div style="text-align: center; margin-bottom: 32px;">
  <img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" style="height: 48px;" />
</div>
<h1 style="color: #059669; font-size: 24px; margin-bottom: 8px;">You''re Approved, {{talent_name}}! 🎉</h1>
<p style="font-size: 16px; line-height: 1.6; color: #374151;">Great news — your profile has been reviewed and approved by our vetting team. You now have full access to the OPSlyHR talent marketplace.</p>
<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <p style="font-size: 14px; color: #166534; margin: 0;"><strong>Approval Date:</strong> {{approval_date}}</p>
</div>
<h2 style="font-size: 18px; color: #111827; margin-top: 32px;">What Happens Next:</h2>
<ol style="font-size: 14px; line-height: 2; color: #374151;">
  <li>Your profile is now <strong>visible to verified clients</strong></li>
  <li>You can browse and apply for available positions</li>
  <li>You''ll receive notifications when matched to opportunities</li>
</ol>
<p style="margin-top: 32px;"><a href="{{jobs_link}}" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px;">Browse Opportunities →</a></p>
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 24px;" />
<p style="font-size: 12px; color: #9ca3af;">Best regards,<br />The OPSlyHR Vetting Team</p>
</body></html>',
'Congratulations, {{talent_name}}!

Great news — your profile has been reviewed and approved by our vetting team. You now have full access to the OPSlyHR talent marketplace.

Approval Date: {{approval_date}}

What Happens Next:
1. Your profile is now visible to verified clients
2. You can browse and apply for available positions
3. You''ll receive notifications when matched to opportunities

Browse Opportunities: {{jobs_link}}

Best regards,
The OPSlyHR Vetting Team',
'active'),

-- Talent Vetting Rejected
('talent_vetting_rejected', 'Talent Vetting Rejected',
'Update on Your OPSlyHR Application',
'<html><body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
<div style="text-align: center; margin-bottom: 32px;">
  <img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" style="height: 48px;" />
</div>
<h1 style="color: #1e293b; font-size: 24px; margin-bottom: 8px;">Hi {{talent_name}},</h1>
<p style="font-size: 16px; line-height: 1.6; color: #374151;">Thank you for your interest in joining the OPSlyHR talent network. After careful review, we were unable to approve your profile at this time.</p>
<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <p style="font-size: 14px; color: #991b1b; margin: 0 0 8px 0;"><strong>Feedback from our team:</strong></p>
  <p style="font-size: 14px; color: #7f1d1d; margin: 0; line-height: 1.6;">{{reasons}}</p>
</div>
<h2 style="font-size: 18px; color: #111827; margin-top: 32px;">Next Steps:</h2>
<ul style="font-size: 14px; line-height: 2; color: #374151;">
  <li>Review the feedback above</li>
  <li>Update your profile to address the noted areas</li>
  <li>Resubmit your application for another review</li>
</ul>
<p style="margin-top: 32px;"><a href="{{resubmit_link}}" style="background: #1e293b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px;">Update & Resubmit →</a></p>
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 24px;" />
<p style="font-size: 12px; color: #9ca3af;">Best regards,<br />The OPSlyHR Vetting Team</p>
</body></html>',
'Hi {{talent_name}},

Thank you for your interest in joining the OPSlyHR talent network. After careful review, we were unable to approve your profile at this time.

Feedback from our team:
{{reasons}}

Next Steps:
- Review the feedback above
- Update your profile to address the noted areas
- Resubmit your application for another review

Update & Resubmit: {{resubmit_link}}

Best regards,
The OPSlyHR Vetting Team',
'active'),

-- Admin Vetting Submission Alert
('admin_vetting_submission', 'Admin Vetting Submission Alert',
'New Vetting Submission: {{talent_name}}',
'<html><body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
<h1 style="color: #1e293b; font-size: 24px;">New Vetting Submission</h1>
<p style="font-size: 16px; line-height: 1.6; color: #374151;">A new talent has submitted their profile for vetting review.</p>
<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <p style="font-size: 14px; color: #334155; margin: 0 0 8px 0;"><strong>Talent:</strong> {{talent_name}}</p>
  <p style="font-size: 14px; color: #334155; margin: 0;"><strong>Talent ID:</strong> {{talent_id}}</p>
</div>
<p><a href="{{review_link}}" style="background: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px;">Review Submission →</a></p>
</body></html>',
'New Vetting Submission

A new talent has submitted their profile for vetting review.

Talent: {{talent_name}}
Talent ID: {{talent_id}}

Review Submission: {{review_link}}',
'active'),

-- Client Contract Signed Confirmation
('client_contract_signed', 'Client Contract Signed Confirmation',
'Contract Signed Successfully - {{contract_id}}',
'<html><body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
<div style="text-align: center; margin-bottom: 32px;">
  <img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" style="height: 48px;" />
</div>
<h1 style="color: #059669; font-size: 24px;">Contract Signed, {{client_name}}! ✓</h1>
<p style="font-size: 16px; line-height: 1.6; color: #374151;">Your contract with <strong>{{talent_name}}</strong> has been signed successfully.</p>
<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <p style="font-size: 14px; color: #166534; margin: 0;"><strong>Contract ID:</strong> {{contract_id}}</p>
</div>
<p style="font-size: 14px; color: #374151;">The talent will be notified and the contract will be activated once both parties have signed.</p>
<p><a href="{{contract_link}}" style="background: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px;">View Contract →</a></p>
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 24px;" />
<p style="font-size: 12px; color: #9ca3af;">Best regards,<br />The OPSlyHR Team</p>
</body></html>',
'Contract Signed, {{client_name}}!

Your contract with {{talent_name}} has been signed successfully.

Contract ID: {{contract_id}}

The talent will be notified and the contract will be activated once both parties have signed.

View Contract: {{contract_link}}

Best regards,
The OPSlyHR Team',
'active'),

-- Client Payment Received
('client_payment_received', 'Client Payment Received Confirmation',
'Payment Received - Invoice #{{invoice_id}}',
'<html><body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
<div style="text-align: center; margin-bottom: 32px;">
  <img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" style="height: 48px;" />
</div>
<h1 style="color: #059669; font-size: 24px;">Payment Received ✓</h1>
<p style="font-size: 16px; line-height: 1.6; color: #374151;">Hi {{client_name}}, we''ve received your payment.</p>
<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <p style="font-size: 14px; color: #166534; margin: 0 0 8px 0;"><strong>Amount:</strong> {{amount}}</p>
  <p style="font-size: 14px; color: #166534; margin: 0;"><strong>Invoice:</strong> #{{invoice_id}}</p>
</div>
<p style="font-size: 14px; color: #374151;">Thank you for your prompt payment. A receipt has been recorded on your account.</p>
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 24px;" />
<p style="font-size: 12px; color: #9ca3af;">Best regards,<br />The OPSlyHR Team</p>
</body></html>',
'Payment Received

Hi {{client_name}}, we''ve received your payment.

Amount: {{amount}}
Invoice: #{{invoice_id}}

Thank you for your prompt payment. A receipt has been recorded on your account.

Best regards,
The OPSlyHR Team',
'active')

ON CONFLICT (template_key) DO NOTHING;
