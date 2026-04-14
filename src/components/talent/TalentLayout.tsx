import { useState, useEffect, Suspense } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import TalentSidebar from "./TalentSidebar";
import TalentTopbar from "./TalentTopbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

const TalentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user?.id) return;
      const { data } = await supabase.from("talents").select("onboarding_completed").eq("user_id", user.id).maybeSingle() as { data: { onboarding_completed: boolean } | null };
      setNeedsOnboarding(!data || !data.onboarding_completed);
    };
    checkOnboarding();
  }, [user?.id]); // Only re-check when user changes, NOT on every navigation

  const isOnboardingPage = location.pathname.includes('/talent/onboarding');

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
            <div className="p-4 sm:p-6 lg:p-8 mx-auto w-full max-w-7xl animate-fade-in pb-20">
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
