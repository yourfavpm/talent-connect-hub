ALTER TABLE public.scholarship_applications
    ALTER COLUMN payment_reference DROP NOT NULL;

ALTER TABLE public.scholarship_applications
    ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'kora',
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS supporting_document_url TEXT;

CREATE INDEX IF NOT EXISTS idx_scholarship_apps_payment_status
    ON public.scholarship_applications (payment_status);

INSERT INTO public.email_templates (
  template_key,
  name,
  subject,
  body_html,
  body_text,
  status
) VALUES (
  'scholarship_application_received',
  'Scholarship Application Received',
  'OPSly Academy Scholarship Application Received',
  '<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Inter,Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 18px 45px rgba(15,33,71,0.10);">
        <tr><td style="background:#0f2147;padding:36px 44px;text-align:center;"><img src="https://opslyhr.com/images/logocolored.svg" alt="OPSlyHR" style="width:138px;height:auto;" /></td></tr>
        <tr><td style="padding:44px 44px 36px;">
          <p style="margin:0 0 22px;font-size:17px;line-height:1.75;color:#334155;">Hello {{firstName}},</p>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Thank you for applying for the <strong>OPSly Academy Scholarship Program 2026</strong>.</p>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">We are excited to confirm that we have successfully received your application, supporting documents, and application fee.</p>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.75;color:#334155;">You have taken an important step toward building practical, in-demand skills that can open doors to remote work opportunities, internships, and career growth.</p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:22px 24px;margin:26px 0;">
            <p style="margin:0 0 14px;font-size:13px;letter-spacing:1.6px;text-transform:uppercase;font-weight:800;color:#2563eb;">Scholarship Training Tracks</p>
            <p style="margin:0 0 8px;font-size:15px;color:#1e3a8a;">• Virtual Assistance</p>
            <p style="margin:0 0 8px;font-size:15px;color:#1e3a8a;">• Customer Support Operations</p>
            <p style="margin:0 0 8px;font-size:15px;color:#1e3a8a;">• AI Automation</p>
            <p style="margin:0;font-size:15px;color:#1e3a8a;">• Project Management</p>
          </div>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Our admissions team is currently reviewing applications and verifying submitted documents to ensure all applicants meet the program requirements.</p>
          <p style="margin:28px 0 14px;font-size:16px;font-weight:800;color:#0f2147;">What happens next?</p>
          <ol style="margin:0 0 24px;padding-left:20px;color:#334155;font-size:16px;line-height:1.75;">
            <li>Your application will be reviewed.</li>
            <li>Your submitted documents will be verified.</li>
            <li>Qualified applicants will receive an official admission email with onboarding details and training information.</li>
          </ol>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">Please keep an eye on your email, as all future updates regarding your application will be sent there.</p>
          <p style="margin:0 0 26px;font-size:16px;line-height:1.75;color:#334155;">We are excited about the possibility of having you join a community of ambitious students and graduates preparing for the future of work.</p>
          <p style="margin:0 0 26px;font-size:16px;line-height:1.75;color:#334155;">Thank you for choosing OPSly Academy.</p>
          <p style="margin:0;font-size:16px;line-height:1.75;color:#334155;">Warm regards,<br/><strong style="color:#0f2147;">OPSly Academy Admissions Team</strong></p>
        </td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 44px;text-align:center;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#0f2147;">Empowering the Next Generation of Remote Professionals</p>
          <p style="margin:0;font-size:12px;color:#94a3b8;">&copy; 2026 OPSlyHR Academy. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>',
  E'Hello {{firstName}},\n\nThank you for applying for the OPSly Academy Scholarship Program 2026.\n\nWe are excited to confirm that we have successfully received your application, supporting documents, and application fee.\n\nYou have taken an important step toward building practical, in-demand skills that can open doors to remote work opportunities, internships, and career growth.\n\nThrough this scholarship program, selected participants will receive training in:\n\n• Virtual Assistance\n• Customer Support Operations\n• AI Automation\n• Project Management\n\nOur admissions team is currently reviewing applications and verifying submitted documents to ensure all applicants meet the program requirements.\n\nWhat happens next?\n\n1. Your application will be reviewed.\n2. Your submitted documents will be verified.\n3. Qualified applicants will receive an official admission email with onboarding details and training information.\n\nPlease keep an eye on your email, as all future updates regarding your application will be sent there.\n\nWe are excited about the possibility of having you join a community of ambitious students and graduates preparing for the future of work.\n\nThank you for choosing OPSly Academy.\n\nWarm regards,\n\nOPSly Academy Admissions Team\n\nEmpowering the Next Generation of Remote Professionals',
  'active'
)
ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  status = EXCLUDED.status;
