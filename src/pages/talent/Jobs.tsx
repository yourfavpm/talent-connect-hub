import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, MapPin, Clock, DollarSign, Briefcase, 
  Globe, Tag, Building2, Calendar, ArrowRight,
  ExternalLink, FileText, CheckCircle, Timer
} from "lucide-react";
import { format } from "date-fns";

const SERVICE_MODEL_LABELS: Record<string, string> = {
  direct_hire: "Direct Hire",
  trial_to_hire: "Trial to Hire",
  one_time_project: "One Time Project",
  offshore_hiring: "Offshore Hiring",
};

// Mock external roles based on requirements
const MOCK_EXTERNAL_ROLES = [
  {
    id: "ext-1",
    title: "Senior Full Stack Developer",
    site: "YCombinator Work at a Startup",
    description: "Build robust AI-powered applications for a fast-growing FinTech startup.",
    url: "#"
  },
  {
    id: "ext-2",
    title: "Product Designer (UI/UX)",
    site: "Dribbble Jobs",
    description: "Lead design initiatives across mobile and web platforms for an enterprise SaaS.",
    url: "#"
  },
  {
    id: "ext-3",
    title: "Data Engineer",
    site: "LinkedIn",
    description: "Design, construct, install, test and maintain highly scalable data management systems.",
    url: "#"
  }
];

const TalentJobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeContracts, setActiveContracts] = useState<any[]>([]);
  const [talent, setTalent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: talentData } = await supabase
        .from("talents")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      setTalent(talentData);

      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*, clients(company_name)")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      setJobs(jobsData || []);

      if (talentData) {
        const { data: appsData } = await supabase
          .from("job_applications")
          .select("*, jobs(title, clients(company_name))")
          .eq("talent_id", talentData.id)
          .order("created_at", { ascending: false });

        setApplications(appsData || []);

        const { data: contractsData } = await supabase
          .from("contracts")
          .select("id")
          .eq("talent_id", talentData.id)
          .eq("status", "active");

        setActiveContracts(contractsData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!talent || !selectedJob) return;
    setApplying(true);

    try {
      const { error } = await supabase.from("job_applications").insert({
        job_id: selectedJob.id,
        talent_id: talent.id,
        cover_letter: coverLetter,
        status: "applied",
      });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your application has been successfully sent.",
      });

      setApplyDialogOpen(false);
      setCoverLetter("");
      fetchData(); // Refresh to update status
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  const hasApplied = (jobId: string) => applications.some((app) => app.job_id === jobId);
  const getApplicationStatus = (jobId: string) => applications.find((a) => a.job_id === jobId)?.status || null;

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", NGN: "₦", KES: "KSh", ZAR: "R" };
    return symbols[currency] || "$";
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.role_needed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.required_skills?.some((skill: string) => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
      job.clients?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openJobDetail = (job: any) => {
    setSelectedJob(job);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="h-20 w-full bg-gray-100 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />)}
        </div>
        <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg mt-8" />
      </div>
    );
  }

  const interviewsScheduled = applications.filter((app) => app.status === "interview_scheduled").length;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {talent?.vetting_status !== "fully_vetted" && (
        <div className="bg-warning/10 border border-warning/20 text-warning-foreground px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-warning" />
          <span>Your profile is currently under review. Complete your vetting to unlock applying to jobs.</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Jobs</h1>
        <p className="text-sm text-gray-500 mt-1">Explore opportunities and track your applications.</p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-gray-100/80 p-1">
          <TabsTrigger value="dashboard" className="text-sm">Dashboard</TabsTrigger>
          <TabsTrigger value="taskive" className="text-sm">Taskive Jobs</TabsTrigger>
          <TabsTrigger value="external" className="text-sm">External Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-8 focus-visible:outline-none focus-visible:ring-0">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <Card className="shadow-sm border-gray-200/60">
               <CardContent className="p-5 flex items-center gap-4">
                 <div className="h-10 w-10 shrink-0 rounded-full bg-blue-50 flex items-center justify-center">
                   <Briefcase className="h-5 w-5 text-blue-600" />
                 </div>
                 <div>
                   <p className="text-sm font-medium text-gray-500">Open Taskive Jobs</p>
                   <p className="text-2xl font-semibold text-gray-900 mt-0.5">{jobs.length}</p>
                 </div>
               </CardContent>
             </Card>
             <Card className="shadow-sm border-gray-200/60">
               <CardContent className="p-5 flex items-center gap-4">
                 <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center">
                   <FileText className="h-5 w-5 text-indigo-600" />
                 </div>
                 <div>
                   <p className="text-sm font-medium text-gray-500">Applications Submitted</p>
                   <p className="text-2xl font-semibold text-gray-900 mt-0.5">{applications.length}</p>
                 </div>
               </CardContent>
             </Card>
             <Card className="shadow-sm border-gray-200/60">
               <CardContent className="p-5 flex items-center gap-4">
                 <div className="h-10 w-10 shrink-0 rounded-full bg-amber-50 flex items-center justify-center">
                   <Timer className="h-5 w-5 text-amber-600" />
                 </div>
                 <div>
                   <p className="text-sm font-medium text-gray-500">Interviews Scheduled</p>
                   <p className="text-2xl font-semibold text-gray-900 mt-0.5">{interviewsScheduled}</p>
                 </div>
               </CardContent>
             </Card>
             <Card className="shadow-sm border-gray-200/60">
               <CardContent className="p-5 flex items-center gap-4">
                 <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center">
                   <CheckCircle className="h-5 w-5 text-emerald-600" />
                 </div>
                 <div>
                   <p className="text-sm font-medium text-gray-500">Active Contracts</p>
                   <p className="text-2xl font-semibold text-gray-900 mt-0.5">{activeContracts.length}</p>
                 </div>
               </CardContent>
             </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="shadow-sm border-gray-200 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => document.querySelector<HTMLButtonElement>('[data-state="inactive"][value="taskive"]')?.click()}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center"><Search className="h-4 w-4 text-gray-600" /></div>
                       <span className="font-medium text-gray-900">Browse Taskive Jobs</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => navigate('/talent/applications')}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center"><FileText className="h-4 w-4 text-gray-600" /></div>
                       <span className="font-medium text-gray-900">View Applications</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="shadow-sm border-gray-200 overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-5 py-4">
                  <CardTitle className="text-sm font-medium text-gray-900">Recent Applications</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {applications.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {applications.slice(0, 5).map((app) => (
                        <div key={app.id} className="p-4 px-5 hover:bg-gray-50 transition-colors flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 h-2 w-2 rounded-full bg-brand-primary shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Applied to <span className="font-semibold">{app.jobs?.title}</span> at {app.jobs?.clients?.company_name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{format(new Date(app.created_at), "MMM d, yyyy")}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize text-xs text-gray-500 bg-white">
                            {app.status.replace("_", " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-gray-500">
                      No recent applications. Start browsing jobs to apply.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Promo / Info Card */}
            <div>
              <Card className="bg-gray-900 text-white border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Build your career</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Taskive provides curated opportunities matched to your skills. Keep your profile updated to increase your visibility to clients.
                  </p>
                  <Link to="/talent/profile" className="text-sm font-medium text-white hover:text-white/80 flex items-center gap-1.5 transition-colors mt-2">
                    Update Profile <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="taskive" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Taskive Jobs</h2>
              <p className="text-sm text-gray-500">Roles posted directly by Taskive clients.</p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-gray-200"
              />
            </div>
          </div>

          <div className="grid gap-3">
            {filteredJobs.length === 0 ? (
              <div className="py-16 text-center border rounded-xl bg-white border-gray-200 border-dashed">
                <Briefcase className="h-8 w-8 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">No open jobs right now.</p>
                <p className="text-sm text-gray-500">Check back later for new opportunities.</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="hover:border-gray-300 transition-colors group border-gray-200 shadow-sm bg-white"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 cursor-pointer" onClick={() => openJobDetail(job)}>
                          <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-primary transition-colors truncate">{job.title}</h3>
                          {job.service_model && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100 font-normal">
                              {SERVICE_MODEL_LABELS[job.service_model] || job.service_model.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="truncate">{job.clients?.company_name}</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                          {job.location && (
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                          )}
                          {job.duration && (
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {job.duration}</span>
                          )}
                          {job.budget_min && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" /> 
                              {getCurrencySymbol(job.preferred_currency)}{job.budget_min}-{job.budget_max}/{job.salary_type || "hr"}
                            </span>
                          )}
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Posted {format(new Date(job.published_at || job.created_at), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                         {hasApplied(job.id) ? (
                           <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 font-medium px-3 py-1 text-xs">
                             <CheckCircle className="h-3 w-3 mr-1.5" /> Applied
                           </Badge>
                         ) : (
                           <button className="text-sm font-medium text-brand-primary hover:text-brand-primary/80 flex items-center gap-1.5 transition-colors" onClick={() => openJobDetail(job)}>
                             View Job <ArrowRight className="h-4 w-4" />
                           </button>
                         )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="external" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">External Roles</h2>
            <p className="text-sm text-gray-500">Curated opportunities from external platforms.</p>
          </div>

          <div className="grid gap-3">
            {MOCK_EXTERNAL_ROLES.map((ext) => (
              <Card key={ext.id} className="border-gray-200 shadow-sm hover:border-gray-300 transition-colors bg-white">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="text-base font-semibold text-gray-900">{ext.title}</h3>
                       <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider bg-gray-50 text-gray-500 border-gray-200">
                         External Opportunity
                       </Badge>
                     </div>
                     <p className="text-sm font-medium text-brand-primary mb-2">{ext.site}</p>
                     <p className="text-sm text-gray-600 line-clamp-2 md:line-clamp-1">{ext.description}</p>
                   </div>
                   <a href={ext.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm font-medium text-brand-primary hover:text-brand-primary/80 flex items-center gap-1.5 transition-colors">
                      View Role <ExternalLink className="h-4 w-4" />
                   </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Side Drawer for Job Details */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 border-l border-gray-200 sm:rounded-l-2xl">
          {selectedJob && (
            <div className="flex flex-col h-full bg-white">
              <div className="px-6 py-8 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100 font-normal">
                    {selectedJob.status === "published" ? "Open" : "Closed"}
                  </Badge>
                  {selectedJob.work_mode && (
                    <span className="text-xs font-medium text-gray-500 capitalize">{selectedJob.work_mode}</span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{selectedJob.clients?.company_name}</span>
                  <span className="text-gray-300">•</span>
                  <MapPin className="h-4 w-4" />
                  <span>{selectedJob.location || "Remote"}</span>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-8">
                {/* Engagement Summary */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Engagement Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Service Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{selectedJob.service_model?.replace('_', ' ') || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Commitment</p>
                      <p className="text-sm font-medium text-gray-900">{selectedJob.weekly_hours ? `${selectedJob.weekly_hours} hrs/week` : 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Duration</p>
                      <p className="text-sm font-medium text-gray-900">{selectedJob.duration || 'Ongoing'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Compensation</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedJob.budget_min ? `${getCurrencySymbol(selectedJob.preferred_currency)}${selectedJob.budget_min}-${selectedJob.budget_max}/${selectedJob.salary_type || 'hr'}` : 'TBD'}
                      </p>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-gray-100 w-full" />

                {/* Overview */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Job Description</h3>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {selectedJob.responsibilities || "No description provided."}
                  </div>
                </section>

                {/* Requirements */}
                {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (
                  <>
                    <div className="h-px bg-gray-100 w-full" />
                    <section>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Requirements</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.required_skills.map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="border-t border-gray-200 p-4 bg-gray-50 shrink-0">
                {hasApplied(selectedJob.id) ? (
                  <Button disabled className="w-full bg-gray-200 text-gray-500">
                    <CheckCircle className="h-4 w-4 mr-2" /> Application Submitted
                  </Button>
                ) : (
                  <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white"
                        disabled={talent?.vetting_status !== "fully_vetted"}
                      >
                        Apply to this job
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Apply for {selectedJob.title}</DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Review your application before submitting.
                        </p>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <p className="text-sm font-medium text-gray-900">Your profile will be shared with {selectedJob.clients?.company_name}.</p>
                          <p className="text-xs text-gray-500 mt-1">Ensure your skills and experience are up to date.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="coverNote" className="text-sm font-medium text-gray-700">Cover Note (Optional)</Label>
                          <Textarea
                            id="coverNote"
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            placeholder="Briefly explain why you're a great fit..."
                            className="bg-white resize-none border-gray-200"
                            rows={4}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleApply} disabled={applying}>
                          {applying ? "Submitting..." : "Submit Application"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TalentJobs;
