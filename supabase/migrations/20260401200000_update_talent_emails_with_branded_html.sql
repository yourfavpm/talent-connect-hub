-- Update Talent Email Templates with Branded HTML Designs
-- This migration updates the email_templates table with professional branded HTML versions
-- of all talent-related emails

BEGIN;

-- Helper function to wrap content in branded email template
-- Colors: Primary Green #059669, Text #111827, Light BG #f9fafb

UPDATE email_templates SET
  subject = 'Verify your email to get started on OPSlyHR',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
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
      OPSlyHR — Helping you access global opportunities
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nWelcome to OPSlyHR. To complete your account setup and start accessing opportunities, please verify your email address.\n\nVerify Email: {{verification_link}}\n\nIf you didn''t create this account, you can safely ignore this message.\n\nOPSlyHR — Helping you access global opportunities'
WHERE template_key = 'talent_auth_verify_required';

UPDATE email_templates SET
  subject = 'Your email has been verified',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .success-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="success-box">
        <strong>✓ Your email has been successfully verified.</strong>
      </div>
      <div class="message">
        You can now continue setting up your profile and move forward with the vetting process.
      </div>
      <a href="{{dashboard_link}}" class="cta">Complete Your Profile</a>
    </div>
    <div class="footer">
      OPSlyHR — Build your global career
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\n✓ Your email has been successfully verified.\n\nYou can now continue setting up your profile and move forward with the vetting process.\n\nComplete Your Profile: {{dashboard_link}}\n\nOPSlyHR — Build your global career'
WHERE template_key = 'talent_auth_verified_success';

UPDATE email_templates SET
  subject = 'Welcome to OPSlyHR',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Welcome to OPSlyHR. We''re excited to have you join a network of vetted operations professionals connecting with global companies.
      </div>
      <div class="message">
        To get started, complete your profile and submit it for vetting.
      </div>
      <a href="{{profile_link}}" class="cta">Start Profile Setup</a>
    </div>
    <div class="footer">
      OPSlyHR — Connecting you to global work
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nWelcome to OPSlyHR. We''re excited to have you join a network of vetted operations professionals connecting with global companies.\n\nTo get started, complete your profile and submit it for vetting.\n\nStart Profile Setup: {{profile_link}}\n\nOPSlyHR — Connecting you to global work'
WHERE template_key = 'talent_onboarding_welcome';

UPDATE email_templates SET
  subject = 'Your vetting request has been received',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .info-box { background: #f3f4f6; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Your profile has been successfully submitted for vetting.
      </div>
      <div class="info-box">
        <strong>Our team is currently reviewing your information.</strong> You''ll be notified once the process is complete or if any updates are required.
      </div>
      <a href="{{vetting_link}}" class="cta">View Profile</a>
    </div>
    <div class="footer">
      OPSlyHR — Quality you can trust
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nYour profile has been successfully submitted for vetting.\n\nOur team is currently reviewing your information. You''ll be notified once the process is complete or if any updates are required.\n\nView Profile: {{vetting_link}}\n\nOPSlyHR — Quality you can trust'
WHERE template_key = 'talent_vetting_submitted';

UPDATE email_templates SET
  subject = 'Action required: Update your profile',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; color: #92400e; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="alert-box">
        <strong>We''ve reviewed your profile and need a few updates before proceeding.</strong>
      </div>
      <div class="message">
        Please review the requested changes and update your profile accordingly. Once completed, you can resubmit for vetting.
      </div>
      <a href="{{vetting_link}}" class="cta">Update Profile</a>
      <div class="message">
        If you need help, feel free to reach out to support.
      </div>
    </div>
    <div class="footer">
      OPSlyHR — Supporting your progress
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nWe''ve reviewed your profile and need a few updates before proceeding.\n\nPlease review the requested changes and update your profile accordingly. Once completed, you can resubmit for vetting.\n\nUpdate Profile: {{vetting_link}}\n\nIf you need help, feel free to reach out to support.\n\nOPSlyHR — Supporting your progress'
WHERE template_key = 'talent_vetting_changes_requested';

UPDATE email_templates SET
  subject = 'You''ve been successfully vetted',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .success-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; color: #065f46; font-weight: bold; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="success-box">
        Congratulations — your profile has been successfully vetted.
      </div>
      <div class="message">
        You are now eligible to be matched with opportunities from global clients on OPSlyHR.
      </div>
      <div class="message">
        Make sure your profile stays updated to increase your chances of being selected.
      </div>
      <a href="{{jobs_link}}" class="cta">Go to Dashboard</a>
    </div>
    <div class="footer">
      OPSlyHR — Trusted by global teams
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{talent_name}},\n\nCongratulations — your profile has been successfully vetted.\n\nYou are now eligible to be matched with opportunities from global clients on OPSlyHR.\n\nMake sure your profile stays updated to increase your chances of being selected.\n\nGo to Dashboard: {{jobs_link}}\n\nOPSlyHR — Trusted by global teams'
WHERE template_key = 'talent_vetting_approved';

UPDATE email_templates SET
  subject = 'Update required before approval',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Thank you for your submission.
      </div>
      <div class="message">
        At this time, your profile does not meet our current vetting requirements. We encourage you to review your profile, make improvements, and reapply when ready.
      </div>
      <a href="{{resubmit_link}}" class="cta">Update Profile</a>
    </div>
    <div class="footer">
      OPSlyHR — Helping you improve and grow
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nThank you for your submission.\n\nAt this time, your profile does not meet our current vetting requirements. We encourage you to review your profile, make improvements, and reapply when ready.\n\nUpdate Profile: {{resubmit_link}}\n\nOPSlyHR — Helping you improve and grow'
WHERE template_key = 'talent_vetting_rejected';

