import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminLayout = () => {
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
      navigate("/auth/login?portal=admin");
    }
  };

  return (
    <ProtectedRoute 
      portalType="admin" 
      allowedRoles={["super_admin", "operations_admin", "vetting_admin", "finance_admin", "support_admin"]}
    >
      <div className="flex h-screen w-full bg-[#FAFAFA] overflow-hidden font-sans text-gray-900">
        <AdminSidebar 
          onLogout={handleLogout} 
          mobileOpen={sidebarOpen}
          setMobileOpen={setSidebarOpen}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminTopbar 
            onMenuClick={() => setSidebarOpen(true)}
            onLogout={handleLogout}
          />
          <main className="flex-1 overflow-y-auto w-full relative">
            <div className="p-4 sm:p-6 lg:p-8 mx-auto w-full max-w-[1400px] animate-fade-in pb-20">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminLayout;
