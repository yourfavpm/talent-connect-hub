import { Suspense, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import ClientSidebar from "./ClientSidebar";
import ClientTopbar from "./ClientTopbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const ClientLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate("/auth/login?portal=client");
    }
  };

  return (
    <ProtectedRoute portalType="client" allowedRoles={["client"]}>
      <div className="flex h-screen w-full bg-[#FAFAFA] overflow-hidden font-sans">
        <ClientSidebar 
          onLogout={handleLogout} 
          mobileOpen={sidebarOpen} 
          setMobileOpen={setSidebarOpen}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <ClientTopbar 
            onMenuClick={() => setSidebarOpen(true)}
            onLogout={handleLogout}
          />
          <main className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
            <div className="p-4 sm:p-6 lg:p-8 w-full max-w-none animate-fade-in pb-20">
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

export default ClientLayout;
