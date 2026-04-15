# Email Template Implementation Guide

Quick reference for developers implementing branded OPSlyHR email templates into the frontend application.

---

## 🚀 Quick Start (5 minutes)

### Step 1: Choose a Template

Start with one of these core templates:
```
email-templates/talent-onboarding-welcome.html
email-templates/talent-job-offer.html
email-templates/client-onboarding-welcome.html
```

### Step 2: Copy the HTML

```bash
cp email-templates/talent-onboarding-welcome.html src/templates/emails/
```

### Step 3: Replace Variables

Find all `{{VARIABLE_NAME}}` patterns and replace with dynamic data:

```javascript
let html = fs.readFileSync('src/templates/emails/talent-onboarding-welcome.html', 'utf-8');

// Replace all variables
html = html.replace('{{FIRST_NAME}}', user.firstName);
html = html.replace('{{DASHBOARD_LINK}}', `https://app.opslyhr.com/onboarding?token=${token}`);
```

### Step 4: Send via Email Service

```javascript
await resend.send({
  from: 'welcome@opslyhr.com',
  to: user.email,
  subject: 'Welcome to OPSlyHR',
  html: html,
});
```

---

## 📋 Template Mapping

| Template File | Usage | Key Variables |
|---|---|---|
| talent-onboarding-welcome.html | After talent signup | FIRST_NAME, DASHBOARD_LINK |
| talent-job-offer.html | New opportunity invite | CLIENT_NAME, JOB_TITLE, RATE, APPLY_LINK |
| talent-contract-review.html | Contract signature request | JOB_TITLE, CONTRACT_LINK |
| client-onboarding-welcome.html | After client signup | COMPANY_NAME, DASHBOARD_LINK |
| client-contract-signed.html | After signing contract | PROFESSIONAL_NAME, START_DATE |
| client-invoice-generated.html | Invoice ready | INVOICE_ID, AMOUNT, INVOICE_LINK |
| password-reset.html | Password reset request | RESET_LINK |
| email-verification.html | Email confirmation | VERIFICATION_LINK |

---

## 🔄 Integration Patterns

### Pattern 1: String Replace (Simplest)

```typescript
import fs from 'fs';

function sendTalentWelcomeEmail(email: string, firstName: string, dashboardLink: string) {
  let template = fs.readFileSync('email-templates/talent-onboarding-welcome.html', 'utf-8');
  
  const html = template
    .replace('{{FIRST_NAME}}', firstName)
    .replace('{{DASHBOARD_LINK}}', dashboardLink);
  
  await emailService.send({
    to: email,
    subject: 'Welcome to OPSlyHR',
    html: html,
  });
}
```

### Pattern 2: Template Engine (Recommended)

**Using Handlebars:**

```typescript
import Handlebars from 'handlebars';
import fs from 'fs';

function sendTalentWelcomeEmail(email: string, data: {firstName: string; dashboardLink: string}) {
  // Convert {{VARIABLE}} to {{variable}} for Handlebars if needed
  let template = fs.readFileSync('email-templates/talent-onboarding-welcome.html', 'utf-8');
  
  // Or convert format first:
  template = template.replace(/\{\{(\w+)\}\}/g, '{{convertToLowercase("$1")}}');
  
  const compiled = Handlebars.compile(template);
  const html = compiled(data);
  
  await emailService.send({
    to: email,
    subject: 'Welcome to OPSlyHR',
    html: html,
  });
}
```

### Pattern 3: React Email (Modern Approach)

Create React components from the HTML templates:

```tsx
// emails/TalentOnboardingWelcome.tsx
import { Html, Body, Container, Img, Text, Button } from 'react-email';

interface TalentOnboardingWelcomeProps {
  firstName: string;
  dashboardLink: string;
}

export const TalentOnboardingWelcome = ({ 
  firstName, 
  dashboardLink 
}: TalentOnboardingWelcomeProps) => {
  return (
    <Html>
      <Body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Img 
            src="https://www.opslyhr.com/images/logocolored.png" 
            alt="OPSlyHR" 
            style={{ height: 48, marginBottom: 40 }}
          />
          
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#111827' }}>
            Welcome to the OPSlyHR Network
          </Text>
          
          <Text style={{ fontSize: 16, color: '#111827' }}>
            Hi {firstName},
          </Text>
          
          <Text style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
            We're excited to have you join the network of top talent and staffing professionals.
          </Text>
          
          <Button
            href={dashboardLink}
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              padding: '12px 32px',
              borderRadius: '8px',
              fontSize: 14,
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Complete Your Profile
          </Button>
        </Container>
      </Body>
    </Html>
  );
};

// Usage:
const html = render(<TalentOnboardingWelcome firstName="John" dashboardLink="https://..." />);
await emailService.send({ to: email, html });
```

---

## 🔗 Variable Replacement Utilities

### Helper Function

```typescript
function replaceEmailVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, value || '');
  }
  
  return result;
}

