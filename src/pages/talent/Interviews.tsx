import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, Clock, Video, Building2,
  CalendarCheck, CalendarClock, AlertCircle,
  ChevronRight, MessageSquare, ArrowRight,
  ChevronLeft, Info
} from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface V2Interview {
  id: string;
  hire_request_id: string;
  client_user_id: string;
  talent_user_id: string;
  calendly_link: string | null;
  scheduled_time: string | null;
  status: string;
  meeting_notes: string | null;
  created_at: string;
  hr_v2_hire_requests: {
    title: string;
    role_summary: string | null;
  } | null;
  client_company_name?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; accent: string; icon: React.ReactNode }> = {
  pending: { label: "Requested", color: "text-amber-600 bg-amber-50/50 border-amber-100", accent: "bg-amber-600", icon: <CalendarClock className="h-3.5 w-3.5" /> },
  accepted: { label: "Scheduled", color: "text-blue-600 bg-blue-50/50 border-blue-100", accent: "bg-blue-600", icon: <CalendarCheck className="h-3.5 w-3.5" /> },
  scheduled: { label: "Scheduled", color: "text-blue-600 bg-blue-50/50 border-blue-100", accent: "bg-blue-600", icon: <CalendarCheck className="h-3.5 w-3.5" /> },
  reschedule_requested: { label: "Reschedule Req.", color: "text-orange-600 bg-orange-50/50 border-orange-100", accent: "bg-orange-600", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  completed: { label: "Completed", color: "text-emerald-600 bg-emerald-50/50 border-emerald-100", accent: "bg-emerald-600", icon: <CalendarCheck className="h-3.5 w-3.5" /> },
  cancelled: { label: "Cancelled", color: "text-slate-400 bg-slate-50 border-slate-200", accent: "bg-slate-400", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  declined: { label: "Declined", color: "text-slate-400 bg-slate-50 border-slate-200", accent: "bg-slate-400", icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

const TalentInterviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<V2Interview[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedInterview, setSelectedInterview] = useState<V2Interview | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchInterviews = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("hr_v2_interviews")
        .select(`
          *,
          hr_v2_hire_requests(title, role_summary)
        `)
        .eq("talent_user_id", user.id)
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      
      const enrichedData = await Promise.all((data || []).map(async (inv) => {
        let companyName = "Partner Company";
        const { data: client } = await supabase.from("clients").select("company_name").eq("user_id", inv.client_user_id).single();
        if (client?.company_name) companyName = client.company_name;
        return { ...inv, client_company_name: companyName } as V2Interview;
      }));

      setInterviews(enrichedData);
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchInterviews();
    }
  }, [user, fetchInterviews]);

  const handleAccept = async (interviewId: string) => {
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("hr_v2_interviews")
        .update({ status: "accepted" })
        .eq("id", interviewId);

      if (error) throw error;

      toast({ title: "Interview Accepted", description: "The interview has been scheduled." });
      if (selectedInterview) setSelectedInterview({ ...selectedInterview, status: "accepted" });
      fetchInterviews();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async (interviewId: string) => {
    if (!confirm("Are you sure you want to decline this interview request?")) return;
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("hr_v2_interviews")
        .update({ status: "declined" })
        .eq("id", interviewId);

      if (error) throw error;

      toast({ title: "Interview Declined", description: "The request has been declined." });
      if (selectedInterview) setSelectedInterview({ ...selectedInterview, status: "declined" });
      setIsDrawerOpen(false);
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
        .from("hr_v2_interviews")
        .update({ 
          status: "reschedule_requested",
          meeting_notes: `${selectedInterview.meeting_notes ? selectedInterview.meeting_notes + '\n\n' : ''}Reschedule Request from Talent: ${rescheduleReason}\nProposed Time: ${rescheduleTime}`
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

  const openInterviewDetails = (interview: V2Interview) => {
    setSelectedInterview(interview);
    setIsDrawerOpen(true);
  };

  const isFuture = (dateStr: string | null) => dateStr ? new Date(dateStr) >= new Date() : true;

  const upcoming = interviews.filter(i => ["accepted", "scheduled"].includes(i.status) && isFuture(i.scheduled_time));
  const pending = interviews.filter(i => ["pending", "reschedule_requested"].includes(i.status));
  const completed = interviews.filter(i => ["completed", "declined", "cancelled"].includes(i.status) || (["accepted", "scheduled"].includes(i.status) && !isFuture(i.scheduled_time)));
  
  const upcomingCount = upcoming.length;
  const pendingCount = pending.length;

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 w-full mx-auto p-4 md:p-8">
        <div className="h-10 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />)}
        </div>
        <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg mt-4" />
      </div>
    );
  }

  const renderInterviewList = (list: V2Interview[], emptyMessage: string) => {
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
            const status = STATUS_MAP[interview.status] || STATUS_MAP.pending;
            
            return (
              <div 
                key={interview.id} 
                onClick={() => openInterviewDetails(interview)}
                className="group px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all cursor-pointer relative"
              >
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {interview.hr_v2_hire_requests?.title}
                    </h3>
                    <div className={clsx("flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest", status.color)}>
                      <div className={clsx("h-1.5 w-1.5 rounded-full", status.accent)} />
                      {status.label}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-[12px] font-medium text-slate-500">
                    <div className="flex items-center gap-2">
                       <Building2 className="h-3.5 w-3.5 text-slate-300" />
                       <span className="text-slate-400 leading-none">{interview.client_company_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Clock className="h-3.5 w-3.5 text-slate-300" />
                       <span className="leading-none">{interview.scheduled_time ? format(new Date(interview.scheduled_time), "MMM d, h:mm a") : "Time TBD"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Video className="h-3.5 w-3.5 text-slate-300" />
                       <span className="leading-none">Virtual</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
                   {interview.status === "pending" && (
                     <Button variant="outline" className="h-10 px-6 border-blue-600 text-blue-600 hover:bg-blue-50 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all" onClick={(e) => { e.stopPropagation(); handleAccept(interview.id); }}>
                       Accept
                     </Button>
                   )}
                   {["scheduled", "accepted"].includes(interview.status) && isFuture(interview.scheduled_time) && interview.calendly_link && (
                     <Button className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all" onClick={(e) => { e.stopPropagation(); window.open(interview.calendly_link!, '_blank'); }}>
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
    <div className="w-full p-4 md:p-8 space-y-10 animate-fade-in min-h-screen">
      {/* ── Page Header Strip ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">Interviews</h1>
          <p className="text-[15px] text-slate-500 font-medium">Manage your virtual meetings and screening calls.</p>
        </div>
        
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
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <TabsList className="bg-transparent border-none p-0 h-auto gap-8">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 pb-2 text-[12px] font-bold uppercase tracking-widest text-slate-400">Upcoming</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 pb-2 text-[12px] font-bold uppercase tracking-widest text-slate-400">Requests {pendingCount > 0 && `(${pendingCount})`}</TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 pb-2 text-[12px] font-bold uppercase tracking-widest text-slate-400">Past / Handled</TabsTrigger>
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
                  <h2 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">{selectedInterview.hr_v2_hire_requests?.title}</h2>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Partner</p>
                      <p className="text-[14px] font-bold text-slate-900">{selectedInterview.client_company_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 px-10 py-10 space-y-12">
                 <section className="space-y-6">
                   <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-blue-600 pl-4 py-1">Virtual Session Info</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                          <p className="text-[13px] font-bold text-slate-900">{selectedInterview.scheduled_time ? format(new Date(selectedInterview.scheduled_time), "EEEE, MMM d") : "TBD"}</p>
                        </div>
                      </div>
                      <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
                          <p className="text-[13px] font-bold text-slate-900">{selectedInterview.scheduled_time ? format(new Date(selectedInterview.scheduled_time), "h:mm a") : "TBD"}</p>
                        </div>
                      </div>
                   </div>

                   {["scheduled", "accepted"].includes(selectedInterview.status) && selectedInterview.calendly_link && (
                     <div className="p-6 rounded-2xl bg-blue-50/30 border border-blue-100 space-y-4">
                        <div className="flex items-center gap-3">
                          <Video className="h-5 w-5 text-blue-600" />
                          <h4 className="text-[14px] font-bold text-slate-900">Meeting Access</h4>
                        </div>
                        <p className="text-[13px] text-slate-600 font-medium break-all leading-relaxed">
                          Secure link: <span className="text-blue-600 select-all">{selectedInterview.calendly_link}</span>
                        </p>
                        <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/10" onClick={() => window.open(selectedInterview.calendly_link!, '_blank')}>
                          Join Session Now
                        </Button>
                     </div>
                   )}
                 </section>

                 <div className="h-px bg-slate-100 w-full" />

                 <section className="space-y-6">
                   <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-slate-200 pl-4 py-1">Position Snapshot</h3>
                   <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Role Details</p>
                     <p className="text-[14px] font-bold text-slate-900">{selectedInterview.hr_v2_hire_requests?.title}</p>
                   </div>
                   <div className="pt-2">
                     <Button variant="outline" className="h-11 px-6 border-slate-200 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 rounded-xl transition-all" asChild>
                       <Link to={`/talent/jobs?id=${selectedInterview.hire_request_id}`}>
                         Review Full Job Briefing
                         <ArrowRight className="h-3.5 w-3.5 ml-2" />
                       </Link>
                     </Button>
                   </div>
                 </section>
                 
                 {selectedInterview.meeting_notes && (
                    <section className="space-y-6">
                       <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest border-l-2 border-slate-200 pl-4 py-1">Interview Prep Notes</h3>
                       <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 text-[14px] text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                         {selectedInterview.meeting_notes}
                       </div>
                    </section>
                 )}
              </div>

              <div className="sticky bottom-0 left-0 w-full p-8 bg-white/80 backdrop-blur-md border-t border-slate-100 flex flex-col gap-3 z-20">
                {selectedInterview.status === "pending" && (
                  <Button className="h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[12px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98]" onClick={() => handleAccept(selectedInterview.id)} disabled={submitting}>
                    {submitting ? "Confirming..." : "Confirm Attendance"}
                  </Button>
                )}
                
                {["pending", "scheduled", "accepted"].includes(selectedInterview.status) && isFuture(selectedInterview.scheduled_time) && (
                  <Button variant="outline" className="h-14 border-slate-200 rounded-2xl text-[12px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900" onClick={() => setIsRescheduleOpen(true)}>
                    Request New Time
                  </Button>
                )}

                {selectedInterview.status === "pending" && (
                  <Button variant="ghost" className="h-14 text-red-500 hover:text-red-600 text-[11px] font-bold uppercase tracking-widest" onClick={() => handleDecline(selectedInterview.id)}>
                     Decline Invitation
                  </Button>
                )}
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
