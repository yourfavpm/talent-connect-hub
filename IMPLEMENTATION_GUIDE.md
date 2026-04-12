# Implementation Guide: Runtime Error Fixes

## Quick Implementation Summary

This guide provides exact code changes to fix the white blank screen crash issues identified.

---

## FIX #1: Error Boundary Component (CRITICAL)

**File:** Create `src/components/ErrorBoundary.tsx`

```tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Store error info for display
    this.setState({ errorInfo });
    
    // In production, you could send to an error tracking service here
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <Loader2 className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <p className="text-xs font-mono text-red-700 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            
            <button
              onClick={this.handleReset}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**File:** Update `src/App.tsx`

Replace the imports at the top with:
```tsx
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { getCurrentZone, Zone } from "@/utils/subdomain";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { FEATURES } from "@/config/features";
import { useVettingVersion } from "./hooks/useVettingVersion";
import { useAuth } from "@/hooks/useAuth";
import { getZoneUrl } from "@/utils/subdomain";
import { Loader2 } from "lucide-react";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "@/components/ErrorBoundary"; // ADD THIS LINE
```

Then wrap the return statement in App component:
```tsx
const App = () => {
  const zone = getCurrentZone();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <DevZoneIndicator zone={zone} />
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center bg-white">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                }>
                  {/* ... existing Routes ... */}
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
```

---

## FIX #2: Global Error & Rejection Handlers (CRITICAL)

**File:** Update `src/main.tsx`

```tsx
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevent the default handling (which would show nothing to user)
  event.preventDefault();
  
  // Optionally send to error tracking service
  // Example: Sentry.captureException(event.reason);
  
  // Show user-friendly error (optional)
  const message = event.reason?.message || 'An unexpected error occurred';
  console.error(`[UNHANDLED REJECTION] ${message}`);
});

// Global error handler for runtime errors not caught by React
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // This catches errors like failed module imports
  if (event.error?.message?.includes('Failed to fetch')) {
    console.warn('Network error detected - likely offline or server issue');
  }
});

// Log if app fails to mount
const root = document.getElementById("root");
if (!root) {
  throw new Error('Root element not found - check index.html has div with id="root"');
}

createRoot(root).render(<App />);
```

---

## FIX #3: Supabase Client Environment Validation (CRITICAL)

**File:** Update `src/integrations/supabase/client.ts`

```tsx
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getCookieDomain } from '@/utils/subdomain';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// CRITICAL: Validate environment variables
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const missing = [];
  if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
  if (!SUPABASE_PUBLISHABLE_KEY) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  
  throw new Error(
    `Missing required Supabase environment variables: ${missing.join(', ')}. ` +
    `Please check your .env.local file and restart the development server.`
  );
}

const domain = getCookieDomain();

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Custom storage to share sessions across subdomains
const cookieStorage = {
  getItem: (key: string) => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === key) return decodeURIComponent(value);
    }
    return localStorage.getItem(key); // Fallback to localStorage
  },
  setItem: (key: string, value: string) => {
    const secure = window.location.protocol === 'https:' ? 'Secure;' : '';
    const domainStr = domain ? `Domain=${domain};` : '';
    // Set cookie for subdomain sharing
    document.cookie = `${key}=${encodeURIComponent(value)}; ${domainStr} Path=/; SameSite=Lax; ${secure}`;
    // Also keep in localStorage for resilience
    localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    const domainStr = domain ? `Domain=${domain};` : '';
    document.cookie = `${key}=; ${domainStr} Path=/; Max-Age=0; SameSite=Lax;`;
    localStorage.removeItem(key);
  },
};

