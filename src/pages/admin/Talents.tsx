import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, UserCheck, AlertCircle, Clock, CheckCircle, XCircle, Eye } from "lucide-react";

const AdminTalents = () => {
  const { toast } = useToast();
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTalent, setSelectedTalent] = useState<any>(null);
  const [vettingLevels, setVettingLevels] = useState<any[]>([]);
  const [vettingNotes, setVettingNotes] = useState("");

  useEffect(() => {
    fetchTalents();
  }, [statusFilter]);

  const fetchTalents = async () => {
    try {
      let query = supabase
        .from("talents")
        .select(`
          *,
          talent_work_history(*),
          talent_education(*),
          talent_certifications(*),
          talent_references(*)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("vetting_status", statusFilter as "unvetted" | "partially_vetted" | "fully_vetted");
      }

      const { data, error } = await query;
      if (error) throw error;
      setTalents(data || []);
    } catch (error) {
      console.error("Error fetching talents:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVettingLevels = async (talentId: string) => {
    const { data } = await supabase
      .from("talent_vetting")
      .select("*")
      .eq("talent_id", talentId)
      .order("level", { ascending: true });
    setVettingLevels(data || []);
  };

  const handleViewTalent = async (talent: any) => {
    setSelectedTalent(talent);
    await fetchVettingLevels(talent.id);
  };

  const handleUpdateVettingLevel = async (levelId: string, status: "pending" | "approved" | "rejected" | "needs_clarification") => {
    try {
      await supabase
        .from("talent_vetting")
        .update({
          status,
          admin_notes: vettingNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", levelId);

      toast({
        title: "Vetting Updated",
        description: `Level status updated to ${status}`,
      });

      await fetchVettingLevels(selectedTalent.id);
      setVettingNotes("");
      fetchTalents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "fully_vetted":
        return <Badge className="bg-success/10 text-success">Fully Vetted</Badge>;
      case "partially_vetted":
        return <Badge className="bg-warning/10 text-warning">Partially Vetted</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Unvetted</Badge>;
    }
  };

  const filteredTalents = talents.filter(
    (talent) =>
      talent.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.talent_id?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h1 className="text-3xl font-bold text-foreground">Talent Management</h1>
        <p className="text-muted-foreground mt-1">Review and vet talent profiles using the TCF framework</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or talent ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unvetted">Unvetted</SelectItem>
            <SelectItem value="partially_vetted">Partially Vetted</SelectItem>
            <SelectItem value="fully_vetted">Fully Vetted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredTalents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No talents found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTalents.map((talent) => (
            <Card key={talent.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {talent.first_name} {talent.last_name}
                      </h3>
                      {getStatusBadge(talent.vetting_status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">ID:</span> {talent.talent_id}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {talent.email}
                      </div>
                      <div>
                        <span className="font-medium">Role:</span> {talent.primary_role || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Experience:</span> {talent.years_of_experience || 0} years
                      </div>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleViewTalent(talent)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          Talent Review: {selectedTalent?.first_name} {selectedTalent?.last_name}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <Tabs defaultValue="profile" className="mt-4">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="profile">Profile</TabsTrigger>
                          <TabsTrigger value="experience">Experience</TabsTrigger>
                          <TabsTrigger value="education">Education</TabsTrigger>
                          <TabsTrigger value="vetting">TCF Vetting</TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-muted-foreground">Talent ID</Label>
                              <p className="font-medium">{selectedTalent?.talent_id}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Email</Label>
                              <p className="font-medium">{selectedTalent?.email}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Phone</Label>
                              <p className="font-medium">{selectedTalent?.phone || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Country</Label>
                              <p className="font-medium">{selectedTalent?.country || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Primary Role</Label>
                              <p className="font-medium">{selectedTalent?.primary_role || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Availability</Label>
                              <p className="font-medium">{selectedTalent?.availability || "N/A"}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Skills</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedTalent?.secondary_skills?.map((skill: string) => (
                                <Badge key={skill} variant="secondary">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Tools</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedTalent?.tools_familiar_with?.map((tool: string) => (
                                <Badge key={tool} variant="outline">{tool}</Badge>
                              ))}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="experience" className="space-y-4 mt-4">
                          {selectedTalent?.talent_work_history?.length === 0 ? (
                            <p className="text-muted-foreground">No work history provided</p>
                          ) : (
                            selectedTalent?.talent_work_history?.map((work: any) => (
                              <Card key={work.id}>
                                <CardContent className="p-4">
                                  <h4 className="font-medium">{work.role_title}</h4>
                                  <p className="text-sm text-muted-foreground">{work.company_name}</p>
                                  <p className="text-sm mt-2">{work.role_description}</p>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </TabsContent>

                        <TabsContent value="education" className="space-y-4 mt-4">
                          <div className="space-y-4">
                            <h4 className="font-medium">Education</h4>
                            {selectedTalent?.talent_education?.length === 0 ? (
                              <p className="text-muted-foreground">No education provided</p>
                            ) : (
                              selectedTalent?.talent_education?.map((edu: any) => (
                                <Card key={edu.id}>
                                  <CardContent className="p-4">
                                    <p className="font-medium">{edu.institution_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {edu.field_of_study} - {edu.education_level}
                                    </p>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>
                          <div className="space-y-4">
                            <h4 className="font-medium">Certifications</h4>
                            {selectedTalent?.talent_certifications?.length === 0 ? (
                              <p className="text-muted-foreground">No certifications provided</p>
                            ) : (
                              selectedTalent?.talent_certifications?.map((cert: any) => (
                                <Card key={cert.id}>
                                  <CardContent className="p-4">
                                    <p className="font-medium">{cert.certification_name}</p>
                                    <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="vetting" className="space-y-4 mt-4">
                          <div className="space-y-4">
                            {vettingLevels.map((level) => (
                              <Card key={level.id} className={
                                level.status === "approved" ? "border-success/50" :
                                level.status === "rejected" ? "border-destructive/50" : ""
                              }>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        level.status === "approved" ? "bg-success/20 text-success" :
                                        level.status === "rejected" ? "bg-destructive/20 text-destructive" :
                                        "bg-muted text-muted-foreground"
                                      }`}>
                                        {level.status === "approved" ? <CheckCircle className="h-5 w-5" /> :
                                         level.status === "rejected" ? <XCircle className="h-5 w-5" /> :
                                         <Clock className="h-5 w-5" />}
                                      </div>
                                      <div>
                                        <p className="font-medium">Level {level.level}: {level.level_name}</p>
                                        {level.admin_notes && (
                                          <p className="text-sm text-muted-foreground">{level.admin_notes}</p>
                                        )}
                                      </div>
                                    </div>
                                    <Badge className={
                                      level.status === "approved" ? "bg-success/10 text-success" :
                                      level.status === "rejected" ? "bg-destructive/10 text-destructive" :
                                      "bg-muted text-muted-foreground"
                                    }>
                                      {level.status}
                                    </Badge>
                                  </div>

                                  {level.status === "pending" && (
                                    <div className="space-y-3 pt-3 border-t">
                                      <div className="space-y-2">
                                        <Label>Admin Notes</Label>
                                        <Textarea
                                          value={vettingNotes}
                                          onChange={(e) => setVettingNotes(e.target.value)}
                                          placeholder="Add notes for this vetting level..."
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="default"
                                          className="bg-success hover:bg-success/90"
                                          onClick={() => handleUpdateVettingLevel(level.id, "approved")}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Approve
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => handleUpdateVettingLevel(level.id, "rejected")}
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Reject
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() => handleUpdateVettingLevel(level.id, "needs_clarification")}
                                        >
                                          <AlertCircle className="h-4 w-4 mr-2" />
                                          Need Info
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminTalents;
