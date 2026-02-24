import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type WorkHistory = Database["public"]["Tables"]["talent_work_history"]["Row"];
type Education = Database["public"]["Tables"]["talent_education"]["Row"];
type Certification = Database["public"]["Tables"]["talent_certifications"]["Row"];
type Reference = Database["public"]["Tables"]["talent_references"]["Row"];
type Vetting = Database["public"]["Tables"]["talent_vetting"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Clock, Briefcase, FileText, Mail, GraduationCap, Award, Users,
  Download, AlertCircle, Pencil, X, Save, Lock, Copy, Check, ChevronDown,
  ChevronUp, Shield, Send, Loader2, Plus, Trash2, MessageSquare, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type SectionKey = "basic_info" | "professional" | "skills" | "work_history" | "education" | "certifications" | "documents" | "references";

const SECTION_LABELS: Record<SectionKey, string> = {
  basic_info: "Basic Information",
  professional: "Professional Summary",
  skills: "Skills & Tools",
  work_history: "Work History",
  education: "Education",
  certifications: "Certifications",
  documents: "Documents",
  references: "References",
};

// ── Main Component ─────────────────────────────────────────────────────────────

const TalentProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<SectionKey>>(new Set());
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

      const { data: talent, error } = await supabase
        .from("talents")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      let workRes = { data: [] as WorkHistory[] };
      let eduRes = { data: [] as Education[] };
      let certRes = { data: [] as Certification[] };
      let refRes = { data: [] as Reference[] };
      let vettingRes = { data: [] as Vetting[] };
      let managerRes = { data: null as ProfileRow | null };

      if (talent) {
        [workRes, eduRes, certRes, refRes, vettingRes] = await Promise.all([
          supabase.from("talent_work_history").select("*").eq("talent_id", talent.id).order("start_date", { ascending: false }),
          supabase.from("talent_education").select("*").eq("talent_id", talent.id).order("start_year", { ascending: false }),
          supabase.from("talent_certifications").select("*").eq("talent_id", talent.id),
          supabase.from("talent_references").select("*").eq("talent_id", talent.id),
          supabase.from("talent_vetting").select("*").eq("talent_id", talent.id).order("created_at", { ascending: false }).limit(1),
        ]);

        if (talent.assigned_manager) {
          managerRes = await supabase.from("profiles").select("*").eq("user_id", talent.assigned_manager).maybeSingle();
        }
      }

      return {
        talent,
        workHistory: workRes.data || [],
        education: eduRes.data || [],
        certifications: certRes.data || [],
        references: refRes.data || [],
        vetting: vettingRes.data?.[0] || null,
        manager: managerRes.data || null,
      };
    },
    enabled: !!user?.id,
  });

  // ── Derived Data ───────────────────────────────────────────────────────────

  const talent: any = data?.talent || {
    first_name: user?.user_metadata?.first_name || "",
    last_name: user?.user_metadata?.last_name || "",
    email: user?.email || "",
    onboarding_completed: false,
    vetting_status: "unvetted",
    primary_role: "", country: "", timezone: "",
    years_of_experience: null, availability: "",
    talent_id: "", secondary_skills: [], tools_familiar_with: [],
    languages_spoken: [], cv_url: "", phone: "",
    preferred_working_hours: "", profile_change_status: "clean",
    changed_sections: [], government_id_url: "", proof_of_address_url: "",
  };

  const workHistory = data?.workHistory || [];
  const education = data?.education || [];
  const certifications = data?.certifications || [];
  const references = data?.references || [];
  const vetting = data?.vetting || null;
  const manager = data?.manager || null;

  const changedSections: string[] = talent.changed_sections || [];
  const profileStatus: string = talent.profile_change_status || "clean";
  const isSubmitted = profileStatus === "submitted";

  // ── Section Editing Forms ──────────────────────────────────────────────────

  // Basic Info form state
  const [basicForm, setBasicForm] = useState<any>(null);
  // Professional form state
  const [proForm, setProForm] = useState<any>(null);
  // Skills form state
  const [skillsForm, setSkillsForm] = useState<any>(null);
  const [newSkill, setNewSkill] = useState("");
  const [newTool, setNewTool] = useState("");
  const [newLang, setNewLang] = useState("");
  // Education form state
  const [eduForm, setEduForm] = useState<any>({
    institution_name: "", education_level: "", field_of_study: "", start_year: "", end_year: "", is_current: false
  });
  // Certifications form state
  const [certForm, setCertForm] = useState<any>({
    certification_name: "", issuing_organization: "", year_obtained: "", credential_url: ""
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const startEditing = (section: SectionKey) => {
    if (isSubmitted) {
      toast.error("Profile is currently under review. Edits are locked.");
      return;
    }
    setEditingSection(section);
    if (section === "basic_info") {
      setBasicForm({ country: talent.country || "", timezone: talent.timezone || "", preferred_working_hours: talent.preferred_working_hours || "" });
    } else if (section === "professional") {
      setProForm({ primary_role: talent.primary_role || "", availability: talent.availability || "", years_of_experience: talent.years_of_experience || "" });
    } else if (section === "skills") {
      setSkillsForm({
        secondary_skills: [...(talent.secondary_skills || [])],
        tools_familiar_with: [...(talent.tools_familiar_with || [])],
        languages_spoken: [...(talent.languages_spoken || [])],
      });
    }
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setBasicForm(null);
    setProForm(null);
    setSkillsForm(null);
    setEduForm({ institution_name: "", education_level: "", field_of_study: "", start_year: "", end_year: "", is_current: false });
    setCertForm({ certification_name: "", issuing_organization: "", year_obtained: "", credential_url: "" });
  };

  // ── Save Section ───────────────────────────────────────────────────────────

  const markSectionChanged = async (section: SectionKey) => {
    const current = talent.changed_sections || [];
    if (!current.includes(section)) {
      await supabase
        .from("talents" as any)
        .update({
          changed_sections: [...current, section],
          profile_change_status: "draft",
        } as any)
        .eq("id", talent.id);
    }
  };

  const saveBasicInfo = async () => {
    try {
      setSavingSection(true);
      const { error } = await supabase
        .from("talents")
        .update({
          country: basicForm.country,
          timezone: basicForm.timezone,
          preferred_working_hours: basicForm.preferred_working_hours,
        } as any)
        .eq("id", talent.id);
      if (error) throw error;
      await markSectionChanged("basic_info");
      toast.success("Basic info saved as draft");
      cancelEditing();
      refetch();
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setSavingSection(false);
    }
  };

  const saveProfessional = async () => {
    try {
      setSavingSection(true);
      const { error } = await supabase
        .from("talents")
        .update({
          primary_role: proForm.primary_role,
          availability: proForm.availability,
          years_of_experience: proForm.years_of_experience ? Number(proForm.years_of_experience) : null,
        } as any)
        .eq("id", talent.id);
      if (error) throw error;
      await markSectionChanged("professional");
      toast.success("Professional details saved as draft");
      cancelEditing();
      refetch();
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setSavingSection(false);
    }
  };

  const saveSkills = async () => {
    try {
      setSavingSection(true);
      const { error } = await supabase
        .from("talents")
        .update({
          secondary_skills: skillsForm.secondary_skills,
          tools_familiar_with: skillsForm.tools_familiar_with,
          languages_spoken: skillsForm.languages_spoken,
        } as any)
        .eq("id", talent.id);
      if (error) throw error;
      await markSectionChanged("skills");
      toast.success("Skills saved as draft");
      cancelEditing();
      refetch();
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setSavingSection(false);
    }
  };

  // ── New Section Handlers ───────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cv') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setUploadingDoc(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${talent.id}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("talent-documents").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("talent-documents").getPublicUrl(filePath);
      
      const { error: dbError } = await supabase.from("talents").update({ cv_url: publicUrl } as any).eq("id", talent.id);
      if (dbError) throw dbError;

      await markSectionChanged("documents");
      toast.success("CV updated as draft");
      refetch();
    } catch (err: any) {
      toast.error("Failed to upload: " + err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const saveEducation = async () => {
    if (!eduForm.institution_name || !eduForm.education_level) return toast.error("Missing required fields");
    try {
      setSavingSection(true);
      const { error } = await supabase.from("talent_education").insert({
        talent_id: talent.id,
        ...eduForm
      } as any);
      if (error) throw error;
      await markSectionChanged("education");
      toast.success("Education added as draft");
      cancelEditing();
      refetch();
    } catch (e: any) {
      toast.error("Failed to add education: " + e.message);
    } finally {
      setSavingSection(false);
    }
  };

  const deleteEducation = async (id: string) => {
    try {
      const { error } = await supabase.from("talent_education").delete().eq("id", id);
      if (error) throw error;
      await markSectionChanged("education");
      toast.success("Education removed");
      refetch();
    } catch (e: any) {
      toast.error("Failed to delete: " + e.message);
    }
  };

  const saveCertification = async () => {
    if (!certForm.certification_name || !certForm.issuing_organization) return toast.error("Missing required fields");
    try {
      setSavingSection(true);
      const { error } = await supabase.from("talent_certifications").insert({
        talent_id: talent.id,
        ...certForm
      } as any);
      if (error) throw error;
      await markSectionChanged("certifications");
      toast.success("Certification added as draft");
      cancelEditing();
      refetch();
    } catch (e: any) {
      toast.error("Failed to add certification: " + e.message);
    } finally {
      setSavingSection(false);
    }
  };

  const deleteCertification = async (id: string) => {
    try {
      const { error } = await supabase.from("talent_certifications").delete().eq("id", id);
      if (error) throw error;
      await markSectionChanged("certifications");
      toast.success("Certification removed");
      refetch();
    } catch (e: any) {
      toast.error("Failed to delete: " + e.message);
    }
  };

  // ── Re-verification Submission ─────────────────────────────────────────────

  const submitForReview = async () => {
    try {
      setSubmittingReview(true);
      // Create review record
      const { error: reviewError } = await supabase
        .from("talent_profile_reviews" as any)
        .insert({
          talent_id: talent.id,
          changed_sections: changedSections,
          talent_message: reviewMessage || null,
        } as any);
      if (reviewError) throw reviewError;

      // Update talent status
      const { error: updateError } = await supabase
        .from("talents" as any)
        .update({
          profile_change_status: "submitted",
          vetting_status: "in_review",
        } as any)
        .eq("id", talent.id);
      if (updateError) throw updateError;

      toast.success("Profile submitted for review");
      setReviewDrawerOpen(false);
      setReviewMessage("");
      refetch();
    } catch (e: any) {
      toast.error("Failed to submit: " + e.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const toggleCollapse = (key: SectionKey) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getSectionBadge = (key: SectionKey) => {
    if (isSubmitted && changedSections.includes(key))
      return <Badge className="text-[9px] bg-blue-50 text-blue-700 border-blue-100 border">Pending Review</Badge>;
    if (changedSections.includes(key))
      return <Badge className="text-[9px] bg-amber-50 text-amber-700 border-amber-100 border">Draft</Badge>;
    return <Badge className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-100 border">Approved</Badge>;
  };

  const getVettingBadge = () => {
    if (talent.vetting_status === "fully_vetted" || vetting?.status === "approved")
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 border text-xs font-semibold">Verified</Badge>;
    if (talent.vetting_status === "in_review" || isSubmitted)
      return <Badge className="bg-blue-50 text-blue-700 border-blue-100 border text-xs font-semibold">In Review</Badge>;
    if (vetting?.status === "rejected")
      return <Badge className="bg-red-50 text-red-700 border-red-100 border text-xs font-semibold">Rejected</Badge>;
    if (vetting?.status === "needs_clarification" || talent.vetting_status === "changes_requested")
      return <Badge className="bg-amber-50 text-amber-700 border-amber-100 border text-xs font-semibold">Changes Requested</Badge>;
    return <Badge className="bg-gray-100 text-gray-600 border-gray-200 border text-xs font-semibold">Pending Review</Badge>;
  };

  const copyTalentId = () => {
    navigator.clipboard.writeText(talent.talent_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const LockedField = ({ label, value }: { label: string; value: string }) => (
    <div className="space-y-1">
      <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <Lock className="h-3 w-3" /> {label}
      </Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-10 px-3 flex items-center rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-500 cursor-not-allowed">
            {value || "—"}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Contact support to update verified information.</TooltipContent>
      </Tooltip>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-6 w-6 text-gray-300 animate-spin" />
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Loading profile…</span>
      </div>
    );
  }

  // Incomplete profile redirect to onboarding
  if (!talent.onboarding_completed) {
    return (
      <div className="max-w-xl mx-auto pt-20 text-center space-y-6 font-[Inter]">
        <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto">
          <FileText className="h-7 w-7 text-gray-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Complete your profile first</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
            You need to complete onboarding before you can manage your professional profile.
          </p>
        </div>
        <Link to="/talent/onboarding">
          <Button className="bg-gray-900 text-white hover:bg-gray-800 h-11 px-6">
            Complete Onboarding
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-20 pt-6 font-[Inter]">

      {/* ── Profile Status Banner ─────────────────────────────────────────────── */}
      {profileStatus === "draft" && changedSections.length > 0 && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-amber-50 border border-amber-100 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">You have unsaved profile changes</p>
              <p className="text-xs text-amber-700 mt-0.5">Submit for review to reflect changes publicly.</p>
            </div>
          </div>
          <Button size="sm" className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shrink-0" onClick={() => setReviewDrawerOpen(true)}>
            <Send className="h-3 w-3" /> Submit for Review
          </Button>
        </div>
      )}

      {isSubmitted && (
        <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Profile under review</p>
            <p className="text-xs text-blue-700 mt-0.5">Your profile changes are being reviewed by our team. Edits are locked until review is complete.</p>
          </div>
        </div>
      )}

      {profileStatus === "rejected" && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-5 py-4">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-900">Profile changes were rejected</p>
            <p className="text-xs text-red-700 mt-0.5">Please review admin feedback and make corrections.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6">

        {/* ══════════════ LEFT / CENTER — PROFILE CONTENT ══════════════ */}
        <div className="flex-1 space-y-5 min-w-0">

          {/* ── Profile Header ──────────────────────────────────────────── */}
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-7">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="h-18 w-18 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400 shrink-0" style={{ width: 72, height: 72 }}>
                    {talent.first_name?.[0]}{talent.last_name?.[0]}
                  </div>
                  <div className="pt-0.5">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                      {talent.first_name} {talent.last_name}
                    </h1>
                    <p className="text-gray-500 font-medium capitalize mt-1 text-sm">
                      {talent.primary_role ? talent.primary_role.replace(/_/g, " ") : "Role not set"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {talent.talent_id && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={copyTalentId}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-[11px] font-mono font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                              {copiedId ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                              {talent.talent_id}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">Copy Talent ID</TooltipContent>
                        </Tooltip>
                      )}
                      {getVettingBadge()}
                      {talent.overall_skill_level && (
                        <Badge variant="outline" className="text-[10px] font-semibold capitalize border-gray-200">{talent.overall_skill_level}</Badge>
                      )}
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge className="bg-gray-50 text-gray-500 border-gray-200 border text-[10px] font-semibold gap-1">
                            <Shield className="h-3 w-3" /> Identity Verified
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">Legal name and identity documents are locked.</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {changedSections.length > 0 && profileStatus === "draft" && (
                    <Button size="sm" className="h-9 text-xs gap-1.5 bg-gray-900 text-white hover:bg-gray-800" onClick={() => setReviewDrawerOpen(true)}>
                      <Send className="h-3.5 w-3.5" /> Submit for Review
                    </Button>
                  )}
                </div>
              </div>

              {/* Sub-info row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 pt-6 border-t border-gray-100 text-sm text-gray-600">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" />{talent.country || "Location not set"} {talent.timezone && `(${talent.timezone})`}</div>
                <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-gray-400" />{talent.years_of_experience ? `${talent.years_of_experience} years exp.` : "Experience not set"}</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /><span className="capitalize">{talent.availability ? talent.availability.replace(/_/g, " ") : "Availability not set"}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* ── Section: Basic Info ──────────────────────────────────────── */}
          <SectionCard
            sectionKey="basic_info"
            icon={<Mail className="h-4 w-4" />}
            badge={getSectionBadge("basic_info")}
            collapsed={collapsedSections.has("basic_info")}
            onToggle={() => toggleCollapse("basic_info")}
            editing={editingSection === "basic_info"}
            onEdit={() => startEditing("basic_info")}
            locked={isSubmitted}
          >
            {editingSection === "basic_info" && basicForm ? (
              <div className="space-y-4">
                <LockedField label="Email" value={talent.email} />
                <LockedField label="Phone" value={talent.phone || ""} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Country / Location</Label>
                    <Input value={basicForm.country} onChange={(e) => setBasicForm({ ...basicForm, country: e.target.value })} className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Timezone</Label>
                    <Input value={basicForm.timezone} onChange={(e) => setBasicForm({ ...basicForm, timezone: e.target.value })} className="h-10" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Preferred Working Hours</Label>
                  <Input value={basicForm.preferred_working_hours} onChange={(e) => setBasicForm({ ...basicForm, preferred_working_hours: e.target.value })} className="h-10" placeholder="e.g. 9am - 5pm WAT" />
                </div>
                <EditFooter onSave={saveBasicInfo} onCancel={cancelEditing} saving={savingSection} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <InfoItem label="Email" value={talent.email} locked />
                <InfoItem label="Phone" value={talent.phone} locked />
                <InfoItem label="Country" value={talent.country} />
                <InfoItem label="Timezone" value={talent.timezone} />
                <InfoItem label="Working Hours" value={talent.preferred_working_hours} />
              </div>
            )}
          </SectionCard>

          {/* ── Section: Professional Summary ───────────────────────────── */}
          <SectionCard
            sectionKey="professional"
            icon={<Briefcase className="h-4 w-4" />}
            badge={getSectionBadge("professional")}
            collapsed={collapsedSections.has("professional")}
            onToggle={() => toggleCollapse("professional")}
            editing={editingSection === "professional"}
            onEdit={() => startEditing("professional")}
            locked={isSubmitted}
          >
            {editingSection === "professional" && proForm ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Primary Role</Label>
                  <Input value={proForm.primary_role} onChange={(e) => setProForm({ ...proForm, primary_role: e.target.value })} className="h-10" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Availability</Label>
                    <Select value={proForm.availability} onValueChange={(v) => setProForm({ ...proForm, availability: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Years of Experience</Label>
                    <Input type="number" value={proForm.years_of_experience} onChange={(e) => setProForm({ ...proForm, years_of_experience: e.target.value })} className="h-10" />
                  </div>
                </div>
                <EditFooter onSave={saveProfessional} onCancel={cancelEditing} saving={savingSection} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <InfoItem label="Primary Role" value={talent.primary_role?.replace(/_/g, " ")} />
                <InfoItem label="Availability" value={talent.availability?.replace(/_/g, " ")} />
                <InfoItem label="Years of Experience" value={talent.years_of_experience ? `${talent.years_of_experience} years` : null} />
              </div>
            )}
          </SectionCard>

          {/* ── Section: Skills & Tools ──────────────────────────────────── */}
          <SectionCard
            sectionKey="skills"
            icon={<Award className="h-4 w-4" />}
            badge={getSectionBadge("skills")}
            collapsed={collapsedSections.has("skills")}
            onToggle={() => toggleCollapse("skills")}
            editing={editingSection === "skills"}
            onEdit={() => startEditing("skills")}
            locked={isSubmitted}
          >
            {editingSection === "skills" && skillsForm ? (
              <div className="space-y-5">
                <ChipEditor label="Core Skills" items={skillsForm.secondary_skills} newValue={newSkill} onNewChange={setNewSkill}
                  onAdd={() => { if (newSkill.trim()) { setSkillsForm({ ...skillsForm, secondary_skills: [...skillsForm.secondary_skills, newSkill.trim()] }); setNewSkill(""); } }}
                  onRemove={(i) => setSkillsForm({ ...skillsForm, secondary_skills: skillsForm.secondary_skills.filter((_: any, idx: number) => idx !== i) })}
                />
                <ChipEditor label="Software & Tools" items={skillsForm.tools_familiar_with} newValue={newTool} onNewChange={setNewTool}
                  onAdd={() => { if (newTool.trim()) { setSkillsForm({ ...skillsForm, tools_familiar_with: [...skillsForm.tools_familiar_with, newTool.trim()] }); setNewTool(""); } }}
                  onRemove={(i) => setSkillsForm({ ...skillsForm, tools_familiar_with: skillsForm.tools_familiar_with.filter((_: any, idx: number) => idx !== i) })}
                />
                <ChipEditor label="Languages" items={skillsForm.languages_spoken} newValue={newLang} onNewChange={setNewLang}
                  onAdd={() => { if (newLang.trim()) { setSkillsForm({ ...skillsForm, languages_spoken: [...skillsForm.languages_spoken, newLang.trim()] }); setNewLang(""); } }}
                  onRemove={(i) => setSkillsForm({ ...skillsForm, languages_spoken: skillsForm.languages_spoken.filter((_: any, idx: number) => idx !== i) })}
                />
                <EditFooter onSave={saveSkills} onCancel={cancelEditing} saving={savingSection} />
              </div>
            ) : (
              <div className="space-y-4">
                <ChipGroup label="Core Skills" items={talent.secondary_skills} />
                <ChipGroup label="Software & Tools" items={talent.tools_familiar_with} variant="outline" />
                <ChipGroup label="Languages" items={talent.languages_spoken} variant="text" />
              </div>
            )}
          </SectionCard>

          {/* ── Section: Work History ────────────────────────────────────── */}
          <SectionCard
            sectionKey="work_history"
            icon={<Briefcase className="h-4 w-4" />}
            badge={getSectionBadge("work_history")}
            collapsed={collapsedSections.has("work_history")}
            onToggle={() => toggleCollapse("work_history")}
            editing={false}
            onEdit={() => {}}
            locked={isSubmitted}
          >
            {workHistory.length > 0 ? (
              <div className="space-y-6">
                {workHistory.map((work, i) => (
                  <div key={work.id} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-gray-900" />
                    {i !== workHistory.length - 1 && <div className="absolute left-[3px] top-4 bottom-[-28px] w-px bg-gray-100" />}
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1.5">
                      <h4 className="text-sm font-bold text-gray-900">{work.role_title}</h4>
                      <span className="text-xs text-gray-400 font-medium">{work.start_date} – {work.is_current ? "Present" : work.end_date}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">{work.company_name}</p>
                    {work.role_description && <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{work.role_description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No work history added.</p>
            )}
          </SectionCard>

          {/* ── Section: Education ─────────────────────────────────────── */}
          <SectionCard
            sectionKey="education"
            icon={<GraduationCap className="h-4 w-4" />}
            badge={getSectionBadge("education")}
            collapsed={collapsedSections.has("education")}
            onToggle={() => toggleCollapse("education")}
            editing={editingSection === "education"}
            onEdit={() => startEditing("education")}
            locked={isSubmitted}
          >
            {editingSection === "education" ? (
              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Institution Name</Label>
                  <Input value={eduForm.institution_name} onChange={(e) => setEduForm({ ...eduForm, institution_name: e.target.value })} className="h-10 bg-white" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Degree/Level</Label>
                    <Input value={eduForm.education_level} onChange={(e) => setEduForm({ ...eduForm, education_level: e.target.value })} className="h-10 bg-white" placeholder="BSc, Master's, etc." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Field of Study</Label>
                    <Input value={eduForm.field_of_study} onChange={(e) => setEduForm({ ...eduForm, field_of_study: e.target.value })} className="h-10 bg-white" placeholder="Computer Science" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Start Year</Label>
                    <Input type="number" value={eduForm.start_year} onChange={(e) => setEduForm({ ...eduForm, start_year: e.target.value })} className="h-10 bg-white" placeholder="YYYY" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">End Year</Label>
                    <Input type="number" value={eduForm.end_year} onChange={(e) => setEduForm({ ...eduForm, end_year: e.target.value })} className="h-10 bg-white" placeholder="YYYY" disabled={eduForm.is_current} />
                  </div>
                </div>
                <EditFooter onSave={saveEducation} onCancel={cancelEditing} saving={savingSection} />
              </div>
            ) : null}

            {education.length > 0 ? (
              <div className="grid gap-3 pt-3">
                {education.map((edu) => (
                  <div key={edu.id} className="flex items-start justify-between p-4 rounded-lg bg-gray-50/50 border border-gray-100 group">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{edu.institution_name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{edu.education_level}{edu.field_of_study ? ` — ${edu.field_of_study}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded border border-gray-200 whitespace-nowrap">
                        {edu.start_year} – {edu.is_current ? "Present" : edu.end_year}
                      </span>
                      {!isSubmitted && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteEducation(edu.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !editingSection && <p className="text-sm text-gray-400 italic mt-2">No education history added.</p>
            )}
          </SectionCard>

          {/* ── Section: Certifications ────────────────────────────────── */}
          <SectionCard
            sectionKey="certifications"
            icon={<Award className="h-4 w-4" />}
            badge={getSectionBadge("certifications")}
            collapsed={collapsedSections.has("certifications")}
            onToggle={() => toggleCollapse("certifications")}
            editing={editingSection === "certifications"}
            onEdit={() => startEditing("certifications")}
            locked={isSubmitted}
          >
            {editingSection === "certifications" ? (
              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Certification Name</Label>
                    <Input value={certForm.certification_name} onChange={(e) => setCertForm({ ...certForm, certification_name: e.target.value })} className="h-10 bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Issuing Organization</Label>
                    <Input value={certForm.issuing_organization} onChange={(e) => setCertForm({ ...certForm, issuing_organization: e.target.value })} className="h-10 bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Year Obtained</Label>
                    <Input type="number" value={certForm.year_obtained} onChange={(e) => setCertForm({ ...certForm, year_obtained: e.target.value })} className="h-10 bg-white" placeholder="YYYY" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Credential URL</Label>
                    <Input type="url" value={certForm.credential_url} onChange={(e) => setCertForm({ ...certForm, credential_url: e.target.value })} className="h-10 bg-white" placeholder="https://..." />
                  </div>
                </div>
                <EditFooter onSave={saveCertification} onCancel={cancelEditing} saving={savingSection} />
              </div>
            ) : null}

            {certifications.length > 0 ? (
              <div className="space-y-3 pt-3">
                {certifications.map((cert) => (
                  <div key={cert.id} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0 flex items-start justify-between group">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{cert.certification_name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{cert.issuing_organization}</p>
                        </div>
                        {cert.credential_url && (
                          <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline font-semibold flex items-center gap-1 shrink-0">
                            <ExternalLink className="h-3 w-3" /> Verify
                          </a>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1.5 block">Issued: {cert.year_obtained}</span>
                    </div>
                    {!isSubmitted && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 ml-2 mt-1" onClick={() => deleteCertification(cert.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              !editingSection && <p className="text-sm text-gray-400 italic mt-2">No certifications added.</p>
            )}
          </SectionCard>

          {/* ── Section: Documents ─────────────────────────────────────── */}
          <SectionCard
            sectionKey="documents"
            icon={<FileText className="h-4 w-4" />}
            badge={getSectionBadge("documents")}
            collapsed={collapsedSections.has("documents")}
            onToggle={() => toggleCollapse("documents")}
            editing={editingSection === "documents"}
            onEdit={() => startEditing("documents")}
            locked={isSubmitted}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 border border-gray-100 relative">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">CV / Resume</span>
                </div>
                <div className="flex items-center gap-3">
                  {talent.cv_url && (
                    <a href={talent.cv_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                      <Download className="h-3 w-3" /> View
                    </a>
                  )}
                  {editingSection === "documents" && (
                    <div className="relative">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" disabled={uploadingDoc}>
                        {uploadingDoc ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />} 
                        {talent.cv_url ? "Replace CV" : "Upload CV"}
                      </Button>
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        onChange={(e) => handleFileUpload(e, 'cv')}
                        disabled={uploadingDoc}
                      />
                    </div>
                  )}
                  {!talent.cv_url && editingSection !== "documents" && (
                    <span className="text-xs text-gray-400">Not uploaded</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 border border-gray-100 opacity-60">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500">Government ID</span>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-400 gap-1"><Shield className="h-3 w-3" /> Locked</Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">Identity documents cannot be changed after verification.</TooltipContent>
                </Tooltip>
              </div>
              
              {editingSection === "documents" && (
                 <div className="flex justify-end pt-2">
                   <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500" onClick={cancelEditing}>Done</Button>
                 </div>
              )}
            </div>
          </SectionCard>

          {/* ── Section: References ──────────────────────────────────────── */}
          <SectionCard
            sectionKey="references"
            icon={<Users className="h-4 w-4" />}
            badge={getSectionBadge("references")}
            collapsed={collapsedSections.has("references")}
            onToggle={() => toggleCollapse("references")}
            editing={false}
            onEdit={() => {}}
            locked={isSubmitted}
          >
            {references.length > 0 ? (
              <div className="space-y-3">
                {references.map((ref) => (
                  <div key={ref.id} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{ref.reference_name}</h4>
                      {ref.verification_status === "approved" && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 border text-[9px]">Verified</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{ref.relationship}</p>
                    {ref.email && (
                      <a href={`mailto:${ref.email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1.5">
                        <Mail className="h-3 w-3" /> {ref.email}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No references added.</p>
            )}
          </SectionCard>
        </div>

        {/* ══════════════ RIGHT PANEL — STATUS & SUPPORT ══════════════ */}
        <div className="w-full xl:w-[320px] shrink-0 space-y-4 xl:sticky xl:top-6 xl:self-start">

          {/* Vetting Status */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vetting Status</h3>
              <div className="flex items-center gap-2">
                {getVettingBadge()}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {talent.vetting_status === "fully_vetted"
                  ? "Your profile has been verified and is visible to clients."
                  : talent.vetting_status === "in_review" || isSubmitted
                  ? "Our team is reviewing your profile. You'll be notified of the outcome."
                  : talent.vetting_status === "changes_requested"
                  ? "Our vetting team has requested changes to your profile."
                  : "Your profile is pending initial review by our vetting team."}
              </p>
            </CardContent>
          </Card>

          {/* Talent Manager */}
          {manager && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Talent Manager</h3>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                    {manager.first_name?.[0]}{manager.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{manager.first_name} {manager.last_name || ""}</p>
                    <p className="text-[10px] text-gray-400">{manager.email}</p>
                  </div>
                </div>
                <Link to="/talent/support/new">
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5 mt-1">
                    <MessageSquare className="h-3 w-3" /> Contact Manager
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Profile Change Status */}
          {changedSections.length > 0 && (
            <Card className={cn("border shadow-sm", isSubmitted ? "bg-blue-50/30 border-blue-100" : "bg-amber-50/30 border-amber-100")}>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {isSubmitted ? "Under Review" : "Pending Changes"}
                </h3>
                <div className="space-y-1.5">
                  {changedSections.map((s: string) => (
                    <div key={s} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className={cn("h-1.5 w-1.5 rounded-full", isSubmitted ? "bg-blue-500" : "bg-amber-500")} />
                      {SECTION_LABELS[s as SectionKey] || s}
                    </div>
                  ))}
                </div>
                {!isSubmitted && (
                  <Button size="sm" className="w-full h-9 text-xs gap-1.5 bg-gray-900 text-white hover:bg-gray-800 mt-1" onClick={() => setReviewDrawerOpen(true)}>
                    <Send className="h-3 w-3" /> Submit for Review
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Re-verification Drawer ──────────────────────────────────────────── */}
      <Sheet open={reviewDrawerOpen} onOpenChange={setReviewDrawerOpen}>
        <SheetContent className="sm:max-w-md flex flex-col h-full p-0">
          <SheetHeader className="p-6 border-b border-gray-100">
            <SheetTitle className="text-lg font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
              <Send className="h-5 w-5" /> Submit for Review
            </SheetTitle>
            <SheetDescription className="text-xs font-medium text-gray-400">
              Your profile changes will be reviewed by our vetting team before going live.
            </SheetDescription>
          </SheetHeader>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <section className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pl-1">Changed Sections</span>
              <div className="space-y-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                {changedSections.map((s: string) => (
                  <div key={s} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {SECTION_LABELS[s as SectionKey] || s}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pl-1">Message to Admin (Optional)</span>
              <Textarea
                placeholder="Add any context about the changes you've made…"
                className="min-h-[120px] resize-none border-gray-100 bg-gray-50/30 text-sm p-4"
                value={reviewMessage}
                onChange={(e) => setReviewMessage(e.target.value)}
              />
            </section>
          </div>

          <SheetFooter className="p-6 border-t border-gray-100 bg-gray-50/50">
            <Button
              className="w-full h-12 font-black uppercase text-[11px] tracking-widest gap-2"
              disabled={changedSections.length === 0 || submittingReview}
              onClick={submitForReview}
            >
              {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><Send className="h-4 w-4" /> Submit Changes for Review</>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  sectionKey: SectionKey;
  icon: React.ReactNode;
  badge: React.ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  editing: boolean;
  onEdit: () => void;
  locked: boolean;
  children: React.ReactNode;
}

const SectionCard = ({ sectionKey, icon, badge, collapsed, onToggle, editing, onEdit, locked, children }: SectionCardProps) => (
  <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
    <div
      className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-400">{icon}</div>
        <h3 className="text-sm font-bold text-gray-900">{SECTION_LABELS[sectionKey]}</h3>
        {badge}
      </div>
      <div className="flex items-center gap-2">
        {!editing && !locked && onEdit.toString() !== "() => {}" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-gray-400 hover:text-gray-700 gap-1"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            <Pencil className="h-3 w-3" /> Edit
          </Button>
        )}
        {collapsed ? <ChevronDown className="h-4 w-4 text-gray-300" /> : <ChevronUp className="h-4 w-4 text-gray-300" />}
      </div>
    </div>
    {!collapsed && (
      <CardContent className="px-6 pb-6 pt-0">
        {children}
      </CardContent>
    )}
  </Card>
);

const InfoItem = ({ label, value, locked }: { label: string; value?: string | null; locked?: boolean }) => (
  <div className="space-y-1">
    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
      {locked && <Lock className="h-2.5 w-2.5" />} {label}
    </span>
    <p className={cn("text-sm", value ? "text-gray-900" : "text-gray-300 italic")}>
      {value ? <span className="capitalize">{value}</span> : "Not set"}
    </p>
  </div>
);

const EditFooter = ({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) => (
  <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
    <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-500" onClick={onCancel}>Cancel</Button>
    <Button size="sm" className="h-8 text-xs gap-1.5 bg-gray-900 text-white hover:bg-gray-800" onClick={onSave} disabled={saving}>
      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
      Save Draft
    </Button>
  </div>
);

const ChipGroup = ({ label, items, variant }: { label: string; items?: string[] | null; variant?: "outline" | "text" }) => {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</h4>
      {variant === "text" ? (
        <p className="text-sm text-gray-700">{items.join(", ")}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <Badge key={i} variant={variant === "outline" ? "outline" : "secondary"} className="text-xs font-normal bg-gray-50 text-gray-700 border-gray-200">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const ChipEditor = ({ label, items, newValue, onNewChange, onAdd, onRemove }: {
  label: string; items: string[]; newValue: string; onNewChange: (v: string) => void; onAdd: () => void; onRemove: (i: number) => void;
}) => (
  <div className="space-y-2">
    <Label className="text-xs font-semibold text-gray-700">{label}</Label>
    <div className="flex flex-wrap gap-1.5">
      {items.map((item: string, i: number) => (
        <Badge key={i} variant="secondary" className="text-xs font-normal bg-gray-100 text-gray-700 border-gray-200 gap-1 pr-1">
          {item}
          <button onClick={() => onRemove(i)} className="ml-0.5 p-0.5 rounded hover:bg-gray-200 transition-colors">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
    <div className="flex gap-2">
      <Input
        placeholder={`Add ${label.toLowerCase()}…`}
        value={newValue}
        onChange={(e) => onNewChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
        className="h-9 text-sm"
      />
      <Button variant="outline" size="sm" className="h-9 px-3" onClick={onAdd}><Plus className="h-3.5 w-3.5" /></Button>
    </div>
  </div>
);

export default TalentProfile;
