# Production Configuration Guide

To ensure the custom email verification links and redirects work correctly in your production environment, follow these steps.

## 1. Supabase Auth Configuration

Supabase needs to know which domains are "safe" to redirect to.

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project: `pqtzoujyxaawjqbhpnus`.
3. Navigate to **Authentication > Settings**.
4. Scroll to the **URI Configuration** section:
   - **Site URL**: Set this to your production domain (e.g., `https://app.opslyhr.com`).
   - **Redirect URLs**: Add any subdomains or localhost entries you use for development.

## 2. Edge Function Secrets

The `auth-verification` function uses an `APP_URL` environment variable to build the verification links.

> [!IMPORTANT]
> You must set this secret using the Supabase CLI or Dashboard.

### Via CLI:
Run this command from your terminal:
```bash
npx supabase secrets set APP_URL=https://app.opslyhr.com
```

### Via Dashboard:
1. Navigate to **Settings > API**.
2. Find the **Secrets** section.
3. Add a new secret:
   - **Name**: `APP_URL`
   - **Value**: `https://app.opslyhr.com`

## 3. Environment Variables (Frontend)

In your production deployment (e.g., Vercel, Netlify, or VPS), ensure you have the following `.env` variable set:

```env
VITE_APP_URL=https://app.opslyhr.com
```

## 4. Verification Check

Once set, try signing up with a fresh account in production.
1. You should land on the `/auth/check-email` page.
2. The email you receive should contain a link starting with `https://pqtzoujyxaawjqbhpnus.supabase.co/functions/v1/auth-verification/verify?token=...`.
3. Clicking that link should redirect you to `https://app.opslyhr.com/auth/verify-email?status=success`.
