import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Star } from "lucide-react";
import taskiveLogo from "@/assets/taskive-logo.png";
import { z } from "zod";
import { getFriendlyErrorMessage } from "@/utils/errorHandling";

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

      // Add user role
      if (data.user) {
        // Profile and Role creation is now handled by the 'handle_new_user' database trigger 
        // based on the user_metadata provided in the signUp call.
      }

      toast({
        title: "Account created!",
        description: `Welcome to Taskive, ${isTalent ? formData.firstName : formData.fullName}! Your account has been created successfully.`,
      });

      navigate(`/${portal}/dashboard`);
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Brand Side (Left/Top) */}
      <div className={`hidden lg:flex flex-1 relative bg-blue-950 items-center justify-center p-12 overflow-hidden`}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 to-slate-900/90"></div>

        <div className="relative z-10 max-w-md text-white">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-950 font-bold text-xl">T</div>
            <span className="text-2xl font-bold tracking-tight">Taskive</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight font-display">
            {isTalent ? "Accelerate Your Career" : "Build Your Dream Team"}
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-8">
            {isTalent
              ? "Join an exclusive network of top-tier product and operations professionals. Work with the world's fastest-growing companies."
              : "Access a curated pool of pre-vetted experts ready to drive your business forward from day one."}
          </p>

          {/* Testimonial or Stat */}
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
            <div className="flex text-amber-400 mb-2">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <p className="text-white/90 italic mb-4">"The quality of talent on Taskive is simply unmatched. We hired our Head of Product in 3 days."</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
              <div>
                <div className="font-bold text-sm">Sarah Jenkins</div>
                <div className="text-xs text-blue-200">CTO, FinTech Co</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side (Right) */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-20 xl:px-32 py-12 bg-white relative">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-950 rounded-lg flex items-center justify-center text-white font-bold">T</div>
              <span className="text-xl font-bold text-blue-950">Taskive</span>
            </div>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-3 font-display">
              {isTalent ? "Apply as Talent" : "Create Client Account"}
            </h1>
            <p className="text-slate-500 text-lg">
              {isTalent
                ? "Create your profile to get matched with opportunities."
                : "Get started with your first hire today."}
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {isTalent ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-700 font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="h-12 border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 bg-white text-slate-900 placeholder:text-slate-400"
                  />
                  {errors.firstName && <p className="text-sm text-red-600 font-medium">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-700 font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="h-12 border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 bg-white text-slate-900 placeholder:text-slate-400"
                  />
                  {errors.lastName && <p className="text-sm text-red-600 font-medium">{errors.lastName}</p>}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-slate-700 font-medium">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Acme Inc."
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="h-12 border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 bg-white text-slate-900 placeholder:text-slate-400"
                  />
                  {errors.companyName && <p className="text-sm text-red-600 font-medium">{errors.companyName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-700 font-medium">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Smith"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="h-12 border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 bg-white text-slate-900 placeholder:text-slate-400"
                  />
                  {errors.fullName && <p className="text-sm text-red-600 font-medium">{errors.fullName}</p>}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">{isTalent ? "Email Address" : "Work Email"}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-12 border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 bg-white text-slate-900 placeholder:text-slate-400"
              />
              {errors.email && <p className="text-sm text-red-600 font-medium">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
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
              {errors.password && <p className="text-sm text-red-600 font-medium">{errors.password}</p>}
              <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
            </div>

            <Button type="submit" className="w-full h-14 text-lg bg-blue-950 hover:bg-blue-900 text-white shadow-xl shadow-blue-900/10 rounded-xl font-bold transition-all" size="lg" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center mt-8 text-slate-500">
            Already have an account?{" "}
            <Link to={`/auth/login?portal=${portal}`} className="text-blue-600 font-bold hover:text-blue-800 hover:underline">
              Sign in
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex justify-center flex-col items-center gap-2">
              <span className="text-sm text-slate-500">
                {isTalent ? "Looking to hire?" : "Looking to find work?"}
              </span>
              <Link to={`/auth/signup?portal=${isTalent ? "client" : "talent"}`}>
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-950 font-medium">
                  {isTalent ? "Create Client Account" : "Apply as Talent"} &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
