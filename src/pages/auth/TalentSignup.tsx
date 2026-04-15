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
  sendTalentWelcomeEmail, 
  sendTalentAccountCreatedEmail, 
  requestTalentVerification
} from "@/lib/email/triggers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const talentSignupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  heardFrom: z.string().min(1, "Please tell us how you heard about us"),
});

type TalentSignupData = z.infer<typeof talentSignupSchema>;

const TalentSignup = () => {
  const [formData, setFormData] = useState<TalentSignupData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    heardFrom: "",
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

    // 1. Validate form
    const result = talentSignupSchema.safeParse(formData);
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

    // 2. Business Logic: Check email uniqueness for Talent
    try {
      const { data: existence, error: existenceError } = await supabase
        .rpc('check_user_role_existence', { p_email: formData.email });

      if (!existenceError && existence && existence.length > 0) {
        const { has_client_role } = existence[0];
        if (has_client_role) {
          toast({
            title: "Email conflict",
            description: "This email is already registered as a Client. Talent accounts must use a different email.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }
    } catch (checkErr) {
      console.warn("Uniqueness check skipped:", checkErr);
    }

    try {
      // Redirect to the onboarding check route instead of directly to dashboard
      // This allows us to automatically route new signups through onboarding if needed
      const redirectUrl = `${window.location.origin}/talent/onboarding-redirect`;

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { 
            first_name: formData.firstName, 
            last_name: formData.lastName, 
            portal: "talent",
            heard_from: formData.heardFrom
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Assign talent role
        const { error: roleError } = await supabase
          .from("user_roles")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert({ user_id: data.user.id, role: "talent" } as any);
        
        if (roleError) console.error("Failed to assign talent role:", roleError);
        
        try {
          // 1. Account Created Notification
          await sendTalentAccountCreatedEmail(
            formData.email, 
            formData.firstName, 
            redirectUrl
          );

          // 2. Secure Verification Flow
          if (!data.session) {
            await requestTalentVerification(
              data.user.id,
              formData.email,
              formData.firstName
            );
          }
          
          // 3. Welcome Email
          await sendTalentWelcomeEmail({
            email: formData.email,
            firstName: formData.firstName,
          });
        } catch (emailError) {
          console.error('Failed to send notifications:', emailError);
        }
      }

      if (data.user) {
        toast({
          title: "Account created!",
          description: `Welcome to OPSlyHR, ${formData.firstName}! Please check your email to verify your account.`,
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

  const firstNameRef = useRef<HTMLInputElement>(null);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  const scrollToForm = () => {
    const formElement = document.getElementById("form");
    formElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    firstNameRef.current?.focus();
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
          firstNameRef.current?.focus();
        }, 600);
      }
    } else {
      firstNameRef.current?.focus();
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
            <img src="/images/logocolored.png" alt="OPSlyHR" className="h-32" />
          </Link>

          <div className="max-w-md">
            <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 leading-tight mb-4 tracking-tight">
              Apply as Talent
            </h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12">
              Join an exclusive network of high-ownership professionals. Work with curated companies on your terms.
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
            <img src="/images/logocolored.png" alt="OPSlyHR" className="h-28" />
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight leading-tight mb-3">
            Apply as Talent
          </h1>
          <p className="text-slate-500 text-base font-medium leading-relaxed">
            Join an exclusive network of high-ownership professionals. Work with curated companies on your terms.
          </p>
        </div>

        <div className="max-w-md w-full mx-auto">
          <div className="hidden lg:block mb-6 text-left">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1.5">
              Apply as Talent
            </h1>
            <p className="text-slate-500 text-base font-medium">
              Create your profile to join our curated network.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">First Name</Label>
                <Input
                  ref={firstNameRef}
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="h-[54px] border-slate-100 rounded-xl focus:ring-blue-600/5 focus:border-blue-500 bg-white shadow-sm text-slate-800"
                />
                {errors.firstName && <p className="text-xs text-red-500 font-medium">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="h-[54px] border-slate-100 rounded-xl focus:ring-blue-600/5 focus:border-blue-500 bg-white shadow-sm text-slate-800"
                />
                {errors.lastName && <p className="text-xs text-red-500 font-medium">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-[54px] border-slate-100 rounded-xl focus:ring-blue-600/5 focus:border-blue-500 bg-white shadow-sm text-slate-800"
              />
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="heardFrom" className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">How did you hear about us?</Label>
              <Select 
                value={formData.heardFrom} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, heardFrom: value }))}
              >
                <SelectTrigger className="h-[54px] border-slate-100 rounded-xl focus:ring-blue-600/5 focus:border-blue-500 bg-white shadow-sm text-slate-800">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">Twitter / X</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="google">Search Engine (Google/Bing)</SelectItem>
                  <SelectItem value="referral">Friend or Colleague</SelectItem>
                  <SelectItem value="domain_assistant">The Domain Assistant</SelectItem>
                  <SelectItem value="blog">Blog or Article</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.heardFrom && <p className="text-xs text-red-500 font-medium">{errors.heardFrom}</p>}
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
                  className="h-[54px] pr-10 border-slate-100 rounded-xl focus:ring-blue-600/5 focus:border-blue-500 bg-white shadow-sm text-slate-800"
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
              className="w-full h-[54px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all duration-300 gap-2 mt-2" 
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center mt-8 text-sm text-slate-500 font-medium">
            Already have an account?{" "}
            <Link to="/auth/login?portal=talent" className="text-blue-600 font-semibold hover:text-blue-700 underline underline-offset-4 decoration-1">
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

export default TalentSignup;
