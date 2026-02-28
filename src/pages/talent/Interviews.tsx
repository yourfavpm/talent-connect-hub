import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, Clock, Video, Phone, Building2,
  CalendarCheck, CalendarClock, AlertCircle,
  ExternalLink, ChevronRight, MessageSquare,
  ArrowRight, LayoutDashboard, ExternalLink as ExternalLinkIcon,
  ChevronLeft, Info, MoreVertical, MapPin
} from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";


interface Interview {
  id: string;
  application_id: string;
  client_id: string;
  talent_id: string;
  job_id: string;
  scheduled_at: string;
  duration_minutes: number;
  interview_type: string;
  meeting_link: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  job: {
    title: string;
    role_needed: string;
  };
  client: {
    company_name: string;
  };
}

const STATUS_MAP: Record<string, { label: string; color: string; accent: string; icon: React.ReactNode }> = {
  requested: { label: "Requested", color: "text-amber-600 bg-amber-50/50 border-amber-100", accent: "bg-amber-600", icon: <CalendarClock className="h-3.5 w-3.5" /> },
  scheduled: { label: "Scheduled", color: "text-blue-600 bg-blue-50/50 border-blue-100", accent: "bg-blue-600", icon: <CalendarCheck className="h-3.5 w-3.5" /> },
  reschedule_requested: { label: "Reschedule Req.", color: "text-orange-600 bg-orange-50/50 border-orange-100", accent: "bg-orange-600", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  completed: { label: "Completed", color: "text-emerald-600 bg-emerald-50/50 border-emerald-100", accent: "bg-emerald-600", icon: <CalendarCheck className="h-3.5 w-3.5" /> },
  cancelled: { label: "Cancelled", color: "text-slate-400 bg-slate-50 border-slate-200", accent: "bg-slate-400", icon: <AlertCircle className="h-3.5 w-3.5" /> },
};


const TalentInterviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchInterviews = useCallback(async () => {
    try {
      const { data: talent } = await supabase
        .from("talents")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!talent) return;

      const { data, error } = await supabase
        .from("interviews")
        .select(`
          *,
          job:jobs(title, role_needed),
          client:clients(company_name)
        `)
        .eq("talent_id", talent.id)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchInterviews();
    }
  }, [user, fetchInterviews]);



  const handleAccept = async (interviewId: string) => {
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("interviews")
        .update({ status: "scheduled" })
        .eq("id", interviewId);

      if (error) throw error;
      
      // Also update application status
      const interview = interviews.find(i => i.id === interviewId);
      if (interview) {
        await supabase
          .from("job_applications")
          .update({ status: "interview_scheduled" })
          .eq("id", interview.application_id);
      }

      toast({ title: "Interview Accepted", description: "The interview has been scheduled." });
      if (selectedInterview) setSelectedInterview({ ...selectedInterview, status: "scheduled" });
      fetchInterviews();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };


  const handleReschedule = async () => {
    if (!selectedInterview || !rescheduleReason || !rescheduleTime) {
      toast({ title: "Incomplete", description: "Please provide a reason and proposed time.", variant: "destructive" });
      return;
    }
    
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("interviews")
        .update({ 
          status: "reschedule_requested",
          notes: `${selectedInterview.notes ? selectedInterview.notes + '\n\n' : ''}Reschedule Request from Talent: ${rescheduleReason}\nProposed Time: ${rescheduleTime}`
        })
        .eq("id", selectedInterview.id);

      if (error) throw error;

      toast({ title: "Reschedule Requested", description: "Your request has been sent to the client." });
      setIsRescheduleOpen(false);
      setRescheduleReason("");
      setRescheduleTime("");
      if (selectedInterview) setSelectedInterview({ ...selectedInterview, status: "reschedule_requested" });
      fetchInterviews();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };


  const openInterviewDetails = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsDrawerOpen(true);
  };

  // Group interviews
  const upcoming = interviews.filter(i => ["scheduled", "requested", "reschedule_requested"].includes(i.status) && new Date(i.scheduled_at) >= new Date());
  const pending = interviews.filter(i => i.status === "requested" || i.status === "reschedule_requested");
  const completed = interviews.filter(i => i.status === "completed" || (new Date(i.scheduled_at) < new Date() && i.status === "scheduled"));
  
  const upcomingCount = upcoming.filter(i => i.status === "scheduled").length;
  const pendingCount = pending.filter(i => i.status === "requested").length;
  const rescheduleCount = pending.filter(i => i.status === "reschedule_requested").length;

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 max-w-5xl mx-auto">
        <div className="h-10 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />)}
        </div>
        <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg mt-4" />
      </div>
    );
  }

  const renderInterviewList = (list: Interview[], emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className="py-24 text-center space-y-4 bg-white border border-slate-100 rounded-[32px]">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Calendar className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-[15px] font-bold text-slate-900">No interviews found</p>
            <p className="text-[13px] text-slate-500 max-w-[280px] mx-auto italic">{emptyMessage}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100/50">
          {list.map((interview) => {
            const status = STATUS_MAP[interview.status] || STATUS_MAP.scheduled;
            const isVideo = interview.interview_type === "video";
            
            return (
              <div 
                key={interview.id} 
                onClick={() => openInterviewDetails(interview)}
                className="group px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all cursor-pointer relative"
              >
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{interview.job?.title}</h3>
                    <div className={clsx("flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest", status.color)}>
                      <div className={clsx("h-1.5 w-1.5 rounded-full", status.accent)} />
                      {status.label}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-[12px] font-medium text-slate-500">
                    <div className="flex items-center gap-2">
                       <Building2 className="h-3.5 w-3.5 text-slate-300" />
                       <span className="text-slate-400 leading-none">{interview.client?.company_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Clock className="h-3.5 w-3.5 text-slate-300" />
                       <span className="leading-none">{format(new Date(interview.scheduled_at), "MMM d, h:mm a")} ({interview.duration_minutes}m)</span>
                    </div>
                    <div className="flex items-center gap-2">
                       {isVideo ? <Video className="h-3.5 w-3.5 text-slate-300" /> : <Phone className="h-3.5 w-3.5 text-slate-300" />}
                       <span className="leading-none capitalize">{interview.interview_type}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
                   {interview.status === "requested" && (
                     <Button variant="outline" className="h-10 px-6 border-blue-600 text-blue-600 hover:bg-blue-50 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all" onClick={(e) => { e.stopPropagation(); handleAccept(interview.id); }}>
                       Accept
                     </Button>
                   )}
                   {interview.status === "scheduled" && new Date(interview.scheduled_at) > new Date() && interview.meeting_link && (
                     <Button className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all" onClick={(e) => { e.stopPropagation(); window.open(interview.meeting_link!, '_blank'); }}>
                       Join Call
                     </Button>
                   )}
                   <button className="h-10 w-10 bg-slate-50 group-hover:bg-slate-900 border border-slate-100 group-hover:border-slate-900 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-white transition-all shadow-sm">
                     <ChevronRight className="h-5 w-5" />
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10 animate-fade-in min-h-screen">
      {/* ── Page Header Strip ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">Interviews</h1>
          <p className="text-[15px] text-slate-500 font-medium">Manage your virtual meetings and screening calls.</p>
        </div>
        
        {/* KPI Summary Strip */}
        <div className="hidden sm:flex items-center gap-8 px-6 py-2 bg-slate-50 border border-slate-100 rounded-xl">
           <div className="text-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Upcoming</p>
             <p className="text-[16px] font-black text-slate-900">{upcomingCount}</p>
           </div>
           <div className="h-6 w-px bg-slate-200" />
           <div className="text-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Requests</p>
             <p className="text-[16px] font-black text-blue-600">{pendingCount}</p>
           </div>
           <div className="h-6 w-px bg-slate-200" />
           <div className="text-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Done</p>
             <p className="text-[16px] font-black text-slate-900">{completed.length}</p>
           </div>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <TabsList className="bg-transparent border-none p-0 h-auto gap-8">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 pb-2 text-[12px] font-bold uppercase tracking-widest text-slate-400">Upcoming</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 pb-2 text-[12px] font-bold uppercase tracking-widest text-slate-400">Requests {pendingCount > 0 && `(${pendingCount})`}</TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 pb-2 text-[12px] font-bold uppercase tracking-widest text-slate-400">Completed</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="upcoming" className="focus-visible:outline-none focus-visible:ring-0">
          {renderInterviewList(upcoming, "No virtual meetings on the horizon.")}
        </TabsContent>
        
        <TabsContent value="pending" className="focus-visible:outline-none focus-visible:ring-0">
          {renderInterviewList(pending, "Your request queue is currently empty.")}
        </TabsContent>

        <TabsContent value="completed" className="focus-visible:outline-none focus-visible:ring-0">
          {renderInterviewList(completed, "No past sessions found in history.")}
        </TabsContent>
      </Tabs>


      {/* Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 border-l border-slate-100 sm:rounded-l-[32px] shadow-2xl">
          {selectedInterview && (
            <div className="flex flex-col h-full bg-white relative">
              
              {/* Header */}
              <div className="px-10 py-12 border-b border-slate-50 space-y-6">
                <div className="flex items-center justify-between">
                  <Badge className={clsx("px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border", STATUS_MAP[selectedInterview.status]?.color)}>
                    {STATUS_MAP[selectedInterview.status]?.label}
                  </Badge>
                  <button onClick={() => setIsDrawerOpen(false)} className="h-10 w-10 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                     <ChevronLeft className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <h2 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">{selectedInterview.job?.title}</h2>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Partner</p>
                      <p className="text-[14px] font-bold text-slate-900">{selectedInterview.client?.company_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 px-10 py-10 space-y-12">
                 {/* Call Schedule */}
                 <section className="space-y-6">
                   <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-blue-600 pl-4 py-1">Virtual Session Info</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                          <p className="text-[13px] font-bold text-slate-900">{format(new Date(selectedInterview.scheduled_at), "EEEE, MMM d")}</p>
                        </div>
                      </div>
                      <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time & Duration</p>
                          <p className="text-[13px] font-bold text-slate-900">{format(new Date(selectedInterview.scheduled_at), "h:mm a")} ({selectedInterview.duration_minutes}m)</p>
                        </div>
                      </div>
                   </div>

                   {selectedInterview.meeting_link && (
                     <div className="p-6 rounded-2xl bg-blue-50/30 border border-blue-100 space-y-4">
                        <div className="flex items-center gap-3">
                          <Video className="h-5 w-5 text-blue-600" />
                          <h4 className="text-[14px] font-bold text-slate-900">Meeting Access</h4>
                        </div>
                        <p className="text-[13px] text-slate-600 font-medium break-all leading-relaxed">
                          Secure link: <span className="text-blue-600 select-all">{selectedInterview.meeting_link}</span>
                        </p>
                        <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/10" onClick={() => window.open(selectedInterview.meeting_link!, '_blank')}>
                          Join Session Now
                        </Button>
                     </div>
                   )}
                 </section>

                 <div className="h-px bg-slate-100 w-full" />

                 <section className="space-y-6">
                   <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-slate-200 pl-4 py-1">Position Snapshot</h3>
                   <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Role Needed</p>
                     <p className="text-[14px] font-bold text-slate-900">{selectedInterview.job?.role_needed?.replace('_', ' ') || 'N/A'}</p>
                   </div>
                   <div className="pt-2">
                     <Button variant="outline" className="h-11 px-6 border-slate-200 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 rounded-xl transition-all" asChild>
                       <Link to={`/talent/jobs?id=${selectedInterview.job_id}`}>
                         Review Full Job Briefing
                         <ArrowRight className="h-3.5 w-3.5 ml-2" />
                       </Link>
                     </Button>
                   </div>
                 </section>
                 
                 {selectedInterview.notes && (
                    <section className="space-y-6">
                       <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-slate-200 pl-4 py-1">Interview Prep Notes</h3>
                       <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 text-[14px] text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                         {selectedInterview.notes}
                       </div>
                    </section>
                 )}
              </div>

              {/* Action Footer */}
              <div className="sticky bottom-0 left-0 w-full p-8 bg-white/80 backdrop-blur-md border-t border-slate-100 flex flex-col gap-3 z-20">
                {selectedInterview.status === "requested" && (
                  <Button className="h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[12px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98]" onClick={() => handleAccept(selectedInterview.id)} disabled={submitting}>
                    {submitting ? "Confirming..." : "Confirm Attendance"}
                  </Button>
                )}
                
                {["requested", "scheduled"].includes(selectedInterview.status) && new Date(selectedInterview.scheduled_at) > new Date() && (
                  <Button variant="outline" className="h-14 border-slate-200 rounded-2xl text-[12px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900" onClick={() => setIsRescheduleOpen(true)}>
                    Request New Time
                  </Button>
                )}
                
                <Button variant="ghost" className="h-14 text-slate-400 hover:text-slate-900 text-[11px] font-bold uppercase tracking-widest">
                  <MessageSquare className="h-4 w-4 mr-2" /> Open Chat with Partner
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>


      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-lg bg-white rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="px-10 py-12 space-y-8">
            <div className="text-center space-y-2">
              <DialogTitle className="text-[24px] font-bold text-slate-900 tracking-tight">Modify Schedule</DialogTitle>
              <p className="text-[14px] text-slate-500 font-medium">Please provide your availability and reason for change.</p>
            </div>

            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start gap-4">
                 <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                 <p className="text-[13px] text-amber-900 font-medium leading-relaxed">
                   Your request will be sent to the partner for review. Try to propose multiple windows to expedite the process.
                 </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Proposed Windows</Label>
                  <Input
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    placeholder="e.g. Mon/Tue, 2PM - 4PM GMT"
                    className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-0 focus:border-slate-300 text-[14px] font-medium px-4 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Brief Reason</Label>
                  <Input
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="e.g. Technical oversight on existing commitment"
                    className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-0 focus:border-slate-300 text-[14px] font-medium px-4 shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <Button variant="ghost" onClick={() => setIsRescheduleOpen(false)} className="flex-1 h-14 rounded-2xl text-[12px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50">
                Cancel
              </Button>
              <Button onClick={handleReschedule} disabled={submitting || !rescheduleReason || !rescheduleTime} className="flex-[2] h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[12px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98]">
                {submitting ? "Sending..." : "Request Reschedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default TalentInterviews;
