import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingGuard } from "@/lib/onboarding-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  FileText,
  Loader2,
  UploadCloud,
  MessageSquare,
  Save,
  Cloud,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";
import { RoleSelector } from "@/components/talent/onboarding/RoleSelector";
import { TimezoneSelector } from "@/components/talent/onboarding/TimezoneSelector";
import { sendVettingSubmittedEmail } from "@/lib/email/triggers";

// ── Constants ──────────────────────────────────────────────────────────────────

export const OB_INPUT_CLASS = "h-12 rounded-lg border border-slate-200 bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm placeholder:text-slate-400";

// ── Primitive field components (defined OUTSIDE the main component to prevent
//    React remounting them on every render, which would lose input focus) ────────

export const FieldGroup = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </Label>
    {children}
  </div>
);

export const CardBlock = ({ children, onDelete }: { children: React.ReactNode; onDelete?: () => void }) => (
  <div className="relative p-6 bg-white border border-slate-100 rounded-xl group">
    {onDelete && (
      <button onClick={onDelete} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
        <Trash2 className="h-4 w-4" />
      </button>
    )}
    {children}
  </div>
);

export const AddButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} className="w-full h-14 border border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-700 hover:border-slate-400 transition-colors flex items-center justify-center gap-2">
    <Plus className="h-4 w-4" /> {label}
  </button>
);

interface FileUploadRowProps {
  label: string;
  hint: string;
  accept: string;
  uploaded: boolean;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileUploadRow = ({ label, hint, accept, uploaded, uploading, onUpload }: FileUploadRowProps) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
    <div>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
    </div>
    <div className="flex items-center gap-3">
      {uploaded && (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
          <CheckCircle2 className="h-3 w-3" /> Uploaded
        </Badge>
      )}
      <div className="relative">
        <Input type="file" accept={accept} onChange={onUpload} className="absolute inset-0 opacity-0 cursor-pointer w-28 h-9" disabled={uploading} />
        <Button type="button" variant="outline" size="sm" className="w-28 h-9 rounded-lg border-slate-200" disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UploadCloud className="h-3.5 w-3.5 mr-1.5" />{uploaded ? 'Replace' : 'Upload'}</>}
        </Button>
      </div>
    </div>
  </div>
);

// ── Constants ──────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Basic Information",    key: "basic_info" },
  { id: 2, title: "Professional Details", key: "professional_details" },
  { id: 3, title: "Work History",         key: "work_history" },
  { id: 4, title: "Documents",            key: "documents" },
  { id: 5, title: "Education",            key: "education" },
  { id: 6, title: "Certifications",       key: "certifications" },
  { id: 7, title: "References",           key: "references" },
  { id: 8, title: "Review & Submit",      key: "review" },
];

type SaveStatus = "idle" | "saving" | "saved" | "unsaved";

// ── Validation Schemas ──────────────────────────────────────────────────────────

const onboardSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(5, "Phone number is required"),
  country: z.string().min(2, "Country is required"),
  timezone: z.string().min(1, "Timezone is required"),
  primaryRole: z.string().min(1, "Primary role is required"),
  headline: z.string().min(10, "Headline must be at least 10 characters"),
  shortBio: z.string().min(20, "Bio must be at least 20 characters"),
  yearsOfExperience: z.string().min(1, "Experience is required"),
  availability: z.string().min(1, "Availability is required"),
  roleCategory: z.string().min(1, "Role category is required"),
  secondarySkills: z.array(z.string()).default([]),
  toolsFamiliarWith: z.array(z.string()).default([]),
  languagesSpoken: z.array(z.string()).default([]),
  industryFocus: z.array(z.string()).default([]),
  functionalAreas: z.array(z.string()).default([]),
  governmentIdUrl: z.string().optional(),
  cvUrl: z.string().optional(),
  proofOfAddressUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  workHistory: z.array(z.object({
    id: z.string(),
    companyName: z.string().min(2, "Company name required"),
    roleTitle: z.string().min(2, "Role title required"),
    roleDescription: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isCurrent: z.boolean().default(false),
  })).default([]),
  education: z.array(z.object({
    id: z.string(),
    institutionName: z.string().min(2, "Institution required"),
    degree: z.string().min(2, "Degree required"),
    startYear: z.string().optional(),
    endYear: z.string().optional(),
    isCurrent: z.boolean().default(false),
  })).default([]),
  certifications: z.array(z.object({
    id: z.string(),
    certificationName: z.string().min(2, "Certification name required"),
    issuer: z.string().optional(),
    yearObtained: z.string().optional(),
    fileUrl: z.string().optional(),
  })).default([]),
  references: z.array(z.object({
    id: z.string(),
    name: z.string().min(2, "Name required"),
    company: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
  })).default([]),
});

type OnboardFormValues = z.infer<typeof onboardSchema>;

