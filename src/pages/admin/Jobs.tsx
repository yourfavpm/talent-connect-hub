import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Briefcase, Users, Calendar, Clock,
  CheckCircle, ArrowRight, XCircle, AlertCircle
} from "lucide-react";
import { sendJobPublishedEmail, sendClientJobLiveEmail } from "@/lib/email/triggers";

export default function AdminJobs() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Data states
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  
  // Filter states for All Jobs
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [jobsRes, appsRes] = await Promise.all([
        supabase.from("jobs").select(`
          *,
          clients(contact_name, company_name, profiles(email))
        `).order("created_at", { ascending: false }),
        (supabase.from("job_applications") as any).select(`
          id, job_id, status, talents(first_name, last_name)
        `)
      ]);

      if (jobsRes.error) throw jobsRes.error;
      if (appsRes.error) throw appsRes.error;

      setJobs(jobsRes.data || []);
      setApplications(appsRes.data || []);
    } catch (error: unknown) {
      console.error("Error fetching admin jobs data:", error);
      toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- Derived Stats ---
  const awaitingApproval = jobs.filter(j => j.status === 'submitted');
  const activeJobs = jobs.filter(j => j.status === 'published');
  
  // Apps stats per job
  const getJobMetrics = (jobId: string) => {
    const jobApps = applications.filter(a => a.job_id === jobId);
    return {
      total: jobApps.length,
      shortlisted: jobApps.filter(a => a.status === 'shortlisted').length,
      interviews: jobApps.filter(a => a.status === 'interview_scheduled').length,
      offers: jobApps.filter(a => a.status === 'offer_extended').length
    };
  };

  const jobsWithShortlists = jobs.filter(j => getJobMetrics(j.id).shortlisted > 0);
  const totalInterviewsPending = applications.filter(a => a.status === 'interview_scheduled');
  const totalOffersInProgress = applications.filter(a => a.status === 'offer_extended');

  // Priority Queues for Dashboard
  const activeJobsQueue = activeJobs.map(job => ({
    ...job,
    metrics: getJobMetrics(job.id)
  }));

  const handleApproveJob = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const job = jobs.find(j => j.id === id);
      await (supabase.from("jobs") as any).update({ status: "published", published_at: new Date().toISOString() }).eq("id", id);
      
      // Trigger Client Email
      try {
        if (job?.clients?.profiles?.email) {
          await sendClientJobLiveEmail({
            email: job.clients.profiles.email,
            contactName: job.clients.contact_name || 'there',
            jobTitle: job.title,
            jobId: id
          });
        }
      } catch (emailError) {
        console.error('Failed to send job approval email:', emailError);
      }

      toast({ title: "Job Approved & Notification Sent" });
      fetchDashboardData();
    } catch (error: unknown) {
      const err = error as Error;
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700 border-gray-200",
      submitted: "bg-amber-50 text-amber-700 border-amber-200", // Awaiting approval
      published: "bg-green-50 text-green-700 border-green-200", // Active
      filled: "bg-blue-50 text-blue-700 border-blue-200",
      closed: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      <Badge variant="outline" className={`${styles[status] || "bg-gray-100"} uppercase text-[10px] tracking-wider font-semibold whitespace-nowrap`}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.clients?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Jobs</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all hiring requests across OPSlyHR.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start h-auto p-0 rounded-none mb-6">
            <TabsTrigger 
              value="dashboard" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-medium data-[state=active]:text-gray-900 text-gray-500"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-medium data-[state=active]:text-gray-900 text-gray-500"
            >
              All Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0 outline-none space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="border-gray-100 shadow-sm bg-gray-50/30 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setStatusFilter('submitted')}>
                <CardContent className="p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Awaiting Approval</p>
                  <p className="text-2xl font-semibold text-gray-900">{awaitingApproval.length}</p>
                </CardContent>
              </Card>
              <Card className="border-gray-100 shadow-sm bg-gray-50/30 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setStatusFilter('published')}>
                <CardContent className="p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Jobs</p>
                  <p className="text-2xl font-semibold text-gray-900">{activeJobs.length}</p>
                </CardContent>
              </Card>
              <Card className="border-gray-100 shadow-sm bg-gray-50/30">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">With Shortlists</p>
                  <p className="text-2xl font-semibold text-gray-900">{jobsWithShortlists.length}</p>
                </CardContent>
              </Card>
              <Card className="border-gray-100 shadow-sm bg-gray-50/30">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Interviews Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalInterviewsPending.length}</p>
                </CardContent>
              </Card>
              <Card className="border-gray-100 shadow-sm bg-gray-50/30">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Offers In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalOffersInProgress.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Queues */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Queue 1: Awaiting Approval */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Awaiting Approval
                  </h3>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">{awaitingApproval.length}</Badge>
                </div>
                <Card className="border-gray-200 shadow-sm overflow-hidden flex-1">
                  {awaitingApproval.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">No jobs awaiting approval.</div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                      {awaitingApproval.map(job => (
                        <div key={job.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <p className="font-medium text-sm text-gray-900 truncate">{job.title}</p>
                          <p className="text-xs text-gray-500 mt-1 truncate">{job.clients?.company_name} • {job.service_model?.replace(/_/g, " ")}</p>
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-[10px] text-gray-400 uppercase">{new Date(job.created_at).toLocaleDateString()}</p>
                            <div className="flex gap-2">
                              {/* Future: Request Changes via modal or detail page */}
                              <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-gray-500 hover:text-red-600" onClick={() => navigate(`/admin/jobs/${job.id}`)}>Review</Button>
                              <Button variant="outline" size="sm" className="h-7 text-xs px-2 bg-white border-green-200 text-green-700 hover:bg-green-50" onClick={(e) => handleApproveJob(job.id, e)}>Approve</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Queue 2: Active Jobs */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                    Active Jobs
                  </h3>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">{activeJobsQueue.length}</Badge>
                </div>
                <Card className="border-gray-200 shadow-sm flex-1 overflow-hidden">
                  {activeJobsQueue.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">No active jobs.</div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                      {activeJobsQueue.map(job => (
                        <div key={job.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => navigate(`/admin/jobs/${job.id}`)}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm text-gray-900 group-hover:text-brand-primary transition-colors">{job.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{job.clients?.company_name}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 group-hover:text-brand-primary">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-4 mt-3">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 uppercase">Applicants</span>
                              <span className="text-sm font-medium text-gray-900">{job.metrics.total}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 uppercase">Shortlisted</span>
                              <span className="text-sm font-medium text-gray-900">{job.metrics.shortlisted}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Queue 3: Interviews Pending */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    Interviews Pending
                  </h3>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">{totalInterviewsPending.length}</Badge>
                </div>
                <Card className="border-gray-200 shadow-sm flex-1 overflow-hidden">
                  {totalInterviewsPending.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">No interviews pending.</div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                      {totalInterviewsPending.map(app => {
                        const job = jobs.find(j => j.id === app.job_id);
                        return (
                          <div key={app.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {app.talents?.first_name} {app.talents?.last_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 truncate">{job?.title} • {job?.clients?.company_name}</p>
                            <div className="flex justify-end mt-2">
                              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => navigate(`/admin/jobs/${app.job_id}`)}>View</Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

            </div>
          </TabsContent>

          <TabsContent value="all" className="mt-0 outline-none space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by job title or client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-gray-200"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-white border-gray-200">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Needs Approval</SelectItem>
                  <SelectItem value="published">Active</SelectItem>
                  <SelectItem value="filled">Filled</SelectItem>
                  <SelectItem value="closed">Closed / Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Main Table */}
            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                    <tr>
                      <th className="px-5 py-3">Job Title</th>
                      <th className="px-5 py-3">Client</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Apps</th>
                      <th className="px-5 py-3 text-right">Shortlist</th>
                      <th className="px-5 py-3 text-right">Intv</th>
                      <th className="px-5 py-3 text-right">Offers</th>
                      <th className="px-5 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-12 text-center text-gray-500">
                          No jobs found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job) => {
                        const metrics = getJobMetrics(job.id);
                        return (
                          <tr 
                            key={job.id} 
                            className="hover:bg-gray-50 cursor-pointer group transition-colors"
                            onClick={() => navigate(`/admin/jobs/${job.id}`)}
                          >
                            <td className="px-5 py-4 font-medium text-gray-900 group-hover:text-brand-primary">{job.title}</td>
                            <td className="px-5 py-4 text-gray-600">{job.clients?.company_name}</td>
                            <td className="px-5 py-4 text-gray-500 capitalize">{job.service_model?.replace(/_/g, " ")}</td>
                            <td className="px-5 py-4">{getStatusBadge(job.status)}</td>
                            <td className="px-5 py-4 text-right font-mono text-gray-500">{metrics.total}</td>
                            <td className="px-5 py-4 text-right font-mono text-gray-500">{metrics.shortlisted}</td>
                            <td className="px-5 py-4 text-right font-mono text-gray-500">{metrics.interviews}</td>
                            <td className="px-5 py-4 text-right font-mono text-gray-500">{metrics.offers}</td>
                            <td className="px-5 py-4 text-gray-500">
                              {new Date(job.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
