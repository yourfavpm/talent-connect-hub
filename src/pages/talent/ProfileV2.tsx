import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2, AlertCircle, Send, User, MapPin, Briefcase, Mail, Save, FileText, CheckCircle2, Cloud, ChevronRight
} from "lucide-react";
import clsx from "clsx";
import {
  OnboardFormValues, onboardSchema, getSectionData, STEPS,
  BasicInfoForm, ProfessionalDetailsForm, WorkHistoryForm,
  EducationForm, CertificationsForm, ReferencesForm,
  DocumentsForm
} from "@/components/talent/onboarding/OnboardingShared";
import { ProfileStatusBanner } from "@/components/talent/ProfileStatusBanner";

// ── Types ────────────────────────────────────────────────────────────────

interface V2Profile {
  id: string;
  status: string;
  progress_percent: number;
  vetting_level: number | null;
  vetting_level_text: string | null;
  locked_onboarding: boolean;
  visible_to_clients: boolean;
  talent_manager_admin_id: string | null;
  revet_request_required: boolean;
  user_id: string;
}

interface V2Section {
  id: string;
  section_key: string;
  status: string;
  data: Record<string, unknown>;
  requested_changes: { note?: string; fields?: string[] } | Record<string, never>;
  updated_at: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  draft:              { bg: "bg-slate-100",  text: "text-slate-600",  label: "Draft" },
  submitted:          { bg: "bg-blue-100",   text: "text-blue-700",   label: "Submitted" },
  in_review:          { bg: "bg-amber-100",  text: "text-amber-700",  label: "In Review" },
  changes_requested:  { bg: "bg-red-100",    text: "text-red-700",    label: "Changes Requested" },
  resubmitted:        { bg: "bg-blue-100",   text: "text-blue-700",   label: "Resubmitted" },
  vetted:             { bg: "bg-emerald-100", text: "text-emerald-700", label: "Verified" },
  revett_required:    { bg: "bg-rose-100",   text: "text-rose-700",   label: "Re-vetting Required" },
  revett_pending:     { bg: "bg-orange-100", text: "text-orange-700", label: "Re-vetting Pending" },
  not_started:        { bg: "bg-slate-100",  text: "text-slate-500",  label: "Not Started" },
  in_progress:        { bg: "bg-blue-50",    text: "text-blue-600",   label: "In Progress" },
  approved:           { bg: "bg-emerald-100", text: "text-emerald-700", label: "Approved" },
};

