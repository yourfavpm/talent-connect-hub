import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Search, Building2, Calendar, Clock, Briefcase, 
  CheckCircle, Timer, XCircle, DollarSign, FileText, 
  ChevronRight, MapPin, Filter, MessageSquare,
  ArrowRight, LayoutDashboard, ExternalLink,
  ChevronLeft, MoreVertical
} from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";


interface Application {
  id: string;
  job_id: string;
  status: string;
  cover_letter?: string;
  application_note?: string;
  created_at: string;
  updated_at: string;
  job: {
    id: string;
    title: string;
    role_needed?: string;
    weekly_hours?: number;
    location?: string;
    client: {
      company_name: string;
    };
  };
}

const STATUS_MAP: Record<string, { label: string; colorClass: string; icon: React.ReactNode; accent: string }> = {
  applied: { label: "Applied", colorClass: "text-blue-600 bg-blue-50/50 border-blue-100", accent: "bg-blue-600", icon: <Clock className="h-3.5 w-3.5" /> },
  pending: { label: "Applied", colorClass: "text-blue-600 bg-blue-50/50 border-blue-100", accent: "bg-blue-600", icon: <Clock className="h-3.5 w-3.5" /> },
  shortlisted: { label: "Shortlisted", colorClass: "text-indigo-600 bg-indigo-50/50 border-indigo-100", accent: "bg-indigo-600", icon: <FileText className="h-3.5 w-3.5" /> },
  interview_requested: { label: "Invited to interview", colorClass: "text-amber-600 bg-amber-50/50 border-amber-100", accent: "bg-amber-600", icon: <Timer className="h-3.5 w-3.5" /> },
  interview_scheduled: { label: "Invited to interview", colorClass: "text-amber-600 bg-amber-50/50 border-amber-100", accent: "bg-amber-600", icon: <Calendar className="h-3.5 w-3.5" /> },
  offer_initiated: { label: "Offer Pending", colorClass: "text-purple-600 bg-purple-50/50 border-purple-100", accent: "bg-purple-600", icon: <DollarSign className="h-3.5 w-3.5" /> },
  offer_sent: { label: "Offer Received", colorClass: "text-purple-600 bg-purple-50/50 border-purple-100", accent: "bg-purple-600", icon: <DollarSign className="h-3.5 w-3.5" /> },
  hired: { label: "Hired", colorClass: "text-emerald-600 bg-emerald-50/50 border-emerald-100", accent: "bg-emerald-600", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  rejected: { label: "Not Selected", colorClass: "text-red-600 bg-red-50/50 border-red-100", accent: "bg-red-600", icon: <XCircle className="h-3.5 w-3.5" /> },
  withdrawn: { label: "Withdrawn", colorClass: "text-slate-400 bg-slate-50 border-slate-200", accent: "bg-slate-400", icon: <XCircle className="h-3.5 w-3.5" /> },
};


const TalentApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchApplications = async () => {
    try {
      const loadedApps: Application[] = [];

      const { data: talent } = await supabase
        .from("talents")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (talent?.id) {
        const { data, error } = await supabase
          .from("job_applications")
          .select(`
            id, job_id, status, cover_letter, created_at, updated_at,
            job:jobs (id, title, role_needed, weekly_hours, location, client:clients(company_name))
          `)
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        loadedApps.push(...((data as Application[]) || []));
      }

      const [v2AppRes, shortlistRes, interviewRes, hireRes] = await Promise.all([
        supabase.from("hr_v2_applications").select("id, hire_request_id, status, application_note, created_at, updated_at").eq("talent_user_id", user?.id),
        supabase.from("hr_v2_shortlists").select("id, hire_request_id, status, created_at, updated_at").eq("talent_user_id", user?.id),
        supabase.from("hr_v2_interviews").select("id, hire_request_id, status, created_at, updated_at").eq("talent_user_id", user?.id),
        supabase.from("hr_v2_hires").select("id, hire_request_id, hire_status, created_at, updated_at").eq("talent_user_id", user?.id),
      ]);

      const hrMap = new Map<string, any>();
      
      (v2AppRes.data || []).forEach(a => {
        hrMap.set(a.hire_request_id, {
          id: a.id,
          hire_request_id: a.hire_request_id,
          status: a.status,
          application_note: a.application_note,
          created_at: a.created_at,
          updated_at: a.updated_at
        });
      });

      (shortlistRes.data || []).forEach(s => {
        const existing = hrMap.get(s.hire_request_id) || {
          id: s.id,
          hire_request_id: s.hire_request_id,
          status: 'applied',
          created_at: s.created_at,
          updated_at: s.updated_at
        };
        if (!['rejected', 'withdrawn'].includes(existing.status)) {
           existing.status = s.status === 'interview_requested' || s.status === 'interview_scheduled' || s.status === 'interviewed' ? s.status : 'shortlisted';
        }
        hrMap.set(s.hire_request_id, existing);
      });

      (interviewRes.data || []).forEach(i => {
        const existing = hrMap.get(i.hire_request_id) || {
          id: i.id,
          hire_request_id: i.hire_request_id,
          status: 'applied',
          created_at: i.created_at,
          updated_at: i.updated_at
        };
        if (!['rejected', 'withdrawn'].includes(existing.status)) {
           existing.status = i.status === 'scheduled' ? 'interview_scheduled' : i.status === 'pending' ? 'interview_requested' : 'interviewed';
        }
        hrMap.set(i.hire_request_id, existing);
      });

      (hireRes.data || []).forEach(h => {
        const existing = hrMap.get(h.hire_request_id) || {
          id: h.id,
          hire_request_id: h.hire_request_id,
          status: 'applied',
          created_at: h.created_at,
          updated_at: h.updated_at
        };
        if (!['rejected', 'withdrawn'].includes(existing.status)) {
           existing.status = h.hire_status === 'active' || h.hire_status === 'contract_signed' ? 'hired' : 'offer_initiated';
        }
        hrMap.set(h.hire_request_id, existing);
      });

      const mergedV2Apps = Array.from(hrMap.values());

      if (mergedV2Apps.length > 0) {
        const requestIds = mergedV2Apps.map((app) => app.hire_request_id);
        const { data: requestData } = await supabase
          .from("hr_v2_hire_requests")
          .select("id, title, role_summary, location_preference, service_model, hours_per_week")
          .in("id", requestIds);

        const requestMap = ((requestData as any[]) || []).reduce<Record<string, any>>((acc, req) => {
          acc[req.id] = req;
          return acc;
        }, {});

        loadedApps.push(
          ...mergedV2Apps.map((app) => ({
            id: app.id,
            job_id: app.hire_request_id,
            status: app.status,
            cover_letter: app.application_note ?? "",
            application_note: app.application_note ?? "",
            created_at: app.created_at,
            updated_at: app.updated_at,
            job: {
              id: app.hire_request_id,
              title: requestMap[app.hire_request_id]?.title || "Hire Request",
              role_needed: requestMap[app.hire_request_id]?.role_summary || requestMap[app.hire_request_id]?.service_model || "OPSlyHR Request",
              weekly_hours: requestMap[app.hire_request_id]?.hours_per_week ?? 0,
              location: requestMap[app.hire_request_id]?.location_preference || "Remote",
              client: { company_name: "Verified OPSly Partner" },
            },
          }))
        );
      }

      setApplications(
        loadedApps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchApplications();
  }, [user]);


  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job?.client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    
    // Grouped logic for filters
    if (statusFilter === "active") return !["hired", "rejected", "withdrawn"].includes(app.status);
    if (statusFilter === "completed") return ["hired", "rejected", "withdrawn"].includes(app.status);
    
    return app.status === statusFilter;
  });

  const getStatusStage = (status: string) => {
    switch(status) {
      case "applied":
      case "pending":
        return 1;
      case "shortlisted":
        return 2;
      case "interview_requested":
      case "interview_scheduled":
        return 3;
      case "offer_initiated":
      case "offer_sent":
        return 4;
      case "hired":
      case "rejected":
      case "withdrawn":
        return 5;
      default:
        return 1;
    }
  };

  const openApplicationDrawer = (app: Application) => {
    setSelectedApp(app);
    setIsDrawerOpen(true);
  };

  const renderTimeline = (app: Application) => {
    let currentStage = getStatusStage(app.status);
    // Adjust max stage to 4 based on user request
    if (currentStage > 4) currentStage = 4;
    const isTerminal = ["hired", "rejected", "withdrawn"].includes(app.status);
    const timelineData = [
      { step: 1, label: "Application Submitted", desc: format(new Date(app.created_at), "MMM d, yyyy"), icon: FileText },
      { step: 2, label: "Shortlisted", desc: currentStage >= 2 ? "You've been shortlisted" : "Awaiting review", icon: Search },
      { step: 3, label: "Interviewing", desc: currentStage >= 3 ? "Interview stage" : (isTerminal ? "Skipped" : "Awaiting schedule"), icon: Calendar },
      { step: 4, label: app.status === "rejected" ? "Rejected" : app.status === "withdrawn" ? "Withdrawn" : "Hired", desc: currentStage === 4 ? "Final Decision" : "TBD", icon: CheckCircle }
    ];

    return (
      <div className="relative space-y-10 pl-2">
        {/* Continuous Line */}
        <div className="absolute left-[21px] top-6 bottom-6 w-[1px] bg-slate-100" />
        
        {timelineData.map((item, idx) => {
          const isCompleted = item.step < currentStage;
          const isCurrent = item.step === currentStage;
          const isPending = item.step > currentStage;

          return (
            <div key={item.step} className="relative flex items-start gap-6 group">
              <div className={clsx(
                "z-10 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border transition-all",
                isCompleted ? "bg-slate-900 border-slate-900 text-white" :
                isCurrent ? "bg-white border-blue-600 text-blue-600 shadow-lg shadow-blue-500/10" :
                "bg-slate-50 border-slate-100 text-slate-300"
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="pt-1.5 space-y-1">
                <p className={clsx("text-[13px] font-bold tracking-tight leading-none", isPending ? "text-slate-400" : "text-slate-900")}>
                  {item.label}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };


  if (loading) {
    return (
      <div className="flex flex-col space-y-4 w-full">
        <div className="h-10 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="h-10 w-full bg-gray-100 animate-pulse rounded mt-4" />
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg mt-4" />)}
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-8 space-y-10 animate-fade-in min-h-screen">
      {/* ── Page Header Strip ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">Applications</h1>
          <p className="text-[15px] text-slate-500 font-medium">Track your recruitment stages and active offers.</p>
        </div>
        
        {/* KPI Summary for Applications */}
        <div className="hidden sm:flex items-center gap-8 px-6 py-2 bg-slate-50 border border-slate-100 rounded-xl">
           <div className="text-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active</p>
             <p className="text-[16px] font-black text-slate-900">{applications.filter(a => !["hired", "rejected", "withdrawn"].includes(a.status)).length}</p>
           </div>
           <div className="h-6 w-px bg-slate-200" />
           <div className="text-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total</p>
             <p className="text-[16px] font-black text-slate-900">{applications.length}</p>
           </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1 p-1 bg-slate-50/50 rounded-xl overflow-x-auto w-full lg:w-auto">
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "completed", label: "Completed" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={clsx(
                "px-5 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all",
                statusFilter === f.id 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto px-1">
          <div className="relative flex-1 lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by role or partner..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-10 h-11 bg-white border-slate-100 rounded-xl focus:ring-0 focus:border-slate-300 text-[13px] shadow-inner" 
            />
          </div>
          <Button variant="outline" className="h-11 px-4 border-slate-200 rounded-xl text-slate-400 hover:text-slate-900">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>


      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
        {filteredApplications.length === 0 ? (
          <div className="py-32 text-center space-y-4">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <FileText className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-[15px] font-bold text-slate-900">No applications found</p>
              <p className="text-[13px] text-slate-500 max-w-[280px] mx-auto italic">
                {applications.length === 0 ? "You haven't applied to any roles yet." : "No applications match your current filters."}
              </p>
            </div>
            {applications.length === 0 && (
              <div className="pt-4">
                <Button onClick={() => navigate(getInternalPath('/talent/jobs'))} className="h-11 px-8 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold uppercase tracking-widest rounded-xl transition-all">
                  Browse Roles
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100/50">
            {filteredApplications.map((app) => {
              const status = STATUS_MAP[app.status] || STATUS_MAP.applied;
              return (
                <div 
                  key={app.id} 
                  onClick={() => openApplicationDrawer(app)}
                  className="group px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all cursor-pointer relative"
                >
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{app.job?.title}</h3>
                      <div className={clsx("flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest", status.colorClass)}>
                        <div className={clsx("h-1.5 w-1.5 rounded-full", status.accent)} />
                        {status.label}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-[12px] font-medium text-slate-500">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-slate-300" />
                        <span className="text-slate-400 leading-none">{app.job?.client?.company_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-300" />
                        <span className="leading-none">{app.job?.location || "Remote"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-300" />
                        <span className="leading-none">Applied {format(new Date(app.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
                     <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Last Update</p>
                        <p className="text-[12px] font-bold text-slate-600 uppercase tracking-widest">{format(new Date(app.updated_at), "MMM d")}</p>
                     </div>
                     <button className="h-10 w-10 bg-slate-50 group-hover:bg-slate-900 border border-slate-100 group-hover:border-slate-900 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-white transition-all shadow-sm">
                       <ChevronRight className="h-5 w-5" />
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 border-l border-slate-100 sm:rounded-l-[32px] shadow-2xl">
          {selectedApp && (
            <div className="flex flex-col h-full bg-white relative">
              
              {/* Header */}
              <div className="px-10 py-12 border-b border-slate-50 space-y-6">
                <div className="flex items-center justify-between">
                  <Badge className={clsx("px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border", STATUS_MAP[selectedApp.status]?.colorClass)}>
                    {STATUS_MAP[selectedApp.status]?.label}
                  </Badge>
                  <button onClick={() => setIsDrawerOpen(false)} className="h-10 w-10 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                     <ChevronLeft className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <h2 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">{selectedApp.job?.title}</h2>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Partner</p>
                      <p className="text-[14px] font-bold text-slate-900">{selectedApp.job?.client?.company_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 px-10 py-10 space-y-12">
                 <section className="space-y-8">
                   <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-blue-600 pl-4 py-1">Application Timeline</h3>
                   {renderTimeline(selectedApp)}
                 </section>

                 <div className="h-px bg-slate-100 w-full" />

                 <section className="space-y-6">
                   <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-slate-200 pl-4 py-1">Position Snapshot</h3>
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role Needed</p>
                        <p className="text-[14px] font-bold text-slate-900">{selectedApp.job?.role_needed?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commitment</p>
                        <p className="text-[14px] font-bold text-slate-900">{selectedApp.job?.weekly_hours ? `${selectedApp.job.weekly_hours} hrs/week` : 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                        <p className="text-[14px] font-bold text-slate-900">{selectedApp.job?.location || 'Remote'}</p>
                      </div>
                   </div>
                   
                   <div className="pt-2">
                     <Button variant="outline" className="h-11 px-6 border-slate-200 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 rounded-xl transition-all" asChild>
                       <Link to={getInternalPath(`/talent/jobs/${selectedApp.job_id}`)}>
                         View Full Job Briefing
                         <ArrowRight className="h-3.5 w-3.5 ml-2" />
                       </Link>
                     </Button>
                   </div>
                 </section>
                 
                 {(selectedApp.cover_letter || selectedApp.application_note) && (
                    <section className="space-y-6">
                       <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-slate-200 pl-4 py-1">My Cover Note</h3>
                       <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 text-[14px] text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                         {selectedApp.cover_letter || selectedApp.application_note}
                       </div>
                    </section>
                 )}
              </div>

              {/* Action Footer */}
              {(selectedApp.status === "interview_scheduled" || selectedApp.status === "offer_sent" || selectedApp.status === "offer_initiated") && (
                <div className="sticky bottom-0 left-0 w-full p-8 bg-white/80 backdrop-blur-md border-t border-slate-100 flex items-center gap-4 z-20">
                  {selectedApp.status === "interview_scheduled" && (
                    <Button className="flex-1 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[12px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98]" asChild>
                      <Link to={getInternalPath("/talent/interviews")}>View Interview Details</Link>
                    </Button>
                  )}
                  {(selectedApp.status === "offer_sent" || selectedApp.status === "offer_initiated") && (
                    <Button className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[12px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]" asChild>
                      <Link to={getInternalPath("/talent/offers")}>Review Final Offer</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TalentApplications;
