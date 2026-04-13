import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Star, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { z } from "zod";
import { getFriendlyErrorMessage } from "@/utils/errorHandling";
import { 
  sendClientWelcomeEmail, 
  requestClientVerification
} from "@/lib/email/triggers";

const clientSignupSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(100),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type ClientSignupData = z.infer<typeof clientSignupSchema>;

const ClientSignup = () => {
  const [formData, setFormData] = useState<ClientSignupData & { companyName: string; fullName: string; email: string; password: string }>({
    companyName: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate form
    const result = clientSignupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/client/dashboard`;

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { 
            full_name: formData.fullName, 
            company_name: formData.companyName, 
            portal: "client" 
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Assign client role
        const { error: roleError } = await supabase
          .from("user_roles")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert({ user_id: data.user.id, role: "client" } as any);
        
        if (roleError) console.error("Failed to assign client role:", roleError);
        
        try {
          // Secure Verification Flow
          if (!data.session) {
            await requestClientVerification(
              data.user.id,
              formData.email,
              formData.fullName
            );
          }

          // Welcome Email
          await sendClientWelcomeEmail({
            email: formData.email,
            contactName: formData.fullName,
            companyName: formData.companyName,
          });
        } catch (emailError) {
          console.error('Failed to send notifications:', emailError);
        }
      }

      if (data.user) {
        toast({
          title: "Account created!",
          description: `Welcome to OPSlyHR, ${formData.fullName}! Please check your email to verify your account.`,
        });
        navigate("/auth/check-email");
      }
    } catch (err: unknown) {
      toast({
        title: "Signup failed",
        description: getFriendlyErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const companyNameRef = useRef<HTMLInputElement>(null);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  const scrollToForm = () => {
    const formElement = document.getElementById("form");
    formElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    companyNameRef.current?.focus();
  };

  useEffect(() => {
    const checkScroll = () => {
      if (window.innerWidth <= 767) {
        const formElement = document.getElementById("form");
        if (formElement) {
          const rect = formElement.getBoundingClientRect();
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
    if (isMobile || window.location.hash === "#form") {
      const formElement = document.getElementById("form");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          companyNameRef.current?.focus();
        }, 600);
      }
    } else {
      companyNameRef.current?.focus();
    }

    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col-reverse lg:flex-row bg-white font-inter overflow-x-hidden">
      {/* Brand Side (40%) - Light Style */}
      <div className="lg:w-[40%] bg-slate-50/80 border-r border-slate-100 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl -z-10"></div>
        
        <div>
          <Link to="/" className="inline-block mb-16 lg:mb-24">
            <img src="/images/logoplain.png" alt="OPSlyHR" className="h-32" />
          </Link>

          <div className="max-w-md">
            <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 leading-tight mb-4 tracking-tight">
              Get Started
            </h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12">
              OPSlyHR provides structured systems for hiring and managing pre-vetted product and operations talent globally.
            </p>

            <div className="space-y-6 pt-10 border-t border-slate-200/60 max-w-sm">
              <div className="flex items-start gap-4">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1">
                  <Star className="w-3 h-3 text-white fill-current" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Pre-Vetted Excellence</div>
                  <div className="text-xs text-slate-500 font-medium">Standardized evaluation of execution and outcomes.</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center shrink-0 mt-1">
                  <Star className="w-3 h-3 text-white fill-current" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Enterprise Ready</div>
                  <div className="text-xs text-slate-500 font-medium">Full compliance, automated invoicing, and secure payments.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="form" className="lg:w-[60%] flex flex-col justify-center px-6 lg:px-20 xl:px-32 py-12 bg-white relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex flex-col items-center mb-10 text-center">
          <Link to="/" className="mb-6">
            <img src="/images/logoplain.png" alt="OPSlyHR" className="h-28" />
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight leading-tight mb-3">
            Get Started
          </h1>
          <p className="text-slate-500 text-base font-medium leading-relaxed">
            OPSlyHR provides structured systems for hiring and managing pre-vetted product and operations talent globally.
          </p>
        </div>

        <div className="max-w-md w-full mx-auto">
          <div className="hidden lg:block mb-6 text-left">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1.5">
              Get Started
            </h1>
            <p className="text-slate-500 text-base font-medium">
              Manage your talent pipeline with precision.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Company Name</Label>
              <Input
                ref={companyNameRef}
                id="companyName"
                name="companyName"
                type="text"
                placeholder="Acme Inc."
                value={formData.companyName}
                onChange={handleChange}
                required
                className="h-11 border-slate-100 rounded-lg focus:ring-blue-600/5 focus:border-blue-500 bg-white shadow-sm text-slate-800"
              />
              {errors.companyName && <p className="text-xs text-red-500 font-medium">{errors.companyName}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Smith"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="h-11 border-slate-100 rounded-lg focus:ring-blue-600/5 focus:border-blue-500 bg-white shadow-sm text-slate-800"
              />
              {errors.fullName && <p className="text-xs text-red-500 font-medium">{errors.fullName}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Work Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-11 border-slate-100 rounded-lg focus:ring-blue-600/5 focus:border-blue-500 bg-white shadow-sm text-slate-800"
              />
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="h-11 pr-10 border-slate-100 rounded-lg focus:ring-blue-600/5 focus:border-blue-500 bg-white shadow-sm text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-all duration-300 gap-2 mt-2" 
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center mt-8 text-sm text-slate-500 font-medium">
            Already have an account?{" "}
            <Link to="/auth/login?portal=client" className="text-blue-600 font-semibold hover:text-blue-700 underline underline-offset-4 decoration-1">
              Sign in
            </Link>
          </p>
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
              Start here
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientSignup;
