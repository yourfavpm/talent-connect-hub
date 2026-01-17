import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
  UserCheck,
  Globe,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

const TalentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [talent, setTalent] = useState<any>(null);
  const [workHistory, setWorkHistory] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [references, setReferences] = useState<any[]>([]);
  const [vettingLevels, setVettingLevels] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vettingNotes, setVettingNotes] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTalentData();
      fetchAdmins();
    }
  }, [id]);

  const fetchTalentData = async () => {
    try {
      const { data: talentData, error } = await supabase
        .from("talents")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setTalent(talentData);

      // Fetch all related data in parallel
      const [workData, eduData, certData, refData, vettingData] = await Promise.all([
        supabase.from("talent_work_history").select("*").eq("talent_id", id).order("start_date", { ascending: false }),
        supabase.from("talent_education").select("*").eq("talent_id", id).order("start_year", { ascending: false }),
        supabase.from("talent_certifications").select("*").eq("talent_id", id),
        supabase.from("talent_references").select("*").eq("talent_id", id),
        supabase.from("talent_vetting").select("*").eq("talent_id", id).order("level", { ascending: true }),
      ]);

      setWorkHistory(workData.data || []);
      setEducation(eduData.data || []);
      setCertifications(certData.data || []);
      setReferences(refData.data || []);
      setVettingLevels(vettingData.data || []);
    } catch (error) {
      console.error("Error fetching talent:", error);
      toast({
        title: "Error",
        description: "Failed to load talent data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      // Get all admin user IDs
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["super_admin", "operations_admin", "vetting_admin", "talent_manager"] as any);

      if (adminRoles && adminRoles.length > 0) {
        const userIds = adminRoles.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);

        setAdmins(
          (profiles || []).map((p) => ({
            ...p,
            role: adminRoles.find((r) => r.user_id === p.user_id)?.role,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const handleUpdateVettingLevel = async (levelId: string, status: "pending" | "approved" | "rejected" | "needs_clarification") => {
    try {
      const notes = vettingNotes[levelId] || "";
      await supabase
        .from("talent_vetting")
        .update({
          status,
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", levelId);

      toast({
        title: "Vetting Updated",
        description: `Level status updated to ${status}`,
      });

      fetchTalentData();
      setVettingNotes((prev) => ({ ...prev, [levelId]: "" }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAssignManager = async (managerId: string) => {
    try {
      await supabase
        .from("talents")
        .update({ assigned_manager: managerId || null })
        .eq("id", id);

      toast({
        title: "Manager Assigned",
        description: "Talent manager has been updated",
      });

      fetchTalentData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePublishToPool = async () => {
    // Check if all vetting levels are approved
    const allApproved = vettingLevels.every((level) => level.status === "approved");

    if (!allApproved) {
      toast({
        title: "Cannot Publish",
        description: "All vetting levels must be approved before publishing",
        variant: "destructive",
      });
      return;
    }

    setPublishing(true);
    try {
      await supabase
        .from("talents")
        .update({ vetting_status: "fully_vetted" })
        .eq("id", id);

      toast({
        title: "Talent Published",
        description: "Talent is now visible in the vetted talent pool",
      });

      fetchTalentData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "needs_clarification":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success/10 text-success">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive">Rejected</Badge>;
      case "needs_clarification":
        return <Badge className="bg-warning/10 text-warning">Needs Clarification</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Pending</Badge>;
    }
  };

  const allApproved = vettingLevels.every((level) => level.status === "approved");
  const approvedCount = vettingLevels.filter((level) => level.status === "approved").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Talent Not Found</AlertTitle>
          <AlertDescription>The requested talent profile could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/talents")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {talent.first_name} {talent.last_name}
            </h1>
            <p className="text-muted-foreground font-mono">{talent.talent_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {talent.onboarding_completed ? (
            <Badge className="bg-success/10 text-success">Onboarding Complete</Badge>
          ) : (
            <Badge className="bg-warning/10 text-warning">Onboarding Incomplete</Badge>
          )}
          <Badge
            className={
              talent.vetting_status === "fully_vetted"
                ? "bg-success/10 text-success"
                : talent.vetting_status === "partially_vetted"
                  ? "bg-warning/10 text-warning"
                  : "bg-muted text-muted-foreground"
            }
          >
            {talent.vetting_status === "fully_vetted"
              ? "Fully Vetted"
              : talent.vetting_status === "partially_vetted"
                ? "Partially Vetted"
                : "Unvetted"}
          </Badge>
        </div>
      </div>

      {/* Cannot vet warning */}
      {!talent.onboarding_completed && (
        <Alert className="border-warning/50 bg-warning/5">
          <AlertCircle className="h-5 w-5 text-warning" />
          <AlertTitle className="text-warning">Cannot Vet - Onboarding Incomplete</AlertTitle>
          <AlertDescription>
            This talent has not completed their onboarding. Vetting can only begin once they complete their profile.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Talent Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{talent.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{talent.phone || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{talent.country || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Timezone</p>
                    <p className="font-medium">{talent.timezone || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Working Hours</p>
                    <p className="font-medium">{talent.preferred_working_hours || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Primary Role</p>
                  <p className="font-medium">{talent.primary_role?.replace("_", " ") || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="font-medium">{talent.years_of_experience || 0} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Availability</p>
                  <p className="font-medium">{talent.availability?.replace("_", " ") || "Not specified"}</p>
                </div>
              </div>

              {talent.secondary_skills?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {talent.secondary_skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {talent.tools_familiar_with?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tools</p>
                  <div className="flex flex-wrap gap-2">
                    {talent.tools_familiar_with.map((tool: string) => (
                      <Badge key={tool} variant="outline">{tool}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {talent.languages_spoken?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {talent.languages_spoken.map((lang: string) => (
                      <Badge key={lang} variant="outline">{lang}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work History Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Work History
                <Badge variant="outline" className="ml-auto">{workHistory.length} positions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No work history provided</p>
              ) : (
                <div className="space-y-4">
                  {workHistory.map((work, index) => (
                    <div key={work.id}>
                      {index > 0 && <Separator className="mb-4" />}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{work.role_title}</h4>
                          <p className="text-muted-foreground">{work.company_name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {work.start_date} - {work.is_current ? "Present" : work.end_date || "N/A"}
                          </p>
                        </div>
                        {work.is_current && <Badge className="bg-success/10 text-success">Current</Badge>}
                      </div>
                      {work.role_description && (
                        <p className="text-sm mt-2">{work.role_description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Education Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Education
                <Badge variant="outline" className="ml-auto">{education.length} entries</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {education.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No education provided</p>
              ) : (
                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <div key={edu.id}>
                      {index > 0 && <Separator className="mb-4" />}
                      <h4 className="font-semibold">{edu.institution_name}</h4>
                      <p className="text-muted-foreground">
                        {edu.field_of_study} - {edu.education_level?.replace("_", " ")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {edu.start_year} - {edu.is_current ? "Present" : edu.end_year || "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certifications Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Certifications
                <Badge variant="outline" className="ml-auto">{certifications.length} certs</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {certifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No certifications provided</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certifications.map((cert) => (
                    <Card key={cert.id}>
                      <CardContent className="p-4">
                        <h4 className="font-semibold">{cert.certification_name}</h4>
                        <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                        {cert.year_obtained && (
                          <p className="text-xs text-muted-foreground mt-1">Obtained: {cert.year_obtained}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* References Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                References
                <Badge variant="outline" className="ml-auto">{references.length} refs</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {references.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No references provided</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {references.map((ref) => (
                    <Card key={ref.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{ref.reference_name}</h4>
                          {getStatusBadge(ref.verification_status || "pending")}
                        </div>
                        <p className="text-sm text-muted-foreground">{ref.relationship}</p>
                        <p className="text-sm">{ref.email}</p>
                        {ref.phone && <p className="text-sm">{ref.phone}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Vetting Panel */}
        <div className="space-y-6">
          {/* Assign Manager */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Talent Manager
              </CardTitle>
              <CardDescription>Assign a manager to oversee this talent</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={talent.assigned_manager || "unassigned"}
                onValueChange={(value) => handleAssignManager(value === "unassigned" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {admins.map((admin) => (
                    <SelectItem key={admin.user_id} value={admin.user_id}>
                      {admin.first_name} {admin.last_name} ({admin.role?.replace("_", " ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Vetting Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                TCF Vetting Progress
              </CardTitle>
              <CardDescription>
                {approvedCount} of {vettingLevels.length} levels approved
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vettingLevels.map((level) => (
                <Card
                  key={level.id}
                  className={
                    level.status === "approved"
                      ? "border-success/50 bg-success/5"
                      : level.status === "rejected"
                        ? "border-destructive/50 bg-destructive/5"
                        : ""
                  }
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(level.status)}
                        <span className="font-medium">Level {level.level}</span>
                      </div>
                      {getStatusBadge(level.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{level.level_name}</p>

                    {level.admin_notes && (
                      <div className="p-2 bg-muted rounded text-sm">
                        <p className="font-medium text-xs text-muted-foreground mb-1">Notes:</p>
                        {level.admin_notes}
                      </div>
                    )}

                    {level.status !== "approved" && talent.onboarding_completed && (
                      <div className="space-y-2 pt-2 border-t">
                        <Textarea
                          placeholder="Add notes..."
                          value={vettingNotes[level.id] || ""}
                          onChange={(e) =>
                            setVettingNotes((prev) => ({ ...prev, [level.id]: e.target.value }))
                          }
                          className="text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-success hover:bg-success/90"
                            onClick={() => handleUpdateVettingLevel(level.id, "approved")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleUpdateVettingLevel(level.id, "rejected")}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleUpdateVettingLevel(level.id, "needs_clarification")}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Request Clarification
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Publish Button */}
          <Card className={allApproved ? "border-success/50 bg-success/5" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Publish to Talent Pool
              </CardTitle>
              <CardDescription>
                {allApproved
                  ? "All vetting levels approved. Ready to publish!"
                  : `Complete all vetting levels to publish (${approvedCount}/${vettingLevels.length})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {talent.vetting_status === "fully_vetted" ? (
                <Alert className="border-success/50 bg-success/5">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <AlertTitle className="text-success">Published</AlertTitle>
                  <AlertDescription>
                    This talent is visible in the vetted talent pool for clients.
                  </AlertDescription>
                </Alert>
              ) : (
                <Button
                  className="w-full"
                  disabled={!allApproved || publishing || !talent.onboarding_completed}
                  onClick={handlePublishToPool}
                >
                  {publishing ? "Publishing..." : "Approve & Publish to Pool"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TalentDetail;
