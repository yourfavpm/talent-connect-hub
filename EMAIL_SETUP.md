# Email System Setup Guide

## Overview

The email system uses:
- **Supabase Edge Functions** - Server-side email service (runs your code securely)
- **Resend API** - Email delivery service
- **Email Templates** - Stored in Supabase database

## Quick Start

### ✅ What's Already Done

1. ✓ Email trigger functions created (`src/lib/email/triggers.ts`)
2. ✓ Email service configured (`src/lib/email/emailService.ts`)
3. ✓ Edge Function code ready (`supabase/functions/send-email/index.ts`)
4. ✓ Email templates seeded in database
5. ✓ Tests passing (17/17 ✅)
6. ✓ Supabase secrets file created (`supabase/.env.local`)

### 🚀 How to Enable Email

#### For Local Development

**Step 1: Start Supabase**
```bash
cd /Users/Benita/development/taskivehr/talent-connect-hub

# First time setup (creates local Supabase instance)
supabase start

# You should see:
# - Supabase running at http://localhost:54321
# - API Key: [key]
# - DB Password: [password]
```

**Step 2: Deploy the Edge Function Locally**
```bash
supabase functions deploy send-email
```

**Step 3: Start the App**
```bash
# In a new terminal
npm run dev
```

**Step 4: Test Email**
1. Navigate to http://localhost:5173/auth/signup
2. Sign up with a test email (use a real email you can check, like Gmail)
3. Open DevTools (F12) and go to Console tab
4. You should see: `Email queued: talent_onboarding_welcome to your-email@gmail.com`
5. Check your email inbox (may take 30 seconds)

---

#### For Production (Supabase Cloud)

**Step 1: Set Supabase Secrets**

Go to: https://app.supabase.com/project/pqtzoujyxaawjqbhpnus/settings/secrets

Click "New secret" for each:

1. **Name**: `RESEND_API_KEY`
   - **Value**: `re_aW413BaF_KuaZvWDENGcACMLavprHW4RL`

2. **Name**: `EMAIL_FROM`
   - **Value**: `hire@opslyhr.com`

3. **Name**: `EMAIL_FROM_NAME`
   - **Value**: `OPSlyHR`

**Step 2: Deploy Edge Function**

Go to: https://app.supabase.com/project/pqtzoujyxaawjqbhpnus/functions

1. Click on `send-email` function
2. Click "Deploy"
3. Wait for status to show "✓ Active"

**Step 3: Verify Templates**

Go to: https://app.supabase.com/project/pqtzoujyxaawjqbhpnus/sql/new

Run this query:
```sql
SELECT COUNT(*) as template_count 
FROM public.email_templates 
WHERE status = 'active';
```

Should return: `template_count: 39` (or similar, > 0)

**Step 4: Test in Production**

