import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, ArrowRight, Shield } from "lucide-react";
import Logo from "@/components/Logo";
import { sendTalentPasswordResetEmail, sendClientPasswordResetEmail } from "@/lib/email/triggers";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [searchParams] = useSearchParams();
  const portal = searchParams.get("portal") || "client";
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth/update-password?portal=${portal}`;
      
      console.log(`Requesting password reset for ${email} in ${portal} portal`);
      
      if (portal === 'talent') {
        const { data: profile } = await (supabase
          .from('profiles')
          .select('first_name')
          .eq('email', email)
          .maybeSingle() as Promise<{ data: { first_name: string } | null; error: any }>);
        await sendTalentPasswordResetEmail(email, profile?.first_name || "Talent", redirectUrl);
      } else {
        const { data: client } = await (supabase
          .from('clients')
          .select('company_name')
          .eq('primary_contact_email', email)
          .maybeSingle() as Promise<{ data: { company_name: string } | null; error: any }>);
        await sendClientPasswordResetEmail(email, client?.company_name || "Client", redirectUrl);
      }

      setSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your inbox for the password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex flex-col-reverse lg:flex-row font-inter overflow-x-hidden">
        {/* BRAND SIDE */}
        <div className="lg:w-[45%] relative border-r border-slate-100 flex flex-col justify-between overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={portal === "talent" ? "/images/auth/talent-side.jpg" : "/images/auth/client-side.jpg"}
                    alt="Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]" />
            </div>

            <div className="relative z-10 p-8 lg:p-16 flex flex-col justify-between h-full">
                <div>
                    <Link to="/" className="inline-block mb-16 lg:mb-24">
                        <Logo showText={false} imgHeight="h-20" variant="light" />
                    </Link>
                    <div className="max-w-md">
                        <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-4 tracking-tight">Recover your account.</h2>
                        <p className="text-slate-200 text-lg font-medium leading-relaxed mb-10 opacity-90">We've sent a recovery link to your email to help you get back to work smoothly.</p>
                    </div>
                </div>

                <div className="mt-auto pt-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                        Secure Account Recovery
                    </p>
                </div>
            </div>
        </div>

        {/* CONTENT SIDE */}
        <div className="lg:w-[55%] flex flex-col justify-center px-6 lg:px-20 xl:px-32 py-12 bg-white relative">
            <div className="max-w-[440px] w-full mx-auto text-center">
                <div className="bg-white border border-slate-100 rounded-2xl p-8 md:p-10 shadow-sm shadow-slate-200/40 relative">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Mail className="h-8 w-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-900 mb-2">Check your email</h1>
                    <p className="text-slate-500 text-sm font-medium mb-8">
                        We've sent a password reset link to <strong>{email}</strong>
                    </p>
                    <Link to={`/auth/login?portal=${portal}`}>
                        <Button className="w-full h-[54px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all shadow-sm">
                            Back to sign in
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col-reverse lg:flex-row bg-white font-inter overflow-x-hidden">
      {/* BRAND SIDE PANEL */}
      <div className="lg:w-[45%] relative border-r border-slate-100 flex flex-col justify-between overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 text-white">
          <img 
            src={portal === "talent" ? "/images/auth/talent-side.jpg" : "/images/auth/client-side.jpg"}
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 p-8 lg:p-16 flex flex-col justify-between h-full">
          <div>
            <Link to="/" className="inline-block mb-16 lg:mb-24">
              <Logo showText={false} imgHeight="h-20" variant="light" />
            </Link>

            <div className="max-w-md">
              <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-4 tracking-tight">
                Password Recovery
              </h2>
              <p className="text-slate-200 text-lg font-medium leading-relaxed mb-10 opacity-90">
                Don't worry, it happens. Enter your professional email and we'll help you securely reset your credentials.
              </p>
              <div className="flex items-center gap-3 py-6 border-t border-white/10">
                  <Shield className="w-5 h-5 text-blue-400/60" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Secure Verification</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
              Identity Protection Standards
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT SIDE (FORM) */}
      <div className="lg:w-[55%] flex flex-col justify-center px-6 lg:px-20 xl:px-32 py-12 bg-white relative">
        <div className="max-w-[440px] w-full mx-auto">
          <Link
            to={`/auth/login?portal=${portal}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-8 transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>

          <div className="bg-white border border-slate-100 rounded-2xl p-8 md:p-10 shadow-sm shadow-slate-200/40 relative">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1">Reset password</h1>
              <p className="text-slate-500 text-sm font-medium">Enter your email to receive a reset link.</p>
            </div>

            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-[54px] border-slate-100 rounded-xl focus:ring-blue-600/5 focus:border-blue-500 bg-white shadow-sm text-slate-800 placeholder:text-slate-300 transition-all font-inter"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-[54px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all duration-300 gap-2 shadow-sm"
                disabled={loading}
              >
                {loading ? "Sending..." : <>Send Reset Link <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
