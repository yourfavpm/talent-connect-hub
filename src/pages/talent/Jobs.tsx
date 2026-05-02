import React, { useState, useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  ExternalLink, FileText, CheckCircle, Timer,
  AlertCircle, ChevronRight, LayoutDashboard,
  Filter, UserCircle, Settings, HelpCircle,
  XCircle, ClipboardList, Zap,
} from "lucide-react";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { FEATURES } from "@/config/features";
import { getInternalPath } from "@/utils/subdomain";


interface Job {
  id: string;
  title: string;
  role_needed: string;
  description: string;
  salary_range?: string;
  work_type?: string;
  clients: { company_name: string };
  required_skills?: string[];
  service_model?: string;
  location?: string;
  preferred_currency?: string;
  budget_min?: number;
  budget_max?: number;
  salary_type?: string;
  weekly_hours?: number;
  duration?: string;
  published_at?: string;
  created_at?: string;
  status?: string;
  updated_at?: string;
  work_mode?: string;
  responsibilities?: string[];
  job_type?: 'public' | 'internal' | 'external';
  external_url?: string;
  external_company?: string;
  salary_range?: string;
  years_of_experience?: string;
  industry?: string;
}

interface Talent {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  vetting_status: string;
  onboarding_status: string;
  current_step: number;
  profile_completion?: number;
}



interface Application {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
  jobs: { title: string, clients: { company_name: string } };
}