// ── Main Component ─────────────────────────────────────────────────────────────

const TalentOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Guard: redirect if onboarding already complete
  useOnboardingGuard();
  interface Talent {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    primary_role?: string;
    role_category?: string;
    years_of_experience?: number;
    availability?: string;
    country?: string;
    timezone?: string;
    preferred_working_hours?: string;
    secondary_skills?: string[];
    tools_familiar_with?: string[];
    languages_spoken?: string[];
    cv_url?: string;
    government_id_url?: string;
    proof_of_address_url?: string;
    portfolio_url?: string;
    headline?: string;
    short_bio?: string;
    profile_completion?: number;
    current_step?: number;
    onboarding_status?: string;
    onboarding_completed?: boolean;
    vetting_status?: string;
    draft_profile?: any;
    assigned_manager?: string;
  }


  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [talentId, setTalentId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isLoaded = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const methods = useForm<OnboardFormValues>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "",
      timezone: "",
      primaryRole: "",
      secondarySkills: [],
      yearsOfExperience: "",
      availability: "",
      roleCategory: "",
      toolsFamiliarWith: [],
      languagesSpoken: [],
      governmentIdUrl: "",
      cvUrl: "",
      proofOfAddressUrl: "",
      portfolioUrl: "",
      headline: "",
      shortBio: "",
      industryFocus: [],
      functionalAreas: [],
      workHistory: [{ id: Date.now().toString(), companyName: "", roleTitle: "", roleDescription: "", startDate: "", endDate: "", isCurrent: false }],
      education: [{ id: Date.now().toString(), institutionName: "", degree: "", startYear: "", endYear: "", isCurrent: false }],
      certifications: [{ id: Date.now().toString(), certificationName: "", issuer: "", yearObtained: "", fileUrl: "" }],
      references: [{ id: Date.now().toString(), name: "", company: "", email: "", phone: "" }],
    }
  });

  const { control, handleSubmit: hookFormSubmit, reset, watch, setValue, formState: { errors, isDirty } } = methods;

  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({ control, name: "workHistory" });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: "education" });
  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control, name: "certifications" });
  const { fields: refFields, append: appendRef, remove: removeRef } = useFieldArray({ control, name: "references" });

  const formData = watch();
  const vettingSteps = useRef<any[]>([]);
  const changeRequests = useRef<any[]>([]);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

  // ── Load from DB + localStorage ───────────────────────────────────────────

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      try {
        let { data: profile } = await supabase.from("talent_profiles").select("*").eq("user_id", user.id).maybeSingle();
        
        if (!profile) {
          const { data: newProfile } = await supabase.from("talent_profiles").insert({ user_id: user.id }).select().single();
          profile = newProfile;
        }

        if (profile) {
          setTalentId(profile.id);
          const submitted = profile.status !== "DRAFT";
          setIsSubmitted(submitted);
          
          if (profile.locked_onboarding && currentStep < 8) { 
            navigate("/talent/profile"); 
            return; 
          }
          if (profile.current_step) setCurrentStep(profile.current_step);
        }
        const { data: sections } = await supabase.from("talent_profile_sections").select("*").eq("user_id", user.id);
        if (sections && sections.length > 0) {
          const mergedData: any = {};
          sections.forEach(s => Object.assign(mergedData, s.data));
          reset(prev => ({ ...prev, ...mergedData }));
        }
      } catch (error) { console.error("Error loading data:", error); }
    };
    loadProfileData();
  }, [user, navigate, reset, currentStep]);

  const calculateCompletion = useCallback((values: OnboardFormValues) => {
    let score = 0;
    const total = 7;

    if (values.firstName && values.lastName && values.phone && values.country && values.timezone) score++;
    if (values.primaryRole && values.yearsOfExperience && values.availability) score++;
    if (values.workHistory && values.workHistory.length > 0 && values.workHistory[0].companyName) score++;
    if (values.cvUrl && values.governmentIdUrl) score++;
    if (values.education && values.education.length > 0 && values.education[0].institutionName) score++;
    if (values.certifications && values.certifications.length > 0 && values.certifications[0].certificationName) score++;
    if (values.references && values.references.length > 0 && values.references[0].name) score++;

    return Math.round((score / total) * 100);
  }, []);

  const syncAllToDB = useCallback(async (values: OnboardFormValues = watch()) => {
    if (!user) return;
    setSaveStatus("saving");
    try {
      const completionPct = calculateCompletion(values);
      const sectionMapping: Record<number, string> = {
        1: "basic_info", 2: "professional_details", 3: "work_history",
        4: "documents", 5: "education", 6: "certifications", 7: "references"
      };
      const currentSectionKey = sectionMapping[currentStep];
      if (currentSectionKey) {
        const sectionData: any = {};
        if (currentStep === 1) {
          Object.assign(sectionData, { firstName: values.firstName, lastName: values.lastName, phone: values.phone, country: values.country, timezone: values.timezone, languagesSpoken: values.languagesSpoken });
        } else if (currentStep === 2) {
          Object.assign(sectionData, { 
            roleCategory: values.roleCategory, 
            primaryRole: values.primaryRole, 
            headline: values.headline, 
            shortBio: values.shortBio, 
            yearsOfExperience: values.yearsOfExperience, 
            availability: values.availability, 
            secondarySkills: values.secondarySkills, 
            toolsFamiliarWith: values.toolsFamiliarWith,
            industryFocus: values.industryFocus,
            functionalAreas: values.functionalAreas
          });
        } else if (currentStep === 3) {
          Object.assign(sectionData, { workHistory: values.workHistory });
        } else if (currentStep === 4) {
          Object.assign(sectionData, { cvUrl: values.cvUrl, governmentIdUrl: values.governmentIdUrl, proofOfAddressUrl: values.proofOfAddressUrl, portfolioUrl: values.portfolioUrl });
        } else if (currentStep === 5) {
          Object.assign(sectionData, { education: values.education });
        } else if (currentStep === 6) {
          Object.assign(sectionData, { certifications: values.certifications });
        } else if (currentStep === 7) {
          Object.assign(sectionData, { references: values.references });
        }
        const { error } = await (supabase.rpc as any)("update_section_data", { p_section_key: currentSectionKey, p_data: sectionData, p_completion_percent: completionPct });
        if (error) throw error;
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) { console.error("Sync error:", error); setSaveStatus("unsaved"); }
  }, [user, currentStep, watch, calculateCompletion]);

  const triggerDebouncedSync = useCallback(() => {
    setSaveStatus("unsaved");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => syncAllToDB(watch()), 1500);
  }, [syncAllToDB, watch]);

  const handleInputChange = useCallback((field: any, value: any) => {
    setValue(field, value, { shouldDirty: true, shouldTouch: true });
    triggerDebouncedSync();
  }, [setValue, triggerDebouncedSync]);

  const persistStep = useCallback(async (step: number) => {
    if (!user) return;
    await supabase.from("talent_profiles").update({ current_step: step } as any).eq("user_id", user.id);
  }, [user]);

  const nextStep = async () => {
    const isValid = await methods.trigger(STEPS[currentStep-1].key as any);
    if (!isValid) { toast({ title: "Validation Error", description: "Please fix error fields.", variant: "destructive" }); return; }
    setLoading(true);
    await syncAllToDB();
    const next = Math.min(currentStep + 1, STEPS.length);
    setCurrentStep(next);
    await persistStep(next);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = async () => {
    setLoading(true);
    await syncAllToDB();
    const prev = Math.max(currentStep - 1, 1);
    setCurrentStep(prev);
    await persistStep(prev);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveAndExit = async () => {
    setLoading(true);
    await syncAllToDB();
    setLoading(false);
    navigate("/talent/dashboard");
  };

  const onSubmit = async () => {
    setLoading(true);
    try {
      await syncAllToDB();
      const { error } = await (supabase.rpc as any)("submit_talent_onboarding");
      if (error) throw error;
      
      // 3. Send Notification Email
      try {
        if (formData.email) {
          await sendVettingSubmittedEmail({
            email: formData.email,
            firstName: formData.firstName || 'there',
          });
        }
      } catch (emailError) {
        console.error('Failed to send vetting submission email:', emailError);
      }

      setIsSubmitted(true);
      toast({ title: "Profile Submitted", description: "Your profile has been sent for vetting." });
    } catch (error: any) {
      toast({ title: "Submission Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = onSubmit;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: keyof OnboardFormValues) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploadingFields(prev => ({ ...prev, [field]: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${field}/${fileName}`;
      const { error } = await supabase.storage.from('talent_documents').upload(filePath, file);
      if (error) throw error;
      setValue(field, filePath, { shouldDirty: true });
      await syncAllToDB();
      toast({ title: "Uploaded" });
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setUploadingFields(prev => ({ ...prev, [field]: false })); }
  };



  // ── Feedback Banner ───────────────────────────────────────────────────────

  const renderFeedback = (stepKey: string) => {
    const step = vettingSteps.current.find(s => s.step_key === stepKey);
    const requests = changeRequests.current.filter(r => r.step_key === stepKey);

    if (!step || step.status !== 'changes_requested') return null;
    return (
      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700">Changes Required by Vetting Team</span>
        </div>
        {requests.length > 0 && (
          <div className="space-y-2 pl-6">
            {requests.map((req, idx) => (
              <div key={idx} className="flex gap-2 text-sm text-amber-800">
                <MessageSquare className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="italic">"{req.message}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Step Content ──────────────────────────────────────────────────────────

  const renderStepContent = () => {
    if (isSubmitted && currentStep === STEPS.length) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Submitted for Vetting</h2>
            <p className="text-slate-500 mt-2 max-w-sm">Your professional profile is now under review by our vetting team. We'll notify you once the review is complete.</p>
          </div>
          <Button onClick={() => navigate("/talent/dashboard")} className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg">
            Go to Dashboard
          </Button>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {renderFeedback('basic_info')}
            {/* Locked identity fields (prefilled from sign-up) */}
            <div className="grid sm:grid-cols-2 gap-5">
              <FieldGroup label="First Name">
                <Input className={clsx(OB_INPUT_CLASS, "opacity-60 cursor-not-allowed bg-slate-50")} value={formData.firstName} readOnly />
              </FieldGroup>
              <FieldGroup label="Last Name">
                <Input className={clsx(OB_INPUT_CLASS, "opacity-60 cursor-not-allowed bg-slate-50")} value={formData.lastName} readOnly />
              </FieldGroup>
            </div>
            <FieldGroup label="Email Address">
              <Input className={clsx(OB_INPUT_CLASS, "opacity-60 cursor-not-allowed bg-slate-50")} value={formData.email} readOnly />
            </FieldGroup>
            <FieldGroup label="Phone Number" required>
              <Input className={OB_INPUT_CLASS} value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
            </FieldGroup>
            <div className="grid sm:grid-cols-2 gap-5">
              <FieldGroup label="Country / Location" required>
                <Input className={OB_INPUT_CLASS} value={formData.country} onChange={(e) => handleInputChange("country", e.target.value)} placeholder="e.g. United Kingdom" />
              </FieldGroup>
              <FieldGroup label="Timezone" required>
                <TimezoneSelector value={formData.timezone} onChange={(v) => handleInputChange("timezone", v)} />
              </FieldGroup>
            </div>
            <FieldGroup label="Languages Spoken" required>
              <Input className={OB_INPUT_CLASS} value={formData.languagesSpoken.join(", ")} onChange={(e) => handleInputChange("languagesSpoken", e.target.value.split(",").map(s => s.trim()))} placeholder="e.g. English, French, Spanish" />
              <p className="text-[11px] text-slate-400 mt-1">Separate multiple languages with commas.</p>
            </FieldGroup>
          </div>
        );


      case 2:
        return (
          <div className="space-y-6">
            {renderFeedback('professional_details')}
            <RoleSelector 
              category={formData.roleCategory}
              onCategoryChange={(v) => handleInputChange("roleCategory", v)}
              value={formData.primaryRole} 
              onChange={(v) => handleInputChange("primaryRole", v)} 
            />
            <FieldGroup label="Professional Headline" required>
              <Input className={OB_INPUT_CLASS} value={formData.headline} onChange={(e) => handleInputChange("headline", e.target.value)} placeholder="e.g. Senior Operations Architect with 8+ Years Experience" />
              <p className="text-[11px] text-slate-400 mt-1">A concise summary of your professional expertise.</p>
            </FieldGroup>
            <FieldGroup label="Short Bio / Executive Summary" required>
              <Textarea className="rounded-lg border-slate-200 text-sm min-h-[120px] resize-none" value={formData.shortBio} onChange={(e) => handleInputChange("shortBio", e.target.value)} placeholder="Describe your career trajectory and key professional achievements..." />
              <p className="text-[11px] text-slate-400 mt-1">Provide a brief overview of your background and value proposition.</p>
            </FieldGroup>
            <div className="grid sm:grid-cols-2 gap-5">
              <FieldGroup label="Years of Experience" required>
                <Input className={OB_INPUT_CLASS} type="number" min="0" value={formData.yearsOfExperience} onChange={(e) => handleInputChange("yearsOfExperience", e.target.value)} placeholder="e.g. 7" />
              </FieldGroup>
              <FieldGroup label="Availability" required>
                <Select value={formData.availability} onValueChange={(v) => handleInputChange("availability", v)}>
                  <SelectTrigger className="h-12 rounded-lg border-slate-200">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-Time (40 hrs/wk)</SelectItem>
                    <SelectItem value="part_time">Part-Time (20 hrs/wk)</SelectItem>
                    <SelectItem value="contract">Hourly / Contract</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
            </div>
            <FieldGroup label="Core Skills">
              <Textarea className="rounded-lg border-slate-200 text-sm min-h-[80px] resize-none" value={formData.secondarySkills.join(", ")} onChange={(e) => handleInputChange("secondarySkills", e.target.value.split(",").map(s => s.trim()))} placeholder="e.g. Data Entry, Email Management, Scheduling" />
              <p className="text-[11px] text-slate-400 mt-1">Separate with commas.</p>
            </FieldGroup>
            <FieldGroup label="Tools & Software">
              <Textarea className="rounded-lg border-slate-200 text-sm min-h-[80px] resize-none" value={formData.toolsFamiliarWith.join(", ")} onChange={(e) => handleInputChange("toolsFamiliarWith", e.target.value.split(",").map(s => s.trim()))} placeholder="e.g. Asana, Slack, Notion, Salesforce" />
              <p className="text-[11px] text-slate-400 mt-1">Separate with commas.</p>
            </FieldGroup>
          </div>
        );


      case 3:
        return (
          <div className="space-y-5">
            {renderFeedback('work_history')}
            {workFields.map((field, idx) => (
              <CardBlock key={field.id} onDelete={workFields.length > 1 ? () => removeWork(idx) : undefined}>
                <div className="grid sm:grid-cols-2 gap-4 pr-6">
                  <FieldGroup label="Company" required>
                    <Input className={OB_INPUT_CLASS} value={formData.workHistory?.[idx]?.companyName} onChange={e => handleInputChange(`workHistory.${idx}.companyName`, e.target.value)} placeholder="e.g. Acme Corp" />
                  </FieldGroup>
                  <FieldGroup label="Role / Title" required>
                    <Input className={OB_INPUT_CLASS} value={formData.workHistory?.[idx]?.roleTitle} onChange={e => handleInputChange(`workHistory.${idx}.roleTitle`, e.target.value)} placeholder="e.g. Operations Manager" />
                  </FieldGroup>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Start Date">
                    <Input className={OB_INPUT_CLASS} type="month" value={formData.workHistory?.[idx]?.startDate} onChange={e => handleInputChange(`workHistory.${idx}.startDate`, e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="End Date">
                    <Input className={clsx(OB_INPUT_CLASS, formData.workHistory?.[idx]?.isCurrent && "opacity-40")} type="month" disabled={formData.workHistory?.[idx]?.isCurrent} value={formData.workHistory?.[idx]?.endDate} onChange={e => handleInputChange(`workHistory.${idx}.endDate`, e.target.value)} />
                  </FieldGroup>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Checkbox id={`current-${field.id}`} checked={formData.workHistory?.[idx]?.isCurrent} onCheckedChange={c => { 
                    handleInputChange(`workHistory.${idx}.isCurrent`, !!c);
                    if (c) handleInputChange(`workHistory.${idx}.endDate`, '');
                  }} />
                  <Label htmlFor={`current-${field.id}`} className="text-sm font-normal text-slate-600 cursor-pointer">I currently work here</Label>
                </div>
                <div className="mt-4">
                  <FieldGroup label="Description">
                    <Textarea className="rounded-lg border-slate-200 text-sm min-h-[90px] resize-none" placeholder="Key responsibilities and achievements..." value={formData.workHistory?.[idx]?.roleDescription} onChange={e => handleInputChange(`workHistory.${idx}.roleDescription`, e.target.value)} />
                  </FieldGroup>
                </div>
              </CardBlock>
            ))}
            <AddButton label="Add Experience" onClick={() => appendWork({ id: Date.now().toString(), companyName: "", roleTitle: "", roleDescription: "", startDate: "", endDate: "", isCurrent: false })} />
          </div>
        );


      case 4:
        return (
          <div className="space-y-5">
            {renderFeedback('documents')}
            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">Your documents are securely encrypted and stored privately for vetting purposes only.</p>
            </div>
            <div className="space-y-3">
              <FileUploadRow label="CV / Resume" hint="PDF or Word format" accept=".pdf,.doc,.docx" uploaded={!!formData.cvUrl} uploading={!!uploadingFields["cvUrl"]} onUpload={(e) => handleFileUpload(e, "cvUrl")} />
              <FileUploadRow label="Government ID" hint="Clear photo of Passport or National ID" accept="image/*,.pdf" uploaded={!!formData.governmentIdUrl} uploading={!!uploadingFields["governmentIdUrl"]} onUpload={(e) => handleFileUpload(e, "governmentIdUrl")} />
              <FileUploadRow label="Proof of Address" hint="Utility bill, bank statement, or rental agreement" accept="image/*,.pdf" uploaded={!!formData.proofOfAddressUrl} uploading={!!uploadingFields["proofOfAddressUrl"]} onUpload={(e) => handleFileUpload(e, "proofOfAddressUrl")} />
            </div>
            <div className="space-y-3">
              <FieldGroup label="Portfolio Link (Optional)">
                <Input className={OB_INPUT_CLASS} value={formData.portfolioUrl} onChange={e => handleInputChange("portfolioUrl", e.target.value)} placeholder="https://..." />
              </FieldGroup>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            {renderFeedback('education')}
            {eduFields.map((field, idx) => (
              <CardBlock key={field.id} onDelete={eduFields.length > 1 ? () => removeEdu(idx) : undefined}>
                <div className="grid sm:grid-cols-2 gap-4 pr-6">
                  <FieldGroup label="Institution" required>
                    <Input className={OB_INPUT_CLASS} value={formData.education?.[idx]?.institutionName} onChange={e => handleInputChange(`education.${idx}.institutionName`, e.target.value)} placeholder="e.g. University of Lagos" />
                  </FieldGroup>
                  <FieldGroup label="Degree & Field of Study" required>
                    <Input className={OB_INPUT_CLASS} value={formData.education?.[idx]?.degree} onChange={e => handleInputChange(`education.${idx}.degree`, e.target.value)} placeholder="e.g. B.Sc. Business Administration" />
                  </FieldGroup>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Start Year">
                    <Input className={OB_INPUT_CLASS} type="number" value={formData.education?.[idx]?.startYear} onChange={e => handleInputChange(`education.${idx}.startYear`, e.target.value)} placeholder="YYYY" />
                  </FieldGroup>
                  <FieldGroup label="End Year">
                    <Input className={OB_INPUT_CLASS} type="number" value={formData.education?.[idx]?.endYear} onChange={e => handleInputChange(`education.${idx}.endYear`, e.target.value)} placeholder="YYYY" />
                  </FieldGroup>
                </div>
              </CardBlock>
            ))}
            <AddButton label="Add Education" onClick={() => appendEdu({ id: Date.now().toString(), institutionName: "", degree: "", startYear: "", endYear: "", isCurrent: false })} />
          </div>
        );


      case 6:
        return (
          <div className="space-y-5">
            {renderFeedback('certifications')}
            {certFields.map((field, idx) => (
              <CardBlock key={field.id} onDelete={certFields.length > 1 ? () => removeCert(idx) : undefined}>
                <div className="grid sm:grid-cols-2 gap-4 pr-6">
                  <FieldGroup label="Certification Name" required>
                    <Input className={OB_INPUT_CLASS} value={formData.certifications?.[idx]?.certificationName} onChange={e => handleInputChange(`certifications.${idx}.certificationName`, e.target.value)} placeholder="e.g. PMP Certification" />
                  </FieldGroup>
                  <FieldGroup label="Issuing Organization">
                    <Input className={OB_INPUT_CLASS} value={formData.certifications?.[idx]?.issuer} onChange={e => handleInputChange(`certifications.${idx}.issuer`, e.target.value)} placeholder="e.g. Project Management Institute" />
                  </FieldGroup>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Year Obtained">
                    <Input className={OB_INPUT_CLASS} type="number" value={formData.certifications?.[idx]?.yearObtained} onChange={e => handleInputChange(`certifications.${idx}.yearObtained`, e.target.value)} placeholder="YYYY" />
                  </FieldGroup>
                  <FieldGroup label="Credential Link (Optional)">
                    <Input className={OB_INPUT_CLASS} value={formData.certifications?.[idx]?.fileUrl} onChange={e => handleInputChange(`certifications.${idx}.fileUrl`, e.target.value)} placeholder="https://..." />
                  </FieldGroup>
                </div>
              </CardBlock>
            ))}
            <AddButton label="Add Certification" onClick={() => appendCert({ id: Date.now().toString(), certificationName: "", issuer: "", yearObtained: "", fileUrl: "" })} />
          </div>
        );


      case 7:
        return (
          <div className="space-y-5">
            {renderFeedback('references')}
            {refFields.map((field, idx) => (
              <CardBlock key={field.id} onDelete={refFields.length > 1 ? () => removeRef(idx) : undefined}>
                <div className="grid sm:grid-cols-2 gap-4 pr-6">
                  <FieldGroup label="Reference Name" required>
                    <Input className={OB_INPUT_CLASS} value={formData.references?.[idx]?.name} onChange={e => handleInputChange(`references.${idx}.name`, e.target.value)} placeholder="e.g. Jane Smith" />
                  </FieldGroup>
                  <FieldGroup label="Company & Role">
                    <Input className={OB_INPUT_CLASS} value={formData.references?.[idx]?.company} onChange={e => handleInputChange(`references.${idx}.company`, e.target.value)} placeholder="e.g. Director at TechCo" />
                  </FieldGroup>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Email Address" required>
                    <Input className={OB_INPUT_CLASS} type="email" value={formData.references?.[idx]?.email} onChange={e => handleInputChange(`references.${idx}.email`, e.target.value)} placeholder="jane@example.com" />
                  </FieldGroup>
                  <FieldGroup label="Phone (Optional)">
                    <Input className={OB_INPUT_CLASS} value={formData.references?.[idx]?.phone} onChange={e => handleInputChange(`references.${idx}.phone`, e.target.value)} placeholder="+1 (555) 000-0000" />
                  </FieldGroup>
                </div>
              </CardBlock>
            ))}
            <AddButton label="Add Reference" onClick={() => appendRef({ id: Date.now().toString(), name: "", company: "", email: "", phone: "" })} />
          </div>
        );


      case 8:
        return (
          <div className="space-y-6">
            <p className="text-sm text-slate-500">Review all information before submitting. Click <span className="font-semibold text-slate-700">Edit</span> on any section to make changes.</p>

            {[
              { title: "Basic Information", step: 1, rows: [
                ["Full Name", `${formData.firstName} ${formData.lastName}`.trim() || "—"],
                ["Email", formData.email || "—"],
                ["Phone", formData.phone || "—"],
                ["Country", formData.country || "—"],
                ["Timezone", formData.timezone || "—"],
                ["Languages", (formData.languagesSpoken || []).join(", ") || "—"],
              ]},
              { title: "Professional Details", step: 2, rows: [
                ["Role Category", formData.roleCategory || "—"],
                ["Primary Role", formData.primaryRole || "—"],
                ["Headline", formData.headline || "—"],
                ["Short Bio", formData.shortBio || "—"],
                ["Experience", formData.yearsOfExperience ? `${formData.yearsOfExperience} years` : "—"],
                ["Availability", formData.availability?.replace(/_/g, " ") || "—"],
                ["Skills", (formData.secondarySkills || []).join(", ") || "—"],
                ["Tools", (formData.toolsFamiliarWith || []).join(", ") || "—"],
              ]},
              { title: "Work History", step: 3, rows: (formData.workHistory || []).filter(w => w.companyName).map(w => [w.companyName, `${w.roleTitle}${w.isCurrent ? " (Current)" : ""}`]) },
              { title: "Documents", step: 4, rows: [
                ["CV / Resume", formData.cvUrl ? "✓ Uploaded" : "Not uploaded"],
                ["Government ID", formData.governmentIdUrl ? "✓ Uploaded" : "Not uploaded"],
                ["Proof of Address", formData.proofOfAddressUrl ? "✓ Uploaded" : "Not uploaded"],
                ["Portfolio", formData.portfolioUrl || "—"],
              ]},
              { title: "Education", step: 5, rows: (formData.education || []).filter(e => e.institutionName).map(e => [e.institutionName, e.degree || "—"]) },
              { title: "Certifications", step: 6, rows: (formData.certifications || []).filter(c => c.certificationName).map(c => [c.certificationName, c.issuer || "—"]) },
              { title: "References", step: 7, rows: (formData.references || []).filter(r => r.name).map(r => [r.name, r.email]) },

            ].map(({ title, step, rows }) => (
              <div key={title} className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
                  <button onClick={() => { setCurrentStep(step); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                    Edit →
                  </button>
                </div>
                <div className="divide-y divide-slate-50">
                  {rows.length === 0 ? (
                    <p className="px-5 py-3 text-xs text-slate-400 italic">No entries.</p>
                  ) : rows.map(([label, value], i) => (
                    <div key={i} className="flex items-start gap-4 px-5 py-3">
                      <span className="text-xs font-medium text-slate-400 w-32 shrink-0 pt-0.5">{label}</span>
                      <span className="text-xs text-slate-700 flex-1">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <Checkbox id="confirm-accuracy" className="mt-0.5" defaultChecked />
              <Label htmlFor="confirm-accuracy" className="text-sm text-slate-600 font-normal cursor-pointer leading-relaxed">
                I confirm this information is accurate and I authorize OPSlyHR Connect to verify my professional background.
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Save Status Indicator ────────────────────────────────────────────────

  const SaveIndicator = () => {
    if (saveStatus === "idle") return null;
    return (
      <div className={clsx(
        "flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border",
        saveStatus === "saving" && "text-blue-600 bg-blue-50 border-blue-100",
        saveStatus === "saved" && "text-emerald-600 bg-emerald-50 border-emerald-100",
        saveStatus === "unsaved" && "text-amber-600 bg-amber-50 border-amber-100",
      )}>
        {saveStatus === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
        {saveStatus === "saved" && <Cloud className="h-3 w-3" />}
        {saveStatus === "unsaved" && <Save className="h-3 w-3" />}
        {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Unsaved changes"}
      </div>
    );
  };

  // ── Progress Bar ─────────────────────────────────────────────────────────

  const progressPct = Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100);

  // ── Main Render ──────────────────────────────────────────────────────────

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-slate-50 font-inter">
        {/* ... existing render content ... */}


      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-900">OPSlyHR</span>
            <span className="hidden sm:block text-slate-200">|</span>
            <span className="hidden sm:block text-xs font-medium text-slate-500">Professional Profile Setup</span>
          </div>
          <div className="flex items-center gap-3">
            <SaveIndicator />
            <Button variant="ghost" size="sm" onClick={handleSaveAndExit} className="gap-1.5 text-slate-500 hover:text-slate-900 text-xs hidden sm:flex">
              <LogOut className="h-3.5 w-3.5" /> Save & Exit
            </Button>
            {/* Mobile menu toggle */}
            <button className="sm:hidden p-1.5" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
              {mobileNavOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
            </button>
          </div>
        </div>
        {/* Progress fill */}
        <div className="h-0.5 bg-slate-100">
          <div className="h-full bg-slate-800 transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* ── Mobile Step Nav (drawer) ─────────────────────────────────────── */}
      {mobileNavOpen && (
        <div className="sm:hidden fixed inset-0 z-20 bg-white pt-14 px-4 pb-6 overflow-y-auto">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Steps</p>
          <div className="space-y-1">
            {STEPS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              return (
                <button key={step.id} onClick={() => { setCurrentStep(step.id); setMobileNavOpen(false); }}
                  className={clsx("w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                    isActive ? "bg-slate-900 text-white" : isCompleted ? "text-slate-600 hover:bg-slate-50" : "text-slate-400 hover:bg-slate-50"
                  )}>
                  <div className={clsx("h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                    isActive ? "bg-white text-slate-900" : isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                  )}>
                    {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.id}
                  </div>
                  <span className="text-sm font-medium">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main 3-panel layout ──────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8 lg:gap-12">

          {/* ── Left Stepper (desktop) ────────────────────────────────── */}
          <aside className="hidden sm:flex flex-col w-[220px] shrink-0">
            <div className="sticky top-24">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
                Step {currentStep} of {STEPS.length}
              </p>
              <div className="relative">
                {/* Connector line */}
                <div className="absolute left-[11px] top-6 bottom-6 w-px bg-slate-100" />
                <div className="space-y-1">
                  {STEPS.map((step) => {
                    const isCompleted = currentStep > step.id;
                    const isActive = currentStep === step.id;
                    const isLocked = currentStep < step.id;
                    return (
                      <div key={step.id} className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors relative",
                        isActive && "bg-slate-900 text-white",
                        !isActive && "hover:bg-slate-100"
                      )} onClick={() => setCurrentStep(step.id)}>
                        <div className={clsx(
                          "h-[22px] w-[22px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 z-10",
                          isActive ? "bg-white text-slate-900" :
                          isCompleted ? "bg-emerald-100 text-emerald-700" :
                          "bg-slate-100 text-slate-400"
                        )}>
                          {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.id}
                        </div>
                        <span className={clsx(
                          "text-[13px] font-medium leading-tight",
                          isActive ? "text-white" :
                          isCompleted ? "text-slate-700" :
                          isLocked ? "text-slate-400" : "text-slate-600"
                        )}>
                          {step.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* ── Form Panel ────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 max-w-[680px]">

            {/* Step Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {STEPS[currentStep - 1].title}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {[
                  "Start with your personal contact details and location.",
                  "Define your core expertise, role, and work preferences.",
                  "List your relevant professional experience.",
                  "Upload required documents for vetting and verification.",
                  "Provide your academic background and qualifications.",
                  "Highlight relevant certifications and credentials.",
                  "Provide contact information for professional references.",
                  "Review your profile information before submitting.",
                ][currentStep - 1]}
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-8">
              {renderStepContent()}
            </div>

            {/* ── Action Bar ─────────────────────────────────────────── */}
            {!isSubmitted && (
              <>
                {/* Desktop action bar */}
                <div className="hidden sm:flex items-center justify-between mt-6">
                  <Button variant="ghost" onClick={handleSaveAndExit} className="text-slate-400 hover:text-slate-700 text-sm gap-1.5">
                    <Save className="h-3.5 w-3.5" /> Save & Exit
                  </Button>
                  <div className="flex items-center gap-3">
                    {currentStep > 1 && (
                      <Button variant="outline" onClick={prevStep} className="h-11 px-5 rounded-lg border-slate-200 text-slate-600 hover:text-slate-900">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                      </Button>
                    )}
                    {currentStep < STEPS.length ? (
                      <Button onClick={nextStep} className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg">
                        Continue <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} disabled={loading} className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Submit for Vetting →
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mobile sticky action bar */}
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-100 px-4 py-3 flex items-center gap-3">
                  {currentStep > 1 ? (
                    <Button variant="outline" onClick={prevStep} className="h-12 flex-1 rounded-xl border-slate-200">
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleSaveAndExit} className="h-12 flex-1 rounded-xl border-slate-200 text-slate-500">
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  )}
                  <Button variant="ghost" onClick={handleSaveAndExit} className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 text-slate-400 p-0">
                    <Save className="h-4 w-4" />
                  </Button>
                  {currentStep < STEPS.length ? (
                    <Button onClick={nextStep} className="h-12 flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={loading} className="h-12 flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit →"}
                    </Button>
                  )}
                </div>
                {/* Mobile bottom padding */}
                <div className="sm:hidden h-24" />
              </>
            )}
          </main>

        </div>
      </div>
    </div>
    </FormProvider>
  );
};


export default TalentOnboarding;