const ProfileV2 = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<V2Profile | null>(null);
  const [sections, setSections] = useState<V2Section[]>([]);
  const [managerData, setManagerData] = useState<{full_name: string; email: string} | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const hydrated = useRef(false);

  const methods = useForm<OnboardFormValues>({
    resolver: zodResolver(onboardSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "", country: "", timezone: "",
      primaryRole: "", secondarySkills: [], yearsOfExperience: "", availability: "",
      roleCategory: "", toolsFamiliarWith: [], languagesSpoken: [], industryFocus: [],
      functionalAreas: [], governmentIdUrl: "", cvUrl: "", proofOfAddressUrl: "",
      portfolioUrl: "", headline: "", shortBio: "",
      workHistory: [], education: [], certifications: [], references: [],
    },
  });

  const { watch, setValue, reset, getValues } = methods;
  const formData = watch();

  // ── Load data ──────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: p } = await supabase
        .from("v2_talent_profiles").select("*").eq("user_id", user.id).maybeSingle();
      
      if (p) {
        setProfile(p as unknown as V2Profile);
        
        if (p.talent_manager_admin_id) {
          const { data: mgr } = await supabase
            .from("admin_users")
            .select("full_name, email")
            .eq("id", (p as any).talent_manager_admin_id)
            .maybeSingle();
          if (mgr) {
            setManagerData({
              full_name: mgr.full_name || "Admin",
              email: mgr.email || ""
            });
          }
        }

        const { data: s } = await supabase
          .from("v2_profile_sections").select("*").eq("user_id", user.id);

        if (s && s.length > 0) {
          const mapped = (s as any[]).map(sec => ({
            ...sec,
            data: (sec.data || {}) as Record<string, unknown>,
            requested_changes: (sec.requested_changes || {}) as V2Section["requested_changes"],
          }));
          setSections(mapped as V2Section[]);

          const merged: Record<string, unknown> = {};
          mapped.forEach(sec => {
            if (sec.data) Object.assign(merged, sec.data);
          });
          reset(prev => ({ ...prev, ...merged } as OnboardFormValues));
        }
      }
    } catch (err) {
      console.error("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, reset]);

  useEffect(() => {
    if (user && !hydrated.current) {
      fetchData();
      hydrated.current = true;
    }
  }, [user, fetchData]);

  // ── Editability Rules ──────────────────────────────────────────────

  const canEditSection = (sectionKey: string) => {
    if (!profile) return false;
    const status = profile.status;
    const sectionStatus = sections.find(s => s.section_key === sectionKey)?.status;

    // A) BEFORE SUBMIT (status=draft/in_progress)
    if (status === "draft" || status === "in_progress") return true;

    // B) AFTER SUBMIT FOR VETTING (status=submitted/in_review)
    if (status === "submitted" || status === "in_review" || status === "resubmitted") return false;

    // C) WHEN ADMIN REQUESTS CHANGES (status=changes_requested)
    if (status === "changes_requested") {
      return sectionStatus === "changes_requested";
    }

    // D) AFTER FULLY VETTED (status=vetted)
    if (["vetted", "revett_required", "revett_pending"].includes(status)) {
      if (sectionKey === "basic_info") return false; // Identity locked
      return true;
    }

    return false;
  };

  // ── Handlers ───────────────────────────────────────────────────────

  const handleSaveSection = async (sectionKey: string) => {
    if (!user || !profile) return;
    setSavingSection(sectionKey);
    try {
      const stepIndex = STEPS.find(s => s.key === sectionKey)?.id || 1;
      const payload = getSectionData(stepIndex, getValues());
      
      const isPostVetted = ["vetted", "revett_required", "revett_pending"].includes(profile.status);
      
      if (isPostVetted) {
        const { error } = await supabase.rpc("v2_update_section_post_vet", {
          p_user_id: user.id,
          p_section_key: sectionKey,
          p_data: payload as any
        } as any);
        if (error) throw error;
        toast({ title: "Changes Saved", description: "Your profile has been updated." });
      } else {
        const { error } = await supabase.rpc("v2_save_section_data", {
          p_section_key: sectionKey,
          p_data: payload as any,
        } as any);
        if (error) throw error;
        toast({ title: "Section Updated" });
      }
      fetchData();
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingSection(null);
    }
  };

  const handleResubmitChanges = async () => {
    if (!user) return;
    setResubmitting(true);
    try {
      const sectionKeys = sections
        .filter(s => s.status === "changes_requested")
        .map(s => s.section_key);

      if (sectionKeys.length === 0) {
        toast({ title: "No sections to resubmit", variant: "destructive" });
        return;
      }

      const { error } = await supabase.rpc("v2_talent_resubmit_sections", {
        p_section_keys: sectionKeys as any,
      } as any);
      if (error) throw error;
      toast({ title: "Changes Resubmitted!", description: "An admin will review your profile shortly." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Resubmit Failed", description: err.message, variant: "destructive" });
    } finally {
      setResubmitting(false);
    }
  };

  const handleRequestRevetting = async () => {
    if (!user) return;
    setResubmitting(true);
    try {
      const { error } = await supabase.rpc("v2_talent_request_revetting", {
        p_user_id: user.id as any
      } as any);
      if (error) throw error;
      toast({ title: "Re-vetting Requested!", description: "Your changes have been submitted for review." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Request Failed", description: err.message, variant: "destructive" });
    } finally {
      setResubmitting(false);
    }
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, field: keyof OnboardFormValues) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingFields(prev => ({ ...prev, [field]: true }));
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${user.id}/${field}/${fileName}`;
      const { error } = await supabase.storage.from("talent_documents").upload(filePath, file);
      if (error) throw error;
      setValue(field, filePath, { shouldDirty: true });
      toast({ title: "File Uploaded" });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingFields(prev => ({ ...prev, [field]: false }));
    }
  }, [user, setValue, toast]);

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-8 text-center text-slate-500">No profile found. Please complete onboarding.</div>;
  }

  const statusInfo = STATUS_COLORS[profile.status] || STATUS_COLORS.draft;
  const hasChangesRequested = sections.some(s => s.status === "changes_requested");

  return (
    <FormProvider {...methods}>
      <div className="w-full max-w-none space-y-8 pb-32">
        
        {/* ── Page Title (Desktop Only) ────────────────────────────── */}
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Professional Profile</h1>
          <p className="text-[14px] text-slate-500 mt-1">Manage your public presence and vetting credentials.</p>
        </div>
        
        {/* ── SHARED STATUS BANNER ───────────────────────────────────── */}
        <ProfileStatusBanner 
          status={profile.status}
          progressPercent={profile.progress_percent}
          requestedSectionsCount={sections.filter(s => s.status === "changes_requested").length}
          vettingLevelText={profile.vetting_level_text}
          managerName={managerData ? `${managerData.first_name} ${managerData.last_name}` : null}
          onResubmit={handleResubmitChanges}
          onRequestRevetting={handleRequestRevetting}
          isResubmitting={resubmitting}
        />

        {/* ── 2 COLUMN LAYOUT ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-10 items-start">
          
          {/* LEFT PANEL: Sticky Summary */}
          <div className="w-full shrink-0 xl:sticky xl:top-8 space-y-6">
            <Card className="border-slate-100 shadow-sm overflow-hidden bg-white rounded-2xl">
              <div className="h-28 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-50" />
                <Avatar className="h-20 w-20 border-4 border-white shadow-xl bg-white">
                  <AvatarFallback className="bg-slate-50 text-xl font-bold text-slate-400">
                    {(formData.firstName?.[0] || "") + (formData.lastName?.[0] || "")}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <CardContent className="p-6 pt-6">
                <div className="text-center space-y-1.5 mb-8">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    {formData.firstName} {formData.lastName}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-slate-400 text-[13px] font-medium">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                      <Briefcase className="h-3 w-3" />
                      {formData.primaryRole || "Professional"}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                      <MapPin className="h-3 w-3" />
                      {formData.country || "Remote"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Verification Status</span>
                    <Badge className={clsx(statusInfo.bg, statusInfo.text, "font-bold text-[10px] px-2 py-0.5 shadow-none border-none")}>{statusInfo.label}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Vetting Level</span>
                    <span className="text-sm font-bold text-slate-700">{profile.vetting_level_text || "Unranked"}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Profile Completion</span>
                      <span className="text-sm font-bold text-slate-900">{profile.progress_percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div className="h-full bg-slate-900 transition-all duration-700 ease-out" style={{ width: `${profile.progress_percent}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
              
              {managerData && (
                <div 
                  className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => managerData.email && window.open(`mailto:${managerData.email}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-bold">
                      {managerData.full_name?.[0] || "A"}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase text-slate-400 tracking-tighter">Assigned Manager</p>
                      <p className="text-[12px] font-bold text-slate-700 leading-tight">{managerData.full_name}</p>
                      {managerData.email && (
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">{managerData.email}</p>
                      )}
                    </div>
                  </div>
                  <Mail className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                </div>
              )}
            </Card>

            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl md:block hidden">
              <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Tips for Vetting
              </h4>
              <p className="text-[12px] text-blue-900/70 font-medium leading-relaxed">
                Ensure your LinkedIn URL is updated and your CV clearly states your technical achievements. This speeds up the review process.
              </p>
            </div>
          </div>

          {/* MAIN PANEL: Overhauled Section Engine */}
          <div className="flex-1 space-y-6">
            {STEPS.map((step) => {
              const section = sections.find(s => s.section_key === step.key);
              const status = section?.status || "not_started";
              const SColor = STATUS_COLORS[status] || STATUS_COLORS.not_started;
              const isEditable = canEditSection(step.key);
              const isSaving = savingSection === step.key;
              const adminNote = section?.requested_changes?.note;
              const isExpanded = expandedSections[step.key] || false;

              return (
                <div key={step.key} className={clsx(
                  "bg-white border transition-all duration-200",
                  isExpanded ? "rounded-2xl border-slate-200 shadow-md ring-1 ring-slate-900/5" : "rounded-xl border-slate-100 shadow-sm hover:border-slate-200"
                )}>
                  {/* Collapsible Header */}
                  <div 
                    onClick={() => {
                        if (window.innerWidth < 768) setExpandedSections(p => ({...p, [step.key]: !p[step.key]}));
                    }}
                    className={clsx(
                      "flex items-center justify-between p-5 md:p-6 cursor-pointer md:cursor-default",
                      isExpanded && "border-b border-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={clsx(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                        isExpanded ? "bg-slate-900 border-slate-900 text-white" : "bg-slate-50 border-slate-100 text-slate-400"
                      )}>
                        {step.id}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-0.5">
                          <h3 className="text-[15px] font-bold text-slate-900 truncate">{step.title}</h3>
                          <Badge className={clsx(SColor.bg, SColor.text, "shadow-none font-bold text-[8px] uppercase tracking-tighter px-1.5 py-0 border-none md:block hidden")}>
                            {SColor.label}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-slate-400 font-medium md:hidden">
                          {isExpanded ? "Tap to collapse" : "Tap to view/edit"}
                        </p>
                        {isEditable && !isExpanded && (
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight hidden md:block">Interactive Session</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isEditable && (
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveSection(step.key);
                          }} 
                          disabled={isSaving}
                          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 h-9 px-4 rounded-lg hidden md:flex"
                        >
                          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Save
                        </Button>
                      )}
                      <ChevronRight className={clsx(
                        "h-5 w-5 text-slate-300 transition-transform md:hidden",
                        isExpanded && "rotate-90"
                      )} />
                    </div>
                  </div>

                  {/* Desktop always visible, Mobile collapsible */}
                  <CardContent className={clsx(
                    "p-6",
                    !isExpanded && "hidden md:block" // Hidden on mobile if not expanded, always visible on desktop
                  )}>
                    {adminNote && status === "changes_requested" && (
                      <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1.5">Action Required</p>
                          <p className="text-[13px] text-red-900 font-medium leading-relaxed">{adminNote}</p>
                        </div>
                      </div>
                    )}

                    <div className={clsx(!isEditable && "pointer-events-none opacity-80")}>
                      {step.key === "basic_info" && <BasicInfoForm disabled={!isEditable} />}
                      {step.key === "professional_details" && <ProfessionalDetailsForm disabled={!isEditable} />}
                      {step.key === "work_history" && <WorkHistoryForm disabled={!isEditable} />}
                      {step.key === "documents" && (
                        <div className="space-y-8">
                          <DocumentsForm disabled={!isEditable} uploadingFields={uploadingFields} onUpload={handleFileUpload} />
                          
                          {/* Slimmer Cloud Document Rows */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {["cvUrl", "governmentIdUrl", "proofOfAddressUrl", "portfolioUrl"].map(field => {
                               const path = formData[field as keyof OnboardFormValues] as string;
                               if (!path) return null;
                               const label = field.replace("Url", "").replace(/([A-Z])/g, " $1").trim();
                               return (
                                 <div key={field} className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl group transition-all hover:bg-white hover:shadow-sm">
                                   <div className="flex items-center gap-3">
                                     <div className="h-9 w-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                       <Cloud className="h-4 w-4" />
                                     </div>
                                     <div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-0.5">Verified</p>
                                        <span className="text-[13px] font-bold text-slate-700 capitalize">{label}</span>
                                     </div>
                                   </div>
                                   <Button variant="ghost" size="sm" asChild className="h-8 text-slate-500 hover:text-slate-900">
                                      <a href={field === "portfolioUrl" ? (path.startsWith('http') ? path : `https://${path}`) : supabase.storage.from("talent_documents").getPublicUrl(path).data.publicUrl} target="_blank" rel="noreferrer">
                                        Open
                                      </a>
                                   </Button>
                                 </div>
                               );
                            })}
                          </div>
                        </div>
                      )}
                      {step.key === "education" && <EducationForm disabled={!isEditable} />}
                      {step.key === "certifications" && <CertificationsForm disabled={!isEditable} />}
                      {step.key === "references" && <ReferencesForm disabled={!isEditable} />}
                    </div>

                    {/* Mobile Only Save Button */}
                    {isEditable && (
                      <div className="mt-8 md:hidden">
                        <Button 
                          onClick={() => handleSaveSection(step.key)} 
                          disabled={isSaving}
                          className="w-full bg-slate-900 text-white h-11 rounded-xl text-[13px] font-bold shadow-lg shadow-slate-900/10"
                        >
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Update Section
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default ProfileV2;
