# OPSlyHR Branded Email Templates

Professional, production-ready HTML email templates for the OPSlyHR platform. All templates are responsive, mobile-optimized, and follow the OPSlyHR brand guidelines.

---

## 📁 Template Files

### Talent Templates

- **talent-onboarding-welcome.html** — Welcome email sent after signup
- **talent-job-offer.html** — New job opportunity invitation
- **talent-contract-review.html** — Contract ready for signature

### Client Templates

- **client-onboarding-welcome.html** — Welcome after registration
- **client-contract-signed.html** — Contract signed confirmation
- **client-invoice-generated.html** — Invoice ready for payment

### Transactional Templates

- **password-reset.html** — Password reset request
- **email-verification.html** — Email verification required

---

## 🎨 Design Features

✅ **Responsive Design** — Works on desktop, tablet, and mobile
✅ **Inline CSS** — Compatible with all email clients
✅ **OPSlyHR Branding** — Logo, colors, typography
✅ **Professional Layout** — Clean spacing and hierarchy
✅ **Mobile-Optimized** — Stack properly on small screens
✅ **Button Styling** — Accessible CTAs with hover states
✅ **Color Palette:**
- Primary Brand Color: `#059669` (Green for actions)
- Text Primary: `#111827` (Dark grey)
- Text Secondary: `#6b7280` (Medium grey)
- Background: `#ffffff` (White)
- Card Background: `#f9fafb` (Light grey)

---

## 🔤 Variable Placeholders

All variables use the format: `{{VARIABLE_NAME}}`

Replace variables with actual values before sending:

### Common Variables

- `{{FIRST_NAME}}` — Recipient's first name
- `{{COMPANY_NAME}}` — Company name
- `{{PROFESSIONAL_NAME}}` — Professional's full name
- `{{CLIENT_NAME}}` — Client company name

### Email-Specific Variables

**Talent Onboarding Welcome:**
- `{{DASHBOARD_LINK}}` — URL to complete profile

**Talent Job Offer:**
- `{{JOB_TITLE}}` — Position title
- `{{CONTRACT_TYPE}}` — Full-time, Contract, Part-time
- `{{RATE}}` — Hourly or annual rate
- `{{LOCATION}}` — Job location
- `{{DURATION}}` — Contract duration
- `{{EXPIRATION_DATE}}` — Offer expiration date
- `{{APPLY_LINK}}` — Link to apply

**Talent Contract Review:**
- `{{JOB_TITLE}}` — Position title
- `{{CONTRACT_ID}}` — Contract ID number
- `{{START_DATE}}` — Employment start date
- `{{CONTRACT_LINK}}` — Link to contract document

**Client Onboarding Welcome:**
- `{{DASHBOARD_LINK}}` — URL to hiring dashboard

**Client Contract Signed:**
- `{{PROFESSIONAL_NAME}}` — Professional's name
- `{{JOB_TITLE}}` — Position title
- `{{START_DATE}}` — Employment start date
- `{{RATE}}` — Hourly or annual rate
- `{{FIRST_PAYMENT_DATE}}` — Date of first payment
- `{{EMPLOYEE_LINK}}` — Link to employee details

**Client Invoice Generated:**
- `{{PROFESSIONAL_NAME}}` — Professional's name
- `{{PERIOD}}` — Invoice period (e.g., "March 2026")
- `{{INVOICE_ID}}` — Invoice reference number
- `{{HOURS}}` — Total hours worked
- `{{AMOUNT}}` — Total amount due
- `{{PAYMENT_STATUS}}` — Status (Pending, Approved, Paid)
- `{{INVOICE_LINK}}` — Link to full invoice

**Password Reset:**
- `{{RESET_LINK}}` — Secure password reset URL

**Email Verification:**
- `{{VERIFICATION_LINK}}` — Email verification URL

---

## 📧 Sending Best Practices

### From Address

- **Brand emails:** `noreply@opslyhr.com`
- **Talent support:** `support@opslyhr.com`
- **Client success:** `success@opslyhr.com`
- **Billing:** `billing@opslyhr.com`
- **Vetting:** `vetting@opslyhr.com`

### Subject Lines

