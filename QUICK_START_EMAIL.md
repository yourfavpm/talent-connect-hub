# ⚡ Quick Start: Email in 11 Minutes

## ✅ Pre-requisites
- [ ] `.env` file has `VITE_RESEND_API_KEY` ✓ (You have this!)
- [ ] Node.js installed
- [ ] Supabase CLI (will install if needed)

---

## 🚀 Step 1: Start Supabase (5 min)

```bash
cd /Users/Benita/development/taskivehr/talent-connect-hub
supabase start
```

**Wait for:**
```
✓ Started Supabase local development setup
```

**⚠️ First time?** Will download Docker containers (~2-3 min)

**Stuck?** Try:
```bash
brew install supabase/tap/supabase
```

---

## 📤 Step 2: Deploy Function (2 min)

```bash
# Keep the same terminal, same directory
supabase functions deploy send-email
```

**You should see:**
```
✓ Function send-email deployed
```

---

## 💨 Step 3: Run Your App (1 min)

```bash
# NEW TERMINAL, same directory
npm run dev
```

**You should see:**
```
➜  Local:   http://localhost:5173/
```

---

## 📧 Step 4: Test Email (3 min)

1. Open: http://localhost:5173/auth/signup

2. Sign up:
   - Role: "I am a Talent" ↵
   - First Name: `Test` ↵
   - Last Name: `User` ↵
   - Email: `YOUR-REAL-EMAIL@gmail.com` ↵ (IMPORTANT: Use real email!)
   - Password: `Secure123!` ↵
   - Click "Create Account"

3. Open **DevTools** (F12) → **Console** tab

4. Look for this message:
   ```
   Email queued: HTML template to YOUR-EMAIL@gmail.com
   ```
   (Or the old message if fallback is used)

5. **Check your email** (wait ~30 seconds)
   - From: `hire@opslyhr.com`
   - Subject: `Welcome to OPSlyHR, Test!`
   - **NEW: Email now has branded design!** 🎨
     - OPSlyHR logo
     - Green "Complete Your Profile" button
     - Professional formatted layout
     - Mobile-responsive design

---

## ✅ Success Indicators

| Indicator | Status |
|-----------|--------|
| Supabase running | `supabase start` shows ready |
| Function deployed | `supabase functions deploy send-email` succeeds |
| App running | http://localhost:5173 loads |
| Console message | "Email queued: ..." appears |
| Email received | Arrives in inbox |

---

## ❌ Troubleshooting

### "Supabase not found"
```bash
npm install -g supabase
supabase start
```

### "Console shows: Email queued: ..." but no email arrives
**Check:** Has 30 seconds passed? Check spam folder and promotions tab.

### "No 'Email queued' message in console"
1. Open **Console tab** again (not Network tab)
2. Try signing up again
3. Look for any **errors in red**

### "Edge function error"
Run:
```bash
supabase functions logs send-email --follow
```
Shows real-time logs. Look for error message and report it.

---

## 📊 Test Suite (Optional)

Quick verify without running app:
```bash
npm run test:email
```

Should show: ✓ 9 passed (email triggers)

---

## 🎯 What Works Now

After completing this checklist, you have:

✅ Email triggers (33+ types of emails available)
✅ Email templates (39 templates in database)
✅ Email service (Resend integration)
✅ Edge function (serverless email processor)
✅ Email logging (track all sends)
✅ All tests passing (17/17 ✓)

---

## 📚 Full Documentation

See: `EMAIL_SETUP.md` for:
- Production deployment
- All email triggers available
- Template list
- Advanced configuration
- Troubleshooting guide

**NEW:** See `HTML_TEMPLATES_INTEGRATION_COMPLETE.md` for:
- Branded HTML template integration details
- Design verification checklist
- Testing guide for new templates

---

## ⏱️ Timing

- **1st time setup:** ~11 minutes
- **Next time:** Just run `supabase start` → `npm run dev` → Test
- **Each email test:** ~30 seconds (send + receive)

---

## 🎓 What's Happening

```
You sign up
    ↓
"Email queued" message
    ↓
Your browser sends to Supabase Edge Function
    ↓
Function calls Resend API
    ↓
Resend sends email
    ↓
You receive email in inbox
```

---

## ✨ Next Steps After This Works

1. **Test other email types:**
   - Sign up as Client
   - Try contract signing
   - Try offer creation

2. **Production setup:**
   - Read EMAIL_SETUP.md "Production" section
   - Set secrets in Supabase Cloud dashboard
   - Deploy function to production

3. **Integration:**
   - Use email triggers throughout your app
   - All functions pre-built and ready to use!

---

## 🆘 Need Help?

<details>
<summary><b>Click to expand common issues</b></summary>

### Issue: "Email not received"
- Check **Spam folder** (emails are being sent!)
- Wait **30+ seconds**
- Check **Console** shows "Email queued: ..."

### Issue: "supabase command not found"
```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

### Issue: "Docker error"
Make sure Docker is running, then:
```bash
supabase start
```

### Issue: "RESEND_API_KEY error"
Check your `supabase/.env.local` has the key:
```bash
cat supabase/.env.local
```
Should show: `RESEND_API_KEY=re_aW413BaF_...`

</details>

---

Enjoy! 🎉 Your email system is ready!
