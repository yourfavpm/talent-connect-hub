UPDATE email_templates
SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Welcome to OPSlyHR</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:''Helvetica Neue'',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0f172a;padding:28px 40px;text-align:center;">
            <img src="{{brand_logo}}" alt="{{brand_name}}" style="height:36px;" />
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 6px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Welcome Aboard</p>
            <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.35;">Hi {{first_name}}, Welcome to OPSlyHR!</h1>
            <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">
              We''re absolutely thrilled to have you join our exclusive network of top-tier talent!
            </p>
            <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">
              At OPSlyHR, we are dedicated to connecting exceptional professionals like yourself with world-class companies looking for your exact skills. Our platform is built to take the friction out of hiring, ensuring that you get matched with opportunities that align perfectly with your career goals, salary expectations, and working style. We handle the heavy lifting so you can focus on doing your best work.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
              To start receiving interview requests and job offers, the next step is to complete your onboarding profile. This helps our vetting team understand your unique strengths, verify your experience, and match you with the right clients.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
              <tr><td style="padding:18px 24px;">
                <h3 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#0f172a;">What''s next?</h3>
                <ol style="margin:0;padding-left:20px;font-size:14px;color:#475569;line-height:1.6;">
                  <li style="margin-bottom:8px;">Complete your onboarding profile</li>
                  <li style="margin-bottom:8px;">Pass our vetting process</li>
                  <li style="margin-bottom:0;">Start getting matched with top companies</li>
                </ol>
              </td></tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="border-radius:10px;background:#0f172a;">
                  <a href="{{profile_link}}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Complete Your Profile &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>',
  body_text = 'Hi {{first_name}}, Welcome to OPSlyHR! We''re absolutely thrilled to have you join our exclusive network of top-tier talent. At OPSlyHR, we are dedicated to connecting exceptional professionals like yourself with world-class companies. To start receiving interview requests and job offers, please complete your onboarding profile: {{profile_link}}'
WHERE template_key = 'talent_onboarding_welcome';
