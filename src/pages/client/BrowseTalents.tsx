import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Star,
  MapPin,
  Briefcase,
  Calendar,
  User,
  Mail,
  Phone,
  Globe,
  Clock,
  GraduationCap,
  Award,
  CheckCircle2,
  X
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  virtual_assistant: "Virtual Assistant",
  customer_support: "Customer Support",
  social_media_manager: "Social Media Manager",
  product_manager: "Product Manager",
  operations_manager: "Operations Manager",
  project_manager: "Project Manager",
  executive_assistant: "Executive Assistant",
};

import { useAuth } from "@/hooks/useAuth";

const BrowseTalents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedTalent, setSelectedTalent] = useState<any>(null);
  const [talentDetails, setTalentDetails] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchTalents();
  }, []);

  const fetchTalents = async () => {
    try {
      const { data, error } = await supabase
        .from("talents")
        .select("*")
        .eq("vetting_status", "fully_vetted")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTalents(data || []);
    } catch (error) {
      console.error("Error fetching talents:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTalentDetails = async (talent: any) => {
    setLoadingDetails(true);
    try {
      // Fetch work history
      const { data: workHistory } = await supabase
        .from("talent_work_history")
        .select("*")
        .eq("talent_id", talent.id)
        .order("start_date", { ascending: false });

      // Fetch education
      const { data: education } = await supabase
        .from("talent_education")
        .select("*")
        .eq("talent_id", talent.id)
        .order("start_year", { ascending: false });

      // Fetch certifications
      const { data: certifications } = await supabase
        .from("talent_certifications")
        .select("*")
        .eq("talent_id", talent.id);

      setTalentDetails({
        ...talent,
        work_history: workHistory || [],
        education: education || [],
        certifications: certifications || [],
      });
    } catch (error) {
      console.error("Error fetching talent details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewProfile = (talent: any) => {
    setSelectedTalent(talent);
    fetchTalentDetails(talent);
    setProfileOpen(true);
  };

  // Helper to create ticket
  const createTicket = async (subject: string, description: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject,
        description,
        category: "job",
        status: "open",
        priority: "normal"
      });
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleRequestInterview = async (talent: any) => {
    const subject = `Interview Request: ${talent.first_name} ${talent.last_name}`;
    const description = `Client requested an interview with talent ${talent.first_name} ${talent.last_name} (${talent.talent_id}). Please coordinate availability.`; // TODO: Prompt for job context?

    const success = await createTicket(subject, description);
    if (success) {
      toast({
        title: "Interview Request Sent",
        description: `Your request for ${talent.first_name} ${talent.last_name} has been sent to our team. We'll be in touch shortly.`,
      });
    }
  };

  const handleGenerateOffer = async (talent: any) => {
    const subject = `Offer Request: ${talent.first_name} ${talent.last_name}`;
    const description = `Client wants to generate an offer for talent ${talent.talent_id}. Please initiate the offer process.`;

    const success = await createTicket(subject, description);
    if (success) {
      toast({
        title: "Offer Request Sent",
        description: "Admin notified to prepare the offer details.",
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const filteredTalents = talents.filter((talent) => {
    const fullName = `${talent.first_name || ""} ${talent.last_name || ""}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      talent.primary_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.secondary_skills?.some((skill: string) =>
        skill?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesRole = !roleFilter || talent.primary_role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Browse Talents</h1>
        <p className="text-muted-foreground mt-1">
          Discover fully vetted Product and Operations professionals
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, role, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[220px] h-11">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            <SelectItem value="virtual_assistant">Virtual Assistant</SelectItem>
            <SelectItem value="customer_support">Customer Support</SelectItem>
            <SelectItem value="product_manager">Product Manager</SelectItem>
            <SelectItem value="operations_manager">Operations Manager</SelectItem>
            <SelectItem value="project_manager">Project Manager</SelectItem>
            <SelectItem value="executive_assistant">Executive Assistant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTalents.length} vetted talent{filteredTalents.length !== 1 ? "s" : ""}
      </div>

      {/* Talent Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTalents.map((talent, index) => (
          <div
            key={talent.id}
            className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-all duration-200 animate-slide-up cursor-pointer"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => handleViewProfile(talent)}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-semibold text-primary">
                  {getInitials(talent.first_name, talent.last_name)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground text-lg">
                    {talent.first_name} {talent.last_name}
                  </h3>
                  <Badge className="bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Vetted
                  </Badge>
                </div>
                <p className="text-primary font-medium">
                  {ROLE_LABELS[talent.primary_role] || talent.primary_role || "Role not specified"}
                </p>
                <p className="text-xs text-muted-foreground">{talent.talent_id || "ID: N/A"}</p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {talent.country && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {talent.country}
                    </span>
                  )}
                  {talent.years_of_experience && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {talent.years_of_experience} years
                    </span>
                  )}
                  {talent.availability && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {talent.availability === "full_time" ? "Full-time" : "Part-time"}
                    </span>
                  )}
                </div>

                {/* Skills */}
                {talent.secondary_skills && talent.secondary_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {talent.secondary_skills.slice(0, 4).map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="font-normal text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {talent.secondary_skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{talent.secondary_skills.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end mt-5 pt-4 border-t border-border gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProfile(talent);
                    }}
                  >
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRequestInterview(talent);
                    }}
                  >
                    Request Interview
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTalents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No vetted talents found matching your criteria</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Talent Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {selectedTalent && getInitials(selectedTalent.first_name, selectedTalent.last_name)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {selectedTalent?.first_name} {selectedTalent?.last_name}
                </h2>
                <p className="text-sm text-muted-foreground font-normal">
                  {selectedTalent?.talent_id}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : talentDetails && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="certifications">Certifications</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Role:</strong> {ROLE_LABELS[talentDetails.primary_role] || talentDetails.primary_role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Experience:</strong> {talentDetails.years_of_experience || 0} years
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Location:</strong> {talentDetails.country || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Timezone:</strong> {talentDetails.timezone || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Availability:</strong> {talentDetails.availability === "full_time" ? "Full-time" : "Part-time"}
                    </span>
                  </div>
                </div>

                {talentDetails.secondary_skills && talentDetails.secondary_skills.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {talentDetails.secondary_skills.map((skill: string) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {talentDetails.tools_familiar_with && talentDetails.tools_familiar_with.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tools</h4>
                    <div className="flex flex-wrap gap-2">
                      {talentDetails.tools_familiar_with.map((tool: string) => (
                        <Badge key={tool} variant="outline">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {talentDetails.languages_spoken && talentDetails.languages_spoken.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Languages</h4>
                    <p className="text-sm text-muted-foreground">
                      {talentDetails.languages_spoken.join(", ")}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="experience" className="space-y-4 mt-4">
                {talentDetails.work_history?.length > 0 ? (
                  talentDetails.work_history.map((work: any) => (
                    <Card key={work.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{work.role_title}</h4>
                            <p className="text-sm text-primary">{work.company_name}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {work.is_current ? "Current" : `${work.start_date?.slice(0, 7)} - ${work.end_date?.slice(0, 7) || "Present"}`}
                          </Badge>
                        </div>
                        {work.role_description && (
                          <p className="text-sm text-muted-foreground mt-2">{work.role_description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No work history added</p>
                )}
              </TabsContent>

              <TabsContent value="education" className="space-y-4 mt-4">
                {talentDetails.education?.length > 0 ? (
                  talentDetails.education.map((edu: any) => (
                    <Card key={edu.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <GraduationCap className="h-5 w-5 text-primary mt-1" />
                          <div>
                            <h4 className="font-medium">{edu.institution_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {edu.education_level} {edu.field_of_study ? `in ${edu.field_of_study}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {edu.start_year} - {edu.is_current ? "Present" : edu.end_year}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No education records added</p>
                )}
              </TabsContent>

              <TabsContent value="certifications" className="space-y-4 mt-4">
                {talentDetails.certifications?.length > 0 ? (
                  talentDetails.certifications.map((cert: any) => (
                    <Card key={cert.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-primary mt-1" />
                          <div>
                            <h4 className="font-medium">{cert.certification_name}</h4>
                            <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                            {cert.year_obtained && (
                              <p className="text-xs text-muted-foreground">Obtained: {cert.year_obtained}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No certifications added</p>
                )}
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setProfileOpen(false)}>
              Close
            </Button>
            <Button onClick={() => selectedTalent && handleRequestInterview(selectedTalent)}>
              Request Interview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseTalents;
