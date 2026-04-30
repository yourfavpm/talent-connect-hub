import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Grid, 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Users, 
  MessageSquare, 
  User, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Award
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Grid, label: "Browse Courses", path: "/dashboard/courses" },
  { icon: BookOpen, label: "My Cohorts", path: "/dashboard/cohorts" },
  { icon: FileText, label: "Assignments", path: "/dashboard/assignments" },
  { icon: GraduationCap, label: "Grades", path: "/dashboard/grades" },
  { icon: Award, label: "Certificates", path: "/dashboard/certificates" },
  { icon: Users, label: "Mentors", path: "/dashboard/mentors" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages" },
];

const StudentSidebar = ({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (val: boolean) => void }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      };
      fetchProfile();
    }
  }, [user]);

  const userInitials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || user?.email?.[0].toUpperCase() || "S";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-slate-100 z-50 flex flex-col transition-all duration-300",
        collapsed ? "items-center" : "items-start"
      )}
    >
      {/* Header / Logo */}
      <div className={cn(
        "h-20 flex items-center px-6 w-full mb-6",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">O</div>
            <span className="font-bold text-slate-800 tracking-tight text-base">OPSly Academy</span>
          </Link>
        )}
        {collapsed && <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>}
      </div>

      {/* Navigation */}
      <nav className="flex-grow w-full px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                isActive 
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-sm shadow-blue-500/5" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
              {!collapsed && <span className="text-[13px]">{item.label}</span>}
              {isActive && !collapsed && (
                <motion.div 
                  layoutId="sidebarActive"
                  className="ml-auto w-1 h-4 bg-blue-600 rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions / User Profile */}
      <div className="w-full px-3 pb-8 mt-auto space-y-4">
        <div className="px-3">
          <Link
            to="/dashboard/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-slate-500 hover:text-slate-800 hover:bg-slate-50",
              location.pathname === "/dashboard/profile" && "bg-slate-50 text-slate-800 font-semibold"
            )}
          >
            <Settings className="w-5 h-5 shrink-0 text-slate-400" />
            {!collapsed && <span className="text-sm">Settings</span>}
          </Link>
        </div>

        <div className={cn(
          "mx-3 p-2.5 bg-slate-50/50 rounded-xl flex items-center gap-2.5 border border-slate-100/50",
          collapsed && "justify-center px-0"
        )}>
          <Avatar className="w-8 h-8 border-2 border-white shadow-sm shrink-0">
             <AvatarImage src={profile?.avatar_url} />
             <AvatarFallback className="bg-blue-600 text-white text-[10px] font-bold">{userInitials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{profile?.full_name || "Student"}</p>
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest truncate">{profile?.subscription_tier || "Standard"} Student</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 shadow-sm z-50"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  );
};

export default StudentSidebar;
