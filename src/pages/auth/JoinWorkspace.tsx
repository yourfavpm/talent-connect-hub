import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2, CheckCircle, XCircle } from "lucide-react";
import Logo from "@/components/Logo";

type InviteStatus = "loading" | "valid" | "invalid" | "expired" | "already_accepted";
type Mode = "login" | "signup";

export default function JoinWorkspace() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = params.get("token");

  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("loading");
  const [invite, setInvite] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [mode, setMode] = useState<Mode>("signup");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setInviteStatus("invalid");
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    const { data: inv, error } = await (supabase
      .from("client_invites" as any)
      .select("*, client:clients(company_name, primary_contact_name)")
      .eq("token", token!)
      .maybeSingle() as any);

    if (error || !inv) {
      setInviteStatus("invalid");
      return;
    }
    if (inv.status === "accepted") {
      setInviteStatus("already_accepted");
      return;
    }
    if (inv.status === "revoked" || new Date(inv.expires_at) < new Date()) {
      setInviteStatus("expired");
      return;
    }

    setInvite(inv);
    setClient(inv.client);
    setForm((f) => ({ ...f, email: inv.email }));
    setInviteStatus("valid");

    // Check if this email already has a Supabase account
    setMode("signup");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.password) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            full_name: `${form.firstName} ${form.lastName}`,
            invite_token: token,
          },
        },
      });
      if (signUpError) throw signUpError;

      // Accept invite
      await acceptInvite(signUpData.user?.id);
      toast({ title: "Welcome to OpslyHR!", description: `You've joined ${client?.company_name}.` });
      navigate("/client/dashboard");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (loginError) throw loginError;

      await acceptInvite(loginData.user?.id);
      toast({ title: "Workspace joined!", description: `You've joined ${client?.company_name}.` });
      navigate("/client/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async (userId?: string) => {
    if (!userId || !invite) return;

    // Add to client_members
    await (supabase.from("client_members" as any).upsert({
      client_id: invite.client_id,
      user_id: userId,
      role: invite.role,
      status: "active",
      invited_by: invite.invited_by,
      accepted_at: new Date().toISOString(),
    }, { onConflict: "client_id,user_id" }) as any);

    // Mark invite as accepted
    await (supabase
      .from("client_invites" as any)
      .update({ status: "accepted" })
      .eq("id", invite.id) as any);

    // Ensure user has the 'client' role
    await (supabase.from("user_roles" as any).upsert(
      { user_id: userId, role: "client" },
      { onConflict: "user_id,role" }
    ) as any);
  };

  // ── Render States ─────────────────────────────────────────────
  if (inviteStatus === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Validating invitation…</p>
        </div>
      </div>
    );
  }

  if (inviteStatus === "invalid" || inviteStatus === "expired" || inviteStatus === "already_accepted") {
    const messages: Record<string, { icon: any; title: string; body: string }> = {
      invalid: {
        icon: XCircle,
        title: "Invalid Invitation",
        body: "This invitation link is not valid or has already been used.",
      },
      expired: {
        icon: XCircle,
        title: "Invitation Expired",
        body: "This invitation link has expired. Please ask your team to send a new invite.",
      },
      already_accepted: {
        icon: CheckCircle,
        title: "Already Accepted",
        body: "You've already accepted this invitation. Please log in to access your workspace.",
      },
    };
    const { icon: Icon, title, body } = messages[inviteStatus];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-sm w-full text-center">
          <Icon
            className={`h-12 w-12 mx-auto mb-4 ${inviteStatus === "already_accepted" ? "text-green-500" : "text-red-500"}`}
          />
          <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-500 mb-6">{body}</p>
          <Link to="/auth/login?portal=client">
            <Button className="w-full">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Valid Invite — Show signup/login form ─────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f2147] to-[#1e3a6e] px-8 py-8 text-center">
          <Logo showText={false} imgHeight="h-8" className="mx-auto mb-4" />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-blue-300" />
            <span className="text-blue-200 text-sm font-medium">{client?.company_name}</span>
          </div>
          <h1 className="text-white text-xl font-bold">Join your team workspace</h1>
          <p className="text-blue-200 text-sm mt-1">
            You've been invited as a <span className="font-semibold capitalize">{invite?.role}</span>
          </p>
        </div>

        <div className="p-8">
          {/* Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "signup" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setMode("signup")}
            >
              Create account
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "login" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setMode("login")}
            >
              Already have an account
            </button>
          </div>

          {mode === "signup" ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Jane"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Smith"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} readOnly className="bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Join {client?.company_name}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} readOnly className="bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Your password"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Log in & join workspace
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
