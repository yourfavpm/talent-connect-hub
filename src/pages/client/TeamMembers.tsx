import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserPlus,
  Mail,
  MoreHorizontal,
  Shield,
  Crown,
  Briefcase,
  Clock,
  RefreshCw,
  XCircle,
  Loader2,
  User,
} from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  owner: { label: "Owner", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Crown },
  admin: { label: "Admin", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Shield },
  manager: { label: "Manager", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: Briefcase },
  staff: { label: "Staff", color: "bg-gray-100 text-gray-800 border-gray-200", icon: User },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-100 text-green-800 border-green-200" },
  invited: { label: "Invited", color: "bg-amber-100 text-amber-800 border-amber-200" },
  suspended: { label: "Suspended", color: "bg-red-100 text-red-800 border-red-200" },
};

interface Member {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "manager" | "staff";
  status: "active" | "invited" | "suspended";
  invited_at: string;
  accepted_at: string | null;
  profile?: { first_name: string | null; last_name: string | null; email: string; avatar_url: string | null };
}

interface PendingInvite {
  id: string;
  email: string;
  role: "admin" | "manager" | "staff";
  status: string;
  invited_at: string;
  expires_at: string;
}

export default function TeamMembers() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [clientId, setClientId] = useState<string | null>(null);
  const [client, setClient] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [myRole, setMyRole] = useState<string>("manager");

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "staff">("staff");
  const [inviting, setInviting] = useState(false);

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Resolve client_id via RPC
      const { data: cId } = await (supabase.rpc("get_my_client_id" as any) as any);
      if (!cId) return;
      setClientId(cId);

      // Fetch client record
      const { data: clientData } = await supabase.from("clients" as any)
        .select("id, company_name, user_id")
        .eq("id", cId)
        .single();
      setClient(clientData);
      setIsOwner(clientData?.user_id === user?.id);

      // Fetch active members with profiles
      const { data: membersData } = await (supabase
        .from("client_members" as any)
        .select("id, user_id, role, status, invited_at, accepted_at, profile:profiles(first_name, last_name, email, avatar_url)")
        .eq("client_id", cId)
        .order("invited_at", { ascending: true }) as any);
      setMembers(membersData || []);

      // Determine my role
      const me = (membersData || []).find((m: Member) => m.user_id === user?.id);
      setMyRole(me?.role || (clientData?.user_id === user?.id ? "owner" : "manager"));

      // Pending invites
      const { data: invitesData } = await (supabase
        .from("client_invites" as any)
        .select("id, email, role, status, created_at, expires_at")
        .eq("client_id", cId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }) as any);
      setPendingInvites(invitesData || []);

      // Subscription
      const { data: sub } = await (supabase
        .from("client_subscriptions" as any)
        .select("*")
        .eq("client_id", cId)
        .single() as any);
      setSubscription(sub);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-client-member`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send invite");

      toast({ title: "Invite sent!", description: `${inviteEmail} has been invited as ${inviteRole}.` });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("staff");
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    await (supabase.from("client_invites" as any).update({ status: "revoked" }).eq("id", inviteId) as any);
    toast({ title: "Invite revoked" });
    fetchAll();
  };

  const changeMemberRole = async (memberId: string, newRole: string) => {
    await (supabase.from("client_members" as any).update({ role: newRole }).eq("id", memberId) as any);
    toast({ title: "Role updated" });
    fetchAll();
  };

  const suspendMember = async (memberId: string) => {
    await (supabase.from("client_members" as any).update({ status: "suspended" }).eq("id", memberId) as any);
    toast({ title: "Member suspended" });
    fetchAll();
  };

  const reactivateMember = async (memberId: string) => {
    await (supabase.from("client_members" as any).update({ status: "active" }).eq("id", memberId) as any);
    toast({ title: "Member reactivated" });
    fetchAll();
  };

  const canManage = isOwner || myRole === "admin";
  const usedSeats = members.filter((m) => m.status === "active").length + 1; // +1 for owner
  const maxSeats = subscription?.max_team_members || 3;

  const getInitials = (m: Member) => {
    const fn = m.profile?.first_name || "";
    const ln = m.profile?.last_name || "";
    return fn && ln ? `${fn[0]}${ln[0]}`.toUpperCase() : (m.profile?.email?.[0] || "?").toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Team Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage who has access to your OpslyHR workspace.</p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteOpen(true)} disabled={usedSeats >= maxSeats}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Seat Usage */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {usedSeats} / {maxSeats} seats used
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {subscription?.plan || "Starter"} plan · {subscription?.status || "trialing"}
            </p>
          </div>
        </div>
        {usedSeats >= maxSeats && (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
            Seat limit reached
          </Badge>
        )}
      </div>

      {/* Active Members */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Workspace Members</h2>
          <span className="text-xs text-gray-400">{members.length + 1} total</span>
        </div>

        <div className="divide-y divide-gray-50">
          {/* Owner row */}
          {client && (
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Crown className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {user?.id === client.user_id ? "You" : client.primary_contact_name || "Owner"}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.id === client.user_id ? user.email : ""}</p>
              </div>
              <Badge className={ROLE_CONFIG.owner.color + " text-xs"}>Owner</Badge>
              <Badge className={STATUS_CONFIG.active.color + " text-xs"}>Active</Badge>
            </div>
          )}

          {/* Member rows */}
          {members.map((member) => {
            const roleConf = ROLE_CONFIG[member.role] || ROLE_CONFIG.manager;
            const statusConf = STATUS_CONFIG[member.status] || STATUS_CONFIG.active;
            const RoleIcon = roleConf.icon;
            const isSelf = member.user_id === user?.id;

            return (
              <div key={member.id} className="px-5 py-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-600">
                  {getInitials(member)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {member.profile?.first_name && member.profile?.last_name
                      ? `${member.profile.first_name} ${member.profile.last_name}`
                      : member.profile?.email || "—"}
                    {isSelf && <span className="text-gray-400 font-normal ml-1">(you)</span>}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{member.profile?.email}</p>
                </div>
                <Badge className={`${roleConf.color} text-xs`}>
                  <RoleIcon className="h-3 w-3 mr-1 inline" />{roleConf.label}
                </Badge>
                <Badge className={`${statusConf.color} text-xs`}>{statusConf.label}</Badge>

                {canManage && !isSelf && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => changeMemberRole(member.id, "admin")}>
                        <Shield className="h-4 w-4 mr-2" /> Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => changeMemberRole(member.id, "manager")}>
                        <Briefcase className="h-4 w-4 mr-2" /> Make Manager
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => changeMemberRole(member.id, "staff")}>
                        <User className="h-4 w-4 mr-2" /> Make Staff
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {member.status === "active" ? (
                        <DropdownMenuItem
                          onClick={() => suspendMember(member.id)}
                          className="text-red-600 focus:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-2" /> Suspend
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => reactivateMember(member.id)}>
                          <RefreshCw className="h-4 w-4 mr-2" /> Reactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Pending Invitations</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="px-5 py-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{inv.email}</p>
                  <p className="text-xs text-gray-400">
                    Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={`${ROLE_CONFIG[inv.role]?.color || ""} text-xs`}>
                  {ROLE_CONFIG[inv.role]?.label}
                </Badge>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Pending</Badge>
                {canManage && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => revokeInvite(inv.id)}>
                      Revoke
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <Input
                type="email"
                placeholder="jane@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "manager" | "staff")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — can invite, manage members, approve timesheets</SelectItem>
                  <SelectItem value="manager">Manager — can view team, approve timesheets, send messages</SelectItem>
                  <SelectItem value="staff">Staff — can only view their own tasks and perform work</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-gray-50 p-3 rounded-lg">
              <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              Invitation link expires in 7 days.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={sendInvite} disabled={inviting}>
              {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
