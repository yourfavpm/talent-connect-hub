import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Save,
  ArrowRight,
  FileText
} from "lucide-react";

const TalentProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [talent, setTalent] = useState<any>(null);
  const [workHistory, setWorkHistory] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [references, setReferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    timezone: "",
    preferredWorkingHours: "",
    primaryRole: "",
    secondarySkills: "",
    yearsOfExperience: "",
    toolsFamiliarWith: "",
    languagesSpoken: "",
    availability: "",
  });

  useEffect(() => {
    if (user) {
      fetchTalentData();
    }
  }, [user]);

  const fetchTalentData = async () => {
    try {
      const { data: talentData } = await supabase
        .from("talents")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (talentData) {
        setTalent(talentData);
        setFormData({
          firstName: talentData.first_name || "",
          lastName: talentData.last_name || "",
          email: talentData.email || "",
          phone: talentData.phone || "",
          country: talentData.country || "",
          timezone: talentData.timezone || "",
          preferredWorkingHours: talentData.preferred_working_hours || "",
          primaryRole: talentData.primary_role || "",
          secondarySkills: talentData.secondary_skills?.join(", ") || "",
          yearsOfExperience: talentData.years_of_experience?.toString() || "",
          toolsFamiliarWith: talentData.tools_familiar_with?.join(", ") || "",
          languagesSpoken: talentData.languages_spoken?.join(", ") || "",
          availability: talentData.availability || "",
        });

        // Fetch related data
        const [workData, eduData, certData, refData] = await Promise.all([
          supabase.from("talent_work_history").select("*").eq("talent_id", talentData.id).order("start_date", { ascending: false }),
          supabase.from("talent_education").select("*").eq("talent_id", talentData.id).order("start_year", { ascending: false }),
          supabase.from("talent_certifications").select("*").eq("talent_id", talentData.id),
          supabase.from("talent_references").select("*").eq("talent_id", talentData.id),
        ]);

        setWorkHistory(workData.data || []);
        setEducation(eduData.data || []);
        setCertifications(certData.data || []);
        setReferences(refData.data || []);
      }
    } catch (error) {
      console.error("Error fetching talent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!talent) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("talents")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          country: formData.country,
          timezone: formData.timezone,
          preferred_working_hours: formData.preferredWorkingHours,
          primary_role: formData.primaryRole,
          secondary_skills: formData.secondarySkills.split(",").map((s) => s.trim()).filter(Boolean),
          years_of_experience: parseInt(formData.yearsOfExperience) || 0,
          tools_familiar_with: formData.toolsFamiliarWith.split(",").map((s) => s.trim()).filter(Boolean),
          languages_spoken: formData.languagesSpoken.split(",").map((s) => s.trim()).filter(Boolean),
          availability: formData.availability as "full_time" | "part_time" | null,
        })
        .eq("id", talent.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });

      fetchTalentData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateOnboardingProgress = () => {
    if (!talent) return 0;
    
    let score = 0;
    const fields = [
      talent.first_name,
      talent.last_name,
      talent.phone,
      talent.country,
      talent.primary_role,
      talent.years_of_experience,
      talent.availability,
    ];
    
    fields.forEach((f) => {
      if (f) score += 10;
    });

    if (workHistory.length > 0) score += 15;
    if (education.length > 0) score += 10;
    if (certifications.length > 0) score += 5;
    if (references.length > 0) score += 10;

    return Math.min(score, 100);
  };

  const handleCompleteOnboarding = async () => {
    if (!talent) return;
    
    try {
      await supabase
        .from("talents")
        .update({
          onboarding_completed: true,
          onboarding_step: 8,
        })
        .eq("id", talent.id);

      toast({
        title: "Onboarding Completed",
        description: "Your profile is now ready for vetting.",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Alert className="border-warning/50 bg-warning/5">
          <AlertCircle className="h-5 w-5 text-warning" />
          <AlertTitle>No Profile Found</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>You haven't started your onboarding yet. Complete it to create your profile.</span>
            <Button onClick={() => navigate("/talent/onboarding")} className="ml-4">
              Start Onboarding
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const onboardingProgress = calculateOnboardingProgress();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile information and complete your onboarding
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="font-mono">{talent.talent_id}</Badge>
          {talent.onboarding_completed ? (
            <Badge className="bg-success/10 text-success">
              <CheckCircle className="h-3 w-3 mr-1" />
              Onboarding Complete
            </Badge>
          ) : (
            <Badge className="bg-warning/10 text-warning">
              <AlertCircle className="h-3 w-3 mr-1" />
              Onboarding Incomplete
            </Badge>
          )}
        </div>
      </div>

      {/* Onboarding Progress */}
      {!talent.onboarding_completed && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Complete Your Profile to Get Vetted
            </CardTitle>
            <CardDescription>
              Fill in all required information to be matched with jobs. Your profile is {onboardingProgress}% complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={onboardingProgress} className="h-2" />
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <span className={workHistory.length > 0 ? "text-success" : "text-muted-foreground"}>
                  {workHistory.length > 0 ? "✓" : "○"} Work History
                </span>
                <span className={education.length > 0 ? "text-success" : "text-muted-foreground"}>
                  {education.length > 0 ? "✓" : "○"} Education
                </span>
                <span className={references.length > 0 ? "text-success" : "text-muted-foreground"}>
                  {references.length > 0 ? "✓" : "○"} References
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/talent/onboarding")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Resume Onboarding
                </Button>
                {onboardingProgress >= 70 && (
                  <Button onClick={handleCompleteOnboarding}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Complete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="professional" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Professional
          </TabsTrigger>
          <TabsTrigger value="experience" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Experience
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Education
          </TabsTrigger>
          <TabsTrigger value="references" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            References
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic contact and location details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email (read-only)</Label>
                <Input value={formData.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Input
                    value={formData.timezone}
                    onChange={(e) => handleInputChange("timezone", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preferred Working Hours</Label>
                <Input
                  value={formData.preferredWorkingHours}
                  onChange={(e) => handleInputChange("preferredWorkingHours", e.target.value)}
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
              <CardDescription>Your skills, experience, and availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Role</Label>
                <Select value={formData.primaryRole} onValueChange={(v) => handleInputChange("primaryRole", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virtual_assistant">Virtual Assistant</SelectItem>
                    <SelectItem value="customer_support">Customer Support</SelectItem>
                    <SelectItem value="social_media_manager">Social Media Manager</SelectItem>
                    <SelectItem value="product_manager">Product Manager</SelectItem>
                    <SelectItem value="operations_manager">Operations Manager</SelectItem>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="executive_assistant">Executive Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Input
                  type="number"
                  value={formData.yearsOfExperience}
                  onChange={(e) => handleInputChange("yearsOfExperience", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Availability</Label>
                <Select value={formData.availability} onValueChange={(v) => handleInputChange("availability", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time (40 hrs/week)</SelectItem>
                    <SelectItem value="part_time">Part-time (20 hrs/week)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Secondary Skills (comma-separated)</Label>
                <Textarea
                  value={formData.secondarySkills}
                  onChange={(e) => handleInputChange("secondarySkills", e.target.value)}
                  placeholder="Data Entry, Email Management, Calendar Management"
                />
              </div>
              <div className="space-y-2">
                <Label>Tools You're Familiar With (comma-separated)</Label>
                <Textarea
                  value={formData.toolsFamiliarWith}
                  onChange={(e) => handleInputChange("toolsFamiliarWith", e.target.value)}
                  placeholder="Notion, Slack, HubSpot, Asana, Trello"
                />
              </div>
              <div className="space-y-2">
                <Label>Languages Spoken (comma-separated)</Label>
                <Input
                  value={formData.languagesSpoken}
                  onChange={(e) => handleInputChange("languagesSpoken", e.target.value)}
                  placeholder="English, Spanish"
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experience">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Work Experience</CardTitle>
                <CardDescription>Your previous roles and responsibilities</CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate("/talent/onboarding")}>
                Add via Onboarding
              </Button>
            </CardHeader>
            <CardContent>
              {workHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No work experience added yet</p>
                  <Button variant="link" onClick={() => navigate("/talent/onboarding")}>
                    Add your work history
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {workHistory.map((work) => (
                    <Card key={work.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{work.role_title}</h4>
                            <p className="text-muted-foreground">{work.company_name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {work.start_date} - {work.is_current ? "Present" : work.end_date || "N/A"}
                            </p>
                          </div>
                          {work.is_current && (
                            <Badge className="bg-success/10 text-success">Current</Badge>
                          )}
                        </div>
                        {work.role_description && (
                          <p className="text-sm mt-3">{work.role_description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Education</CardTitle>
                  <CardDescription>Your academic background</CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate("/talent/onboarding")}>
                  Add via Onboarding
                </Button>
              </CardHeader>
              <CardContent>
                {education.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No education added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {education.map((edu) => (
                      <Card key={edu.id}>
                        <CardContent className="p-4">
                          <h4 className="font-semibold">{edu.institution_name}</h4>
                          <p className="text-muted-foreground">
                            {edu.field_of_study} - {edu.education_level?.replace("_", " ")}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {edu.start_year} - {edu.is_current ? "Present" : edu.end_year || "N/A"}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {certifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No certifications added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {certifications.map((cert) => (
                      <Card key={cert.id}>
                        <CardContent className="p-4">
                          <h4 className="font-semibold">{cert.certification_name}</h4>
                          <p className="text-muted-foreground">{cert.issuing_organization}</p>
                          {cert.year_obtained && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Obtained: {cert.year_obtained}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="references">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>References</CardTitle>
                <CardDescription>Professional references for verification</CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate("/talent/onboarding")}>
                Add via Onboarding
              </Button>
            </CardHeader>
            <CardContent>
              {references.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No references added yet</p>
                  <p className="text-sm">Add at least 2 professional references for vetting</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {references.map((ref) => (
                    <Card key={ref.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{ref.reference_name}</h4>
                          <Badge variant="outline" className={
                            ref.verification_status === "approved" ? "border-success text-success" :
                            ref.verification_status === "rejected" ? "border-destructive text-destructive" :
                            ""
                          }>
                            {ref.verification_status || "pending"}
                          </Badge>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TalentProfile;
