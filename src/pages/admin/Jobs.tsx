import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Briefcase, CheckCircle, XCircle, Users, Eye, Clock, DollarSign, MapPin, Globe, Tag } from "lucide-react";

const SERVICE_MODEL_LABELS: Record<string, string> = {
  direct_hire: "Direct Hire",
  trial_to_hire: "Trial to Hire",
  one_time_project: "One Time Project",
  offshore_hiring: "Offshore Hiring",
};

const AdminJobs = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [jobToReject, setJobToReject] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      let query = supabase
        .from("jobs")
        .select(`*, clients(company_name, primary_contact_email)`)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "draft" | "submitted" | "under_review" | "approved" | "published" | "filled" | "closed");
      }

      const { data } = await query;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (jobId: string) => {
    const { data } = await supabase
      .from("job_applications")
      .select(`*, talents(first_name, last_name, talent_id, vetting_status, primary_role)`)
      .eq("job_id", jobId);
    setApplications(data || []);
  };

  const handleApproveJob = async (job: any) => {
    try {
      await supabase
        .from("jobs")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", job.id);

      // Create notification for client
      await supabase.from("notifications").insert({
        user_id: job.clients?.user_id || job.client_id,
        title: "Job Approved",
        message: `Your job posting "${job.title}" has been approved and is now live.`,
        type: "job_approved",
        action_url: "/client/jobs",
      });

      toast({ title: "Job Approved", description: "Job has been published and client notified" });
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

      // Create notification for client
      await supabase.from("notifications").insert({
        user_id: jobToReject.clients?.user_id || jobToReject.client_id,
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
      await supabase
        .from("job_applications")
        .update({ status: "shortlisted" })
        .eq("id", appId);
      toast({ title: "Shortlisted", description: "Talent has been shortlisted" });
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
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", NGN: "₦", KES: "KSh", ZAR: "R"
    };
    return symbols[currency] || "$";
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.clients?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <Card key={job.id} className="hover:shadow-md transition-shadow">
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
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      {job.role_needed && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.role_needed.replace("_", " ")}
                        </span>
                      )}
                      {job.work_mode && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          {job.work_mode}
                        </span>
                      )}
                      {job.weekly_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {job.weekly_hours} hrs/week
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
                      {job.experience_required && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          {job.experience_required}+ years exp
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                      )}
                    </div>

                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.required_skills.map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {job.responsibilities && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {job.responsibilities}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className="text-xs text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      {job.status === "submitted" && (
                        <>
                          <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleApproveJob(job)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openRejectDialog(job)}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedJob(job);
                              fetchApplications(job.id);
                            }}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Apps
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Applications for {selectedJob?.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
                            {applications.length === 0 ? (
                              <p className="text-muted-foreground text-center py-4">No applications yet</p>
                            ) : (
                              applications.map((app) => (
                                <div key={app.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                  <div>
                                    <p className="font-medium">
                                      {app.talents?.first_name} {app.talents?.last_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {app.talents?.talent_id} • {app.talents?.primary_role?.replace("_", " ")}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={
                                      app.status === "shortlisted" ? "bg-success/10 text-success" :
                                      app.status === "rejected" ? "bg-destructive/10 text-destructive" :
                                      "bg-primary/10 text-primary"
                                    }>
                                      {app.status}
                                    </Badge>
                                    {app.status === "applied" && (
                                      <Button size="sm" onClick={() => handleShortlistApplication(app.id)}>
                                        Shortlist
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{job.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Company</p>
                                <p className="font-medium">{job.clients?.company_name}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Service Model</p>
                                <p className="font-medium">{SERVICE_MODEL_LABELS[job.service_model] || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Work Mode</p>
                                <p className="font-medium">{job.work_mode || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Location</p>
                                <p className="font-medium">{job.location || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Budget</p>
                                <p className="font-medium">
                                  {job.budget_min && job.budget_max
                                    ? `${getCurrencySymbol(job.preferred_currency || "USD")}${job.budget_min} - ${getCurrencySymbol(job.preferred_currency || "USD")}${job.budget_max} (${job.salary_type || "hourly"})`
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Experience Required</p>
                                <p className="font-medium">{job.experience_required ? `${job.experience_required}+ years` : "N/A"}</p>
                              </div>
                            </div>
                            {job.responsibilities && (
                              <div>
                                <p className="text-muted-foreground text-sm mb-1">Responsibilities</p>
                                <p className="text-sm">{job.responsibilities}</p>
                              </div>
                            )}
                            {job.special_notes && (
                              <div>
                                <p className="text-muted-foreground text-sm mb-1">Special Notes</p>
                                <p className="text-sm">{job.special_notes}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
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
              <p className="text-xs text-muted-foreground">
                This reason will be sent to the client in a notification.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectJob} disabled={rejecting || !rejectionReason.trim()}>
                {rejecting ? "Rejecting..." : "Reject Job"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobs;
