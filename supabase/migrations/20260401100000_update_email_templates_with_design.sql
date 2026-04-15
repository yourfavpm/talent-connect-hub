-- Update Email Templates with Professional Brand Design
-- This migration updates all existing email templates with the new design system
-- Maintains all existing template_keys so no code changes are needed

-- Note: Using UPDATE statements to preserve existing template IDs and created_at timestamps
-- This ensures backward compatibility while improving visual design

UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto;background:#ffffff}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px;margin-bottom:16px}.content{padding:30px 25px}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:20px;margin:20px 0}.card-content{font-size:14px;color:#374151;margin:0}.section-title{font-size:18px;font-weight:600;color:#111827;margin-top:24px;margin-bottom:12px}.list-item{font-size:14px;color:#374151;margin:8px 0;padding-left:20px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin-top:24px}.cta-button:hover{background:#047857}.secondary-text{font-size:14px;color:#6b7280;margin-top:16px}.divider{border:none;border-top:1px solid #e5e7eb;margin:32px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af;margin:0}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Welcome to the OPSlyHR Network</p><p class="intro">Hi {{talent_name}},</p><p class="intro">We''re excited to have you join our community of vetted operations professionals. Your journey with us starts here.</p><div class="card"><p class="card-content"><strong>What''s Next:</strong></p><p class="list-item">1. Complete your professional profile</p><p class="list-item">2. Verify your identity and credentials</p><p class="list-item">3. Start exploring opportunities that match your expertise</p></div><p class="intro">The entire process typically takes 2-3 days. Our support team is available 24/7 if you have questions.</p><a href="{{dashboard_link}}" class="cta-button">Complete Your Profile</a><div class="divider"></div><p class="secondary-text">Got questions? Our support team is available 24/7. Reply to this email or visit our help center.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Trusted Operations Professionals<br><a href="mailto:support@opslyhr.com" style="color:#059669;text-decoration:none;">support@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'Welcome to the OPSlyHR Network

Hi {{talent_name}},

We''re excited to have you join our community of vetted operations professionals.

What''s Next:
1. Complete your professional profile
2. Verify your identity and credentials
3. Start exploring opportunities that match your expertise

The entire process typically takes 2-3 days. Our support team is available 24/7 if you have questions.

Complete Your Profile: {{dashboard_link}}

Get Support: support@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'talent_onboarding_welcome';

-- TALENT: Job Offer Received
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto;background:#ffffff}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px;margin-bottom:16px}.content{padding:30px 25px}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.highlight-card{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px;margin:20px 0}.highlight-label{font-size:12px;font-weight:600;color:#166534;text-transform:uppercase;margin-bottom:4px}.highlight-value{font-size:16px;font-weight:600;color:#059669;margin-bottom:12px}.details-row{display:flex;justify-content:space-between;margin:8px 0;font-size:14px}.details-label{color:#6b7280}.details-value{color:#111827;font-weight:500}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin-top:24px}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">{{client_name}} Has Invited You to Apply</p><p class="intro">Hi {{talent_name}},</p><p class="intro">{{client_name}} has reviewed your profile and would like to learn more about you for a specific role.</p><div class="highlight-card"><div class="highlight-label">Position</div><div class="highlight-value">{{job_title}}</div><div class="details-row"><span class="details-label">Type:</span><span class="details-value">{{contract_type}}</span></div><div class="details-row"><span class="details-label">Rate:</span><span class="details-value">{{rate}}</span></div><div class="details-row"><span class="details-label">Location:</span><span class="details-value">{{location}}</span></div><div class="details-row"><span class="details-label">Duration:</span><span class="details-value">{{duration}}</span></div></div><p class="intro"><strong>Why They Chose You:</strong> They''re looking for someone with your specific expertise in operations management. Your background was a strong match.</p><p class="intro"><strong>Next Steps:</strong></p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">1. Review the full role details</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">2. Decide if you''re interested</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">3. Submit your application</p><p class="intro">This invitation is reserved for you through {{expiration_date}}.</p><a href="{{apply_link}}" class="cta-button">View & Apply</a><p style="font-size:12px;color:#6b7280;margin-top:20px;">Have questions? Reply to this email or contact our support team.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Your Opportunities Await<br><a href="mailto:support@opslyhr.com" style="color:#059669;text-decoration:none;">support@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = '{{client_name}} Has Invited You to Apply

