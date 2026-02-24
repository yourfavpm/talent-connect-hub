import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronRight, X, ArrowLeft, Briefcase, Clock, Calendar, Globe, Plus } from "lucide-react";

const STEPS = ["Basics", "Engagement", "Details", "Review"];

const CreateJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [clientId, setClientId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    responsibilities: "", // Maps to "Short description" conceptually
    location: "",
    required_skills: [] as string[],
    service_model: "",
    work_mode: "",
    duration: "",
    weekly_hours: "",
    experience_required: "",
    preferred_currency: "USD",
    salary_type: "hourly",
    budget_min: "",
    budget_max: "",
  });

  useEffect(() => {
    if (user) {
      fetchClient();
    }
  }, [user]);

  const fetchClient = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (data) setClientId(data.id);
  };

  const updateForm = (key: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
      updateForm("required_skills", [...formData.required_skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    updateForm("required_skills", formData.required_skills.filter(s => s !== skill));
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.title) {
        toast({ title: "Job Title required", variant: "destructive" });
        return false;
      }
      if (!formData.responsibilities) {
        toast({ title: "Job Description required", variant: "destructive" });
        return false;
      }
    }
    if (step === 2) {
      if (!formData.service_model) {
        toast({ title: "Please select an engagement type", variant: "destructive" });
        return false;
      }
    }
    if (step === 3) {
      if (!formData.work_mode) {
        toast({ title: "Please select a work mode", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!clientId) {
      toast({ title: "Error", description: "Client profile not found. Please complete onboarding.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // NOTE: `role_needed` represents Role Category. Removed from UI per rules.
      // Defaulting to "other" to maintain payload compatibility without breaking backend schema.
      const payload = {
        client_id: clientId,
        title: formData.title,
        role_needed: "other", // Backward compatibility fallback
        responsibilities: formData.responsibilities,
        location: formData.location || null,
        required_skills: formData.required_skills,
        service_model: formData.service_model,
        work_mode: formData.work_mode,
        duration: formData.duration || null,
        weekly_hours: formData.weekly_hours ? parseInt(formData.weekly_hours) : null,
        experience_required: formData.experience_required ? parseInt(formData.experience_required) : null,
        preferred_currency: formData.preferred_currency,
        salary_type: formData.salary_type,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        status: "submitted",
      };

      const { data, error } = await supabase.from("jobs").insert(payload).select("id").single();

      if (error) throw error;

      toast({
        title: "Job Submitted",
        description: "Your job has been submitted to Taskive for approval.",
      });

      // Redirect to the new job's detail page
      if (data?.id) {
        navigate(`/client/jobs/${data.id}`);
      } else {
        navigate("/client/jobs");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({ title: "Failed to submit job", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-10 animate-fade-in">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-100 z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-900 z-0 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        ></div>
        
        {STEPS.map((step, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          
          return (
            <div key={step} className="relative z-10 flex flex-col items-center group">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isActive ? "bg-gray-900 text-white ring-4 ring-gray-100" 
                  : isCompleted ? "bg-gray-900 text-white" 
                  : "bg-white text-gray-400 border-2 border-gray-200"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span className={`absolute top-10 text-xs font-medium whitespace-nowrap ${isActive ? "text-gray-900 shadow-sm" : "text-gray-400"}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 font-sans pb-32">
      {/* Header */}
      <div className="flex items-center mb-8 gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/client/jobs")} className="text-gray-500 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Post a New Job</h1>
          <p className="text-sm text-gray-500 mt-1">Complete the steps below to submit your requirement.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10">
        {renderStepIndicator()}

        <div className="mt-12 min-h-[400px]">
          {/* STEP 1: BASICS */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-1">Basic Information</h2>
                <p className="text-sm text-gray-500 mb-6">Start by providing the fundamental details of the role.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700">Job Title <span className="text-red-500">*</span></Label>
                <Input 
                  id="title"
                  placeholder="e.g. Senior Virtual Assistant" 
                  value={formData.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsibilities" className="text-gray-700">Job Description <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="responsibilities"
                  placeholder="Describe the day-to-day responsibilities, expectations, and goals..." 
                  value={formData.responsibilities}
                  onChange={(e) => updateForm("responsibilities", e.target.value)}
                  className="min-h-[120px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label>Required Skills</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Excel, Notion, Customer Support"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="h-11"
                  />
                  <Button type="button" variant="outline" onClick={handleAddSkill} className="h-11 px-4">
                    Add
                  </Button>
                </div>
                {formData.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    {formData.required_skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-white border-gray-200 text-gray-700 font-normal px-2.5 py-1">
                        {skill}
                        <X className="h-3 w-3 ml-1.5 cursor-pointer text-gray-400 hover:text-gray-900" onClick={() => handleRemoveSkill(skill)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-700">Location Preference (Optional)</Label>
                <Input 
                  id="location"
                  placeholder="e.g. EST Timezone, or Remote" 
                  value={formData.location}
                  onChange={(e) => updateForm("location", e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          )}

          {/* STEP 2: ENGAGEMENT */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-1">Engagement Type</h2>
                <p className="text-sm text-gray-500 mb-6">How would you like to hire this professional?</p>
              </div>

              <div className="grid gap-4">
                {[
                  { id: "full_time", title: "Direct Hire", desc: "We source and vet the talent. You hire them directly onto your payroll. 15% placement fee.", icon: Briefcase },
                  { id: "trial_to_hire", title: "Trial-to-Hire", desc: "Start with a risk-free trial period managed by Taskive before deciding to hire directly.", icon: Clock },
                  { id: "one_time_project", title: "One-Time Project", desc: "A fixed-scope engagement managed entirely through Taskive.", icon: Calendar }
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.service_model === type.id;
                  return (
                    <div 
                      key={type.id}
                      onClick={() => updateForm("service_model", type.id)}
                      className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                        isSelected 
                        ? "border-gray-900 bg-gray-50/50 shadow-sm" 
                        : "border-gray-100 hover:border-gray-200 bg-white"
                      }`}
                    >
                      <div className={`mt-0.5 p-2 rounded-lg ${isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`font-medium ${isSelected ? "text-gray-900" : "text-gray-700"}`}>{type.title}</h3>
                        <p className={`text-sm mt-1 leading-relaxed ${isSelected ? "text-gray-600" : "text-gray-500"}`}>{type.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-5 right-5 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-1">Work Details & Compensation</h2>
                <p className="text-sm text-gray-500 mb-6">Outline the structure and budget parameters.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700">Work Mode <span className="text-red-500">*</span></Label>
                  <Select value={formData.work_mode} onValueChange={(val) => updateForm("work_mode", val)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select work mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Fully Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="asynchronous">Asynchronous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Duration Specification</Label>
                   <Select value={formData.duration} onValueChange={(val) => updateForm("duration", val)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="e.g. 3-6 months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-3 months">1-3 months</SelectItem>
                      <SelectItem value="3-6 months">3-6 months</SelectItem>
                      <SelectItem value="6-12 months">6-12 months</SelectItem>
                      <SelectItem value="Ongoing">Ongoing / Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Hours per Week (Optional)</Label>
                  <Input 
                    type="number"
                    placeholder="40" 
                    value={formData.weekly_hours}
                    onChange={(e) => updateForm("weekly_hours", e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Years of Experience</Label>
                  <Input 
                    type="number"
                    placeholder="3" 
                    value={formData.experience_required}
                    onChange={(e) => updateForm("experience_required", e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Budget Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Currency</Label>
                    <Select value={formData.preferred_currency} onValueChange={(val) => updateForm("preferred_currency", val)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="NGN">NGN (₦)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Pay Type</Label>
                    <Select value={formData.salary_type} onValueChange={(val) => updateForm("salary_type", val)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Min Budget</Label>
                    <Input 
                      type="number"
                      placeholder="0.00" 
                      value={formData.budget_min}
                      onChange={(e) => updateForm("budget_min", e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Max Budget</Label>
                    <Input 
                      type="number"
                      placeholder="0.00" 
                      value={formData.budget_max}
                      onChange={(e) => updateForm("budget_max", e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-1">Review & Submit</h2>
                <p className="text-sm text-gray-500 mb-6">Confirm the details below before submitting to Taskive.</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Role Overview</h3>
                  <div className="text-base font-medium text-gray-900">{formData.title}</div>
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{formData.responsibilities}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Engagement</h3>
                    <div className="text-sm font-medium text-gray-900 capitalize">{formData.service_model.replace(/_/g, " ")}</div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Work Mode</h3>
                    <div className="text-sm font-medium text-gray-900 capitalize">{formData.work_mode}</div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Weekly Hours</h3>
                    <div className="text-sm font-medium text-gray-900">{formData.weekly_hours || "Unspecified"}</div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Location</h3>
                    <div className="text-sm font-medium text-gray-900">{formData.location || "Unspecified"}</div>
                  </div>
                </div>

                {formData.required_skills.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.required_skills.map(skill => (
                         <Badge key={skill} variant="outline" className="text-xs bg-white text-gray-600">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                <Globe className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">What happens next?</h4>
                  <p className="text-sm text-blue-700/80 mt-1 leading-relaxed">
                    By submitting this job, our platform admins will review the details to ensure they map perfectly to our talent pool. Once approved, you'll be able to receive applicants and browse matched candidates.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            disabled={currentStep === 1 || submitting}
            className="text-gray-500"
          >
            Back
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} className="bg-gray-900 text-white hover:bg-gray-800 px-8">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="bg-brand-primary text-white hover:bg-brand-primary/90 px-8">
              {submitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateJob;