Keep subject lines:
- Clear and specific (don't be vague)
- Under 50 characters when possible
- Include action or benefit
- Never use ALL CAPS or excessive punctuation

**Good Examples:**
- "New Opportunity: Operations Manager"
- "Contract Ready for Review"
- "Invoice Generated – March"

**Avoid:**
- "Hey! Great news!!!"
- "URGENT ACTION REQUIRED"
- "Don't miss out!"

### Sending Timing

- **Welcome emails:** Send immediately after signup
- **Action required:** Send immediately when action is needed
- **Status updates:** Send as soon as status changes
- **Invoices:** Send on consistent schedule (e.g., 1st of month)

### Testing Checklist

Before sending any email:

- [ ] All `{{VARIABLES}}` are replaced with actual values
- [ ] Links are correct and accessible
- [ ] Phone/email contact information is accurate
- [ ] Test on mobile devices (Litmus, Email on Acid)
- [ ] Test in major clients (Gmail, Outlook, Apple Mail)
- [ ] Check plain text fallback rendering
- [ ] Verify accessibility (color contrast, alt text)

---

## 🔧 How to Use These Templates

### Option 1: Direct HTML Embedding

Copy and paste the template HTML into your email sending service (Resend, SendGrid, etc.):

```javascript
// Example with Resend API
const emailHtml = fs.readFileSync('email-templates/talent-onboarding-welcome.html', 'utf-8');

const rendered = emailHtml
  .replace('{{FIRST_NAME}}', 'John')
  .replace('{{DASHBOARD_LINK}}', 'https://app.opslyhr.com/onboarding');

await resend.send({
  from: 'welcome@opslyhr.com',
  to: recipient.email,
  subject: 'Welcome to the OPSlyHR Network',
  html: rendered,
});
```

### Option 2: Template Engine Integration

Use with Handlebars, EJS, or similar templating:

```javascript
// Convert {{VAR}} to {{var}} for Handlebars
const template = emailHtml.replace(/\{\{(\w+)\}\}/g, '{{$1}}');
const hbs = Handlebars.compile(template);
const html = hbs({ FIRST_NAME: 'John', DASHBOARD_LINK: 'https://...' });
```

### Option 3: React Email Components

Convert HTML to React Email (recommended for modern stacks):

```jsx
import { Html, Body, Container, Img, Text, Button } from 'react-email';

export const TalentOnboardingWelcome = ({ firstName, dashboardLink }) => (
  <Html>
    <Body style={bodyStyling}>
      <Container style={containerStyle}>
        {/* Header */}
        <Img src="https://www.opslyhr.com/images/logocolored.png" alt="OPSlyHR" style={{ height: 48 }} />
        
        {/* Content */}
        <Text style={greetingStyle}>Welcome to the OPSlyHR Network</Text>
        <Text style={introStyle}>Hi {firstName},</Text>
        {/* ... rest of content ... */}
        <Button style={ctaButtonStyle} href={dashboardLink}>
          Complete Your Profile
        </Button>
      </Container>
    </Body>
  </Html>
);
```

---

## 📱 Mobile Rendering

All templates include mobile-optimized CSS via media queries:

```css
@media (max-width: 480px) {
  /* Reduces padding, stacks layouts, expands buttons */
}
```

This ensures:
- ✓ Proper padding on small screens
- ✓ Full-width CTA buttons
- ✓ Single-column layout
- ✓ Readable font sizes
- ✓ Proper touch targets (48px minimum)

---

## ♿ Accessibility

All templates include:

✓ **Semantic HTML** — Proper heading hierarchy
✓ **Color Contrast** — WCAG AA compliant (4.5:1 ratio)
✓ **Link Contrast** — Underlined or distinctive color
✓ **Email Client Safe** — Tested on major clients
✓ **Alt Text** — Logo has descriptive alt text
✓ **Plain Text Fallback** — Works without HTML

---

## 🔒 Security Notes

- **Links are personalized** — Always verify link parameters before sending
- **No sensitive data in preview** — Preheader only shows non-critical info
- **URLs should be HTTPS** — All links use secure protocol
- **Email validation** — Verify recipient email before sending
- **Rate limiting** — Implement rate limits to prevent spam

---

## 🎯 Brand Compliance Checklist

- [ ] OPSlyHR logo present and properly sized
- [ ] Brand color (#059669) used for CTAs
- [ ] Tone is professional but warm
- [ ] No emojis (unless explicitly approved)
- [ ] Footer includes support contact
- [ ] Copyright year is current
- [ ] Company branding consistent throughout
- [ ] All links use official domains

---

## 📊 Email Metrics to Track

After sending, monitor:

1. **Delivery Rate** — % of emails successfully delivered
2. **Open Rate** — % of recipients who opened email
3. **Click Rate** — % who clicked the CTA button
4. **Unsubscribe Rate** — Track bounces and complaints
5. **Conversion Rate** — % who completed requested action

**Target Benchmarks:**
- Delivery: >98%
- Open: >25%
- Click: >3-5%
- Unsubscribe: <0.5%

---

## 🆘 Troubleshooting

**Email looks broken in Gmail:**
- Gmail clips emails >100KB. Keep templates lean.
- Inline CSS required—external stylesheets don't work.
- Test with actual Gmail account.

**Images not displaying:**
- Verify image URLs are publicly accessible.
- Use absolute URLs, not relative paths.
- Add `alt` text for accessibility.

**Links not working:**
- Ensure `{{VARIABLE_LINKS}}` are replaced with `https://` URLs.
- Check for accidental line breaks in URLs.

**Mobile layout broken:**
- Test at 480px width or smaller.
- Verify media query is working in preview.
- Check padding/margin values.

---

## 💡 Tips & Best Practices

1. **Personalization** — Always use recipient's first name
2. **One CTA** — Limit to one primary call-to-action per email
3. **Scannable** — Use short paragraphs and bullet points
4. **Mobile First** — Design mobile version first
5. **Urgency** — Use time-sensitive language sparingly
6. **Trust Signals** — Include company name, contact info
7. **A/B Testing** — Test subject lines for conversions
8. **Frequency** — Don't overwhelm with too many emails

---

## 📞 Support

For template modifications or custom email designs:

- Email: design@opslyhr.com
- Slack: #email-templates
- Documentation: https://wiki.opslyhr.com/emails

---

## Version History

- **v1.0** — Initial release with 8 core templates
- **Release Date:** April 2026
- **Last Updated:** April 1, 2026

**© 2026 OPSlyHR. All rights reserved.**
