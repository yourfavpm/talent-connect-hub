import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Briefcase,
  Clock,
  MapPin,
  DollarSign,
  Eye,
  MoreVertical,
  Globe,
  Tag,
  X,
  AlertCircle,
} from "lucide-react";

const SERVICE_MODELS = [
  { value: "direct_hire", label: "Direct Hire" },
  { value: "trial_to_hire", label: "Trial to Hire" },
  { value: "one_time_project", label: "One Time Project" },
  { value: "offshore_hiring", label: "Offshore Hiring" },
];

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "NGN", label: "NGN (₦)" },
  { value: "KES", label: "KES (KSh)" },
  { value: "ZAR", label: "ZAR (R)" },
];

const WORK_MODES = [
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "Onsite" },
  { value: "hybrid", label: "Hybrid" },
];

const SALARY_TYPES = [
  { value: "hourly", label: "Hourly" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const Jobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    role_needed: "",
    service_model: "",
    engagement_type: "",
    work_mode: "",
    location: "",
    preferred_currency: "USD",
    salary_type: "hourly",
    budget_min: "",
    budget_max: "",
    weekly_hours: "",
    duration: "",
    experience_required: "",
    required_skills: [] as string[],
    responsibilities: "",
    special_notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchClientAndJobs();
    }
  }, [user]);

  const fetchClientAndJobs = async () => {
    try {
      // Get client record
      const { data: clientData } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (clientData) {
        setClientId(clientData.id);

        // Fetch jobs for this client
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("*")
          .eq("client_id", clientData.id)
          .order("created_at", { ascending: false });

        setJobs(jobsData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast({
        title: "Complete Onboarding",
        description: "Please complete your company onboarding first to post jobs.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("jobs").insert({
        client_id: clientId,
        title: formData.title,
        role_needed: formData.role_needed,
        service_model: formData.service_model,
        engagement_type: formData.engagement_type as "full_time" | "part_time" | null,
        work_mode: formData.work_mode,
        location: formData.location,
        preferred_currency: formData.preferred_currency,
        salary_type: formData.salary_type,
        budget_min: parseFloat(formData.budget_min) || null,
        budget_max: parseFloat(formData.budget_max) || null,
        weekly_hours: parseInt(formData.weekly_hours) || null,
        duration: formData.duration,
        experience_required: parseInt(formData.experience_required) || null,
        required_skills: formData.required_skills,
        responsibilities: formData.responsibilities,
        special_notes: formData.special_notes,
        status: "submitted",
      });

      if (error) throw error;

      setDialogOpen(false);
      setFormData({
        title: "",
        role_needed: "",
        service_model: "",
        engagement_type: "",
        work_mode: "",
        location: "",
        preferred_currency: "USD",
        salary_type: "hourly",
        budget_min: "",
        budget_max: "",
        weekly_hours: "",
        duration: "",
        experience_required: "",
        required_skills: [],
        responsibilities: "",
        special_notes: "",
      });
      
      toast({
        title: "Job Posted Successfully",
        description: "Your job has been submitted for admin review.",
      });

      fetchClientAndJobs();
    } catch (error: any) {
      console.error("Error posting job:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to post job",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      submitted: "bg-warning/10 text-warning border-warning/20",
      under_review: "bg-primary/10 text-primary",
      approved: "bg-success/10 text-success",
      published: "bg-success/10 text-success",
      filled: "bg-primary/10 text-primary",
      closed: "bg-destructive/10 text-destructive",
    };
    return <Badge className={styles[status] || "bg-muted"}>{status.replace("_", " ")}</Badge>;
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", NGN: "₦", KES: "KSh", ZAR: "R"
    };
    return symbols[currency] || "$";
  };

  const openJobs = jobs.filter((j) => ["submitted", "under_review", "approved", "published"].includes(j.status));
  const closedJobs = jobs.filter((j) => ["filled", "closed"].includes(j.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Postings</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your job openings
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!clientId}>
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Job Posting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Senior Virtual Assistant"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role_needed">Role Category *</Label>
                    <Select
                      value={formData.role_needed}
                      onValueChange={(value) => setFormData({ ...formData, role_needed: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virtual_assistant">Virtual Assistant</SelectItem>
                        <SelectItem value="customer_support">Customer Support</SelectItem>
                        <SelectItem value="social_media_manager">Social Media Manager</SelectItem>
                        <SelectItem value="product_manager">Product Manager</SelectItem>
                        <SelectItem value="operations_manager">Operations Manager</SelectItem>
                        <SelectItem value="project_manager">Project Manager</SelectItem>
                        <SelectItem value="executive_assistant">Executive Assistant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service_model">Service Model *</Label>
                    <Select
                      value={formData.service_model}
                      onValueChange={(value) => setFormData({ ...formData, service_model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service model" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="engagement_type">Engagement Type *</Label>
                    <Select
                      value={formData.engagement_type}
                      onValueChange={(value) => setFormData({ ...formData, engagement_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full-time</SelectItem>
                        <SelectItem value="part_time">Part-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Work Mode & Location */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Work Mode & Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="work_mode">Work Mode *</Label>
                    <Select
                      value={formData.work_mode}
                      onValueChange={(value) => setFormData({ ...formData, work_mode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select work mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORK_MODES.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Lagos, Nigeria or Remote"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Compensation */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Compensation</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_currency">Currency</Label>
                    <Select
                      value={formData.preferred_currency}
                      onValueChange={(value) => setFormData({ ...formData, preferred_currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.value} value={curr.value}>
                            {curr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary_type">Salary Type</Label>
                    <Select
                      value={formData.salary_type}
                      onValueChange={(value) => setFormData({ ...formData, salary_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SALARY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weekly_hours">Weekly Hours</Label>
                    <Input
                      id="weekly_hours"
                      type="number"
                      placeholder="40"
                      value={formData.weekly_hours}
                      onChange={(e) => setFormData({ ...formData, weekly_hours: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget_min">Budget Min ({getCurrencySymbol(formData.preferred_currency)})</Label>
                    <Input
                      id="budget_min"
                      type="number"
                      placeholder="15"
                      value={formData.budget_min}
                      onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget_max">Budget Max ({getCurrencySymbol(formData.preferred_currency)})</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      placeholder="25"
                      value={formData.budget_max}
                      onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Requirements</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience_required">Years of Experience</Label>
                    <Input
                      id="experience_required"
                      type="number"
                      placeholder="3"
                      value={formData.experience_required}
                      onChange={(e) => setFormData({ ...formData, experience_required: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select
                      value={formData.duration}
                      onValueChange={(value) => setFormData({ ...formData, duration: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-3 months">1-3 months</SelectItem>
                        <SelectItem value="3-6 months">3-6 months</SelectItem>
                        <SelectItem value="6-12 months">6-12 months</SelectItem>
                        <SelectItem value="12+ months">12+ months</SelectItem>
                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <Label>Required Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill (e.g., Excel, Notion)"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddSkill}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.required_skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="gap-1">
                          {skill}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemoveSkill(skill)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Description</h3>
                <div className="space-y-2">
                  <Label htmlFor="responsibilities">Job Responsibilities *</Label>
                  <Textarea
                    id="responsibilities"
                    placeholder="Describe the main responsibilities and day-to-day tasks..."
                    rows={4}
                    value={formData.responsibilities}
                    onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_notes">Special Notes (Optional)</Label>
                  <Textarea
                    id="special_notes"
                    placeholder="Any additional requirements or preferences..."
                    rows={3}
                    value={formData.special_notes}
                    onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!clientId && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-warning/10 border border-warning/20">
          <AlertCircle className="h-5 w-5 text-warning" />
          <p className="text-sm text-warning">Complete your company onboarding to post jobs.</p>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="open" className="w-full">
        <TabsList>
          <TabsTrigger value="open" className="gap-2">
            Active
            <Badge variant="secondary" className="ml-1">
              {openJobs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-2">
            Closed
            <Badge variant="secondary" className="ml-1">
              {closedJobs.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-6">
          {openJobs.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No active jobs
              </h3>
              <p className="text-muted-foreground mb-4">
                Post your first job to start receiving talent matches
              </p>
              <Button onClick={() => setDialogOpen(true)} disabled={!clientId}>
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {openJobs.map((job, index) => (
                <div
                  key={job.id}
                  className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {job.title}
                        </h3>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        {job.role_needed && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {job.role_needed.replace("_", " ")}
                          </span>
                        )}
                        {job.work_mode && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" />
                            {job.work_mode}
                          </span>
                        )}
                        {job.weekly_hours && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {job.weekly_hours} hrs/week
                          </span>
                        )}
                        {job.budget_min && job.budget_max && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {getCurrencySymbol(job.preferred_currency || "USD")}
                            {job.budget_min} - {getCurrencySymbol(job.preferred_currency || "USD")}
                            {job.budget_max}/{job.salary_type || "hr"}
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location}
                          </span>
                        )}
                      </div>
                      {job.required_skills && job.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {job.required_skills.slice(0, 5).map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {job.required_skills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.required_skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                      {job.status === "closed" && job.rejection_reason && (
                        <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <p className="text-sm text-destructive">
                            <strong>Rejection Reason:</strong> {job.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          {closedJobs.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <Eye className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No closed jobs
              </h3>
              <p className="text-muted-foreground">
                Closed job postings will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {closedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-card rounded-xl border border-border p-6 opacity-70"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{job.title}</h3>
                    {getStatusBadge(job.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job.role_needed?.replace("_", " ")} • {job.work_mode || "Remote"}
                  </p>
                  {job.rejection_reason && (
                    <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">
                        <strong>Rejection Reason:</strong> {job.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Jobs;