// Usage:
const html = replaceEmailVariables(template, {
  FIRST_NAME: 'John',
  DASHBOARD_LINK: 'https://app.opslyhr.com/onboarding',
});
```

### Validation Helper

```typescript
function validateTemplateVariables(
  template: string,
  providedVariables: string[]
): { missing: string[]; valid: boolean } {
  const regex = /\{\{(\w+)\}\}/g;
  const required = Array.from(template.matchAll(regex), m => m[1]);
  const missing = required.filter(v => !providedVariables.includes(v));
  
  return {
    missing,
    valid: missing.length === 0,
  };
}

// Usage:
const { valid, missing } = validateTemplateVariables(template, ['FIRST_NAME', 'DASHBOARD_LINK']);
if (!valid) {
  console.error(`Missing variables: ${missing.join(', ')}`);
}
```

---

## 📂 Project Structure

Recommended file organization:

```
src/
├── templates/
│   └── emails/
│       ├── talent-onboarding-welcome.html
│       ├── talent-job-offer.html
│       ├── talent-contract-review.html
│       ├── client-onboarding-welcome.html
│       ├── client-contract-signed.html
│       ├── client-invoice-generated.html
│       ├── password-reset.html
│       └── email-verification.html
├── lib/
│   ├── email/
│   │   ├── emailService.ts     (Already exists)
│   │   ├── triggers.ts         (Already exists)
│   │   └── templateUtil.ts     (New: template helpers)
│   └── utils.ts
└── ...
```

---

## 🧪 Testing Templates Locally

### Method 1: Preview in Browser

Convert HTML to a standalone file for preview:

```bash
# Copy template
cp email-templates/talent-onboarding-welcome.html /tmp/preview.html

# Open in browser
open /tmp/preview.html

# Edit variables manually for testing:
# Replace {{FIRST_NAME}} with "John" directly
```

### Method 2: Email Preview Service

Use a service like [Litmus](https://www.litmus.com/) or [Email on Acid](https://www.emailonacid.com/):

1. Copy template HTML
2. Paste into preview tool
3. Replace variables with test data
4. View rendering in different email clients

### Method 3: Send Test Email

```typescript
const testEmail = 'test@opslyhr.com';
const html = replaceEmailVariables(template, {
  FIRST_NAME: 'Test User',
  DASHBOARD_LINK: 'https://app.opslyhr.com/test',
});

await emailService.send({
  to: testEmail,
  subject: '[TEST] Welcome Email',
  html: html,
});
```

---

## ✅ Implementation Checklist

- [ ] Copy template HTML to src/templates/emails/
- [ ] Create template helper function
- [ ] Replace all {{VARIABLES}} with actual data
- [ ] Test template rendering in browser
- [ ] Send test email to yourself
- [ ] Verify rendering in Gmail, Outlook, mobile
- [ ] Test links are clickable and correct
- [ ] Verify images display properly
- [ ] Check mobile layout (480px)
- [ ] Validate color contrast for accessibility
- [ ] Enable email tracking (open/click) if needed
- [ ] Add send event to analytics/logging
- [ ] Document which email trigger uses this template

---

## 🔧 Common Implementation Issues

**Issue: {{VARIABLES}} not being replaced**
- Problem: Using wrong quote style or regex
- Solution: Use exact string match: `.replace('{{FIRST_NAME}}', value)`

**Issue: HTML rendering as plain text**
- Problem: Email service not handling HTML
- Solution: Ensure `html` parameter set (not `text`): `{ to, html, subject }`

**Issue: Images not displaying**
- Problem: Relative URLs or inaccessible domains
- Solution: Use absolute URLs with https://

**Issue: Mobile layout broken**
- Problem: Media queries not working in email client
- Solution: Test at actual width, add padding to buttons

**Issue: Links getting wrapped strangely**
- Problem: Long URLs with parameters
- Solution: Try shortening via URL shortener service

---

## 🎯 Next Steps

1. **Pick one template** to implement first (e.g., talent-onboarding-welcome.html)
2. **Create the helper function** to load and replace variables
3. **Find the trigger** in src/lib/email/triggers.ts
4. **Update the trigger** to use the new HTML template
5. **Test end-to-end** with actual signup flow
6. **Repeat for remaining templates**

---

## 📞 Questions?

Refer to:
- [EMAIL_DESIGN_GUIDE.md](EMAIL_DESIGN_GUIDE.md) — Brand specifications and design system
- [README.md](README.md) — Complete template documentation
- [src/lib/email/triggers.ts](../src/lib/email/triggers.ts) — Current email trigger implementations
- [src/lib/email/emailService.ts](../src/lib/email/emailService.ts) — Email sending service

---

**Last Updated:** April 1, 2026  
**Version:** 1.0
