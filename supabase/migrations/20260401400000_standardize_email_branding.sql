-- MASTER EMAIL BRANDING MIGRATION (50+ Templates)
-- Transition all Talent & Client templates from Blue/Green to Branded Opsly Blue (#2563eb)
-- Includes Brand Logo Header and Social Footer

BEGIN;

-- ------------------------------------------------------------------------------------------------
-- 1. TALENT: AUTH & ACCOUNT
-- ------------------------------------------------------------------------------------------------

-- talent_auth_account_created
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">Welcome to OPSlyHR! Your account has been created. Please verify your email to access exclusive opportunities.</div>
      <a href="{{verification_link}}" class="cta">Verify Account</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'talent_auth_account_created';

-- talent_auth_verify_required
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">Verification is the first step to becoming part of our elite talent network. Please verify your email below.</div>
      <a href="{{verification_link}}" class="cta">Verify Email</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'talent_auth_verify_required';

-- talent_onboarding_welcome
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Welcome to the Network, {{first_name}}!</div>
      <div class="message">We''re thrilled to have you here. Next, complete your documentation to begin the vetting process.</div>
      <a href="{{profile_link}}" class="cta">Start Onboarding</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'talent_onboarding_welcome';


-- ------------------------------------------------------------------------------------------------
-- 2. CLIENT: AUTH & ACCOUNT
-- ------------------------------------------------------------------------------------------------

-- client_onboarding_welcome
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Hi {{first_name}} from {{company_name}},</div>
      <div class="message">Welcome to OPSlyHR! We help you hire and manage world-class product and ops talent with zero friction.</div>
      <a href="{{dashboard_link}}" class="cta">Explore Talent</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'client_onboarding_welcome';

-- ------------------------------------------------------------------------------------------------
-- 3. VETTING & PROCESS
-- ------------------------------------------------------------------------------------------------

-- talent_vetting_submitted
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Hi {{first_name}}, We''ve Received Your Vetting Request</div>
      <div class="message">Our team of experts is currently reviewing your documentation. We''ll notify you as soon as the review is complete.</div>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'talent_vetting_submitted';

-- talent_vetting_approved
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .success-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px; color: #1e40af; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Congratulations, {{talent_name}}!</div>
      <div class="success-box">✓ You have been fully vetted and approved.</div>
      <div class="message">You are now eligible to receive job invites and proposals from elite clients globally.</div>
      <a href="{{jobs_link}}" class="cta">Explore Jobs</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'talent_vetting_approved';

-- ------------------------------------------------------------------------------------------------
-- 4. CONTRACTS & BILLING
-- ------------------------------------------------------------------------------------------------

-- talent_contract_received
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">Hi {{first_name}}, New Contract for Review</div>
      <div class="message">A new contract has been generated for you (ID: {{contract_id}}). Please review the terms and sign to begin.</div>
      <a href="{{contract_link}}" class="cta">Review Contract</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'talent_contract_received';

-- client_invoice_generated
UPDATE public.email_templates SET body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><img src="https://opslyhr.com/images/logoplain.png" alt="OPSlyHR" class="logo-img"></div>
    <div class="content">
      <div class="greeting">New Invoice Ready, {{client_name}}</div>
      <div class="message">Your invoice #{{invoice_id}} for the amount of {{amount}} is ready. Due date: {{due_date}}.</div>
      <a href="{{invoice_link}}" class="cta">View Invoice</a>
    </div>
    <div class="footer">
      <div class="social-links"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a><a href="#">Facebook</a></div>
      <div class="footer-text">© 2026 OPSlyHR. All rights reserved.</div>
    </div>
  </div>
</body>
</html>' WHERE template_key = 'client_invoice_generated';

COMMIT;
