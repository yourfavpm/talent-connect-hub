# Email Integration Testing Guide

This guide covers how to test the email integration in your OPSlyHR platform.

## Quick Start

### Run All Tests
```bash
npm test
```

### Run Email-Specific Tests
```bash
npm run test:email
```

### Run Integration Tests
```bash
npm run test:integration
```

### View Tests in UI
```bash
npm run test:ui
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Structure

### 1. **Unit Tests** (`src/test/emailService.test.ts`)
Tests the core email service functionality:
- Queueing emails
- Template rendering with variables
- Error handling for missing templates
- Email logging

### 2. **Trigger Tests** (`src/test/triggers.test.ts`)
Tests all email trigger functions:
- `sendTalentWelcomeEmail` - New talent signup
- `sendClientWelcomeEmail` - New client signup
- `sendTalentOfferEmail` - Job offer to talent
- `sendClientContractReadyEmail` - Contract ready notification
- `sendTalentContractSignedEmail` - Talent signing confirmation
- `sendClientContractSignedEmail` - Client signing confirmation
- `sendAdminContractFullySignedEmail` - Both parties signed
- `sendClientInvoiceGeneratedEmail` - Invoice notification

### 3. **Integration Tests** (`src/test/integration.test.ts`)
Tests complete workflows:
- Contract signing flow (5 email steps)
- Signup and vetting flow
- Invoice and payment flow
- Email status tracking

## Manual Testing Guide

### Prerequisites
1. Create a test Resend API key at [resend.com](https://resend.com)
2. Add to `.env`:
   ```
   VITE_RESEND_API_KEY=your_actual_api_key
   VITE_EMAIL_FROM=hire@opslyhr.com
   VITE_EMAIL_FROM_NAME=OPSlyHR
   VITE_APP_URL=http://localhost:5173
   ```

### Test Email Delivery

#### 1. Test Talent Sign-up Email
1. Navigate to `http://localhost:5173/auth/signup`
2. Select "I am a Talent" option
3. Fill in the form with test details
4. Submit the form
5. Check your email inbox for welcome email (may take 30 seconds)
6. Verify email contains:
   - Welcome message with talent name
   - Login link
   - OPSlyHR branding

#### 2. Test Client Sign-up Email
1. Navigate to `http://localhost:5173/auth/signup`
2. Select "I am a Client" option
3. Fill in the company information
4. Submit the form
5. Check your email inbox for welcome email
6. Verify email contains:
   - Company name
   - Welcome message
   - Login link

#### 3. Test Contract Offer Email
1. Login as admin
2. Navigate to Admin > Offers
3. Create a new offer for a talent
4. The talent should receive an email with:
   - Job title
   - Client company name
   - Rate information
   - Start date
   - Link to view offer

#### 4. Test Contract Signing Emails
1. Login as talent
2. Go to Contracts
3. Accept and sign a pending contract
4. You should receive a confirmation email
5. Login as client
6. Go to Contracts
7. Sign the same contract
8. You should receive a confirmation email
9. Admin should receive a notification that contract is fully signed

### Debugging Email Issues

#### Check Email Status in Database
```sql
-- View sent emails
SELECT * FROM public.email_logs 
ORDER BY sent_at DESC 
LIMIT 20;

-- View email templates
SELECT * FROM public.email_templates 
WHERE status = 'active';
```

#### Check Email Service Logs
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors from emailService
4. Check Network tab for Resend API calls

#### Common Issues

| Issue | Solution |
|-------|----------|
| "Email not sending" | Check VITE_RESEND_API_KEY in .env |
| "Email marked as spam" | Update sender email domain in Resend |
| "Template variables not rendering" | Check variable names in emailService.ts |
| "Database migration not applied" | Run `supabase migration up` |

## Monitoring Email Delivery

### Email Logs Dashboard
The system logs all email attempts in the `email_logs` table with:
- Recipient email
- Template used
- Status (sent, failed, bounced)
- Resend provider ID (for tracking)
- Error messages if failed

### Email Template Management
View active templates:
```sql
SELECT template_key, subject, status 
FROM public.email_templates 
WHERE status = 'active'
ORDER BY template_key;
```

Update a template:
```sql
UPDATE public.email_templates 
SET body_html = '<new template html>'
WHERE template_key = 'talent_welcome';
```

## Email Templates Available

1. **talent_welcome** - Welcome email sent to new talent
2. **client_welcome** - Welcome email sent to new clients
3. **talent_offer_received** - Job offer notification
4. **client_contract_ready** - Contract ready for signature
5. **talent_contract_signed** - Talent signature confirmation
6. **client_contract_signed** - Client signature confirmation
7. **admin_contract_fully_signed** - All parties signed notification
8. **client_invoice_generated** - Invoice notification
9. **admin_invoice_overdue** - Invoice overdue alert
10. **client_payment_received** - Payment confirmation

## Best Practices

1. **Test in Development First**
   - Always test with your own email address first
   - Use Resend test API key if available
   - Check email logs in database

2. **Monitor Production Emails**
   - Set up alerts for high failure rates
   - Keep records of important email sending
   - Monitor bounce and complaint rates

3. **Email Security**
   - Never commit API keys to git
   - Use environment variables
   - Rotate API keys regularly
   - Test with realistic data

4. **Variable Naming**
   - Use consistent variable names across templates
   - Document required variables for each template
   - Validate variables before sending

## Troubleshooting Guide

### Test is failing with "Cannot find module '@/integrations/supabase/client'"
- Ensure path alias is configured in `vite.config.ts` and `vitest.config.ts`
- Clear `node_modules` and reinstall: `npm install`

### Email not being sent in manual tests
- Check .env file has valid VITE_RESEND_API_KEY
- Ensure database migration has been applied
- Check email_templates table has templates with status='active'
- Look for errors in browser console

### Template variables showing as {{variable}} instead of actual values
- Check variable names match between triggers.ts and templates.ts
- Verify emailService properly renders templates
- Check database templates have correct variable format

## CI/CD Integration

Add to your CI/CD pipeline:
```bash
# Run tests before deploy
npm test

# Run coverage check
npm run test:coverage

# Only deploy if tests pass
```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Resend Documentation](https://resend.com/docs)
- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#migrations)
- [Email Best Practices](https://resend.com/docs/concepts/introduction)
