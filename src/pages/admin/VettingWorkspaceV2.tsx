import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2, CheckCircle2, AlertCircle, ChevronLeft, Download,
  Shield, Clock, FileText, Send, UserPlus, Mail, MessageSquare
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBrandedEmailHtml } from "@/utils/getEmailBranding";

// ── Types ────────────────────────────────────────────────────────────────

interface V2Profile {
  id: string;
  user_id: string;
  talent_id: string | null;
  status: string;
  vetting_level: number | null;
  vetting_level_text: string | null;
  assigned_talent_manager: string | null;
  talent_manager_admin_id: string | null;
  progress_percent: number;
  submitted_at: string | null;
  visible_to_clients: boolean;
}

interface V2Section {
  id: string;
  section_key: string;
  status: string;
  data: Record<string, any>;
  requested_changes: Record<string, any>;
  submitted_at: string | null;
  approved_at: string | null;
}

interface VettingAction {
  id: string;
  action: string;
  section_key: string | null;
  note: string | null;
  admin_id: string | null;
  created_at: string;
  meta: Record<string, any> | null;
}

const SECTION_ORDER = [
  "basic_info", "professional_details", "work_history",
  "documents", "education", "certifications", "references",
];

const SECTION_LABELS: Record<string, string> = {
  basic_info: "Basic Information",
  professional_details: "Professional Details",
  work_history: "Work History",
  documents: "Documents",
  education: "Education",
  certifications: "Certifications",
  references: "References",
};

const STATUS_CONFIGS: Record<string, { bg: string; text: string; label: string }> = {
  not_started:        { bg: "bg-slate-100",   text: "text-slate-500",   label: "Not Started" },
  in_progress:        { bg: "bg-blue-50",     text: "text-blue-600",    label: "In Progress" },
  submitted:          { bg: "bg-blue-100",    text: "text-blue-700",    label: "Submitted" },
  approved:           { bg: "bg-emerald-100", text: "text-emerald-700", label: "Approved" },
  changes_requested:  { bg: "bg-red-100",     text: "text-red-700",     label: "Changes Req." },
  resubmitted:        { bg: "bg-blue-100",    text: "text-blue-700",    label: "Resubmitted" },
  draft:              { bg: "bg-slate-100",   text: "text-slate-600",   label: "Draft" },
  in_review:          { bg: "bg-amber-100",   text: "text-amber-700",   label: "In Review" },
  vetted:             { bg: "bg-emerald-100", text: "text-emerald-700", label: "Vetted" },
  revett_required:    { bg: "bg-rose-100",    text: "text-rose-700",    label: "Re-vetting Req" },
  revett_pending:     { bg: "bg-orange-100",  text: "text-orange-700",  label: "Re-vetting Pend" },
};

const ACTION_COLORS: Record<string, string> = {
  SUBMIT: "bg-blue-100 text-blue-700",
  APPROVE_SECTION: "bg-emerald-100 text-emerald-700",
  REQUEST_CHANGES: "bg-red-100 text-red-700",
  MARK_VETTED: "bg-emerald-600 text-white",
  ASSIGN_MANAGER: "bg-indigo-100 text-indigo-700",
  REVOKED_FOR_EDIT: "bg-rose-100 text-rose-700",
  REQUEST_REVETTING: "bg-orange-100 text-orange-700",
  VETTING_NOTE_SENT: "bg-slate-900 text-white",
};

const LEVEL_OPTIONS = ["Junior", "Mid", "Senior", "Lead", "Expert"];

// ── Component ────────────────────────────────────────────────────────────

