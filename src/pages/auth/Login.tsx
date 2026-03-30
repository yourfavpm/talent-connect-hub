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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

      // Use window.location for guaranteed navigation
      window.location.href = redirectPath;
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
            <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-400 border border-slate-200 uppercase tracking-widest mb-6 shadow-sm">
              {portal === "admin" ? "ADMINISTRATIVE ACCESS" : portal === "talent" ? "TALENT PORTAL" : "CLIENT PORTAL"}
            </div>
            
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 leading-[1.15] mb-6 tracking-tight">
              {portal === "talent" ? "Welcome Back, Operator." : "Welcome Back."}
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
          <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-200 uppercase tracking-widest mb-6">
            {portal === "admin" ? "ADMIN ACCESS" : portal === "talent" ? "TALENT PORTAL" : "CLIENT PORTAL"}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
            {portal === "talent" ? "Welcome Back, Operator." : "Welcome Back."}
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
          {/* Subtle Portal Badge for Desktop Form Area */}
          <div className="hidden lg:flex justify-end mb-4">
            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${
              portal === 'talent' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-blue-50 text-blue-700 border-blue-100'
            } uppercase tracking-tighter`}>
              {portal === 'talent' ? 'Professional' : portal === 'admin' ? 'Admin' : 'Client'} Access
            </span>
          </div>

          <div className="bg-white border border-slate-100 rounded-[14px] p-8 md:p-10 shadow-sm shadow-slate-200/50 relative">
            <div className="hidden lg:block mb-10">
              <h1 className="text-3xl font-bold text-slate-950 tracking-tight mb-2">Sign In</h1>
              <p className="text-slate-500 text-sm font-medium">Enter your credentials to continue.</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <p className="text-xs font-bold text-red-600 leading-tight">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Email Address</Label>
                <Input
                  ref={firstInputRef}
                  id="email"
                  type="email"
                  placeholder={portalInfo.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-slate-50/30 text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Password</Label>
                  <Link
                    to={`/auth/reset-password?portal=${portal}`}
                    className="text-[12px] font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-2"
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
                    className="h-12 pr-14 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-slate-50/30 text-slate-900 placeholder:text-slate-400 transition-all"
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
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all duration-300 gap-2 mt-4 shadow-md shadow-blue-600/10" 
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

            <div className="mt-10 pt-8 border-t border-slate-100">
              <p className="text-center text-sm text-slate-500 font-medium">
                Don't have an account?{" "}
                <Link to={`/auth/signup?portal=${portal}`} className="text-blue-600 font-bold hover:text-blue-700 underline underline-offset-4 decoration-2">
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 w-full">
              <div className="h-px bg-slate-100 flex-grow" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest shrink-0">Switch Portal</span>
              <div className="h-px bg-slate-100 flex-grow" />
            </div>

            <div className="flex gap-4">
              {portal !== "client" && (
                <Link to="/auth/login?portal=client" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">
                  Switch to Client Login
                </Link>
              )}
              {portal !== "talent" && (
                <Link to="/auth/login?portal=talent" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">
                  Switch to Talent Login
                </Link>
              )}
              {portal !== "admin" && (
                <Link to="/auth/login?portal=admin" className="text-xs font-bold text-slate-300 hover:text-slate-500 transition-colors">
                  Admin Access
                </Link>
              )}
            </div>
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
