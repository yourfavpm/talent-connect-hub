import { NavLink, useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  User,
  Briefcase,
  FileCheck,
  FileText,
  FolderKanban,
  Clock,
  MessageSquare,
  HelpCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Copy,
  Check,
  Video
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { getInternalPath } from "@/utils/subdomain";

const navigation = [
  { label: "Dashboard", href: "/talent/dashboard", icon: LayoutDashboard, iconColor: "text-blue-600", bgColor: "bg-blue-50" },
  { label: "Browse Jobs", href: "/talent/jobs", icon: Briefcase, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
  { label: "Applications", href: "/talent/applications", icon: FileCheck, iconColor: "text-amber-600", bgColor: "bg-amber-50" },
  { label: "Interviews", href: "/talent/interviews", icon: Video, iconColor: "text-violet-600", bgColor: "bg-violet-50" },
  { label: "Assignments", href: "/talent/assignments", icon: FolderKanban, iconColor: "text-rose-600", bgColor: "bg-rose-50" },
  { label: "Contracts", href: "/talent/contracts", icon: FileText, iconColor: "text-orange-600", bgColor: "bg-orange-50" },
  { label: "Timesheets", href: "/talent/timesheets", icon: Clock, iconColor: "text-indigo-600", bgColor: "bg-indigo-50" },
  { label: "Payments", href: "/talent/payments", icon: DollarSign, iconColor: "text-green-600", bgColor: "bg-green-50" },
  { label: "Messages", href: "/talent/messages", icon: MessageSquare, iconColor: "text-cyan-600", bgColor: "bg-cyan-50", badgeKey: "messages" },
];

const secondaryNavigation = [
  { label: "Support", href: "/talent/support", icon: HelpCircle, iconColor: "text-rose-600", bgColor: "bg-rose-50", badgeKey: "support" },
  { label: "My Profile", href: "/talent/profile", icon: User, iconColor: "text-indigo-600", bgColor: "bg-indigo-50" },
  { label: "Settings", href: "/talent/settings", icon: Settings, iconColor: "text-slate-600", bgColor: "bg-slate-50" },
];

interface TalentSidebarProps {
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const TalentSidebar = ({ onLogout, mobileOpen, setMobileOpen, collapsed, setCollapsed }: TalentSidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [talentInfo, setTalentInfo] = useState<{ talent_id: string; first_name: string } | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);


  useEffect(() => {
    const fetchTalentInfo = async () => {
      const { data } = await supabase
        .from("talents")
        .select("talent_id, first_name")
        .eq("user_id", user?.id)
        .maybeSingle();
      if (data) setTalentInfo(data);
    };

    const fetchCounts = async () => {
      const { count: msgCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user?.id)
        .is("read_at", null);
      setUnreadMessages(msgCount || 0);

      const { data: talent } = await supabase
        .from("talents")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (talent) {
        const { count: ticketCount } = await supabase
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user?.id)
          .in("status", ["open", "in_progress"]);
        setOpenTickets(ticketCount || 0);
      }
    };

    if (user) {
      fetchTalentInfo();
      fetchCounts();
    }
  }, [user]);

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
    const idToCopy = talentInfo?.talent_id || user?.id;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  type NavItem = {
    label: string;
    href: string;
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    badgeKey?: string;
  };

  const isCollapsed = collapsed && !mobileOpen;

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => {
      const isActive = location.pathname.startsWith(getInternalPath(item.href));
      
      let badgeCount = 0;
      if (item.badgeKey === "messages") badgeCount = unreadMessages;
      if (item.badgeKey === "support") badgeCount = openTickets;

      const NavLinkContent = (
        <NavLink
          key={item.label}
          to={getInternalPath(item.href)}
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors duration-150 relative group outline-none",
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
               <span>{item.label}</span>
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
         <TooltipProvider key={item.label} delayDuration={0}>
           <Tooltip>
             <TooltipTrigger asChild>
               {NavLinkContent}
             </TooltipTrigger>
             <TooltipContent side="right" className="bg-gray-900 text-white text-xs border-none ml-2">
               {item.label}
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
            <Link to="/" className="flex flex-col">
              <img src="/images/logoplain.png" alt="OPSlyHR" className="h-28 w-auto animate-fade-in" />
              <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mt-1 ml-0.5">Talent Portal</span>
            </Link>
          ) : (
             <Link to="/">
               <img src="/images/logoplain.png" alt="T" className="h-6 w-auto mx-auto animate-fade-in" />
             </Link>
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
          <div className="border-t border-gray-200 pt-4 mb-2 space-y-1">

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

export default TalentSidebar;
