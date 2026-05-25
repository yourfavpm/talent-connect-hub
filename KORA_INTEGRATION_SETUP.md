# Kora HQ Payment Integration - Setup Guide

## Overview

This document provides step-by-step instructions to complete the Kora HQ payment provider integration alongside Paystack.

## Current Implementation Status

✅ **Complete:**
- Frontend payment provider selector UI (Paystack vs Kora toggle)
- Kora payment service library (`src/lib/kora.ts`)
- Kora webhook handler (`supabase/functions/kora-webhook/index.ts`)
- Checkout component updated with provider branching logic
- Environment variables updated with Kora placeholders
- Database migration for kora_reference column support

⏳ **Pending User Action:**
1. Obtain Kora HQ API keys
2. Configure environment variables
3. Deploy webhook to Supabase
4. Register webhook URL with Kora HQ
5. Run database migration
6. Test end-to-end flow

---

## Step 1: Obtain Kora HQ API Keys

### Prerequisites
- Kora HQ merchant account active and verified
- Dashboard access at https://app.korahq.com

### Steps
1. Log in to Kora HQ Dashboard
2. Navigate to **Settings** → **API Keys** or **Developers** section
3. You'll need:
   - **Public Key** (for frontend - starts with `pk_` or similar)
   - **Secret Key** (for backend webhook verification - starts with `sk_` or similar)

### Get Test Keys
- During testing, use Kora's **test mode** keys
- Look for test/sandbox environment toggle in dashboard
- Never use production keys during development

---

## Step 2: Configure Local Environment Variables

### File: `.env` (Local Development)

Add these variables to your `.env` file:

```env
# Frontend (Vite)
VITE_KORA_PUBLIC_KEY="pk_test_YOUR_PUBLIC_KEY_HERE"

# Backend (Edge Functions)
KORA_SECRET_KEY="sk_test_YOUR_SECRET_KEY_HERE"
```

### File: `.env.local` (If present)

If you have a `.env.local` file for overrides, add:

```env
VITE_KORA_PUBLIC_KEY="pk_test_YOUR_PUBLIC_KEY_HERE"
KORA_SECRET_KEY="sk_test_YOUR_SECRET_KEY_HERE"
```

### Verification
After updating `.env`, restart your dev server:
```bash
npm run dev
```

Test that keys load:
1. Open browser console (F12)
2. Type: `import.meta.env.VITE_KORA_PUBLIC_KEY`
3. Should return your public key (not empty string)

---

## Step 3: Run Database Migration

This adds the `kora_reference` column to `course_transactions` table for storing Kora payment references.

### Option A: Using Supabase CLI (Recommended)

```bash
# From project root
npx supabase migration up

# Or specific migration
npx supabase migration up supabase/migrations/add_kora_support.sql
```

### Option B: Manual SQL in Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. **SQL Editor** → **New Query**
4. Copy-paste contents of `supabase/migrations/add_kora_support.sql`
5. Run query

### Verification Query
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'course_transactions' 
AND column_name IN ('paystack_reference', 'kora_reference');
```

Should return:
```
paystack_reference | text
kora_reference     | text
```

---

## Step 4: Deploy Kora Webhook to Supabase

The webhook handler is located at: `supabase/functions/kora-webhook/index.ts`

### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Logged in: `supabase login`
- Project linked: `supabase link --project-ref YOUR_PROJECT_REF`

### Deployment Steps

1. **Set backend secret in Supabase:**
   ```bash
   npx supabase secrets set KORA_SECRET_KEY="sk_test_YOUR_SECRET_KEY"
   ```

2. **Deploy webhook function:**
   ```bash
   npx supabase functions deploy kora-webhook
   ```

3. **Verify deployment:**
   ```bash
   npx supabase functions list
   ```
   
   You should see `kora-webhook` in the list with status `active`.

### Get Your Webhook URL

The deployed webhook URL will be:
```
https://{PROJECT_ID}.supabase.co/functions/v1/kora-webhook
```

Where `{PROJECT_ID}` is your Supabase project ID (visible in dashboard URL or project settings).

**Example:** `https://pqtzoujyxaawjqbhpnus.supabase.co/functions/v1/kora-webhook`

