-- Migration to seed Academy Enrollment Email Template

INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status) VALUES
('academy_enrollment_success', 'Academy Enrollment Success Email',
'Welcome to OPSly Academy - Access Your Course: {{courseName}}',
'<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to OPSly Academy</title>
    <style>
        body { font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc; }
        .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { background: #0f2147; padding: 48px 40px; text-align: center; }
        .logo { width: 140px; }
        .content { padding: 48px 40px; }
        h1 { font-size: 28px; font-weight: 800; color: #0f2147; margin: 0 0 16px 0; letter-spacing: -0.02em; }
        h3 { font-size: 18px; font-weight: 700; color: #0f2147; margin: 24px 0 16px 0; }
        p { font-size: 16px; color: #475569; margin: 0 0 16px 0; line-height: 1.6; }
        ul { list-style: none; padding: 0; margin: 16px 0 24px 0; }
        li { font-size: 16px; color: #475569; margin-bottom: 12px; padding-left: 24px; position: relative; }
        li:before { content: "•"; position: absolute; left: 0; color: #0f2147; font-weight: bold; font-size: 20px; }
        .footer { padding: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <img src="https://opslyhr.com/images/logocolored.svg" alt="OPSly" class="logo" />
            </div>
            <div class="content">
                <p>Hi {{studentName}},</p>
                <p>Welcome to OPSly Academy! We''re excited to have you join us.</p>
                <p>Your registration has been confirmed, and you''re now officially enrolled in <strong>{{courseName}}</strong> for the <strong>{{cohortName}}</strong> cohort.</p>
                
                <p>At OPSly Academy, our goal is to help you gain practical, real-world skills that prepare you for opportunities beyond just learning.</p>
                
                <h3>Here''s what happens next:</h3>
                <ul>
                    <li>Access to the student workspace</li>
                    <li>Begin your lessons</li>
                    <li>Complete assignments and projects</li>
                    <li>Stay updated through our email notifications and community channels</li>
                </ul>
                
                <p>If you have any questions or need support at any point, simply reach out to us on <strong>academy@opslyhr.com</strong> or any of our social networks and our team will be happy to assist you.</p>
                
                <p>We''re excited to be part of your journey.</p>
                
                <p>Welcome once again to OPSly Academy.</p>
                
                <p style="margin-top: 32px; font-weight: 600;">Best regards,<br>The OPSly Academy Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 OPSlyHR. All rights reserved.</p>
                <p>Questions? Contact us at <a href="mailto:academy@opslyhr.com" style="color: #64748b; text-decoration: underline;">academy@opslyhr.com</a></p>
            </div>
        </div>
    </div>
</body>
</html>',
'Hi {{studentName}},

Welcome to OPSly Academy! We''re excited to have you join us.

Your registration has been confirmed, and you''re now officially enrolled in {{courseName}} for the {{cohortName}} cohort.

At OPSly Academy, our goal is to help you gain practical, real-world skills that prepare you for opportunities beyond just learning.

Here''s what happens next:
- Access to the student workspace
- Begin your lessons
- Complete assignments and projects
- Stay updated through our email notifications and community channels

If you have any questions or need support at any point, simply reach out to us on academy@opslyhr.com or any of our social networks and our team will be happy to assist you.

We''re excited to be part of your journey.

Welcome once again to OPSly Academy.

Best regards,
The OPSly Academy Team',
'active')
ON CONFLICT (template_key) DO UPDATE 
SET 
    body_html = EXCLUDED.body_html,
    body_text = EXCLUDED.body_text,
    subject = EXCLUDED.subject;
