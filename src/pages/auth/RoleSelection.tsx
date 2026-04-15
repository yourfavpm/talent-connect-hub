import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Zone, redirectToZone } from "@/utils/subdomain";
import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Briefcase, 
  Building2, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";

interface UserRole {
  role: string;
}

const RoleSelection = () => {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [searchParams] = useSearchParams();
  const portal = searchParams.get("portal");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRoles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth/login");
        return;
      }

      setUserName(user.user_metadata?.first_name || user.user_metadata?.full_name || "there");

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching roles:", error);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const roleList = data?.map((r: any) => r.role) || [];
        setRoles(roleList);
        
        // Logic for auto-redirection
        if (roleList.length === 1) {
          handleRoleSelect(roleList[0]);
        } else if (portal === "student" && roleList.includes("student")) {
          // If student portal requested and they ARE a student, auto-select it
          handleRoleSelect("student");
        }
      }
      setLoading(false);
    };

    fetchUserRoles();
  }, [navigate, portal]);

  const handleRoleSelect = (role: string) => {
    switch (role) {
      case "student":
        redirectToZone(Zone.ACADEMY, "/dashboard");
        break;
      case "talent":
        redirectToZone(Zone.TALENT, "/dashboard");
        break;
      case "client":
        redirectToZone(Zone.CLIENT, "/dashboard");
        break;
      case "super_admin":
      case "operations_admin":
        redirectToZone(Zone.ADMIN, "/dashboard");
        break;
      default:
        // Fallback to marketing or login
        window.location.href = "/";
    }
  };

  const getRoleCard = (role: string) => {
    switch (role) {
      case "student":
        return {
          title: "Student Portal",
          description: "Continue your learning journey and access your courses.",
          icon: GraduationCap,
          color: "bg-blue-600",
          hover: "hover:border-blue-600/30 hover:shadow-blue-500/10"
        };
      case "talent":
        return {
          title: "Talent Portal",
          description: "Manage your professional profile and job applications.",
          icon: Briefcase,
          color: "bg-emerald-600",
          hover: "hover:border-emerald-600/30 hover:shadow-emerald-500/10"
        };
      case "client":
        return {
          title: "Client Portal",
          description: "Hire and manage top operations and product talent.",
          icon: Building2,
          color: "bg-slate-900",
          hover: "hover:border-slate-900/30 hover:shadow-slate-900/10"
        };
      case "super_admin":
      case "operations_admin":
        return {
          title: "Admin Portal",
          description: "Manage platform operations, users and vetting.",
          icon: ShieldCheck,
          color: "bg-rose-600",
          hover: "hover:border-rose-600/30 hover:shadow-rose-500/10"
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-inter">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <Link to="/" className="inline-block mb-8">
            <img src="/images/logocolored.png" alt="OPSLY" className="h-12 mx-auto" />
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-slate-900 tracking-tight"
          >
            Welcome back, {userName}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 mt-2 font-medium"
          >
            Which portal would you like to access today?
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role, index) => {
            const card = getRoleCard(role);
            if (!card) return null;
            const Icon = card.icon;

            return (
              <motion.button
                key={role}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * (index + 1) }}
                onClick={() => handleRoleSelect(role)}
                className={`group bg-white p-8 rounded-[32px] border border-slate-200 text-left transition-all duration-300 shadow-sm ${card.hover} active:scale-[0.98]`}
              >
                <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                  {card.description}
                </p>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:gap-4 transition-all">
                  Enter Portal <ArrowRight className="w-4 h-4" />
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-slate-400 font-medium">
          Logged in as {userName}. <button onClick={() => supabase.auth.signOut().then(() => navigate("/auth/login"))} className="text-blue-600 hover:underline">Sign out</button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
