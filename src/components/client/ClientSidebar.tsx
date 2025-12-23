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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";

const navigation = [
  { name: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
  { name: "Browse Talents", href: "/client/talents", icon: Users },
  { name: "Post Jobs", href: "/client/jobs", icon: Briefcase },
  { name: "Contracts", href: "/client/contracts", icon: FileText },
  { name: "Invoices", href: "/client/invoices", icon: Receipt },
  { name: "My Team", href: "/client/team", icon: UserCheck },
];

interface ClientSidebarProps {
  onLogout: () => void;
}

const ClientSidebar = ({ onLogout }: ClientSidebarProps) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-lg">T</span>
            </div>
            <span className="font-bold text-lg">Taskive</span>
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
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.name}</span>}
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
