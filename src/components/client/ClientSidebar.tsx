import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Receipt,
  UserCheck,
  LogOut,
  ChevronLeft,
  Menu,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";

const navigation = [
  { name: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
  { name: "Browse Talents", href: "/client/browse-talents", icon: Users },
  { name: "Post Jobs", href: "/client/jobs", icon: Briefcase },
  { name: "Contracts", href: "/client/contracts", icon: FileText },
  { name: "Timesheets", href: "/client/timesheets", icon: Clock },
  { name: "Invoices", href: "/client/invoices", icon: Receipt },
  { name: "My Team", href: "/client/team", icon: UserCheck },
];

interface ClientSidebarProps {
  onLogout: () => void;
}

const ClientSidebar = ({ onLogout }: ClientSidebarProps) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const counts = useUnreadCounts();

  return (
    <div
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 min-h-screen",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo and collapse */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center">
            <img src="/wordmark.png" alt="Taskive" className="h-7" />
          </div>
        )}
        <div className="flex items-center gap-1">
          <NotificationBell variant="light" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;

          let badgeCount = 0;
          if (item.name === "Contracts") badgeCount = counts.clientContracts;
          if (item.name === "Timesheets") badgeCount = counts.clientTimesheets;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-medium">{item.name}</span>
                  {badgeCount > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                      {badgeCount}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={onLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg w-full transition-all duration-200",
            "text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default ClientSidebar;
