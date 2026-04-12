# Paystack Integration Guide for Talent Connect Hub

This guide provides step-by-step instructions for setting up and configuring the Paystack payment gateway for course purchasing in OPSly Academy.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Paystack Account Setup](#paystack-account-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Schema](#database-schema)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Paystack integration enables students to purchase courses through a secure payment gateway. The system:

- Collects course enrollment details through a multi-step form
- Processes payments using Paystack (NGN currency)
- Creates enrollment records upon successful payment
- Sends confirmation emails with dashboard access
- Maintains complete transaction audit trail

**Payment Flow:**
```
Student fills form (3 steps)
    ↓
Reviews course & pricing (Step 4)
    ↓
Initiates Paystack checkout
    ↓
Paystack verifies payment
    ↓
Webhook receives success notification
    ↓
Enrollment activated & email sent
    ↓
Student gets dashboard access
```

---

## Prerequisites

Before beginning, ensure you have:

- ✅ Active Paystack account (register at https://paystack.com)
- ✅ Supabase project set up
- ✅ Node.js 18+ and npm installed locally
- ✅ Resend API key for email notifications
- ✅ Git access to deploy Supabase functions

---

## Paystack Account Setup

### 1. Create Paystack Account
Visit [https://paystack.com](https://paystack.com) and sign up for a free account.

### 2. Get Your API Keys
1. Log in to your Paystack dashboard
2. Go to **Settings → Developers**
3. Copy both keys:
   - **Public Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

⚠️ **Important:** Keep your secret key confidential! Never commit it to version control.

### 3. Test vs Live Mode
Paystack provides test keys for development:

**Test Mode:**
- Public Key: `pk_test_xxx...`
- Secret Key: `sk_test_xxx...`
- Use test card: `4084084084084081` (any expiry, any CVV)

**Live Mode:**
- Public Key: `pk_live_xxx...`
- Secret Key: `sk_live_xxx...`
- Process real transactions

---

## Environment Configuration

### 1. Local Development (.env.local)

Create/update `.env.local` in the project root:

```env
# Paystack (Test Mode for Development)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key

# Email Service
VITE_RESEND_API_KEY=re_your_resend_api_key

# Supabase (if needed)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Edge Functions Environment

Set environment variables in your Supabase project:

```bash
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your_key
npx supabase secrets set VITE_RESEND_API_KEY=re_your_key
```

Verify:
```bash
npx supabase secrets list
```

### 3. Production Deployment (.env.production)

For Vercel/production:

```env
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key
```

The secret key should be in Supabase secrets (never in Vercel env vars).

---

## Database Schema

### Created Tables

Two new tables support the payment system:

#### `academy_enrollments`
Tracks student course enrollments:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Supabase auth user ID |
| course_id | TEXT | Course identifier from catalog |
| course_name | TEXT | Display name |
| student_email | TEXT | Student's email |
| student_name | TEXT | Student's name |
| student_phone | TEXT | Contact phone |
| student_country | TEXT | Geographic location |
| enrollment_status | ENUM | active/pending_payment/completed/cancelled/suspended |
| price_usd | DECIMAL | Course price in USD |
| price_naira | DECIMAL | Course price in NGN |
| currency | TEXT | ISO currency code |
| enrollment_date | TIMESTAMP | When enrollment was created |
| access_granted_at | TIMESTAMP | When access was activated |

#### `course_transactions`
Records all payment attempts:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| enrollment_id | UUID | FK to academy_enrollments |
| user_id | UUID | Supabase auth user ID |
| paystack_reference | TEXT | Unique Paystack transaction reference |
| amount_naira | DECIMAL | Amount in NGN |
| amount_usd | DECIMAL | Amount in USD |
| currency | TEXT | Currency code (NGN/USD) |
| status | ENUM | pending/processing/success/failed/cancelled |
| paid_at | TIMESTAMP | When payment succeeded |
| failed_at | TIMESTAMP | When payment failed |
| failure_reason | TEXT | Error message if failed |
| created_at | TIMESTAMP | Transaction creation time |

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can view only their own records
- Admins can view all records
- Users can only insert their own records

---

## Supabase Functions

### 1. Paystack Webhook Handler
**File:** `supabase/functions/paystack-webhook/index.ts`

Receives and processes payment notifications from Paystack:

- Verifies webhook signature using HMAC-SHA512
- Updates transaction status to "success"
- Activates enrollment access
- No manual verification needed

**Webhook URL (to configure in Paystack):**
```
https://your-supabase-url/functions/v1/paystack-webhook
```

### 2. Send Enrollment Email
**File:** `supabase/functions/send-enrollment-email/index.ts`

Sends welcome email with course access:

- Triggered from webhook or directly
- Includes enrollment details
- Provides dashboard link
- Customizable template

---

## Testing

### 1. Local Testing

1. Start your dev server:
```bash
npm run dev
```

2. Navigate to a course detail page
3. Click "Enroll Now" → fills form → "Proceed to Payment"
4. On the payment step, enter test card: **4084084084084081**
5. Any expiry date and CVV

### 2. Verify Database Records

Check Supabase Studio:

```sql
-- View pending enrollments
SELECT * FROM academy_enrollments 
WHERE enrollment_status = 'pending_payment';

-- View all transactions
SELECT * FROM course_transactions 
ORDER BY created_at DESC LIMIT 10;
```

### 3. Webhook Testing (Local)

Use ngrok to test webhooks locally:

```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy forwarding URL, e.g., https://xxxx-xx-xxx-xxx-xx.ngrok.io
# Add to Paystack dashboard:
# Webhook URL: https://xxxx-xx-xxx-xxx-xx.ngrok.io/functions/v1/paystack-webhook
```

### 4. Test Scenarios

| Scenario | Card | Expected |
|----------|------|----------|
| Successful payment | 4084084084084081 | Enrollment activated |
| Insufficient funds | 4000000000000002 | Payment failed |
| Card expired | Use past date | Payment failed |

---

## Deployment

### 1. Deploy Supabase Functions

```bash
# Deploy webhook handler
npx supabase functions deploy paystack-webhook

# Deploy email function
npx supabase functions deploy send-enrollment-email

# View deployed functions
npx supabase functions list
```

### 2. Configure Paystack Webhook in Dashboard

1. Go to **Paystack Settings → Developers**
2. Find "Webhook" section
3. Add webhook URL:
   ```
   https://<your-supabase-project>.supabase.co/functions/v1/paystack-webhook
   ```
4. Leave "Custom header" empty (we verify via signature)
5. Click "Save"

### 3. Switch to Live Keys (When Ready)

1. Update Paystack keys in Supabase secrets
2. Update `VITE_PAYSTACK_PUBLIC_KEY` in Vercel environment variables
3. Test with real card

### 4. Configure Email Alerts

In Paystack dashboard → Notifications:
- Enable "Email notification" for successful payments
- Add notification email

---

## Integration Files Reference

### Frontend
- **ApplyForm.tsx** - 4-step enrollment form with payment integration
- **paystack.ts** - Payment utility functions and React hooks

### Backend
- **paystack-webhook** - Webhook handler (Supabase Edge Function)
- **send-enrollment-email** - Email notification (Supabase Edge Function)
- **migrations/academy_enrollments.sql** - Database schema

### Email Templates
- **enrollment-confirmation.html** - Welcome email

### Configuration
- **.env.local** - Development environment variables
- **supabase/config.toml** - Supabase CLI config (if using local dev)

---

## Troubleshooting

### Common Issues

#### 1. "Paystack public key not configured"
**Solution:** Add `VITE_PAYSTACK_PUBLIC_KEY=pk_test_...` to `.env.local`

#### 2. Payment button disabled/spinning indefinitely
**Causes:**
- Paystack script not loaded
- Network error
- Missing Vite/environment variable

**Solution:**
```javascript
// Check browser console
console.log(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY);
```

#### 3. Webhook not being called
**Solution:**
1. Check Paystack dashboard → "Webhook Test"
2. Verify webhook URL in Paystack settings
3. Check Supabase function logs: `npx supabase functions open paystack-webhook`

#### 4. Enrollment not activated after payment
**Causes:**
- RLS policy blocking updates
- Webhook signature verification failing

**Solution:**
1. Check webhook handler logs
2. Verify `PAYSTACK_SECRET_KEY` is set in Supabase
3. Re-test with test card

#### 5. Email not sent
**Causes:**
- Resend API key not configured
- Email function not deployed
- Resend quota exceeded

**Solution:**
```bash
# Check function deployment
npx supabase functions list

# Check logs (requires Supabase CLI)
npx supabase functions open send-enrollment-email
```

---

## Next Steps

### Enhancements to Consider

1. **Refunds & Dispute Handling**
   - Manual refund process via admin panel
   - Update enrollment status to "cancelled"

2. **Invoice Generation**
   - Create PDF invoices from enrollments
   - Archive in transaction records

3. **Access Control**
   - Membership dashboard showing active enrollments
   - Curriculum access gated by enrollment status

4. **Analytics**
   - Revenue tracking by course
   - Conversion funnel analysis
   - Enrollment growth metrics

5. **Payment Methods**
   - Add card storage for repeat payments
   - Implement subscription/payment plans

---

## Support

For issues:
1. Check Paystack docs: https://paystack.com/docs
2. Review Supabase logs
3. Check browser console for JavaScript errors
4. Test with Postman for webhook debugging

---

## Summary

✅ Paystack integration is now active for course purchases!

- Students can enroll in courses with secure payment
- Enrollments are tracked in database
- Confirmations sent via email
- Transaction history maintained for auditing
- Ready to handle real payments with live keys

**Next:** Update your Paystack dashboard webhook URL and switch to live keys when ready for production.
