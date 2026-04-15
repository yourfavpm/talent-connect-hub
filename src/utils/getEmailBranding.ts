/**
 * Standard OPSlyHR Email Branding Wrapper
 * Used to wrap custom admin messages in a professional HTML envelope.
 */
export const getBrandedEmailHtml = (body: string, title?: string) => {
  const brandColor = "#0f2147";
  const logoUrl = "https://opslyhr.com/images/logocolored.png";
  const brandName = "OPSlyHR";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #334155;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }
    .header {
      padding: 32px;
      text-align: center;
      background-color: #ffffff;
      border-bottom: 1px solid #f1f5f9;
    }
    .logo {
      height: 32px;
      margin-bottom: 8px;
    }
    .content {
      padding: 40px;
    }
    .footer {
      padding: 32px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
    }
    h1 {
      color: ${brandColor};
      font-size: 18px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 24px;
      letter-spacing: -0.02em;
    }
    p {
      margin-bottom: 20px;
      font-size: 14px;
    }
    .note-box {
      background-color: #f1f5f9;
      border-left: 4px solid ${brandColor};
      padding: 24px;
      border-radius: 4px;
      margin: 24px 0;
      font-style: italic;
    }
    .button {
      display: inline-block;
      background-color: ${brandColor};
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="${brandName}" class="logo">
    </div>
    <div class="content">
      ${title ? `<h1>${title}</h1>` : ""}
      <p>Hello,</p>
      <p>An administrator from <strong>${brandName}</strong> has sent you a message regarding your profile vetting process:</p>
      
      <div class="note-box">
        ${body.replace(/\n/g, '<br>')}
      </div>

      <p>Please log in to your talent portal to attend to any pending requests or to update your profile.</p>
      
      <a href="https://talent.opslyhr.com/dashboard" class="button">Go to Talent Portal</a>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${brandName} | Managed Remote Operations Expertise<br>
      This is an automated notification from your vetting workspace.
    </div>
  </div>
</body>
</html>
  `;
};