---

## Step 5: Register Webhook with Kora HQ

### In Kora HQ Dashboard

1. Navigate to **Settings** → **Webhooks** or **Integrations**
2. **Add New Webhook** or **Configure Webhook**
3. Fill in the form:

   | Field | Value |
   |-------|-------|
   | **Webhook URL** | `https://{PROJECT_ID}.supabase.co/functions/v1/kora-webhook` |
   | **Events** | Select: `charge.success`, `charge.failed` (or `payment.success`, `payment.failed`) |
   | **Secret/Signature Key** | Your `KORA_SECRET_KEY` from Step 4 |
   | **Active** | Toggle ON ✅ |

4. **Save** and note the webhook ID

### Test Webhook Delivery

1. In Kora dashboard, find **Test Webhook** or **Send Test Event**
2. Select `charge.success` event
3. Check Supabase function logs to verify receipt:
   ```bash
   npx supabase functions download kora-webhook
   supabase functions logs kora-webhook --limit 100
   ```

---

## Step 6: Test End-to-End Flow

### Local Testing (Sandbox/Test Mode)

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to checkout:**
   - Go to an academy course page
   - Click "Enroll" or "Checkout"
   - Select a cohort

3. **Test Kora Payment:**
   - Proceed to payment step
   - **Select "Kora HQ"** payment provider (new UI toggle)
   - Click "Pay ₦..." button
   - Complete test payment in Kora modal or redirect

4. **Verify Success Flow:**
   - After payment, should see success screen
   - Check email for enrollment confirmation
   - Verify database:
     ```sql
     SELECT * FROM course_transactions 
     WHERE kora_reference IS NOT NULL 
     ORDER BY created_at DESC LIMIT 1;
     ```

5. **Check Webhook Logs:**
   ```bash
   npx supabase functions logs kora-webhook --limit 50
   ```
   Should show successful webhook processing

### Test Scenarios

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| **Successful Payment** | Complete payment flow | Transaction marked `paid`, enrollment created, email sent |
| **Failed Payment** | Initiate payment, cancel or use failed test card | Transaction marked `failed`, enrollment not created |
| **Webhook Verification** | Monitor logs during payment | Signature verification passes, enrollment updates via webhook |
| **Missing Key** | Remove `VITE_KORA_PUBLIC_KEY`, try payment | Falls back to Paystack, logs warning |

---

## Step 7: Transition to Production

### Before Going Live

1. **Obtain Production Keys** from Kora HQ
2. **Update Supabase Secrets:**
   ```bash
   npx supabase secrets set KORA_SECRET_KEY="sk_live_YOUR_PRODUCTION_KEY"
   ```

3. **Update Environment Variables:**
   - Set `VITE_KORA_PUBLIC_KEY` in your production deployment (Vercel, Netlify, etc.)
   - Example for Vercel: Add to **Settings** → **Environment Variables**

4. **Register Production Webhook** with Kora HQ using production secret key

5. **Test Production Flow:**
   - Make test transaction on production site
   - Verify webhook delivery
   - Check transaction in Kora dashboard

### Verification Checklist

- [ ] Kora public key set in frontend environment
- [ ] Kora secret key set in Supabase secrets
- [ ] Webhook deployed and active
- [ ] Webhook URL registered in Kora HQ dashboard
- [ ] Database migration applied
- [ ] Test transaction completed successfully
- [ ] Email confirmations working
- [ ] Webhook signature verification passing
- [ ] Database transactions recorded with `kora_reference`

---

## Troubleshooting

### Issue: "Kora key missing or empty"

**Cause:** `VITE_KORA_PUBLIC_KEY` not set or empty string

