import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  Building2,
  CalendarCheck,
  CalendarClock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";

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

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  requested: { label: "Requested", color: "text-amber-600 bg-amber-50 border-amber-200", icon: <CalendarClock className="h-3.5 w-3.5" /> },
  scheduled: { label: "Scheduled", color: "text-blue-600 bg-blue-50 border-blue-200", icon: <CalendarCheck className="h-3.5 w-3.5" /> },
  reschedule_requested: { label: "Reschedule Req.", color: "text-orange-600 bg-orange-50 border-orange-200", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  completed: { label: "Completed", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CalendarCheck className="h-3.5 w-3.5" /> },
  cancelled: { label: "Cancelled", color: "text-gray-600 bg-gray-50 border-gray-200", icon: <AlertCircle className="h-3.5 w-3.5" /> },
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

  useEffect(() => {
    if (user) {
      fetchInterviews();
    }
  }, [user]);

  const fetchInterviews = async () => {
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
  };

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
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
        <div className="py-16 text-center border rounded-xl bg-white border-gray-200 border-dashed">
          <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">No interviews found.</p>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((interview) => {
          const statusConfig = STATUS_MAP[interview.status] || STATUS_MAP.scheduled;
          const isVideo = interview.interview_type === "video";
          
          return (
            <Card 
              key={interview.id} 
              className="group border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow transition-all cursor-pointer bg-white"
              onClick={() => openInterviewDetails(interview)}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-primary transition-colors truncate">{interview.job?.title}</h3>
                      <Badge variant="outline" className={`font-medium px-2 py-0.5 text-[11px] rounded transition-colors ${statusConfig.color}`}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate font-medium">{interview.client?.company_name}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {format(new Date(interview.scheduled_at), "EEEE, MMM d, yyyy")}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {format(new Date(interview.scheduled_at), "h:mm a")} ({interview.duration_minutes} min)</span>
                      <span className="flex items-center gap-1.5">
                        {isVideo ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />} 
                        {isVideo ? "Video Call" : "Phone Call"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex items-center gap-3 justify-end mt-2 sm:mt-0">
                    {interview.status === "requested" && (
                      <Button size="sm" variant="outline" className="bg-white border-gray-200 hover:bg-gray-50 h-8 text-xs font-medium" onClick={(e) => { e.stopPropagation(); handleAccept(interview.id); }}>
                        Accept
                      </Button>
                    )}
                    {interview.status === "scheduled" && new Date(interview.scheduled_at) > new Date() && interview.meeting_link && (
                      <Button size="sm" className="bg-brand-primary hover:bg-brand-primary/90 text-white h-8 text-xs font-medium" onClick={(e) => { e.stopPropagation(); window.open(interview.meeting_link!, '_blank'); }}>
                        Join Call
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-100 hidden sm:flex">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Interviews</h1>
        <p className="text-sm text-gray-500 mt-1">Track upcoming and past interviews.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Upcoming</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{upcomingCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{completed.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <CalendarCheck className="h-4 w-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{pendingCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <CalendarClock className="h-4 w-4 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Reschedule</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{rescheduleCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Content */}
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="bg-gray-100/80 p-1">
          <TabsTrigger value="upcoming" className="text-sm">Upcoming</TabsTrigger>
          <TabsTrigger value="pending" className="text-sm">Pending</TabsTrigger>
          <TabsTrigger value="completed" className="text-sm">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="focus-visible:outline-none focus-visible:ring-0">
          {renderInterviewList(upcoming, "No upcoming interviews scheduled.")}
        </TabsContent>
        
        <TabsContent value="pending" className="focus-visible:outline-none focus-visible:ring-0">
          {renderInterviewList(pending, "No pending interview requests.")}
        </TabsContent>

        <TabsContent value="completed" className="focus-visible:outline-none focus-visible:ring-0">
          {renderInterviewList(completed, "No completed interviews yet.")}
        </TabsContent>
      </Tabs>

      {/* Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 border-l border-gray-200 sm:rounded-l-2xl">
          {selectedInterview && (
            <div className="flex flex-col h-full bg-white">
              <div className="px-6 py-8 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-3">
                   <Badge variant="outline" className={`font-medium px-2.5 py-1 text-xs rounded shadow-none ${STATUS_MAP[selectedInterview.status]?.color}`}>
                     {STATUS_MAP[selectedInterview.status]?.icon}
                     <span className="ml-1.5">{STATUS_MAP[selectedInterview.status]?.label}</span>
                   </Badge>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedInterview.job?.title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{selectedInterview.client?.company_name}</span>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-8">
                 {/* Detail Cards */}
                 <section>
                   <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Schedule Info</h3>
                   <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{format(new Date(selectedInterview.scheduled_at), "EEEE, MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{format(new Date(selectedInterview.scheduled_at), "h:mm a")} ({selectedInterview.duration_minutes} mins)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Video className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700 capitalize">{selectedInterview.interview_type} Call</span>
                      </div>
                      {selectedInterview.meeting_link && (
                        <div className="flex items-center gap-3 pt-2 border-t border-gray-200 mt-2">
                          <ExternalLink className="h-4 w-4 text-brand-primary" />
                          <a href={selectedInterview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-brand-primary font-medium hover:underline break-all">
                            {selectedInterview.meeting_link}
                          </a>
                        </div>
                      )}
                   </div>
                 </section>

                 <div className="h-px bg-gray-100 w-full" />

                 <section>
                   <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Job Summary</h3>
                   <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Role Needed</p>
                        <p className="font-medium text-gray-900">{selectedInterview.job?.role_needed?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                   </div>
                 </section>
                 
                 {selectedInterview.notes && (
                    <section>
                       <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Notes</h3>
                       <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                         {selectedInterview.notes}
                       </div>
                    </section>
                 )}
              </div>

              {/* Action Footer depending on status */}
              <div className="border-t border-gray-200 p-4 bg-gray-50 shrink-0 space-y-3">
                {selectedInterview.status === "requested" && (
                  <Button className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white" onClick={() => handleAccept(selectedInterview.id)} disabled={submitting}>
                    {submitting ? "Accepting..." : "Accept Interview"}
                  </Button>
                )}
                {selectedInterview.status === "scheduled" && new Date(selectedInterview.scheduled_at) > new Date() && selectedInterview.meeting_link && (
                  <Button className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white" onClick={() => window.open(selectedInterview.meeting_link!, '_blank')}>
                    Join Call
                  </Button>
                )}
                
                {["requested", "scheduled"].includes(selectedInterview.status) && new Date(selectedInterview.scheduled_at) > new Date() && (
                  <Button variant="outline" className="w-full bg-white border-gray-200 text-gray-700" onClick={() => setIsRescheduleOpen(true)}>
                    Request Reschedule
                  </Button>
                )}
                
                <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900">
                  <MessageSquare className="h-4 w-4 mr-2" /> Message Client
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reschedule Modal */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Reschedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 flex items-start gap-3">
               <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
               <div>
                 <p className="text-sm font-medium text-orange-900">This will notify the client.</p>
                 <p className="text-xs text-orange-800 mt-1">Provide clear reasoning and alternative times to keep the process moving efficiently.</p>
               </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Reason for rescheduling</Label>
              <Input
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g. Unexpected scheduling conflict"
                className="bg-white border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Proposed alternative times</Label>
              <Input
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                placeholder="e.g. Wednesday after 2PM EST"
                className="bg-white border-gray-200"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsRescheduleOpen(false)} className="bg-white">Cancel</Button>
            <Button onClick={handleReschedule} disabled={submitting || !rescheduleReason || !rescheduleTime} className="bg-brand-primary">
              {submitting ? "Sending..." : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TalentInterviews;
