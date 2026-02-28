import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Mail, 
  UserPlus, 
  Ban, 
  Loader2, 
  Check, 
  Search,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TalentActionsDrawersProps {
  emailOpen: boolean;
  setEmailOpen: (open: boolean) => void;
  shortlistOpen: boolean;
  setShortlistOpen: (open: boolean) => void;
  suspendOpen: boolean;
  setSuspendOpen: (open: boolean) => void;
  assignOpen: boolean;
  setAssignOpen: (open: boolean) => void;
  tp: any;
  onSuccess: () => void;
}

const TalentActionsDrawers = ({
  emailOpen, setEmailOpen,
  shortlistOpen, setShortlistOpen,
  suspendOpen, setSuspendOpen,
  assignOpen, setAssignOpen,
  tp, onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(tp?.talent_manager_admin_id || null);

  // Email state
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const handleSuspend = async () => {
    setLoading(true);
    try {
      const { error } = await (supabase.from("v2_talent_profiles" as any) as any)
        .update({ 
          is_suspended: !tp.is_suspended,
          suspension_reason: !tp.is_suspended ? reason : null,
          suspended_at: !tp.is_suspended ? new Date().toISOString() : null,
          suspended_by: !tp.is_suspended ? (await supabase.auth.getUser()).data.user?.id : null
        } as any)
        .eq("id", tp.id);

      if (error) throw error;
      toast.success(tp.is_suspended ? "Talent unsuspended" : "Talent suspended");
      setSuspendOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error("Failed to update suspension: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data } = await supabase.from("profiles").select("user_id, first_name, last_name, email");
      setAdmins(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignManager = async () => {
    setLoading(true);
    try {
      const { error } = await (supabase.from("v2_talent_profiles" as any) as any)
        .update({ assigned_talent_manager: selectedAdminId } as any)
        .eq("id", tp.id);
      
      if (error) throw error;

      // Sync to legacy talents table if exists
      if (tp.talents?.id) {
         await (supabase.from("talents" as any) as any)
           .update({ assigned_manager: selectedAdminId } as any)
           .eq("id", tp.talents.id);
      }

      toast.success("Manager assigned");
      setAssignOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error("Failed to assign manager: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      // Mock email sending / Log communication
      toast.success("Email drafted and logged in communications (simulation)");
      setEmailOpen(false);
    } catch (err: any) {
      toast.error("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Email Drawer */}
      <Sheet open={emailOpen} onOpenChange={setEmailOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Send Email
            </SheetTitle>
            <SheetDescription>Compose a message to {tp?.talents?.first_name}.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <Input 
              placeholder="Subject" 
              value={emailSubject} 
              onChange={e => setEmailSubject(e.target.value)} 
            />
            <Textarea 
              className="min-h-[200px]" 
              placeholder="Write your message here..." 
              value={emailBody} 
              onChange={e => setEmailBody(e.target.value)}
            />
          </div>
          <SheetFooter>
            <Button className="w-full" onClick={handleSendEmail} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Email"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Suspend Drawer */}
      <Sheet open={suspendOpen} onOpenChange={setSuspendOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-600" /> 
              {tp?.is_suspended ? "Unsuspend Talent" : "Suspend Talent"}
            </SheetTitle>
            <SheetDescription>
              {tp?.is_suspended 
                ? "This will restore the talent's visibility to clients." 
                : "This talent will be hidden from all client searches and existing shortlists."}
            </SheetDescription>
          </SheetHeader>
          {!tp?.is_suspended && (
            <div className="py-6">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Reason for Suspension</label>
              <Textarea 
                placeholder="Providing a reason helps with audit logs..." 
                value={reason} 
                onChange={e => setReason(e.target.value)}
              />
            </div>
          )}
          <SheetFooter className="pt-4">
            <Button 
              variant={tp?.is_suspended ? "default" : "destructive"} 
              className="w-full" 
              onClick={handleSuspend} 
              disabled={loading || (!tp?.is_suspended && !reason.trim())}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (tp?.is_suspended ? "Confirm Unsuspension" : "Confirm Suspension")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Assign Manager Drawer */}
      <Sheet open={assignOpen} onOpenChange={(v) => {
          setAssignOpen(v);
          if (v) fetchAdmins();
        }}>
        <SheetContent className="sm:max-w-md flex flex-col h-full p-0">
          <SheetHeader className="p-6 border-b border-slate-100">
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Assign Manager
            </SheetTitle>
            <SheetDescription>Select an admin to manage this talent.</SheetDescription>
          </SheetHeader>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search admins..." 
                className="pl-10" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              {admins.filter(a => 
                `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.email.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(admin => (
                <button
                  key={admin.user_id}
                  onClick={() => setSelectedAdminId(admin.user_id)}
                  className={cn(
                    "w-full p-3 flex items-center justify-between rounded-xl border transition-all text-left",
                    selectedAdminId === admin.user_id ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-slate-100 text-[10px] font-bold">
                        {admin.first_name?.[0]}{admin.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{admin.first_name} {admin.last_name}</p>
                      <p className="text-[10px] text-slate-500">{admin.email}</p>
                    </div>
                  </div>
                  {selectedAdminId === admin.user_id && <Check className="h-4 w-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>

          <SheetFooter className="p-6 border-t border-slate-100">
            <Button className="w-full" onClick={handleAssignManager} disabled={loading || !selectedAdminId}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Assignment"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Shortlist Drawer - Simplified Placeholder */}
      <Sheet open={shortlistOpen} onOpenChange={setShortlistOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Shortlist Talent
            </SheetTitle>
            <SheetDescription>Add {tp?.talents?.first_name} to a project shortlist.</SheetDescription>
          </SheetHeader>
          <div className="py-20 text-center text-slate-400">
            <p className="text-sm italic">Job selection and shortlisting logic coming in Phase 2.1</p>
          </div>
          <SheetFooter>
            <Button variant="outline" className="w-full" onClick={() => setShortlistOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default TalentActionsDrawers;