**Solution:**
1. Verify `.env` file has public key
2. Restart dev server (Vite caches env vars)
3. Check browser console: `import.meta.env.VITE_KORA_PUBLIC_KEY`

### Issue: Webhook not receiving events

**Cause:** URL not registered in Kora dashboard or signature mismatch

**Solution:**
1. Verify webhook URL in Kora dashboard settings
2. Check secret key matches: `KORA_SECRET_KEY` in Supabase secrets
3. View logs: `npx supabase functions logs kora-webhook`
4. Try "Send Test Event" from Kora dashboard

### Issue: Transaction not appearing in database

**Cause:** Migration not applied or webhook error

**Solution:**
1. Verify migration ran: Check `course_transactions` has `kora_reference` column
2. Check webhook logs for errors
3. Verify metadata passed correctly from checkout

### Issue: Signature verification failing

**Cause:** Wrong secret key or header name mismatch

**Solution:**
1. Verify `KORA_SECRET_KEY` is set in Supabase secrets
2. Check webhook handler accepts header variations:
   - `x-kora-signature`
   - `x-kora-sign`
   - `signature`
3. Test with Kora's test webhook event

### Issue: Email not sent after payment

**Cause:** Edge function `send-email` not deployed or template missing

**Solution:**
1. Verify `send-email` function exists: `npx supabase functions list`
2. Check email template `academy_enrollment_success` exists in database
3. View error logs: `npx supabase functions logs send-email`

---

## Architecture Overview

### Payment Flow

```
User Checkout → Provider Selection (Paystack/Kora) → 
Payment Modal/Redirect → Payment Complete → 
Webhook Verification → Database Update → 
Email Confirmation → Success Screen
```

### Database Changes

- **Table:** `course_transactions`
- **New Column:** `kora_reference` (TEXT, UNIQUE)
- **New Index:** `idx_course_transactions_kora_ref`

### Environment Setup

| Environment | Variable | Purpose |
|-------------|----------|---------|
| Frontend | `VITE_KORA_PUBLIC_KEY` | Initialize Kora SDK |
| Backend | `KORA_SECRET_KEY` | Webhook signature verification |

---

## API Reference

### Kora Service (`src/lib/kora.ts`)

```typescript
const kora = new KoraService({ publicKey: 'pk_...' });

await kora.initializePayment({
    amount: 50000,        // Amount in kobo (₦500)
    email: 'user@example.com',
    reference: 'ENR_1234567890_abc123',
    metadata: { /* object */ },
    onSuccess: (response) => { /* handle success */ },
    onClose: () => { /* handle close */ }
});

// Or verify payment server-side
const verified = await kora.verifyKoraPayment('kora_ref_123', 'sk_...');
```

### Webhook Handler (`supabase/functions/kora-webhook/index.ts`)

- **Endpoint:** `POST /functions/v1/kora-webhook`
- **Events:** `charge.success`, `charge.failed`, `payment.success`, `payment.failed`
- **Signature:** Verified using HMAC-SHA256 or HMAC-SHA512
- **Response:** `{ success: true }` on valid event, `{ error: string }` on failure

---

## Support & Documentation

- **Kora HQ Docs:** https://korahq.com/docs (when available)
- **Supabase Functions:** https://supabase.com/docs/guides/functions
- **Paystack Reference:** See `PAYSTACK_INTEGRATION_GUIDE.md` for parallel architecture

---

## Summary

After completing these steps:

1. ✅ Users can select between Paystack and Kora HQ during checkout
2. ✅ Both providers use identical enrollment and email flows
3. ✅ Webhooks automatically update transaction status and trigger confirmations
4. ✅ Database supports both payment references (paystack_reference, kora_reference)
5. ✅ Guest checkout works seamlessly with both providers
6. ✅ Fallback to Paystack if Kora keys missing

**Next Action:** Provide your Kora HQ API keys, and integration will be complete!