try {
  export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: cookieStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  throw error;
}
```

---

## FIX #4: AuthProvider Promise Error Handling (MAJOR)

**File:** Update `src/hooks/useAuth.tsx`

Replace the useEffect in AuthProvider (around line 88-115) with:

```tsx
useEffect(() => {
  // Set up auth state listener FIRST
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Defer role fetching
      if (session?.user) {
        setTimeout(() => {
          fetchUserRole(session.user.id);
        }, 0);
      } else {
        setUserRole(null);
        setPermissions([]);
        setRoleLoading(false);
      }
    }
  );

  // THEN check for existing session with error handling
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
      // Don't block - allow app to proceed to login
      setLoading(false);
    });

  return () => subscription.unsubscribe();
}, []);
```

---

## FIX #5: Add Timeout to Role Fetching (MAJOR)

**File:** Update `src/hooks/useAuth.tsx` 

Replace the `fetchUserRole` function (around line 33-75) with:

```tsx
const fetchUserRole = async (userId: string) => {
  // Return from cache instantly if already fetched for this user
  if (roleCache.has(userId)) {
    const cached = roleCache.get(userId)!;
    setUserRole(cached.role);
    setPermissions(cached.permissions);
    return;
  }

  // Prevent duplicate concurrent fetches for same user
  if (fetchingForUser.current === userId) return;
  fetchingForUser.current = userId;
  setRoleLoading(true);

  // Create timeout promise to prevent hanging forever
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Role fetch timeout after 5 seconds')), 5000)
  );

  try {
    // Race between actual fetch and timeout
    const rolePromise = supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: roleData, error: roleError } = await Promise.race([
      rolePromise,
      timeoutPromise
    ]) as any;

    if (roleError) {
      console.error("Error fetching user role:", roleError);
    } else {
      setUserRole(roleData?.role ?? null);
    }

    let perms: string[] = [];
    if (isAdminRole(roleData?.role)) {
      try {
        const { data: permData, error: permError } = await supabase
          .rpc('get_admin_permissions' as any, { p_admin_id: userId });

        if (permError) {
          console.error("Error fetching RBAC permissions:", permError);
        } else {
          perms = (permData as string[]) || [];
          setPermissions(perms);
        }
      } catch (permsFetchError) {
        console.error("Error fetching RBAC permissions:", permsFetchError);
      }
    }

    // Cache the result for this session
    roleCache.set(userId, { role: roleData?.role ?? null, permissions: perms });
  } catch (error) {
    console.error("Error in fetchUserRole:", error);
    // Don't block - allow graceful degradation with no role
    setUserRole(null);
    setPermissions([]);
  } finally {
    setRoleLoading(false);
    fetchingForUser.current = null;
  }
};
```

---

## FIX #6: Paystack Payment Verification Validation (MAJOR)

**File:** Update `src/lib/paystack.ts`

Replace the `verifyPayment` function (around line 143-170) with:

```tsx
/**
 * Verify payment with Paystack - WITH VALIDATION
 */
export async function verifyPayment(reference: string) {
  const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured. Check VITE_PAYSTACK_SECRET_KEY in .env");
  }

  if (!reference || typeof reference !== 'string') {
    throw new Error("Invalid payment reference provided");
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Check if response is OK
    if (!response.ok) {
      let errorMessage = `Payment verification failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If we can't parse error JSON, just use status message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Validate response structure
    if (typeof data !== 'object' || !data) {
      throw new Error("Invalid Paystack API response: response is not an object");
    }

    if (!data.status) {
      throw new Error("Invalid Paystack API response: missing status field");
    }

    if (!data.data) {
      throw new Error("Invalid Paystack API response: missing data field");
    }

    // Additional validation of transaction data
    if (data.data.reference !== reference) {
      throw new Error("Payment reference mismatch - potential security issue");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Payment verification error:", error.message);
    } else {
      console.error("Payment verification error:", error);
    }
    throw error;
  }
}
```

---

## FIX #7: OnboardingRedirect Fallback Navigation (MODERATE)

**File:** Update `src/pages/talent/OnboardingRedirect.tsx`

Replace the checkOnboarding function (around line 18-50) with:

```tsx
const onboardingRedirectAction = async () => {
  if (!user?.id) {
    navigate("/dashboard");
    return;
  }

  try {
    const { data, error } = await supabase
      .from("talents")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (data && (data as any).onboarding_completed) {
      // Already completed onboarding
      navigate("/dashboard");
    } else {
      // Needs to complete onboarding
      navigate("/onboarding");
    }
  } catch (err) {
    console.error("Error checking onboarding status:", err);
    // Fallback: go to dashboard - user can access onboarding from there
    navigate("/dashboard");
  }
};

// Call the function
onboardingRedirectAction();
```

---

## Verification Checklist

After implementing all fixes, verify:

- [ ] No TypeScript errors: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Dev server starts: `npm run dev`
- [ ] Error Boundary visible when component throws (add test error)
- [ ] Unhandled rejections logged to console (test with `Promise.reject()`)
- [ ] Environment variables validated on startup
- [ ] No blank screen on missing auth
- [ ] Payment verification validates responses

---

## Testing Each Fix

### Test Error Boundary
```tsx
// Temporarily add to any component:
throw new Error("Test error boundary");

// Should show error UI instead of blank screen
```

### Test Unhandled Rejection
```tsx
// In browser console:
Promise.reject(new Error("Test unhandled rejection"));

// Should log error, not blank screen
```

### Test Environment Validation
```bash
# Remove VITE_SUPABASE_URL from .env.local, restart npm run dev
# Should fail with clear error message
```

### Test Auth Timeout
```tsx
// Add to useAuth to simulate slow response:
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Test timeout')), 1000)
);
// After 5+ seconds, should not be stuck loading
```

---

## Deployment Notes

1. **Ensure all environment variables are set** in production before deploying
2. **Enable error tracking** (add Sentry or similar)
3. **Monitor browser console** for errors in production
4. **Test error scenarios** in staging before production

