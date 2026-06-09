-- Fix Email Templates for Contract Signatures
-- 1. Create the new Active templates if they don't exist
INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status)
VALUES 
('talent_contract_active', 'Talent Contract Active', 'Your Contract is Fully Signed and Active', '', '', 'active'),
('client_contract_active', 'Client Contract Active', 'Your Contract is Fully Signed and Active', '', '', 'active')
ON CONFLICT (template_key) DO NOTHING;

-- 2. Update all 4 templates

-- TALENT: YOU SIGNED (Awaiting Client)
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px;margin-bottom:16px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.success-badge{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:12px 16px;border-radius:6px;font-weight:600;font-size:14px;display:inline-block;margin:16px 0}.info-block{background:#f9fafb;border-left:4px solid #059669;padding:16px;margin:20px 0;border-radius:4px}.info-label{font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px}.info-value{font-size:14px;font-weight:500;color:#111827}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:24px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.svg" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">You Have Signed Your Contract</p><p class="intro">Hi {{talent_name}},</p><p class="intro">You have successfully signed your contract for {{client_name}}.</p><div class="success-badge">Signature Received</div><div class="info-block"><div class="info-label">Position</div><div class="info-value">{{job_title}}</div></div><div class="info-block"><div class="info-label">Contract ID</div><div class="info-value">{{contract_id}}</div></div><p class="intro" style="margin-top:24px;"><strong>What''s Next:</strong></p><p class="intro">We will notify you immediately once the client has also signed and the contract becomes Active.</p><a href="{{employee_link}}" class="cta-button">View Contract Status</a></div><div class="footer"><p class="footer-text">OPSlyHR | Securing Your Future<br><a href="mailto:success@opslyhr.com" style="color:#059669;text-decoration:none;">success@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'You Have Signed Your Contract

Hi {{talent_name}},

You have successfully signed your contract for {{client_name}}.

Contract Details:
- Position: {{job_title}}
- Contract ID: {{contract_id}}

What''s Next:
We will notify you immediately once the client has also signed and the contract becomes Active.

View Contract Status: {{employee_link}}

Questions? success@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'talent_contract_signed';

-- CLIENT: YOU SIGNED (Awaiting Talent)
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:20px;font-weight:600;color:#059669;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.confirmation-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px;margin:20px 0}.confirmation-title{font-weight:600;color:#166534;margin-bottom:12px}.detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #bbf7d0;font-size:14px}.detail-label{color:#6b7280}.detail-value{color:#111827;font-weight:500}.detail-row:last-child{border-bottom:none}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:20px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.svg" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Contract Signed</p><p class="intro">Hi {{client_name}},</p><p class="intro">You have successfully signed the contract for {{talent_name}}.</p><div class="confirmation-box"><div class="confirmation-title">✓ Confirmed Details</div><div class="detail-row"><span class="detail-label">Professional</span><span class="detail-value">{{talent_name}}</span></div><div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">{{job_title}}</span></div></div><p class="intro">We will notify you immediately once the professional has also signed and the contract becomes Active.</p><a href="{{employee_link}}" class="cta-button">View Contract Status</a></div><div class="footer"><p class="footer-text">OPSlyHR | Your Partner in Building Operational Excellence<br><a href="mailto:success@opslyhr.com" style="color:#059669;text-decoration:none;">success@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'Contract Signed

Hi {{client_name}},

You have successfully signed the contract for {{talent_name}}.

Confirmed Details:
- Professional: {{talent_name}}
- Position: {{job_title}}

What''s Next:
We will notify you immediately once the professional has also signed and the contract becomes Active.

View Contract Status: {{employee_link}}

support@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'client_contract_signed';

-- TALENT: CONTRACT ACTIVE (Both Signed)
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px;margin-bottom:16px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:20px;font-weight:600;color:#111827;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.success-badge{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:12px 16px;border-radius:6px;font-weight:600;font-size:14px;display:inline-block;margin:16px 0}.info-block{background:#f9fafb;border-left:4px solid #059669;padding:16px;margin:20px 0;border-radius:4px}.info-label{font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px}.info-value{font-size:14px;font-weight:500;color:#111827}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:24px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.svg" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Your Contract is Fully Signed and Active</p><p class="intro">Hi {{talent_name}},</p><p class="intro">Great news! Both you and {{client_name}} have successfully signed the contract via OpslyHR. Your engagement is officially active.</p><div class="success-badge">Contract Active</div><div class="info-block"><div class="info-label">Position</div><div class="info-value">{{job_title}}</div></div><div class="info-block"><div class="info-label">Contract ID</div><div class="info-value">{{contract_id}}</div></div><div class="info-block"><div class="info-label">Start Date</div><div class="info-value">{{start_date}}</div></div><p class="intro" style="margin-top:24px;"><strong>What''s Next:</strong></p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">1. A PDF copy of your fully signed contract is attached to this email.</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">2. Keep an eye out for any direct onboarding materials.</p><p style="font-size:14px;color:#374151;margin:8px 0;padding-left:20px;">3. Log into your dashboard to track your payments and time.</p><a href="{{employee_link}}" class="cta-button">Go to your Dashboard</a><p style="font-size:12px;color:#6b7280;margin-top:20px;">Have questions? Our team is always available to help you succeed.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Securing Your Future<br><a href="mailto:success@opslyhr.com" style="color:#059669;text-decoration:none;">success@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'Your Contract is Fully Signed and Active

Hi {{talent_name}},

Great news! Both you and {{client_name}} have successfully signed the contract via OpslyHR. Your engagement is officially active.

Contract Details:
- Position: {{job_title}}
- Contract ID: {{contract_id}}
- Start Date: {{start_date}}

What''s Next:
1. A PDF copy of your fully signed contract is attached to this email.
2. Keep an eye out for any direct onboarding materials.
3. Log into your dashboard to track your payments and time.

Go to your Dashboard: {{employee_link}}

Questions? success@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'talent_contract_active';

-- CLIENT: CONTRACT ACTIVE (Both Signed)
UPDATE public.email_templates SET
body_html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111827;line-height:1.6}.container{max-width:600px;margin:0 auto}.header{background:#ffffff;padding:40px 30px;text-align:center;border-bottom:1px solid #e5e7eb}.logo{height:48px}.content{padding:30px 25px;background:#ffffff}.greeting{font-size:20px;font-weight:600;color:#059669;margin-bottom:8px}.intro{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:20px}.confirmation-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px;margin:20px 0}.confirmation-title{font-weight:600;color:#166534;margin-bottom:12px}.detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #bbf7d0;font-size:14px}.detail-label{color:#6b7280}.detail-value{color:#111827;font-weight:500}.detail-row:last-child{border-bottom:none}.timeline-box{background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;margin:20px 0;border-radius:4px}.timeline-title{font-weight:600;color:#1e40af;margin-bottom:8px}.timeline-item{font-size:14px;color:#1e40af;margin:4px 0;padding-left:12px}.cta-button{background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:14px;margin:20px 0}.footer{background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><img src="https://www.opslyhr.com/images/logocolored.svg" alt="OPSlyHR" class="logo"></div><div class="content"><p class="greeting">Contract Signed & Active</p><p class="intro">Hi {{client_name}},</p><p class="intro">Excellent news. Both parties have signed the contract for {{talent_name}} via OpslyHR. The contract is officially Active and they''re ready to start on {{start_date}}.</p><div class="confirmation-box"><div class="confirmation-title">✓ Confirmed Details</div><div class="detail-row"><span class="detail-label">Professional</span><span class="detail-value">{{talent_name}}</span></div><div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">{{job_title}}</span></div><div class="detail-row"><span class="detail-label">Start Date</span><span class="detail-value">{{start_date}}</span></div><div class="detail-row"><span class="detail-label">Rate</span><span class="detail-value">{{rate}}</span></div></div><div class="timeline-box"><div class="timeline-title">What Happens Next:</div><div class="timeline-item">→ A PDF copy of the fully signed contract is attached to this email.</div><div class="timeline-item">→ Onboarding materials will be sent to your team lead</div><div class="timeline-item">→ Payment setup is already configured in OpslyHR</div><div class="timeline-item">→ First payment scheduled for {{first_payment_date}}</div></div><p class="intro">Your dedicated support manager is standing by to ensure a smooth transition. We''ll make sure everything is ready for day one.</p><a href="{{employee_link}}" class="cta-button">Go to your Dashboard</a><p style="font-size:12px;color:#6b7280;margin-top:20px;">All hours are tracked in your OpslyHR dashboard. Invoices and payments are processed automatically.</p></div><div class="footer"><p class="footer-text">OPSlyHR | Your Partner in Building Operational Excellence<br><a href="mailto:success@opslyhr.com" style="color:#059669;text-decoration:none;">success@opslyhr.com</a><br>© 2026 OPSlyHR. All rights reserved.</p></div></div></body></html>',
body_text = 'Contract Signed & Active

Hi {{client_name}},

Both parties have signed. The contract for {{talent_name}} is officially Active via OpslyHR and ready to start on {{start_date}}.

Confirmed Details:
- Professional: {{talent_name}}
- Position: {{job_title}}
- Start Date: {{start_date}}
- Rate: {{rate}}

What''s Next:
→ A PDF copy of the fully signed contract is attached to this email.
→ Onboarding materials sent to your team lead
→ Payment setup is configured in OpslyHR
→ First payment: {{first_payment_date}}

Go to your Dashboard: {{employee_link}}

Your support manager is ready to help with the transition. All payments process automatically.

support@opslyhr.com
© 2026 OPSlyHR. All rights reserved.'
WHERE template_key = 'client_contract_active';
