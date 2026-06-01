import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInternalPath, getZoneUrl, Zone } from "@/utils/subdomain";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendInvitedToApplyEmail, sendTalentApplicationShortlistedEmail, triggerJobPublishedEmails, sendTalentInterviewInvitationEmail } from "@/lib/email/triggers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, CheckCircle2, Eye, FileText, Users, UserPlus, Search,
  Calendar, Clock, Globe, MapPin, DollarSign, Play,
  Video, Award, Building2, AlertCircle, Share2, Loader2
} from "lucide-react";
import { format } from "date-fns";

/* ── Shared types (no `any`) ─────────────────────────────────── */

interface HireRequest {
  id: string;
  title: string;
  status: string;
  service_model: string | null;
  engagement_type: string | null;
  location_preference: string | null;
  timezone_overlap: string | null;
  budget_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  fixed_budget: number | null;
  role_summary: string | null;
  responsibilities: string | null;
  requirements: string | null;
  client_user_id: string;
  created_at: string;
  published_at: string | null;
  [key: string]: unknown;
}

interface ProfileSnippet {
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  title?: string | null;
  skills?: string[] | null;
  avatar_url?: string | null;
  vetting_status?: string | null;
}

interface Enriched<T> extends Record<string, unknown> {
  profiles: ProfileSnippet | null;
  id: string;
  talent_user_id: string;
  status: string;
  created_at: string;
}

type EnrichedRow = Enriched<unknown>;

interface EventRow {
  id: string;
  event_type: string;
  actor_type: string;
  created_at: string;
  [key: string]: unknown;
}

/* ── Component ───────────────────────────────────────────────── */

