import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Loader2, CheckCircle2, MapPin, Link as LinkIcon, Globe } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TimezoneSelector } from "@/components/talent/onboarding/TimezoneSelector";

interface InterviewInviteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  talentId: string;
  talentName: string;
}

export const InterviewInviteDrawer = ({ 
  isOpen, 
  onClose, 
  talentId, 
  talentName 
}: InterviewInviteDrawerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Form State
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [location, setLocation] = useState<string>("Remote (Video Call)");
  const [link, setLink] = useState<string>("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchJobs();
      setSuccess(false);
    }
  }, [isOpen]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (!client) return;

      const { data: jobsList, error } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("client_id", client.id)
        .eq("status", "published");

      if (error) throw error;
      setJobs(jobsList || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedJobId || !date || !time || !timezone) {
      toast({
        title: "Information required",
        description: "Please select a job, date, time, and timezone for the interview.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await (supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single() as any);
      
      if (!client) return;

      // Create interview request
      const scheduledAt = new Date(date);
      const [hours, minutes] = time.split(':');
      scheduledAt.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await (supabase
        .from("interview_requests" as any)
        .insert({
          client_id: client.id,
          talent_id: talentId,
          job_id: selectedJobId,
          scheduled_at: scheduledAt.toISOString(),
          timezone: timezone,
          location: location,
          meeting_link: link,
          message: message,
          status: 'pending'
        } as any) as any);

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Invitation Sent",
        description: `Your interview invitation has been sent to ${talentName}.`,
      });
      
      // Close after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md bg-white border-l border-gray-100 flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-gray-50 flex-shrink-0 text-left">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            Invite to Interview
          </SheetTitle>
          <SheetDescription className="text-gray-500 mt-1">
            Send a request to interview <span className="font-semibold text-gray-900">{talentName}</span> for one of your active roles.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
              <div className="h-16 w-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Invitation Sent!</h3>
              <p className="text-gray-500 mt-2 max-w-[240px]">
                We'll notify {talentName} immediately. You'll receive an update once they respond.
              </p>
            </div>
          ) : (
            <>
              {/* Job Selection */}
              <div className="space-y-3">
                <Label htmlFor="job" className="text-sm font-semibold text-gray-700">Select Job Opening</Label>
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading your jobs...
                  </div>
                ) : (
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger id="job" className="h-11 border-gray-200 focus:ring-blue-500">
                      <SelectValue placeholder="Select an active job" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {jobs.map(job => (
                        <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                      ))}
                      {jobs.length === 0 && (
                        <div className="p-2 text-sm text-gray-400 italic">No published jobs found</div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Proposed Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-11 border-gray-200",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                        {date ? format(date, "MMM dd, yyyy") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Selection */}
                <div className="space-y-3">
                  <Label htmlFor="time" className="text-sm font-semibold text-gray-700">Proposed Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      type="time" 
                      id="time" 
                      className="h-11 pl-10 border-gray-200 focus:ring-blue-500"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Timezone Selector */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Proposed Timezone</Label>
                <TimezoneSelector value={timezone} onChange={setTimezone} className="h-11" />
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Logistics & Link</div>
                
                {/* Location */}
                <div className="space-y-3">
                  <Label htmlFor="location" className="text-sm font-semibold text-gray-700">Interview Location / Link Type</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="e.g. Google Meet, Zoom, or Office Address"
                      id="location" 
                      className="h-11 pl-10 border-gray-200 focus:ring-blue-500"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                {/* Meeting Link */}
                <div className="space-y-3">
                  <Label htmlFor="link" className="text-sm font-semibold text-gray-700">Meeting Link (Optional)</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="https://meet.google.com/..."
                      id="link" 
                      className="h-11 pl-10 border-gray-200 focus:ring-blue-500 font-mono text-xs"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-3">
                <Label htmlFor="message" className="text-sm font-semibold text-gray-700">Optional Message</Label>
                <Textarea 
                  id="message"
                  placeholder="Tell the talent why you're interested in their profile..."
                  className="min-h-[100px] border-gray-200 focus:ring-blue-500 resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {!success && (
          <SheetFooter className="p-6 border-t border-gray-50 flex-shrink-0">
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 h-11 border-gray-200" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button 
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/20"
                onClick={handleSubmit}
                disabled={submitting || !selectedJobId}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
