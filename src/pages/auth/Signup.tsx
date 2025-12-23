import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import taskiveLogo from "@/assets/taskive-logo.png";
import { z } from "zod";

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
      const redirectUrl = `${window.location.origin}/${portal}/onboarding`;

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
        await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: isTalent ? "talent" : "client",
        });
      }

      toast({
        title: "Account created!",
        description: `Welcome to Taskive. Let's complete your ${isTalent ? "profile" : "company"} setup.`,
      });

      navigate(`/${portal}/onboarding`);
    } catch (error: any) {
      if (error.message.includes("already registered")) {
        toast({
          title: "Account exists",
          description: "This email is already registered. Please sign in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <img src={taskiveLogo} alt="Taskive" className="h-10 mb-6" />
            <h1 className="text-3xl font-bold text-foreground">
              {isTalent ? "Join as a Talent" : "Create your account"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isTalent
                ? "Start your journey with top global businesses"
                : "Start hiring top talent for your business"}
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {isTalent ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="h-12"
                    />
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="h-12"
                    />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Acme Inc."
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />
                  {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Smith"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{isTalent ? "Email" : "Work Email"}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-12"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
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
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="text-center mt-6 text-muted-foreground">
            Already have an account?{" "}
            <Link to={`/auth/login?portal=${portal}`} className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-4">
              {isTalent ? "Looking to hire?" : "Looking to work?"}
            </p>
            <div className="flex justify-center">
              <Link to={`/auth/signup?portal=${isTalent ? "client" : "talent"}`}>
                <Button variant="outline" size="sm">
                  {isTalent ? "Sign up as Client" : "Sign up as Talent"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className={`hidden lg:flex flex-1 bg-gradient-to-br ${isTalent ? "from-accent to-primary" : "from-primary to-accent"} items-center justify-center p-12`}>
        <div className="max-w-md text-center text-primary-foreground">
          <h2 className="text-4xl font-bold mb-4">
            {isTalent ? "Build Your Global Career" : "Access Top Talent Globally"}
          </h2>
          <p className="text-lg opacity-90">
            {isTalent
              ? "Join our network of vetted professionals and work with leading companies worldwide."
              : "Join hundreds of businesses finding the perfect Product and Operations professionals through Taskive."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
