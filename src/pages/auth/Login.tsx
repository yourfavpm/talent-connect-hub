import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import taskiveLogo from "@/assets/taskive-logo.png";

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

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });

      // Check user role and redirect accordingly
      if (portal === "admin") {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (roleData?.role && ["super_admin", "operations_admin", "vetting_admin", "finance_admin", "support_admin"].includes(roleData.role)) {
          navigate("/admin/dashboard");
        } else {
          toast({
            title: "Access Denied",
            description: "You don't have admin access.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
        }
      } else if (portal === "talent") {
        // Check if talent has completed onboarding
        const { data: talentData } = await supabase
          .from("talents")
          .select("onboarding_completed")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (!talentData) {
          navigate("/talent/onboarding");
        } else if (!talentData.onboarding_completed) {
          navigate("/talent/onboarding");
        } else {
          navigate("/talent/dashboard");
        }
      } else {
        // Client portal
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (!clientData) {
          navigate("/client/onboarding");
        } else {
          navigate("/client/dashboard");
        }
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <img src={taskiveLogo} alt="Taskive" className="h-10 mb-6" />
            <h1 className="text-3xl font-bold text-foreground">{portalInfo.title}</h1>
            <p className="text-muted-foreground mt-2">{portalInfo.subtitle}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to={`/auth/reset-password?portal=${portal}`}
                  className="text-sm text-primary hover:underline"
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
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {portal !== "admin" && (
            <p className="text-center mt-6 text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to={`/auth/signup?portal=${portal}`}
                className="text-primary font-medium hover:underline"
              >
                Create account
              </Link>
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Switch to another portal:
            </p>
            <div className="flex gap-2 justify-center">
              {portal !== "client" && (
                <Link to="/auth/login?portal=client">
                  <Button variant="outline" size="sm">Client Portal</Button>
                </Link>
              )}
              {portal !== "talent" && (
                <Link to="/auth/login?portal=talent">
                  <Button variant="outline" size="sm">Talent Portal</Button>
                </Link>
              )}
              {portal !== "admin" && (
                <Link to="/auth/login?portal=admin">
                  <Button variant="outline" size="sm">Admin Portal</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className={`hidden lg:flex flex-1 bg-gradient-to-br ${portalInfo.gradient} items-center justify-center p-12`}>
        <div className="max-w-md text-center text-primary-foreground">
          <h2 className="text-4xl font-bold mb-4">
            {portal === "admin"
              ? "Manage Your Platform"
              : portal === "talent"
              ? "Build Your Career"
              : "Find Top Talent"}
          </h2>
          <p className="text-lg opacity-90">
            {portal === "admin"
              ? "Access the admin dashboard to manage talents, clients, and platform operations."
              : portal === "talent"
              ? "Connect with global businesses looking for Product and Operations professionals."
              : "Access vetted Product and Operations professionals for your business."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
