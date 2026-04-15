import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail } from "lucide-react";
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
      <div className="min-h-screen bg-background flex items-center justify-center px-8">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <Link to={`/auth/login?portal=${portal}`}>
            <Button variant="outline" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-8">
      <div className="max-w-md w-full">
        <Link
          to={`/auth/login?portal=${portal}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <div className="mb-8">
          <img src="/images/logocolored.png" alt="OPSlyHR" className="h-40 mb-6" />
          <h1 className="text-3xl font-bold text-foreground">Reset password</h1>
          <p className="text-muted-foreground mt-2">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-[54px] rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-[54px] rounded-xl"
            size="lg"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
