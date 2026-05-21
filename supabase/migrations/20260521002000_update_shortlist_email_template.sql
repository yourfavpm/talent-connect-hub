-- Update the talent shortlist email template with OPSlyHR branded styling
INSERT INTO public.email_templates (template_key, name, subject, body_html, body_text, status)
VALUES (
  'talent_application_shortlisted',
  'Talent: Application Shortlisted',
  'Good news — you''ve been shortlisted for {{job_title}}',
  '<html><body style="margin:0;padding:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;background:#f7fafc;color:#0f2147;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:24px 16px;"><table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(15,33,71,0.08);"><tr><td style="background:#0f2147;padding:32px 28px;text-align:center;color:#ffffff;"><img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" width="120" style="display:block;margin:0 auto 18px;border:none;" />
<h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.02em;">You&apos;ve been shortlisted</h1>
<p style="margin:12px 0 0;font-size:16px;line-height:1.6;color:rgba(255,255,255,0.85);">for the role of <strong>{{job_title}}</strong></p></td></tr>
<tr><td style="padding:32px 28px 36px;color:#334155;"><p style="margin:0 0 18px;font-size:15px;line-height:1.75;">Hi {{talent_name}},</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.75;">Congratulations — the OPSlyHR team has shortlisted you for <strong>{{job_title}}</strong>. You&apos;re now one step closer to the opportunity, and we&apos;ll keep you updated with the next steps.</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.75;">Please visit your dashboard to review the role, confirm availability, and complete any follow-up requirements.</p>
<div style="text-align:center;margin-top:8px;"><a href="{{job_link}}" style="display:inline-block;padding:12px 24px;background:#0f2147;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px;">View Jobs</a></div>
<p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:#64748b;">Best regards,<br>The OPSlyHR Team</p></td></tr></table></td></tr></table></body></html>',
  'Hi {{talent_name}},\n\nCongratulations — the OPSlyHR team has shortlisted you for {{job_title}}. You&apos;re now one step closer to the opportunity, and we&apos;ll keep you updated with the next steps.\n\nPlease visit your dashboard to review the role, confirm availability, and complete any follow-up requirements.\n\nView Jobs: {{job_link}}\n\nBest regards,\nThe OPSlyHR Team',
  'active'
)
ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  status = EXCLUDED.status,
  updated_at = now();
