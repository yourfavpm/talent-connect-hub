import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Star, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { z } from "zod";
import { getFriendlyErrorMessage } from "@/utils/errorHandling";
import { sendClientWelcomeEmail, sendTalentWelcomeEmail, sendTalentAccountCreatedEmail, sendTalentVerificationEmail } from "@/lib/email/triggers";

const clientSignupSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(100),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const talentSignupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const Signup = () => {
  const [searchParams] = useSearchParams();
  const portal = searchParams.get("portal") || "client";
  const isTalent = portal === "talent";

  const [formData, setFormData] = useState({
    companyName: "",
    fullName: "",
    firstName: "",
    lastName: "",
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

    // Validate form based on portal
    const schema = isTalent ? talentSignupSchema : clientSignupSchema;
    const dataToValidate = isTalent
      ? { firstName: formData.firstName, lastName: formData.lastName, email: formData.email, password: formData.password }
      : { companyName: formData.companyName, fullName: formData.fullName, email: formData.email, password: formData.password };

    const result = schema.safeParse(dataToValidate);
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
      const redirectUrl = `${window.location.origin}/${portal}/dashboard`;

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: isTalent
            ? { first_name: formData.firstName, last_name: formData.lastName, portal: "talent" }
            : { full_name: formData.fullName, company_name: formData.companyName, portal: "client" },
        },
      });

      if (error) throw error;

      // Send email notifications after successful signup
      if (data.user) {
        try {
          if (isTalent) {
            // 1. Account Created Notification
            await sendTalentAccountCreatedEmail(
              formData.email, 
              formData.firstName, 
              redirectUrl
            );

            // 2. Verification Required (if not auto-confirmed)
            if (!data.session) {
              await sendTalentVerificationEmail(
                formData.email,
                formData.firstName,
                redirectUrl
              );
            }
            
            // 3. Immersive Onboarding Welcome
            await sendTalentWelcomeEmail({
              email: formData.email,
              firstName: formData.firstName,
            });
          } else {
            // Client Flow
            await sendClientWelcomeEmail({
              email: formData.email,
              contactName: formData.fullName,
              companyName: formData.companyName,
            });
          }
        } catch (emailError) {
          console.error('Failed to send notifications:', emailError);
        }
      }

      toast({
        title: "Account created!",
        description: `Welcome to OPSlyHR, ${isTalent ? formData.firstName : formData.fullName}! Your account has been created successfully.`,
      });

      navigate(`/${portal}/dashboard`);
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

  const firstNameRef = useRef<HTMLInputElement>(null);
  const companyNameRef = useRef<HTMLInputElement>(null);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  const scrollToForm = () => {
    const formElement = document.getElementById("form");
    formElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (isTalent) {
      firstNameRef.current?.focus();
    } else {
      companyNameRef.current?.focus();
    }
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
          if (isTalent) firstNameRef.current?.focus();
          else companyNameRef.current?.focus();
        }, 600);
      }
    } else {
      if (isTalent) firstNameRef.current?.focus();
      else companyNameRef.current?.focus();
    }

    return () => window.removeEventListener("scroll", checkScroll);
  }, [isTalent]);

  return (
    <div className="min-h-screen flex flex-col-reverse lg:flex-row bg-white font-inter overflow-x-hidden">
      {/* Brand Side (40%) - Light Style */}
      <div className="lg:w-[40%] bg-slate-50/80 border-r border-slate-100 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl -z-10"></div>
        
        <div>
          <Link to="/" className="inline-block mb-16 lg:mb-24">
            <img src="/images/logoplain.png" alt="OPSlyHR" className="h-28" />
          </Link>

          <div className="max-w-md">
            <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-blue-600 border border-slate-200 uppercase tracking-widest mb-6 shadow-sm">
              {isTalent ? "TALENT NETWORK" : "CLIENT ACCESS"}
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 leading-[1.15] mb-8 tracking-tight">
              {isTalent ? "Accelerate Your Career Outcomes." : "Build Your Operations Team Structurally."}
            </h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12">
              {isTalent
                ? "Join an exclusive network of high-ownership professionals. Work with curated companies on your terms."
                : "OPSlyHR provides structured systems for hiring and managing pre-vetted product and operations talent globally."}
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

        <div className="mt-12 lg:mt-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            © {new Date().getFullYear()} OPSlyHR HR Solutions.
          </p>
        </div>
      </div>

      <div id="form" className="lg:w-[60%] flex flex-col justify-center px-6 lg:px-20 xl:px-32 py-12 bg-white relative">
        {/* Mobile Header (Refined) */}
        <div className="lg:hidden flex flex-col items-center mb-10 text-center">
          <Link to="/" className="mb-6">
            <img src="/images/logoplain.png" alt="OPSlyHR" className="h-24" />
          </Link>
          <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-blue-600 border border-slate-200 uppercase tracking-widest mb-6">
            {isTalent ? "TALENT NETWORK" : "CLIENT ACCESS"}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
            {isTalent ? "Accelerate Your Career Outcomes." : "Build Your Operations Team Structurally."}
          </h1>
          <p className="text-slate-500 text-base font-medium leading-relaxed">
            {isTalent 
              ? "Join an exclusive network of high-ownership professionals. Work with curated companies on your terms."
              : "OPSlyHR provides structured systems for hiring and managing pre-vetted product and operations talent globally."}
          </p>
        </div>

        <div className="max-w-md w-full mx-auto">
          <div className="hidden lg:block mb-10 text-left">
            <h1 className="text-3xl font-bold text-slate-950 tracking-tight lg:text-4xl mb-3">
              {isTalent ? "Apply as Talent" : "Get Started"}
            </h1>
            <p className="text-slate-500 text-lg font-medium">
              {isTalent
                ? "Create your profile to join our curated network."
                : "Manage your talent pipeline with precision."}
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {isTalent ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">First Name</Label>
                  <Input
                    ref={firstNameRef}
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-slate-50/30 text-slate-900"
                  />
                  {errors.firstName && <p className="text-xs text-red-600 font-bold">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-slate-50/30 text-slate-900"
                  />
                  {errors.lastName && <p className="text-xs text-red-600 font-bold">{errors.lastName}</p>}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Company Name</Label>
                  <Input
                    ref={companyNameRef}
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Acme Inc."
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-slate-50/30 text-slate-900"
                  />
                  {errors.companyName && <p className="text-xs text-red-600 font-bold">{errors.companyName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Smith"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-slate-50/30 text-slate-900"
                  />
                  {errors.fullName && <p className="text-xs text-red-600 font-bold">{errors.fullName}</p>}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">{isTalent ? "Email Address" : "Work Email"}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-slate-50/30 text-slate-900"
              />
              {errors.email && <p className="text-xs text-red-600 font-bold">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="h-12 pr-10 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-slate-50/30 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 font-bold">{errors.password}</p>}
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-1">Must be at least 8 characters</p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-slate-950 hover:bg-blue-700 text-white rounded-lg font-bold transition-all duration-300 gap-2 mt-4" 
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account →"}
            </Button>
          </form>

          <p className="text-center mt-10 text-sm text-slate-500 font-medium">
            Already have an account?{" "}
            <Link to={`/auth/login?portal=${portal}`} className="text-blue-600 font-bold hover:text-blue-700 underline underline-offset-4">
              Sign in
            </Link>
          </p>

          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Are you a {isTalent ? "Company" : "Professional"}?</p>
             <Link to={`/auth/signup?portal=${isTalent ? "client" : "talent"}`}>
                <Button variant="outline" className="rounded-full border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all font-bold text-xs">
                  {isTalent ? "Register as Client" : "Apply as Talent"} →
                </Button>
             </Link>
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
              Start here
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Signup;