interface Contract {
  id: string;
}

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
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [talent, setTalent] = useState<Talent | null>(null);

  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  // V2 Hire Requests state
  const [v2Requests, setV2Requests] = useState<Record<string, unknown>[]>([]);
  const [v2Applications, setV2Applications] = useState<Record<string, unknown>[]>([]);
  const [v2ApplyNote, setV2ApplyNote] = useState("");
  const [v2ApplyingFor, setV2ApplyingFor] = useState<string | null>(null);
  const [v2ApplyDialogOpen, setV2ApplyDialogOpen] = useState(false);
  const [selectedV2Request, setSelectedV2Request] = useState<Record<string, unknown> | null>(null);
  const [isV2DrawerOpen, setIsV2DrawerOpen] = useState(false);


  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };


  const fetchData = React.useCallback(async () => {
    try {
      const { data: talentData } = await supabase
        .from("talents")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      const { data: v2Profile } = await supabase
        .from("v2_talent_profiles")
        .select("status")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (talentData) {
        setTalent({
          ...(talentData as unknown as Record<string, unknown>),
          vetting_status: v2Profile?.status || talentData.vetting_status
        });
      }




      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*, clients(company_name)")
        .in("status", ["published", "active"])
        .order("created_at", { ascending: false });

      setJobs((jobsData as unknown as Job[]) || []);

      if (talentData) {
        const { data: appsData } = await supabase
          .from("job_applications")
          .select("*, jobs(title, clients(company_name))")
          .eq("talent_id", talentData.id)
          .order("created_at", { ascending: false });

        setApplications((appsData as unknown as Application[]) || []);

        const { data: contractsData } = await supabase
          .from("contracts")
          .select("id")
          .eq("talent_id", talentData.id)
          .eq("status", "active");

        setActiveContracts((contractsData as unknown as Contract[]) || []);
      }

      // Fetch V2 Hire Requests
      if (FEATURES.hire_request_v2_enabled) {
        const { data: v2Reqs } = await supabase
          .from("hr_v2_hire_requests")
          .select("*")
          .eq("status", "published")
          .order("published_at", { ascending: false });
        setV2Requests((v2Reqs as unknown as Record<string, unknown>[]) || []);

        if (user) {
          const { data: v2Apps } = await supabase
            .from("hr_v2_applications")
            .select("*")
            .eq("talent_user_id", user.id);
          setV2Applications((v2Apps as unknown as Record<string, unknown>[]) || []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);



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
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to submit application",
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

  const openJobDetail = (job: Job) => {
    navigate(getInternalPath(`/talent/jobs/${job.id}`));
  };


  if (loading) {
    return (
      <div className="w-full p-4 md:p-8 space-y-10 animate-fade-in">
        <div className="space-y-3">
          <div className="h-8 w-48 bg-slate-100 animate-pulse rounded-md" />
          <div className="h-4 w-64 bg-slate-50 animate-pulse rounded-md" />
        </div>
        <div className="h-24 w-full bg-slate-100 animate-pulse rounded-2xl border border-slate-100" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 h-96 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
          <div className="h-96 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
        </div>
      </div>
    );
  }



  const vettingBanner = () => {
    if (!talent || talent.vetting_status === "fully_vetted" || talent.vetting_status === "approved" || talent.vetting_status === "vetted") return null;

    const config = {
      under_review: {
        bg: "bg-blue-50/50",
        border: "border-blue-100",
        accent: "bg-blue-600",
        icon: <Clock className="h-5 w-5 text-blue-600 animate-pulse" />,
        title: "Application Under Review",
        text: "Our specialized vetting team is currently analyzing your professional credentials.",
        cta: "Track Progress"
      },
      changes_requested: {
        bg: "bg-amber-50/50",
        border: "border-amber-100",
        accent: "bg-amber-600",
        icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
        title: "Action Required: Refinement Needed",
        text: "Your vetting requires minor adjustments to proceed. Please resolve the highlighted sections.",
        cta: "Resolve Now"
      },
      rejected: {
        bg: "bg-red-50/50",
        border: "border-red-100",
        accent: "bg-red-600",
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        title: "Vetting Declined",
        text: "Your profile did not meet our current requirements. Please contact support for details.",
        cta: "Contact Support"
      }
    };

    const status = (talent.vetting_status || "under_review") as keyof typeof config;
    const current = config[status] || config.under_review;

    return (
      <div className={clsx("relative flex flex-col md:flex-row md:items-center justify-between gap-6 px-10 py-7 rounded-[32px] border overflow-hidden animate-in fade-in slide-in-from-top-2", current.bg, current.border)}>
        <div className={clsx("absolute left-0 top-0 h-full w-2", current.accent)} />
        <div className="flex items-start gap-5">
           <div className={clsx("h-12 w-12 rounded-2xl flex items-center justify-center border shrink-0 bg-white shadow-sm", current.border)}>
             {current.icon}
           </div>
           <div className="space-y-1">
             <h3 className="text-[16px] font-bold text-slate-900">{current.title}</h3>
             <p className="text-[13px] text-slate-500 font-medium max-w-[500px] leading-relaxed italic">{current.text}</p>
           </div>
        </div>
        <Button className={clsx("h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg", 
          status === 'under_review' ? "bg-white border-slate-200 border text-slate-900 hover:bg-slate-50 shadow-slate-200/20" : 
          status === 'changes_requested' ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/10" :
          "bg-red-600 hover:bg-red-700 text-white shadow-red-500/10"
        )} onClick={() => status === 'under_review' ? setTab('dashboard') : navigate('/talent/onboarding')}>
          {current.cta}
        </Button>
      </div>
    );
  };


  const interviewsScheduled = applications.filter((app) => app.status === "interview_scheduled").length;

  return (
    <div className="w-full p-4 md:p-8 space-y-10 animate-fade-in min-h-[calc(100vh-100px)]">
      
      {/* ── Page Header Strip ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">Jobs</h1>
          <p className="text-[15px] text-slate-500 font-medium">Explore opportunities and track your applications.</p>
        </div>
        
        {/* Compact Tab Switcher (Pill Style) */}
        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-100 overflow-x-auto">
           {[
             { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
             { id: "opslyhr", label: FEATURES.hire_request_v2_enabled ? "Hire Requests" : "OPSlyHR Jobs", icon: FEATURES.hire_request_v2_enabled ? ClipboardList : Briefcase },
             { id: "external", label: "External Roles", icon: Globe }
           ].map((tab) => (
             <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-widest transition-all rounded-lg whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
             >
               <tab.icon className="h-3.5 w-3.5" />
               {tab.label}
               {tab.id === "opslyhr" && FEATURES.hire_request_v2_enabled && v2Requests.length > 0 && (
                 <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-1.5 rounded-md">{v2Requests.length}</span>
               )}
             </button>
           ))}
        </div>
      </div>

      {vettingBanner()}

      <Tabs value={activeTab} className="space-y-10">
        <TabsContent value="dashboard" className="space-y-12 m-0 focus-visible:outline-none">
          
          {/* KPI Strip (Unified Row) */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
              {[
                { 
                  label: "Open Jobs", 
                  value: jobs.length + (FEATURES.hire_request_v2_enabled ? v2Requests.length : 0), 
                  icon: Briefcase, 
                  color: "text-blue-600" 
                },
                { 
                  label: "Applied", 
                  value: applications.length + (FEATURES.hire_request_v2_enabled ? v2Applications.length : 0), 
                  icon: FileText, 
                  color: "text-indigo-600" 
                },
                { 
                  label: "Interviews", 
                  value: interviewsScheduled, 
                  icon: Timer, 
                  color: "text-amber-600" 
                },
                { 
                  label: "Active Contracts", 
                  value: activeContracts.length, 
                  icon: CheckCircle, 
                  color: "text-emerald-600" 
                }
              ].map((kpi, i) => (
                <div key={i} className="px-8 py-7 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{kpi.value}</p>
                  </div>
                  <kpi.icon className={clsx("h-6 w-6 opacity-20", kpi.color)} />
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-4">
            <Button 
              onClick={() => setTab("opslyhr")}
              className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98]"
            >
              Browse OPSlyHR Jobs
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/talent/applications')}
              className="h-12 px-8 border-slate-200 text-slate-600 text-[12px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              View Applications
            </Button>
          </div>

          {/* 2-Column Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Recent Activity */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Recent Activity</h3>
                <button className="text-[12px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors">View All</button>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                {(() => {
                  const activities = [
                    ...applications.map(app => ({
                      id: app.id,
                      type: 'application',
                      title: 'Applied for',
                      jobTitle: app.jobs?.title,
                      clientName: app.jobs?.clients?.company_name,
                      date: app.created_at,
                      status: app.status
                    })),
                    ...v2Requests.map(req => ({
                      id: (req as any).id,
                      type: 'job_posted',
                      title: 'New Job Posted',
                      jobTitle: (req as any).title,
                      clientName: 'OPSlyHR Partner',
                      date: (req as any).published_at || (req as any).created_at,
                      status: 'Open'
                    })),
                    ...jobs.filter(j => j.job_type === 'external').map(job => ({
                      id: job.id,
                      type: 'external_job',
                      title: 'Partner Role:',
                      jobTitle: job.title,
                      clientName: job.external_company,
                      date: job.published_at || job.created_at,
                      status: 'External'
                    }))
                  ].sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime()).slice(0, 5);

                  return activities.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {activities.map((activity) => (
                        <div key={activity.id} className="group p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => activity.type === 'job_posted' ? setTab('opslyhr') : navigate('/talent/applications')}>
                          <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-600 transition-all border border-transparent group-hover:border-slate-100">
                               {activity.type === 'application' ? <FileText className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                            </div>
                            <div className="space-y-1">
                               <div className="text-[14px] font-bold text-slate-900">
                                 {activity.title} <span className="text-blue-600">{activity.jobTitle}</span>
                               </div>
                               <div className="flex items-center gap-2 text-[12px] text-slate-500">
                                 <span className="font-medium text-slate-400">{activity.clientName}</span>
                                 <span className="h-1 w-1 rounded-full bg-slate-300" />
                                 <span>{activity.date ? format(new Date(activity.date as string), "MMM d, yyyy") : 'Recently'}</span>
                               </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className={clsx("text-[10px] font-bold px-3 py-1 tracking-wider uppercase", activity.type === 'job_posted' ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-slate-500 bg-white border-slate-200/60")}>
                              {(activity.status as string).replace("_", " ")}
                            </Badge>

                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-24 text-center space-y-4">
                      <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Briefcase className="h-8 w-8 text-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[15px] font-bold text-slate-900">No activity yet</p>
                        <p className="text-[13px] text-slate-500 max-w-[240px] mx-auto italic">Start applying to jobs to track your professional journey.</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* Right Column: Next Steps */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-[16px] font-bold text-slate-900 tracking-tight px-1 text-center">Next Steps</h3>
              
              <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 space-y-8">
                <div className="space-y-6">
                  {[
                    { label: "Complete Profile", done: !!talent?.profile_completion && talent.profile_completion >= 100, sub: "Details & Work History" },
                    { label: "Submit Vetting", done: talent?.vetting_status === "fully_vetted", sub: "ID & Documentation" },
                    { label: "Set Availability", done: false, sub: "Define your work schedule" },
                    { label: "Update Skills", done: true, sub: "Improve your match score" }
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className={clsx(
                        "h-6 w-6 rounded-full flex items-center justify-center shrink-0 border mt-0.5",
                        step.done ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-300"
                      )}>
                        {step.done ? <CheckCircle className="h-4 w-4" /> : <div className="h-2 w-2 rounded-full bg-slate-100" />}
                      </div>
                      <div className="space-y-0.5">
                        <p className={clsx("text-[13px] font-bold leading-none", step.done ? "text-slate-900" : "text-slate-400")}>{step.label}</p>
                        <p className="text-[11px] text-slate-500">{step.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-2">
                   <Button variant="outline" className="w-full h-11 border-slate-200 text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:bg-white hover:text-slate-900 rounded-xl transition-all shadow-sm">
                     Go to My Profile
                   </Button>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>


        <TabsContent value="opslyhr" className="space-y-8 m-0 focus-visible:outline-none">
          {FEATURES.hire_request_v2_enabled ? (
            /* ── V2 Hire Requests (replaces legacy Taskive Jobs) ── */
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div>
                  <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">OPSlyHR Hire Requests</h2>
                  <p className="text-[14px] text-slate-500">Hiring requests from verified enterprise clients.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search requests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:ring-0 focus:border-slate-900 text-[13px] shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                {v2Requests.filter(r => r.title?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <div className="py-32 text-center space-y-4">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <ClipboardList className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[15px] font-bold text-slate-900">No hire requests available</p>
                      <p className="text-[13px] text-slate-500 max-w-[280px] mx-auto italic">New requests from clients will appear here once published.</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100/50">
                    {v2Requests.filter(r => r.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((req) => {
                      const alreadyApplied = v2Applications.some(a => a.hire_request_id === req.id);
                      const isVetted = talent && ["fully_vetted", "approved", "vetted"].includes(talent.vetting_status);
                      return (
                        <div
                          key={req.id}
                          onClick={() => { navigate(getInternalPath(`/talent/jobs/${req.id}`)); }}
                          className="group px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all cursor-pointer"
                        >
                          <div className="flex-1 min-w-0 space-y-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{req.title}</h3>
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border-blue-200/60 px-2 py-0.5">
                                  {req.service_model?.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                              <p className="text-[13px] text-slate-500 line-clamp-2">{req.role_summary}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                              {req.engagement_type && (
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                  <Clock className="h-3.5 w-3.5" /><span className="text-slate-900 capitalize">{req.engagement_type.replace(/_/g, ' ')}</span>
                                </div>
                              )}
                              {req.location_preference && (
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                  <MapPin className="h-3.5 w-3.5" /><span className="text-slate-900">{req.location_preference}</span>
                                </div>
                              )}
                              {req.budget_min && req.budget_max && (
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                  <DollarSign className="h-3.5 w-3.5" /><span className="text-slate-900">${req.budget_min} - ${req.budget_max}</span>
                                </div>
                              )}
                              {req.published_at && (
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                  <Calendar className="h-3.5 w-3.5" /><span className="text-slate-500">Published {format(new Date(req.published_at), "MMM d, yyyy")}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
                            {alreadyApplied ? (
                              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
                                <CheckCircle className="h-3.5 w-3.5" /> Applied
                              </div>
                            ) : !isVetted ? (
                              <div className="text-[11px] text-slate-400 italic">Complete vetting to apply</div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setV2ApplyingFor(req.id); setV2ApplyDialogOpen(true); }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-900 text-slate-600 hover:text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border border-slate-100 hover:border-slate-900 shadow-sm active:scale-[0.98]"
                              >
                                Apply Now <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── Legacy Taskive Jobs ── */
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div>
                  <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Available Positions</h2>
                  <p className="text-[14px] text-slate-500">Roles posted directly by OPSlyHR partners.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search roles, skills, or companies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:ring-0 focus:border-slate-900 text-[13px] shadow-sm"
                    />
                  </div>
                  <Button variant="outline" className="h-11 px-4 border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                {filteredJobs.length === 0 ? (
                  <div className="py-32 text-center space-y-4">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <Briefcase className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[15px] font-bold text-slate-900">No open jobs found</p>
                      <p className="text-[13px] text-slate-500 max-w-[280px] mx-auto italic">Check back frequently for new opportunities matching your profile.</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100/50">
                    {filteredJobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => openJobDetail(job)}
                        className="group px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all cursor-pointer relative"
                      >
                        <div className="flex-1 min-w-0 space-y-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{job.title}</h3>
                              {job.service_model && (
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-slate-50 text-slate-500 border-slate-200/60 transition-colors group-hover:bg-white px-2 py-0.5">
                                  {SERVICE_MODEL_LABELS[job.service_model] || job.service_model.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                              <span className="text-slate-400">{job.clients?.company_name}</span>
                              <span className="h-1 w-1 rounded-full bg-slate-300" />
                              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-300" /> {job.location || "Remote"}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span className="text-slate-900">{getCurrencySymbol(job.preferred_currency)}{job.budget_min}-{job.budget_max}</span>
                              <span className="opacity-60">/{job.salary_type || "hr"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              <Timer className="h-3.5 w-3.5" /><span className="text-slate-900">{job.weekly_hours || "40"} hrs/week</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              <Calendar className="h-3.5 w-3.5" /><span className="text-slate-900">{job.duration || "Ongoing"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              <Clock className="h-3.5 w-3.5" /><span className="text-slate-500">Posted {format(new Date(job.published_at || job.created_at), "MMM d, yyyy")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
                           {hasApplied(job.id) ? (
                             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
                               <CheckCircle className="h-3.5 w-3.5" /> Applied
                             </div>
                           ) : (
                             <button className="flex items-center gap-2 group/btn px-5 py-2.5 bg-slate-50 hover:bg-slate-900 text-slate-600 hover:text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border border-slate-100 hover:border-slate-900 shadow-sm active:scale-[0.98]">
                               View Role <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                             </button>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>


        <TabsContent value="external" className="space-y-8 m-0 focus-visible:outline-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
            <div>
              <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">External Roles</h2>
              <p className="text-[14px] text-slate-500">Opportunities aggregated from partner platforms.</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search external roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:ring-0 focus:border-slate-900 text-[13px] shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            {jobs.filter(j => j.job_type === 'external' && j.title?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="py-32 text-center space-y-4">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Globe className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-[15px] font-bold text-slate-900">No external roles available</p>
                  <p className="text-[13px] text-slate-500 max-w-[280px] mx-auto italic">New external opportunities will appear here soon.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100/50">
                {jobs.filter(j => j.job_type === 'external' && j.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((ext) => (
                  <div 
                    key={ext.id} 
                    className="group px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all"
                  >
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{ext.title}</h3>
                          <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border-transparent px-2 py-0.5">
                            External Role
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            <Building2 className="h-3.5 w-3.5" /> <span className="text-slate-900">{ext.external_company}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            <MapPin className="h-3.5 w-3.5 text-slate-300" /> <span className="text-slate-900">{ext.location || "Remote"}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            <Tag className="h-3.5 w-3.5" /> 
                            <span className="text-slate-500">Industry:</span> 
                            <span className="text-slate-900">{ext.industry || "Not specified"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            <Zap className="h-3.5 w-3.5 text-amber-500" /> 
                            <span className="text-slate-500">Experience:</span> 
                            <span className="text-slate-900">{ext.years_of_experience || "Not specified"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> 
                            <span className="text-slate-500">Salary:</span> 
                            <span className="text-slate-900">{ext.salary_range || "Not specified"}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[13px] text-slate-500 line-clamp-2 italic">{ext.responsibilities || "Apply via the external platform to view full details and requirements for this role."}</p>
                    </div>
                    <div className="shrink-0">
                      <Button 
                        asChild
                        className="h-11 px-6 bg-white border border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm group/btn"
                      >
                        <a href={ext.external_url} target="_blank" rel="noopener noreferrer">
                          Apply on Company Site
                          <ExternalLink className="h-3.5 w-3.5 ml-2 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
                     <div className="flex items-center gap-3">
                       <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{ext.title}</h3>
                       <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-slate-50 text-slate-500 border-slate-200/60 transition-colors group-hover:bg-white px-2 py-0.5">
                         Aggregated
                       </Badge>
                     </div>
                     <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
                       <span className="text-indigo-600 font-bold">{ext.site}</span>
                       <span className="h-1 w-1 rounded-full bg-slate-200" />
                       <p className="line-clamp-1 italic">{ext.description}</p>
                     </div>
                   </div>
                   <a 
                    href={ext.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 group/btn px-5 py-2.5 bg-slate-50 hover:bg-slate-900 text-slate-600 hover:text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border border-slate-100 hover:border-slate-900 shadow-sm active:scale-[0.98]"
                   >
                      Apply External
                      <ExternalLink className="h-3.5 w-3.5" />
                   </a>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

      </Tabs>

      {/* Side Drawer for Job Details */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 border-l border-slate-100 sm:rounded-l-[32px] shadow-2xl">
          {selectedJob && (
            <div className="flex flex-col h-full bg-white relative">
              
              {/* Header / Banner */}
              <div className="px-10 py-12 border-b border-slate-50 space-y-6">
                <div className="flex items-center justify-between">
                  <Badge className="bg-slate-900 text-white hover:bg-slate-900 px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg">
                    {selectedJob.status === "published" ? "Open Position" : "Closed"}
                  </Badge>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Updated {format(new Date(selectedJob.updated_at), "MMM d")}
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-[32px] font-bold text-slate-900 tracking-tight leading-tight">{selectedJob.title}</h2>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Partner</p>
                        <p className="text-[14px] font-bold text-slate-900">{selectedJob.clients?.company_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Location</p>
                        <p className="text-[14px] font-bold text-slate-900">{selectedJob.location || "Remote"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="flex-1 px-10 py-10 space-y-12">
                
                {/* Key Benefits Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   {[
                     { label: "Compensation", val: `${getCurrencySymbol(selectedJob.preferred_currency)}${selectedJob.budget_min}-${selectedJob.budget_max}/${selectedJob.salary_type || "hr"}`, icon: DollarSign },
                     { label: "Commitment", val: `${selectedJob.weekly_hours} hrs/week`, icon: Timer },
                     { label: "Work Mode", val: selectedJob.work_mode || "Remote", icon: Globe }
                   ].map((item, i) => (
                     <div key={i} className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-2 group hover:bg-white hover:shadow-md transition-all">
                       <item.icon className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                       <div className="space-y-0.5">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                         <p className="text-[13px] font-bold text-slate-900 truncate">{item.val}</p>
                       </div>
                     </div>
                   ))}
                </div>

                <div className="space-y-10">
                  <section className="space-y-4">
                    <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-blue-600 pl-4 py-1">Role Description</h3>
                    <p className="text-[15px] text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                      {selectedJob.description}
                    </p>
                  </section>

                  {selectedJob.responsibilities && (
                    <section className="space-y-4">
                      <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-slate-200 pl-4 py-1">Responsibilities</h3>
                      <div className="space-y-3">
                        {Array.isArray(selectedJob.responsibilities) ? selectedJob.responsibilities.map((resp: string, i: number) => (
                          <div key={i} className="flex gap-3 text-[14px] text-slate-600 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                            <span>{resp}</span>
                          </div>
                        )) : (
                          <p className="text-[14px] text-slate-600 font-medium">{selectedJob.responsibilities}</p>
                        )}
                      </div>
                    </section>
                  )}

                  {selectedJob.required_skills && (
                    <section className="space-y-4">
                      <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-slate-200 pl-4 py-1">Required Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.required_skills.map((skill: string, i: number) => (
                          <Badge key={i} variant="outline" className="bg-white border-slate-200 text-slate-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="sticky bottom-0 left-0 w-full p-8 bg-white/80 backdrop-blur-md border-t border-slate-100 flex items-center justify-between gap-6 z-20">
                <div className="hidden sm:block">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Position Score</p>
                  <p className="text-[14px] font-black text-blue-600">92% Match</p>
                </div>
                
                <div className="flex items-center gap-4 flex-1 sm:flex-none">
                  <Button variant="outline" onClick={() => setIsDrawerOpen(false)} className="h-12 px-6 border-slate-200 text-[12px] font-bold uppercase tracking-widest text-slate-500 rounded-xl hover:bg-slate-50 transition-all flex-1 sm:flex-none">
                    Back
                  </Button>
                  {hasApplied(selectedJob.id) ? (
                    <div className="h-12 px-8 flex-1 sm:flex-none bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                      <CheckCircle className="h-4 w-4" />
                      Application Sent
                    </div>
                  ) : (
                    <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="h-12 px-10 flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                          Apply for this role
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-3xl bg-white rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                        <DialogHeader className="px-12 py-12 bg-slate-900 text-white space-y-4">
                          <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg mb-2">
                             <FileText className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <DialogTitle className="text-3xl font-black tracking-tight underline decoration-blue-500 decoration-4 underline-offset-8 inline-block">Confirm Application</DialogTitle>
                            <DialogDescription className="text-slate-400 font-medium text-base pt-2 leading-relaxed">
                              Submit your professional credentials for <span className="text-white font-bold">{selectedJob.title}</span>.
                            </DialogDescription>
                          </div>
                        </DialogHeader>
                        
                        <div className="px-12 pt-10 pb-16 space-y-10 bg-white">
                          <div className="space-y-4">
                            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cover Note (Optional)</Label>
                            <Textarea 
                              placeholder="Tell the client why you're a great fit for this role..."
                              className="min-h-[160px] p-6 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 text-base font-medium leading-relaxed transition-all border outline-none"
                              value={coverLetter}
                              onChange={(e) => setCoverLetter(e.target.value)}
                            />
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-6 pt-8 border-t border-slate-50">
                             <Button 
                               variant="ghost" 
                               onClick={() => setApplyDialogOpen(false)} 
                               className="flex-1 h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all font-sans"
                             >
                               Abandon
                             </Button>
                             <Button 
                               onClick={handleApply} 
                               disabled={applying}
                               className="flex-[2] h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 font-sans"
                             >
                               {applying ? "Syncing..." : "Finalize Application"}
                             </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* V2 Hire Request Detail Drawer */}
      {FEATURES.hire_request_v2_enabled && (
        <Sheet open={isV2DrawerOpen} onOpenChange={setIsV2DrawerOpen}>
          <SheetContent className="w-full sm:max-w-2xl bg-white border-l border-slate-200 p-0 overflow-auto">
            {selectedV2Request && (
              <div className="flex flex-col min-h-full">
                <SheetHeader className="sr-only">
                  <SheetTitle>{selectedV2Request.title}</SheetTitle>
                  <SheetDescription>Details for this hire request</SheetDescription>
                </SheetHeader>
                {/* Hero */}
                <div className="bg-gradient-to-b from-blue-50 to-white px-10 pt-14 pb-10 space-y-6">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px] font-bold uppercase tracking-widest">
                    {selectedV2Request.service_model?.replace(/_/g, ' ')}
                  </Badge>
                  <h2 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">{selectedV2Request.title}</h2>
                  <div className="flex flex-wrap items-center gap-6">
                    {selectedV2Request.location_preference && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600 font-medium">{selectedV2Request.location_preference}</span>
                      </div>
                    )}
                    {selectedV2Request.engagement_type && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600 font-medium capitalize">{selectedV2Request.engagement_type.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 px-10 py-10 space-y-12">
                  {/* Key Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { label: "Budget", val: selectedV2Request.budget_min && selectedV2Request.budget_max ? `$${selectedV2Request.budget_min} - $${selectedV2Request.budget_max}` : selectedV2Request.fixed_budget ? `$${selectedV2Request.fixed_budget}` : "TBD", icon: DollarSign },
                      { label: "Timezone", val: selectedV2Request.timezone_overlap?.replace(/_/g, ' ') || "Flexible", icon: Globe },
                      { label: "Published", val: selectedV2Request.published_at ? format(new Date(selectedV2Request.published_at), "MMM d, yyyy") : "—", icon: Calendar },
                    ].map((item, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-2">
                        <item.icon className="h-4 w-4 text-slate-400" />
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                          <p className="text-[13px] font-bold text-slate-900 capitalize">{item.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sections */}
                  <div className="space-y-10">
                    {selectedV2Request.role_summary && (
                      <section className="space-y-4">
                        <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-blue-600 pl-4 py-1">Role Summary</h3>
                        <p className="text-[15px] text-slate-600 leading-relaxed font-medium whitespace-pre-line">{selectedV2Request.role_summary}</p>
                      </section>
                    )}
                    {selectedV2Request.responsibilities && (
                      <section className="space-y-4">
                        <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-slate-200 pl-4 py-1">Responsibilities</h3>
                        <p className="text-[15px] text-slate-600 leading-relaxed font-medium whitespace-pre-line">{selectedV2Request.responsibilities}</p>
                      </section>
                    )}
                    {selectedV2Request.requirements && (
                      <section className="space-y-4">
                        <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-slate-200 pl-4 py-1">Requirements</h3>
                        <p className="text-[15px] text-slate-600 leading-relaxed font-medium whitespace-pre-line">{selectedV2Request.requirements}</p>
                      </section>
                    )}
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 w-full p-8 bg-white/80 backdrop-blur-md border-t border-slate-100 flex items-center justify-end gap-4 z-20">
                  <Button variant="outline" onClick={() => setIsV2DrawerOpen(false)} className="h-12 px-6 border-slate-200 text-[12px] font-bold uppercase tracking-widest text-slate-500 rounded-xl">
                    Close
                  </Button>
                  {(() => {
                    const alreadyApplied = v2Applications.some(a => a.hire_request_id === selectedV2Request.id);
                    const isVetted = talent && ["fully_vetted", "approved", "vetted"].includes(talent.vetting_status);
                    if (alreadyApplied) {
                      return (
                        <div className="h-12 px-8 bg-emerald-500 text-white rounded-xl flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                          <CheckCircle className="h-4 w-4" /> Applied
                        </div>
                      );
                    }
                    if (!isVetted) {
                      return <span className="text-xs text-slate-400 italic">Complete vetting to apply</span>;
                    }
                    return (
                      <Button
                        onClick={() => { setV2ApplyingFor(selectedV2Request.id); setV2ApplyDialogOpen(true); setIsV2DrawerOpen(false); }}
                        className="h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                      >
                        Apply for this role
                      </Button>
                    );
                  })()}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}


      {/* V2 Hire Request Apply Dialog */}
      {FEATURES.hire_request_v2_enabled && (
        <Dialog open={v2ApplyDialogOpen} onOpenChange={setV2ApplyDialogOpen}>
          <DialogContent className="sm:max-w-3xl bg-white rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="px-12 py-12 bg-slate-900 text-white space-y-4">
              <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg mb-2">
                 <Zap className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black tracking-tight underline decoration-blue-500 decoration-4 underline-offset-8 inline-block">Apply for Hire Request</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium text-base pt-2">
                  Tell the admin team why you're a perfect match for this request.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="px-12 pt-10 pb-16 space-y-10 bg-white">
              <div className="space-y-4">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Application Note (Optional)</Label>
                <Textarea
                  placeholder="Highlight your relevant experience and interest..."
                  className="min-h-[160px] p-6 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 text-base font-medium leading-relaxed transition-all border outline-none"
                  value={v2ApplyNote}
                  onChange={(e) => setV2ApplyNote(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 pt-8 border-t border-slate-50">
                <Button 
                  variant="ghost" 
                  onClick={() => { setV2ApplyDialogOpen(false); setV2ApplyNote(""); setV2ApplyingFor(null); }} 
                  className="flex-1 h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all font-sans"
                >
                  Abandon
                </Button>
                <Button
                  onClick={async () => {
                    if (!v2ApplyingFor) return;
                    setApplying(true);
                    try {
                      const { error } = await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<{ error: { message: string } | null }> }).rpc('hr_v2_talent_apply', { req_id: v2ApplyingFor, note: v2ApplyNote });
                      if (error) throw error;
                      toast({ title: "Application Seamlessly Submitted", description: "The OPSlyHR team has received your interest." });
                      setV2ApplyDialogOpen(false);
                      setV2ApplyNote("");
                      setV2ApplyingFor(null);
                      fetchData();
                    } catch (error: unknown) {
                      toast({ title: "Submission Failed", description: (error as Error).message || "Failed to apply", variant: "destructive" });
                    } finally {
                      setApplying(false);
                    }
                  }}
                  disabled={applying}
                  className="flex-[2] h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  {applying ? "Syncing..." : "Finalize Application"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TalentJobs;
