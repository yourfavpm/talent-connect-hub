import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowLeft, Briefcase, Clock, Globe, Building2, ChevronRight, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const STEPS = ["Client", "Basics", "Details", "Review"];

type ClientOption = {
  id: string;
  company_name: string;
  user_id: string;
};

export default function CreateAdminHireRequest() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedClientUserId, setSelectedClientUserId] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
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
    preferred_currency: "USD",
    salary_type: "hourly",
  });

  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({
    company_name: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [creatingClient, setCreatingClient] = useState(false);

  const handleCreateClient = async () => {
    if (!newClientData.company_name || !newClientData.email || !newClientData.password) {
      toast({ title: "Please fill in all required client fields", variant: "destructive" });
      return;
    }

    setCreatingClient(true);
    try {
      const { data: authData, error: createError } = await supabase.functions.invoke('create-user', {
        body: {
          email: newClientData.email,
          password: newClientData.password,
          role: "client",
          firstName: newClientData.first_name || newClientData.company_name,
          lastName: newClientData.last_name || "Representative"
        }
      });

      if (createError) throw createError;

      const userId = authData?.user?.id;
      if (!userId) throw new Error("No user ID returned from creation");

      const { error: clientInsertError } = await supabase
        .from("clients")
        .insert({
          user_id: userId,
          client_id: `CLI-${Date.now()}`,
          company_name: newClientData.company_name,
          primary_contact_name: `${newClientData.first_name} ${newClientData.last_name}`.trim() || newClientData.company_name,
          primary_contact_email: newClientData.email,
          status: "approved"
        });

      if (clientInsertError) throw clientInsertError;

      toast({ title: "Client Created Successfully 🎉", description: `${newClientData.company_name} account is active.` });

      const { data: allClients, error: fetchErr } = await supabase
        .from("clients")
        .select("id, company_name, user_id")
        .order("company_name", { ascending: true });

      if (!fetchErr && allClients) {
        setClients(allClients as ClientOption[]);
        const createdClient = allClients.find((c) => c.user_id === userId);
        if (createdClient) {
          setSelectedClientId(createdClient.id);
          setSelectedClientUserId(userId);
        }
      }

      setIsCreateClientOpen(false);
      setNewClientData({
        company_name: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
      });
    } catch (err: any) {
      console.error("Create client error:", err);
      toast({ title: "Failed to create client", description: err.message, variant: "destructive" });
    } finally {
      setCreatingClient(false);
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("id, company_name, user_id")
          .order("company_name", { ascending: true });

        if (error) throw error;
        setClients((data as ClientOption[]) || []);
      } catch (error: any) {
        console.error("Failed to load clients:", error);
        toast({ title: "Could not load clients", description: error.message, variant: "destructive" });
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, [toast]);

  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    setSelectedClientUserId(client?.user_id || "");
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!selectedClientId) {
        toast({ title: "Please select a client", variant: "destructive" });
        return false;
      }
      if (!formData.service_model) {
        toast({ title: "Please select a service model", variant: "destructive" });
        return false;
      }
    }
    if (step === 2) {
      if (!formData.title || !formData.role_summary || !formData.responsibilities) {
        toast({ title: "Please fill in all required role details", variant: "destructive" });
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
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const createRequest = async (publish = false) => {
    if (!selectedClientUserId) {
      toast({ title: "Select a client first", variant: "destructive" });
      return null;
    }

    setSubmitting(true);
    try {
      const payload = {
        client_user_id: selectedClientUserId,
        service_model: formData.service_model || null,
        title: formData.title || "Untitled Request",
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
        hours_per_week: formData.hours_per_week ? parseInt(formData.hours_per_week, 10) : null,
        requires_timesheets: formData.budget_type === "hourly",
        preferred_currency: formData.preferred_currency,
        salary_type: formData.salary_type,
      };

      const { data: newId, error } = await (supabase as any).rpc("hr_v2_admin_create_request", { payload });
      if (error) throw error;
      if (!newId) throw new Error("Request creation failed");

      if (publish) {
        const { error: publishError } = await supabase.rpc("hr_v2_admin_publish_request", { req_id: newId });
        if (publishError) throw publishError;
      }

      toast({
        title: publish ? "Hire request published" : "Draft created",
        description: publish
          ? "The request is now live in the talent portal."
          : "You can publish it later from the request details.",
      });

      navigate(getInternalPath(`/admin/hire-requests/${newId}`));
      return newId;
    } catch (error: any) {
      console.error("Admin create request failed:", error);
      toast({ title: "Request creation failed", description: error.message, variant: "destructive" });
      return null;
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
        />

        {STEPS.map((step, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          return (
            <div key={step} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isActive ? "bg-slate-900 text-white shadow-md ring-4 ring-slate-100" : isCompleted ? "bg-slate-900 text-white" : "bg-white text-slate-300 border-2 border-slate-200"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span className={`absolute top-10 text-xs font-medium whitespace-nowrap ${isActive ? "text-slate-900" : "text-slate-400"}`}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-none px-4 sm:px-6 py-8 font-sans pb-32">
      <div className="flex items-center mb-8 gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(getInternalPath("/admin/hire-requests"))} className="text-slate-500 rounded-full hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Hire Request</h1>
          <p className="text-sm text-slate-500 mt-1">Create a hire request on behalf of a client and publish it to the talent portal.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
        {renderStepIndicator()}

        <div className="mt-12 min-h-[400px]">
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Pick a Client</h2>
                <p className="text-sm text-slate-500 mb-6">Assign this request to an existing client account.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2 w-full max-w-md">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700 font-semibold">Client</Label>
                    <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setIsCreateClientOpen(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 p-0 h-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create New Client
                      </Button>
                      <DialogContent className="sm:max-w-md bg-white">
                        <DialogHeader>
                          <DialogTitle>Create New Client Profile</DialogTitle>
                          <DialogDescription>
                            Provision a secure client account on-the-fly to assign this hire request.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Company Name *</Label>
                            <Input
                              placeholder="e.g. Acme Corporation"
                              value={newClientData.company_name}
                              onChange={(e) => setNewClientData({ ...newClientData, company_name: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-500 uppercase">Contact First Name</Label>
                              <Input
                                placeholder="John"
                                value={newClientData.first_name}
                                onChange={(e) => setNewClientData({ ...newClientData, first_name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-500 uppercase">Contact Last Name</Label>
                              <Input
                                placeholder="Doe"
                                value={newClientData.last_name}
                                onChange={(e) => setNewClientData({ ...newClientData, last_name: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Email Address *</Label>
                            <Input
                              type="email"
                              placeholder="john@acme.com"
                              value={newClientData.email}
                              onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Password *</Label>
                            <Input
                              placeholder="Temporary password"
                              value={newClientData.password}
                              onChange={(e) => setNewClientData({ ...newClientData, password: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="ghost"
                            onClick={() => setIsCreateClientOpen(false)}
                            disabled={creatingClient}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateClient}
                            disabled={creatingClient}
                            className="bg-slate-900 text-white hover:bg-slate-800"
                          >
                            {creatingClient ? "Creating..." : "Create Client"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select value={selectedClientId} onValueChange={handleClientChange}>
                    <SelectTrigger className="h-11 shadow-sm">
                      <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select Client"} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Service Model</h3>
                  <p className="text-sm text-slate-500 mb-4">Choose the engagement style for this hire request.</p>

                  <div className="grid gap-4">
                    {[
                      { id: "direct_hire", title: "Direct Hire", desc: "Source vetted talent for direct placement.", icon: Building2 },
                      { id: "trial_to_hire", title: "Trial-to-Hire", desc: "Start with a trial engagement before hiring.", icon: Clock },
                      { id: "one_time_project", title: "One-Time Project", desc: "Deliver a fixed-scope engagement through our platform.", icon: Briefcase },
                      { id: "offshore", title: "Offshore Hiring", desc: "Hire remote talent for global teams.", icon: Globe },
                    ].map((type) => {
                      const Icon = type.icon;
                      const isSelected = formData.service_model === type.id;
                      return (
                        <div
                          key={type.id}
                          onClick={() => updateForm("service_model", type.id)}
                          className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                            isSelected ? "border-slate-900 bg-slate-50 shadow-sm" : "border-slate-100 hover:border-slate-200 bg-white"
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
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Role Basics</h2>
                <p className="text-sm text-slate-500 mb-6">Capture the key responsibilities and requirements.</p>
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

          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Engagement Details</h2>
                <p className="text-sm text-slate-500 mb-6">Specify timing, location, and compensation.</p>
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

                {formData.engagement_type === "part_time" && (
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
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flexible">Flexible</SelectItem>
                      <SelectItem value="utc">UTC / GMT</SelectItem>
                      <SelectItem value="est">EST (Eastern Standard Time - UTC-5)</SelectItem>
                      <SelectItem value="cst">CST (Central Standard Time - UTC-6)</SelectItem>
                      <SelectItem value="mst">MST (Mountain Standard Time - UTC-7)</SelectItem>
                      <SelectItem value="pst">PST (Pacific Standard Time - UTC-8)</SelectItem>
                      <SelectItem value="cet">CET (Central European Time - UTC+1)</SelectItem>
                      <SelectItem value="eet">EET (Eastern European Time - UTC+2)</SelectItem>
                      <SelectItem value="wat">WAT (West Africa Time - UTC+1)</SelectItem>
                      <SelectItem value="cat">CAT (Central Africa Time - UTC+2)</SelectItem>
                      <SelectItem value="eat">EAT (East Africa Time - UTC+3)</SelectItem>
                      <SelectItem value="ist">IST (Indian Standard Time - UTC+5:30)</SelectItem>
                      <SelectItem value="sgt">SGT (Singapore Time - UTC+8)</SelectItem>
                      <SelectItem value="aest">AEST (Australian Eastern Standard Time - UTC+10)</SelectItem>
                      <SelectItem value="nzst">NZST (New Zealand Standard Time - UTC+12)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Location Preference</Label>
                  <Input
                    placeholder="e.g. Remote US, LATAM, or Africa"
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
                    <Select value={formData.budget_type} onValueChange={(val) => {
                      updateForm("budget_type", val);
                      if (val === "hourly" || val === "monthly") {
                        updateForm("salary_type", val);
                      }
                    }}>
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

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">Salary Currency</Label>
                    <Select value={formData.preferred_currency} onValueChange={(val) => updateForm("preferred_currency", val)}>
                      <SelectTrigger className="h-11 shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="NGN">NGN (₦)</SelectItem>
                        <SelectItem value="KES">KES (KSh)</SelectItem>
                        <SelectItem value="ZAR">ZAR (R)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.budget_type !== 'fixed' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">Salary Frequency</Label>
                      <Select value={formData.salary_type} onValueChange={(val) => updateForm("salary_type", val)}>
                        <SelectTrigger className="h-11 shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {formData.budget_type === "fixed" ? (
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

          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Final Review</h2>
                <p className="text-sm text-slate-500 mb-6">Double-check the request details before publishing to talents.</p>
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
                      {(() => {
                        const sym = formData.preferred_currency === "EUR" ? "€" : formData.preferred_currency === "GBP" ? "£" : formData.preferred_currency === "NGN" ? "₦" : formData.preferred_currency === "KES" ? "KSh " : formData.preferred_currency === "ZAR" ? "R " : "$";
                        const freq = formData.budget_type === 'fixed' ? '' : (formData.salary_type === 'monthly' ? '/mo' : '/hr');
                        return formData.budget_type === 'fixed'
                          ? (formData.fixed_budget ? `${sym}${formData.fixed_budget}` : "TBD")
                          : (formData.budget_min && formData.budget_max ? `${sym}${formData.budget_min} - ${sym}${formData.budget_max}${freq}` : "TBD");
                      })()}
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

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex items-start gap-4">
                <Globe className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Ready to live publish</h4>
                  <p className="text-sm text-emerald-800/90 mt-1 leading-relaxed">
                    This request will be published immediately to the talent portal, where vetted talents can apply directly and your team can start shortlisting.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1 || submitting} className="text-slate-500 font-medium">
            ← Back
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => createRequest(false)}
              disabled={submitting || !selectedClientId}
              className="text-slate-600 font-medium"
            >
              Save as Draft
            </Button>
            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} className="bg-slate-900 text-white hover:bg-slate-800 px-8 font-medium">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => createRequest(true)} disabled={submitting || !selectedClientId} className="bg-brand-primary text-white hover:bg-brand-primary/90 px-8 font-medium shadow-md">
                {submitting ? "Publishing..." : "Publish Hire Request"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
