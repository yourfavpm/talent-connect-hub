# Comprehensive Runtime Analysis - White Blank Screen Crash Issues

## Executive Summary
Analyzed the workspace for potential runtime issues causing white blank screen crashes. Found **CRITICAL** and **MAJOR** issues that need immediate attention.

---

## 🔴 CRITICAL ISSUES

### 1. **Missing Error Boundary Component**
**Severity:** CRITICAL
**Location:** [src/App.tsx](src/App.tsx)

**Issue:**
- The entire application has **NO ERROR BOUNDARY** to catch and display React rendering errors
- If any component throws an error during render, React will show a blank white screen
- This is the most common cause of white screen crashes in React apps

**Impact:**
- Any component with a syntax error, failed import, or runtime error will silently crash the entire app
- Users see a completely blank screen with no error message
- No recovery mechanism

**Evidence:**
```tsx
// App.tsx currently has:
<Suspense fallback={...}>
  <Routes>
    {/* Routes that can crash silently */}
  </Routes>
</Suspense>
```

**Solution:**
Create an Error Boundary component and wrap the main app content:

```tsx
import React from 'react';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          backgroundColor: '#fff',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#666' }}>{this.state.error?.message}</p>
          <button onClick={() => window.location.href = '/'}>
            Return Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

Then wrap in App:
```tsx
<ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    {/* ... rest of app ... */}
  </QueryClientProvider>
</ErrorBoundary>
```

---

### 2. **Missing Client-Side Unhandled Rejection Handler**
**Severity:** CRITICAL
**Location:** [src/main.tsx](src/main.tsx)

**Issue:**
- No handler for unhandled promise rejections
- If any async operation (fetch, database query, etc.) rejects without a catch, it silently fails
- User sees nothing - just a blank screen

**Evidence:**
- The `main.tsx` file only contains the React mount, no error handlers
- No `window.addEventListener('unhandledrejection', ...)` handler
- No `window.onerror` handler

**Solution:**
Add to [src/main.tsx](src/main.tsx):

```tsx
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global unhandled rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Could also send to error tracking service
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

createRoot(document.getElementById("root")!).render(<App />);
```

---

### 3. **Supabase Client Initialization Without Error Handling**
**Severity:** MAJOR
**Location:** [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts)

**Issue:**
- Missing environment variable validation before creating Supabase client
- If `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` are undefined, the client will fail silently
- No error thrown, just a broken client passed to the app

**Evidence:**
```tsx
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// No validation! If these are undefined, createClient fails silently
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
```

**Solution:**
```tsx
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in .env'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  // ... config
});
```

---

## 🟠 MAJOR ISSUES

### 4. **AuthProvider Missing Error Handling in useEffect**
**Severity:** MAJOR
**Location:** [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx) - Lines 76-95

**Issue:**
- The `supabase.auth.getSession()` promise chain doesn't have error handling
- If Supabase auth service fails, the app stays in loading state indefinitely
- User sees loading spinner then nothing

**Evidence:**
```tsx
// No try-catch around this promise chain
supabase.auth.getSession().then(async ({ data: { session } }) => {
  setSession(session);
  setUser(session?.user ?? null);
  if (session?.user) {
    await fetchUserRole(session.user.id);
  }
  setLoading(false);
});
// Missing: .catch() handler
```

**Solution:**
```tsx
supabase.auth.getSession()
  .then(async ({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      await fetchUserRole(session.user.id);
    }
    setLoading(false);
  })
  .catch((error) => {
    console.error("Error getting session:", error);
    setLoading(false);
    // User will see login screen as fallback
  });
