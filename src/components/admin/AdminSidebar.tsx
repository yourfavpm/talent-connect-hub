import { NavLink, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Receipt,
  UserPlus,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Clock,
  DollarSign,
  Scale,
  Calendar,
  ShieldCheck,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FEATURES } from "@/config/features";
import { getInternalPath } from "@/utils/subdomain";
import Logo from "@/components/Logo";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, roles: ["super_admin", "operations_admin", "vetting_admin", "finance_admin", "support_admin"] },
  { name: "Clients", href: "/admin/clients", icon: Users, roles: ["super_admin", "operations_admin"] },
  { name: "Vetting", href: "/admin/vetting", icon: ShieldCheck, badgeKey: "vetting", roles: ["super_admin", "operations_admin", "vetting_admin"] },
  { name: "Talents", href: "/admin/talents", icon: UserPlus, roles: ["super_admin", "operations_admin", "vetting_admin"] },
  ...(FEATURES.hire_request_v2_enabled
    ? [{ name: "Hire Requests", href: "/admin/hire-requests", icon: ClipboardList, roles: ["super_admin", "operations_admin", "talent_manager"] }]
    : []),
  { name: "Jobs", href: "/admin/jobs", icon: Briefcase, badgeKey: "jobs", roles: ["super_admin", "operations_admin"] },
  { name: "Timesheets", href: "/admin/timesheets", icon: Clock, badgeKey: "timesheets", roles: ["super_admin", "operations_admin", "finance_admin"] },
  { name: "Agreements", href: "/admin/legal/agreements", icon: Scale, roles: ["super_admin", "operations_admin"] },
  { name: "Contracts", href: "/admin/contracts", icon: FileText, roles: ["super_admin", "operations_admin", "finance_admin"] },
  { name: "Payments", href: "/admin/payments", icon: DollarSign, roles: ["super_admin", "finance_admin", "operations_admin"] },
  { name: "Invoices", href: "/admin/invoices", icon: Receipt, roles: ["super_admin", "finance_admin", "operations_admin"] },
  { name: "Offers", href: "/admin/offers", icon: FileText, roles: ["super_admin", "operations_admin", "finance_admin"] },
  { name: "Support", href: "/admin/support", icon: MessageSquare, badgeKey: "support", roles: ["super_admin", "support_admin", "operations_admin"] },
  { name: "Consultations", href: "/admin/consultations", icon: Calendar, roles: ["super_admin", "operations_admin"] },
  { name: "Academy", href: "/admin/academy", icon: GraduationCap, roles: ["super_admin", "operations_admin"] },
  { name: "Team", href: "/admin/team", icon: Users, roles: ["super_admin"] },
  { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["super_admin", "operations_admin"] },
];

const talentManagerNavigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, roles: ["talent_manager"] },
  { name: "My Talents", href: "/admin/my-talents", icon: UserPlus, roles: ["talent_manager"] },
  { name: "Hiring Pipeline", href: "/admin/hiring-pipeline", icon: Briefcase, roles: ["talent_manager"] },
  { name: "Hire Requests", href: "/admin/hire-requests", icon: ClipboardList, roles: ["talent_manager"] },
];