Hi {{talent_name}},

{{client_name}} has reviewed your profile for the {{job_title}} position.

Position Details:
- Title: {{job_title}}
- Type: {{contract_type}}
- Rate: {{rate}}
- Location: {{location}}
- Duration: {{duration}}

Why They Chose You:
They''re looking for someone with your specific expertise in operations management.

Next Steps:
1. Review the full role details
2. Decide if you''re interested
3. Submit your application

This invitation is reserved until {{expiration_date}}.

View & Apply: {{apply_link}}

Questions? support@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'talent_job_offer';

-- TALENT: Contract Signed
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px;margin-bottom:16px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.success-badge{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:12px 16px;border-radius:6px;font-weight:600;font-size:14px;display:inline-block;margin:16px 0}.info-block{background:#f9fafb;border-left:4px solid #059669;padding:16px;margin:20px 0;border-radius:4px}.info-label{font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px}.info-value{font-size:14px;font-weight:500;color:#111827}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:24px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Please Review Your Contract</p><p class="intro">Hi {{talent_name}},</p><p class="intro">{{client_name}} has prepared your contract for review and signature. This is an important document—please read it carefully.</p><div class="success-badge">Contract Ready for Review</div><div class="info-block"><div class="info-label">Position</div><div class="info-value">{{job_title}}</div></div><div class="info-block"><div class="info-label">Contract ID</div><div class="info-value">{{contract_id}}</div></div><div class="info-block"><div class="info-label">Start Date</div><div class="info-value">{{start_date}}</div></div><p class="intro" style="margin-top:24px;"><strong>What You Need to Do:</strong></p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">1. Review the contract carefully</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">2. Note any questions or concerns</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">3. Sign electronically in your dashboard</p><p class="intro">Everything is handled securely. You can sign with one click—no printing or scanning needed.</p><p class="intro"><strong>Timeline:</strong> Once you sign, {{client_name}} will countersign within 24-48 hours.</p><a href="{{contract_link}}" class="cta-button">Review & Sign Contract</a><p style="font-size:12px;color:#6b7280;margin-top:20px;">Have questions about contract terms? Our contracts team is available to help.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Securing Your Future<br><a href="mailto:success@opslyhr.com" style="color:#059669;text-decoration:none;">success@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'Please Review Your Contract

Hi {{talent_name}},

{{client_name}} has prepared your contract for review and signature.

Contract Details:
- Position: {{job_title}}
- Contract ID: {{contract_id}}
- Start Date: {{start_date}}

What You Need to Do:
1. Review the contract carefully
2. Note any questions or concerns
3. Sign electronically in your dashboard

Once you sign, {{client_name}} will countersign within 24-48 hours.

Review & Sign Contract: {{contract_link}}

Questions? success@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'talent_contract_signed';

-- CLIENT: Welcome Email
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:16px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.feature-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:12px 0;font-size:14px;color:#374151}.feature-title{font-weight:600;color:#111827;margin-bottom:4px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:20px 0}.secondary-cta{color:#059669;text-decoration:none;font-weight:600}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Your OPSlyHR Hiring Dashboard is Ready</p><p class="intro">Hi {{company_name}},</p><p class="intro">Thank you for joining OPSlyHR. You now have access to our global network of vetted operations professionals. Let''s build your team.</p><p class="intro"><strong>What You Can Do Right Now:</strong></p><div class="feature-box"><div class="feature-title">Browse Our Network</div>Explore pre-vetted professionals across operations, finance, HR, and more. Filter by experience, location, and skills.</div><div class="feature-box"><div class="feature-title">Post Your First Role</div>Tell us what you''re looking for. We''ll match you with the best-fit professionals within 24 hours.</div><div class="feature-box"><div class="feature-title">Build Your Team</div>Whether you need one specialist or a full department, we handle vetting, contracts, and payments.</div><p class="intro">Your dedicated account manager is ready to help. We''ll work closely with you to understand your needs and find the right fit.</p><a href="{{dashboard_link}}" class="cta-button">View Available Talent</a><p class="intro"><strong>First Steps:</strong> Your first consultation is free. Our team will help you define your hiring needs and introduce you to qualified candidates within 48 hours.</p><p style="font-size:12px;color:#6b7280;margin-top:24px;">Have questions? <a href="mailto:success@opslyhr.com" class="secondary-cta">Contact our team</a></p></div><div class="footer"><p class="footer-text">OPSlyHR | Global Hiring for Operations Professionals<br><a href="mailto:success@opslyhr.com" style="color:#059669;text-decoration:none;">success@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'Your OPSlyHR Hiring Dashboard is Ready

Hi {{company_name}},

Thank you for joining OPSlyHR. You now have access to our global network of vetted operations professionals.

What You Can Do:
- Browse Network: Explore pre-vetted professionals across multiple disciplines
- Post Your Role: Tell us what you need, we match you with candidates
- Build Your Team: We handle contracts, vetting, and payments

Your dedicated account manager is ready to help define your hiring needs and introduce you to candidates.

View Available Talent: {{dashboard_link}}

First Steps: Your first consultation is free. We''ll help you within 48 hours.

Questions? success@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'client_onboarding_welcome';

-- CLIENT: Contract Signed Confirmation
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:20px;font-weight:600;color:#059669;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.confirmation-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px;margin:20px 0}.confirmation-title{font-weight:600;color:#166534;margin-bottom:12px}.detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #bbf7d0;font-size:14px}.detail-label{color:#6b7280}.detail-value{color:#111827;font-weight:500}.detail-row:last-child{border-bottom:none}.timeline-box{background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;margin:20px 0;border-radius:4px}.timeline-title{font-weight:600;color:#1e40af;margin-bottom:8px}.timeline-item{font-size:14px;color:#1e40af;margin:4px 0;padding-left:12px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:20px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Contract Signed — Let''s Get Started</p><p class="intro">Hi {{company_name}},</p><p class="intro">Excellent news. Both parties have signed the contract for {{professional_name}}. They''re officially ready to start on {{start_date}}.</p><div class="confirmation-box"><div class="confirmation-title">✓ Confirmed Details</div><div class="detail-row"><span class="detail-label">Professional</span><span class="detail-value">{{professional_name}}</span></div><div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">{{job_title}}</span></div><div class="detail-row"><span class="detail-label">Start Date</span><span class="detail-value">{{start_date}}</span></div><div class="detail-row"><span class="detail-label">Rate</span><span class="detail-value">{{rate}}</span></div></div><div class="timeline-box"><div class="timeline-title">What Happens Next:</div><div class="timeline-item">→ Onboarding materials will be sent to your team lead</div><div class="timeline-item">→ {{professional_name}} receives access instructions</div><div class="timeline-item">→ Payment setup is already configured</div><div class="timeline-item">→ First payment scheduled for {{first_payment_date}}</div></div><p class="intro">Your dedicated support manager is standing by to ensure a smooth transition. We''ll make sure everything is ready for day one.</p><a href="{{employee_link}}" class="cta-button">View Employee Details</a><p style="font-size:12px;color:#6b7280;margin-top:20px;">All hours are tracked in your dashboard. Invoices and payments are processed automatically.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Your Partner in Building Operational Excellence<br><a href="mailto:success@opslyhr.com" style="color:#059669;text-decoration:none;">success@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'Contract Signed — Let''s Get Started

Hi {{company_name}},

Both parties have signed. {{professional_name}} is ready to start on {{start_date}}.

Confirmed Details:
- Professional: {{professional_name}}
- Position: {{job_title}}
- Start Date: {{start_date}}
- Rate: {{rate}}

What''s Next:
→ Onboarding materials sent to your team lead
→ {{professional_name}} receives access instructions
→ Payment setup is configured
→ First payment: {{first_payment_date}}

View Employee Details: {{employee_link}}

Your support manager is ready to help with the transition. All payments process automatically.

support@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'client_contract_signed';

-- CLIENT: Invoice Generated
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:18px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:16px}.invoice-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:16px 0}.invoice-row{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;border-bottom:1px solid #e5e7eb}.invoice-row:last-child{border-bottom:none}.row-label{color:#6b7280}.row-value{color:#111827;font-weight:500}.invoice-amount{font-size:18px;font-weight:600;color:#059669;margin-top:8px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:16px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Invoice Ready: {{professional_name}} – {{period}}</p><p class="intro">Your invoice for {{professional_name}} is ready for review and payment.</p><div class="invoice-box"><div class="invoice-row"><span class="row-label">Professional</span><span class="row-value">{{professional_name}}</span></div><div class="invoice-row"><span class="row-label">Invoice ID</span><span class="row-value">{{invoice_id}}</span></div><div class="invoice-row"><span class="row-label">Period</span><span class="row-value">{{period}}</span></div><div class="invoice-row"><span class="row-label">Hours Logged</span><span class="row-value">{{hours}}</span></div><div class="invoice-amount">Due: {{amount}}</div></div><p class="intro"><strong>Payment Status:</strong> {{payment_status}}</p><a href="{{invoice_link}}" class="cta-button">View Invoice Details</a><p style="font-size:12px;color:#6b7280;margin-top:16px;">View detailed time logs and payment settings anytime in your dashboard. Questions? billing@opslyhr.com</p></div><div class="footer"><p class="footer-text">OPSlyHR | Transparent Billing & Payments<br><a href="mailto:billing@opslyhr.com" style="color:#059669;text-decoration:none;">billing@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'Invoice Ready: {{professional_name}} – {{period}}

Your invoice is ready for review.

Invoice Details:
- Professional: {{professional_name}}
- Invoice ID: {{invoice_id}}
- Period: {{period}}
- Hours: {{hours}}
- Amount Due: {{amount}}

Payment Status: {{payment_status}}

View Invoice: {{invoice_link}}

View time logs and payment settings in your dashboard.
Questions? billing@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'client_invoice_generated';

-- Add more email templates for passion events
-- These are generic fallback templates

-- If template doesn't exist, add it (for templates that may not have been created yet)
INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status)
SELECT 'password_reset', 'Password Reset', 'Reset Your OPSlyHR Password', 
'<html><head><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827}.container{max-width:600px;margin:0 auto}.header{padding:40px 30px;text-align:center}.logo{height:48px}.content{padding:30px 25px}.greeting{font-size:18px;font-weight:600;margin-bottom:8px}.intro{font-size:14px;color:#6b7280;margin-bottom:16px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600}.footer{background:#f9fafb;padding:20px 30px;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Reset Your Password</p><p class="intro">You requested a password reset. Use the link below to create a new password. This link expires in 24 hours.</p><a href="{{reset_link}}" class="cta-button">Reset Password</a><p style="font-size:12px;color:#6b7280;margin-top:16px;">If you didn''t request this, ignore this email. Your account is secure.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Keep Your Account Secure<br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
'Reset Your Password

You requested a password reset. Use this link to create a new password:

{{reset_link}}

This link expires in 24 hours.

If you didn''t request this, ignore this email.

© 2026 OPSlyHR',
'active'
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_key = 'password_reset');

INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status)
SELECT 'email_verification', 'Email Verification', 'Verify Your Email Address', 
'<html><head><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827}.container{max-width:600px;margin:0 auto}.header{padding:40px 30px;text-align:center}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:18px;font-weight:600;margin-bottom:8px}.intro{font-size:14px;color:#6b7280;margin-bottom:16px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600}.footer{background:#f9fafb;padding:20px 30px;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Verify Your Email</p><p class="intro">Thank you for signing up. Please verify your email address to complete your account setup. This link expires in 48 hours.</p><a href="{{verification_link}}" class="cta-button">Verify Email</a><p style="font-size:12px;color:#6b7280;margin-top:16px;">Already verified? No further action needed.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Welcome to Our Community<br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
'Verify Your Email

Thank you for signing up. Verify your email to complete setup:

{{verification_link}}

This link expires in 48 hours.

© 2026 OPSlyHR',
'active'
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_key = 'email_verification');

-- End of template updates
