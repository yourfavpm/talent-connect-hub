import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  User,
  Briefcase,
  FileCheck,
  FolderKanban,
  Clock,
  MessageSquare,
  HelpCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";

const TalentSidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [talentInfo, setTalentInfo] = useState<{ talent_id: string; first_name: string } | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);

  useEffect(() => {
    if (user) {
      fetchTalentInfo();
      fetchCounts();
    }
  }, [user]);

  const fetchTalentInfo = async () => {
    const { data } = await supabase
      .from("talents")
      .select("talent_id, first_name")
      .eq("user_id", user?.id)
      .single();
    if (data) setTalentInfo(data);
  };

  const fetchCounts = async () => {
    // Unread messages
    const { count: msgCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user?.id)
      .is("read_at", null);
    setUnreadMessages(msgCount || 0);

    // Open support tickets
    const { data: talent } = await supabase
      .from("talents")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (talent) {
      const { count: ticketCount } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .in("status", ["open", "in_progress"]);
      setOpenTickets(ticketCount || 0);
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/talent/dashboard", color: "from-violet-500 to-purple-600" },
    { icon: User, label: "My Profile", href: "/talent/profile", color: "from-blue-500 to-cyan-500" },
    { icon: Briefcase, label: "Browse Jobs", href: "/talent/jobs", color: "from-emerald-500 to-teal-500" },
    { icon: FileCheck, label: "Applications", href: "/talent/applications", color: "from-amber-500 to-orange-500" },
    { icon: FolderKanban, label: "Assignments", href: "/talent/assignments", color: "from-pink-500 to-rose-500" },
    { icon: Clock, label: "Timesheets", href: "/talent/timesheets", color: "from-indigo-500 to-blue-500" },
    { icon: DollarSign, label: "Payments", href: "/talent/payments", color: "from-green-500 to-emerald-500" },
    { icon: MessageSquare, label: "Messages", href: "/talent/messages", badge: unreadMessages, color: "from-cyan-500 to-blue-500" },
    { icon: HelpCircle, label: "Support", href: "/talent/support", badge: openTickets, color: "from-orange-500 to-red-500" },
    { icon: Settings, label: "Settings", href: "/talent/settings", color: "from-slate-500 to-gray-600" },
  ];

  return (
    <aside
      className={cn(
        "min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col transition-all duration-300 relative",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform z-10"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Header */}
      <div className={cn("p-6 border-b border-white/10", collapsed && "px-4")}>
        <div className="flex items-center justify-between">
          {!collapsed && <Logo variant="light" />}
          <NotificationBell variant="light" />
        </div>

        {/* Talent ID Badge */}
        {talentInfo && !collapsed && (
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30">
            <p className="text-xs text-white/60 uppercase tracking-wider">Your Talent ID</p>
            <p className="text-lg font-bold text-accent">{talentInfo.talent_id}</p>
            <p className="text-sm text-white/80">Welcome, {talentInfo.first_name}!</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-accent/25`
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "drop-shadow-md")} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 text-xs font-bold bg-red-500 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => signOut()}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-red-500/20 transition-all w-full",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
};

export default TalentSidebar;
