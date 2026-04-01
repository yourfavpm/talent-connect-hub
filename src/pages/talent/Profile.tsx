import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Section data is stored as JSONB in talent_profile_sections, not separate tables
type SectionData = {
  country?: string;
  timezone?: string;
  preferred_working_hours?: string;
  primaryRole?: string;
  roleCategory?: string;
  availability?: string;
  yearsOfExperience?: string;
  headline?: string;
  shortBio?: string;
  industry_focus?: string[];
  functional_areas?: string[];
  secondarySkills?: string[];
  toolsFamiliarWith?: string[];
  languagesSpoken?: string[];
  workHistory?: any[]; // Keep as any[] for now as it's complex nested JSON
  education?: any[];
  certifications?: any[];
  references?: any[];
  projects?: any[];
  [key: string]: any;
};

interface VettingStats {
  applications: number;
  activeAssignments: number;
  pendingTimesheets: number;
  unreadMessages: number;
  openTickets: number;
}

interface ManagerProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email?: string | null;
}

import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Clock, Briefcase, FileText, Mail, GraduationCap, Award, Users,
  Download, AlertCircle, Pencil, X, Save, Lock, Copy, Check, ChevronDown,
  ChevronUp, Shield, Send, Loader2, Plus, Trash2, MessageSquare, ExternalLink,
  Info, CheckCircle2, Globe, Layout, Building2, UserCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RoleSelector } from "@/components/talent/onboarding/RoleSelector";
import { TimezoneSelector } from "@/components/talent/onboarding/TimezoneSelector";

// ── Types ──────────────────────────────────────────────────────────────────────

type SectionKey = "basic_info" | "professional" | "skills" | "work_history" | "education" | "certifications" | "documents" | "references" | "projects";

const SECTION_LABELS: Record<SectionKey, string> = {
  basic_info: "Basic Information",
  professional: "Professional Summary",
  skills: "Skill Set & Expertise",
  work_history: "Experience History",
  education: "Education",
  certifications: "Certifications",
  documents: "Documents & Verification",
  references: "Professional References",
  projects: "Project Portfolio",
};

// ── Main Component ─────────────────────────────────────────────────────────────

const TalentProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<SectionKey>>(new Set(["documents", "references"]));
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [savingSection, setSavingSection] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // ── Data Fetch ─────────────────────────────────────────────────────────────

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["talentProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: profile } = await supabase.from("talent_profiles").select("*").eq("user_id", user.id).maybeSingle();
      const { data: sections } = await supabase.from("talent_profile_sections").select("*").eq("user_id", user.id) as { data: any[] | null };
      
      const mergedData: SectionData = {};
      const sectionStatuses: Record<string, string> = {};
      if (sections) {
        sections.forEach(s => {
          if (s.data && typeof s.data === 'object') {
            Object.assign(mergedData, s.data as SectionData);
          }
          sectionStatuses[s.section_key] = s.status;
        });
      }

      // Legacy support for basic fields not yet in sections
      const { data: legacyTalent } = await supabase.from("talents").select("*").eq("user_id", user.id).maybeSingle();

      let managerRes = null;
      if (profile?.assigned_admin_id) {
        const { data } = await supabase.from("profiles").select("*").eq("user_id", profile.assigned_admin_id).maybeSingle();
        managerRes = data;
      }

      const [applicationsRes, contractsRes, timesheetsRes, messagesRes, ticketsRes, notificationsRes] = await Promise.all([
        supabase.from("job_applications").select("*", { count: "exact", head: true }).eq("talent_id", profile?.id || ''),
        supabase.from("contracts").select("*", { count: "exact", head: true }).eq("talent_id", profile?.id || '').eq("status", "active"),
        supabase.from("timesheets").select("*", { count: "exact", head: true }).eq("talent_id", profile?.id || '').eq("status", "draft"),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["open", "in_progress"]),
        supabase.from("notifications").select("*").eq("user_id", user.id).order('created_at', { ascending: false }).limit(5),
      ]) as any[];
  
      return {
        profile: profile as Database["public"]["Tables"]["talent_profiles"]["Row"] | null,
        legacyTalent: legacyTalent as Database["public"]["Tables"]["talents"]["Row"] | null,
        mergedData,
        sectionStatuses,
        changedSections: (sections?.filter(s => s.status === 'CHANGES_REQUESTED').map(s => s.section_key) as SectionKey[]) || [],
        stats: {
          applications: applicationsRes.count || 0,
          activeAssignments: contractsRes.count || 0,
          pendingTimesheets: timesheetsRes.count || 0,
          unreadMessages: messagesRes.count || 0,
          openTickets: ticketsRes.count || 0,
        } as VettingStats,
        notifications: (notificationsRes?.data || []) as any[],
        manager: managerRes as ManagerProfile | null,
      };
    },
    enabled: !!user?.id,
  });

  // ── Derived Data ───────────────────────────────────────────────────────────
  const talent = data?.profile || data?.legacyTalent || ({} as any);
  const mergedData = data?.mergedData || ({} as SectionData);
  const sectionStatuses = data?.sectionStatuses || {};
  const changedSections = data?.changedSections || [];
  const manager = data?.manager;
  const vetting = talent; 
  const profileStatus = (talent as any).status; 
  const extendedData = mergedData; 

  const workHistory = mergedData.workHistory || [];
  const education = mergedData.education || [];
  const certifications = mergedData.certifications || [];
  const references = mergedData.references || [];
  const projects = mergedData.projects || [];

  const vettingStatus: string = talent.status || "DRAFT";
  const onboardingLocked = talent.locked_onboarding || false;
  
  const isSubmitted = vettingStatus !== "DRAFT" || onboardingLocked;

  const completionPercentage = talent.completion_percent || 0;

  // ── Section Editing Forms ──────────────────────────────────────────────────
  const [basicForm, setBasicForm] = useState<{ country: string; timezone: string; preferred_working_hours: string } | null>(null);
  const [proForm, setProForm] = useState<Partial<SectionData> | null>(null);
  const [skillsForm, setSkillsForm] = useState<{ secondary_skills: string[]; tools_familiar_with: string[]; languages_spoken: string[] } | null>(null);
  const [projectsForm, setProjectsForm] = useState<any[] | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [newTool, setNewTool] = useState("");
  const [newLang, setNewLang] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newFunction, setNewFunction] = useState("");

  const startEditing = (section: SectionKey) => {
    // Only allow edit if DRAFT or changes requested for this specific section
    const canEdit = vettingStatus === "DRAFT" || sectionStatuses[section] === "CHANGES_REQUESTED";
    
    if (!canEdit) {
      toast.error("This section is locked for review.");
      return;
    }

    setEditingSection(section);
    if (section === "basic_info") {
      setBasicForm({ 
        country: mergedData.country || talent.country || "", 
        timezone: mergedData.timezone || talent.timezone || "", 
        preferred_working_hours: mergedData.preferred_working_hours || talent.preferred_working_hours || "" 
      });
    } else if (section === "professional") {
      setProForm({
        primary_role: mergedData.primaryRole || talent.primary_role || "",
        role_category: mergedData.roleCategory || talent.role_category || "",
        availability: mergedData.availability || talent.availability || "",
        years_of_experience: mergedData.yearsOfExperience || talent.years_of_experience || "",
        headline: mergedData.headline || "",
        short_bio: mergedData.shortBio || "",
        industry_focus: mergedData.industry_focus || [],
        functional_areas: mergedData.functional_areas || [],
      });
    } else if (section === "skills") {
      setSkillsForm({
        secondary_skills: [...(mergedData.secondarySkills || talent.secondary_skills || [])],
        tools_familiar_with: [...(mergedData.toolsFamiliarWith || talent.tools_familiar_with || [])],
        languages_spoken: [...(mergedData.languagesSpoken || talent.languages_spoken || [])],
      });
    } else if (section === "projects") {
      setProjectsForm([...(mergedData.projects || [])]);
    }
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setBasicForm(null);
    setProForm(null);
    setSkillsForm(null);
    setProjectsForm(null);
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-6 w-6 text-slate-200 animate-spin" />
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Initialising Environment…</span>
      </div>
    );
  }

  // ── Save Logic ─────────────────────────────────────────────────────────────

  // ── Save Logic ─────────────────────────────────────────────────────────────

  const saveSectionData = async (sectionKey: string, data: any) => {
    try {
      setSavingSection(true);
      const { error } = await (supabase.rpc as any)("update_section_data", {
        p_section_key: sectionKey,
        p_data: data,
        p_completion_percent: completionPercentage // Keep current or re-calc
      });
      if (error) throw error;
      toast.success(`${SECTION_LABELS[sectionKey as SectionKey]} updated`);
      cancelEditing();
      refetch();
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setSavingSection(false);
    }
  };

  const saveBasicInfo = () => saveSectionData("basic_info", basicForm);
  const saveProfessional = () => saveSectionData("professional", proForm);
  const saveSkills = () => saveSectionData("skills", skillsForm);
  const saveProjects = () => saveSectionData("projects", { projects: projectsForm });

  const submitForReview = async () => {
    try {
      setSubmittingReview(true);
      const { error } = await (supabase.rpc as any)("submit_talent_onboarding");
      if (error) throw error;

      toast.success("Profile submitted for review");
      setReviewDrawerOpen(false);
      refetch();
    } catch (e: any) {
      toast.error("Failed to submit: " + e.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const toggleCollapse = (key: SectionKey) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getVettingBadge = () => {
    const statusMap: Record<string, { label: string, color: string, icon: any }> = {
      DRAFT: { label: "Draft", color: "bg-slate-100 text-slate-500 border-slate-200", icon: Pencil },
      SUBMITTED: { label: "Pending Review", color: "bg-blue-50 text-blue-700 border-blue-100", icon: Clock },
      VETTING_IN_PROGRESS: { label: "Vetting in Progress", color: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: Shield },
      CHANGES_REQUESTED: { label: "Action Required", color: "bg-amber-50 text-amber-700 border-amber-100", icon: AlertCircle },
      RESUBMITTED: { label: "Resubmitted", color: "bg-blue-50 text-blue-700 border-blue-100", icon: Clock },
      VETTED: { label: "Vetted & Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2 },
      REJECTED: { label: "Application Rejected", color: "bg-red-50 text-red-700 border-red-100", icon: X },
      SUSPENDED: { label: "Account Suspended", color: "bg-slate-900 text-white border-slate-800", icon: Lock },
    };
    const config = statusMap[vettingStatus] || { label: vettingStatus, color: "bg-slate-100 text-slate-500", icon: Info };
    const Icon = config.icon;
    return (
      <Badge className={cn("px-2 py-1 gap-1.5 border font-semibold", config.color)}>
        <Icon className="h-3 w-3" /> {config.label}
      </Badge>
    );
  };

  // ── Render Helpers ──────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1400px] mx-auto pb-20 pt-6 px-4 md:px-6 font-inter">

      {/* ── Status Banners ─────────────────────────────────────────────────── */}
      <div className="space-y-3 mb-6">
        {completionPercentage < 100 && vettingStatus === "unvetted" && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 text-white rounded-xl px-5 py-4 shadow-lg animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                <Info className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold">Incomplete Professional Profile</p>
                <p className="text-xs text-slate-400 mt-0.5">Your profile is {completionPercentage}% complete. Complete all fields to trigger review.</p>
              </div>
            </div>
            <div className="flex items-center gap-6 w-full md:w-auto">
              <Progress value={completionPercentage} className="w-32 h-1.5 bg-white/10 hidden sm:block" />
              <Link to={getInternalPath("/talent/onboarding")} className="w-full md:w-auto">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 w-full md:w-auto whitespace-nowrap">
                  Complete Profile
                </Button>
              </Link>
            </div>
          </div>
        )}

        {vettingStatus === "unvetted" && completionPercentage >= 100 && profileStatus !== "submitted" && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-blue-900 text-white rounded-xl px-5 py-4 shadow-lg animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold">Profile Ready for Review</p>
                <p className="text-xs text-blue-100 mt-0.5">Your profile is 100% complete. Submit it now to start the OPSlyHR vetting process.</p>
              </div>
            </div>
            <Button onClick={() => setReviewDrawerOpen(true)} size="sm" className="bg-white text-blue-900 hover:bg-slate-100 font-bold h-9 px-4 w-full md:w-auto">
              Submit for Review
            </Button>
          </div>
        )}

        {isSubmitted && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-900">Application Under Review</p>
              <p className="text-xs text-blue-700 mt-0.5">Our vetting team is currently verifying your profile details. Edits are temporarily locked.</p>
            </div>
          </div>
        )}

        {vettingStatus === "changes_requested" && (
          <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-100 rounded-xl px-5 py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900">Revisions Required</p>
                <p className="text-xs text-amber-700 mt-0.5">The vetting team has suggested improvements. Check admin notes in your dashboard.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* ══════════════ LEFT SIDEBAR ══════════════ */}
        <aside className="w-full lg:w-[320px] shrink-0 space-y-6">
          <Card className="border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
            <CardContent className="p-0">
              <div className="p-8 text-center border-b border-slate-100 bg-slate-50/30">
                <div className="h-24 w-24 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 overflow-hidden group relative">
                   {talent.first_name?.[0]}{talent.last_name?.[0]}
                </div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  {talent.first_name} {talent.last_name}
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-1 capitalize leading-relaxed">
                  {talent.primary_role?.replace(/_/g, " ") || "Primary Role Not Set"}
                </p>
                <div className="flex justify-center mt-6">
                  {getVettingBadge()}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <SidebarItem icon={<MapPin className="h-4 w-4" />} label="Location" value={talent.country || mergedData.country} />
                  <SidebarItem icon={<Clock className="h-4 w-4" />} label="Availability" value={(talent.availability || mergedData.availability)?.replace(/_/g, " ")} />
                  <SidebarItem icon={<Globe className="h-4 w-4" />} label="Timezone" value={talent.timezone || mergedData.timezone} />
                  <SidebarItem icon={<Shield className="h-4 w-4" />} label="Vetting Level" value={talent.vetting_level || "L0 - Not Vetted"} />
                  <SidebarItem icon={<AlertCircle className="h-4 w-4" />} label="Vetting Status" value={talent.status?.replace(/_/g, " ") || "Pending"} />
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Profile Strength</p>
                  <div className="space-y-2 px-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Completion</span>
                      <span>{completionPercentage}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-1.5 bg-slate-100" />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Talent Manager</p>
                  {manager ? (
                    <>
                      <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                          {manager.first_name?.[0]}{manager.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{manager.first_name} {manager.last_name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{manager.email}</p>
                        </div>
                      </div>
                      <Link to={getInternalPath("/talent/support/new")} className="block mt-3 px-1">
                         <Button variant="outline" size="sm" className="w-full text-[11px] h-8 font-bold border-slate-200 hover:bg-slate-50">
                            Support Ticket
                         </Button>
                      </Link>
                    </>
                  ) : (
                    <div className="bg-slate-50/50 rounded-lg p-4 border border-dashed border-slate-200 flex items-center justify-center">
                       <p className="text-[11px] font-bold text-slate-400 italic uppercase tracking-widest">Not Assigned</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm p-6">
             <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900">Trust & Safety</h3>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Your data is managed under OPSlyHR Enterprise security protocols. Identity verification is permanent.
             </p>
             <div className="space-y-2">
                {vetting?.status === 'approved' && talent.government_id_url && (
                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-md border border-emerald-100">
                    <span>ID VERIFIED</span>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                )}
                {talent.nda_agreed && (
                  <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-100">
                    <span>NDA SIGNED</span>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                )}
                {!talent.nda_agreed && !talent.government_id_url && (
                  <p className="text-[10px] font-bold text-slate-300 italic px-1 pt-1">No trust markers verified yet</p>
                )}
             </div>
          </Card>
        </aside>

        {/* ══════════════ MAIN CONTENT ══════════════ */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* ── Section: Professional Summary ────────────────────────── */}
          <SectionCard redesign
            sectionKey="professional"
            icon={<UserCircle className="h-4 w-4" />}
            collapsed={collapsedSections.has("professional")}
            onToggle={() => toggleCollapse("professional")}
            editing={editingSection === "professional"}
            onEdit={() => startEditing("professional")}
            locked={isSubmitted}
          >
            {editingSection === "professional" && proForm ? (
              <div className="space-y-6 py-2">
                <div className="space-y-4">
                   <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <RoleSelector
                          category={proForm.role_category}
                          onCategoryChange={(v) => setProForm({ ...proForm, role_category: v })}
                          value={proForm.primary_role}
                          onChange={(v) => setProForm({ ...proForm, primary_role: v })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Professional Headline</Label>
                        <Input value={proForm.headline} onChange={(e) => setProForm({ ...proForm, headline: e.target.value })} className="h-10" placeholder="e.g. Senior Operations Architect with 8+ Years Experience" />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Short Bio / Executive Summary</Label>
                      <Textarea value={proForm.short_bio} onChange={(e) => setProForm({ ...proForm, short_bio: e.target.value })} className="min-h-[120px] p-4 text-sm resize-none" placeholder="Describe your career trajectory and key professional achievements..." />
                   </div>

                   <div className="grid md:grid-cols-2 gap-6">
                      <ChipEditor redesign label="Industry Focus" items={proForm.industry_focus} newValue={newIndustry} onNewChange={setNewIndustry}
                         onAdd={() => { if (newIndustry.trim()) { setProForm({ ...proForm, industry_focus: [...proForm.industry_focus, newIndustry.trim()] }); setNewIndustry(""); } }}
                         onRemove={(i) => setProForm({ ...proForm, industry_focus: proForm.industry_focus.filter((_: any, idx: number) => idx !== i) })}
                      />
                      <ChipEditor redesign label="Functional Areas" items={proForm.functional_areas} newValue={newFunction} onNewChange={setNewFunction}
                         onAdd={() => { if (newFunction.trim()) { setProForm({ ...proForm, functional_areas: [...proForm.functional_areas, newFunction.trim()] }); setNewFunction(""); } }}
                         onRemove={(i) => setProForm({ ...proForm, functional_areas: proForm.functional_areas.filter((_: any, idx: number) => idx !== i) })}
                      />
                   </div>

                   <div className="grid md:grid-cols-2 gap-4 pt-4">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Years of Experience</Label>
                        <Input type="number" value={proForm.years_of_experience} onChange={(e) => setProForm({ ...proForm, years_of_experience: e.target.value })} className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Engagement Preference</Label>
                        <Select value={proForm.availability} onValueChange={(v) => setProForm({ ...proForm, availability: v })}>
                          <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_time">Full Time (40h/wk)</SelectItem>
                            <SelectItem value="part_time">Part Time (20h/wk)</SelectItem>
                            <SelectItem value="contract">Project Based / Contract</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                   </div>
                </div>
                <EditFooter redesign onSave={saveProfessional} onCancel={cancelEditing} saving={savingSection} />
              </div>
            ) : (
              <div className="space-y-8 py-2">
                <div className="space-y-2">
                   <h2 className="text-xl font-bold text-slate-900 tracking-tight">{extendedData.headline || "Professional Headline Not Set"}</h2>
                   <p className="text-slate-500 text-sm leading-relaxed max-w-3xl">
                      {extendedData.short_bio || "No professional summary has been added yet. Use the edit feature to add an executive summary."}
                   </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                   <SidebarItem label="Industry Focus" items={extendedData.industry_focus} />
                   <SidebarItem label="Functional Areas" items={extendedData.functional_areas} />
                   <SidebarItem label="Experience Level" value={talent.years_of_experience ? `${talent.years_of_experience} Years Verified` : null} />
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Section: Skills & Tools ──────────────────────────────────── */}
          <SectionCard redesign
            sectionKey="skills"
            icon={<Award className="h-4 w-4" />}
            collapsed={collapsedSections.has("skills")}
            onToggle={() => toggleCollapse("skills")}
            editing={editingSection === "skills"}
            onEdit={() => startEditing("skills")}
            locked={isSubmitted}
          >
            {editingSection === "skills" && skillsForm ? (
              <div className="space-y-6 py-2">
                <ChipEditor redesign label="Core Skill Set" items={skillsForm.secondary_skills} newValue={newSkill} onNewChange={setNewSkill}
                  onAdd={() => { if (newSkill.trim()) { setSkillsForm({ ...skillsForm, secondary_skills: [...skillsForm.secondary_skills, newSkill.trim()] }); setNewSkill(""); } }}
                  onRemove={(i) => setSkillsForm({ ...skillsForm, secondary_skills: skillsForm.secondary_skills.filter((_: any, idx: number) => idx !== i) })}
                />
                <ChipEditor redesign label="Software Stack & Tools" items={skillsForm.tools_familiar_with} newValue={newTool} onNewChange={setNewTool}
                  onAdd={() => { if (newTool.trim()) { setSkillsForm({ ...skillsForm, tools_familiar_with: [...skillsForm.tools_familiar_with, newTool.trim()] }); setNewTool(""); } }}
                  onRemove={(i) => setSkillsForm({ ...skillsForm, tools_familiar_with: skillsForm.tools_familiar_with.filter((_: any, idx: number) => idx !== i) })}
                />
                <ChipEditor redesign label="Language Proficiency" items={skillsForm.languages_spoken} newValue={newLang} onNewChange={setNewLang}
                  onAdd={() => { if (newLang.trim()) { setSkillsForm({ ...skillsForm, languages_spoken: [...skillsForm.languages_spoken, newLang.trim()] }); setNewLang(""); } }}
                  onRemove={(i) => setSkillsForm({ ...skillsForm, languages_spoken: skillsForm.languages_spoken.filter((_: any, idx: number) => idx !== i) })}
                />
                <EditFooter redesign onSave={saveSkills} onCancel={cancelEditing} saving={savingSection} />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 py-2">
                <ChipGroup redesign label="Core Professional Skills" items={talent.secondary_skills} />
                <ChipGroup redesign label="Tools & Ecosystem" items={talent.tools_familiar_with} variant="outline" />
                <ChipGroup redesign label="Linguistics" items={talent.languages_spoken} variant="text" />
              </div>
            )}
          </SectionCard>

          {/* ── Section: Work History ────────────────────────────────────── */}
          <SectionCard redesign
            sectionKey="work_history"
            icon={<Briefcase className="h-4 w-4" />}
            collapsed={collapsedSections.has("work_history")}
            onToggle={() => toggleCollapse("work_history")}
            editing={false}
            onEdit={() => {}}
            locked={isSubmitted}
          >
            <div className="space-y-10 py-4">
              {workHistory.length > 0 ? workHistory.map((work, i) => (
                <div key={work.id} className="relative pl-8">
                  <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-white z-10" />
                  {i !== workHistory.length - 1 && <div className="absolute left-[5.5px] top-4 -bottom-10 w-px bg-slate-100" />}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                     <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{work.companyName || work.company_name}</span>
                     </div>
                     <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {work.startDate || work.start_date} – {work.isCurrent || work.is_current ? "PRESENT" : (work.endDate || work.end_date)}
                     </span>
                  </div>
                  
                  <h4 className="text-lg font-bold text-slate-900 mb-3">{work.roleTitle || work.role_title}</h4>
                  {(work.roleDescription || work.role_description) && (
                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl whitespace-pre-line bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                       {work.roleDescription || work.role_description}
                    </p>
                  )}
                </div>
              )) : (
                <EmptyState icon={<Briefcase />} label="No work history recorded" cta="Add Experience" />
              )}
            </div>
          </SectionCard>

          {/* ── Section: Projects ────────────────────────────────────────── */}
          <SectionCard redesign
            sectionKey="projects"
            icon={<Layout className="h-4 w-4" />}
            collapsed={collapsedSections.has("projects")}
            onToggle={() => toggleCollapse("projects")}
            editing={editingSection === "projects"}
            onEdit={() => startEditing("projects")}
            locked={isSubmitted}
          >
             {editingSection === "projects" && projectsForm ? (
               <div className="space-y-6 py-2">
                  <div className="space-y-4">
                     {projectsForm.map((p: any, i: number) => (
                       <div key={i} className="p-5 border border-slate-100 rounded-xl bg-slate-50/50 space-y-4 relative group">
                          <button onClick={() => setProjectsForm(projectsForm.filter((_: any, idx: number) => idx !== i))} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Title</Label>
                                <Input value={p.title} onChange={e => { const up = [...projectsForm]; up[i].title = e.target.value; setProjectsForm(up); }} className="h-10 bg-white" />
                             </div>
                             <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live URL / Repository</Label>
                                <Input value={p.url} onChange={e => { const up = [...projectsForm]; up[i].url = e.target.value; setProjectsForm(up); }} className="h-10 bg-white" placeholder="https://..." />
                             </div>
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Description</Label>
                             <Textarea value={p.description} onChange={e => { const up = [...projectsForm]; up[i].description = e.target.value; setProjectsForm(up); }} className="h-24 bg-white resize-none" />
                          </div>
                       </div>
                     ))}
                     <Button variant="outline" className="w-full border-dashed py-6 gap-2" onClick={() => setProjectsForm([...projectsForm, { title: "", url: "", description: "" }])}>
                        <Plus className="h-4 w-4" /> Add Project Showcase
                     </Button>
                  </div>
                  <EditFooter redesign onSave={saveProjects} onCancel={cancelEditing} saving={savingSection} />
               </div>
             ) : (
               <div className="grid md:grid-cols-2 gap-6 py-2">
                   {projects.length > 0 ? projects.map((p: any, i: number) => (
                    <div key={i} className="p-6 border border-slate-100 rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:border-slate-300 transition-colors">
                       <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-slate-900">{p.title || "Untitled Project"}</h4>
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900">
                               <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                       </div>
                       <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                          {p.description || "No project description provided."}
                       </p>
                    </div>
                  )) : (
                    <div className="col-span-2">
                       <EmptyState icon={<Layout />} label="No portfolio projects added yet" />
                    </div>
                  )}
               </div>
             )}
          </SectionCard>

          {/* ── Section: Education ─────────────────────────────────────── */}
          <SectionCard redesign
            sectionKey="education"
            icon={<GraduationCap className="h-4 w-4" />}
            collapsed={collapsedSections.has("education")}
            onToggle={() => toggleCollapse("education")}
            editing={editingSection === "education"}
            onEdit={() => startEditing("education")}
            locked={isSubmitted}
          >
             <div className="py-2">
                {education.length > 0 ? (
                  <div className="grid gap-4">
                    {education.map((edu) => (
                      <div key={edu.id} className="flex items-start justify-between p-5 rounded-xl bg-slate-50/50 border border-slate-100 group">
                        <div className="flex gap-4">
                           <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <GraduationCap className="h-5 w-5" />
                           </div>
                           <div>
                              <h4 className="text-base font-bold text-slate-900 leading-tight">{edu.institutionName || edu.institution_name}</h4>
                              <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{edu.degree || edu.education_level}{(edu.fieldOfStudy || edu.field_of_study) ? ` / ${edu.fieldOfStudy || edu.field_of_study}` : ""}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded border border-slate-100 whitespace-nowrap tracking-widest">
                            {edu.startYear || edu.start_year} – { (edu.isCurrent || edu.is_current) ? "PRESENT" : (edu.endYear || edu.end_year) }
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<GraduationCap />} label="No academic history added" />
                )}
             </div>
          </SectionCard>

          {/* ── Section: Basic Info ──────────────────────────────────────── */}
          <SectionCard redesign
            sectionKey="basic_info"
            icon={<Globe className="h-4 w-4" />}
            collapsed={collapsedSections.has("basic_info")}
            onToggle={() => toggleCollapse("basic_info")}
            editing={editingSection === "basic_info"}
            onEdit={() => startEditing("basic_info")}
            locked={isSubmitted}
          >
            {editingSection === "basic_info" && basicForm ? (
              <div className="space-y-6 py-2">
                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Identity (Locked)</p>
                      <LockedField label="Legal First Name" value={talent.first_name} />
                      <LockedField label="Legal Last Name" value={talent.last_name} />
                      <LockedField label="Email Address" value={talent.email} />
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Demographics</p>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500">Current Country</Label>
                        <Input value={basicForm.country} onChange={(e) => setBasicForm({ ...basicForm, country: e.target.value })} className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500">Primary Timezone</Label>
                        <TimezoneSelector
                          value={basicForm.timezone}
                          onChange={(v) => setBasicForm({ ...basicForm, timezone: v })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500">Working Hours Override</Label>
                        <Input value={basicForm.preferred_working_hours} onChange={(e) => setBasicForm({ ...basicForm, preferred_working_hours: e.target.value })} className="h-10" placeholder="e.g. 10:00 - 18:00 EST" />
                      </div>
                   </div>
                </div>
                <EditFooter redesign onSave={saveBasicInfo} onCancel={cancelEditing} saving={savingSection} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-12 py-4">
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Verification Identity</p>
                  <SidebarItem label="Verified Email" value={talent.email} isLocked />
                  <SidebarItem label="Mobile Number" value={talent.phone} isLocked />
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Geographic Data</p>
                  <SidebarItem label="Current Country" value={talent.country} />
                  <SidebarItem label="Local Timezone" value={talent.timezone} />
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Operational Schedule</p>
                  <SidebarItem label="Work Hours" value={talent.preferred_working_hours} />
                  <SidebarItem label="Weekly Availability" value={talent.availability?.replace(/_/g, " ")} />
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Account Metrics</p>
                  <SidebarItem label="Vetting Status" value={talent.vetting_status?.replace(/_/g, " ")} />
                  <SidebarItem label="Profile Strength" value={`${completionPercentage}%`} />
                </div>
              </div>
            )}
          </SectionCard>

        </main>
      </div>

      {/* Sheet / Drawer (Legacy implementation preserved for review submission) */}
      <Sheet open={reviewDrawerOpen} onOpenChange={setReviewDrawerOpen}>
        <SheetContent className="w-[90vw] sm:max-w-md flex flex-col h-full bg-white p-0 overflow-hidden font-inter">
          <SheetHeader className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-blue-600 border border-slate-200 uppercase tracking-widest mb-3 shadow-sm w-fit">
               RE-VERIFICATION
            </div>
            <SheetTitle className="text-2xl font-bold text-slate-900 tracking-tight">Submit Changes</SheetTitle>
            <SheetDescription className="text-slate-500 text-sm font-medium">
               A Talent Operations specialist will review these updates.
            </SheetDescription>
          </SheetHeader>

          <div className="p-8 flex-1 overflow-y-auto space-y-8">
            <div className="space-y-4">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Summary</h3>
               <div className="grid gap-2">
                  {changedSections.map(s => (
                    <div key={s} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                       <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                       <span className="text-sm font-bold text-slate-700 capitalize">{SECTION_LABELS[s as SectionKey] || s}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Note</h3>
               <Textarea
                 placeholder="Describe the context of these updates..."
                 className="min-h-[140px] border-slate-200 bg-slate-50/30 text-sm p-4 resize-none focus:bg-white transition-colors"
                 value={reviewMessage}
                 onChange={(e) => setReviewMessage(e.target.value)}
               />
            </div>
          </div>

          <SheetFooter className="p-8 border-t border-slate-100 bg-white">
            <Button
              className="w-full h-12 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm gap-2"
              disabled={changedSections.length === 0 || submittingReview}
              onClick={submitForReview}
            >
              {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><Send className="h-4 w-4" /> Confirm & Send for Review</>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// ── Redesigned Sub-components ──────────────────────────────────────────────────

interface SectionCardProps {
  sectionKey: SectionKey;
  icon: React.ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  editing: boolean;
  onEdit: () => void;
  locked: boolean;
  children: React.ReactNode;
  redesign?: boolean;
}

const SectionCard = ({ sectionKey, icon, collapsed, onToggle, editing, onEdit, locked, children, redesign }: SectionCardProps) => (
  <Card className={cn("border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.01)] overflow-hidden bg-white", redesign && "rounded-xl border")}>
    <div
      className="flex items-center justify-between px-4 md:px-8 py-4 md:py-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
           {icon}
        </div>
        <h3 className="text-sm md:text-base font-bold text-slate-900 truncate">{SECTION_LABELS[sectionKey]}</h3>
      </div>
      <div className="flex items-center gap-4">
        {!editing && !locked && onEdit.toString() !== "() => {}" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] font-bold text-blue-600 hover:bg-blue-50 bg-white border border-transparent hover:border-blue-100 gap-1.5 transition-all"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            <Pencil className="h-3 w-3" /> Edit Section
          </Button>
        )}
        <div className="h-8 w-8 flex items-center justify-center text-slate-300">
           {collapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </div>
      </div>
    </div>
    {!collapsed && (
      <CardContent className="px-4 md:px-8 pb-6 md:pb-8 pt-2">
        {children}
      </CardContent>
    )}
  </Card>
);

const SidebarItem = ({ icon, label, value, items, isLocked }: { icon?: React.ReactNode; label: string; value?: string | null; items?: string[]; isLocked?: boolean }) => (
  <div className="space-y-1 mb-1">
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
       {icon} {label} {isLocked && <Lock className="h-2 w-2" />}
    </div>
    {items ? (
       <div className="flex flex-wrap gap-1 mt-2">
          {items.map((it, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] font-bold bg-slate-50 text-slate-600 border-slate-100 rounded-md">
               {it}
            </Badge>
          ))}
          {items.length === 0 && <span className="text-xs text-slate-300 font-medium italic">Not Defined</span>}
       </div>
    ) : (
      <div className={cn("text-sm font-bold", value ? "text-slate-900" : "text-slate-300 italic")}>
        {value || "Pending Settlement"}
      </div>
    )}
  </div>
);

const InfoItem = ({ label, value, locked }: { label: string; value?: string | null; locked?: boolean }) => (
  <div className="space-y-1">
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
      {locked && <Lock className="h-2 w-2" />} {label}
    </span>
    <p className={cn("text-sm font-bold", value ? "text-slate-900" : "text-slate-300 italic")}>
      {value ? <span className="capitalize">{value}</span> : "N/A"}
    </p>
  </div>
);

const EmptyState = ({ icon, label, cta }: { icon: any, label: string, cta?: string }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
     <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon}
     </div>
     <p className="text-sm font-bold text-slate-400 mb-4">{label}</p>
     {cta && (
       <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold border-slate-200">
          {cta}
       </Button>
     )}
  </div>
);

const EditFooter = ({ redesign, onSave, onCancel, saving }: { redesign?: boolean, onSave: () => void; onCancel: () => void; saving: boolean }) => (
  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 md:pt-8 mt-6 border-t border-slate-100">
    <Button variant="ghost" size="sm" className="h-10 w-full sm:w-auto text-xs font-bold text-slate-500 hover:bg-slate-50" onClick={onCancel}>
       Discard Changes
    </Button>
    <Button size="sm" className="h-10 w-full sm:w-auto text-xs font-bold gap-2 bg-slate-950 text-white hover:bg-slate-900 shadow-sm" onClick={onSave} disabled={saving}>
      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
      Save Draft Update
    </Button>
  </div>
);

const ChipGroup = ({ label, items, variant, redesign }: { label: string; items?: string[] | null; variant?: "outline" | "text", redesign?: boolean }) => {
  if (!items || items.length === 0) return (
     <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{label}</h4>
        <p className="text-xs text-slate-300 italic">Not specified</p>
     </div>
  );
  return (
    <div>
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{label}</h4>
      {variant === "text" ? (
        <p className="text-sm font-bold text-slate-900 leading-relaxed">{items.join(", ")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <Badge key={i} variant={variant === "outline" ? "outline" : "secondary"} className="text-[10px] font-bold py-1 bg-slate-50 text-slate-700 border-slate-200 rounded-md">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const ChipEditor = ({ redesign, label, items, newValue, onNewChange, onAdd, onRemove }: {
  label: string; items: string[]; newValue: string; onNewChange: (v: string) => void; onAdd: () => void; onRemove: (i: number) => void; redesign?: boolean;
}) => (
  <div className="space-y-3">
    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</Label>
    <div className="flex flex-wrap gap-2 min-h-[32px]">
      {items.map((item: string, i: number) => (
        <Badge key={i} variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-700 border-slate-200 gap-2 pr-1 h-7">
          {item}
          <button onClick={() => onRemove(i)} className="p-0.5 rounded hover:bg-slate-200 transition-colors">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {items.length === 0 && <span className="text-[10px] text-slate-300 italic mt-1">Empty…</span>}
    </div>
    <div className="flex gap-2">
      <Input
        placeholder={`Add ${label.toLowerCase()}…`}
        value={newValue}
        onChange={(e) => onNewChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
        className="h-10 text-sm bg-white"
      />
      <Button variant="outline" size="sm" className="h-10 w-10 shrink-0 border-slate-200" onClick={onAdd}><Plus className="h-4 w-4" /></Button>
    </div>
  </div>
);

const LockedField = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1.5">
    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
      <Lock className="h-2.5 w-2.5" /> {label}
    </Label>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="h-10 px-4 flex items-center rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-400 font-medium cursor-not-allowed">
          {value || "Not Verified"}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs bg-slate-900">Security locked. Verification required to change.</TooltipContent>
    </Tooltip>
  </div>
);

export default TalentProfile;
