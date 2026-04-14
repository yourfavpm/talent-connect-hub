import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
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
import { Check, ChevronRight, X, ArrowLeft, Briefcase, Clock, Calendar, Globe, Building2 } from "lucide-react";

const STEPS = ["Model", "Basics", "Details", "Review"];

export default function CreateHireRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    service_model: "",
    title: "",
    role_summary: "",
    responsibilities: "",
    requirements: "",
    location_preference: "",
    timezone_overlap: "",
    engagement_type: "",
    budget_type: "hourly",
    budget_min: "",
    budget_max: "",
    fixed_budget: "",
    hours_per_week: "",
  });

  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.service_model) {
        toast({ title: "Please select a service model", variant: "destructive" });
        return false;
      }
    }
    if (step === 2) {
      if (!formData.title || !formData.role_summary || !formData.responsibilities) {
        toast({ title: "Please fill in all required basic info", variant: "destructive" });
        return false;
      }
    }
    if (step === 3) {
      if (!formData.engagement_type) {
        toast({ title: "Please select an engagement format", variant: "destructive" });
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
    setSubmitting(true);
    try {
      // 1. We construct the payload for the RPC
      const payload = {
        service_model: formData.service_model,
        title: formData.title,
        role_summary: formData.role_summary,
        responsibilities: formData.responsibilities,
        requirements: formData.requirements,
        location_preference: formData.location_preference,
        timezone_overlap: formData.timezone_overlap,
        engagement_type: formData.engagement_type,
        budget_type: formData.budget_type,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        fixed_budget: formData.fixed_budget ? parseFloat(formData.fixed_budget) : null,
        hours_per_week: formData.hours_per_week ? parseInt(formData.hours_per_week) : null,
        requires_timesheets: formData.budget_type === 'hourly'
      };

      // 2. Call the RPC to create, log the event, and get the new ID
      const { data: newId, error } = await (supabase as any).rpc('hr_v2_create_request', { payload });

      if (error) throw error;

      // Automatically submit it for review too, saving an extra click
      await (supabase as any).rpc('hr_v2_submit_request', { req_id: newId });

      toast({
        title: "Hire Request Submitted",
        description: "Your request has been submitted to OPSlyHR Admins for review.",
      });

      navigate(getInternalPath(`/client/hire-requests/${newId}`));

    } catch (error: any) {
      console.error("Submission error:", error);
      toast({ title: "Failed to submit request", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-10 animate-fade-in">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-900 z-0 transition-all duration-300"
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
                  isActive ? "bg-slate-900 text-white shadow-md ring-4 ring-slate-100" 
                  : isCompleted ? "bg-slate-900 text-white" 
                  : "bg-white text-slate-300 border-2 border-slate-200"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span className={`absolute top-10 text-xs font-medium whitespace-nowrap ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-none px-4 sm:px-6 py-8 font-sans pb-32">
      {/* Header */}
      <div className="flex items-center mb-8 gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(getInternalPath("/client/hire-requests"))} className="text-slate-500 rounded-full hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Hire Request</h1>
          <p className="text-sm text-slate-500 mt-1">Submit your requirements to receive hand-picked talent matches.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
        {renderStepIndicator()}

        <div className="mt-12 min-h-[400px]">
          {/* STEP 1: SERVICE MODEL */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Select Service Model</h2>
                <p className="text-sm text-slate-500 mb-6">How would you like to structure this engagement?</p>
              </div>

              <div className="grid gap-4">
                {[
                  { id: "direct_hire", title: "Direct Hire", desc: "We source and vet the talent. You hire them directly onto your payroll.", icon: Building2 },
                  { id: "trial_to_hire", title: "Trial-to-Hire", desc: "Start with a 90-day risk-free trial period managed by OPSlyHR before deciding to hire.", icon: Clock },
                  { id: "one_time_project", title: "One-Time Project", desc: "A fixed-scope engagement managed entirely through our platform.", icon: Briefcase },
                  { id: "offshore", title: "Offshore Hiring", desc: "Source top global talent specifically for remote offshore operations.", icon: Globe }
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.service_model === type.id;
                  return (
                    <div 
                      key={type.id}
                      onClick={() => updateForm("service_model", type.id)}
                      className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                        isSelected 
                        ? "border-slate-900 bg-slate-50 shadow-sm" 
                        : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <div className={`mt-0.5 p-2 rounded-lg ${isSelected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${isSelected ? "text-slate-900" : "text-slate-700"}`}>{type.title}</h3>
                        <p className={`text-sm mt-1 leading-relaxed ${isSelected ? "text-slate-600" : "text-slate-500"}`}>{type.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-5 right-5 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: BASICS */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Role Basics</h2>
                <p className="text-sm text-slate-500 mb-6">Define the core needs for this position.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Job Title <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="e.g. Senior Operations Manager" 
                  value={formData.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  className="h-11 shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Role Summary <span className="text-red-500">*</span></Label>
                <Textarea 
                  placeholder="Brief context on what this role will achieve..." 
                  value={formData.role_summary}
                  onChange={(e) => updateForm("role_summary", e.target.value)}
                  className="min-h-[80px] shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Key Responsibilities <span className="text-red-500">*</span></Label>
                <Textarea 
                  placeholder="Day-to-day duties and expectations..." 
                  value={formData.responsibilities}
                  onChange={(e) => updateForm("responsibilities", e.target.value)}
                  className="min-h-[120px] shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Technical Requirements & Skills</Label>
                <Textarea 
                  placeholder="Specific software, tools, or methodologies required..." 
                  value={formData.requirements}
                  onChange={(e) => updateForm("requirements", e.target.value)}
                  className="min-h-[100px] shadow-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Engagement Details</h2>
                <p className="text-sm text-slate-500 mb-6">Specify how and when they will work.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Engagement Format <span className="text-red-500">*</span></Label>
                  <Select value={formData.engagement_type} onValueChange={(val) => updateForm("engagement_type", val)}>
                    <SelectTrigger className="h-11 shadow-sm">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full-time (40 hrs/wk)</SelectItem>
                      <SelectItem value="part_time">Part-time (&lt; 30 hrs/wk)</SelectItem>
                      <SelectItem value="project_based">Project-based (Milestones)</SelectItem>
                      <SelectItem value="as_needed">As Needed (Retainer)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.engagement_type === 'part_time' && (
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">Expected Hours/Week</Label>
                    <Input 
                      type="number"
                      placeholder="e.g. 20" 
                      value={formData.hours_per_week}
                      onChange={(e) => updateForm("hours_per_week", e.target.value)}
                      className="h-11 shadow-sm"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Timezone Overlap</Label>
                   <Select value={formData.timezone_overlap} onValueChange={(val) => updateForm("timezone_overlap", val)}>
                    <SelectTrigger className="h-11 shadow-sm">
                      <SelectValue placeholder="e.g. EST overlap required" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict_est">Strict EST Hours</SelectItem>
                      <SelectItem value="partial_est">Partial EST Overlap (4 hours)</SelectItem>
                      <SelectItem value="strict_pst">Strict PST Hours</SelectItem>
                      <SelectItem value="asynchronous">Fully Asynchronous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Location Preference</Label>
                  <Input 
                    placeholder="e.g. Remote US, or LATAM" 
                    value={formData.location_preference}
                    onChange={(e) => updateForm("location_preference", e.target.value)}
                    className="h-11 shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Compensation Structure</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">Budget Type</Label>
                    <Select value={formData.budget_type} onValueChange={(val) => updateForm("budget_type", val)}>
                      <SelectTrigger className="h-11 shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                        <SelectItem value="monthly">Monthly Salary</SelectItem>
                        <SelectItem value="fixed">Fixed Project Price</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.budget_type === 'fixed' ? (
                  <div className="space-y-2 max-w-xs">
                    <Label className="text-slate-700 font-semibold">Estimated Total Budget ($)</Label>
                    <Input 
                      type="number"
                      placeholder="e.g. 5000" 
                      value={formData.fixed_budget}
                      onChange={(e) => updateForm("fixed_budget", e.target.value)}
                      className="h-11 shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">Min Budget ($)</Label>
                      <Input 
                        type="number"
                        placeholder="e.g. 30" 
                        value={formData.budget_min}
                        onChange={(e) => updateForm("budget_min", e.target.value)}
                        className="h-11 shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">Max Budget ($)</Label>
                      <Input 
                        type="number"
                        placeholder="e.g. 50" 
                        value={formData.budget_max}
                        onChange={(e) => updateForm("budget_max", e.target.value)}
                        className="h-11 shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Final Review</h2>
                <p className="text-sm text-slate-500 mb-6">Verify your requirements before submitting them to our vetting team.</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-slate-200 text-slate-800 hover:bg-slate-200 border-none capitalize">{formData.service_model.replace(/_/g, ' ')}</Badge>
                    <Badge variant="outline" className="capitalize text-slate-600 border-slate-300">{formData.engagement_type.replace(/_/g, ' ')}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{formData.title}</h3>
                  <p className="text-sm text-slate-600 mt-2 italic">"{formData.role_summary}"</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 pt-4 border-t border-slate-200">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Budget Type</h4>
                    <div className="text-sm font-semibold text-slate-900 capitalize">{formData.budget_type}</div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Budget Range</h4>
                    <div className="text-sm font-semibold text-slate-900">
                      {formData.budget_type === 'fixed' 
                        ? (formData.fixed_budget ? `$${formData.fixed_budget}` : "TBD")
                        : (formData.budget_min && formData.budget_max ? `$${formData.budget_min} - $${formData.budget_max}` : "TBD")
                      }
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</h4>
                    <div className="text-sm font-semibold text-slate-900">{formData.location_preference || "Any"}</div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Timezone</h4>
                    <div className="text-sm font-semibold text-slate-900 capitalize">{formData.timezone_overlap?.replace(/_/g, ' ') || "Flexible"}</div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-start gap-4">
                <Globe className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Next Steps</h4>
                  <p className="text-sm text-amber-800/90 mt-1 leading-relaxed">
                    Once submitted, OPSlyHR administrators will review your request. We will then automatically match and shortlist the best-fitting, pre-vetted talent for you to review and interview.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            disabled={currentStep === 1 || submitting}
            className="text-slate-500 font-medium"
          >
            ← Back
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} className="bg-slate-900 text-white hover:bg-slate-800 px-8 font-medium">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="bg-brand-primary text-white hover:bg-brand-primary/90 px-8 font-medium shadow-md">
              {submitting ? "Submitting..." : "Submit Hire Request"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
