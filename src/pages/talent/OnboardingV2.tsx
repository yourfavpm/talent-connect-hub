import {
  OnboardFormValues, onboardSchema, getSectionData, STEPS,
  BasicInfoForm, ProfessionalDetailsForm, WorkHistoryForm,
  EducationForm, CertificationsForm, ReferencesForm,
  DocumentsForm, OB_INPUT_CLASS
} from "@/components/talent/onboarding/OnboardingShared";

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Loader2, Save, Cloud, Menu, X, UploadCloud,
} from "lucide-react";
import clsx from "clsx";

interface V2Profile {
  id: string;
  user_id: string;
  talent_id: string | null;
  status: string;
  vetting_level: number | null;
  submitted_at: string | null;
  vetted_at: string | null;
  progress_percent: number;
  locked_onboarding: boolean;
  visible_to_clients: boolean;
  created_at: string;
  updated_at: string;
}

interface V2Section {
  id: string;
  user_id: string;
  section_key: string;
  status: string;
  data: any;
  last_saved_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
}

// ── Main Component ─────────────────────────────────────────────────────────

const OnboardingV2 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, string>>({});
  const [progressPercent, setProgressPercent] = useState(0);
  const hydrated = useRef(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

  const methods = useForm<OnboardFormValues>({
    resolver: zodResolver(onboardSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "", country: "", timezone: "",
      primaryRole: "", secondarySkills: [], yearsOfExperience: "", availability: "",
      roleCategory: "", toolsFamiliarWith: [], languagesSpoken: [], industryFocus: [],
      functionalAreas: [], governmentIdUrl: "", cvUrl: "", proofOfAddressUrl: "",
      portfolioUrl: "", headline: "", shortBio: "",
      workHistory: [{ id: Date.now().toString(), companyName: "", roleTitle: "", roleDescription: "", startDate: "", endDate: "", isCurrent: false }],
      education: [{ id: Date.now().toString(), institutionName: "", degree: "", startYear: "", endYear: "", isCurrent: false }],
      certifications: [{ id: Date.now().toString(), certificationName: "", issuer: "", yearObtained: "", fileUrl: "" }],
      references: [{ id: Date.now().toString(), name: "", company: "", email: "", phone: "" }],
    },
  });

  const { watch, setValue, reset, formState: { errors } } = methods;
  const formData = watch();

  // ── Hydrate from DB ────────────────────────────────────────────────────

  useEffect(() => {
    if (!user || hydrated.current) return;
    const load = async () => {
      try {
        // Ensure V2 profile exists
        await supabase.from("v2_talent_profiles").upsert({ user_id: user.id }, { onConflict: "user_id" });

        const { data: profile } = await supabase
          .from("v2_talent_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single() as { data: V2Profile | null };

        if (profile?.locked_onboarding && profile.status !== "changes_requested") {
          navigate("/talent/profile");
          return;
        }
        if (profile) {
          setIsLocked(profile.locked_onboarding);
          setProgressPercent(profile.progress_percent);
        }

        // Load sections and hydrate form
        const { data: sections } = await supabase
          .from("v2_profile_sections")
          .select("*")
          .eq("user_id", user.id) as { data: V2Section[] | null };

        if (sections && sections.length > 0) {
          const merged: Record<string, unknown> = {};
          const statuses: Record<string, string> = {};
          sections.forEach(s => {
            if (s.data && typeof s.data === "object") Object.assign(merged, s.data);
            statuses[s.section_key] = s.status;
          });
          setSectionStatuses(statuses);
          // Hydrate form with DB data, preserving defaults for missing fields
          reset(prev => ({ ...prev, ...merged } as OnboardFormValues));
        }

        // Pre-fill email from auth if not in sections
        if (user.email) {
          setValue("email", user.email);
        }

        hydrated.current = true;
      } catch (err) {
        console.error("V2 hydrate error:", err);
      }
    };
    load();
  }, [user, navigate, reset, setValue]);

  // ── Save current step ──────────────────────────────────────────────────

  const saveCurrentStep = useCallback(async () => {
    if (!user) return;
    const sectionKey = STEPS[currentStep - 1]?.key;
    if (!sectionKey) return;

    setSaving(true);
    try {
      const payload = getSectionData(currentStep, formData);
      const { data: result, error } = await supabase.rpc("v2_save_section_data", {
        p_section_key: sectionKey,
        p_data: payload as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      }) as { data: { progress_percent: number } | null; error: any };
      
      if (error) throw error;
      // Update local progress from RPC response
      if (result && typeof result === "object" && "progress_percent" in result) {
        setProgressPercent(result.progress_percent);
      }
      setSectionStatuses(prev => ({ ...prev, [sectionKey]: "in_progress" }));
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [user, currentStep, formData, toast]);

  // ── Step navigation ────────────────────────────────────────────────────

  const goToStep = useCallback(async (targetStep: number) => {
    await saveCurrentStep();
    setCurrentStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [saveCurrentStep]);

  const nextStep = useCallback(async () => {
    if (currentStep >= STEPS.length) return;
    await goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const prevStep = useCallback(async () => {
    if (currentStep <= 1) return;
    await goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  // ── Final Submit ───────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Save current step first
      await saveCurrentStep();
      const { error } = await supabase.rpc("v2_submit_profile");
      if (error) throw error;
      setIsLocked(true);
      toast({ title: "Profile Submitted!", description: "Your profile has been sent for vetting review." });
      navigate("/talent/dashboard");
    } catch (err: any) {
      toast({ title: "Submit Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [user, saveCurrentStep, toast, navigate]);

  // ── File upload ────────────────────────────────────────────────────────

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

  // ── Render helpers ─────────────────────────────────────────────────────

  const stepStatus = (key: string) => sectionStatuses[key] || "not_started";

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return <BasicInfoForm />;
      case 2: return <ProfessionalDetailsForm />;
      case 3: return <WorkHistoryForm />;
      case 4: return <DocumentsForm uploadingFields={uploadingFields} onUpload={handleFileUpload} />;
      case 5: return <EducationForm />;
      case 6: return <CertificationsForm />;
      case 7: return <ReferencesForm />;
      default: return null;
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────

  if (!user) return null;

  const step = STEPS[currentStep - 1];
  const isLastStep = currentStep === STEPS.length;

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Mobile nav toggle */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex min-h-screen">
          {/* ── Sidebar stepper ──────────────────────────────────────── */}
          <aside className={clsx(
            "w-64 bg-white border-r border-slate-100 p-5 space-y-1.5 shrink-0",
            "fixed inset-y-0 left-0 z-40 lg:relative lg:z-auto",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            "transition-transform duration-200"
          )}>
            <div className="mb-5 px-1">
              <h2 className="text-base font-semibold text-slate-800 tracking-tight">Onboarding</h2>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5 font-medium uppercase tracking-wider">
                  <span>Profile Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>

            {STEPS.map(s => {
              const status = stepStatus(s.key);
              const isActive = s.id === currentStep;
              return (
                  <div key={s.id}
                  onClick={() => goToStep(s.id)}
                  className={clsx(
                    "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[12px] transition-all",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm font-medium"
                      : "text-slate-400 hover:bg-slate-50 font-light"
                  )}
                >
                  <div className={clsx(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transitions-colors",
                    isActive ? "bg-white text-slate-900"
                      : status === "approved" ? "bg-emerald-100 text-emerald-600"
                      : ["in_progress", "submitted", "resubmitted"].includes(status) ? "bg-blue-100 text-blue-600"
                      : "bg-slate-50 text-slate-300 border border-slate-100"
                  )}>
                    {status === "approved" ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.id}
                  </div>
                  <span className="truncate">{s.title}</span>
                </div>
              );
            })}
          </aside>

          {/* ── Main content ─────────────────────────────────────────── */}
          <main className="flex-1 p-4 lg:p-10 max-w-2xl mx-auto w-full">
            <Card className="bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] border-slate-100/50 rounded-xl overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="min-w-0 pr-4">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-0.5">Step {currentStep} of {STEPS.length}</p>
                    <h1 className="text-xl font-semibold text-slate-900 mt-0.5 truncate">{step?.title}</h1>
                  </div>
                  {saving && (
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-blue-50/50 text-blue-500 text-[9px] font-medium animate-fade-in border border-blue-100/30">
                      <Cloud className="h-2.5 w-2.5 animate-pulse" /> Auto-saving
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {renderStepContent()}
                </div>

                {/* ── Footer buttons ───────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-8 pt-6 border-t border-slate-50 gap-3">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep <= 1 || saving}
                    className="h-9 gap-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 text-[12px] font-medium px-4"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </Button>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {!isLastStep && (
                      <Button
                        variant="ghost"
                        onClick={nextStep}
                        className="h-9 text-slate-400 hover:text-slate-900 text-[11px] font-medium px-3"
                      >
                        Skip Section
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={saveCurrentStep}
                      disabled={saving}
                      className="h-9 gap-1.5 border-slate-100 text-slate-500 hover:bg-slate-50 text-[11px] font-medium px-4"
                    >
                      <Save className="h-3.5 w-3.5" /> Save
                    </Button>
                    
                    {isLastStep && (
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting || saving}
                        className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold px-4 shadow-sm"
                      >
                        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Submit
                      </Button>
                    )}

                    {!isLastStep && (
                      <Button
                        onClick={nextStep}
                        disabled={saving}
                        className="h-9 gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold px-4 shadow-sm"
                      >
                        Continue <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </FormProvider>
  );
};

export default OnboardingV2;
