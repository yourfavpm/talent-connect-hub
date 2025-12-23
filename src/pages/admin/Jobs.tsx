import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Briefcase, CheckCircle, XCircle, Users, Eye } from "lucide-react";

const AdminJobs = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      let query = supabase
        .from("jobs")
        .select(`*, clients(company_name)`)
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
      .select(`*, talents(first_name, last_name, talent_id, vetting_status)`)
      .eq("job_id", jobId);
    setApplications(data || []);
  };

  const handleApproveJob = async (jobId: string) => {
    try {
      await supabase
        .from("jobs")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", jobId);

      toast({ title: "Job Approved", description: "Job has been published" });
      fetchJobs();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRejectJob = async (jobId: string) => {
    try {
      await supabase.from("jobs").update({ status: "closed" }).eq("id", jobId);
      toast({ title: "Job Rejected", description: "Job has been closed" });
      fetchJobs();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      published: "bg-success/10 text-success",
      filled: "bg-primary/10 text-primary",
      closed: "bg-destructive/10 text-destructive",
    };
    return <Badge className={styles[status] || "bg-muted"}>{status}</Badge>;
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
                    </div>
                    <p className="text-muted-foreground mb-2">{job.clients?.company_name}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{job.role_needed}</span>
                      <span>{job.weekly_hours} hrs/week</span>
                      {job.budget_min && job.budget_max && (
                        <span>${job.budget_min} - ${job.budget_max}/hr</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {job.status === "submitted" && (
                      <>
                        <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleApproveJob(job.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRejectJob(job.id)}>
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
                          Applications
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Applications for {selectedJob?.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          {applications.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No applications yet</p>
                          ) : (
                            applications.map((app) => (
                              <div key={app.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div>
                                  <p className="font-medium">
                                    {app.talents?.first_name} {app.talents?.last_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{app.talents?.talent_id}</p>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminJobs;
