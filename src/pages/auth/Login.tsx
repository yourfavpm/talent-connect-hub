import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Star } from "lucide-react";
import taskiveLogo from "@/assets/taskive-logo.png";
import { getFriendlyErrorMessage } from "@/utils/errorHandling";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const portal = searchParams.get("portal") || "client";
  const navigate = useNavigate();
  const { toast } = useToast();

  const getPortalInfo = () => {
    switch (portal) {
      case "admin":
        return {
          title: "Admin Portal",
          subtitle: "Manage talents, clients, and operations",
          gradient: "from-primary to-primary/80",
          emailPlaceholder: "admin@taskive.com"
        };
      case "talent":
        return {
          title: "Talent Portal",
          subtitle: "Find jobs and manage your career",
          gradient: "from-accent to-primary",
          emailPlaceholder: "you@example.com"
        };
      default:
        return {
          title: "Client Portal",
          subtitle: "Find top talent for your business",
          gradient: "from-primary to-accent",
          emailPlaceholder: "you@company.com"
        };
    }
  };

  const portalInfo = getPortalInfo();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Determine redirect path before showing toast
      let redirectPath = "";

      if (portal === "admin") {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (roleData?.role && ["super_admin", "operations_admin", "vetting_admin", "finance_admin", "support_admin"].includes(roleData.role)) {
          redirectPath = "/admin/dashboard";
        } else {
          toast({
            title: "Access Denied",
            description: "You don't have admin access.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
      } else if (portal === "talent") {
        const { data: talentData } = await supabase
          .from("talents")
          .select("onboarding_completed")
          .eq("user_id", data.user.id)
          .maybeSingle();

        // Always redirect to dashboard, onboarding is optional/banner-driven
        redirectPath = "/talent/dashboard";
      } else {
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        // Direct access to dashboard as requested, skipping onboarding check
        redirectPath = "/client/dashboard";

        // If they really have no client record, the dashboard might handle it or they can navigate to settings/onboarding from there.
        // But per request, we force dashboard.
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });

      // Use window.location for guaranteed navigation
      window.location.href = redirectPath;
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-inter">
      <div className="w-full max-w-[440px]">
        {/* Logo/Header above card */}
        <div className="flex flex-col items-center mb-10 text-center">
          <Link to="/" className="mb-8">
            <img src="/wordmark.png" alt="Taskive" className="h-8" />
          </Link>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-widest mb-4">
            {portalInfo.title}
          </div>
          <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Access Your Dashboard</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Securely sign in to manage your engagements.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 md:p-10 shadow-sm border-t-4 border-t-blue-600">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder={portalInfo.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-slate-50/30 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Password</Label>
                <Link
                  to={`/auth/reset-password?portal=${portal}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-10 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-slate-50/30 text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-slate-950 hover:bg-blue-700 text-white rounded-lg font-bold transition-all duration-300 gap-2" 
              disabled={loading}
            >
              {loading ? "Verifying..." : "Sign In →"}
            </Button>
            

          </form>
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-slate-500 font-medium">
            Don't have an account?{" "}
            <Link to={`/auth/signup?portal=${portal}`} className="text-blue-600 font-bold hover:text-blue-700 underline underline-offset-4">
              Sign up
            </Link>
          </p>

          <div className="pt-6 border-t border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Switch Portal</p>
            <div className="flex gap-2 justify-center">
              {portal !== "client" && (
                <Link to="/auth/login?portal=client">
                  <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-blue-600 text-[12px] font-semibold">Client</Button>
                </Link>
              )}
              {portal !== "talent" && (
                <Link to="/auth/login?portal=talent">
                  <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-blue-600 text-[12px] font-semibold">Talent</Button>
                </Link>
              )}
              {portal !== "admin" && (
                <Link to="/auth/login?portal=admin">
                  <Button variant="ghost" size="sm" className="h-9 px-4 rounded-lg text-slate-400 hover:text-slate-600 text-[11px] font-medium">Admin</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
