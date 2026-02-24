import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent: any;
  clientId: string | undefined;
}

export const InterviewModal = ({ open, onOpenChange, talent, clientId }: InterviewModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    jobId: "",
    proposedDateTime: "",
    message: "",
  });

  useEffect(() => {
    if (open && clientId) {
      fetchJobs();
    }
  }, [open, clientId]);

  const fetchJobs = async () => {
    try {
      const { data } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("client_id", clientId || "")
        .in("status", ["draft", "published", "filled", "closed"]);

      if (data) setJobs(data);
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!talent || !clientId) return;
    
    setLoading(true);
    try {
      // Create a support ticket to process this request
      const jobName = jobs.find(j => j.id === formData.jobId)?.title || "General Inquiry";
      const subject = `Interview Request: ${talent.first_name} ${talent.last_name}`;
      const description = `Client requested to interview talent ${talent.first_name} ${talent.last_name} (${talent.talent_id}).\n\nRelated Job: ${jobName}\nProposed Time: ${formData.proposedDateTime}\n\nMessage from Client:\n${formData.message || "No message provided."}`;

      const { data: userData } = await supabase.auth.getUser();
      
      if (userData.user) {
        await supabase.from("support_tickets").insert({
          user_id: userData.user.id,
          subject,
          description,
          category: "job",
          status: "open",
          priority: "normal"
        });
      }

      toast({
        title: "Interview invite sent",
        description: `We've notified ${talent.first_name} and our team will coordinate the schedule via email.`,
      });
      onOpenChange(false);
      setFormData({ jobId: "", proposedDateTime: "", message: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send interview invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!talent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite to Interview</DialogTitle>
          <DialogDescription>
            Propose a time to speak with {talent.first_name} {talent.last_name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="job">Related Job (Optional)</Label>
            <Select 
              value={formData.jobId} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, jobId: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General meeting</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="datetime">Proposed Date & Time (include timezone)</Label>
            <Input 
              id="datetime" 
              placeholder="e.g. Next Tuesday at 2 PM EST" 
              required
              value={formData.proposedDateTime}
              onChange={(e) => setFormData(prev => ({ ...prev, proposedDateTime: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Note to Talent (Optional)</Label>
            <Textarea 
              id="message" 
              placeholder="Introduce yourself and share what you'd like to discuss..."
              className="resize-none h-24"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            />
          </div>
          
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
