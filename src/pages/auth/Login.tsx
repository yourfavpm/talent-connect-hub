import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Star, Shield, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { getFriendlyErrorMessage } from "@/utils/errorHandling";
import { Zone, redirectToZone, getCurrentZone } from "@/utils/subdomain";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const zone = getCurrentZone();
  
  // Smart Portal Detection:
  // 1. Check URL param (highest priority)
  // 2. Check current zone (if on talent.opslyhr.com, default to talent)
  // 3. Fallback to client
  const getInitialPortal = () => {
    const param = searchParams.get("portal");
    if (param && ["talent", "client", "admin"].includes(param)) return param;
    
    if (zone === Zone.TALENT) return "talent";
    if (zone === Zone.ADMIN) return "admin";
    if (zone === Zone.CLIENT) return "client";
    
    // If we are on AUTH zone (app.opslyhr.com), check referrer
    const referrer = document.referrer.toLowerCase();
    if (referrer.includes("talent.")) return "talent";
    if (referrer.includes("admin.")) return "admin";
    
    return "client"; // Default fallback
  };

  const portal = getInitialPortal();

  const navigate = useNavigate();
  const { toast } = useToast();

  const getPortalInfo = () => {
    switch (portal) {
      case "admin":
        return {
          title: "Admin Portal",
          subtitle: "Manage talents, clients, and operations",
          gradient: "from-primary to-primary/80",
          emailPlaceholder: "admin@opslyhr.com"
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

        const userRole = (roleData as { role: string } | null)?.role;

        if (userRole && ["super_admin", "operations_admin", "vetting_admin", "finance_admin", "support_admin"].includes(userRole)) {
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

      // Use Zone-based redirection for subdomains
      if (portal === "admin") {
        redirectToZone(Zone.ADMIN, "/dashboard");
      } else if (portal === "talent") {
        redirectToZone(Zone.TALENT, "/dashboard");
      } else {
        redirectToZone(Zone.CLIENT, "/dashboard");
      }
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  const firstInputRef = useRef<HTMLInputElement>(null);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (window.innerWidth <= 767) {
        const formElement = document.getElementById("form");
        if (formElement) {
          const rect = formElement.getBoundingClientRect();
          // Show sticky CTA if form is not in view
          setShowStickyCTA(rect.bottom < 0 || rect.top > window.innerHeight);
        }
      } else {
        setShowStickyCTA(false);
      }
    };

    window.addEventListener("scroll", checkScroll);
    checkScroll();

    // Initial focus and scroll
    const isMobile = window.innerWidth <= 767;
    const hasHash = window.location.hash === "#form";
    
    if (isMobile || hasHash) {
      const formElement = document.getElementById("form");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => firstInputRef.current?.focus(), 600);
      }
    } else {
      firstInputRef.current?.focus();
    }

    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  const scrollToForm = () => {
    const formElement = document.getElementById("form");
    formElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    firstInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col-reverse lg:flex-row bg-white font-inter overflow-x-hidden">
      {/* LEFT PANEL (CONTEXT / TRUST) - 45% on desktop */}
      <div className="lg:w-[45%] bg-slate-50/80 border-r border-slate-100 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl -z-10"></div>
        
        <div className="relative z-10">
          <Link to="/" className="inline-block mb-16 lg:mb-24">
            <img src="/images/logoplain.png" alt="OPSlyHR" className="h-28" />
          </Link>

          <div className="max-w-md">
            <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 leading-tight mb-4 tracking-tight">
              Welcome back.
            </h2>
            
            <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">
              {portal === "talent" 
                ? "Access your assignments, interviews, payments, and professional profile."
                : portal === "admin"
                ? "Manage talents, clients, and platform operations."
                : "Manage your team, track contracts, and oversee operations."}
            </p>

            <div className="space-y-4 pt-10 border-t border-slate-200/60 transition-all duration-500">
              {(portal === "talent" ? [
                "Track job applications",
                "Manage active contracts",
                "Submit timesheets",
                "Update professional profile"
              ] : [
                "Browse vetted professionals",
                "Track engagements",
                "Approve timesheets",
                "Manage invoices"
              ]).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600/40" />
                  <span className="text-sm font-semibold text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 lg:mt-0 flex items-center gap-3 py-4 px-5 bg-white/50 backdrop-blur-sm border border-slate-200/50 rounded-xl w-fit">
          <Shield className="w-4 h-4 text-slate-400" />
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Secure login powered by encrypted authentication.
          </p>
        </div>
      </div>

      <div id="form" className="lg:w-[55%] flex flex-col justify-center px-6 lg:px-20 xl:px-32 py-12 bg-white relative">
        {/* Mobile Header (Refined) */}
        <div className="lg:hidden flex flex-col items-center mb-10 text-center">
          <Link to="/" className="mb-6">
            <img src="/images/logoplain.png" alt="OPSlyHR" className="h-24" />
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight leading-tight mb-3">
            Welcome back.
          </h1>
          <p className="text-slate-500 text-base font-medium leading-relaxed">
            {portal === "talent" 
              ? "Access your assignments, interviews, payments, and professional profile."
              : portal === "admin"
              ? "Manage talents, clients, and platform operations."
              : "Manage your team, track contracts, and oversee operations."}
          </p>
        </div>

        <div className="max-w-[440px] w-full mx-auto">
          {/* PORTAL SWITCH AT TOP */}
          <div className="flex bg-slate-50 p-1 rounded-xl mb-8 border border-slate-100">
            <button
              onClick={() => navigate("/auth/login?portal=talent")}
              className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                portal === 'talent' ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Professional
            </button>
            <button
              onClick={() => navigate("/auth/login?portal=client")}
              className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                portal === 'client' ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Company
            </button>
            {portal === 'admin' && (
              <button
                className="flex-1 py-1.5 text-[10px] font-semibold rounded-lg bg-slate-900 text-white"
              >
                Admin
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-8 md:p-10 shadow-sm shadow-slate-200/40 relative">
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1">Sign In</h1>
              <p className="text-slate-500 text-sm font-medium">Enter your credentials to continue.</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 bg-red-50 border border-red-50 rounded-lg flex items-center gap-3"
              >
                <div className="w-1 h-1 rounded-full bg-red-500" />
                <p className="text-xs font-semibold text-red-600 leading-tight">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Email Address</Label>
                <Input
                  ref={firstInputRef}
                  id="email"
                  type="email"
                  placeholder={portalInfo.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-slate-100 rounded-lg focus:ring-blue-600/5 focus:border-blue-500 bg-white shadow-sm text-slate-800 placeholder:text-slate-300 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Password</Label>
                  <Link
                    to={`/auth/reset-password?portal=${portal}`}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-1"
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
                    className="h-11 pr-12 border-slate-100 rounded-lg focus:ring-blue-600/5 focus:border-blue-500 bg-white shadow-sm text-slate-800 placeholder:text-slate-300 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-all duration-300 gap-2 mt-2 shadow-sm" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-50">
              <p className="text-center text-sm text-slate-500 font-medium">
                Don't have an account?{" "}
                <Link to={`/auth/signup?portal=${portal}`} className="text-blue-600 font-semibold hover:text-blue-700 underline underline-offset-4 decoration-1">
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            {portal !== "admin" && (
              <Link to="/auth/login?portal=admin" className="text-[10px] font-semibold text-slate-300 hover:text-slate-500 transition-colors">
                Admin Access
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* Sticky Mobile CTA */}
      <AnimatePresence>
        {showStickyCTA && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] lg:hidden"
          >
            <button
              onClick={scrollToForm}
              className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 whitespace-nowrap active:scale-95 transition-transform"
            >
              <ArrowRight className="w-4 h-4 rotate-[-90deg]" />
              Complete the form
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
