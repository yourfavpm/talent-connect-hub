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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  X,
  Shield,
  FileText
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ROLE_LABELS: Record<string, string> = {
  virtual_assistant: "Virtual Assistant",
  customer_support: "Customer Support",
  social_media_manager: "Social Media Manager",
  product_manager: "Product Manager",
  operations_manager: "Operations Manager",
  project_manager: "Project Manager",
  executive_assistant: "Executive Assistant",
};

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
      console.log("Fetching talents...");
      const { data, error } = await supabase
        .from("talents")
        .select("*")
        .eq("vetting_status", "fully_vetted")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      console.log("Fetched Data:", data);
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
      // Fetch all related data in parallel
      const [workHistory, education, certifications, vetting] = await Promise.all([
        supabase.from("talent_work_history").select("*").eq("talent_id", talent.id).order("start_date", { ascending: false }),
        supabase.from("talent_education").select("*").eq("talent_id", talent.id).order("start_year", { ascending: false }),
        supabase.from("talent_certifications").select("*").eq("talent_id", talent.id),
        supabase.from("talent_vetting").select("*").eq("talent_id", talent.id).order("level", { ascending: true })
      ]);

      setTalentDetails({
        ...talent,
        work_history: workHistory.data || [],
        education: education.data || [],
        certifications: certifications.data || [],
        vetting: vetting.data || [],
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
    const description = `Client requested an interview with talent ${talent.first_name} ${talent.last_name} (${talent.talent_id}). Please coordinate availability.`;

    const success = await createTicket(subject, description);
    if (success) {
      toast({
        title: "Interview Request Sent",
        description: `Your request for ${talent.first_name} ${talent.last_name} has been sent to our team.`,
      });
    }
  };

  const handleHireRequest = async (talent: any) => {
    const subject = `Hire Request: ${talent.first_name} ${talent.last_name}`;
    const description = `Client wants to hire talent ${talent.first_name} ${talent.last_name} (${talent.talent_id}) directly. Please initiate the contract process.`;

    const success = await createTicket(subject, description);
    if (success) {
      toast({
        title: "Hire Request Sent",
        description: "Admin notified to prepare the contract offer.",
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
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading talented professionals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Browse Talent</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Discover fully vetted professionals ready to join your team.
          </p>
        </div>
        <Button variant="outline" onClick={() => { setSearchQuery(""); setRoleFilter(""); }}>
          Reset Filters
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-background p-4 rounded-xl border shadow-sm sticky top-0 z-10">
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
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="virtual_assistant">Virtual Assistant</SelectItem>
            <SelectItem value="customer_support">Customer Support</SelectItem>
            <SelectItem value="product_manager">Product Manager</SelectItem>
            <SelectItem value="operations_manager">Operations Manager</SelectItem>
            <SelectItem value="project_manager">Project Manager</SelectItem>
            <SelectItem value="executive_assistant">Executive Assistant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground font-medium">
        Showing {filteredTalents.length} vetted talent{filteredTalents.length !== 1 ? "s" : ""}
      </div>

      {/* Talent Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTalents.map((talent, index) => (
          <Card
            key={talent.id}
            className="group hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
            onClick={() => handleViewProfile(talent)}
          >
            <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="flex gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary/10 group-hover:border-primary/30 transition-colors">
                  <AvatarImage src={talent.avatar_url} />
                  <AvatarFallback className="text-lg bg-primary/5 text-primary">
                    {getInitials(talent.first_name, talent.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                    {talent.first_name} {talent.last_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">
                    {ROLE_LABELS[talent.primary_role] || talent.primary_role}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Taskive Vetted</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              {/* Stats */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {talent.country && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {talent.country}
                  </span>
                )}
                {talent.years_of_experience && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> {talent.years_of_experience}y Exp
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <DollarSignIcon className="h-3.5 w-3.5" /> ${talent.hourly_rate || 'N/A'}/hr
                </span>
              </div>

              {/* Skills Preview */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {talent.secondary_skills?.slice(0, 3).map((skill: string) => (
                  <Badge key={skill} variant="secondary" className="font-normal text-xs bg-muted/50">
                    {skill}
                  </Badge>
                ))}
                {talent.secondary_skills?.length > 3 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">+{talent.secondary_skills.length - 3}</Badge>
                )}
              </div>

              {/* Footer Action */}
              <div className="mt-auto pt-4 border-t flex gap-2">
                <Button variant="outline" className="flex-1 h-9 text-xs" onClick={(e) => { e.stopPropagation(); handleViewProfile(talent); }}>
                  View Profile
                </Button>
                <Button className="flex-1 h-9 text-xs bg-slate-900" onClick={(e) => { e.stopPropagation(); handleHireRequest(talent); }}>
                  Hire Request
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTalents.length === 0 && (
        <div className="text-center py-16 bg-muted/10 rounded-xl border border-dashed text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <h3 className="text-lg font-medium mb-1">No talents found</h3>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Talent Details Modal */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {loadingDetails ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : talentDetails && (
            <>
              <div className="p-6 pb-4 bg-muted/10 border-b">
                <DialogHeader className="mb-2">
                  <DialogTitle className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
                        <AvatarImage src={talentDetails.avatar_url} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                          {getInitials(talentDetails.first_name, talentDetails.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-bold">{talentDetails.first_name} {talentDetails.last_name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-muted-foreground font-medium">{ROLE_LABELS[talentDetails.primary_role] || talentDetails.primary_role}</p>
                          <span className="text-muted-foreground">•</span>
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Vetted Talent
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-foreground/70">
                          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {talentDetails.country}</span>
                          <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> {talentDetails.timezone}</span>
                          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {talentDetails.availability === 'full_time' ? 'Available Full-time' : 'Part-time'}</span>
                        </div>
                      </div>
                    </div>
                    {/* Hire Action Top */}
                    <div className="flex flex-col gap-2">
                      <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleHireRequest(talentDetails)}>
                        Request to Hire
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRequestInterview(talentDetails)}>
                        Request Interview
                      </Button>
                    </div>
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="overflow-y-auto p-6 bg-background">
                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-5 mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="vetting">Vetting</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    {/* Bio */}
                    <section>
                      <h3 className="font-semibold text-lg mb-2">Professional Summary</h3>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{talentDetails.bio || "No summary provided."}</p>
                    </section>

                    {/* Skills & Tools */}
                    <div className="grid md:grid-cols-2 gap-8">
                      <section>
                        <h3 className="font-semibold text-lg mb-3">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {talentDetails.secondary_skills?.map((s: string) => (
                            <Badge key={s} variant="secondary" className="px-3 py-1">{s}</Badge>
                          )) || "No skills listed."}
                        </div>
                      </section>
                      <section>
                        <h3 className="font-semibold text-lg mb-3">Tools</h3>
                        <div className="flex flex-wrap gap-2">
                          {talentDetails.tools_familiar_with?.map((t: string) => (
                            <Badge key={t} variant="outline" className="px-3 py-1">{t}</Badge>
                          )) || "No tools listed."}
                        </div>
                      </section>
                    </div>

                    {/* Language */}
                    <section>
                      <h3 className="font-semibold text-lg mb-2">Languages</h3>
                      <div className="flex gap-4 text-sm text-foreground/80">
                        {talentDetails.languages_spoken?.join(", ") || "English"}
                      </div>
                    </section>
                  </TabsContent>

                  {/* Experience Tab */}
                  <TabsContent value="experience" className="space-y-4">
                    {talentDetails.work_history?.map((work: any) => (
                      <div key={work.id} className="relative pl-6 border-l-2 border-muted pb-6 last:pb-0">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                        <div className="mb-1">
                          <h4 className="font-semibold text-base">{work.role_title}</h4>
                          <p className="text-primary font-medium text-sm">{work.company_name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground block mb-2">
                          {new Date(work.start_date).toLocaleDateString()} - {work.is_current ? 'Present' : new Date(work.end_date).toLocaleDateString()}
                          {work.is_current && <Badge variant="secondary" className="ml-2 text-[10px] h-4">Current</Badge>}
                        </span>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{work.role_description}</p>
                      </div>
                    ))}
                    {talentDetails.work_history?.length === 0 && <p className="text-muted-foreground">No experience history.</p>}
                  </TabsContent>

                  {/* Education Tab */}
                  <TabsContent value="education" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {talentDetails.education?.map((edu: any) => (
                        <Card key={edu.id}>
                          <CardContent className="p-4 flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <GraduationCap className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{edu.institution_name}</h4>
                              <p className="text-sm text-muted-foreground">{edu.education_level} in {edu.field_of_study}</p>
                              <p className="text-xs text-muted-foreground mt-1">{edu.start_year} - {edu.is_current ? 'Present' : edu.end_year}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {talentDetails.education?.length === 0 && <p className="text-muted-foreground">No education history.</p>}

                    {/* Certifications */}
                    <h3 className="font-semibold mt-6 mb-3">Certifications</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {talentDetails.certifications?.map((cert: any) => (
                        <Card key={cert.id}>
                          <CardContent className="p-4 flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                              <Award className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{cert.certification_name}</h4>
                              <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                              <p className="text-xs text-muted-foreground mt-1">{cert.year_obtained}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Vetting Tab */}
                  <TabsContent value="vetting" className="space-y-4">
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" /> Taskive Vetting Verification
                      </h3>
                      <div className="space-y-4">
                        {talentDetails.vetting?.map((v: any) => (
                          <div key={v.id} className="flex items-center justify-between p-3 bg-background rounded-lg border shadow-sm">
                            <div>
                              <p className="font-medium text-sm">{v.level_name.replace(/_/g, ' ').toUpperCase()}</p>
                              {v.admin_notes && <p className="text-xs text-muted-foreground mt-0.5">{v.admin_notes}</p>}
                            </div>
                            <Badge variant={v.status === 'approved' ? 'default' : 'secondary'} className="capitalize">
                              {v.status}
                            </Badge>
                          </div>
                        ))}
                        {talentDetails.vetting?.length === 0 && <p className="text-sm text-muted-foreground">Verification details pending.</p>}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Reviews Tab */}
                  <TabsContent value="reviews">
                    <div className="text-center py-12 text-muted-foreground">
                      <Star className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>No reviews yet.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* Helper Icon for Dollar */
function DollarSignIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export default BrowseTalents;
