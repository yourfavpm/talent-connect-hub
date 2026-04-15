import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";

import { getFriendlyErrorMessage } from "@/utils/errorHandling";

const AdminSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // STRICT ALLOWLIST
  const ALLOWED_ADMIN_EMAILS = ["opslyhr.dev@gmail.com"];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!ALLOWED_ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
      toast({
        title: "Unauthorized Access",
        description: "This email is not authorized for Admin access.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // 1. Sign Up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: "OPSlyHR Super Admin",
            first_name: "Super",
            last_name: "Admin",
            portal: "admin" // Add portal meta just in case
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // 2. Insert Super Admin Role
        // We use upsert to handle cases where role might already exist partially
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert({
            user_id: data.user.id,
            role: "super_admin",
          }, { onConflict: "user_id, role" });

        if (roleError) {
          console.error("Role assignment failed:", roleError);
        }
      }

      toast({
        title: "Admin Account Created",
        description: "Welcome. Please sign in.",
      });

      // Redirect to Login
      navigate("/auth/login?portal=admin");

    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <img src="/images/logoplain.png" alt="OPSlyHR" className="h-40 mx-auto mb-4 opacity-80" />
          <div className="flex items-center justify-center gap-2 text-red-500 mb-2">
            <ShieldAlert className="h-5 w-5" />
            <span className="font-bold text-sm tracking-wider uppercase">Restricted Access</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin System Setup</h1>
          <p className="text-slate-400 text-sm mt-2">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">System Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="hire@taskive.ca"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-[54px] rounded-xl bg-slate-950 border-slate-800 text-white focus:ring-red-500/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">Secure Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-[54px] rounded-xl bg-slate-950 border-slate-800 text-white pr-10 focus:ring-red-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-[54px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold" disabled={loading}>
            {loading ? "Verifying..." : "Initialize Admin Access"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminSignup;
