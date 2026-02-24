import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Search,
  Building2,
  Calendar,
  Clock,
  Briefcase,
  CheckCircle,
  Timer,
  XCircle,
  DollarSign,
  FileText,
  ChevronRight,
  MapPin
} from "lucide-react";
import { format } from "date-fns";

interface Application {
  id: string;
  job_id: string;
  status: string;
  cover_letter: string;
  created_at: string;
  updated_at: string;
  job: {
    id: string;
    title: string;
    role_needed: string;
    weekly_hours: number;
    location: string;
    client: {
      company_name: string;
    };
  };
}

const STATUS_MAP: Record<string, { label: string; colorClass: string; icon: React.ReactNode }> = {
  applied: { label: "Applied", colorClass: "text-blue-600 bg-blue-50 border-blue-200", icon: <Clock className="h-3.5 w-3.5" /> },
  shortlisted: { label: "Under Review", colorClass: "text-indigo-600 bg-indigo-50 border-indigo-200", icon: <FileText className="h-3.5 w-3.5" /> },
  interview_requested: { label: "Interview Requested", colorClass: "text-amber-600 bg-amber-50 border-amber-200", icon: <Timer className="h-3.5 w-3.5" /> },
  interview_scheduled: { label: "Interview Scheduled", colorClass: "text-amber-600 bg-amber-50 border-amber-200", icon: <Calendar className="h-3.5 w-3.5" /> },
  offer_initiated: { label: "Offer Pending", colorClass: "text-purple-600 bg-purple-50 border-purple-200", icon: <DollarSign className="h-3.5 w-3.5" /> },
  offer_sent: { label: "Offer Received", colorClass: "text-purple-600 bg-purple-50 border-purple-200", icon: <DollarSign className="h-3.5 w-3.5" /> },
  hired: { label: "Hired", colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  rejected: { label: "Not Selected", colorClass: "text-red-700 bg-red-50 border-red-200", icon: <XCircle className="h-3.5 w-3.5" /> },
  withdrawn: { label: "Withdrawn", colorClass: "text-gray-600 bg-gray-50 border-gray-200", icon: <XCircle className="h-3.5 w-3.5" /> },
};

const TalentApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (user) fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    try {
      const { data: talent } = await supabase
        .from("talents")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!talent) return;

      const { data, error } = await supabase
        .from("job_applications")
        .select(`
          id, job_id, status, cover_letter, created_at, updated_at,
          job:jobs (id, title, role_needed, weekly_hours, location, client:clients(company_name))
        `)
        .eq("talent_id", talent.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

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
      case "applied": return 1;
      case "shortlisted": return 2;
      case "interview_requested": case "interview_scheduled": return 3;
      case "offer_initiated": case "offer_sent": return 4;
      case "hired": case "rejected": case "withdrawn": return 5;
      default: return 1;
    }
  };

  const openApplicationDrawer = (app: Application) => {
    setSelectedApp(app);
    setIsDrawerOpen(true);
  };

  const renderTimeline = (app: Application) => {
    const currentStage = getStatusStage(app.status);
    const isTerminal = ["hired", "rejected", "withdrawn"].includes(app.status);
    const timelineData = [
      { step: 1, label: "Applied", desc: format(new Date(app.created_at), "MMM d, yyyy"), icon: <FileText className="h-4 w-4" /> },
      { step: 2, label: "Under Review", desc: currentStage >= 2 ? "Client is reviewing your profile" : "Awaiting review", icon: <Search className="h-4 w-4" /> },
      { step: 3, label: "Interview", desc: currentStage >= 3 ? "Interview stage reached" : (isTerminal ? "Did not reach stage" : "Pending"), icon: <Calendar className="h-4 w-4" /> },
      { step: 4, label: "Offer", desc: currentStage >= 4 ? "Offer process initiated" : (isTerminal ? "Did not reach stage" : "Pending"), icon: <DollarSign className="h-4 w-4" /> },
      { step: 5, label: app.status === "rejected" ? "Not Selected" : app.status === "withdrawn" ? "Withdrawn" : "Hired", desc: currentStage === 5 ? "Final Decision" : "Pending", icon: <CheckCircle className="h-4 w-4" /> }
    ];

    return (
      <div className="relative border-l border-gray-200 ml-3 mt-6 space-y-8 pb-4">
        {timelineData.map((item, idx) => {
          const isCompleted = item.step < currentStage;
          const isCurrent = item.step === currentStage;
          const isPending = item.step > currentStage;

          let dotColor = isCompleted ? "bg-brand-primary border-brand-primary text-white" :
                         isCurrent ? "bg-white border-brand-primary text-brand-primary" :
                         "bg-white border-gray-300 text-gray-300";
                         
          if (isCurrent && app.status === "rejected") dotColor = "bg-red-50 border-red-500 text-red-500";
          if (isCurrent && app.status === "hired") dotColor = "bg-emerald-50 border-emerald-500 text-emerald-500";

          return (
            <div key={item.step} className="relative pl-6">
              <span className={`absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full border-2 ${dotColor}`}>
                {item.icon}
              </span>
              <div className="flex flex-col">
                <span className={`text-sm font-semibold ${isPending ? 'text-gray-400' : 'text-gray-900'}`}>{item.label}</span>
                <span className={`text-xs mt-1 ${isPending ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-4 max-w-5xl mx-auto">
        <div className="h-10 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="h-10 w-full bg-gray-100 animate-pulse rounded mt-4" />
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg mt-4" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">My Applications</h1>
        <p className="text-sm text-gray-500 mt-1">Track the status of your job applications</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <Button variant={statusFilter === "all" ? "default" : "ghost"} size="sm" onClick={() => setStatusFilter("all")} className="rounded-full text-xs">All</Button>
          <Button variant={statusFilter === "active" ? "default" : "ghost"} size="sm" onClick={() => setStatusFilter("active")} className="rounded-full text-xs">Active</Button>
          <Button variant={statusFilter === "completed" ? "default" : "ghost"} size="sm" onClick={() => setStatusFilter("completed")} className="rounded-full text-xs">Completed</Button>
        </div>
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search job title or company..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-gray-50 border-gray-200 w-full h-9 text-sm" />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredApplications.length === 0 ? (
          <div className="py-16 text-center border rounded-xl bg-white border-gray-200 border-dashed">
            <FileText className="h-8 w-8 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-1">No applications found.</p>
            <p className="text-sm text-gray-500">
              {applications.length === 0 ? "You haven't applied to any jobs yet." : "No applications match your filter."}
            </p>
            {applications.length === 0 && (
              <Link to="/talent/jobs" className="mt-4 text-sm font-medium text-brand-primary hover:text-brand-primary/80 flex items-center justify-center gap-1.5 transition-colors">
                Browse Jobs <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          filteredApplications.map((app) => {
            const statusConfig = STATUS_MAP[app.status] || STATUS_MAP.applied;
            return (
              <Card 
                key={app.id} 
                className="group border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow transition-all cursor-pointer bg-white"
                onClick={() => openApplicationDrawer(app)}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-primary transition-colors truncate">{app.job?.title}</h3>
                        <Badge variant="outline" className={`font-medium px-2 py-0.5 text-[11px] rounded transition-colors ${statusConfig.colorClass}`}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="truncate font-medium">{app.job?.client?.company_name}</span>
                        {app.job?.location && (
                          <>
                            <span className="text-gray-300 px-1">•</span>
                            <span className="truncate">{app.job.location}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                         <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Applied {format(new Date(app.created_at), "MMM d, yyyy")}</span>
                         <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Last updated {format(new Date(app.updated_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center justify-end">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-100 hidden sm:flex">
                         <ChevronRight className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 border-l border-gray-200 sm:rounded-l-2xl">
          {selectedApp && (
            <div className="flex flex-col h-full bg-white">
              <div className="px-6 py-8 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-3">
                   <Badge variant="outline" className={`font-medium px-2.5 py-1 text-xs rounded shadow-none ${STATUS_MAP[selectedApp.status]?.colorClass}`}>
                     {STATUS_MAP[selectedApp.status]?.icon}
                     <span className="ml-1.5">{STATUS_MAP[selectedApp.status]?.label}</span>
                   </Badge>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedApp.job?.title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{selectedApp.job?.client?.company_name}</span>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-8">
                 <section>
                   <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Application Timeline</h3>
                   {renderTimeline(selectedApp)}
                 </section>

                 <div className="h-px bg-gray-100 w-full" />

                 <section>
                   <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Job Snapshot</h3>
                   <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Role Needed</p>
                        <p className="font-medium text-gray-900">{selectedApp.job?.role_needed?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Commitment</p>
                        <p className="font-medium text-gray-900">{selectedApp.job?.weekly_hours ? `${selectedApp.job.weekly_hours} hrs/week` : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Location</p>
                        <p className="font-medium text-gray-900">{selectedApp.job?.location || 'Remote'}</p>
                      </div>
                   </div>
                   <Link to={`/talent/jobs?id=${selectedApp.job_id}`} className="mt-2 text-sm font-medium text-brand-primary hover:text-brand-primary/80 flex items-center gap-1.5 transition-colors">
                     View Full Job Details <ArrowRight className="h-4 w-4" />
                   </Link>
                 </section>
                 
                 {selectedApp.cover_letter && (
                    <section>
                       <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">My Cover Note</h3>
                       <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                         {selectedApp.cover_letter}
                       </div>
                    </section>
                 )}
              </div>

              {/* Action Footer depending on status */}
              {(selectedApp.status === "interview_scheduled" || selectedApp.status === "offer_sent" || selectedApp.status === "offer_initiated") && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 shrink-0">
                  {selectedApp.status === "interview_scheduled" && (
                    <Button className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white" asChild>
                      <Link to="/talent/interviews">View Interview Details</Link>
                    </Button>
                  )}
                  {(selectedApp.status === "offer_sent" || selectedApp.status === "offer_initiated") && (
                    <Button className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white" asChild>
                      <Link to="/talent/offers">Review Offer</Link>
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