export default function AdminHireRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const isTalentManager = userRole === "talent_manager";
  const { toast } = useToast();

  const [request, setRequest] = useState<HireRequest | null>(null);
  const [clientProfile, setClientProfile] = useState<ProfileSnippet | null>(null);

  const handleShare = async () => {
    if (!id) return;
    const url = getZoneUrl(Zone.MARKETING, `/jobs/${id}`);
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied! 🔗",
        description: "Public job link copied to clipboard.",
      });
    } catch (err) {
      console.error("Failed to copy link:", err);
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const [applications, setApplications] = useState<EnrichedRow[]>([]);
  const [shortlist, setShortlist] = useState<EnrichedRow[]>([]);
  const [interviews, setInterviews] = useState<EnrichedRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  // Shortlist dialog – browse vetted talents
  const [showShortlistDialog, setShowShortlistDialog] = useState(false);
  const [shortlistSearch, setShortlistSearch] = useState("");
  const [vettedTalents, setVettedTalents] = useState<(ProfileSnippet & { id: string })[]>([]);
  const [loadingVettedTalents, setLoadingVettedTalents] = useState(false);
  const [selectedTalentForShortlist, setSelectedTalentForShortlist] = useState<(ProfileSnippet & { id: string }) | null>(null);
  const [shortlistReason, setShortlistReason] = useState("");

  // Invite dialog
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [managedTalents, setManagedTalents] = useState<(ProfileSnippet & { id: string, user_id: string })[]>([]);
  const [loadingManagedTalents, setLoadingManagedTalents] = useState(false);

  // Schedule dialog
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<any>(null);
  const [calendlyLink, setCalendlyLink] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");

  // Edit Dialog State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    service_model: "",
    engagement_type: "",
    location_preference: "",
    timezone_overlap: "",
    budget_type: "",
    preferred_currency: "USD",
    salary_type: "hourly",
    budget_min: "",
    budget_max: "",
    fixed_budget: "",
    role_summary: "",
    responsibilities: "",
    requirements: ""
  });

  const openEditDialog = () => {
    if (!request) return;
    setEditForm({
      title: request.title || "",
      service_model: request.service_model || "",
      engagement_type: request.engagement_type || "",
      location_preference: request.location_preference || "",
      timezone_overlap: request.timezone_overlap || "",
      budget_type: request.budget_type || "",
      preferred_currency: request.preferred_currency || "USD",
      salary_type: request.salary_type || "hourly",
      budget_min: request.budget_min?.toString() || "",
      budget_max: request.budget_max?.toString() || "",
      fixed_budget: request.fixed_budget?.toString() || "",
      role_summary: request.role_summary || "",
      responsibilities: request.responsibilities || "",
      requirements: request.requirements || ""
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    setSavingEdit(true);
    try {
      const updates = {
        title: editForm.title,
        service_model: editForm.service_model || null,
        engagement_type: editForm.engagement_type || null,
        location_preference: editForm.location_preference || null,
        timezone_overlap: editForm.timezone_overlap || null,
        budget_type: editForm.budget_type || null,
        preferred_currency: editForm.preferred_currency || "USD",
        salary_type: editForm.salary_type || null,
        budget_min: editForm.budget_min ? parseFloat(editForm.budget_min) : null,
        budget_max: editForm.budget_max ? parseFloat(editForm.budget_max) : null,
        fixed_budget: editForm.fixed_budget ? parseFloat(editForm.fixed_budget) : null,
        role_summary: editForm.role_summary || null,
        responsibilities: editForm.responsibilities || null,
        requirements: editForm.requirements || null,
      };

      const { error } = await supabase
        .from("hr_v2_hire_requests")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      // Log event to the activity log
      if (user) {
        await supabase
          .from("hr_v2_request_events")
          .insert({
            hire_request_id: id,
            actor_type: "admin",
            actor_user_id: user.id,
            event_type: "UPDATED"
          });
      }

      toast({
        title: "Success! 🎉",
        description: "Job posting details updated successfully.",
      });
      setShowEditDialog(false);
      fetchData();
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const resolveTalentProfileByUserId = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, avatar_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile) {
      return profile as ProfileSnippet;
    }

    const { data: talent } = await (supabase.from("talents") as any)
      .select("first_name, last_name, email, primary_role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!talent) return null;

    return {
      first_name: (talent as any).first_name || null,
      last_name: (talent as any).last_name || null,
      email: (talent as any).email || null,
      title: (talent as any).primary_role || null,
      skills: [],
      avatar_url: null,
    } as ProfileSnippet;
  }, []);

  const resolveTalentEmailByUserId = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.email) return profile.email;

    const { data: talent } = await (supabase.from("talents") as any)
      .select("email")
      .eq("user_id", userId)
      .maybeSingle();

    return (talent as any)?.email || null;
  }, []);

  const resolveAdminTalentProfileId = useCallback(async (userId: string) => {
    const { data } = await (supabase.from("v2_talent_profiles") as any)
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    return data?.id ?? null;
  }, []);

  /* ── fetch vetted talents ─────────────────────────────────── */
  const fetchVettedTalents = useCallback(async () => {
    setLoadingVettedTalents(true);
    try {
      const { data } = await supabase
        .from("v2_talent_profiles")
        .select(`
          id,
          user_id,
          status,
          talents:user_id (first_name, last_name, email, primary_role, secondary_skills)
        `)
        .in("status", ["fully_vetted", "approved", "vetted", "FULLY_VETTED", "APPROVED", "VETTED"])
        .order("created_at", { ascending: true });

      const formatted = ((data as any[]) || []).map((profile) => ({
        id: profile.user_id,
        profile_id: profile.id,
        user_id: profile.user_id,
        first_name: profile.talents?.first_name ?? null,
        last_name: profile.talents?.last_name ?? null,
        email: profile.talents?.email ?? null,
        title: profile.talents?.primary_role ?? null,
        skills: profile.talents?.secondary_skills ?? [],
        avatar_url: profile.talents?.avatar_url ?? null,
        vetting_status: profile.status,
      })) as (ProfileSnippet & { id: string; profile_id?: string; user_id: string })[];

      setVettedTalents(formatted);
    } catch (err) {
      console.error("Failed to load vetted talents:", err);
    } finally {
      setLoadingVettedTalents(false);
    }
  }, []);

  const fetchManagedTalents = useCallback(async () => {
    if (!user) return;
    setLoadingManagedTalents(true);
    try {
      // Fetch talents where this admin is the manager
      const { data: v2Profiles } = await supabase
        .from("v2_talent_profiles")
        .select("user_id, talents:user_id(first_name, last_name, email, primary_role)")
        .eq("talent_manager_admin_id", user.id);
      
      const formatted = (v2Profiles || []).map(p => ({
        id: p.user_id,
        user_id: p.user_id,
        email: (p.talents as any)?.email,
        first_name: (p.talents as any)?.first_name || "Unknown",
        last_name: (p.talents as any)?.last_name || "",
        title: (p.talents as any)?.primary_role || "Talent",
        skills: [],
        avatar_url: null
      }));

      // If Super/Operations Admin, they should see ALL vetted talents for invitation too
      if (!isTalentManager) {
        const { data: allVetted } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, title")
          .in("vetting_status", ["fully_vetted", "approved", "vetted"]);
        
        const vettedFormatted = (allVetted || []).map(p => ({
          id: p.id,
          user_id: p.id,
          email: p.email,
          first_name: p.first_name || "Unknown",
          last_name: p.last_name || "",
          title: p.title || "Talent",
          skills: [],
          avatar_url: null
        }));
        setManagedTalents(vettedFormatted);
      } else {
        setManagedTalents(formatted);
      }
    } catch (err) {
      console.error("Failed to load managed talents:", err);
    } finally {
      setLoadingManagedTalents(false);
    }
  }, [user]);

  /* ── open shortlist dialog → load talents ───────────────── */
  const openShortlistDialog = useCallback(() => {
    setShowShortlistDialog(true);
    setSelectedTalentForShortlist(null);
    setShortlistReason("");
    setShortlistSearch("");
    fetchVettedTalents();
  }, [fetchVettedTalents]);

  /* ── fetch request + related data ─────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Hire request
      const { data: reqData, error: reqErr } = await supabase
        .from("hr_v2_hire_requests")
        .select("*")
        .eq("id", id as string)
        .single();
      if (reqErr) throw reqErr;
      if (!reqData) throw new Error("Not found");

      const typedReq = reqData as unknown as HireRequest;
      setRequest(typedReq);

      // 2. Client profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("user_id", typedReq.client_user_id)
        .maybeSingle();

      if (profile && (profile.first_name || profile.last_name)) {
        setClientProfile(profile as ProfileSnippet);
      } else {
        const { data: client } = await (supabase.from("clients") as any)
          .select("company_name")
          .eq("user_id", typedReq.client_user_id)
          .maybeSingle();

        setClientProfile(client ? { first_name: (client as any).company_name, last_name: "", email: profile?.email || null } : null);
      }

      // 3. Applications
      const { data: appData } = await supabase
        .from("hr_v2_applications")
        .select("*")
        .eq("hire_request_id", id as string)
        .order("created_at", { ascending: false });

      const enrichedApps: EnrichedRow[] = await Promise.all(
        (appData || []).map(async (app) => {
          const talentUserId = (app as Record<string, unknown>).talent_user_id as string;
          const [profiles, v2ProfileId] = await Promise.all([
            resolveTalentProfileByUserId(talentUserId),
            resolveAdminTalentProfileId(talentUserId),
          ]);
          return { ...(app as Record<string, unknown>), profiles, v2_profile_id: v2ProfileId } as any as EnrichedRow;
        })
      );
      setApplications(enrichedApps);

      // 4. Shortlist
      const { data: shortData } = await supabase
        .from("hr_v2_shortlists")
        .select("*")
        .eq("hire_request_id", id as string)
        .order("created_at", { ascending: false });

      const enrichedShort: EnrichedRow[] = await Promise.all(
        (shortData || []).map(async (item) => {
          const talentUserId = (item as Record<string, unknown>).talent_user_id as string;
          const [profiles, v2ProfileId] = await Promise.all([
            resolveTalentProfileByUserId(talentUserId),
            resolveAdminTalentProfileId(talentUserId),
          ]);
          return { ...(item as Record<string, unknown>), profiles, v2_profile_id: v2ProfileId } as any as EnrichedRow;
        })
      );
      setShortlist(enrichedShort);

      // 5. Interviews
      const { data: intData } = await supabase
        .from("hr_v2_interviews")
        .select("*")
        .eq("hire_request_id", id as string)
        .order("created_at", { ascending: false });

      const enrichedInt: EnrichedRow[] = await Promise.all(
        (intData || []).map(async (intv) => {
          const talentUserId = (intv as Record<string, unknown>).talent_user_id as string;
          const profiles = await resolveTalentProfileByUserId(talentUserId);
          return { ...(intv as Record<string, unknown>), profiles } as EnrichedRow;
        })
      );
      setInterviews(enrichedInt);

      // 6. Events
      const { data: evtData } = await supabase
        .from("hr_v2_request_events")
        .select("*")
        .eq("hire_request_id", id as string)
        .order("created_at", { ascending: false })
        .limit(20);
      setEvents((evtData as EventRow[]) || []);

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (id) fetchData(); }, [id, fetchData]);

  /* ── RPC helper ───────────────────────────────────────────── */
  const callRpc = async (name: string, params: Record<string, unknown>, successMsg: string) => {
    setActionLoading(name);
    try {
      const { error } = await (supabase.rpc as any)(name, params);
      if (error) throw error;
      toast({ title: successMsg });
      fetchData();
    } catch (error: unknown) {
      toast({ title: "Action failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setActionLoading("");
    }
  };

  const handleApprove = () => callRpc("hr_v2_admin_approve_request", { req_id: id }, "Request approved");
  
  const handlePublish = async () => {
    setActionLoading("hr_v2_admin_publish_request");
    try {
      const { error } = await (supabase.rpc as any)("hr_v2_admin_publish_request", { req_id: id });
      if (error) throw error;
      toast({ title: "Request published — talents can now apply" });
      fetchData();
      
      // Trigger bulk emails to all talents
      if (request) {
        triggerJobPublishedEmails(request).catch(err => 
          console.error("Error triggering job published emails:", err)
        );
      }
    } catch (error: unknown) {
      toast({ title: "Action failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setActionLoading("");
    }
  };

  const handleShortlist = async () => {
    if (!selectedTalentForShortlist) return;
    await callRpc("hr_v2_admin_shortlist_talent", { req_id: id, t_user_id: selectedTalentForShortlist.id, reason: shortlistReason }, "Talent shortlisted");
    
    const talentEmail = selectedTalentForShortlist.email || await resolveTalentEmailByUserId(selectedTalentForShortlist.id);
    const talentFirstName = selectedTalentForShortlist.first_name || "Talent";

    if (talentEmail) {
      await sendTalentApplicationShortlistedEmail({
        email: talentEmail,
        firstName: talentFirstName,
        jobTitle: request?.title || "Job Opportunity"
      });
    }
    setShowShortlistDialog(false);
    setSelectedTalentForShortlist(null);
    setShortlistReason("");
  };

  // Close job dialog
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeReason, setCloseReason] = useState("");

  const handleCloseRequest = async () => {
    if (!id) return;
    await callRpc("hr_v2_admin_close_request", { req_id: id, reason: closeReason }, "Request closed");
    setShowCloseDialog(false);
    setCloseReason("");
  };

  const handleScheduleInterview = async () => {
    if (!scheduleTarget || !calendlyLink || !scheduledTime) return;
    setActionLoading("schedule");
    try {
      await callRpc("hr_v2_admin_schedule_interview", {
        req_id: id,
        t_user_id: scheduleTarget.talent_user_id,
        c_user_id: request?.client_user_id,
        c_link: calendlyLink,
        s_time: new Date(scheduledTime).toISOString(),
        m_notes: meetingNotes,
      }, "Interview scheduled");

      // We can also trigger the email:
      await sendTalentInterviewInvitationEmail({
        talentUserId: scheduleTarget.talent_user_id,
        hireRequestId: id as string,
        interviewId: "new-id", // currently unused in email
        meetingLink: calendlyLink,
        scheduledTime: new Date(scheduledTime).toISOString(),
        notes: meetingNotes,
      });

      setShowScheduleDialog(false);
      setCalendlyLink("");
      setScheduledTime("");
      setMeetingNotes("");
      setScheduleTarget(null);
    } catch (err: any) {
      toast({ title: "Failed to schedule", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading("");
    }
  };

  const handleFinalizeHire = (talentId: string) =>
    callRpc("hr_v2_admin_finalize_hire", { req_id: id, t_user_id: talentId }, "🎉 Hire finalized!");

  const handleInviteToApply = async (talent: any) => {
    setActionLoading("invite");
    try {
      const { error } = await (supabase.rpc as any)("hr_v2_admin_invite_talent_to_apply", {
        req_id: id,
        t_user_id: talent.user_id
      });
      if (error) throw error;

      // Send email
      await sendInvitedToApplyEmail({
        email: (talent as any).email || "", // We might need to fetch email
        firstName: talent.first_name,
        jobTitle: request?.title || "Job Opportunity",
        jobId: id as string
      });

      toast({ title: "Invitation Sent", description: `${talent.first_name} has been invited to apply.` });
      fetchData();
    } catch (err: any) {
      toast({ title: "Invite failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading("");
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
      submitted: { label: "Pending Review", className: "bg-amber-100 text-amber-700" },
      admin_review: { label: "Under Review", className: "bg-amber-100 text-amber-700" },
      approved: { label: "Approved", className: "bg-blue-100 text-blue-700" },
      published: { label: "Published", className: "bg-emerald-100 text-emerald-700" },
      paused: { label: "Paused", className: "bg-slate-100 text-slate-500" },
      closed: { label: "Closed", className: "bg-red-100 text-red-600" },
      hired: { label: "Hired", className: "bg-purple-100 text-purple-700" },
    };
    const s = map[status] || { label: status, className: "bg-slate-100 text-slate-600" };
    return <Badge className={`${s.className} hover:${s.className} border-none font-semibold`}>{s.label}</Badge>;
  };

  /* ── filtered vetted talents (for dialog search) ──────────── */
  const filteredVettedTalents = vettedTalents.filter((t) => {
    if (!shortlistSearch) return true;
    const q = shortlistSearch.toLowerCase();
    const name = `${t.first_name ?? ""} ${t.last_name ?? ""}`.toLowerCase();
    const title = (t.title ?? "").toLowerCase();
    return name.includes(q) || title.includes(q) || (t.skills ?? []).some(s => s.toLowerCase().includes(q));
  });

  /* ── Loading / not found states ───────────────────────────── */
  if (loading) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 rounded-2xl mb-6" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-12 text-center">
        <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Request Not Found</h2>
        <Button onClick={() => navigate(getInternalPath("/admin/hire-requests"))}>Back to Requests</Button>
      </div>
    );
  }

  /* ── rendered already-shortlisted IDs (for "already added" badge) */
  const shortlistedTalentIds = new Set(shortlist.map(s => s.talent_user_id));

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 font-sans pb-32 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(getInternalPath("/admin/hire-requests"))} className="shrink-0 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{request.title}</h1>
              {getStatusBadge(request.status)}
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              {clientProfile ? `${clientProfile.first_name} ${clientProfile.last_name}` : "—"}
              <span className="text-slate-300">•</span>
              {request.service_model?.replace(/_/g, " ")}
              <span className="text-slate-300">•</span>
              {format(new Date(request.created_at), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isTalentManager && (
            <Button variant="outline" onClick={openEditDialog} className="h-9 text-sm border-slate-200 gap-1.5 bg-white text-slate-700 hover:bg-slate-50">
              <FileText className="w-4 h-4 text-slate-500" /> Edit Job
            </Button>
          )}
          {!isTalentManager && request.status === "submitted" && (
            <Button onClick={handleApprove} disabled={!!actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-9 text-sm">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
            </Button>
          )}
          {!isTalentManager && request.status === "approved" && (
            <Button onClick={handlePublish} disabled={!!actionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9 text-sm">
              <Play className="w-4 h-4 mr-1.5" /> Publish
            </Button>
          )}
          {request.status === "published" && (
            <Button variant="outline" onClick={handleShare} className="h-9 text-sm border-slate-200 gap-1.5">
              <Share2 className="w-4 h-4" /> Share Public Link
            </Button>
          )}
          {!isTalentManager && request.status === "published" && (
            <Button variant="outline" onClick={openShortlistDialog} className="h-9 text-sm border-slate-200">
              <UserPlus className="w-4 h-4 mr-1.5" /> Shortlist Talent
            </Button>
          )}
          {!isTalentManager && ['published','approved','submitted'].includes(request.status) && (
            <Button variant="outline" onClick={() => setShowCloseDialog(true)} className="h-9 text-sm border-red-200 text-red-600">
              <AlertCircle className="w-4 h-4 mr-1.5" /> Close Job
            </Button>
          )}
          {!isTalentManager && request.status === "approved" && (
            <Button variant="outline" onClick={openShortlistDialog} className="h-9 text-sm border-slate-200">
              <UserPlus className="w-4 h-4 mr-1.5" /> Pre-match Talent
            </Button>
          )}
          {/* All admins can invite candidates */}
          <Button 
              onClick={() => { setShowInviteDialog(true); fetchManagedTalents(); }} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 text-sm font-bold"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Invite Candidates
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 w-full justify-start rounded-xl h-auto overflow-x-auto shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 py-2 px-5 rounded-lg text-sm font-medium">
            <FileText className="w-4 h-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="applicants" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 py-2 px-5 rounded-lg text-sm font-medium">
            <Users className="w-4 h-4 mr-2" /> Applicants
            {applications.length > 0 && <Badge className="ml-2 bg-slate-900 text-white hover:bg-slate-800 border-none rounded-full px-2 py-0">{applications.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="shortlist" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 py-2 px-5 rounded-lg text-sm font-medium">
            <Award className="w-4 h-4 mr-2" /> Shortlist
            {shortlist.length > 0 && <Badge className="ml-2 bg-emerald-600 text-white hover:bg-emerald-700 border-none rounded-full px-2 py-0">{shortlist.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="interviews" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 py-2 px-5 rounded-lg text-sm font-medium">
            <Video className="w-4 h-4 mr-2" /> Interviews
            {interviews.length > 0 && <Badge className="ml-2 bg-blue-600 text-white hover:bg-blue-700 border-none rounded-full px-2 py-0">{interviews.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 py-2 px-5 rounded-lg text-sm font-medium">
            <Clock className="w-4 h-4 mr-2" /> Activity Log
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Format", value: request.engagement_type?.replace(/_/g, " ") || "—", icon: Clock },
              { label: "Location", value: request.location_preference || "Any", icon: MapPin },
              { label: "Timezone", value: request.timezone_overlap?.replace(/_/g, " ") || "Flexible", icon: Globe },
              { 
                label: `Budget (${request.budget_type || "—"})`, 
                value: (() => {
                  const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", NGN: "₦", KES: "KSh ", ZAR: "R " };
                  const sym = symbols[(request.preferred_currency as string) || "USD"] || "$";
                  const freq = request.salary_type === "monthly" ? "/mo" : (request.salary_type === "hourly" ? "/hr" : "");
                  if (request.budget_type === "fixed" && request.fixed_budget) {
                    return `${sym}${(request.fixed_budget as number).toLocaleString()}${freq}`;
                  }
                  if (request.budget_min && request.budget_max) {
                    return `${sym}${(request.budget_min as number).toLocaleString()} – ${sym}${(request.budget_max as number).toLocaleString()}${freq}`;
                  }
                  if (request.budget_min) return `From ${sym}${(request.budget_min as number).toLocaleString()}${freq}`;
                  return "TBD";
                })(), 
                icon: DollarSign 
              },
            ].map((item) => (
              <div key={item.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center"><item.icon className="w-3 h-3 mr-1" />{item.label}</p>
                <p className="font-semibold text-slate-900 text-sm capitalize">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Role Summary", content: request.role_summary },
              { title: "Responsibilities", content: request.responsibilities },
              { title: "Requirements & Skills", content: request.requirements },
            ].filter(s => s.content).map((section) => (
              <div key={section.title} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="font-semibold text-slate-900 text-sm">{section.title}</h3></div>
                <div className="p-5"><p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{section.content}</p></div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* APPLICANTS TAB */}
        <TabsContent value="applicants">
          {applications.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">No applicants yet</h3>
              <p className="text-sm text-slate-500 mb-6">{request.status === "published" ? "Applicants will appear once vetted talents apply." : "Publish this request to start receiving applications."}</p>
              <Button onClick={openShortlistDialog} variant="outline" size="sm">
                <UserPlus className="w-4 h-4 mr-2" /> Add Talent Manually
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end mb-4">
                <Button onClick={openShortlistDialog} variant="outline" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" /> Add Talent
                </Button>
              </div>
              {applications.map((app) => (
                <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0">
                      {app.profiles?.first_name?.[0]}{app.profiles?.last_name?.[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{app.profiles?.first_name} {app.profiles?.last_name}</h4>
                      <p className="text-xs text-slate-500">{app.profiles?.title || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{app.status}</Badge>
                    {!shortlistedTalentIds.has(app.talent_user_id) && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => {
                        setSelectedTalentForShortlist({ id: app.talent_user_id, first_name: app.profiles?.first_name ?? null, last_name: app.profiles?.last_name ?? null, title: app.profiles?.title ?? null, skills: app.profiles?.skills ?? null });
                        setShortlistReason("");
                        setShowShortlistDialog(true);
                        fetchVettedTalents();
                      }}>
                        <UserPlus className="w-3 h-3 mr-1" /> Shortlist
                      </Button>
                    )}
                    {shortlistedTalentIds.has(app.talent_user_id) && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">Shortlisted</Badge>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate(getInternalPath(`/admin/talents/${(app as any).v2_profile_id || app.talent_user_id}`))}>
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SHORTLIST TAB */}
        <TabsContent value="shortlist">
          {shortlist.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl">
              <Award className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">Shortlist is empty</h3>
              <p className="text-sm text-slate-500">Add candidates from the Applicants tab or click &quot;Shortlist Talent&quot; to browse vetted talents.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shortlist.map((item) => {
                const interviewForTalent = interviews.find(i => i.talent_user_id === item.talent_user_id);
                return (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 font-semibold text-sm shrink-0 border border-emerald-200">
                        {item.profiles?.first_name?.[0]}{item.profiles?.last_name?.[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{item.profiles?.first_name} {item.profiles?.last_name}</h4>
                        <p className="text-xs text-slate-500">{item.profiles?.title || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">{item.status?.replace(/_/g, " ")}</Badge>
                      {!interviewForTalent && item.status === "shortlisted" && (
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setScheduleTarget(item); setShowScheduleDialog(true); }}>
                          <Calendar className="w-3 h-3 mr-1" /> Schedule Interview
                        </Button>
                      )}
                      {interviewForTalent?.status === "completed" && item.status !== "selected" && (
                        <Button size="sm" className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleFinalizeHire(item.talent_user_id)}>
                          <Award className="w-3 h-3 mr-1" /> Finalize Hire
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate(getInternalPath(`/admin/talents/${(item as any).v2_profile_id || item.talent_user_id}`))}>
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* INTERVIEWS TAB */}
        <TabsContent value="interviews">
          {interviews.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl">
              <Video className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">No interviews scheduled</h3>
              <p className="text-sm text-slate-500">Schedule interviews from the Shortlist tab.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.map((intv) => (
                <div key={intv.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-700 shrink-0 border border-blue-200">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{intv.profiles?.first_name} {intv.profiles?.last_name}</h4>
                      <p className="text-xs text-slate-500">{(intv as Record<string, unknown>).scheduled_time ? format(new Date((intv as Record<string, unknown>).scheduled_time as string), "MMM d, yyyy 'at' h:mm a") : "Time TBD"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs capitalize">{intv.status}</Badge>
                    {(intv as Record<string, unknown>).calendly_link && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                        <a href={(intv as Record<string, unknown>).calendly_link as string} target="_blank" rel="noopener noreferrer">Open Meeting Link</a>
                      </Button>
                    )}
                    {["scheduled", "accepted", "pending"].includes(intv.status as string) && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => callRpc("hr_v2_admin_mark_interview_complete", { interview_id: intv.id, notes: "" }, "Interview marked complete")}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ACTIVITY LOG TAB */}
        <TabsContent value="activity">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="font-semibold text-slate-900 text-sm">Event Timeline</h3></div>
            <div className="divide-y divide-slate-100">
              {events.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">No events recorded yet.</div>
              ) : events.map((evt) => (
                <div key={evt.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-sm text-slate-800 font-medium">{evt.event_type?.replace(/_/g, " ")}</span>
                    <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500">{evt.actor_type}</Badge>
                  </div>
                  <span className="text-xs text-slate-400">{format(new Date(evt.created_at), "MMM d, h:mm a")}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>


      {/* Shortlist Side Panel */}
      {showShortlistDialog && (
        <aside className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-50 overflow-auto">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Shortlist a Vetted Talent</h3>
              <p className="text-sm text-slate-500">Browse vetted talents and add them to this request.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setShowShortlistDialog(false); setSelectedTalentForShortlist(null); }}>Close</Button>
            </div>
          </div>

          {selectedTalentForShortlist ? (
            <div className="px-6 py-6 space-y-5">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0 border border-emerald-200 shadow-sm">
                  {selectedTalentForShortlist.first_name?.[0]}{selectedTalentForShortlist.last_name?.[0]}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{selectedTalentForShortlist.first_name} {selectedTalentForShortlist.last_name}</h4>
                  <p className="text-sm text-slate-500">{selectedTalentForShortlist.title || "—"}</p>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto text-slate-400 hover:text-slate-700 h-8 text-xs" onClick={() => setSelectedTalentForShortlist(null)}>
                  Change
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Reason for shortlisting (optional)</label>
                <Textarea placeholder="Strong skills match, relevant experience..." value={shortlistReason} onChange={(e) => setShortlistReason(e.target.value)} className="min-h-[100px]" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { setSelectedTalentForShortlist(null); }}>Back</Button>
                <Button onClick={handleShortlist} disabled={!!actionLoading} className="bg-emerald-600 text-white hover:bg-emerald-700">
                  <UserPlus className="w-4 h-4 mr-1.5" /> Confirm Shortlist
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-6 py-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search by name, title, or skill..." value={shortlistSearch} onChange={(e) => setShortlistSearch(e.target.value)} className="pl-9 h-10 bg-slate-50 border-slate-200 text-sm" />
              </div>
              <div className="space-y-2">
                {loadingVettedTalents ? (
                  <div className="py-12 text-center text-sm text-slate-500">Loading vetted talents...</div>
                ) : filteredVettedTalents.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-500">No vetted talents found.</div>
                ) : (
                  <div className="space-y-2">
                    {filteredVettedTalents.map((talent) => {
                      const alreadyShortlisted = shortlistedTalentIds.has(talent.id);
                      return (
                        <div
                          key={talent.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${alreadyShortlisted ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer"}`}
                          onClick={() => !alreadyShortlisted && setSelectedTalentForShortlist(talent)}
                        >
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0">
                            {talent.first_name?.[0]}{talent.last_name?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 text-sm truncate">{talent.first_name} {talent.last_name}</h4>
                            <p className="text-xs text-slate-500 truncate">{talent.title || "—"}</p>
                            {talent.skills && talent.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {talent.skills.slice(0, 4).map(s => (
                                  <Badge key={s} variant="secondary" className="text-[9px] bg-slate-50 text-slate-500 py-0 h-4">{s}</Badge>
                                ))}
                                {talent.skills.length > 4 && <span className="text-[9px] text-slate-400 self-center">+{talent.skills.length - 4}</span>}
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {alreadyShortlisted ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">Already Added</Badge>
                            ) : (
                              <>
                                <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-400" onClick={(e) => { e.stopPropagation(); navigate(getInternalPath(`/admin/talents/${(talent as any).profile_id || talent.id}`)); }}>
                                  <Eye className="w-3 h-3 mr-1" /> Profile
                                </Button>
                                <UserPlus className="w-4 h-4 text-emerald-500" />
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Close Job Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Close Job</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Provide a reason for closing this job. This will be visible to talents and clients.</p>
            <div>
              <label className="text-sm font-medium text-slate-700">Reason</label>
              <Textarea value={closeReason} onChange={(e) => setCloseReason(e.target.value)} className="mt-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>Cancel</Button>
            <Button onClick={handleCloseRequest} className="bg-red-600 text-white">Close Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Schedule Interview</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Scheduling interview for <strong>{scheduleTarget?.profiles?.first_name} {scheduleTarget?.profiles?.last_name}</strong>.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Meeting Link (Google Meet, Zoom, etc.)</label>
              <Input placeholder="https://meet.google.com/..." value={calendlyLink} onChange={(e) => setCalendlyLink(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date & Time</label>
              <Input type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Meeting Notes / Agenda (Optional)</label>
              <Textarea placeholder="Please be prepared to discuss your portfolio..." value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} className="h-20 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            <Button onClick={handleScheduleInterview} disabled={!calendlyLink || !scheduledTime || !!actionLoading} className="bg-blue-600 text-white hover:bg-blue-700">
              {actionLoading === "schedule" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Calendar className="w-4 h-4 mr-1.5" />} 
              {actionLoading === "schedule" ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Invite My Talents Dialog ─────────────────────────── */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {isTalentManager ? "Invite My Candidates" : "Invite Vetted Talents"}
            </DialogTitle>
            <p className="text-xs text-slate-500 font-medium">
              {isTalentManager 
                ? "Select talents you manage to invite them to apply for this role."
                : "Browse and invite vetted talents from across the platform to apply."}
            </p>
          </DialogHeader>
          
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder={isTalentManager ? "Search my talents..." : "Search vetted talents..."} 
                value={inviteSearch} 
                onChange={(e) => setInviteSearch(e.target.value)} 
                className="pl-9 h-10 bg-slate-50 border-slate-100 text-sm focus:ring-indigo-500/10" 
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-2">
            {loadingManagedTalents ? (
              <div className="py-20 text-center"><Loader2 className="h-10 w-10 text-slate-200 animate-spin mx-auto" /><p className="mt-4 text-sm text-slate-400 font-medium">{isTalentManager ? "Loading your talents..." : "Loading vetted talents..."}</p></div>
            ) : managedTalents.filter(t => `${t.first_name} ${t.last_name}`.toLowerCase().includes(inviteSearch.toLowerCase())).length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-sm font-medium">No managed talents found matching your search.</div>
            ) : (
              managedTalents
                .filter(t => `${t.first_name} ${t.last_name}`.toLowerCase().includes(inviteSearch.toLowerCase()))
                .map((talent) => {
                  const alreadyInvited = applications.some(a => a.talent_user_id === talent.user_id);
                  return (
                    <div 
                      key={talent.id} 
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${alreadyInvited ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm">
                          {talent.first_name?.[0]}{talent.last_name?.[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{talent.first_name} {talent.last_name}</h4>
                          <p className="text-xs text-slate-500 font-medium">{talent.title}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={alreadyInvited || actionLoading === "invite"}
                        onClick={() => handleInviteToApply(talent)}
                        className={`font-bold text-xs h-8 px-4 ${alreadyInvited ? "bg-slate-100 text-slate-400 border-none" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"}`}
                      >
                        {alreadyInvited ? "Already Invited" : "Invite"}
                      </Button>
                    </div>
                  );
                })
            )}
          </div>
          
          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setShowInviteDialog(false)} className="text-slate-500 font-bold text-sm">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Published Job Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Published Job</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 my-4">
            {/* Section 1: General details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Title</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="e.g. Senior Fullstack Engineer"
                  className="h-10 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Model</label>
                <select
                  value={editForm.service_model}
                  onChange={(e) => setEditForm({ ...editForm, service_model: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white text-slate-800"
                >
                  <option value="">Select Service Model</option>
                  <option value="full_time">Full-time Hire</option>
                  <option value="trial_to_hire">Trial-to-Hire</option>
                  <option value="one_time_project">One-Time Project</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Engagement Type</label>
                <select
                  value={editForm.engagement_type}
                  onChange={(e) => setEditForm({ ...editForm, engagement_type: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white text-slate-800"
                >
                  <option value="">Select Engagement Type</option>
                  <option value="full_time">Full-time (40 hrs/wk)</option>
                  <option value="part_time">Part-time (&lt; 30 hrs/wk)</option>
                  <option value="project_based">Project-based</option>
                  <option value="as_needed">As Needed (Retainer)</option>
                </select>
              </div>
            </div>

            {/* Section 2: Location & Timezone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location Preference</label>
                <Input
                  value={editForm.location_preference}
                  onChange={(e) => setEditForm({ ...editForm, location_preference: e.target.value })}
                  placeholder="e.g. Remote US, LATAM, or Africa"
                  className="h-10 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timezone Overlap</label>
                <select
                  value={editForm.timezone_overlap}
                  onChange={(e) => setEditForm({ ...editForm, timezone_overlap: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white text-slate-800"
                >
                  <option value="">Flexible</option>
                  <option value="utc">UTC / GMT</option>
                  <option value="est">EST (Eastern Standard Time - UTC-5)</option>
                  <option value="cst">CST (Central Standard Time - UTC-6)</option>
                  <option value="mst">MST (Mountain Standard Time - UTC-7)</option>
                  <option value="pst">PST (Pacific Standard Time - UTC-8)</option>
                  <option value="cet">CET (Central European Time - UTC+1)</option>
                  <option value="eet">EET (Eastern European Time - UTC+2)</option>
                  <option value="wat">WAT (West Africa Time - UTC+1)</option>
                  <option value="cat">CAT (Central Africa Time - UTC+2)</option>
                  <option value="eat">EAT (East Africa Time - UTC+3)</option>
                  <option value="ist">IST (Indian Standard Time - UTC+5:30)</option>
                  <option value="sgt">SGT (Singapore Time - UTC+8)</option>
                  <option value="aest">AEST (Australian Eastern Standard Time - UTC+10)</option>
                  <option value="nzst">NZST (New Zealand Standard Time - UTC+12)</option>
                </select>
              </div>
            </div>

            {/* Section 3: Compensation */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Compensation details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Currency</label>
                  <select
                    value={editForm.preferred_currency}
                    onChange={(e) => setEditForm({ ...editForm, preferred_currency: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white text-slate-800"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="NGN">NGN (₦)</option>
                    <option value="KES">KES (KSh)</option>
                    <option value="ZAR">ZAR (R)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Salary Type</label>
                  <select
                    value={editForm.salary_type || "hourly"}
                    onChange={(e) => setEditForm({ ...editForm, salary_type: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white text-slate-800"
                  >
                    <option value="hourly">Hourly Rate</option>
                    <option value="monthly">Monthly Salary</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Type</label>
                  <select
                    value={editForm.budget_type}
                    onChange={(e) => setEditForm({ ...editForm, budget_type: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white text-slate-800"
                  >
                    <option value="range">Salary Range</option>
                    <option value="fixed">Fixed Salary</option>
                  </select>
                </div>
              </div>

              {editForm.budget_type === "fixed" ? (
                <div className="space-y-1.5 max-w-xs animate-fade-in">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fixed Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                      {editForm.preferred_currency === "USD" ? "$" : editForm.preferred_currency === "EUR" ? "€" : editForm.preferred_currency === "GBP" ? "£" : editForm.preferred_currency === "NGN" ? "₦" : editForm.preferred_currency === "KES" ? "KSh" : editForm.preferred_currency === "ZAR" ? "R" : "$"}
                    </div>
                    <Input
                      type="number"
                      value={editForm.fixed_budget}
                      onChange={(e) => setEditForm({ ...editForm, fixed_budget: e.target.value })}
                      placeholder="e.g. 5000"
                      className="pl-9 h-10 border-slate-200 focus-visible:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Minimum Budget</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                        {editForm.preferred_currency === "USD" ? "$" : editForm.preferred_currency === "EUR" ? "€" : editForm.preferred_currency === "GBP" ? "£" : editForm.preferred_currency === "NGN" ? "₦" : editForm.preferred_currency === "KES" ? "KSh" : editForm.preferred_currency === "ZAR" ? "R" : "$"}
                      </div>
                      <Input
                        type="number"
                        value={editForm.budget_min}
                        onChange={(e) => setEditForm({ ...editForm, budget_min: e.target.value })}
                        placeholder="e.g. 3000"
                        className="pl-9 h-10 border-slate-200 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Maximum Budget</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                        {editForm.preferred_currency === "USD" ? "$" : editForm.preferred_currency === "EUR" ? "€" : editForm.preferred_currency === "GBP" ? "£" : editForm.preferred_currency === "NGN" ? "₦" : editForm.preferred_currency === "KES" ? "KSh" : editForm.preferred_currency === "ZAR" ? "R" : "$"}
                      </div>
                      <Input
                        type="number"
                        value={editForm.budget_max}
                        onChange={(e) => setEditForm({ ...editForm, budget_max: e.target.value })}
                        placeholder="e.g. 6000"
                        className="pl-9 h-10 border-slate-200 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Text Content */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role Summary</label>
                <Textarea
                  value={editForm.role_summary}
                  onChange={(e) => setEditForm({ ...editForm, role_summary: e.target.value })}
                  placeholder="Provide a detailed summary of the position..."
                  className="min-h-[100px] border-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsibilities</label>
                <Textarea
                  value={editForm.responsibilities}
                  onChange={(e) => setEditForm({ ...editForm, responsibilities: e.target.value })}
                  placeholder="List the key responsibilities (one per line)..."
                  className="min-h-[120px] border-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Requirements & Skills</label>
                <Textarea
                  value={editForm.requirements}
                  onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })}
                  placeholder="List the technical requirements, qualifications, or skills..."
                  className="min-h-[120px] border-slate-200 focus-visible:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4 mt-6">
            <Button variant="ghost" onClick={() => setShowEditDialog(false)} disabled={savingEdit} className="text-slate-500 hover:text-slate-900">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold">
              {savingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