interface AdminSidebarProps {
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const AdminSidebar = ({ onLogout, mobileOpen, setMobileOpen, collapsed, setCollapsed }: AdminSidebarProps) => {
  const location = useLocation();
  const { userRole, user } = useAuth();
  const counts = useUnreadCounts();

  // Mobile layout ignores the `collapsed` prop to show a full-width drawer when open
  const isCollapsed = collapsed && !mobileOpen;

  const baseNavigation = userRole === "talent_manager" ? talentManagerNavigation : navigation;
  
  const filteredNavigation = baseNavigation.filter(item => {
    if (!userRole) return false;
    
    // Strict enforcement for talent_manager: ONLY show items from talentManagerNavigation
    if (userRole === "talent_manager") {
      return item.roles.includes("talent_manager");
    }
    
    // For other roles, use standard inclusion
    return item.roles.includes(userRole);
  });

  const getBadgeCount = (badgeKey?: string) => {
    switch(badgeKey) {
      case 'jobs': return counts.adminJobs || 0;
      case 'vetting': return counts.adminTalents || 0;
      case 'timesheets': return counts.adminTimesheets || 0;
      case 'support': return counts.adminSupportTickets || 0;
      default: return 0;
    }
  };

  const renderNavItems = (items: Array<{ name: string; href: string; icon: any; roles: string[]; badgeKey?: string }>) => {
    return items.map((item) => {
      const isActive = location.pathname.startsWith(getInternalPath(item.href));
      const badgeCount = getBadgeCount(item.badgeKey);

      const navLink = (
        <NavLink
          to={getInternalPath(item.href)}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-xl transition-all outline-none",
            isCollapsed ? "justify-center p-3" : "px-3 py-2 w-full",
            isActive
              ? "bg-[#EFF6FF] text-brand-primary shadow-sm shadow-blue-500/5 font-semibold"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <div className={cn("shrink-0 p-1.5 rounded-lg transition-colors", isActive ? "bg-white shadow-sm" : "transparent group-hover:bg-gray-100")}>
            <item.icon className={cn("stroke-[2px]", isCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]", isActive ? "text-brand-primary" : "text-gray-400 group-hover:text-gray-600")} />
          </div>
          {!isCollapsed && (
            <div className="flex-1 flex items-center justify-between min-w-0">
              <span className="text-[14px] tracking-tight antialiased truncate">{item.name}</span>
              {badgeCount > 0 && (
                <span className="bg-blue-100 text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center border border-blue-200">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </div>
          )}
        </NavLink>
      );

      if (isCollapsed) {
        return (
          <TooltipProvider key={item.name} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>{navLink}</div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white text-xs border-none ml-2 flex items-center gap-2">
                {item.name}
                {badgeCount > 0 && (
                  <span className="bg-blue-500/20 text-blue-200 text-[10px] font-semibold px-1 py-0 rounded">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return <div key={item.name}>{navLink}</div>;
    });
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ease-in-out lg:static",
          isCollapsed ? "w-[84px]" : "w-[280px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-6 h-24 shrink-0 pt-4">
          {!isCollapsed ? (
            <Link to="/" className="flex flex-col">
              <Logo showText={false} imgHeight="h-56" className="-ml-8" />
            </Link>
          ) : (
             <Link to="/">
               <Logo showText={false} imgHeight="h-10" className="mx-auto" />
             </Link>
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-4 flex flex-col gap-8">
          <nav className="space-y-1">
            {renderNavItems(filteredNavigation)}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="mt-auto px-4 pb-6">
          
          <div className="border-t border-gray-100 pt-6 mb-2 space-y-3">
            {!isCollapsed && (
              <div className="px-3 py-3 bg-gray-50/50 rounded-xl border border-gray-100 mb-6 animate-fade-in flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 font-bold text-sm shadow-sm">
                  {user?.email?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate tracking-tight uppercase antialiased">{userRole?.replace(/_/g, ' ') || "Admin"}</p>
                  <p className="text-[10px] text-gray-500 truncate font-medium">{user?.email}</p>
                </div>
              </div>
            )}

            {isCollapsed ? (
               <TooltipProvider delayDuration={0}>
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <button
                       onClick={onLogout}
                       className="flex items-center justify-center w-full p-3 rounded-xl transition-colors text-gray-500 hover:bg-red-50 hover:text-red-600"
                     >
                       <LogOut className="h-5 w-5 stroke-[2px]" />
                     </button>
                   </TooltipTrigger>
                   <TooltipContent side="right" className="bg-red-900 text-white text-xs border-none ml-2">
                     Log out
                   </TooltipContent>
                 </Tooltip>
               </TooltipProvider>
            ) : (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-3 px-3 py-3 w-full rounded-xl transition-all text-gray-600 hover:bg-red-50 hover:text-red-600 outline-none group"
                >
                  <LogOut className="h-[18px] w-[18px] shrink-0 stroke-[2px] text-gray-400 group-hover:text-red-500" />
                  <span className="flex-1 text-left text-[14px] font-medium tracking-tight">Log out</span>
                </button>
            )}
          </div>

          {!mobileOpen && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-full p-2 rounded-md transition-colors text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 stroke-[2px]" />
              ) : (
                <div className="flex items-center gap-2 w-full px-1">
                  <ChevronLeft className="h-4 w-4 stroke-[2px]" />
                  <span className="text-xs font-medium relative top-[1px]">Collapse</span>
                </div>
              )}
            </button>
          )}

        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
