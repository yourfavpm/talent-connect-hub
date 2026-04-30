import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import StudentSidebar from "./StudentSidebar";
import { Search, Bell, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const StudentDashboardLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const userInitials = user.user_metadata?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || user.email?.[0].toUpperCase() || "S";

  return (
    <div className="min-h-screen bg-slate-50/30 flex font-inter overflow-x-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block shrink-0">
        <StudentSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      </div>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[280px] z-[70] lg:hidden"
          >
            <StudentSidebar collapsed={false} setCollapsed={() => setMobileMenuOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={`flex-grow flex flex-col min-w-0 transition-all duration-300 w-full ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-[260px]"}`}>
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search courses, mentors, or Cohorts..." 
                className="w-64 lg:w-[480px] h-12 pl-12 pr-4 bg-slate-50/50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-8">
            <button className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-800 transition-colors">
              Support
            </button>
            <button className="relative p-2 text-slate-500 hover:text-slate-900 transition-all hover:bg-slate-50 rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-600 rounded-full" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full transition-all">
                  <Avatar className="w-9 h-9 border-2 border-white shadow-sm shrink-0">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">{userInitials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-slate-100 shadow-xl shadow-slate-200/50 mt-1">
                <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-50 mx-1" />
                <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm font-medium focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                  Learning History
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-50 mx-1" />
                <DropdownMenuItem 
                  onClick={() => supabase.auth.signOut()}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-grow p-3 md:p-6 lg:p-10 max-w-[1600px] w-full">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default StudentDashboardLayout;
