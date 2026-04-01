-- Update client email templates with professional branded HTML designs
-- These templates are sent to client (hiring company) users during their journey

-- 1. Client Auth Verify Required
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email to continue</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 30px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Please verify your email to activate your OPSly account.</p>
      <a href="{{verification_link}}" class="cta-button">Verify Email</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Hire with confidence</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Please verify your email to activate your OPSly account.

Verify Email: {{verification_link}}

OPSlyHR — Hire with confidence'
WHERE template_key = 'client_auth_verify_required';

-- 2. Client Auth Verified Successfully
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your account is now active</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .success-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .success-box p { margin: 0; color: #065f46; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 30px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <p style="margin: 0; font-weight: 600;">✓ Email verified successfully</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Your email has been successfully verified.</p>
      <p class="body-text">You can now begin exploring and hiring vetted talent.</p>
      <a href="{{dashboard_link}}" class="cta-button">Go to Dashboard</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Build your team</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Your email has been successfully verified.

You can now begin exploring and hiring vetted talent.

Go to Dashboard: {{dashboard_link}}

OPSlyHR — Build your team'
WHERE template_key = 'client_auth_verified_success';

-- 3. Client Welcome Email
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to OPSly</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .highlight { color: #059669; font-weight: 600; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Welcome to OPSly.</p>
      <p class="body-text">We help you find, manage, and pay vetted operations professionals across Africa.</p>
      <p class="body-text">Start by completing your profile or posting your first role.</p>
      <a href="{{dashboard_link}}" class="cta-button">Get Started</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Hire smarter</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Welcome to OPSly.

We help you find, manage, and pay vetted operations professionals across Africa.

Start by completing your profile or posting your first role.

Get Started: {{dashboard_link}}

OPSlyHR — Hire smarter'
WHERE template_key = 'client_welcome';

-- 4. Talent Shortlisted by Admin
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Talent shortlisted for your role</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .info-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .info-box p { margin: 0; color: #065f46; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="info-box">
        <p>⭐ New candidates shortlisted for you</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">We''ve shortlisted candidates for your role.</p>
      <p class="body-text">Review their profiles and proceed with interviews or offers.</p>
      <a href="{{shortlist_link}}" class="cta-button">View Candidates</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Curated for you</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

We''ve shortlisted candidates for your role.

Review their profiles and proceed with interviews or offers.

View Candidates: {{shortlist_link}}

OPSlyHR — Curated for you'
WHERE template_key = 'client_talent_shortlisted';

-- 5. Interview Request Sent
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview request sent</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .status-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .status-box p { margin: 0; color: #92400e; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="status-box">
        <p>⏳ Interview request sent</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Your interview request has been sent to the selected candidate.</p>
      <p class="body-text">You''ll be notified once they respond.</p>
      <a href="{{interview_link}}" class="cta-button">View Details</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Stay updated</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Your interview request has been sent to the selected candidate.

You''ll be notified once they respond.

View Details: {{interview_link}}

OPSlyHR — Stay updated'
WHERE template_key = 'client_interview_request_sent';

-- 6. Message Sent Confirmation
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Message sent successfully</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .success-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .success-box p { margin: 0; color: #065f46; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <p>✓ Message delivered successfully</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Your message has been successfully sent.</p>
      <p class="body-text">You''ll be notified when the talent responds.</p>
      <a href="{{conversation_link}}" class="cta-button">View Conversation</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Seamless communication</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Your message has been successfully sent.

You''ll be notified when the talent responds.

View Conversation: {{conversation_link}}

OPSlyHR — Seamless communication'
WHERE template_key = 'client_message_sent_confirmation';

-- 7. Talent Accepted Interview
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview confirmed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .success-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .success-box p { margin: 0; color: #065f46; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <p>✓ Interview confirmed</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">The candidate has accepted your interview request.</p>
      <p class="body-text">You can proceed with the scheduled discussion.</p>
      <a href="{{interview_link}}" class="cta-button">View Interview</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Move forward with confidence</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

The candidate has accepted your interview request.

You can proceed with the scheduled discussion.

View Interview: {{interview_link}}

OPSlyHR — Move forward with confidence'
WHERE template_key = 'client_talent_accepted_interview';

-- 8. Talent Declined Interview
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview request declined</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .alert-box p { margin: 0; color: #92400e; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <p>⚠ Candidate unavailable</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">The candidate has declined your interview request.</p>
      <p class="body-text">We recommend reviewing other available candidates.</p>
      <a href="{{candidates_link}}" class="cta-button">View Candidates</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Find the right fit</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

The candidate has declined your interview request.

We recommend reviewing other available candidates.

View Candidates: {{candidates_link}}

OPSlyHR — Find the right fit'
WHERE template_key = 'client_talent_declined_interview';

-- 9. Job Submitted for Approval
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your job is under review</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .status-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .status-box p { margin: 0; color: #92400e; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="status-box">
        <p>⏳ Job under review</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Your job has been submitted and is currently under review.</p>
      <p class="body-text">You''ll be notified once it is approved or if any updates are required.</p>
      <a href="{{job_link}}" class="cta-button">View Job</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Quality-first hiring</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Your job has been submitted and is currently under review.

You''ll be notified once it is approved or if any updates are required.

View Job: {{job_link}}

OPSlyHR — Quality-first hiring'
WHERE template_key = 'client_job_submitted_approval';

-- 10. Job Approved and Live
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your job is now live</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .success-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .success-box p { margin: 0; color: #065f46; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <p>✓ Job is now live</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Your job has been approved and is now live.</p>
      <p class="body-text">You can start receiving applications from vetted talent.</p>
      <a href="{{job_link}}" class="cta-button">View Job</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Start hiring</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Your job has been approved and is now live.

You can start receiving applications from vetted talent.

View Job: {{job_link}}

OPSlyHR — Start hiring'
WHERE template_key = 'client_job_approved_live';

-- 11. Job Rejected
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Update required for your job post</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .alert-box p { margin: 0; color: #92400e; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <p>⚠ Updates required</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">Your job submission requires some updates before it can be approved.</p>
      <p class="body-text">Please review the feedback and make the necessary changes.</p>
      <a href="{{job_link}}" class="cta-button">Update Job</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Helping you get it right</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

Your job submission requires some updates before it can be approved.

Please review the feedback and make the necessary changes.

Update Job: {{job_link}}

OPSlyHR — Helping you get it right'
WHERE template_key = 'client_job_rejected';

-- 12. New Shortlist Received
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New candidates shortlisted</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .info-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .info-box p { margin: 0; color: #065f46; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="info-box">
        <p>⭐ New candidates added</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">New candidates have been added to your shortlist.</p>
      <p class="body-text">We recommend reviewing them and proceeding with next steps.</p>
      <a href="{{shortlist_link}}" class="cta-button">View Shortlist</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Curated talent</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

New candidates have been added to your shortlist.

We recommend reviewing them and proceeding with next steps.

View Shortlist: {{shortlist_link}}

OPSlyHR — Curated talent'
WHERE template_key = 'client_new_shortlist_received';

-- 13. Application Shortlisted Confirmation
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidate shortlisted</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .success-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .success-box p { margin: 0; color: #065f46; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <p>✓ Candidate shortlisted</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">You''ve successfully shortlisted a candidate.</p>
      <p class="body-text">You can proceed with interviews or next steps.</p>
      <a href="{{candidate_link}}" class="cta-button">View Candidate</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Efficient hiring</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

You''ve successfully shortlisted a candidate.

You can proceed with interviews or next steps.

View Candidate: {{candidate_link}}

OPSlyHR — Efficient hiring'
WHERE template_key = 'client_application_shortlisted_confirmation';

-- 14. Application Rejected Confirmation
UPDATE public.email_templates
SET 
  body_html = E'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidate update recorded</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f9fafb; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin: 0; text-decoration: none; }
    .content { padding: 40px 20px; }
    .status-box { background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 20px; margin: 0 0 30px 0; border-radius: 4px; }
    .status-box p { margin: 0; color: #374151; font-weight: 600; }
    .greeting { font-size: 18px; color: #111827; margin: 0 0 20px 0; }
    .body-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; }
    .cta-button { display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .footer-brand { color: #059669; font-weight: 600; }
    @media (max-width: 480px) {
      .content { padding: 20px 15px; }
      .header { padding: 25px 15px; }
      .footer { padding: 20px 15px; }
      .greeting, .body-text { font-size: 16px; }
      .cta-button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">OPSlyHR</h1>
    </div>
    <div class="content">
      <div class="status-box">
        <p>— Application declined</p>
      </div>
      <p class="greeting">Hi {{first_name}},</p>
      <p class="body-text">The application has been marked as declined.</p>
      <p class="body-text">You can continue reviewing other candidates.</p>
      <a href="{{applications_link}}" class="cta-button">View Applications</a>
    </div>
    <div class="footer">
      <p style="margin: 0;"><span class="footer-brand">OPSlyHR</span> — Keep hiring</p>
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},

The application has been marked as declined.

You can continue reviewing other candidates.

View Applications: {{applications_link}}

OPSlyHR — Keep hiring'
WHERE template_key = 'client_application_rejected_confirmation';