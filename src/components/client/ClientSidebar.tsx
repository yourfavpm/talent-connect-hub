import { NavLink, useLocation, Link } from "react-router-dom";
import { FEATURES } from "@/config/features";
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
  Check,
  MessageSquare,
  TrendingUp,
  CreditCard,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getInternalPath } from "@/utils/subdomain";
import Logo from "@/components/Logo";

const navSections = [
  {
    label: "Hiring",
    items: [
      { name: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard, iconColor: "text-blue-600", bgColor: "bg-blue-50" },
      FEATURES.hire_request_v2_enabled
        ? { name: "Hire Requests", href: "/client/hire-requests", icon: Briefcase, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" }
        : { name: "Jobs", href: "/client/jobs", icon: Briefcase, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
      { name: "Contracts", href: "/client/contracts", icon: FileText, iconColor: "text-amber-600", bgColor: "bg-amber-50" },
      { name: "Invoices", href: "/client/invoices", icon: Receipt, iconColor: "text-rose-600", bgColor: "bg-rose-50" },
    ],
  },
  {
    label: "Workforce",
    items: [
      { name: "My Team", href: "/client/team", icon: UserCheck, iconColor: "text-purple-600", bgColor: "bg-purple-50" },
      { name: "Timesheets", href: "/client/timesheets", icon: ClipboardList, iconColor: "text-cyan-600", bgColor: "bg-cyan-50" },
      { name: "Performance", href: "/client/performance", icon: TrendingUp, iconColor: "text-indigo-600", bgColor: "bg-indigo-50" },
      { name: "Messages", href: "/client/messages", icon: MessageSquare, iconColor: "text-sky-600", bgColor: "bg-sky-50" },
    ],
  },
  {
    label: "Company",
    items: [
      { name: "Team Members", href: "/client/team-members", icon: Users, iconColor: "text-violet-600", bgColor: "bg-violet-50" },
      { name: "Subscription", href: "/client/subscription", icon: CreditCard, iconColor: "text-pink-600", bgColor: "bg-pink-50" },
      { name: "Support", href: "/client/support", icon: HelpCircle, iconColor: "text-cyan-600", bgColor: "bg-cyan-50" },
      { name: "Settings", href: "/client/settings", icon: Settings, iconColor: "text-slate-600", bgColor: "bg-slate-50" },
    ],
  },
];

// Flat list for badge counting compatibility
const allNavItems = navSections.flatMap((s) => s.items);

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
      const isActive = location.pathname.startsWith(getInternalPath(item.href));
      
      let badgeCount = 0;
      if (item.name === "Contracts") badgeCount = counts.clientContracts;

      const NavLinkContent = (
        <NavLink
          key={item.name}
          to={getInternalPath(item.href)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative group outline-none",
            isActive
              ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/5 font-semibold"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <div className={cn("p-1.5 rounded-lg transition-colors shrink-0", isActive ? "bg-white shadow-sm" : "bg-transparent group-hover:bg-gray-100")}>
            <item.icon className={cn("h-[18px] w-[18px] stroke-[2px]", isActive ? item.iconColor : "text-gray-400 group-hover:text-gray-600")} />
          </div>
          {!isCollapsed && (
             <div className="flex-1 flex items-center justify-between text-[14px] tracking-tight antialiased">
               <span>{item.name}</span>
               {badgeCount > 0 && (
                 <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center justify-center min-w-[20px]">
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
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ease-in-out transform",
          mobileOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:shadow-none",
          collapsed ? "lg:w-[84px]" : "lg:w-[280px]"
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-6 h-24 shrink-0 pt-4">
          {!isCollapsed ? (
            <Link to="/" className="flex flex-col">
              <Logo showText={false} imgHeight="h-8" className="-ml-4" />
            </Link>
          ) : (
             <Link to="/">
               <Logo showText={false} imgHeight="h-8" className="mx-auto" />
             </Link>
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-4 flex flex-col gap-4">
          {navSections.map((section) => (
            <div key={section.label} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{section.label}</p>
              )}
              {renderNavItems(section.items)}
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="mt-auto px-4 pb-6">
          
          <div className="border-t border-gray-100 pt-6 mb-2 space-y-3">
            {!isCollapsed ? (
              <div className="px-3 py-3 bg-gray-50/50 rounded-xl border border-gray-100 mb-6 animate-fade-in">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">My Client ID</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-mono font-medium text-gray-600 truncate" title={user?.id}>{user?.id?.substring(0, 16)}...</p>
                  <button onClick={copyId} className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={copyId} className="w-full flex justify-center p-3 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
                      {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
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
                  <LogOut className="h-4.5 w-4.5 shrink-0 stroke-[2px] text-gray-400 group-hover:text-red-500" />
                  <span className="flex-1 text-left text-[14px] font-medium tracking-tight">Log out</span>
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