1. Go to your app (https://your-domain.com or production URL)
2. Sign up with a test email
3. Wait for email to arrive
4. To debug: Check Supabase function logs

---

## Troubleshooting

### ❌ "Email not sending"

**Check 1: Verify Secrets Are Set**
```bash
# From your project directory
curl -H "Authorization: Bearer YOUR-SERVICE-ROLE-KEY" \
  https://pqtzoujyxaawjqbhpnus.supabase.co/functions/send-email \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Check 2: Test the Edge Function**
- Supabase Dashboard → Functions → send-email → Test tab
- Send a test request with:
  ```json
  {
    "templateKey": "talent_onboarding_welcome",
    "to": "your-email@gmail.com",
    "toName": "Test User",
    "variables": {
      "first_name": "Test",
      "profile_link": "http://localhost:5173/talent/onboarding"
    }
  }
  ```

**Check 3: Review Function Logs**
- Supabase Dashboard → Functions → send-email → Logs tab
- Look for errors like:
  - `RESEND_API_KEY is not configured` → Set secrets (see above)
  - `Email template not found` → Seed templates (run migrations)
  - Resend API errors → Check API key is valid

### ❌ "Template not found"

**Solution**: Check if templates are seeded

```sql
SELECT template_key, name, status 
FROM public.email_templates 
WHERE status = 'active'
LIMIT 5;
```

If count is 0:
1. Go to SQL Editor
2. Run migrations:
   - `supabase/migrations/20260310000000_create_email_tables.sql`
   - `supabase/migrations/20260331000000_add_vetting_email_templates.sql`
   - `supabase/migrations/20260401001000_comprehensive_email_templates.sql`

### ❌ "No error, but email not arriving"

**Check**: Email logs in database

```sql
SELECT recipient_email, template_key, status, error_message, created_at 
FROM public.email_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

Look for:
- Status = `'sent'` ✓ (email was sent successfully)
- Status = `'failed'` ❌ (check error_message)

**If `status = 'failed'`**, common reasons:
- Invalid email address
- Email blacklisted by Resend
- Resend API issues

Check Resend dashboard: https://dashboard.resend.com

---

## Email Templates Available

All templates are stored in `public.email_templates`:

### Talent Portal (16 templates)
- `talent_onboarding_welcome` - Sign up welcome
- `talent_vetting_submitted` - Vetting submitted
- `talent_vetting_approved` - Vetting approved
- `talent_vetting_changes_requested` - Changes needed
- `talent_job_offer` - Job offer received
- `talent_contract_signed` - Contract signed
- And 10+ more...

### Client Portal (13 templates)
- `client_onboarding_welcome` - Sign up welcome
- `client_contract_ready` - Contract ready to sign
- `client_contract_signed` - Contract signed
- `client_invoice_generated` - Invoice generated
- And 9+ more...

### Admin Portal (10 templates)
- `admin_vetting_submission` - New vetting
- `admin_contract_fully_signed` - Both parties signed
- And 8+ more...

---

## How Email Flows Through the System

1. **User Action** → Sign up, offer acceptance, contract signature, etc.
2. **Trigger Called** → e.g., `sendTalentWelcomeEmail()`
3. **Email Queued** → `queueEmail()` sends to Edge Function
4. **Edge Function Processes** → Fetches template from DB, renders variables
5. **Resend Sends** → Edge Function calls Resend API
6. **Logged** → Success/failure logged to `email_logs` table
7. **User Receives** → Email arrives in inbox

---

## File Structure

```
├── src/
│   ├── lib/email/
│   │   ├── emailService.ts       # Main email service
│   │   ├── triggers.ts           # Email trigger functions
│   │   └── templates.ts          # (Optional) Template definitions
│   ├── test/
│   │   ├── emailService.test.ts  # Email service tests
│   │   └── triggers.test.ts      # Email trigger tests
│
├── supabase/
│   ├── functions/
│   │   └── send-email/
│   │       └── index.ts          # Edge Function code
│   ├── migrations/
│   │   ├── 20260310000000_create_email_tables.sql
│   │   ├── 20260331000000_add_vetting_email_templates.sql
│   │   └── 20260401001000_comprehensive_email_templates.sql
│   └── .env.local               # Secrets for local development
│
├── scripts/
│   └── setup-email.sh           # Setup script (automated)
│
└── .env                         # Your app config (has VITE_RESEND_API_KEY)
```

---

## Testing Email Without Supabase

You can test the email trigger functions in isolation:

```bash
npm run test:email
```

This runs all email-related tests without needing Supabase running.

---

## Environment Variables

### Client-Side (.env)
```
VITE_RESEND_API_KEY=re_aW413BaF_KuaZvWDENGcACMLavprHW4RL
VITE_EMAIL_FROM=hire@opslyhr.com
VITE_EMAIL_FROM_NAME=OPSlyHR
VITE_APP_URL=http://localhost:5173
VITE_SUPABASE_URL=https://pqtzoujyxaawjqbhpnus.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

### Server-Side (Supabase Secrets)
```
RESEND_API_KEY=re_aW413BaF_KuaZvWDENGcACMLavprHW4RL
EMAIL_FROM=hire@opslyhr.com
EMAIL_FROM_NAME=OPSlyHR
```

---

## Common Email Trigger Functions

```typescript
// Auth emails
await sendTalentVerificationEmail(email, firstName, verificationLink);
await sendTalentPasswordResetEmail(email, firstName, resetLink);

// Onboarding
await sendTalentWelcomeEmail({ email, firstName });
await sendClientWelcomeEmail({ email, contactName, companyName });

// Vetting
await sendVettingSubmittedEmail({ email, firstName });
await sendVettingApprovedEmail({ email, firstName });
await sendVettingRejectedEmail({ email, firstName, rejectionReasons });

// Job & Offers
await sendTalentOfferEmail({ talentEmail, talentName, clientName, jobTitle, rate, startDate, offerId });
await sendTalentApplicationShortlistedEmail({ email, firstName, jobTitle });

// Contracts
await sendTalentContractSignedEmail({ talentEmail, talentName, contractId, startDate });
await sendClientContractSignedEmail({ clientEmail, clientName, talentName, contractId });
await sendAdminContractFullySignedEmail({ adminEmail, contractId, clientName, talentName });

// Timesheets
await sendTimesheetApprovedEmail({ email, firstName, periodEnd });
await sendTimesheetRejectedEmail({ email, firstName, periodEnd, reason });

// Invoices & Payment
await sendClientPaymentReceiptEmail({ email, clientName, amount, invoiceNumber });
```

---

## Next Steps

1. **Set Up Secrets** (see Production section)
2. **Deploy Function** (see Production section)
3. **Test Locally** (see Local Development section)
4. **Monitor Logs** (Supabase Dashboard → Functions)
5. **Check Deliverability** (Resend Dashboard)

---

## Questions?

- **Resend API Docs**: https://resend.com/docs
- **Supabase Functions**: https://supabase.com/docs/guides/functions
- **Email Templates Config**: Check `supabase/migrations/` files
