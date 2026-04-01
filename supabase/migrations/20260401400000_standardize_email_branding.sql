-- Standardize Email Branding: Green to Blue, Logo Header, and Social Footer
-- Apply this migration to ensure all emails are branded with Opsly Blue and the company logo.

BEGIN;

-- 1. Talent Auth: Verify Required
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
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
    .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo-img">
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Welcome to OPSlyHR. To complete your account setup and start accessing opportunities, please verify your email address.
      </div>
      <a href="{{verification_link}}" class="cta">Verify Email</a>
      <div class="divider"></div>
      <div class="message">
        If you didn''t create this account, you can safely ignore this message.
      </div>
    </div>
    <div class="footer">
      <div class="social-links">
        <a href="#">LinkedIn</a>
        <a href="#">Twitter</a>
        <a href="#">Instagram</a>
        <a href="#">Facebook</a>
      </div>
      <div class="footer-text">
        © 2026 OPSlyHR. Helping you access global opportunities.
      </div>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'talent_auth_verify_required';

-- 2. Talent Auth: Verified Success
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
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
    .success-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .message { color: #475569; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .social-links a { margin: 0 10px; text-decoration: none; color: #2563eb; font-size: 12px; font-weight: bold; }
    .footer-text { font-size: 11px; color: #94a3b8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo-img">
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="success-box">
        <strong style="color: #1e40af;">✓ Your email has been successfully verified.</strong>
      </div>
      <div class="message">
        You can now continue setting up your profile and move forward with the vetting process.
      </div>
      <a href="{{dashboard_link}}" class="cta">Complete Your Profile</a>
    </div>
    <div class="footer">
      <div class="social-links">
        <a href="#">LinkedIn</a>
        <a href="#">Twitter</a>
        <a href="#">Instagram</a>
        <a href="#">Facebook</a>
      </div>
      <div class="footer-text">
        © 2026 OPSlyHR. Build your global career.
      </div>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'talent_auth_verified_success';

-- 3. Client Auth: Verify Required
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
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
    <div class="header">
      <img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo-img">
    </div>
    <div class="content">
      <p class="greeting">Hi {{first_name}},</p>
      <p class="message">Please verify your email to activate your OPSly account and start hiring world-class operations talent.</p>
      <a href="{{verification_link}}" class="cta">Verify Email</a>
    </div>
    <div class="footer">
      <div class="social-links">
        <a href="#">LinkedIn</a>
        <a href="#">Twitter</a>
        <a href="#">Instagram</a>
        <a href="#">Facebook</a>
      </div>
      <div class="footer-text">
        © 2026 OPSlyHR. Hire with confidence.
      </div>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'client_auth_verify_required';

-- 4. Client Auth: Verified Success
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 30px 20px; text-align: center; border-bottom: 3px solid #2563eb; }
    .logo-img { height: 48px; width: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 30px; }
    .success-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px; }
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
    <div class="header">
      <img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" class="logo-img">
    </div>
    <div class="content">
      <div class="success-box">
        <p style="margin: 0; font-weight: 600; color: #1e40af;">✓ Email verified successfully</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="message">Your email has been successfully verified. You can now begin exploring and hiring vetted talent.</p>
      <a href="{{dashboard_link}}" class="cta">Go to Dashboard</a>
    </div>
    <div class="footer">
      <div class="social-links">
        <a href="#">LinkedIn</a>
        <a href="#">Twitter</a>
        <a href="#">Instagram</a>
        <a href="#">Facebook</a>
      </div>
      <div class="footer-text">
        © 2026 OPSlyHR. The smart way to build global teams.
      </div>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'client_auth_verified_success';

COMMIT;
