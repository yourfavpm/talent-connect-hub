import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, MapPin, Clock, DollarSign, Briefcase, Send } from "lucide-react";

const TalentJobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [talent, setTalent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Get talent profile
      const { data: talentData } = await supabase
        .from("talents")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      setTalent(talentData);

      // Get published jobs
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*, clients(company_name)")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      setJobs(jobsData || []);

      // Get user's applications
      if (talentData) {
        const { data: appsData } = await supabase
          .from("job_applications")
          .select("*")
          .eq("talent_id", talentData.id);

        setApplications(appsData || []);
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
        title: "Application Submitted!",
        description: "Your application has been sent to the admin for review.",
      });

      setSelectedJob(null);
      setCoverLetter("");
      fetchData();
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

  const hasApplied = (jobId: string) => {
    return applications.some((app) => app.job_id === jobId);
  };

  const getApplicationStatus = (jobId: string) => {
    const app = applications.find((a) => a.job_id === jobId);
    return app?.status || null;
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.role_needed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.required_skills?.some((skill: string) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Available Jobs</h1>
        <p className="text-muted-foreground mt-1">Browse and apply to jobs that match your skills</p>
      </div>

      {talent?.vetting_status !== "fully_vetted" && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-4">
            <p className="text-warning font-medium">
              Complete your vetting to apply to jobs. Your profile is currently under review.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by role, skills, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No jobs available at the moment</p>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      {hasApplied(job.id) && (
                        <Badge
                          className={
                            getApplicationStatus(job.id) === "shortlisted"
                              ? "bg-success/10 text-success"
                              : getApplicationStatus(job.id) === "rejected"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          }
                        >
                          {getApplicationStatus(job.id) === "shortlisted"
                            ? "Shortlisted"
                            : getApplicationStatus(job.id) === "rejected"
                            ? "Not Selected"
                            : "Applied"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-4">{job.responsibilities}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {job.role_needed}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.weekly_hours} hrs/week
                      </span>
                      {job.budget_min && job.budget_max && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${job.budget_min} - ${job.budget_max}/hr
                        </span>
                      )}
                      {job.duration && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.duration}
                        </span>
                      )}
                    </div>

                    {job.required_skills && (
                      <div className="flex flex-wrap gap-2">
                        {job.required_skills.map((skill: string) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    {hasApplied(job.id) ? (
                      <Button variant="outline" disabled>
                        Applied
                      </Button>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedJob(job)}
                            disabled={talent?.vetting_status !== "fully_vetted"}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Apply
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Apply for {job.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Cover Letter (Optional)</Label>
                              <Textarea
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                placeholder="Tell us why you're a great fit for this role..."
                                rows={5}
                              />
                            </div>
                            <Button
                              onClick={handleApply}
                              disabled={applying}
                              className="w-full"
                            >
                              {applying ? "Submitting..." : "Submit Application"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TalentJobs;