const VettingWorkspaceV2 = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<V2Profile | null>(null);
  const [sections, setSections] = useState<V2Section[]>([]);
  const [actions, setActions] = useState<VettingAction[]>([]);
  const [talentInfo, setTalentInfo] = useState<{ name: string; email: string }>({ name: "", email: "" });
  const [managers, setManagers] = useState<{id: string, name: string}[]>([]);
  
  const [selectedSection, setSelectedSection] = useState<string>("basic_info");
  const [changeNote, setChangeNote] = useState("");
  const [changeFields, setChangeFields] = useState("");
  const [vettingLevelText, setVettingLevelText] = useState<string>("");
  const [selectedManagerId, setSelectedManagerId] = useState<string>("unassigned");
  const [actionPending, setActionPending] = useState(false);
  const [activeTab, setActiveTab] = useState<"data" | "timeline">("data");
  
  // Vetting Note Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteSubject, setNoteSubject] = useState("Update regarding your OPSlyHR Profile");
  const [noteBody, setNoteBody] = useState("");

  // ── Fetch data ─────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch profile
      const { data: p, error: pErr } = await supabase
        .from("v2_talent_profiles").select("*").eq("id", id).single();
      if (pErr) throw pErr;
      if (!p) throw new Error("Profile not found");
      const profileData = p as unknown as V2Profile;
      setProfile(profileData);
      
      if (profileData.vetting_level_text) setVettingLevelText(profileData.vetting_level_text);
      if (profileData.talent_manager_admin_id) setSelectedManagerId(profileData.talent_manager_admin_id);

      // Fetch all managers (admins)
      const { data: adminUsers } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .in("role", ["SUPER_ADMIN", "ADMIN"]);
        
      if (adminUsers) {
        setManagers((adminUsers as any[]).map(u => ({
          id: u.id,
          name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Admin"
        })));
      }

      // Auto-start review if strictly submitted/resubmitted or revett_pending
      if (["submitted", "resubmitted", "revett_pending"].includes(profileData.status)) {
        await (supabase.rpc as any)("v2_admin_start_review", { p_talent_user_id: profileData.user_id });
        const { data: updated } = await supabase
          .from("v2_talent_profiles").select("*").eq("id", id).single();
        if (updated) setProfile(updated as unknown as V2Profile);
      }
      // Auto-transition draft profiles to in_review when admin opens workspace
      else if (profileData.status === "draft") {
        await (supabase.from("v2_talent_profiles") as any)
          .update({ status: "in_review", updated_at: new Date().toISOString() })
          .eq("user_id", profileData.user_id);
        // Log the action
        await (supabase.from("v2_vetting_actions") as any)
          .insert({
            user_id: profileData.user_id,
            admin_id: user?.id,
            action: "START_REVIEW",
            note: "Admin started review on draft profile",
          });
        const { data: updated } = await supabase
          .from("v2_talent_profiles").select("*").eq("id", id).single();
        if (updated) setProfile(updated as unknown as V2Profile);
      }

      // Fetch sections
      const { data: s } = await supabase
        .from("v2_profile_sections").select("*").eq("user_id", profileData.user_id);
      const mapped = (s || []).map(sec => ({
        ...sec,
        data: (sec.data || {}) as Record<string, any>,
        requested_changes: (sec.requested_changes || {}) as Record<string, any>,
      })) as V2Section[];
      setSections(mapped);

      // Fetch talent info
      const { data: talent } = await supabase
        .from("talents")
        .select("first_name, last_name, email")
        .eq("user_id", p.user_id)
        .maybeSingle();
      if (talent) {
        const t = talent as any;
        setTalentInfo({
          name: `${t.first_name || ""} ${t.last_name || ""}`.trim() || "Unknown",
          email: t.email || "",
        });
      }

      // Fetch action history
      const { data: a } = await supabase
        .from("v2_vetting_actions")
        .select("*")
        .eq("user_id", profileData.user_id)
        .order("created_at", { ascending: false });
      setActions((a || []) as VettingAction[]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Actions ────────────────────────────────────────────────────────

  const approveSection = async (sectionKey: string) => {
    if (!profile) return;
    setActionPending(true);
    try {
      const { error } = await (supabase.rpc as any)("v2_admin_approve_section", {
        p_talent_user_id: profile.user_id,
        p_section_key: sectionKey,
      });
      if (error) throw error;
      toast({ title: "Section Approved", description: `"${SECTION_LABELS[sectionKey]}" has been approved.` });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionPending(false);
    }
  };

  const requestChanges = async (sectionKey: string) => {
    if (!profile || !changeNote.trim()) {
      toast({ title: "Note is required", variant: "destructive" });
      return;
    }
    setActionPending(true);
    try {
      const { fields } = { fields: changeFields.split(",").map(f => f.trim()).filter(Boolean) };
      const { error } = await (supabase.rpc as any)("v2_admin_request_changes", {
        p_talent_user_id: profile.user_id,
        p_section_key: sectionKey,
        p_note: changeNote,
        p_fields: fields,
      });
      if (error) throw error;
      toast({ title: "Changes Requested", description: "Talent has been notified." });
      setChangeNote("");
      setChangeFields("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionPending(false);
    }
  };

  const finalizeVetting = async () => {
    if (!profile || !vettingLevelText) {
      toast({ title: "Select a vetting level first", variant: "destructive" });
      return;
    }
    setActionPending(true);
    try {
      const { error } = await (supabase.rpc as any)("v2_admin_finalize_vetting", {
        p_talent_user_id: profile.user_id,
        p_vetting_level_text: vettingLevelText,
      });
      if (error) throw error;

      // Sync to legacy talents table
      await supabase
        .from("talents")
        .update({
          vetting_status: "fully_vetted",
          onboarding_completed: true,
        } as any)
        .eq("user_id", profile.user_id);

      toast({ title: "Talent Vetted!", description: "Profile is now visible to clients." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionPending(false);
    }
  };

  const assignManager = async (managerId: string) => {
    if (!profile || managerId === "unassigned") return;
    setActionPending(true);
    try {
      const { error } = await (supabase.rpc as any)("v2_admin_assign_manager", {
        p_talent_user_id: profile.user_id,
        p_manager_admin_id: managerId
      });
      if (error) throw error;
      toast({ title: "Manager Assigned" });
      setSelectedManagerId(managerId);
      fetchData();
    } catch (err: any) {
      toast({ title: "Assignment Failed", description: err.message, variant: "destructive" });
    } finally {
      setActionPending(false);
    }
  }

  const sendVettingNote = async () => {
    if (!profile || !noteBody.trim() || !noteSubject.trim()) {
      toast({ title: "Subject and body are required", variant: "destructive" });
      return;
    }
    setActionPending(true);
    try {
      // 1. Call the new RPC to log the action & create internal notification
      const { error: rpcError } = await (supabase.rpc as any)("v2_admin_send_vetting_note", {
        p_talent_user_id: profile.user_id,
        p_subject: noteSubject,
        p_body: noteBody
      });

      if (rpcError) throw rpcError;

      // 2. Trigger the external email via Edge Function
      const brandedHtml = getBrandedEmailHtml(noteBody, noteSubject);
      const { error: emailError } = await supabase.functions.invoke("send-email", {
        body: {
          to: talentInfo.email,
          subject: noteSubject,
          htmlTemplate: brandedHtml,
        }
      });

      if (emailError) {
        console.error("External email failed to send, but note was logged internally:", emailError);
        toast({ 
          title: "Note Logged", 
          description: "Internal notification created, but external email failed to send. Check console for details.",
          variant: "destructive" 
        });
      } else {
        toast({ title: "Email Sent Successfully", description: `Branded note delivered to ${talentInfo.email}` });
      }

      setIsNoteModalOpen(false);
      setNoteBody("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    } finally {
      setActionPending(false);
    }
  };

  // ── Download doc helper ────────────────────────────────────────────

  const downloadFile = async (path: string, label: string) => {
    try {
      const { data, error } = await supabase.storage.from("talent_documents").createSignedUrl(path, 3600);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-8 text-center text-slate-500">Profile not found.</div>;
  }

  const currentSection = sections.find(s => s.section_key === selectedSection);
  const profileStatusCfg = STATUS_CONFIGS[profile.status] || STATUS_CONFIGS.draft;
  
  // Mandatory sections check: Basic Info, Pro Details, Work History
  const mandatoryKeys = ["basic_info", "professional_details", "work_history"];
  const allMandatorySubmitted = mandatoryKeys.every(key => {
    const s = sections.find(sec => sec.section_key === key);
    return s && ["approved", "submitted", "resubmitted"].includes(s.status);
  });
  
  const allSectionsApproved = sections.length > 0 && sections.every(s => s.status === "approved");
  const canFinalize = !!vettingLevelText;

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 w-full max-w-none px-6 lg:px-10 pb-20 font-inter">
      {/* ── Back button ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-6">
        <Button variant="ghost" onClick={() => navigate("/admin/vetting")} className="gap-2 text-slate-500 hover:text-slate-900 border border-slate-200 bg-white rounded-lg">
          <ChevronLeft className="h-4 w-4" /> Back to Queue
        </Button>
      </div>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="flex items-center gap-6">
             <Avatar className="h-20 w-20 border border-slate-100 shadow-sm shrink-0 rounded-xl">
                <AvatarFallback className="bg-blue-600 text-2xl font-black text-white rounded-xl">
                  {talentInfo.name[0]}
                </AvatarFallback>
              </Avatar>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{talentInfo.name}</h1>
                <Badge className={`${profileStatusCfg.bg} ${profileStatusCfg.text} font-bold px-2 py-0.5 rounded-md shadow-none border-transparent`}>
                  {profileStatusCfg.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <p className="text-sm font-medium text-slate-500">{talentInfo.email}</p>
                {profile.talent_id && <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100 text-slate-600 border-none">{profile.talent_id}</Badge>}
                {profile.submitted_at && (
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-l border-slate-200 pl-4">
                    <Clock className="h-3 w-3" /> Submitted {new Date(profile.submitted_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <Button 
                variant="outline" 
                onClick={() => navigate(`/admin/talents/${id}`)} 
                className="h-11 px-6 rounded-lg font-bold border-slate-200 text-indigo-600 hover:bg-indigo-50"
            >
              View Talent Profile
            </Button>
            <Button 
                variant="outline" 
                onClick={() => setIsNoteModalOpen(true)}
                className="h-11 px-6 rounded-lg font-bold border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 gap-2"
            >
              <Send className="h-4 w-4" /> Send Vetting Note
            </Button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-6 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center gap-6 justify-between border-t border-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Manager Assignment */}
            <div className="flex items-center gap-3 px-1">
                <UserPlus className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-600 whitespace-nowrap uppercase tracking-widest text-[10px]">Assigned Manager</span>
                <Select value={selectedManagerId} onValueChange={assignManager} disabled={actionPending}>
                <SelectTrigger className="w-[180px] h-9 bg-white border-slate-200 rounded-lg text-sm font-medium">
                    <SelectValue placeholder="Assign a manager..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {managers.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
          </div>

          {/* Level Assignment & Vetting Finalization */}
          <div className="flex items-center gap-3">
            {/* NEW: Send Note Tool */}
            <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 h-9 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-4">
                  <Mail className="h-4 w-4" /> Send Note
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader className="pb-4 border-b border-slate-100">
                  <DialogTitle className="text-xl font-bold text-slate-900">Send Vetting Note</DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium">
                    This will trigger a branded email to <span className="text-slate-900 font-bold">{talentInfo.name}</span>. Use this for custom feedback or instructions.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-3">
                    <Label htmlFor="subject" className="text-xs font-bold uppercase text-slate-400 tracking-wider">Email Subject</Label>
                    <Input 
                      id="subject" 
                      value={noteSubject} 
                      onChange={(e) => setNoteSubject(e.target.value)}
                      placeholder="Enter subject..."
                      className="h-11 border-slate-200 focus:border-slate-900 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="message" className="text-xs font-bold uppercase text-slate-400 tracking-wider">Message to Talent</Label>
                    <div className="relative">
                      <Textarea 
                        id="message" 
                        value={noteBody} 
                        onChange={(e) => setNoteBody(e.target.value)}
                        placeholder="Type your message here..."
                        className="min-h-[280px] border-slate-200 focus:border-slate-900 transition-all font-medium leading-relaxed p-4"
                      />
                      <div className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-400 uppercase">
                        Supports plaintext
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="pt-6 border-t border-slate-100 sm:justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsNoteModalOpen(false)} disabled={actionPending} className="font-bold text-slate-500 hover:text-slate-900">
                    Cancel
                  </Button>
                  <Button 
                    onClick={sendVettingNote} 
                    disabled={actionPending || !noteBody.trim()} 
                    className="gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-8 shadow-lg shadow-slate-200 transition-all"
                  >
                    {actionPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Branded Email
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── Confirm Talent Vetting Panel ──────────────────────────── */}
        {profile.status !== "vetted" && (
          <div className="px-8 py-6 bg-emerald-50/50 border-t border-emerald-100 flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">Confirm Talent Vetting</h3>
                <p className="text-xs text-emerald-700/70 font-medium">
                  {allSectionsApproved
                    ? "All sections approved. Ready to confirm."
                    : allMandatorySubmitted
                    ? "Mandatory sections submitted. You may confirm now — remaining submitted sections will be auto-approved."
                    : "Mandatory sections (Basic Info, Professional Details, Work History) must be at least submitted before confirming."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={vettingLevelText} onValueChange={setVettingLevelText}>
                <SelectTrigger className="w-[180px] h-11 bg-white border-emerald-200 rounded-lg text-sm font-bold">
                  <SelectValue placeholder="Select vetting level..." />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map(lvl => (
                    <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={finalizeVetting}
                disabled={actionPending || !canFinalize}
                className="h-11 px-8 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50 font-bold text-sm rounded-lg"
              >
                {actionPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirm Talent
              </Button>
            </div>
          </div>
        )}

        {profile.status === "vetted" && (
          <div className="px-8 py-4 bg-emerald-50 border-t border-emerald-100 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-800">Talent Vetted & Visible to Clients</span>
            {profile.vetting_level_text && (
              <Badge className="bg-emerald-100 text-emerald-700 font-bold shadow-none border-none ml-2">
                Level: {profile.vetting_level_text || (profile as any).vetting_level_text}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* ── Two-column layout ───────────────────────────────────── */}
      <div className="grid lg:grid-cols-[300px_1fr] gap-8 items-start">
        {/* Left sidebar: section list */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-fit sticky top-10">
          <div className="p-6 space-y-1">
            <div className="mb-6">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] px-2 mb-2">Workspace Navigation</h3>
            </div>
            {SECTION_ORDER.map(key => {
              const sec = sections.find(s => s.section_key === key);
              const secStatus = sec?.status || "not_started";
              const cfg = STATUS_CONFIGS[secStatus] || STATUS_CONFIGS.not_started;
              const isActive = selectedSection === key && activeTab === "data";
              return (
                <button
                  key={key}
                  onClick={() => { setSelectedSection(key); setActiveTab("data"); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold transition-all ${isActive ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100"}`}
                >
                  <span className="truncate">{SECTION_LABELS[key]}</span>
                  <Badge className={`${isActive ? "bg-white/20 text-white" : cfg.bg + " " + cfg.text} text-[9px] font-bold ml-2 shrink-0 shadow-none border-none rounded-md px-2 py-0.5`}>
                    {cfg.label}
                  </Badge>
                </button>
              );
            })}

            <div className="pt-4 border-t border-slate-100 mt-6">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === "timeline" ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100"}`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Audit Timeline
                </div>
                <Badge variant="secondary" className="text-[9px] font-bold ml-2 shrink-0 bg-slate-100 text-slate-500 border-none px-2 py-0.5">{actions.length}</Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm min-h-[600px] overflow-hidden">
          <div className="p-10">
            {activeTab === "timeline" ? (
              // Timeline view
              <div className="w-full">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                   <Clock className="h-5 w-5 text-slate-400" /> Vetting Audit Log
                </h2>
                {actions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    No actions recorded yet.
                  </div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {actions.map(a => {
                      const colorClass = ACTION_COLORS[a.action] || "bg-slate-100 text-slate-600";
                      return (
                        <div key={a.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <FileText className="h-4 w-4" />
                          </div>
                          
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={`${colorClass} font-bold text-[10px] uppercase shadow-none`}>
                                {a.action.replace(/_/g, " ")}
                              </Badge>
                              <span className="text-xs font-semibold text-slate-400">
                                {new Date(a.created_at).toLocaleString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            {a.section_key && (
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-3 mb-1">
                                {SECTION_LABELS[a.section_key] || a.section_key}
                              </p>
                            )}
                            {a.note && <p className="text-sm text-slate-700 leading-relaxed font-medium">{a.note}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Section data view
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900">{SECTION_LABELS[selectedSection]}</h2>
                  {currentSection && (
                    <Badge className={`${(STATUS_CONFIGS[currentSection.status] || STATUS_CONFIGS.not_started).bg} ${(STATUS_CONFIGS[currentSection.status] || STATUS_CONFIGS.not_started).text} px-3 py-1 font-bold shadow-none`}>
                      {(STATUS_CONFIGS[currentSection.status] || STATUS_CONFIGS.not_started).label}
                    </Badge>
                  )}
                </div>

                {!currentSection || Object.keys(currentSection.data).length === 0 ? (
                  <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    No data submitted for this section.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-10 w-full">
                    {Object.entries(currentSection.data).map(([field, value]) => {
                      if (field === "id") return null;
                      const isDocUrl = typeof value === "string" && (
                        field.endsWith("Url") || field.endsWith("_url")
                      ) && value.includes("/");

                      return (
                        <div key={field} className="flex flex-col gap-2">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {field.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, s => s.toUpperCase())}
                          </p>
                          {isDocUrl ? (
                            <Button
                              variant="outline" size="sm"
                              onClick={() => downloadFile(String(value), field)}
                              className="w-fit gap-2 border-slate-200 hover:bg-slate-50"
                            >
                              <Download className="h-4 w-4 text-emerald-600" />
                              Download {field.replace(/Url$/i, "").replace(/_url$/i, "").replace(/([A-Z])/g, " $1").trim()}
                            </Button>
                          ) : Array.isArray(value) ? (
                            <div className="space-y-3">
                              {value.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-sm shadow-sm">
                                  {typeof item === "object" ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {Object.entries(item).filter(([k]) => k !== "id").map(([k, v]) => (
                                        <div key={k} className="flex flex-col gap-1">
                                          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">{k.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}</span>
                                          <span className="text-slate-800 font-medium">{String(v || "—")}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-800 font-medium">{String(item)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-slate-800 bg-slate-50/50 p-3 rounded-md border border-slate-100 inline-block">
                              {String(value || "—")}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Admin actions ──────────────────────────────── */}
                {currentSection && currentSection.status !== "approved" && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden mt-8 w-full bg-slate-50">
                    <div className="bg-slate-100/50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                       <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-indigo-500" /> Section Actions
                       </h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <Button
                        onClick={() => approveSection(selectedSection)}
                        disabled={actionPending}
                        className="w-full sm:w-auto h-11 px-8 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve Section
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-slate-50 px-2 text-xs text-slate-500 font-bold uppercase">Or Request Changes</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-700 uppercase">Change Instructions</label>
                           <Textarea
                             placeholder="E.g. Please clarify your role at Microsoft and update the dates to match your resume."
                             value={changeNote}
                             onChange={e => setChangeNote(e.target.value)}
                             className="min-h-[100px] border-slate-200 bg-white"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-700 uppercase">Specific Fields (Optional, comma-separated)</label>
                           <Textarea
                             placeholder="E.g. job_title, start_date"
                             value={changeFields}
                             onChange={e => setChangeFields(e.target.value)}
                             className="min-h-[40px] border-slate-200 bg-white"
                           />
                        </div>
                        <Button
                          onClick={() => requestChanges(selectedSection)}
                          disabled={actionPending || !changeNote.trim()}
                          variant="destructive"
                          className="w-full sm:w-auto gap-2 font-bold bg-rose-600 hover:bg-rose-700 h-11 px-6 shadow-sm"
                        >
                          <AlertCircle className="h-4 w-4" /> Send Request
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VettingWorkspaceV2;
