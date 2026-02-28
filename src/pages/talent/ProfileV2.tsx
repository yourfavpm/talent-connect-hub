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
  Loader2, AlertCircle, Send, User, MapPin, Briefcase, Mail, Save, FileText, CheckCircle2, Cloud
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
  const [managerData, setManagerData] = useState<{first_name: string; last_name: string} | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
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
          const { data: mgr } = await supabase.from("profiles").select("first_name, last_name").eq("id", (p as any).talent_manager_admin_id).maybeSingle() as { data: any | null };
          if (mgr) setManagerData(mgr);
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
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        
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
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* LEFT PANEL: Sticky Summary */}
          <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-8 flex flex-col gap-6">
            <Card className="border-slate-200 overflow-hidden shadow-sm">
              <div className="h-24 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative" />
              <CardContent className="p-6 pt-0 relative">
                <div className="flex justify-center -mt-12 mb-4">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
                    <AvatarFallback className="bg-slate-100 text-xl font-bold text-slate-700 uppercase">
                      {(formData.firstName?.[0] || "") + (formData.lastName?.[0] || "")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="text-center space-y-1.5 mb-6">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                    {formData.firstName} {formData.lastName}
                  </h2>
                  <div className="flex items-center justify-center gap-1.5 text-slate-500 text-sm">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[200px]">{formData.primaryRole || "Professional"}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-slate-500 text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{formData.country || "Remote"}</span>
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Status</span>
                    <Badge className={clsx(statusInfo.bg, statusInfo.text, "font-bold shadow-none")}>{statusInfo.label}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Level</span>
                    <Badge variant="outline" className="font-bold border-slate-300 text-slate-700">
                      {profile.vetting_level_text || "Pending"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Completion</span>
                    <span className="text-sm font-bold text-slate-700">{profile.progress_percent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${profile.progress_percent}%` }} />
                  </div>
                </div>
              </CardContent>
              
              {managerData && (
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400 mb-0.5">Talent Manager</p>
                    <p className="text-sm font-medium text-slate-700">{managerData.first_name} {managerData.last_name}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-full">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* MAIN PANEL: Form Engine */}
          <div className="flex-1 space-y-8">
            {STEPS.map((step) => {
              const section = sections.find(s => s.section_key === step.key);
              const status = section?.status || "not_started";
              const SColor = STATUS_COLORS[status] || STATUS_COLORS.not_started;
              const isEditable = canEditSection(step.key);
              const isSaving = savingSection === step.key;
              const adminNote = section?.requested_changes?.note;

              return (
                <Card key={step.key} className={clsx("border-slate-200 shadow-sm transition-all", isEditable && "ring-1 ring-emerald-500/20")}>
                  <CardHeader className="border-b border-slate-100 bg-white flex flex-row items-center justify-between py-5 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg font-bold text-slate-900">{step.title}</CardTitle>
                        <Badge className={clsx(SColor.bg, SColor.text, "shadow-none font-semibold text-[10px] uppercase tracking-wider")}>
                          {SColor.label}
                        </Badge>
                      </div>
                      {isEditable && (
                        <p className="text-xs text-emerald-600 font-medium">Editing enabled</p>
                      )}
                    </div>
                    {isEditable && (
                      <Button 
                        size="sm" 
                        onClick={() => handleSaveSection(step.key)} 
                        disabled={isSaving}
                        className="bg-slate-900 hover:bg-slate-800 text-white gap-2 h-9 px-4"
                      >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save Changes
                      </Button>
                    )}
                  </CardHeader>

                  <CardContent className="p-6">
                    {adminNote && status === "changes_requested" && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Feedback from Admin</p>
                          <p className="text-sm text-red-800 leading-relaxed font-medium">{adminNote}</p>
                        </div>
                      </div>
                    )}

                    <div className={clsx(!isEditable && "pointer-events-none")}>
                      {step.key === "basic_info" && <BasicInfoForm disabled={!isEditable} />}
                      {step.key === "professional_details" && <ProfessionalDetailsForm disabled={!isEditable} />}
                      {step.key === "work_history" && <WorkHistoryForm disabled={!isEditable} />}
                      {step.key === "documents" && (
                        <div className="space-y-6">
                          <DocumentsForm disabled={!isEditable} uploadingFields={uploadingFields} onUpload={handleFileUpload} />
                          {/* Display current documents */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {["cvUrl", "governmentIdUrl", "proofOfAddressUrl"].map(field => {
                               const path = formData[field as keyof OnboardFormValues] as string;
                               if (!path) return null;
                               const label = field.replace("Url", "").replace(/([A-Z])/g, " $1").trim();
                               return (
                                 <div key={field} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                   <div className="flex items-center gap-3">
                                     <div className="h-10 w-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                                       <FileText className="h-5 w-5" />
                                     </div>
                                     <span className="text-sm font-semibold text-slate-700 capitalize">{label}</span>
                                   </div>
                                   <Button variant="ghost" size="sm" asChild>
                                      <a href={supabase.storage.from("talent_documents").getPublicUrl(path).data.publicUrl} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-900">
                                        View
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default ProfileV2;
