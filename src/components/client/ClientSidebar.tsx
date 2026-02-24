import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Receipt,
  UserCheck,
  LogOut,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navigation = [
  { name: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard, iconColor: "text-blue-600", bgColor: "bg-blue-50" },
  { name: "Browse Talents", href: "/client/browse-talents", icon: Users, iconColor: "text-indigo-600", bgColor: "bg-indigo-50" },
  { name: "Jobs", href: "/client/jobs", icon: Briefcase, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
  { name: "Contracts", href: "/client/contracts", icon: FileText, iconColor: "text-amber-600", bgColor: "bg-amber-50" },
  { name: "Invoices", href: "/client/invoices", icon: Receipt, iconColor: "text-rose-600", bgColor: "bg-rose-50" },
  // { name: "Timesheets", href: "/client/timesheets", icon: Clock }, // Kept hidden or matched to existing nav
  { name: "My Team", href: "/client/team", icon: UserCheck, iconColor: "text-purple-600", bgColor: "bg-purple-50" },
];

const secondaryNavigation = [
  { name: "Support", href: "/client/support", icon: HelpCircle, iconColor: "text-cyan-600", bgColor: "bg-cyan-50" },
  { name: "Profile", href: "/client/settings", icon: Settings, iconColor: "text-slate-600", bgColor: "bg-slate-50" },
];

interface ClientSidebarProps {
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const ClientSidebar = ({ onLogout, mobileOpen, setMobileOpen, collapsed, setCollapsed }: ClientSidebarProps) => {
  const location = useLocation();
  const counts = useUnreadCounts();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [mobileOpen]);

  const copyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCollapsed = collapsed && !mobileOpen;

  const renderNavItems = (items: { name: string; href: string; icon: any; iconColor: string; bgColor: string }[]) => {
    return items.map((item) => {
      const isActive = location.pathname.startsWith(item.href);
      
      let badgeCount = 0;
      if (item.name === "Contracts") badgeCount = counts.clientContracts;

      const NavLinkContent = (
        <NavLink
          key={item.name}
          to={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 relative group outline-none",
            isActive
              ? "bg-[#EFF6FF] text-[#0f2147] font-medium"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <div className={cn("p-1.5 rounded-md transition-colors", isActive ? item.bgColor : "bg-transparent group-hover:bg-gray-200/50")}>
            <item.icon className={cn("h-4 w-4 flex-shrink-0 stroke-[2.5px]", isActive ? item.iconColor : "text-gray-400 group-hover:text-gray-600")} />
          </div>
          {!isCollapsed && (
             <div className="flex-1 flex items-center justify-between text-[13px] tracking-wide relative top-[1px]">
               <span>{item.name}</span>
               {badgeCount > 0 && (
                 <span className="bg-gray-200 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center justify-center min-w-[20px]">
                   {badgeCount}
                 </span>
               )}
             </div>
          )}
        </NavLink>
      );

      return isCollapsed ? (
         <TooltipProvider key={item.name} delayDuration={0}>
           <Tooltip>
             <TooltipTrigger asChild>
               {NavLinkContent}
             </TooltipTrigger>
             <TooltipContent side="right" className="bg-gray-900 text-white text-xs border-none ml-2">
               {item.name}
             </TooltipContent>
           </Tooltip>
         </TooltipProvider>
      ) : NavLinkContent;
    });
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden transition-opacity" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out transform",
          mobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:shadow-none",
          collapsed ? "lg:w-[80px]" : "lg:w-[260px]"
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-5 h-20 shrink-0 pt-4">
          {!isCollapsed ? (
            <div className="flex flex-col">
              <img src="/wordmark.png" alt="Taskive" className="h-[22px] w-auto animate-fade-in" />
              <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mt-1 ml-0.5">Client Portal</span>
            </div>
          ) : (
             <img src="/logo.png" alt="T" className="h-6 w-auto mx-auto animate-fade-in" />
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3 flex flex-col gap-6">
          <nav className="space-y-[2px]">
            {renderNavItems(navigation)}
          </nav>
          
          <nav className="space-y-[2px]">
            {renderNavItems(secondaryNavigation)}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="mt-auto px-3 pb-4">
          
          <div className="border-t border-gray-200 pt-4 mb-2 space-y-2">
            {!isCollapsed ? (
              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 mb-4 animate-fade-in">
                <p className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider mb-1">Client ID</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-mono text-gray-700 truncate" title={user?.id}>{user?.id?.substring(0, 12)}...</p>
                  <button onClick={copyId} className="text-gray-400 hover:text-gray-900 p-1 rounded-md hover:bg-gray-200 transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={copyId} className="w-full flex justify-center p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
                      {copied ? <Check className="w-4.5 h-4.5 text-green-600" /> : <Copy className="w-4.5 h-4.5" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-gray-900 text-white text-xs border-none ml-2">
                    Copy Client ID
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {isCollapsed ? (
               <TooltipProvider delayDuration={0}>
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <button
                       onClick={onLogout}
                       className="flex items-center justify-center w-full p-2 rounded-md transition-colors text-gray-500 hover:bg-red-50 hover:text-red-600"
                     >
                       <LogOut className="h-4.5 w-4.5 stroke-[2px]" />
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
                  className="flex items-center gap-3 px-3 py-2 w-full rounded-md transition-colors text-gray-500 hover:bg-red-50 hover:text-red-600 outline-none group"
                >
                  <LogOut className="h-4.5 w-4.5 shrink-0 stroke-[2px] text-gray-400 group-hover:text-red-500" />
                  <span className="flex-1 text-left text-[13px] tracking-wide relative top-[1px]">Log out</span>
                </button>
            )}
          </div>
          
          {/* Desktop Collapse Toggle */}
          <div className="hidden lg:flex justify-end pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 h-8 w-8 rounded-full border border-gray-200"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ClientSidebar;
