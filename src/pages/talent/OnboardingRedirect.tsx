import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getOnboardingStatus } from "@/lib/onboarding-helpers";
import { Loader2 } from "lucide-react";

/**
 * This route is used as the emailRedirectTo after signup.
 * It checks if the user's onboarding is complete:
 * - If NOT complete → redirects to /talent/onboarding
 * - If complete → redirects to /talent/dashboard
 * 
 * This ensures new signups are automatically routed through onboarding
 * before they reach the dashboard.
 */
const TalentOnboardingRedirect = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        // Wait for auth to finish loading
        if (authLoading) return;

        // If not authenticated, redirect to login
        if (!user) {
          navigate("/auth/login?portal=talent");
          return;
        }

        // Use helper to check onboarding status
        const status = await getOnboardingStatus(user.id);

        setIsChecking(false);

        if (status.isComplete) {
          // Onboarding complete → go to dashboard
          navigate("/dashboard");
        } else if (status.requiresChanges) {
          // Vetting team requested changes → go back to onboarding at current step
          const step = status.currentStep || 1;
          navigate(`/onboarding?step=${step}`);
        } else {
          // Onboarding not started or incomplete → resume from last saved step
          const step = status.currentStep || 1;
          navigate(`/onboarding?step=${step}`);
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
        setError("Failed to check onboarding status. Redirecting to dashboard...");
        // Fallback to dashboard
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    };

    checkAndRedirect();
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl p-12 shadow-lg border border-slate-100">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {error ? "Almost there!" : "Setting up your profile..."}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {error
                  ? error
                  : "We're preparing your dashboard for you."}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-400 text-xs font-semibold uppercase tracking-widest">
          OpslyHR
        </p>
      </div>
    </div>
  );
};

export default TalentOnboardingRedirect;
