import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Users,
  FileText,
  Clock,
  Globe,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle
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
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  
  const [documentUrls, setDocumentUrls] = useState<{ cvUrl: string | null; governmentIdUrl: string | null }>({ cvUrl: null, governmentIdUrl: null });

  // Modals
  const [isRequestChangesOpen, setIsRequestChangesOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [modalReason, setModalReason] = useState("");

  useEffect(() => {
    if (id) fetchTalentData();
  }, [id]);

  const fetchTalentData = async () => {
    try {
      const { data: talentData, error } = await supabase.from("talents").select("*").eq("id", id).single();
      if (error) throw error;
      setTalent(talentData);

      // Fetch talent_profiles data for status
      const { data: profileData } = await (supabase.from("talent_profiles" as any) as any)
        .select("*")
        .eq("user_id", talentData.user_id)
        .single();

      // Fetch sections data
      const { data: sectionsData } = await (supabase.from("talent_profile_sections" as any) as any)
        .select("*")
        .eq("user_id", talentData.user_id);

      const getSignedUrl = async (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        try {
          const { data } = await supabase.storage.from('talent_documents').createSignedUrl(path, 60 * 60);
          return data?.signedUrl || null;
        } catch { return null; }
      };

      const [cvUrl, govIdUrl] = await Promise.all([
        getSignedUrl(talentData.cv_url),
        getSignedUrl(talentData.government_id_url)
      ]);
      setDocumentUrls({ cvUrl, governmentIdUrl: govIdUrl });

      // Map sections data to local state
      if (sectionsData) {
        const workSection = sectionsData.find((s: any) => s.section_key === "professional_details" || s.section_key === "work_history");
        const eduSection = sectionsData.find((s: any) => s.section_key === "education");
        
        // If we have data in talent_profile_sections, use it. Otherwise fallback to legacy tables.
        if (workSection?.data?.work_history) {
           setWorkHistory(workSection.data.work_history);
        } else {
           const { data: legacyWork } = await supabase.from("talent_work_history").select("*").eq("talent_id", id).order("start_date", { ascending: false });
           setWorkHistory(legacyWork || []);
        }

        if (eduSection?.data?.education) {
           setEducation(eduSection.data.education);
        } else {
           const { data: legacyEdu } = await supabase.from("talent_education").select("*").eq("talent_id", id).order("start_year", { ascending: false });
           setEducation(legacyEdu || []);
        }

        // Get certs and refs from professional_details if available
        const profSection = sectionsData.find((s: any) => s.section_key === "professional_details");
        if (profSection?.data?.certifications) {
            setCertifications(profSection.data.certifications);
        } else {
            const { data: legacyCert } = await supabase.from("talent_certifications").select("*").eq("talent_id", id);
            setCertifications(legacyCert || []);
        }

        if (profSection?.data?.references) {
            setReferences(profSection.data.references);
        } else {
            const { data: legacyRef } = await supabase.from("talent_references").select("*").eq("talent_id", id);
            setReferences(legacyRef || []);
        }
      } else {
        // Fallback to legacy tables entirely if no sections
        const [workData, eduData, certData, refData] = await Promise.all([
            supabase.from("talent_work_history").select("*").eq("talent_id", id).order("start_date", { ascending: false }),
            supabase.from("talent_education").select("*").eq("talent_id", id).order("start_year", { ascending: false }),
            supabase.from("talent_certifications").select("*").eq("talent_id", id),
            supabase.from("talent_references").select("*").eq("talent_id", id),
        ]);
        setWorkHistory(workData.data || []);
        setEducation(eduData.data || []);
        setCertifications(certData.data || []);
        setReferences(refData.data || []);
      }

      // Fetch actions for notes
      const { data: actionsData } = await (supabase.from("vetting_actions" as any) as any)
        .select("*")
        .eq("user_id", talentData.user_id)
        .order("created_at", { ascending: false });

      if (actionsData && actionsData.length > 0) {
        const lastNoteAction = actionsData.find((a: any) => a.note);
        setAdminNotes(lastNoteAction?.note || "");
      }

      if (profileData) {
        setTalent((prev: any) => ({ ...prev, vetting_status: profileData.status }));
      }
    } catch (error) {
      console.error("Error fetching talent:", error);
    } finally {
      setLoading(false);
    }
  };

  const computeUiStatus = () => {
    if (!talent) return "pending";
    const status = talent.vetting_status;
    if (status === "VETTED" || status === "fully_vetted") return "approved";
    if (status === "REJECTED") return "rejected";
    if (status === "CHANGES_REQUESTED") return "changes";
    return "pending";
  };

  const handleAction = async (action: "approve" | "changes" | "reject", reason?: string) => {
    setActionLoading(true);
    try {
      // Use RPCs for consistency with Vetting Engine
      if (action === "approve") {
        const { error } = await (supabase.rpc("admin_finalize_vetting", {
          p_talent_user_id: talent.user_id,
          p_vetting_level: "L1" // Default level
        } as any) as any);
        if (error) throw error;
      } else if (action === "changes") {
         // This is a global request changes, ideally we should specify a section.
         // For legacy compatibility, we'll just update the status directly on talent_profiles
         const { error } = await (supabase.from("talent_profiles" as any) as any)
           .update({ status: "CHANGES_REQUESTED", last_action_at: new Date().toISOString() } as any)
           .eq("user_id", talent.user_id);
         if (error) throw error;

         // Log it
         await (supabase.from("vetting_actions" as any) as any).insert({
            user_id: talent.user_id,
            admin_id: (await supabase.auth.getUser()).data.user?.id,
            action_type: "REQUEST_CHANGES",
            note: reason || "General profile changes requested"
         } as any);
      } else if (action === "reject") {
        const { error } = await (supabase.from("talent_profiles" as any) as any)
          .update({ status: "REJECTED", last_action_at: new Date().toISOString() } as any)
          .eq("user_id", talent.user_id);
        if (error) throw error;

        // Log it
        await (supabase.from("vetting_actions" as any) as any).insert({
           user_id: talent.user_id,
           admin_id: (await supabase.auth.getUser()).data.user?.id,
           action_type: "REJECT_TALENT",
           note: reason || "Talent rejected"
        } as any);
      }

      toast({ title: "Success", description: `Talent status updated to ${action}.` });
      
      // Reset modals and refresh
      setIsRequestChangesOpen(false);
      setIsRejectOpen(false);
      setModalReason("");
      fetchTalentData();

    } catch (error) {
      console.error("Error updating talent:", error);
      toast({ title: "Error", description: "Could not update status.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSaving(true);
      await (supabase.from("vetting_actions" as any) as any).insert({
        user_id: talent.user_id,
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action_type: "ADMIN_NOTE",
        note: adminNotes
      } as any);
      toast({ title: "Notes Saved", description: "Internal notes updated successfully." });
    } catch (e: any) {
      toast({ title: "Error", description: "Could not save notes: " + e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!talent) return <div className="p-8 text-center text-gray-500">Talent not found.</div>;

  const uiStatus = computeUiStatus();

  return (
    <div className="max-w-[1400px] mx-auto pb-10 space-y-6">
      
      <div className="flex items-center gap-4 border-b border-gray-200 pb-5">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/talents")} className="text-gray-500 hover:text-gray-900 border border-gray-200 shadow-sm h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{talent.first_name} {talent.last_name}</h1>
            {!talent.onboarding_completed && (
               <Badge className="bg-warning/10 text-warning hover:bg-warning/20 border-0 font-normal shadow-none h-6">Onboarding Incomplete</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 font-mono mt-1">{talent.talent_id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT PANEL: PROFILE DATA (READ ONLY) */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                <User className="h-4 w-4 text-gray-400" /> Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email</p>
                  <p className="text-sm font-medium text-gray-900">{talent.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Phone className="h-3 w-3" /> Phone</p>
                  <p className="text-sm font-medium text-gray-900">{talent.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Location</p>
                  <p className="text-sm font-medium text-gray-900">{talent.country || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Globe className="h-3 w-3" /> Timezone</p>
                  <p className="text-sm font-medium text-gray-900">{talent.timezone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Working Hours</p>
                  <p className="text-sm font-medium text-gray-900">{talent.preferred_working_hours || "—"}</p>
                </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                <Briefcase className="h-4 w-4 text-gray-400" /> Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Primary Role</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{talent.primary_role?.replace(/_/g, " ") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Experience</p>
                  <p className="text-sm font-medium text-gray-900">{talent.years_of_experience || 0} years</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Availability</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{talent.availability?.replace(/_/g, " ") || "—"}</p>
                </div>
              </div>

              {talent.secondary_skills && talent.secondary_skills.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Secondary Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {talent.secondary_skills.map((s: string) => <Badge key={s} variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-normal">{s}</Badge>)}
                  </div>
                </div>
              )}
              {talent.tools_familiar_with && talent.tools_familiar_with.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Tools</p>
                  <div className="flex flex-wrap gap-2">
                    {talent.tools_familiar_with.map((t: string) => <Badge key={t} variant="outline" className="text-gray-600 font-normal">{t}</Badge>)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work History */}
          <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                <Briefcase className="h-4 w-4 text-gray-400" /> Work History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {workHistory.length === 0 ? (
                <div className="p-5 text-sm text-gray-500">No work history provided.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {workHistory.map((work) => (
                    <div key={work.id} className="p-5">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{work.role_title} <span className="text-gray-400 font-normal mx-1">at</span> {work.company_name}</h4>
                        {work.is_current && <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50/50 font-normal text-[10px] uppercase">Current</Badge>}
                      </div>
                      <p className="text-xs text-gray-500 font-mono mb-3">{work.start_date} — {work.is_current ? "Present" : work.end_date || "N/A"}</p>
                      {work.role_description && <p className="text-sm text-gray-700 leading-relaxed">{work.role_description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
               <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                 <FileText className="h-4 w-4 text-gray-400" /> Documents
               </CardTitle>
             </CardHeader>
             <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 flex items-center justify-between bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Resume / CV</p>
                      <p className="text-xs text-gray-500">{documentUrls.cvUrl ? 'Uploaded' : 'Missing'}</p>
                    </div>
                  </div>
                  {documentUrls.cvUrl && (
                    <Button variant="outline" size="sm" asChild className="h-7 text-xs px-3 shadow-none">
                      <a href={documentUrls.cvUrl} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-gray-200 flex items-center justify-between bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Government ID</p>
                      <p className="text-xs text-gray-500">{documentUrls.governmentIdUrl ? 'Uploaded' : 'Missing'}</p>
                    </div>
                  </div>
                  {documentUrls.governmentIdUrl && (
                    <Button variant="outline" size="sm" asChild className="h-7 text-xs px-3 shadow-none">
                      <a href={documentUrls.governmentIdUrl} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                  )}
                </div>
             </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
               <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
                 <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                   <GraduationCap className="h-4 w-4 text-gray-400" /> Education
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                  {education.length === 0 ? <p className="p-5 text-sm text-gray-500">No education provided.</p> : 
                    <div className="divide-y divide-gray-100">
                      {education.map(e => (
                        <div key={e.id} className="p-5">
                          <h4 className="text-sm font-semibold text-gray-900">{e.institution_name}</h4>
                          <p className="text-sm text-gray-700 mt-1">{e.field_of_study} — <span className="capitalize">{e.education_level?.replace(/_/g, ' ')}</span></p>
                          <p className="text-xs text-gray-500 font-mono mt-2">{e.start_year} — {e.is_current ? "Present" : e.end_year}</p>
                        </div>
                      ))}
                    </div>
                  }
               </CardContent>
            </Card>

            <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
               <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
                 <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                   <Award className="h-4 w-4 text-gray-400" /> Certs & References
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">Certifications</h4>
                    {certifications.length === 0 ? <p className="text-sm text-gray-400">None provided</p> : certifications.map(c => (
                      <div key={c.id} className="mb-2">
                        <p className="text-sm font-medium text-gray-900">{c.certification_name}</p>
                        <p className="text-xs text-gray-500">{c.issuing_organization} {c.year_obtained ? `(${c.year_obtained})` : ''}</p>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">References</h4>
                    {references.length === 0 ? <p className="text-sm text-gray-400">None provided</p> : references.map(r => (
                      <div key={r.id} className="mb-2">
                        <p className="text-sm font-medium text-gray-900">{r.reference_name} <span className="font-normal text-gray-500">({r.relationship})</span></p>
                        <p className="text-xs text-brand-primary">{r.email}</p>
                      </div>
                    ))}
                  </div>
               </CardContent>
            </Card>
          </div>

        </div>

        {/* RIGHT PANEL: STICKY ACTIONS */}
        <div className="lg:sticky lg:top-24 space-y-6">
          <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
              <CardTitle className="text-sm font-semibold text-gray-900 flex justify-between items-center">
                Vetting Status
                {uiStatus === "approved" && <Badge className="bg-success/10 text-success hover:bg-success/20 border-0 font-normal">Approved</Badge>}
                {uiStatus === "rejected" && <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-0 font-normal">Rejected</Badge>}
                {uiStatus === "changes" && <Badge className="bg-warning/10 text-warning hover:bg-warning/20 border-0 font-normal">Changes Requested</Badge>}
                {uiStatus === "pending" && <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200 border-0 font-normal">Pending Review</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 flex justify-between items-center">
                  Internal Vetting Notes
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase font-semibold text-brand-primary px-2" onClick={handleSaveNotes}>Save</Button>
                </label>
                <Textarea 
                  placeholder="These notes are invisible to the talent..."
                  className="min-h-[120px] text-sm resize-none shadow-sm focus-visible:ring-1"
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                />
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white shadow-none"
                  onClick={() => handleAction("approve")}
                  disabled={actionLoading || uiStatus === "approved" || !talent.onboarding_completed}
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Approve Talent
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="w-full shadow-none"
                    onClick={() => setIsRequestChangesOpen(true)}
                    disabled={actionLoading || uiStatus === "changes"}
                  >
                    Request Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20 shadow-none"
                    onClick={() => setIsRejectOpen(true)}
                    disabled={actionLoading || uiStatus === "rejected"}
                  >
                    Reject Talent
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Audit Footer */}
          <div className="px-1 space-y-1">
            <p className="text-xs text-gray-500 font-mono">Submitted: {new Date(talent.created_at).toLocaleDateString()}</p>
            {vettingLevels[0]?.reviewed_at && (
              <p className="text-xs text-gray-500 font-mono">Last updated: {new Date(vettingLevels[0].reviewed_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>

      {/* Request Changes Modal */}
      <Dialog open={isRequestChangesOpen} onOpenChange={setIsRequestChangesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Describe what the talent needs to update in their profile. They will receive an email notification.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              className="resize-none"
              rows={4}
              placeholder="e.g. Please upload a clearer copy of your Government ID..."
              value={modalReason}
              onChange={(e) => setModalReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestChangesOpen(false)}>Cancel</Button>
            <Button onClick={() => handleAction("changes", modalReason)} disabled={!modalReason.trim() || actionLoading}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Reject Talent
            </DialogTitle>
            <DialogDescription>
              Provide an internal reason for rejecting this talent. This cannot be easily undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              className="resize-none border-destructive/20 focus-visible:ring-destructive/20"
              rows={3}
              placeholder="Internal rejection reason..."
              value={modalReason}
              onChange={(e) => setModalReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleAction("reject", modalReason)} disabled={!modalReason.trim() || actionLoading}>Reject Talent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default TalentDetail;