UPDATE email_templates SET
  subject = 'Your OPSlyHR level has been assigned',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .level-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; font-weight: bold; color: #065f46; font-size: 16px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Your profile has been assigned the following level:
      </div>
      <div class="level-box">
        {{level}}
      </div>
      <div class="message">
        This helps us match you with the most relevant opportunities. Keep your profile updated to improve your visibility.
      </div>
      <a href="{{jobs_link}}" class="cta">View Profile</a>
    </div>
    <div class="footer">
      OPSlyHR — Matching talent with the right opportunities
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nYour profile has been assigned the following level:\n\n{{level}}\n\nThis helps us match you with the most relevant opportunities. Keep your profile updated to improve your visibility.\n\nView Profile: {{jobs_link}}\n\nOPSlyHR — Matching talent with the right opportunities'
WHERE template_key = 'talent_vetting_level_assigned';

UPDATE email_templates SET
  subject = 'Profile update required',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; color: #92400e; font-weight: bold; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="alert-box">
        Your profile has been flagged for re-verification.
      </div>
      <div class="message">
        Please review your information and update any required details to maintain your vetted status.
      </div>
      <a href="{{profile_link}}" class="cta">Review Profile</a>
    </div>
    <div class="footer">
      OPSlyHR — Maintaining quality standards
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nYour profile has been flagged for re-verification.\n\nPlease review your information and update any required details to maintain your vetted status.\n\nReview Profile: {{profile_link}}\n\nOPSlyHR — Maintaining quality standards'
WHERE template_key = 'talent_profile_flagged';

UPDATE email_templates SET
  subject = 'New opportunity for you on OPSlyHR',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        A new role matching your skills has just been published. We recommend reviewing the opportunity and applying if it aligns with your experience.
      </div>
      <a href="{{job_link}}" class="cta">View Job</a>
    </div>
    <div class="footer">
      OPSlyHR — Opportunities tailored to you
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nA new role matching your skills has just been published. We recommend reviewing the opportunity and applying if it aligns with your experience.\n\nView Job: {{job_link}}\n\nOPSlyHR — Opportunities tailored to you'
WHERE template_key = 'talent_job_recommendation';

UPDATE email_templates SET
  subject = 'You''ve been invited to apply',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .highlight-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; color: #065f46; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="highlight-box">
        <strong>You''ve been shortlisted for a role based on your profile.</strong>
      </div>
      <div class="message">
        We recommend submitting your application as soon as possible.
      </div>
      <a href="{{job_link}}" class="cta">Apply Now</a>
    </div>
    <div class="footer">
      OPSlyHR — Connecting you to the right roles
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nYou''ve been shortlisted for a role based on your profile. We recommend submitting your application as soon as possible.\n\nApply Now: {{job_link}}\n\nOPSlyHR — Connecting you to the right roles'
WHERE template_key = 'talent_job_invited_to_apply';

UPDATE email_templates SET
  subject = 'Interview request received',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        A client has requested an interview with you. Please review the details and confirm your availability.
      </div>
      <a href="{{job_link}}" class="cta">View Interview Details</a>
    </div>
    <div class="footer">
      OPSlyHR — Take the next step
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nA client has requested an interview with you. Please review the details and confirm your availability.\n\nView Interview Details: {{job_link}}\n\nOPSlyHR — Take the next step'
WHERE template_key = 'talent_interview_requested';

UPDATE email_templates SET
  subject = 'Your application has been shortlisted',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .success-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; color: #065f46; font-weight: bold; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="success-box">
        Good news — your application has been shortlisted.
      </div>
      <div class="message">
        The client may reach out with next steps shortly. Stay prepared.
      </div>
      <a href="{{job_link}}" class="cta">View Application</a>
    </div>
    <div class="footer">
      OPSlyHR — You''re making progress
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nGood news — your application has been shortlisted. The client may reach out with next steps shortly. Stay prepared.\n\nView Application: {{job_link}}\n\nOPSlyHR — You''re making progress'
WHERE template_key = 'talent_application_shortlisted';

UPDATE email_templates SET
  subject = 'Update on your application',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Thank you for your application. At this time, the client has decided to move forward with other candidates.
      </div>
      <div class="message">
        We encourage you to keep applying to other opportunities.
      </div>
      <a href="{{job_link}}" class="cta">Explore Jobs</a>
    </div>
    <div class="footer">
      OPSlyHR — More opportunities ahead
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nThank you for your application. At this time, the client has decided to move forward with other candidates.\n\nWe encourage you to keep applying to other opportunities.\n\nExplore Jobs: {{job_link}}\n\nOPSlyHR — More opportunities ahead'
WHERE template_key = 'talent_application_rejected';

UPDATE email_templates SET
  subject = 'Welcome to OPSlyHR! Complete your account setup',
  body_html = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 16px; }
    .message { color: #6b7280; line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .cta:hover { background: #047857; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OPSlyHR</div>
    </div>
    <div class="content">
      <div class="greeting">Hi {{first_name}},</div>
      <div class="message">
        Welcome to OPSlyHR! Your account has been successfully created. We''re thrilled to have you onboard.
      </div>
      <div class="message">
        To start exploring opportunities and connecting with global teams, verify your email address below.
      </div>
      <a href="{{verification_link}}" class="cta">Verify Email Address</a>
    </div>
    <div class="footer">
      OPSlyHR — Building global connections
    </div>
  </div>
</body>
</html>',
  body_text = E'Hi {{first_name}},\n\nWelcome to OPSlyHR! Your account has been successfully created. We''re thrilled to have you onboard.\n\nTo start exploring opportunities and connecting with global teams, verify your email address below:\n\n{{verification_link}}\n\nOPSlyHR — Building global connections'
WHERE template_key = 'talent_auth_account_created';

COMMIT;
