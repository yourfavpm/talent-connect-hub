import { NavLink, useLocation } from "react-router-dom";
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
  Menu,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "operations_admin", "vetting_admin", "finance_admin", "support_admin"]
  },
  {
    name: "Clients",
    href: "/admin/clients",
    icon: Users,
    roles: ["super_admin", "operations_admin"]
  },
  {
    name: "Talents",
    href: "/admin/talents",
    icon: UserPlus,
    roles: ["super_admin", "operations_admin", "vetting_admin"]
  },
  {
    name: "Jobs",
    href: "/admin/jobs",
    icon: Briefcase,
    roles: ["super_admin", "operations_admin"]
  },
  {
    name: "Offers",
    href: "/admin/offers",
    icon: FileText,
    roles: ["super_admin", "operations_admin", "finance_admin"]
  },
  {
    name: "Contracts",
    href: "/admin/contracts",
    icon: FileText,
    roles: ["super_admin", "operations_admin", "finance_admin"]
  },
  {
    name: "Invoices",
    href: "/admin/invoices",
    icon: Receipt,
    roles: ["super_admin", "finance_admin", "operations_admin"]
  },
  {
    name: "Support",
    href: "/admin/support",
    icon: MessageSquare,
    roles: ["super_admin", "support_admin", "operations_admin"]
  },
  {
    name: "Team",
    href: "/admin/team",
    icon: Users,
    roles: ["super_admin"]
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["super_admin", "operations_admin"]
  },
];

interface AdminSidebarProps {
  onLogout: () => void;
}

const AdminSidebar = ({ onLogout }: AdminSidebarProps) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { userRole } = useAuth();

  // If no role logic is active or role is undefined, default to super_admin or limited?
  // We'll filter only if userRole is present. If missing, maybe show all (dev mode) or nothing.
  // Assuming ProtectedRoute handles access control, here we just hide UI elements.
  const filteredNavigation = navigation.filter(item =>
    !userRole || (userRole && item.roles.includes(userRole))
  );

  return (
    <div
      className={cn(
        "flex flex-col bg-foreground text-background transition-all duration-300 min-h-screen",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo and collapse */}
      <div className="flex items-center justify-between p-4 border-b border-muted/20">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-lg">T</span>
            </div>
            <div>
              <span className="font-bold text-lg">Taskive</span>
              <span className="block text-xs text-muted-foreground">Admin Portal</span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          <NotificationBell variant="dark" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-background hover:bg-muted/20"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted/10 hover:text-background"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-muted/20">
        <button
          onClick={onLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg w-full transition-all duration-200",
            "text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
