import { useState, useEffect } from "react";
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
  MessageSquare
} from "lucide-react";
import clsx from "clsx";

const STEPS = [
  { id: 1, title: "Basic Information" },
  { id: 2, title: "Professional Details" },
  { id: 3, title: "Work History" },
  { id: 4, title: "Documents" },
  { id: 5, title: "Education" },
  { id: 6, title: "Certifications" },
  { id: 7, title: "References" },
  { id: 8, title: "Review & Submit" },
];

const timezones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "GMT/BST - London" },
  { value: "Europe/Paris", label: "CET - Europe" },
  { value: "Asia/Dubai", label: "Gulf Standard Time" },
  { value: "Asia/Singapore", label: "Singapore Time" },
  { value: "Australia/Sydney", label: "Australian Eastern Time" },
];

const TalentOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

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
  const [talentId, setTalentId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadProfileData = async () => {
      if (!user) return;
      
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

          const [workRes, eduRes, certRes, refRes, vettingRes, requestsRes] = await Promise.all([
            supabase.from("talent_work_history").select("*").eq("talent_id", talent.id),
            supabase.from("talent_education").select("*").eq("talent_id", talent.id),
            supabase.from("talent_certifications").select("*").eq("talent_id", talent.id),
            supabase.from("talent_references").select("*").eq("talent_id", talent.id),
            supabase.from("talent_profile_steps" as any).select("*").eq("talent_id", talent.id),
            supabase.from("step_change_requests" as any).select("*").eq("talent_id", talent.id).is("resolved_at", null)
          ]);

          if (workRes.data?.length) {
            setWorkHistory(workRes.data.map(w => ({
              id: w.id,
              companyName: w.company_name,
              roleTitle: w.role_title,
              roleDescription: w.role_description || "",
              startDate: w.start_date || "",
              endDate: w.end_date || "",
              isCurrent: w.is_current
            })));
          }
          if (eduRes.data?.length) {
            setEducation(eduRes.data.map(e => ({
              id: e.id,
              institutionName: e.institution_name,
              degree: e.education_level || "",
              startYear: e.start_year?.toString() || "",
              endYear: e.end_year?.toString() || "",
              isCurrent: e.is_current
            })));
          }
          if (certRes.data?.length) {
            setCertifications(certRes.data.map(c => ({
              id: c.id,
              certificationName: c.certification_name,
              issuer: c.issuing_organization || "",
              yearObtained: c.year_obtained?.toString() || "",
              fileUrl: c.credential_url || ""
            })));
          }
          if (refRes.data?.length) {
            setReferences(refRes.data.map(r => ({
              id: r.id,
              name: r.reference_name,
              company: r.relationship || "",
              email: r.email,
              phone: r.phone || ""
            })));
          }
          setVettingSteps(vettingRes.data || []);
          setChangeRequests(requestsRes.data || []);
        } else if (isMounted) {
          setFormData(prev => ({
            ...prev,
            email: user.email || "",
            firstName: user.user_metadata?.first_name || "",
            lastName: user.user_metadata?.last_name || "",
          }));
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    };

    loadProfileData();
    return () => { isMounted = false; };
  }, [user]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingFields(prev => ({ ...prev, [field]: true }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${field}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('talent_documents')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      handleInputChange(field, filePath);
      toast({ title: "Upload successful", description: "File uploaded successfully." });
    } catch (err: Error | unknown) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "An error occurred", variant: "destructive" });
    } finally {
      setUploadingFields(prev => ({ ...prev, [field]: false }));
    }
  };

  const autoSaveDraft = async () => {
    if (!user) return;
    setSavingDraft(true);
    try {
      // Background save logic here if desired.
      // E.g., upsert to a 'talent_drafts' table or directly to the 'talents' table if part of onboarding.
      await new Promise(r => setTimeout(r, 500)); 
    } finally {
      setSavingDraft(false);
    }
  };

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
      toast({
        title: "Required Fields Missing",
        description: `Please fill out: ${missing.join(", ")}`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      autoSaveDraft();
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(8)) return;
    setLoading(true);
    try {
      if (talentId) {
        // Update vetting status back to in_review
        const { error: updateError } = await supabase
          .from("talents" as any)
          .update({ vetting_status: "in_review" as any } as any)
          .eq("id", talentId);
        
        if (updateError) throw updateError;

        // Mark requested steps as in_review
        const requestedSteps = vettingSteps.filter(s => s.status === 'changes_requested');
        for (const s of requestedSteps) {
          await supabase
            .from("talent_profile_steps" as any)
            .update({ status: "in_review" as any } as any)
            .eq("id", s.id);
        }
      }

      toast({
        title: "Profile Submitted",
        description: "Your profile is now pending review by our team.",
      });
      navigate("/talent/dashboard");
    } catch (error: Error | unknown) {
      toast({ title: "Submission Failed", description: error instanceof Error ? error.message : "An unknown error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const renderFeedback = (stepKey: string) => {
    const step = vettingSteps.find(s => s.step_key === stepKey);
    const requests = changeRequests.filter(r => r.step_key === stepKey);
    
    if (!step || step.status !== 'changes_requested') return null;

    return (
      <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-100 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-700">Changes Required</span>
          </div>
          <Badge variant="outline" className="text-[9px] font-black uppercase border-orange-200 text-orange-600 bg-white">
            Action Needed
          </Badge>
        </div>
        
        {requests.length > 0 && (
          <div className="space-y-2">
            {requests.map((req, idx) => (
              <div key={idx} className="flex gap-3">
                <MessageSquare className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-orange-800 leading-relaxed italic">
                  "{req.message}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in py-2">
            {renderFeedback('basic_info')}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              <p className="text-sm text-gray-500 mt-1">Let's start with your contact details and location.</p>
            </div>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name <span className="text-red-500">*</span></Label>
                  <Input value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name <span className="text-red-500">*</span></Label>
                  <Input value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email <span className="text-gray-400 font-normal text-xs ml-2">(Read-only)</span></Label>
                <Input value={formData.email} disabled className="bg-gray-50 text-gray-500" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country / Location</Label>
                  <Input value={formData.country} onChange={(e) => handleInputChange("country", e.target.value)} placeholder="e.g. United States" />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={formData.timezone} onValueChange={(v) => handleInputChange("timezone", v)}>
                    <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                    <SelectContent>
                      {timezones.map(tz => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Languages Spoken</Label>
                <Input value={formData.languagesSpoken.join(", ")} onChange={(e) => handleInputChange("languagesSpoken", e.target.value.split(",").map(s => s.trim()))} placeholder="e.g. English, Spanish" />
                <p className="text-xs text-gray-500">Separate multiple languages with commas.</p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in py-2">
            {renderFeedback('professional_details')}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Professional Details</h2>
              <p className="text-sm text-gray-500 mt-1">Define your core expertise and work preferences.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Role <span className="text-red-500">*</span></Label>
                <Select value={formData.primaryRole} onValueChange={(v) => handleInputChange("primaryRole", v)}>
                  <SelectTrigger><SelectValue placeholder="Select your main profession" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virtual_assistant">Virtual Assistant</SelectItem>
                    <SelectItem value="customer_support">Customer Support Specialist</SelectItem>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="executive_assistant">Executive Assistant</SelectItem>
                    <SelectItem value="software_engineer">Software Engineer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Years of Experience <span className="text-red-500">*</span></Label>
                  <Input type="number" min="0" value={formData.yearsOfExperience} onChange={(e) => handleInputChange("yearsOfExperience", e.target.value)} placeholder="e.g. 5" />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Availability <span className="text-red-500">*</span></Label>
                  <Select value={formData.availability} onValueChange={(v) => handleInputChange("availability", v)}>
                    <SelectTrigger><SelectValue placeholder="Select availability" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full-Time (40 hrs/wk)</SelectItem>
                      <SelectItem value="part_time">Part-Time (20 hrs/wk)</SelectItem>
                      <SelectItem value="contract">Hourly / Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Core Skills (comma-separated)</Label>
                <Textarea value={formData.secondarySkills.join(", ")} onChange={(e) => handleInputChange("secondarySkills", e.target.value.split(",").map(s => s.trim()))} placeholder="e.g. Data Entry, Email Management, Scheduling" className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label>Tools & Software (comma-separated)</Label>
                <Textarea value={formData.toolsFamiliarWith.join(", ")} onChange={(e) => handleInputChange("toolsFamiliarWith", e.target.value.split(",").map(s => s.trim()))} placeholder="e.g. Asana, Slack, Notion, Zendesk" className="min-h-[80px]" />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in py-2">
            {renderFeedback('work_history')}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Work History</h2>
              <p className="text-sm text-gray-500 mt-1">Add your relevant past experiences. Most recent first.</p>
            </div>
            <div className="space-y-6">
              {workHistory.map((work, idx) => (
                <Card key={work.id} className="relative bg-white shadow-sm border-gray-200">
                  <CardContent className="p-5 space-y-4">
                    {workHistory.length > 1 && (
                      <button onClick={() => setWorkHistory(prev => prev.filter(w => w.id !== work.id))} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4 pr-6">
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input value={work.companyName} onChange={e => { const updated = [...workHistory]; updated[idx].companyName = e.target.value; setWorkHistory(updated); }} placeholder="e.g. Acme Corp" />
                      </div>
                      <div className="space-y-2">
                        <Label>Role / Title</Label>
                        <Input value={work.roleTitle} onChange={e => { const updated = [...workHistory]; updated[idx].roleTitle = e.target.value; setWorkHistory(updated); }} placeholder="e.g. Operations Manager" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="month" value={work.startDate} onChange={e => { const updated = [...workHistory]; updated[idx].startDate = e.target.value; setWorkHistory(updated); }} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="month" disabled={work.isCurrent} value={work.endDate} onChange={e => { const updated = [...workHistory]; updated[idx].endDate = e.target.value; setWorkHistory(updated); }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id={`current-${work.id}`} checked={work.isCurrent} onCheckedChange={c => { const updated = [...workHistory]; updated[idx].isCurrent = !!c; if(c) updated[idx].endDate = ''; setWorkHistory(updated); }} />
                      <Label htmlFor={`current-${work.id}`} className="font-normal text-sm cursor-pointer">I currently work here</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Briefly describe your responsibilities and achievements..." value={work.roleDescription} onChange={e => { const updated = [...workHistory]; updated[idx].roleDescription = e.target.value; setWorkHistory(updated); }} className="min-h-[100px]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" type="button" onClick={() => setWorkHistory([...workHistory, { id: Date.now().toString(), companyName: "", roleTitle: "", roleDescription: "", startDate: "", endDate: "", isCurrent: false }])} className="w-full border-dashed border-2 py-8 text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10">
                <Plus className="h-4 w-4 mr-2" /> Add Experience
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in py-2">
            {renderFeedback('documents')}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
              <p className="text-sm text-gray-500 mt-1">Upload necessary files for identity verification and vetting.</p>
            </div>
            
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex gap-3 text-blue-900">
              <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Secure Uploads</p>
                <p>Your documents are securely encrypted and stored privately for vetting purposes only.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                   <Label className="flex items-center gap-2 text-gray-900 font-semibold"><FileText className="h-4 w-4 text-gray-500"/> CV / Resume <span className="text-red-500">*</span></Label>
                   <p className="text-xs text-gray-500 mt-1">PDF or Word format</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                   {formData.cvUrl && <Badge className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1"/> Uploaded</Badge>}
                   <div className="relative">
                     <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e, "cvUrl")} className="absolute inset-0 opacity-0 cursor-pointer w-[120px] h-[36px]" disabled={uploadingFields["cvUrl"]} />
                     <Button type="button" variant="outline" size="sm" className="w-[120px]" disabled={uploadingFields["cvUrl"]}>
                       {uploadingFields["cvUrl"] ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UploadCloud className="h-4 w-4 mr-2" /> {formData.cvUrl ? 'Replace' : 'Upload'}</>}
                     </Button>
                   </div>
                </div>
              </div>
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                   <Label className="flex items-center gap-2 text-gray-900 font-semibold"><FileText className="h-4 w-4 text-gray-500"/> Government ID <span className="text-red-500">*</span></Label>
                   <p className="text-xs text-gray-500 mt-1">Clear photo of Passport or ID card</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                   {formData.governmentIdUrl && <Badge className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1"/> Uploaded</Badge>}
                   <div className="relative">
                     <Input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, "governmentIdUrl")} className="absolute inset-0 opacity-0 cursor-pointer w-[120px] h-[36px]" disabled={uploadingFields["governmentIdUrl"]} />
                     <Button type="button" variant="outline" size="sm" className="w-[120px]" disabled={uploadingFields["governmentIdUrl"]}>
                       {uploadingFields["governmentIdUrl"] ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UploadCloud className="h-4 w-4 mr-2" /> {formData.governmentIdUrl ? 'Replace' : 'Upload'}</>}
                     </Button>
                   </div>
                </div>
              </div>
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <Label className="flex items-center gap-2 text-gray-900 font-semibold"><FileText className="h-4 w-4 text-gray-500"/> Portfolio Link (Optional)</Label>
                <div className="mt-2 text-sm text-gray-500 mb-2">If you have an online portfolio (Behance, Dribbble, GitHub, personal website), provide the tracking link here instead of uploading files.</div>
                <Input value={formData.portfolioUrl} onChange={e => handleInputChange("portfolioUrl", e.target.value)} placeholder="https://..." className="bg-white" />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-fade-in py-2">
            {renderFeedback('education')}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Education</h2>
              <p className="text-sm text-gray-500 mt-1">List your academic background.</p>
            </div>
            <div className="space-y-6">
              {education.map((edu, idx) => (
                <Card key={edu.id} className="relative bg-white shadow-sm border-gray-200">
                  <CardContent className="p-5 space-y-4">
                    {education.length > 1 && (
                      <button onClick={() => setEducation(prev => prev.filter(e => e.id !== edu.id))} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4 pr-6">
                      <div className="space-y-2">
                        <Label>Institution</Label>
                        <Input value={edu.institutionName} onChange={e => { const updated = [...education]; updated[idx].institutionName = e.target.value; setEducation(updated); }} placeholder="e.g. University of Example" />
                      </div>
                      <div className="space-y-2">
                        <Label>Degree & Field of Study</Label>
                        <Input value={edu.degree} onChange={e => { const updated = [...education]; updated[idx].degree = e.target.value; setEducation(updated); }} placeholder="e.g. B.S. Computer Science" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Year</Label>
                        <Input type="number" value={edu.startYear} onChange={e => { const updated = [...education]; updated[idx].startYear = e.target.value; setEducation(updated); }} placeholder="YYYY" />
                      </div>
                      <div className="space-y-2">
                        <Label>End Year</Label>
                        <Input type="number" disabled={edu.isCurrent} value={edu.endYear} onChange={e => { const updated = [...education]; updated[idx].endYear = e.target.value; setEducation(updated); }} placeholder="YYYY" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" type="button" onClick={() => setEducation([...education, { id: Date.now().toString(), institutionName: "", degree: "", startYear: "", endYear: "", isCurrent: false }])} className="w-full border-dashed border-2 py-8 text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10">
                <Plus className="h-4 w-4 mr-2" /> Add Education
              </Button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 animate-fade-in py-2">
            {renderFeedback('certifications')}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Certifications</h2>
              <p className="text-sm text-gray-500 mt-1">Highlight relevant certifications to stand out.</p>
            </div>
            <div className="space-y-6">
              {certifications.map((cert, idx) => (
                <Card key={cert.id} className="relative bg-white shadow-sm border-gray-200">
                  <CardContent className="p-5 space-y-4">
                    {certifications.length > 1 && (
                      <button onClick={() => setCertifications(prev => prev.filter(c => c.id !== cert.id))} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4 pr-6">
                      <div className="space-y-2">
                        <Label>Certification Name</Label>
                        <Input value={cert.certificationName} onChange={e => { const updated = [...certifications]; updated[idx].certificationName = e.target.value; setCertifications(updated); }} placeholder="e.g. AWS Cloud Practitioner" />
                      </div>
                      <div className="space-y-2">
                        <Label>Issuing Organization</Label>
                        <Input value={cert.issuer} onChange={e => { const updated = [...certifications]; updated[idx].issuer = e.target.value; setCertifications(updated); }} placeholder="e.g. Amazon Web Services" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Year Obtained</Label>
                        <Input type="number" value={cert.yearObtained} onChange={e => { const updated = [...certifications]; updated[idx].yearObtained = e.target.value; setCertifications(updated); }} placeholder="YYYY" />
                      </div>
                      <div className="space-y-2">
                        <Label>Credential Link (Optional)</Label>
                        <Input value={cert.fileUrl} onChange={e => { const updated = [...certifications]; updated[idx].fileUrl = e.target.value; setCertifications(updated); }} placeholder="https://..." />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" type="button" onClick={() => setCertifications([...certifications, { id: Date.now().toString(), certificationName: "", issuer: "", yearObtained: "", fileUrl: "" }])} className="w-full border-dashed border-2 py-8 text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10">
                <Plus className="h-4 w-4 mr-2" /> Add Certification
              </Button>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6 animate-fade-in py-2">
            {renderFeedback('references')}
             <div>
              <h2 className="text-xl font-semibold text-gray-900">References</h2>
              <p className="text-sm text-gray-500 mt-1">Provide contact info for professional references. (Minimum 1 valid reference required)</p>
            </div>
            <div className="space-y-6">
              {references.map((ref, idx) => (
                <Card key={ref.id} className="relative bg-white shadow-sm border-gray-200">
                  <CardContent className="p-5 space-y-4">
                    {references.length > 1 && (
                      <button onClick={() => setReferences(prev => prev.filter(r => r.id !== ref.id))} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4 pr-6">
                      <div className="space-y-2">
                        <Label>Reference Name</Label>
                        <Input value={ref.name} onChange={e => { const updated = [...references]; updated[idx].name = e.target.value; setReferences(updated); }} placeholder="e.g. Jane Smith" />
                      </div>
                      <div className="space-y-2">
                        <Label>Company & Role</Label>
                        <Input value={ref.company} onChange={e => { const updated = [...references]; updated[idx].company = e.target.value; setReferences(updated); }} placeholder="e.g. Director at TechCo" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={ref.email} onChange={e => { const updated = [...references]; updated[idx].email = e.target.value; setReferences(updated); }} placeholder="jane@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number (Optional)</Label>
                        <Input value={ref.phone} onChange={e => { const updated = [...references]; updated[idx].phone = e.target.value; setReferences(updated); }} placeholder="+1 (555) 000-0000" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" type="button" onClick={() => setReferences([...references, { id: Date.now().toString(), name: "", company: "", email: "", phone: "" }])} className="w-full border-dashed border-2 py-8 text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10">
                <Plus className="h-4 w-4 mr-2" /> Add Reference
              </Button>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-8 animate-fade-in py-2">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>
              <p className="text-sm text-gray-500 mt-1">Please review your information before submitting for vetting.</p>
            </div>

            <div className="space-y-6">
              <section className="space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-gray-800">Basic Information</h3>
                  <button onClick={() => setCurrentStep(1)} className="text-sm text-brand-primary hover:underline font-medium">Edit</button>
                </div>
                <div className="grid grid-cols-2 text-sm gap-y-2">
                  <span className="text-gray-500">Name:</span> <span>{formData.firstName} {formData.lastName}</span>
                  <span className="text-gray-500">Email:</span> <span>{formData.email}</span>
                  <span className="text-gray-500">Location:</span> <span>{formData.country || 'Not provided'} ({formData.timezone || 'No timezone'})</span>
                </div>
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-gray-800">Professional Details</h3>
                  <button onClick={() => setCurrentStep(2)} className="text-sm text-brand-primary hover:underline font-medium">Edit</button>
                </div>
                <div className="grid grid-cols-2 text-sm gap-y-2">
                  <span className="text-gray-500">Primary Role:</span> <span className="capitalize">{formData.primaryRole.replace('_', ' ')}</span>
                  <span className="text-gray-500">Experience:</span> <span>{formData.yearsOfExperience} years</span>
                  <span className="text-gray-500">Availability:</span> <span className="capitalize">{formData.availability.replace('_', ' ')}</span>
                </div>
              </section>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
               <div className="flex items-start gap-3">
                  <Checkbox id="confirm-accuracy" className="mt-1" defaultChecked />
                  <Label htmlFor="confirm-accuracy" className="text-sm font-medium leading-relaxed cursor-pointer">
                    I confirm this information is accurate and authorize Taskive Connect to verify my professional background.
                  </Label>
               </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 pt-6">
      
      {/* Small Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Professional Profile Setup</h1>
        <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
           <span className="text-sm font-medium text-brand-primary">Step {currentStep} of {STEPS.length}</span>
           <span className="text-sm text-gray-400">&bull;</span>
           <span className="text-sm text-gray-500">{STEPS[currentStep - 1].title}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 relative">
        {/* Left: Vertical Stepper */}
        <div className="w-full md:w-56 shrink-0 relative">
          <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 md:gap-0 md:sticky md:top-6 pb-4 md:pb-0 scrollbar-none snap-x">
             {/* Vertical line connector (desktop only) */}
             <div className="hidden md:block absolute left-4 top-4 bottom-8 w-0.5 bg-gray-100 -z-10" />

             {STEPS.map((step, index) => {
               const isCompleted = currentStep > step.id;
               const isActive = currentStep === step.id;
               return (
                 <div key={step.id} className={clsx("flex items-center md:items-start gap-4 snap-start shrink-0", index !== STEPS.length - 1 && "md:pb-8")}>
                   <div className={clsx(
                     "h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors z-10",
                     isCompleted ? "bg-brand-primary border-brand-primary text-white" :
                     isActive ? "bg-white border-brand-primary text-brand-primary" :
                     "bg-white border-gray-200 text-gray-400"
                   )}>
                     {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step.id}
                   </div>
                   <div className="hidden md:block pt-1.5">
                     <p className={clsx("text-sm font-medium transition-colors", isActive ? "text-gray-900" : isCompleted ? "text-gray-700" : "text-gray-400")}>
                       {step.title}
                     </p>
                   </div>
                   {/* Mobile step label */}
                   <div className="md:hidden pr-4 pt-1">
                      <p className={clsx("text-sm font-medium whitespace-nowrap", isActive ? "text-gray-900" : isCompleted ? "text-gray-700" : "text-gray-400")}>
                         {step.title}
                      </p>
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Right: Active Step Form */}
        <div className="flex-1 min-w-0">
          <div className="bg-white md:border md:border-gray-200 md:rounded-xl md:shadow-sm md:p-8">
             {renderStepContent()}
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <Button variant="ghost" onClick={prevStep} disabled={currentStep === 1} className="text-gray-500 hover:text-gray-900">
               <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div className="flex items-center gap-4">
              {savingDraft && <span className="text-xs text-gray-400 animate-pulse">Saving draft...</span>}
              {currentStep < STEPS.length ? (
                <Button onClick={nextStep} className="shadow-sm">
                  Save & Continue <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                  {loading ? "Submitting..." : "Submit for Vetting"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalentOnboarding;
