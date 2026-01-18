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
        };
      case "talent":
        return {
          title: "Talent Portal",
          subtitle: "Find jobs and manage your career",
          gradient: "from-accent to-primary",
        };
      default:
        return {
          title: "Client Portal",
          subtitle: "Find top talent for your business",
          gradient: "from-primary to-accent",
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
    <div className="min-h-screen flex bg-slate-50">
      {/* Brand Side (Left/Top) */}
      <div className={`hidden lg:flex flex-1 relative bg-blue-950 items-center justify-center p-12 overflow-hidden`}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 to-slate-900/90"></div>

        <div className="relative z-10 max-w-md text-white">
          {/* Logo */}
          <div className="mb-12">
            <img src="/wordmark.png" alt="Taskive" className="h-10 brightness-0 invert" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight font-display">
            Welcome<br />Back
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-8">
            {portal === "talent"
              ? "Continue building your career. Update your availability and browse new exciting roles."
              : "Your next great hire is waiting. Log in to view candidates and manage your team."}
          </p>

          {/* Stat/Trust Indicator */}
          <div className="flex gap-6 mt-12 border-t border-white/10 pt-8">
            <div>
              <div className="text-3xl font-bold text-white mb-1">98%</div>
              <div className="text-blue-200 text-sm">Placement Success</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">48h</div>
              <div className="text-blue-200 text-sm">Avg. Time to Hire</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side (Right) */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-20 xl:px-32 py-12 bg-white relative">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <img src="/wordmark.png" alt="Taskive" className="h-8" />
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-3 font-display">{portalInfo.title}</h1>
            <p className="text-slate-500 text-lg">{portalInfo.subtitle}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 bg-white text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                <Link
                  to={`/auth/reset-password?portal=${portal}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
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
                  className="h-12 pr-10 border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 bg-white text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-14 text-lg bg-blue-950 hover:bg-blue-900 text-white shadow-xl shadow-blue-900/10 rounded-xl font-bold transition-all" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center mt-8 text-slate-500">
            Don't have an account?{" "}
            <Link to={`/auth/signup?portal=${portal}`} className="text-blue-600 font-bold hover:text-blue-800 hover:underline">
              Create account
            </Link>
          </p>

          <div className="mt-12 text-center pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-400 mb-4">Switch Portal</p>
            <div className="flex gap-2 justify-center">
              {portal !== "client" && (
                <Link to="/auth/login?portal=client">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-950">Client Login</Button>
                </Link>
              )}
              {portal !== "talent" && (
                <Link to="/auth/login?portal=talent">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-950">Talent Login</Button>
                </Link>
              )}
              {portal !== "admin" && (
                <Link to="/auth/login?portal=admin">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 text-xs">Admin</Button>
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