```

---

### 5. **ProtectedRoute Silent Failures**
**Severity:** MAJOR  
**Location:** [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx)

**Issue:**
- Multiple `window.location.href` assignments without error handling
- If the redirect URL generation fails or network is slow, pages might not redirect properly
- Role loading could hang indefinitely if `fetchUserRole()` times out

**Evidence:**
```tsx
// Multiple hard redirects without validation
window.location.href = getZoneUrl(Zone.TALENT, "/dashboard");  // Line 43
window.location.href = getZoneUrl(Zone.CLIENT, "/dashboard");  // Line 47
window.location.href = getZoneUrl(Zone.ADMIN, "/dashboard");   // Line 51
```

**Potential Issue in useAuth:**
```tsx
// If fetchUserRole never completes, roleLoading stays true forever
if (needsRoleForAccess && roleLoading) {
  return <div>...Loading...</div>; // Stuck forever if fetchUserRole hangs
}
```

**Solution:**
Add timeout to role fetching:
```tsx
const fetchUserRole = async (userId: string) => {
  if (roleCache.has(userId)) {
    const cached = roleCache.get(userId)!;
    setUserRole(cached.role);
    setPermissions(cached.permissions);
    return;
  }
  
  if (fetchingForUser.current === userId) return;
  fetchingForUser.current = userId;
  setRoleLoading(true);
  
  try {
    // Add timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
    );
    
    const result = await Promise.race([
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      timeoutPromise
    ]);
    
    // ... rest of logic
  } catch (error) {
    console.error("Error fetching user role:", error);
    // Don't block - allow graceful degradation
  } finally {
    setRoleLoading(false);
    fetchingForUser.current = null;
  }
};
```

---

### 6. **Paystack Integration Without Null Checks**
**Severity:** MAJOR
**Location:** [src/lib/paystack.ts](src/lib/paystack.ts) - Lines 143-168

**Issue:**
- `verifyPayment()` uses `import.meta.env.VITE_PAYSTACK_SECRET_KEY` which could be undefined
- API call made without validating response structure
- No error boundary around the async operation

**Evidence:**
```tsx
export async function verifyPayment(reference: string) {
  const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY;
  
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");  // Good!
  }
  
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error("Payment verification failed");
    }
    
    const data = await response.json();
    return data;  // No validation of data structure!
  } catch (error) {
    console.error("Payment verification error:", error);
    throw error;
  }
}
```

**Solution:**
```tsx
export async function verifyPayment(reference: string) {
  const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY;
  
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }
  
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Payment verification failed: ${response.status} - ${errorBody}`);
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data.status || !data.data) {
      throw new Error("Invalid Paystack response structure");
    }
    
    return data;
  } catch (error) {
    console.error("Payment verification error:", error);
    throw error;
  }
}
```

---

## 🟡 MODERATE ISSUES

### 7. **OnboardingRedirect Missing Error Fallback**
**Severity:** MODERATE
**Location:** [src/pages/talent/OnboardingRedirect.tsx](src/pages/talent/OnboardingRedirect.tsx) - Lines 24-55

**Issue:**
- Catches errors but continues loading indefinitely
- No fallback navigation if check fails

**Evidence:**
```tsx
try {
  const { data, error } = await supabase
    .from("talents")
    .select("onboarding_completed")
    .eq("user_id", user?.id)
    .single();
  // ...
} catch (err) {
  console.error("Error checking onboarding status:", err);
  // No fallback! Just stops here
}
```

**Solution:**
```tsx
} catch (err) {
  console.error("Error checking onboarding status:", err);
  // Fallback to dashboard
  navigate("/dashboard");
}
```

---

### 8. **SignupHub Component Syntax - Minor Issue**
**Severity:** LOW
**Location:** [src/pages/auth/SignupHub.tsx](src/pages/auth/SignupHub.tsx)

**Issue:**
- Component itself looks correct, but has no error handling for motion animation failures
- Uses framer-motion which could fail if animations library is corrupted

**Evidence:**
```tsx
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  className="text-center mb-16"
>
```

---

### 9. **ClientSignup and TalentSignup Missing Email-Specific Errors**
**Severity:** MODERATE
**Location:** [src/pages/auth/ClientSignup.tsx](src/pages/auth/ClientSignup.tsx) - Lines 87-105 & [src/pages/auth/TalentSignup.tsx](src/pages/auth/TalentSignup.tsx) - Lines 90-113

