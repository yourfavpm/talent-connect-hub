-- ============================================================
-- Email Template: payment_receipt_received
-- Sent to students immediately after they upload a payment receipt
-- ============================================================

insert into public.email_templates (
  template_key,
  name,
  subject,
  body_html,
  body_text,
  status
) values (
  'payment_receipt_received',
  'Payment Receipt Received',
  'Payment Receipt Received – Opsly HR Program',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Payment Receipt Received</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:''Inter'',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,33,71,0.08);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0f2147;padding:40px 48px;text-align:center;">
              <img src="https://opslyhr.com/images/logocolored.svg" alt="OPSlyHR" style="width:140px;height:auto;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 32px;">
              <p style="color:#0f2147;font-size:18px;font-weight:700;margin:0 0 8px;">Hello {{firstName}},</p>

              <p style="color:#444;font-size:16px;line-height:1.75;margin:0 0 24px;">
                Thank you for submitting your payment receipt for the <strong>Opsly HR Program</strong>.
              </p>

              <!-- Status card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:14px;border:1px solid #c7ddfa;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1.5px;">Submission Status</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:#0f2147;">✅ Successfully Received – Under Review</p>
                  </td>
                </tr>
              </table>

              <p style="color:#444;font-size:16px;line-height:1.75;margin:0 0 24px;">
                We have successfully received your payment submission and our team is currently reviewing and confirming your payment.
              </p>

              <p style="color:#444;font-size:16px;line-height:1.75;margin:0 0 16px;">
                Once your payment has been verified, you will receive your official admission and enrollment email containing:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:6px 0 6px 16px;color:#444;font-size:15px;line-height:1.6;">
                    &bull;&nbsp; Your program access details
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0 6px 16px;color:#444;font-size:15px;line-height:1.6;">
                    &bull;&nbsp; Next steps and onboarding information
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0 6px 16px;color:#444;font-size:15px;line-height:1.6;">
                    &bull;&nbsp; Important program updates
                  </td>
                </tr>
              </table>

              <p style="color:#444;font-size:16px;line-height:1.75;margin:0 0 32px;">
                If there are any issues with your submission, a member of our team will contact you directly.
              </p>

              <p style="color:#444;font-size:16px;line-height:1.75;margin:0 0 8px;">
                Thank you once again for choosing Opsly HR. We''re excited to have you join the program.
              </p>

              <p style="color:#444;font-size:16px;line-height:1.75;margin:0;">
                Best regards,<br/>
                <strong style="color:#0f2147;">The Opsly HR Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 48px;border-top:1px solid #eef0f4;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">
                &copy; 2026 OPSlyHR Academy. All rights reserved.
              </p>
              <p style="color:#94a3b8;font-size:12px;margin:0;">
                Questions? Email us at
                <a href="mailto:academy@opslyhr.com" style="color:#2563eb;text-decoration:none;">academy@opslyhr.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  E'Hello {{firstName}},\n\nThank you for submitting your payment receipt for the Opsly HR Program.\n\nWe have successfully received your payment submission and our team is currently reviewing and confirming your payment.\n\nOnce your payment has been verified, you will receive your official admission and enrollment email containing:\n- Your program access details\n- Next steps and onboarding information\n- Important program updates\n\nIf there are any issues with your submission, a member of our team will contact you directly.\n\nThank you once again for choosing Opsly HR. We''re excited to have you join the program.\n\nBest regards,\nThe Opsly HR Team',
  'active'
)
on conflict (template_key) do update set
  name       = excluded.name,
  subject    = excluded.subject,
  body_html  = excluded.body_html,
  body_text  = excluded.body_text,
  status     = excluded.status;
