import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Briefcase,
  Users,
  Clock,
  FileText,
  MessageSquare,
  Receipt,
  HelpCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";

const TalentSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/talent/dashboard" },
    { icon: User, label: "My Profile", href: "/talent/profile" },
    { icon: Briefcase, label: "Jobs", href: "/talent/jobs" },
    { icon: Users, label: "My Team", href: "/talent/team" },
    { icon: Clock, label: "Time Tracking", href: "/talent/time-tracking" },
    { icon: FileText, label: "Timesheets", href: "/talent/timesheets" },
    { icon: MessageSquare, label: "Messages", href: "/talent/messages" },
    { icon: Receipt, label: "Invoices & Payments", href: "/talent/invoices" },
    { icon: HelpCircle, label: "Support", href: "/talent/support" },
    { icon: Settings, label: "Settings", href: "/talent/settings" },
  ];

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="p-6 flex items-center justify-between">
        <Logo variant="light" />
        <NotificationBell variant="light" />
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default TalentSidebar;
