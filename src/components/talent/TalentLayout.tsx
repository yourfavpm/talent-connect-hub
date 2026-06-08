import { useState, useEffect, Suspense } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import TalentSidebar from "./TalentSidebar";
import TalentTopbar from "./TalentTopbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { getOnboardingStatus } from "@/lib/onboarding-helpers";

// Accounts created on or after this date are subject to the mandatory onboarding gate.
// Set this to today's deploy date. Accounts before this date are grandfathered in.
const ONBOARDING_GATE_CUTOFF = new Date("2026-06-08T00:00:00Z");

const TalentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const enforceOnboarding = async () => {
      if (!user?.id) return;

      // Only enforce for accounts created on or after the cutoff date
      const accountCreatedAt = user.created_at ? new Date(user.created_at) : null;
      if (accountCreatedAt && accountCreatedAt < ONBOARDING_GATE_CUTOFF) return;

      try {
        const status = await getOnboardingStatus(user.id);
        if (!status.isComplete) {
          const step = status.currentStep || 1;
          navigate(`/onboarding?step=${step}`, { replace: true });
        }
      } catch (err) {
        console.error("Onboarding gate check failed:", err);
        // On error, allow access — don't block users due to a network issue
      }
    };

    enforceOnboarding();
  }, [user?.id, navigate]); // Only re-run when user changes

  return (
    <ProtectedRoute portalType="talent" allowedRoles={["talent"]}>
      <div className="flex h-screen w-full bg-[#FAFAFA] overflow-hidden font-sans">
        <TalentSidebar
          onLogout={() => signOut()}
          mobileOpen={sidebarOpen}
          setMobileOpen={setSidebarOpen}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TalentTopbar
            onMenuClick={() => setSidebarOpen(true)}
            onLogout={() => signOut()}
          />
          <main className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
            <div className="p-4 sm:p-8 lg:p-12 w-full animate-fade-in pb-20">
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              }>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default TalentLayout;

