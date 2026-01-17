import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Shield,
  Edit,
  Save,
  X,
  Briefcase,
  Globe,
  Clock,
  MapPin,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Sparkles,
  GraduationCap,
  Award,
  Users,
  FileText,
  Phone,
  Plus,
  Trash,
  Pencil,
  ArrowRight
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface TalentProfileData {
  id: string;
  talent_id: string;
  first_name: string;
  last_name: string;
  email: string;
  vetting_status: string;
  primary_role: string | null;
  secondary_skills: string[] | null;
  tools_familiar_with: string[] | null;
  years_of_experience: number | null;
  availability: "full_time" | "part_time" | null;
  timezone: string | null;
  country: string | null;
  cv_url: string | null;
  assigned_manager: string | null;
  onboarding_completed: boolean;
}

const TalentProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<TalentProfileData>>({});

  // Dialog States
  const [addWorkOpen, setAddWorkOpen] = useState(false);
  const [addEduOpen, setAddEduOpen] = useState(false);
  const [addCertOpen, setAddCertOpen] = useState(false);
  const [addRefOpen, setAddRefOpen] = useState(false);

  // New Item States
  const [newWork, setNewWork] = useState<any>({});
  const [newEdu, setNewEdu] = useState<any>({});
  const [newCert, setNewCert] = useState<any>({});
  const [newRef, setNewRef] = useState<any>({});

  const { data, isLoading } = useQuery({
    queryKey: ['talentProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // 1. Fetch Talent
      const { data: talent, error } = await supabase
        .from("talents")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (!talent) return null;

      // 2. Fetch Related Data in Parallel
      const [managerRes, workRes, eduRes, certRes, refRes] = await Promise.all([
        talent.assigned_manager ? supabase.from("profiles").select("first_name, last_name, email").eq("user_id", talent.assigned_manager).single() : Promise.resolve({ data: null }),
        supabase.from("talent_work_history").select("*").eq("talent_id", talent.id).order("start_date", { ascending: false }),
        supabase.from("talent_education").select("*").eq("talent_id", talent.id).order("start_year", { ascending: false }),
        supabase.from("talent_certifications").select("*").eq("talent_id", talent.id),
        supabase.from("talent_references").select("*").eq("talent_id", talent.id)
      ]);

      return {
        talent: talent as TalentProfileData,
        manager: managerRes.data,
        workHistory: workRes.data || [],
        education: eduRes.data || [],
        certifications: certRes.data || [],
        references: refRes.data || [],
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const { talent, manager, workHistory, education, certifications, references } = data || {
    talent: null, manager: null, workHistory: [], education: [], certifications: [], references: []
  };

  const startEditing = () => {
    if (talent) {
      setEditData({
        first_name: talent.first_name,
        last_name: talent.last_name,
        primary_role: talent.primary_role,
        secondary_skills: talent.secondary_skills || [],
        tools_familiar_with: talent.tools_familiar_with || [],
        years_of_experience: talent.years_of_experience,
        availability: talent.availability,
        timezone: talent.timezone,
        country: talent.country,
        cv_url: talent.cv_url,
      });
      setEditing(true);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase.from("talents").update(updates).eq("id", talent?.id);
      if (error) throw error;
      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talentProfile', user?.id] });
      setEditing(false);
      toast({ title: "Success", description: "Profile updated successfully" });
    },
    onError: (error: any) => {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  });

  const handleSave = async () => {
    if (!talent) return;
    setSaving(true);
    await updateProfileMutation.mutateAsync(editData);
    setSaving(false);
  };

  const addItem = async (table: string, itemData: any, _ignored: any, closeDialog: Function) => {
    setSaving(true);
    try {
      if (itemData.id) {
        // Update
        const { id, ...dataWithoutId } = itemData;
        // @ts-ignore
        const { error } = await supabase.from(table).update(dataWithoutId).eq('id', id);
        if (error) throw error;
        toast({ title: "Success", description: "Item updated successfully" });
      } else {
        // Insert
        // @ts-ignore
        const { error } = await supabase.from(table).insert([{ ...itemData, talent_id: talent?.id }]);
        if (error) throw error;
        toast({ title: "Success", description: "Item added successfully" });
      }
      queryClient.invalidateQueries({ queryKey: ['talentProfile', user?.id] });
      closeDialog(false);
    } catch (error: any) {
      console.error("Error saving item:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (table: string, id: string, _ignored: any) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      // @ts-ignore
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Item deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['talentProfile', user?.id] });
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your professional identity and settings</p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Basic Info
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start border-b rounded-none p-0 h-auto bg-transparent overflow-x-auto">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Overview
          </TabsTrigger>
          {talent.onboarding_completed && (
            <>
              <TabsTrigger
                value="experience"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                Experience
              </TabsTrigger>
              <TabsTrigger
                value="education"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                Education
              </TabsTrigger>
              <TabsTrigger
                value="references"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                References
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {!talent.onboarding_completed && (
            <Card className="border-2 border-accent bg-accent/5">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-1">Complete Your Profile</h3>
                  <p className="text-muted-foreground">Finish the onboarding process to unlock your full profile, add experience, and apply for jobs.</p>
                </div>
                <Button asChild>
                  <Link to="/talent/onboarding">
                    Resume Onboarding <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={editData.first_name || ""}
                        onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                        disabled={!editing || talent.vetting_status === 'fully_vetted'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={editData.last_name || ""}
                        onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                        disabled={!editing || talent.vetting_status === 'fully_vetted'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Primary Role</Label>
                    <Input
                      value={editData.primary_role || ""}
                      onChange={(e) => setEditData({ ...editData, primary_role: e.target.value })}
                      disabled={!editing}
                      placeholder="e.g. Senior Product Manager"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Years of Experience</Label>
                      <Input
                        type="number"
                        value={editData.years_of_experience || ""}
                        onChange={(e) => setEditData({ ...editData, years_of_experience: parseInt(e.target.value) })}
                        disabled={!editing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Availability</Label>
                      <Select
                        value={editData.availability || ""}
                        onValueChange={(val: any) => setEditData({ ...editData, availability: val })}
                        disabled={!editing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select availability" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_time">Full Time</SelectItem>
                          <SelectItem value="part_time">Part Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Input value={editData.timezone || ""} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input value={editData.country || ""} disabled />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4">
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Secondary Skills</Label>
                        {editing && <Button variant="ghost" size="sm" onClick={() => {
                          const current = editData.secondary_skills || [];
                          setEditData({ ...editData, secondary_skills: [...current, ""] });
                        }}><Plus className="h-3 w-3 mr-1" /> Add</Button>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(editing ? (editData.secondary_skills || []) : (talent.secondary_skills || [])).map((skill, i) => (
                          editing ? (
                            <div key={i} className="flex items-center gap-1">
                              <Input
                                value={skill}
                                onChange={(e) => {
                                  const newSkills = [...(editData.secondary_skills || [])];
                                  newSkills[i] = e.target.value;
                                  setEditData({ ...editData, secondary_skills: newSkills });
                                }}
                                className="h-8 w-32 text-xs"
                              />
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                                const newSkills = [...(editData.secondary_skills || [])];
                                newSkills.splice(i, 1);
                                setEditData({ ...editData, secondary_skills: newSkills });
                              }}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Badge key={i} variant="secondary">{skill}</Badge>
                          )
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Tools</Label>
                        {editing && <Button variant="ghost" size="sm" onClick={() => {
                          const current = editData.tools_familiar_with || [];
                          setEditData({ ...editData, tools_familiar_with: [...current, ""] });
                        }}><Plus className="h-3 w-3 mr-1" /> Add</Button>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(editing ? (editData.tools_familiar_with || []) : (talent.tools_familiar_with || [])).map((tool, i) => (
                          editing ? (
                            <div key={i} className="flex items-center gap-1">
                              <Input
                                value={tool}
                                onChange={(e) => {
                                  const newTools = [...(editData.tools_familiar_with || [])];
                                  newTools[i] = e.target.value;
                                  setEditData({ ...editData, tools_familiar_with: newTools });
                                }}
                                className="h-8 w-32 text-xs"
                              />
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                                const newTools = [...(editData.tools_familiar_with || [])];
                                newTools.splice(i, 1);
                                setEditData({ ...editData, tools_familiar_with: newTools });
                              }}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Badge key={i} variant="outline">{tool}</Badge>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Vetting Status</span>
                    <Badge className={
                      talent.vetting_status === "fully_vetted" ? "bg-green-500" :
                        talent.vetting_status === "rejected" ? "bg-red-500" : "bg-yellow-500"
                    }>
                      {talent.vetting_status === "fully_vetted" ? "Verified" :
                        talent.vetting_status?.replace("_", " ") || "Pending"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>CV / Resume Link</Label>
                    <div className="flex gap-2">
                      <Input
                        value={editing ? (editData.cv_url || "") : (talent.cv_url || "")}
                        onChange={(e) => setEditData({ ...editData, cv_url: e.target.value })}
                        disabled={!editing}
                        placeholder="https://..."
                      />
                      {talent.cv_url && !editing && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={talent.cv_url} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {manager && (
                <Card>
                  <CardHeader>
                    <CardTitle>Talent Manager</CardTitle>
                    <CardDescription>Your dedicated point of contact</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">{manager.first_name[0]}{manager.last_name[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium">{manager.first_name} {manager.last_name}</p>
                        <p className="text-xs text-muted-foreground">Talent Manager</p>
                      </div>
                    </div>

                    <a href={`mailto:${manager.email}`} className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="h-4 w-4 mr-2" />
                      {manager.email}
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="experience" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work History
              </CardTitle>
              <Button size="sm" onClick={() => {
                setNewWork({ is_current: false });
                setAddWorkOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Work
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {workHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No work history added.</p>
              ) : (
                workHistory.map((job, idx) => (
                  <div key={job.id} className="relative group">
                    <div className="flex justify-between items-start mb-2 pr-20">
                      <div>
                        <h3 className="font-bold text-lg">{job.role_title}</h3>
                        <p className="text-primary font-medium">{job.company_name}</p>
                      </div>
                      <Badge variant="secondary">
                        {new Date(job.start_date).getFullYear()} - {job.is_current ? "Present" : new Date(job.end_date).getFullYear()}
                      </Badge>
                    </div>
                    <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => {
                        setNewWork(job);
                        setAddWorkOpen(true);
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteItem("talent_work_history", job.id, setWorkHistory)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{job.role_description}</p>
                    {idx < workHistory.length - 1 && <div className="my-6 border-b" />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education & Certifications
              </CardTitle>
              <Button size="sm" onClick={() => {
                setNewEdu({});
                setAddEduOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="font-semibold text-lg mb-4">Education</h3>
                {education.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No education listed.</p>
                ) : (
                  <div className="space-y-4">
                    {education.map((edu) => (
                      <div key={edu.id} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg group relative">
                        <div>
                          <h4 className="font-medium">{edu.institution_name}</h4>
                          <p className="text-sm text-muted-foreground">{edu.education_level} in {edu.field_of_study}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-background px-2 py-1 rounded border">
                            {edu.start_year} - {edu.end_year || "Present"}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => {
                              setNewEdu(edu);
                              setAddEduOpen(true);
                            }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteItem("talent_education", edu.id, setEducation)}>
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Certifications</h3>
                  <Button size="sm" variant="outline" onClick={() => {
                    setNewCert({});
                    setAddCertOpen(true);
                  }}>
                    <Plus className="h-3 w-3 mr-2" />
                    Add Cert
                  </Button>
                </div>
                {certifications.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No certifications listed.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm relative group">
                        <div className="flex items-start justify-between pr-16">
                          <div>
                            <h4 className="font-medium">{cert.certification_name}</h4>
                            <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                          </div>
                          <Award className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => {
                            setNewCert(cert);
                            setAddCertOpen(true);
                          }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteItem("talent_certifications", cert.id, setCertifications)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                        {cert.year_obtained && (
                          <p className="text-xs text-muted-foreground mt-2">Issued: {cert.year_obtained}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="references" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                References
              </CardTitle>
              <Button size="sm" onClick={() => {
                setNewRef({});
                setAddRefOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Reference
              </Button>
              <CardDescription>People who can vouch for your work</CardDescription>
            </CardHeader>
            <CardContent>
              {references.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No references provided.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {references.map((ref) => (
                    <div key={ref.id} className="p-4 border rounded-lg relative group">
                      <div className="flex items-center justify-between mb-2 pr-16">
                        <h4 className="font-semibold">{ref.reference_name}</h4>
                        <Badge variant={ref.verification_status === 'verified' ? "default" : "outline"}>
                          {ref.verification_status || "Pending"}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => {
                          setNewRef(ref);
                          setAddRefOpen(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteItem("talent_references", ref.id, setReferences)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground italic mb-2">{ref.relationship}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {ref.email}
                        </div>
                        {ref.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {ref.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Add Work Dialog */}
      <Dialog open={addWorkOpen} onOpenChange={setAddWorkOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Work Experience</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Role Title</Label>
              <Input className="col-span-3" value={newWork.role_title || ''} onChange={(e) => setNewWork({ ...newWork, role_title: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Company</Label>
              <Input className="col-span-3" value={newWork.company_name || ''} onChange={(e) => setNewWork({ ...newWork, company_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Start Date</Label>
              <Input type="date" className="col-span-3" value={newWork.start_date || ''} onChange={(e) => setNewWork({ ...newWork, start_date: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">End Date</Label>
              <div className="col-span-3 space-y-2">
                <Input type="date" disabled={newWork.is_current} value={newWork.end_date || ''} onChange={(e) => setNewWork({ ...newWork, end_date: e.target.value })} />
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked={newWork.is_current || false} onChange={(e) => setNewWork({ ...newWork, is_current: e.target.checked })} id="current-job" />
                  <label htmlFor="current-job" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">I currently work here</label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Description</Label>
              <Textarea className="col-span-3" value={newWork.role_description || ''} onChange={(e) => setNewWork({ ...newWork, role_description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => addItem("talent_work_history", newWork, setWorkHistory, setAddWorkOpen)} disabled={saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Education Dialog */}
      <Dialog open={addEduOpen} onOpenChange={setAddEduOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Education</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Institution</Label>
              <Input className="col-span-3" value={newEdu.institution_name || ''} onChange={(e) => setNewEdu({ ...newEdu, institution_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Level</Label>
              <Input className="col-span-3" placeholder="Bachelors, Masters, etc." value={newEdu.education_level || ''} onChange={(e) => setNewEdu({ ...newEdu, education_level: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Field</Label>
              <Input className="col-span-3" placeholder="Computer Science, etc." value={newEdu.field_of_study || ''} onChange={(e) => setNewEdu({ ...newEdu, field_of_study: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Start Year</Label>
              <Input type="number" className="col-span-3" value={newEdu.start_year || ''} onChange={(e) => setNewEdu({ ...newEdu, start_year: parseInt(e.target.value) })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">End Year</Label>
              <Input type="number" className="col-span-3" disabled={newEdu.is_current} value={newEdu.end_year || ''} onChange={(e) => setNewEdu({ ...newEdu, end_year: parseInt(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => addItem("talent_education", newEdu, setEducation, setAddEduOpen)} disabled={saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Certification Dialog */}
      <Dialog open={addCertOpen} onOpenChange={setAddCertOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input className="col-span-3" value={newCert.certification_name || ''} onChange={(e) => setNewCert({ ...newCert, certification_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Issuer</Label>
              <Input className="col-span-3" value={newCert.issuing_organization || ''} onChange={(e) => setNewCert({ ...newCert, issuing_organization: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Year</Label>
              <Input type="number" className="col-span-3" value={newCert.year_obtained || ''} onChange={(e) => setNewCert({ ...newCert, year_obtained: parseInt(e.target.value) })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">URL</Label>
              <Input className="col-span-3" value={newCert.credential_url || ''} onChange={(e) => setNewCert({ ...newCert, credential_url: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => addItem("talent_certifications", newCert, setCertifications, setAddCertOpen)} disabled={saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Reference Dialog */}
      <Dialog open={addRefOpen} onOpenChange={setAddRefOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Reference</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input className="col-span-3" value={newRef.reference_name || ''} onChange={(e) => setNewRef({ ...newRef, reference_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Relationship</Label>
              <Input className="col-span-3" value={newRef.relationship || ''} onChange={(e) => setNewRef({ ...newRef, relationship: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Email</Label>
              <Input type="email" className="col-span-3" value={newRef.email || ''} onChange={(e) => setNewRef({ ...newRef, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Phone</Label>
              <Input className="col-span-3" value={newRef.phone || ''} onChange={(e) => setNewRef({ ...newRef, phone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => addItem("talent_references", newRef, setReferences, setAddRefOpen)} disabled={saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default TalentProfile;
