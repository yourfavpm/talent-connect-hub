import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

// ── Main Component ─────────────────────────────────────────────────────────────

const TalentOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [talentId, setTalentId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    timezone: "",
    primaryRole: "",
    secondarySkills: [] as string[],
    yearsOfExperience: "",
    availability: "",
    toolsFamiliarWith: [] as string[],
    languagesSpoken: [] as string[],
    governmentIdUrl: "",
    cvUrl: "",
    proofOfAddressUrl: "",
    portfolioUrl: "",
  });

  const [workHistory, setWorkHistory] = useState([
    { id: Date.now().toString(), companyName: "", roleTitle: "", roleDescription: "", startDate: "", endDate: "", isCurrent: false },
  ]);
  const [education, setEducation] = useState([
    { id: Date.now().toString(), institutionName: "", degree: "", startYear: "", endYear: "", isCurrent: false },
  ]);
  const [certifications, setCertifications] = useState([
    { id: Date.now().toString(), certificationName: "", issuer: "", yearObtained: "", fileUrl: "" },
  ]);
  const [references, setReferences] = useState([
    { id: Date.now().toString(), name: "", company: "", email: "", phone: "" },
  ]);
  const [vettingSteps, setVettingSteps] = useState<any[]>([]);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

  // ── Load from DB + localStorage ───────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;
    const loadProfileData = async () => {
      if (!user) return;

      // Rehydrate step from localStorage first (fast)
      const localStep = localStorage.getItem(`onboarding_step_${user.id}`);
      if (localStep) setCurrentStep(parseInt(localStep, 10));

      try {
        const { data: talent } = await supabase
          .from("talents")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (talent && isMounted) {
          setFormData(prev => ({
            ...prev,
            firstName: talent.first_name || user.user_metadata?.first_name || "",
            lastName: talent.last_name || user.user_metadata?.last_name || "",
            email: talent.email || user.email || "",
            phone: talent.phone || "",
            country: talent.country || "",
            timezone: talent.timezone || "",
            primaryRole: talent.primary_role || "",
            secondarySkills: talent.secondary_skills || [],
            yearsOfExperience: talent.years_of_experience?.toString() || "",
            availability: talent.availability || "",
            toolsFamiliarWith: talent.tools_familiar_with || [],
            languagesSpoken: talent.languages_spoken || [],
            governmentIdUrl: talent.government_id_url || "",
            cvUrl: talent.cv_url || "",
            proofOfAddressUrl: talent.proof_of_address_url || "",
          }));
          setTalentId(talent.id);

          // Restore step from DB (authoritative)
          const dbStep = (talent as any).current_step;
          if (dbStep && dbStep > 1) setCurrentStep(Math.min(dbStep, STEPS.length));

          const onbStatus = (talent as any).onboarding_status;
          if (onbStatus === "submitted" || onbStatus === "under_review") {
            setIsSubmitted(true);
          }

          const [workRes, eduRes, certRes, refRes, vettingRes, requestsRes] = await Promise.all([
            supabase.from("talent_work_history").select("*").eq("talent_id", talent.id),
            supabase.from("talent_education").select("*").eq("talent_id", talent.id),
            supabase.from("talent_certifications").select("*").eq("talent_id", talent.id),
            supabase.from("talent_references").select("*").eq("talent_id", talent.id),
            supabase.from("talent_profile_steps" as any).select("*").eq("talent_id", talent.id),
            supabase.from("step_change_requests" as any).select("*").eq("talent_id", talent.id).is("resolved_at", null)
          ]);

          if (workRes.data?.length) setWorkHistory(workRes.data.map(w => ({ id: w.id, companyName: w.company_name, roleTitle: w.role_title, roleDescription: w.role_description || "", startDate: w.start_date || "", endDate: w.end_date || "", isCurrent: w.is_current })));
          if (eduRes.data?.length) setEducation(eduRes.data.map(e => ({ id: e.id, institutionName: e.institution_name, degree: e.education_level || "", startYear: e.start_year?.toString() || "", endYear: e.end_year?.toString() || "", isCurrent: e.is_current })));
          if (certRes.data?.length) setCertifications(certRes.data.map(c => ({ id: c.id, certificationName: c.certification_name, issuer: c.issuing_organization || "", yearObtained: c.year_obtained?.toString() || "", fileUrl: c.credential_url || "" })));
          if (refRes.data?.length) setReferences(refRes.data.map(r => ({ id: r.id, name: r.reference_name, company: r.relationship || "", email: r.email, phone: r.phone || "" })));
          setVettingSteps(vettingRes.data || []);
          setChangeRequests(requestsRes.data || []);
        } else if (isMounted) {
          setFormData(prev => ({ ...prev, email: user.email || "", firstName: user.user_metadata?.first_name || "", lastName: user.user_metadata?.last_name || "" }));
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    };

    loadProfileData();
    return () => { isMounted = false; };
  }, [user]);

  // ── Auto-save Engine ──────────────────────────────────────────────────────

  const performAutosave = useCallback(async (data: typeof formData) => {
    if (!user || !talentId) return;
    setSaveStatus("saving");
    try {
      await supabase.from("talents").update({
        phone: data.phone,
        country: data.country,
        timezone: data.timezone,
        primary_role: data.primaryRole,
        secondary_skills: data.secondarySkills,
        years_of_experience: data.yearsOfExperience ? Number(data.yearsOfExperience) : null,
        availability: data.availability,
        tools_familiar_with: data.toolsFamiliarWith,
        languages_spoken: data.languagesSpoken,
        portfolio_url: data.portfolioUrl,
      } as any).eq("id", talentId);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("unsaved");
    }
  }, [user, talentId]);

  const handleInputChange = useCallback((field: string, value: string | string[]) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      setSaveStatus("unsaved");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => performAutosave(next), 1000);
      return next;
    });
  }, [performAutosave]);

  const persistStep = useCallback(async (step: number) => {
    if (!user || !talentId) return;
    localStorage.setItem(`onboarding_step_${user.id}`, String(step));
    await supabase.from("talents").update({ current_step: step } as any).eq("id", talentId);
  }, [user, talentId]);

  // ── File Upload ───────────────────────────────────────────────────────────

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploadingFields(prev => ({ ...prev, [field]: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${field}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('talent_documents').upload(filePath, file);
      if (uploadError) throw uploadError;
      handleInputChange(field, filePath);
      toast({ title: "Upload successful", description: "File uploaded successfully." });
    } catch (err: Error | unknown) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "An error occurred", variant: "destructive" });
    } finally {
      setUploadingFields(prev => ({ ...prev, [field]: false }));
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validateStep = (step: number) => {
    const missing: string[] = [];
    if (step === 1) {
      if (!formData.firstName.trim()) missing.push("First Name");
      if (!formData.lastName.trim()) missing.push("Last Name");
    } else if (step === 2) {
      if (!formData.primaryRole) missing.push("Primary Role");
      if (!formData.yearsOfExperience) missing.push("Years of Experience");
      if (!formData.availability) missing.push("Availability");
    } else if (step === 7) {
      const validRefs = references.filter(r => r.name.trim() && r.email.trim());
      if (validRefs.length === 0) missing.push("At least one valid reference (Name and Email)");
    }
    if (missing.length > 0) {
      toast({ title: "Required Fields Missing", description: `Please fill out: ${missing.join(", ")}`, variant: "destructive" });
      return false;
    }
    return true;
  };

  const nextStep = async () => {
    if (!validateStep(currentStep)) return;
    await performAutosave(formData);
    const next = Math.min(currentStep + 1, STEPS.length);
    setCurrentStep(next);
    await persistStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = async () => {
    await performAutosave(formData);
    const prev = Math.max(currentStep - 1, 1);
    setCurrentStep(prev);
    await persistStep(prev);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveAndExit = async () => {
    await performAutosave(formData);
    navigate("/talent/dashboard");
  };

  const handleSubmit = async () => {
    if (!validateStep(8)) return;
    setLoading(true);
    try {
      if (talentId) {
        await supabase.from("talents" as any).update({ vetting_status: "in_review" as any, onboarding_status: "submitted", current_step: STEPS.length } as any).eq("id", talentId);
        localStorage.removeItem(`onboarding_step_${user?.id}`);
        const requestedSteps = vettingSteps.filter(s => s.status === 'changes_requested');
        for (const s of requestedSteps) {
          await supabase.from("talent_profile_steps" as any).update({ status: "in_review" as any } as any).eq("id", s.id);
        }
      }
      setIsSubmitted(true);
      toast({ title: "Profile Submitted", description: "Your profile is now pending review by our team." });
    } catch (error: Error | unknown) {
      toast({ title: "Submission Failed", description: error instanceof Error ? error.message : "An unknown error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Feedback Banner ───────────────────────────────────────────────────────

  const renderFeedback = (stepKey: string) => {
    const step = vettingSteps.find(s => s.step_key === stepKey);
    const requests = changeRequests.filter(r => r.step_key === stepKey);
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

  // ── Field Components ──────────────────────────────────────────────────────

  const FieldGroup = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );

  const inputClass = "h-12 rounded-lg border border-slate-200 bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm placeholder:text-slate-400";

  const CardBlock = ({ children, onDelete }: { children: React.ReactNode; onDelete?: () => void }) => (
    <div className="relative p-6 bg-white border border-slate-100 rounded-xl group">
      {onDelete && (
        <button onClick={onDelete} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );

  const AddButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick} className="w-full h-14 border border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-700 hover:border-slate-400 transition-colors flex items-center justify-center gap-2">
      <Plus className="h-4 w-4" /> {label}
    </button>
  );

  const FileUploadRow = ({ field, label, hint, accept }: { field: string; label: string; hint: string; accept: string }) => {
    const uploaded = formData[field as keyof typeof formData] as string;
    return (
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
            <Input type="file" accept={accept} onChange={(e) => handleFileUpload(e, field)} className="absolute inset-0 opacity-0 cursor-pointer w-28 h-9" disabled={uploadingFields[field]} />
            <Button type="button" variant="outline" size="sm" className="w-28 h-9 rounded-lg border-slate-200" disabled={uploadingFields[field]}>
              {uploadingFields[field] ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UploadCloud className="h-3.5 w-3.5 mr-1.5" />{uploaded ? 'Replace' : 'Upload'}</>}
            </Button>
          </div>
        </div>
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
            <div className="grid sm:grid-cols-2 gap-5">
              <FieldGroup label="First Name" required>
                <Input className={inputClass} value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} placeholder="Jane" />
              </FieldGroup>
              <FieldGroup label="Last Name" required>
                <Input className={inputClass} value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} placeholder="Smith" />
              </FieldGroup>
            </div>
            <FieldGroup label="Email Address">
              <Input className={clsx(inputClass, "opacity-60 cursor-not-allowed")} value={formData.email} disabled />
            </FieldGroup>
            <FieldGroup label="Phone Number">
              <Input className={inputClass} value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
            </FieldGroup>
            <div className="grid sm:grid-cols-2 gap-5">
              <FieldGroup label="Country / Location">
                <Input className={inputClass} value={formData.country} onChange={(e) => handleInputChange("country", e.target.value)} placeholder="e.g. United Kingdom" />
              </FieldGroup>
              <FieldGroup label="Timezone">
                <TimezoneSelector value={formData.timezone} onChange={(v) => handleInputChange("timezone", v)} />
              </FieldGroup>
            </div>
            <FieldGroup label="Languages Spoken">
              <Input className={inputClass} value={formData.languagesSpoken.join(", ")} onChange={(e) => handleInputChange("languagesSpoken", e.target.value.split(",").map(s => s.trim()))} placeholder="e.g. English, French, Spanish" />
              <p className="text-[11px] text-slate-400 mt-1">Separate multiple languages with commas.</p>
            </FieldGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {renderFeedback('professional_details')}
            <RoleSelector value={formData.primaryRole} onChange={(v) => handleInputChange("primaryRole", v)} />
            <div className="grid sm:grid-cols-2 gap-5">
              <FieldGroup label="Years of Experience" required>
                <Input className={inputClass} type="number" min="0" value={formData.yearsOfExperience} onChange={(e) => handleInputChange("yearsOfExperience", e.target.value)} placeholder="e.g. 7" />
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
            {workHistory.map((work, idx) => (
              <CardBlock key={work.id} onDelete={workHistory.length > 1 ? () => setWorkHistory(prev => prev.filter(w => w.id !== work.id)) : undefined}>
                <div className="grid sm:grid-cols-2 gap-4 pr-6">
                  <FieldGroup label="Company">
                    <Input className={inputClass} value={work.companyName} onChange={e => { const u = [...workHistory]; u[idx].companyName = e.target.value; setWorkHistory(u); }} placeholder="e.g. Acme Corp" />
                  </FieldGroup>
                  <FieldGroup label="Role / Title">
                    <Input className={inputClass} value={work.roleTitle} onChange={e => { const u = [...workHistory]; u[idx].roleTitle = e.target.value; setWorkHistory(u); }} placeholder="e.g. Operations Manager" />
                  </FieldGroup>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Start Date">
                    <Input className={inputClass} type="month" value={work.startDate} onChange={e => { const u = [...workHistory]; u[idx].startDate = e.target.value; setWorkHistory(u); }} />
                  </FieldGroup>
                  <FieldGroup label="End Date">
                    <Input className={clsx(inputClass, work.isCurrent && "opacity-40")} type="month" disabled={work.isCurrent} value={work.endDate} onChange={e => { const u = [...workHistory]; u[idx].endDate = e.target.value; setWorkHistory(u); }} />
                  </FieldGroup>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Checkbox id={`current-${work.id}`} checked={work.isCurrent} onCheckedChange={c => { const u = [...workHistory]; u[idx].isCurrent = !!c; if (c) u[idx].endDate = ''; setWorkHistory(u); }} />
                  <Label htmlFor={`current-${work.id}`} className="text-sm font-normal text-slate-600 cursor-pointer">I currently work here</Label>
                </div>
                <div className="mt-4">
                  <FieldGroup label="Description">
                    <Textarea className="rounded-lg border-slate-200 text-sm min-h-[90px] resize-none" placeholder="Key responsibilities and achievements..." value={work.roleDescription} onChange={e => { const u = [...workHistory]; u[idx].roleDescription = e.target.value; setWorkHistory(u); }} />
                  </FieldGroup>
                </div>
              </CardBlock>
            ))}
            <AddButton label="Add Experience" onClick={() => setWorkHistory([...workHistory, { id: Date.now().toString(), companyName: "", roleTitle: "", roleDescription: "", startDate: "", endDate: "", isCurrent: false }])} />
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
              <FileUploadRow field="cvUrl" label="CV / Resume" hint="PDF or Word format" accept=".pdf,.doc,.docx" />
              <FileUploadRow field="governmentIdUrl" label="Government ID" hint="Clear photo of Passport or National ID" accept="image/*,.pdf" />
              <FileUploadRow field="proofOfAddressUrl" label="Proof of Address" hint="Utility bill, bank statement, or rental agreement" accept="image/*,.pdf" />
            </div>
            <div className="space-y-3">
              <FieldGroup label="Portfolio Link (Optional)">
                <Input className={inputClass} value={formData.portfolioUrl} onChange={e => handleInputChange("portfolioUrl", e.target.value)} placeholder="https://..." />
              </FieldGroup>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            {renderFeedback('education')}
            {education.map((edu, idx) => (
              <CardBlock key={edu.id} onDelete={education.length > 1 ? () => setEducation(prev => prev.filter(e => e.id !== edu.id)) : undefined}>
                <div className="grid sm:grid-cols-2 gap-4 pr-6">
                  <FieldGroup label="Institution">
                    <Input className={inputClass} value={edu.institutionName} onChange={e => { const u = [...education]; u[idx].institutionName = e.target.value; setEducation(u); }} placeholder="e.g. University of Lagos" />
                  </FieldGroup>
                  <FieldGroup label="Degree & Field of Study">
                    <Input className={inputClass} value={edu.degree} onChange={e => { const u = [...education]; u[idx].degree = e.target.value; setEducation(u); }} placeholder="e.g. B.Sc. Business Administration" />
                  </FieldGroup>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Start Year">
                    <Input className={inputClass} type="number" value={edu.startYear} onChange={e => { const u = [...education]; u[idx].startYear = e.target.value; setEducation(u); }} placeholder="YYYY" />
                  </FieldGroup>
                  <FieldGroup label="End Year">
                    <Input className={inputClass} type="number" value={edu.endYear} onChange={e => { const u = [...education]; u[idx].endYear = e.target.value; setEducation(u); }} placeholder="YYYY" />
                  </FieldGroup>
                </div>
              </CardBlock>
            ))}
            <AddButton label="Add Education" onClick={() => setEducation([...education, { id: Date.now().toString(), institutionName: "", degree: "", startYear: "", endYear: "", isCurrent: false }])} />
          </div>
        );

      case 6:
        return (
          <div className="space-y-5">
            {renderFeedback('certifications')}
            {certifications.map((cert, idx) => (
              <CardBlock key={cert.id} onDelete={certifications.length > 1 ? () => setCertifications(prev => prev.filter(c => c.id !== cert.id)) : undefined}>
                <div className="grid sm:grid-cols-2 gap-4 pr-6">
                  <FieldGroup label="Certification Name">
                    <Input className={inputClass} value={cert.certificationName} onChange={e => { const u = [...certifications]; u[idx].certificationName = e.target.value; setCertifications(u); }} placeholder="e.g. PMP Certification" />
                  </FieldGroup>
                  <FieldGroup label="Issuing Organization">
                    <Input className={inputClass} value={cert.issuer} onChange={e => { const u = [...certifications]; u[idx].issuer = e.target.value; setCertifications(u); }} placeholder="e.g. Project Management Institute" />
                  </FieldGroup>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Year Obtained">
                    <Input className={inputClass} type="number" value={cert.yearObtained} onChange={e => { const u = [...certifications]; u[idx].yearObtained = e.target.value; setCertifications(u); }} placeholder="YYYY" />
                  </FieldGroup>
                  <FieldGroup label="Credential Link (Optional)">
                    <Input className={inputClass} value={cert.fileUrl} onChange={e => { const u = [...certifications]; u[idx].fileUrl = e.target.value; setCertifications(u); }} placeholder="https://..." />
                  </FieldGroup>
                </div>
              </CardBlock>
            ))}
            <AddButton label="Add Certification" onClick={() => setCertifications([...certifications, { id: Date.now().toString(), certificationName: "", issuer: "", yearObtained: "", fileUrl: "" }])} />
          </div>
        );

      case 7:
        return (
          <div className="space-y-5">
            {renderFeedback('references')}
            {references.map((ref, idx) => (
              <CardBlock key={ref.id} onDelete={references.length > 1 ? () => setReferences(prev => prev.filter(r => r.id !== ref.id)) : undefined}>
                <div className="grid sm:grid-cols-2 gap-4 pr-6">
                  <FieldGroup label="Reference Name" required>
                    <Input className={inputClass} value={ref.name} onChange={e => { const u = [...references]; u[idx].name = e.target.value; setReferences(u); }} placeholder="e.g. Jane Smith" />
                  </FieldGroup>
                  <FieldGroup label="Company & Role">
                    <Input className={inputClass} value={ref.company} onChange={e => { const u = [...references]; u[idx].company = e.target.value; setReferences(u); }} placeholder="e.g. Director at TechCo" />
                  </FieldGroup>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <FieldGroup label="Email Address" required>
                    <Input className={inputClass} type="email" value={ref.email} onChange={e => { const u = [...references]; u[idx].email = e.target.value; setReferences(u); }} placeholder="jane@example.com" />
                  </FieldGroup>
                  <FieldGroup label="Phone (Optional)">
                    <Input className={inputClass} value={ref.phone} onChange={e => { const u = [...references]; u[idx].phone = e.target.value; setReferences(u); }} placeholder="+1 (555) 000-0000" />
                  </FieldGroup>
                </div>
              </CardBlock>
            ))}
            <AddButton label="Add Reference" onClick={() => setReferences([...references, { id: Date.now().toString(), name: "", company: "", email: "", phone: "" }])} />
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
                ["Languages", formData.languagesSpoken.join(", ") || "—"],
              ]},
              { title: "Professional Details", step: 2, rows: [
                ["Primary Role", formData.primaryRole || "—"],
                ["Experience", formData.yearsOfExperience ? `${formData.yearsOfExperience} years` : "—"],
                ["Availability", formData.availability?.replace(/_/g, " ") || "—"],
                ["Skills", formData.secondarySkills.join(", ") || "—"],
                ["Tools", formData.toolsFamiliarWith.join(", ") || "—"],
              ]},
              { title: "Work History", step: 3, rows: workHistory.filter(w => w.companyName).map(w => [w.companyName, `${w.roleTitle}${w.isCurrent ? " (Current)" : ""}`]) },
              { title: "Documents", step: 4, rows: [
                ["CV / Resume", formData.cvUrl ? "✓ Uploaded" : "Not uploaded"],
                ["Government ID", formData.governmentIdUrl ? "✓ Uploaded" : "Not uploaded"],
                ["Proof of Address", formData.proofOfAddressUrl ? "✓ Uploaded" : "Not uploaded"],
                ["Portfolio", formData.portfolioUrl || "—"],
              ]},
              { title: "Education", step: 5, rows: education.filter(e => e.institutionName).map(e => [e.institutionName, e.degree || "—"]) },
              { title: "Certifications", step: 6, rows: certifications.filter(c => c.certificationName).map(c => [c.certificationName, c.issuer || "—"]) },
              { title: "References", step: 7, rows: references.filter(r => r.name).map(r => [r.name, r.email]) },
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
                I confirm this information is accurate and I authorize Taskive Connect to verify my professional background.
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
    <div className="min-h-screen bg-slate-50 font-inter">

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-900">Taskive</span>
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
  );
};

export default TalentOnboarding;
