import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Upload } from "lucide-react";
import taskiveLogo from "@/assets/taskive-logo.png";

const steps = [
  { id: 1, title: "Basic Information" },
  { id: 2, title: "Professional Details" },
  { id: 3, title: "Work History" },
  { id: 4, title: "Documents" },
  { id: 5, title: "Education" },
  { id: 6, title: "Certifications" },
  { id: 7, title: "References" },
  { id: 8, title: "Review & Submit" },
];

const TalentOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    timezone: "",
    preferredWorkingHours: "",
    primaryRole: "",
    secondarySkills: [] as string[],
    yearsOfExperience: "",
    toolsFamiliarWith: [] as string[],
    languagesSpoken: [] as string[],
    availability: "",
    ndaAgreed: false,
    termsAgreed: false,
  });

  const [workHistory, setWorkHistory] = useState([
    { companyName: "", roleTitle: "", roleDescription: "", startDate: "", endDate: "", isCurrent: false },
  ]);

  const [education, setEducation] = useState([
    { educationLevel: "", institutionName: "", fieldOfStudy: "", startYear: "", endYear: "", isCurrent: false },
  ]);

  const [certifications, setCertifications] = useState([
    { certificationName: "", issuingOrganization: "", yearObtained: "", expiryDate: "", credentialUrl: "" },
  ]);

  const [references, setReferences] = useState([
    { referenceName: "", email: "", phone: "", relationship: "" },
  ]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        firstName: user.user_metadata?.first_name || "",
        lastName: user.user_metadata?.last_name || "",
      }));
    }
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSkipOnboarding = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Generate talent ID
      const { data: talentIdData } = await supabase.rpc("generate_talent_id");
      const talentId = talentIdData || `TAS-VA-${Date.now()}`;

      // Create minimal talent record with incomplete onboarding
      await supabase
        .from("talents")
        .insert({
          user_id: user.id,
          talent_id: talentId,
          first_name: formData.firstName || user.user_metadata?.first_name || "User",
          last_name: formData.lastName || user.user_metadata?.last_name || "",
          email: formData.email || user.email || "",
          onboarding_completed: false,
          onboarding_step: currentStep,
        });

      toast({
        title: "Onboarding Skipped",
        description: "You can complete your profile anytime from your dashboard.",
      });

      navigate("/talent/dashboard");
    } catch (error: any) {
      console.error("Skip onboarding error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to skip onboarding",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Check if talent record already exists
      const { data: existingTalent } = await supabase
        .from("talents")
        .select("id, talent_id")
        .eq("user_id", user.id)
        .maybeSingle();

      let talentId = existingTalent?.talent_id;
      let talentRecordId = existingTalent?.id;

      if (existingTalent) {
        // Update existing talent record
        const { data: updatedTalent, error: updateError } = await supabase
          .from("talents")
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            country: formData.country,
            timezone: formData.timezone,
            preferred_working_hours: formData.preferredWorkingHours,
            primary_role: formData.primaryRole,
            secondary_skills: formData.secondarySkills,
            years_of_experience: parseInt(formData.yearsOfExperience) || 0,
            tools_familiar_with: formData.toolsFamiliarWith,
            languages_spoken: formData.languagesSpoken,
            availability: formData.availability as "full_time" | "part_time" | null,
            nda_agreed: formData.ndaAgreed,
            terms_agreed: formData.termsAgreed,
            onboarding_completed: true,
            onboarding_step: 8,
          })
          .eq("id", existingTalent.id)
          .select()
          .single();

        if (updateError) throw updateError;
        talentRecordId = updatedTalent.id;
      } else {
        // Generate new talent ID and insert
        const { data: talentIdData } = await supabase.rpc("generate_talent_id");
        talentId = talentIdData || `TAS-VA-${Date.now()}`;

        const { data: newTalent, error: insertError } = await supabase
          .from("talents")
          .insert({
            user_id: user.id,
            talent_id: talentId,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            country: formData.country,
            timezone: formData.timezone,
            preferred_working_hours: formData.preferredWorkingHours,
            primary_role: formData.primaryRole,
            secondary_skills: formData.secondarySkills,
            years_of_experience: parseInt(formData.yearsOfExperience) || 0,
            tools_familiar_with: formData.toolsFamiliarWith,
            languages_spoken: formData.languagesSpoken,
            availability: formData.availability as "full_time" | "part_time" | null,
            nda_agreed: formData.ndaAgreed,
            terms_agreed: formData.termsAgreed,
            onboarding_completed: true,
            onboarding_step: 8,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        talentRecordId = newTalent.id;
      }

      // Insert work history
      if (workHistory.some((w) => w.companyName)) {
        const validWorkHistory = workHistory
          .filter((w) => w.companyName)
          .map((w) => ({
            talent_id: talentRecordId,
            company_name: w.companyName,
            role_title: w.roleTitle,
            role_description: w.roleDescription,
            start_date: w.startDate || null,
            end_date: w.isCurrent ? null : w.endDate || null,
            is_current: w.isCurrent,
          }));
        await supabase.from("talent_work_history").insert(validWorkHistory);
      }

      // Insert education
      if (education.some((e) => e.institutionName)) {
        const validEducation = education
          .filter((e) => e.institutionName)
          .map((e) => ({
            talent_id: talentRecordId,
            education_level: e.educationLevel as any,
            institution_name: e.institutionName,
            field_of_study: e.fieldOfStudy,
            start_year: parseInt(e.startYear) || null,
            end_year: e.isCurrent ? null : parseInt(e.endYear) || null,
            is_current: e.isCurrent,
          }));
        await supabase.from("talent_education").insert(validEducation);
      }

      // Insert certifications
      if (certifications.some((c) => c.certificationName)) {
        const validCerts = certifications
          .filter((c) => c.certificationName)
          .map((c) => ({
            talent_id: talentRecordId,
            certification_name: c.certificationName,
            issuing_organization: c.issuingOrganization,
            year_obtained: parseInt(c.yearObtained) || null,
            expiry_date: c.expiryDate || null,
            credential_url: c.credentialUrl,
          }));
        await supabase.from("talent_certifications").insert(validCerts);
      }

      // Insert references
      if (references.some((r) => r.referenceName)) {
        const validRefs = references
          .filter((r) => r.referenceName)
          .map((r) => ({
            talent_id: talentRecordId,
            reference_name: r.referenceName,
            email: r.email,
            phone: r.phone,
            relationship: r.relationship,
          }));
        await supabase.from("talent_references").insert(validRefs);
      }

      toast({
        title: "Onboarding Complete!",
        description: "Your profile has been submitted for review.",
      });

      navigate("/talent/dashboard");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Doe"
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
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="United States"
                />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input
                  value={formData.timezone}
                  onChange={(e) => handleInputChange("timezone", e.target.value)}
                  placeholder="EST (UTC-5)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preferred Working Hours</Label>
              <Input
                value={formData.preferredWorkingHours}
                onChange={(e) => handleInputChange("preferredWorkingHours", e.target.value)}
                placeholder="9 AM - 5 PM EST"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
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
                placeholder="5"
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
              <Label>Tools You're Familiar With (comma-separated)</Label>
              <Textarea
                value={formData.toolsFamiliarWith.join(", ")}
                onChange={(e) => handleInputChange("toolsFamiliarWith", e.target.value.split(",").map((s) => s.trim()))}
                placeholder="Notion, Slack, HubSpot, Asana, Trello"
              />
            </div>
            <div className="space-y-2">
              <Label>Languages Spoken (comma-separated)</Label>
              <Input
                value={formData.languagesSpoken.join(", ")}
                onChange={(e) => handleInputChange("languagesSpoken", e.target.value.split(",").map((s) => s.trim()))}
                placeholder="English, Spanish"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            {workHistory.map((work, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        value={work.companyName}
                        onChange={(e) => {
                          const updated = [...workHistory];
                          updated[index].companyName = e.target.value;
                          setWorkHistory(updated);
                        }}
                        placeholder="Company Inc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role Title</Label>
                      <Input
                        value={work.roleTitle}
                        onChange={(e) => {
                          const updated = [...workHistory];
                          updated[index].roleTitle = e.target.value;
                          setWorkHistory(updated);
                        }}
                        placeholder="Operations Manager"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Role Description</Label>
                    <Textarea
                      value={work.roleDescription}
                      onChange={(e) => {
                        const updated = [...workHistory];
                        updated[index].roleDescription = e.target.value;
                        setWorkHistory(updated);
                      }}
                      placeholder="Describe your responsibilities..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={work.startDate}
                        onChange={(e) => {
                          const updated = [...workHistory];
                          updated[index].startDate = e.target.value;
                          setWorkHistory(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={work.endDate}
                        disabled={work.isCurrent}
                        onChange={(e) => {
                          const updated = [...workHistory];
                          updated[index].endDate = e.target.value;
                          setWorkHistory(updated);
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={work.isCurrent}
                      onCheckedChange={(checked) => {
                        const updated = [...workHistory];
                        updated[index].isCurrent = checked as boolean;
                        setWorkHistory(updated);
                      }}
                    />
                    <Label>I currently work here</Label>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                setWorkHistory([
                  ...workHistory,
                  { companyName: "", roleTitle: "", roleDescription: "", startDate: "", endDate: "", isCurrent: false },
                ])
              }
            >
              Add Another Position
            </Button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="text-center space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">Government ID</p>
                  <p className="text-sm text-muted-foreground">Upload a valid government-issued ID</p>
                </div>
                <Button variant="outline">Choose File</Button>
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-center space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">CV / Resume (PDF)</p>
                  <p className="text-sm text-muted-foreground">Upload your latest CV</p>
                </div>
                <Button variant="outline">Choose File</Button>
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-center space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">Proof of Address (Optional)</p>
                  <p className="text-sm text-muted-foreground">Utility bill or bank statement</p>
                </div>
                <Button variant="outline">Choose File</Button>
              </div>
            </Card>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            {education.map((edu, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Highest Level of Education</Label>
                    <Select
                      value={edu.educationLevel}
                      onValueChange={(v) => {
                        const updated = [...education];
                        updated[index].educationLevel = v;
                        setEducation(updated);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="secondary_school">Secondary School</SelectItem>
                        <SelectItem value="diploma">Diploma</SelectItem>
                        <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="doctorate">Doctorate</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Institution Name</Label>
                      <Input
                        value={edu.institutionName}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[index].institutionName = e.target.value;
                          setEducation(updated);
                        }}
                        placeholder="University Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field of Study</Label>
                      <Input
                        value={edu.fieldOfStudy}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[index].fieldOfStudy = e.target.value;
                          setEducation(updated);
                        }}
                        placeholder="Business Administration"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Year</Label>
                      <Input
                        type="number"
                        value={edu.startYear}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[index].startYear = e.target.value;
                          setEducation(updated);
                        }}
                        placeholder="2018"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Year</Label>
                      <Input
                        type="number"
                        value={edu.endYear}
                        disabled={edu.isCurrent}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[index].endYear = e.target.value;
                          setEducation(updated);
                        }}
                        placeholder="2022"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={edu.isCurrent}
                      onCheckedChange={(checked) => {
                        const updated = [...education];
                        updated[index].isCurrent = checked as boolean;
                        setEducation(updated);
                      }}
                    />
                    <Label>Currently studying</Label>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                setEducation([
                  ...education,
                  { educationLevel: "", institutionName: "", fieldOfStudy: "", startYear: "", endYear: "", isCurrent: false },
                ])
              }
            >
              Add Another Education
            </Button>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            {certifications.map((cert, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Certification Name</Label>
                      <Input
                        value={cert.certificationName}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[index].certificationName = e.target.value;
                          setCertifications(updated);
                        }}
                        placeholder="Google Digital Marketing"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issuing Organization</Label>
                      <Input
                        value={cert.issuingOrganization}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[index].issuingOrganization = e.target.value;
                          setCertifications(updated);
                        }}
                        placeholder="Google"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Year Obtained</Label>
                      <Input
                        type="number"
                        value={cert.yearObtained}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[index].yearObtained = e.target.value;
                          setCertifications(updated);
                        }}
                        placeholder="2023"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credential URL (Optional)</Label>
                      <Input
                        value={cert.credentialUrl}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[index].credentialUrl = e.target.value;
                          setCertifications(updated);
                        }}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                setCertifications([
                  ...certifications,
                  { certificationName: "", issuingOrganization: "", yearObtained: "", expiryDate: "", credentialUrl: "" },
                ])
              }
            >
              Add Another Certification
            </Button>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            {references.map((ref, index) => (
              <Card key={index}>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Reference Name</Label>
                      <Input
                        value={ref.referenceName}
                        onChange={(e) => {
                          const updated = [...references];
                          updated[index].referenceName = e.target.value;
                          setReferences(updated);
                        }}
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Input
                        value={ref.relationship}
                        onChange={(e) => {
                          const updated = [...references];
                          updated[index].relationship = e.target.value;
                          setReferences(updated);
                        }}
                        placeholder="Former Manager"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={ref.email}
                        onChange={(e) => {
                          const updated = [...references];
                          updated[index].email = e.target.value;
                          setReferences(updated);
                        }}
                        placeholder="jane@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={ref.phone}
                        onChange={(e) => {
                          const updated = [...references];
                          updated[index].phone = e.target.value;
                          setReferences(updated);
                        }}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() => setReferences([...references, { referenceName: "", email: "", phone: "", relationship: "" }])}
            >
              Add Another Reference
            </Button>
          </div>
        );
      case 8:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Your Information</CardTitle>
                <CardDescription>Please review all information before submitting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Primary Role</p>
                    <p className="font-medium">{formData.primaryRole || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Availability</p>
                    <p className="font-medium">{formData.availability || "Not specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={formData.ndaAgreed}
                  onCheckedChange={(checked) => handleInputChange("ndaAgreed", checked)}
                />
                <div>
                  <Label>Non-Disclosure Agreement</Label>
                  <p className="text-sm text-muted-foreground">
                    I agree to keep all client information confidential
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={formData.termsAgreed}
                  onCheckedChange={(checked) => handleInputChange("termsAgreed", checked)}
                />
                <div>
                  <Label>Terms & Conditions</Label>
                  <p className="text-sm text-muted-foreground">
                    I agree to the Taskive Terms of Service and Privacy Policy
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-8">
        <div className="mb-8">
          <img src={taskiveLogo} alt="Taskive" className="h-10 mb-6" />
          <h1 className="text-3xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
          </p>
        </div>

        <Progress value={(currentStep / steps.length) * 100} className="mb-8" />

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          </CardHeader>
          <CardContent>{renderStep()}</CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkipOnboarding}
              disabled={loading}
              className="text-muted-foreground"
            >
              Skip for now
            </Button>
          </div>

          {currentStep < steps.length ? (
            <Button onClick={() => setCurrentStep((prev) => prev + 1)}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.ndaAgreed || !formData.termsAgreed}
            >
              {loading ? "Submitting..." : "Submit for Review"}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TalentOnboarding;
