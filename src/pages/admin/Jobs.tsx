import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { JobForm } from "@/components/jobs/JobForm"; // Import
import { Plus } from "lucide-react"; // Import Plus
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Briefcase, CheckCircle, XCircle, Users, Eye, Clock, DollarSign,
  MapPin, Globe, Tag, UserPlus, Send, GraduationCap, Award, FileText
} from "lucide-react";

const SERVICE_MODEL_LABELS: Record<string, string> = {
  direct_hire: "Direct Hire",
  trial_to_hire: "Trial to Hire",
  one_time_project: "One Time Project",
  offshore_hiring: "Offshore Hiring",
};

const ROLE_LABELS: Record<string, string> = {
  virtual_assistant: "Virtual Assistant",
  customer_support: "Customer Support",
  social_media_manager: "Social Media Manager",
  product_manager: "Product Manager",
  operations_manager: "Operations Manager",
  project_manager: "Project Manager",
  executive_assistant: "Executive Assistant",
};

const AdminJobs = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [allTalents, setAllTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [jobToReject, setJobToReject] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [jobDetailOpen, setJobDetailOpen] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<any>(null);
  const [talentProfileOpen, setTalentProfileOpen] = useState(false);
  const [talentDetails, setTalentDetails] = useState<any>(null);
  const [loadingTalent, setLoadingTalent] = useState(false);
  const [talentSearchQuery, setTalentSearchQuery] = useState("");

  useEffect(() => {
    fetchJobs();
    fetchAllTalents();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      let query = supabase
        .from("jobs")
        .select(`*, clients(company_name, primary_contact_email, user_id)`)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data } = await query;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTalents = async () => {
    const { data } = await supabase
      .from("talents")
      .select("*")
      .eq("vetting_status", "fully_vetted")
      .order("created_at", { ascending: false });
    setAllTalents(data || []);
  };

  const fetchApplications = async (jobId: string) => {
    const { data } = await supabase
      .from("job_applications")
      .select(`
        *,
        talents(id, first_name, last_name, talent_id, vetting_status, primary_role, country, years_of_experience, email, phone)
      `)
      .eq("job_id", jobId);
    setApplications(data || []);
  };

  const fetchTalentDetails = async (talent: any) => {
    setLoadingTalent(true);
    try {
      const [workHistory, education, certifications, vettingRecords] = await Promise.all([
        supabase.from("talent_work_history").select("*").eq("talent_id", talent.id),
        supabase.from("talent_education").select("*").eq("talent_id", talent.id),
        supabase.from("talent_certifications").select("*").eq("talent_id", talent.id),
        supabase.from("talent_vetting").select("*").eq("talent_id", talent.id).order("level", { ascending: true }),
      ]);

      setTalentDetails({
        ...talent,
        work_history: workHistory.data || [],
        education: education.data || [],
        certifications: certifications.data || [],
        vetting: vettingRecords.data || [],
      });
    } catch (error) {
      console.error("Error fetching talent details:", error);
    } finally {
      setLoadingTalent(false);
    }
  };

  // Admin Job Creation
  const [creatingJob, setCreatingJob] = useState(false);

  const notifyMatchingTalents = async (job: any) => {
    try {
      // Find fully vetted talents with matching role
      const { data: talents } = await supabase
        .from("talents")
        .select("user_id")
        .eq("vetting_status", "fully_vetted")
        .eq("primary_role", job.role_needed);

      if (!talents || talents.length === 0) return;

      // Create notifications
      const notifications = talents.map(t => ({
        user_id: t.user_id,
        title: "New Job Match!",
        message: `A new job matching your profile "${job.title}" has been published.`,
        type: "job_alert",
        action_url: `/talent/jobs/${job.id}`,
        read: false
      }));

      await supabase.from("notifications").insert(notifications);
    } catch (error) {
      console.error("Error notifying talents:", error);
    }
  };

  const handleAdminCreateJob = async (formData: any, timeTrackingRequired: boolean) => {
    setCreatingJob(true);
    try {
      let finalSpecialNotes = formData.special_notes;
      if (timeTrackingRequired && formData.service_model !== "full_time") {
        finalSpecialNotes = `[TIME TRACKING REQUESTED] ${finalSpecialNotes || ""} `;
      }

      // 1. Create Job (published immediately)
      const { data: job, error } = await supabase.from("jobs").insert({
        title: formData.title,
        role_needed: formData.role_needed,
        service_model: formData.service_model,
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
        special_notes: finalSpecialNotes,
        status: "published",
        published_at: new Date().toISOString()
      }).select().single();

      if (error) throw error;

      // 2. Notify Matching Talents
      await notifyMatchingTalents(job);

      toast({ title: "Job Created & Published", description: "Job is live and matching talents have been notified." });
      fetchJobs();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreatingJob(false);
    }
  };

  const handleViewTalentProfile = (talent: any) => {
    setSelectedTalent(talent);
    fetchTalentDetails(talent);
    setTalentProfileOpen(true);
  };

  const handleApproveJob = async (job: any) => {
    try {
      await supabase
        .from("jobs")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", job.id);


      // Notify Client
      await supabase.from("notifications").insert({
        user_id: job.clients?.user_id,
        title: "Job Approved",
        message: `Your job posting "${job.title}" has been approved and is now live.`,
        type: "job_approved",
        action_url: "/client/jobs",
      });

      // Notify Matching Talents
      await notifyMatchingTalents(job);

      toast({ title: "Job Approved", description: "Job has been published and notifications sent." });
      fetchJobs();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openRejectDialog = (job: any) => {
    setJobToReject(job);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectJob = async () => {
    if (!jobToReject || !rejectionReason.trim()) {
      toast({ title: "Error", description: "Please provide a rejection reason", variant: "destructive" });
      return;
    }

    setRejecting(true);
    try {
      await supabase
        .from("jobs")
        .update({ status: "closed", rejection_reason: rejectionReason })
        .eq("id", jobToReject.id);

      await supabase.from("notifications").insert({
        user_id: jobToReject.clients?.user_id,
        title: "Job Rejected",
        message: `Your job posting "${jobToReject.title}" was not approved. Reason: ${rejectionReason}`,
        type: "job_rejected",
        action_url: "/client/jobs",
      });

      toast({ title: "Job Rejected", description: "Job has been closed and client notified with reason" });
      setRejectDialogOpen(false);
      setJobToReject(null);
      fetchJobs();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setRejecting(false);
    }
  };

  const handleShortlistApplication = async (appId: string) => {
    try {
      await supabase.from("job_applications").update({ status: "shortlisted" }).eq("id", appId);
      toast({ title: "Shortlisted", description: "Talent has been shortlisted" });
      if (selectedJob) fetchApplications(selectedJob.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleInviteTalentToJob = async (talentId: string, talentName: string) => {
    if (!selectedJob) return;

    try {
      // Check if already applied
      const { data: existing } = await supabase
        .from("job_applications")
        .select("id")
        .eq("job_id", selectedJob.id)
        .eq("talent_id", talentId)
        .maybeSingle();

      if (existing) {
        toast({ title: "Already Applied", description: "This talent has already applied to this job", variant: "destructive" });
        return;
      }

      await supabase.from("job_applications").insert({
        job_id: selectedJob.id,
        talent_id: talentId,
        status: "invited",
        admin_notes: "Invited by admin",
      });

      toast({ title: "Talent Invited", description: `${talentName} has been invited to apply for this job` });
      fetchApplications(selectedJob.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRequestInterview = async (appId: string, talentName: string) => {
    try {
      await supabase.from("job_applications").update({ status: "interview_scheduled" }).eq("id", appId);
      toast({ title: "Interview Requested", description: `Interview scheduled for ${talentName}` });
      if (selectedJob) fetchApplications(selectedJob.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      submitted: "bg-warning/10 text-warning",
      under_review: "bg-primary/10 text-primary",
      approved: "bg-success/10 text-success",
      published: "bg-success/10 text-success",
      filled: "bg-primary/10 text-primary",
      closed: "bg-destructive/10 text-destructive",
    };
    return <Badge className={styles[status] || "bg-muted"}>{status.replace("_", " ")}</Badge>;
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", NGN: "₦", KES: "KSh", ZAR: "R" };
    return symbols[currency] || "$";
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.clients?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTalentsForJob = allTalents.filter(
    (t) =>
      `${t.first_name} ${t.last_name}`.toLowerCase().includes(talentSearchQuery.toLowerCase()) ||
      t.talent_id?.toLowerCase().includes(talentSearchQuery.toLowerCase()) ||
      t.primary_role?.toLowerCase().includes(talentSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Job Management</h1>
        <p className="text-muted-foreground mt-1">Approve, publish, and manage job postings</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Pending Approval</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="filled">Filled</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create & Publish Job</DialogTitle>
              </DialogHeader>
              <JobForm
                onSubmit={handleAdminCreateJob}
                submitting={creatingJob}
                isClient={false}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No jobs found</p>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/admin/jobs/${job.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      {getStatusBadge(job.status)}
                      {job.service_model && (
                        <Badge variant="outline" className="text-xs">
                          {SERVICE_MODEL_LABELS[job.service_model] || job.service_model}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">{job.clients?.company_name}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {job.role_needed && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {ROLE_LABELS[job.role_needed] || job.role_needed}
                        </span>
                      )}
                      {job.work_mode && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          {job.work_mode}
                        </span>
                      )}
                      {job.budget_min && job.budget_max && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {getCurrencySymbol(job.preferred_currency || "USD")}
                          {job.budget_min} - {getCurrencySymbol(job.preferred_currency || "USD")}
                          {job.budget_max}/{job.salary_type || "hr"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    {job.status === "submitted" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleApproveJob(job)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openRejectDialog(job)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Job Posting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Rejecting: <strong>{jobToReject?.title}</strong> from {jobToReject?.clients?.company_name}
            </p>
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Rejection Reason *</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a clear reason for rejection..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRejectJob} disabled={rejecting || !rejectionReason.trim()}>
                {rejecting ? "Rejecting..." : "Reject Job"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Detail Dialog */}
      <Dialog open={jobDetailOpen} onOpenChange={setJobDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedJob?.title}
              {selectedJob && getStatusBadge(selectedJob.status)}
            </DialogTitle>
          </DialogHeader>

          {selectedJob && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Job Details</TabsTrigger>
                <TabsTrigger value="applications" className="gap-1">
                  <Users className="h-4 w-4" />
                  Applications ({applications.length})
                </TabsTrigger>
                <TabsTrigger value="browse" className="gap-1">
                  <UserPlus className="h-4 w-4" />
                  Browse Talents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Company</p>
                    <p className="font-medium">{selectedJob.clients?.company_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Service Model</p>
                    <p className="font-medium">{SERVICE_MODEL_LABELS[selectedJob.service_model] || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Work Mode</p>
                    <p className="font-medium">{selectedJob.work_mode || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedJob.location || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-medium">
                      {selectedJob.budget_min && selectedJob.budget_max
                        ? `${getCurrencySymbol(selectedJob.preferred_currency || "USD")}${selectedJob.budget_min} - ${getCurrencySymbol(selectedJob.preferred_currency || "USD")}${selectedJob.budget_max} (${selectedJob.salary_type || "hourly"})`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Experience Required</p>
                    <p className="font-medium">{selectedJob.experience_required ? `${selectedJob.experience_required}+ years` : "N/A"}</p>
                  </div>
                </div>
                {selectedJob.responsibilities && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Responsibilities</p>
                    <p className="text-sm">{selectedJob.responsibilities}</p>
                  </div>
                )}
                {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.required_skills.map((skill: string) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="applications" className="space-y-4 mt-4">
                {applications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>No applications yet</p>
                  </div>
                ) : (
                  applications.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                            onClick={() => app.talents && handleViewTalentProfile(app.talents)}
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {app.talents?.first_name?.charAt(0)}{app.talents?.last_name?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{app.talents?.first_name} {app.talents?.last_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {app.talents?.talent_id} • {ROLE_LABELS[app.talents?.primary_role] || app.talents?.primary_role}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {app.talents?.country && <span>{app.talents.country}</span>}
                                {app.talents?.years_of_experience && <span>• {app.talents.years_of_experience} yrs exp</span>}
                                <Badge variant={app.talents?.vetting_status === "fully_vetted" ? "default" : "outline"} className="text-xs">
                                  {app.talents?.vetting_status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              app.status === "shortlisted" ? "bg-success/10 text-success" :
                                app.status === "rejected" ? "bg-destructive/10 text-destructive" :
                                  app.status === "interview_scheduled" ? "bg-primary/10 text-primary" :
                                    "bg-warning/10 text-warning"
                            }>
                              {app.status}
                            </Badge>
                            {app.status === "applied" && (
                              <Button size="sm" onClick={() => handleShortlistApplication(app.id)}>
                                Shortlist
                              </Button>
                            )}
                            {app.status === "shortlisted" && (
                              <Button size="sm" variant="outline" onClick={() => handleRequestInterview(app.id, `${app.talents?.first_name}`)}>
                                <Send className="h-4 w-4 mr-1" />
                                Interview
                              </Button>
                            )}
                          </div>
                        </div>
                        {app.cover_letter && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Cover Letter:</p>
                            <p className="text-sm">{app.cover_letter}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="browse" className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search talents by name, ID, or role..."
                    value={talentSearchQuery}
                    onChange={(e) => setTalentSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {filteredTalentsForJob.map((talent) => (
                    <Card key={talent.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                            onClick={() => handleViewTalentProfile(talent)}
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {talent.first_name?.charAt(0)}{talent.last_name?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{talent.first_name} {talent.last_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {talent.talent_id} • {ROLE_LABELS[talent.primary_role] || talent.primary_role}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {talent.country && <span>{talent.country}</span>}
                                {talent.years_of_experience && <span>• {talent.years_of_experience} yrs</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTalentProfile(talent)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Profile
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleInviteTalentToJob(talent.id, `${talent.first_name} ${talent.last_name}`)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Invite
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Talent Profile Dialog */}
      <Dialog open={talentProfileOpen} onOpenChange={setTalentProfileOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {selectedTalent?.first_name?.charAt(0)}{selectedTalent?.last_name?.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedTalent?.first_name} {selectedTalent?.last_name}</h2>
                <p className="text-sm text-muted-foreground font-normal">{selectedTalent?.talent_id}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {loadingTalent ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : talentDetails && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="certs">Certifications</TabsTrigger>
                <TabsTrigger value="vetting">Vetting Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Role:</strong> {ROLE_LABELS[talentDetails.primary_role] || talentDetails.primary_role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Experience:</strong> {talentDetails.years_of_experience || 0} years</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Location:</strong> {talentDetails.country || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Timezone:</strong> {talentDetails.timezone || "N/A"}</span>
                  </div>
                </div>
                {talentDetails.secondary_skills?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {talentDetails.secondary_skills.map((skill: string) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="experience" className="space-y-4 mt-4">
                {talentDetails.work_history?.length > 0 ? (
                  talentDetails.work_history.map((work: any) => (
                    <Card key={work.id}>
                      <CardContent className="pt-4">
                        <h4 className="font-medium">{work.role_title}</h4>
                        <p className="text-sm text-primary">{work.company_name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {work.is_current ? "Current" : `${work.start_date?.slice(0, 7)} - ${work.end_date?.slice(0, 7) || "Present"}`}
                        </Badge>
                        {work.role_description && <p className="text-sm text-muted-foreground mt-2">{work.role_description}</p>}
                      </CardContent>
                    </Card>
                  ))
                ) : <p className="text-muted-foreground text-center py-8">No work history</p>}
              </TabsContent>

              <TabsContent value="education" className="space-y-4 mt-4">
                {talentDetails.education?.length > 0 ? (
                  talentDetails.education.map((edu: any) => (
                    <Card key={edu.id}>
                      <CardContent className="pt-4 flex items-start gap-3">
                        <GraduationCap className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <h4 className="font-medium">{edu.institution_name}</h4>
                          <p className="text-sm text-muted-foreground">{edu.education_level} {edu.field_of_study ? `in ${edu.field_of_study}` : ""}</p>
                          <p className="text-xs text-muted-foreground">{edu.start_year} - {edu.is_current ? "Present" : edu.end_year}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : <p className="text-muted-foreground text-center py-8">No education records</p>}
              </TabsContent>

              <TabsContent value="certs" className="space-y-4 mt-4">
                {talentDetails.certifications?.length > 0 ? (
                  talentDetails.certifications.map((cert: any) => (
                    <Card key={cert.id}>
                      <CardContent className="pt-4 flex items-start gap-3">
                        <Award className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <h4 className="font-medium">{cert.certification_name}</h4>
                          <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                          {cert.year_obtained && <p className="text-xs text-muted-foreground">Obtained: {cert.year_obtained}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : <p className="text-muted-foreground text-center py-8">No certifications</p>}
              </TabsContent>

              <TabsContent value="vetting" className="space-y-4 mt-4">
                {talentDetails.vetting?.length > 0 ? (
                  talentDetails.vetting.map((v: any) => (
                    <Card key={v.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Level {v.level}: {v.level_name}</h4>
                          <Badge className={
                            v.status === "approved" ? "bg-success/10 text-success" :
                              v.status === "rejected" ? "bg-destructive/10 text-destructive" :
                                "bg-warning/10 text-warning"
                          }>
                            {v.status}
                          </Badge>
                        </div>
                        {v.admin_notes && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Admin Notes:</p>
                            <p className="text-sm">{v.admin_notes}</p>
                          </div>
                        )}
                        {v.reviewed_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Reviewed: {new Date(v.reviewed_at).toLocaleDateString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : <p className="text-muted-foreground text-center py-8">No vetting records</p>}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobs;