**Issue:**
- Email sending errors are caught but only logged with console.error
- User sees signup success but email never arrives
- Could silently fail in production

**Evidence:**
```tsx
try {
  await requestClientVerification(userRecord.user.id, email, fullName);
} catch (emailError) {
  console.error('Failed to send notifications:', emailError);
  // Component continues as if success
}
```

---

## 📋 VERIFICATION CHECKLIST

### Environment Variables
- [ ] Verify `.env.local` has `VITE_SUPABASE_URL`
- [ ] Verify `.env.local` has `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Verify `.env.local` has `VITE_APP_URL`
- [ ] Verify `.env.local` has `VITE_PAYSTACK_SECRET_KEY` (if used)
- [ ] Verify `.env.local` has `VITE_RESEND_API_KEY` (if used)

### Browser Console Checks
1. Open DevTools (F12)
2. Check **Console** tab for errors
3. Check **Network** tab for failed requests
4. Check **Application** > **LocalStorage** for auth data

### Common Blank Screen Causes
1. **No root element** - Is there `<div id="root"></div>` in index.html?
2. **React not loading** - Is React in node_modules?
3. **Vite not building** - Run `npm run build` and check for errors
4. **CSS not loading** - Check Network tab for CSS files
5. **Missing imports** - Check Console for "Cannot find module" errors

---

## 🔧 Recommended Fixes (Priority Order)

### Priority 1 (IMMEDIATE - Do Today)
1. **Add Error Boundary** to [src/App.tsx](src/App.tsx)
2. **Add unhandledrejection handler** to [src/main.tsx](src/main.tsx)
3. **Add environment variable validation** to [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts)

### Priority 2 (HIGH - Do This Week)
1. Add error handling to `supabase.auth.getSession()` in [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx)
2. Add timeout to role fetching in [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx)
3. Add validation to `verifyPayment()` in [src/lib/paystack.ts](src/lib/paystack.ts)

### Priority 3 (MEDIUM - Do Next Sprint)
1. Add fallback navigation in [src/pages/talent/OnboardingRedirect.tsx](src/pages/talent/OnboardingRedirect.tsx)
2. Improve email error handling in signup pages
3. Add Sentry or error tracking service

---

## 🧪 Testing the Fixes

After implementing fixes, test these scenarios:

```bash
# 1. Test with missing .env variables
NODE_ENV=production npm run build

# 2. Test with network offline (DevTools > Network tab > Offline)
# Navigate to each portal

# 3. Test component error (temporarily add throw in a component)
# Should see Error Boundary instead of blank screen

# 4. Test unhandled promise rejection
# Add: Promise.reject(new Error("Test")) in console
# Should see error logged, not blank screen
```

---

## 📞 Debug Steps for Users Experiencing Blank Screen

1. **Clear browser cache**: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
2. **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
3. **Check Console**: F12 → Console tab → Look for errors
4. **Check Environment**: Ensure all .env variables are set
5. **Check Network**: DevTools → Network → Look for failed requests (red)
6. **Check Browser Compatibility**: Ensure browser is up-to-date

---

## Summary Table

| Issue | Severity | File | Type | Fix Time |
|-------|----------|------|------|----------|
| No Error Boundary | CRITICAL | App.tsx | Component | 30 min |
| No Rejection Handler | CRITICAL | main.tsx | Setup | 15 min |
| No Env Validation | CRITICAL | client.ts | Validation | 20 min |
| Auth Promise No Catch | MAJOR | useAuth.tsx | Error Handling | 15 min |
| Missing Role Timeout | MAJOR | useAuth.tsx | Performance | 25 min |
| Paystack No Validation | MAJOR | paystack.ts | Validation | 20 min |
| OnboardingRedirect No Fallback | MODERATE | OnboardingRedirect.tsx | UX | 10 min |
| **TOTAL** | — | — | — | **~135 min** |

