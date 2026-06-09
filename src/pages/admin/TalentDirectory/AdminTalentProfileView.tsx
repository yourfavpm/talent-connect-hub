import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Mail, 
  UserPlus, 
  Ban, 
  Loader2, 
  Globe, 
  User, 
  ShieldCheck,
  MapPin,
  Clock,
  Download,
  FileText,
  Compass
} from "lucide-react";
import { toast } from "sonner";
import TalentActionsDrawers from "./components/TalentActionsDrawers";
import { getInternalPath } from "@/utils/subdomain";

interface TalentData {
  id: string; // Legacy talents table ID
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  talent_id: string | null;
  primary_role: string | null;
  years_of_experience: number | null;
  summary: string | null;
  timezone: string | null;
  country: string | null;
  availability: string | null;
  heard_from: string | null;
}

interface ProfileData {
  id: string;
  user_id: string;
  status: string;
  progress_percent: number;
  is_suspended: boolean;
  vetting_level_text: string | null;
  talent_manager_admin_id: string | null;
  talents: TalentData | null;
}

interface SectionData {
  id: string;
  section_key: string;
  data: Record<string, any>;
  status: string;
}

const SECTION_LABELS: Record<string, string> = {
  basic_info: "Basic Information",
  professional_details: "Professional Details",
  work_history: "Work History",
  documents: "Documents",
  education: "Education",
  certifications: "Certifications",
  references: "References",
};

const AdminTalentProfileView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tp, setTp] = useState<ProfileData | null>(null);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [managerName, setManagerName] = useState("");
  
  // Drawer states
  const [emailOpen, setEmailOpen] = useState(false);
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const profileLookupFilter = [`id.eq.${id}`, `user_id.eq.${id}`, `talent_id.eq.${id}`].join(",");
      let { data: profile, error: pError } = await supabase
        .from("v2_talent_profiles")
        .select(`
          *,
          talents:user_id (*),
          profiles:user_id (heard_from)
        `)
        .or(profileLookupFilter)
        .maybeSingle();

      if (!profile) {
        const { data: talentRecord } = await supabase
          .from("talents")
          .select("user_id, talent_id")
          .or(profileLookupFilter)
          .maybeSingle();

        if (talentRecord?.user_id || talentRecord?.talent_id) {
          const fallbackFilters = [
            talentRecord.user_id ? `user_id.eq.${talentRecord.user_id}` : null,
            talentRecord.talent_id ? `talent_id.eq.${talentRecord.talent_id}` : null,
          ].filter(Boolean).join(",");

          const fallback = await supabase
            .from("v2_talent_profiles")
            .select(`
              *,
              talents:user_id (*),
              profiles:user_id (heard_from)
            `)
            .or(fallbackFilters)
            .maybeSingle();

          profile = fallback.data;
          pError = fallback.error;
        }
      }

      if (pError) throw pError;
      if (!profile) throw new Error("Talent profile not found");
      const pData = profile as ProfileData;
      if (userRole === "talent_manager" && pData.talent_manager_admin_id !== user?.id) {
        toast.error("You can only access talents assigned to you.");
        navigate(getInternalPath("/admin/my-talents"));
        return;
      }
      setTp(pData);

      // Fetch Sections
      const { data: sData } = await supabase
        .from("v2_profile_sections")
        .select("*")
        .eq("user_id", pData.user_id);
      
      setSections((sData || []) as SectionData[]);

      if (pData.talent_manager_admin_id) {
        const { data: mData } = await supabase
          .from("admin_users")
          .select("full_name")
          .eq("id", pData.talent_manager_admin_id)
          .single();
        if (mData) {
          setManagerName(mData.full_name || "Admin");
        }
      } else {
        setManagerName("");
      }
    } catch (err) {
      console.error("Error fetching talent detail:", err);
      toast.error("Failed to load talent profile");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const downloadFile = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from("talent_documents").createSignedUrl(path, 3600);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    } catch (err: any) {
      toast.error("Download failed: " + err.message);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-3">
      <Loader2 className="h-10 w-10 text-slate-200 animate-spin" />
    </div>
  );

  if (!tp) return <div className="p-20 text-center text-slate-500">Talent profile not found.</div>;

  const talent = tp.talents;

  // Derive professional data from V2 sections if available
  const profSection = sections.find(s => s.section_key === "professional_details")?.data || {};
  const basicSection = sections.find(s => s.section_key === "basic_info")?.data || {};

  const headline = (profSection.primaryRole as string) || talent?.primary_role?.replace('_', ' ') || "No primary role set";
  const experience = (profSection.yearsOfExperience as number) || talent?.years_of_experience || 0;
  const summary = (profSection.shortBio as string) || talent?.summary || "No professional summary provided.";
  const displayCountry = (basicSection.country as string) || talent?.country || "Location not set";
  const displayTimezone = (basicSection.timezone as string) || talent?.timezone || "Timezone unknown";
  const displayEmail = (basicSection.email as string) || (basicSection.contactEmail as string) || talent?.email;
  const displayAvailability = (profSection.availability as string) || talent?.availability || "Availability unknown";
  const displayHeardFrom = talent?.heard_from || (tp as any).profiles?.heard_from || "Source unknown";

  return (
    <div className="w-full max-w-none space-y-8 pb-20 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="flex items-start gap-5">
           <Button variant="ghost" onClick={() => navigate("/talents")} className="gap-2 text-slate-500 hover:text-slate-900 transition-colors">
             <ArrowLeft className="h-4 w-4" /> Back to Directory
           </Button>
           <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{talent?.first_name} {talent?.last_name}</h1>
                <Badge variant="outline" className="h-6 bg-slate-50 border-slate-200 text-slate-600 font-mono tracking-widest text-[9px] uppercase px-2">
                  {talent?.talent_id}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 shadow-none font-bold text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-sm">
                  {tp.status.replace('_', ' ')}
                </Badge>
                {tp.is_suspended && (
                  <Badge variant="destructive" className="bg-red-50 text-red-700 shadow-none font-bold text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-sm">
                    Suspended
                  </Badge>
                )}
                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
                <span className="text-sm text-slate-500 font-medium flex items-center gap-1.5 italic">
                  <Globe className="h-3.5 w-3.5" /> {displayTimezone}
                </span>
              </div>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <Button variant="outline" onClick={() => setEmailOpen(true)} className="h-11 rounded-xl shadow-none border-slate-200 gap-2 font-semibold">
             <Mail className="h-4 w-4" /> Email
           </Button>
           <Button variant="outline" onClick={() => setShortlistOpen(true)} className="h-11 rounded-xl shadow-none border-slate-200 gap-2 font-semibold">
             <UserPlus className="h-4 w-4" /> Shortlist
           </Button>
           <Button variant="outline" onClick={() => setSuspendOpen(true)} className="h-11 rounded-xl shadow-none border-red-200 text-red-600 hover:bg-red-50 gap-2 font-semibold">
             <Ban className="h-4 w-4" /> {tp.is_suspended ? "Unsuspend" : "Suspend"}
           </Button>
           <Button asChild className="h-11 rounded-xl shadow-lg shadow-indigo-500/10 bg-indigo-600 hover:bg-indigo-700 gap-2 font-bold uppercase tracking-widest text-[11px]">
             <Link to={getInternalPath(`/admin/vetting/${tp.id}`)}>
               <ShieldCheck className="h-4 w-4" /> Open in Vetting
             </Link>
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Summary */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Stats</h3>
                <div className="grid grid-cols-1 gap-4">
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</p>
                        <p className="text-xl font-bold text-slate-900">{tp.progress_percent}%</p>
                      </div>
                      <div className="h-10 w-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-blue-600">
                        <Loader2 className="h-5 w-5" />
                      </div>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vetting Level</p>
                        <p className="text-lg font-bold text-slate-900">{tp.vetting_level_text || "Unassigned"}</p>
                      </div>
                      <div className="h-10 w-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-emerald-600">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between items-center">
                  Assigned Manager
                  <Button variant="ghost" size="sm" onClick={() => setAssignOpen(true)} className="h-6 text-[10px] text-blue-600 font-bold p-0">Change</Button>
                </h3>
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                     {managerName?.[0] || 'U'}
                   </div>
                   <div className="min-w-0">
                     <p className="text-sm font-bold text-slate-900 truncate">{managerName || "Unassigned"}</p>
                     <p className="text-[11px] text-slate-500">Direct Talent Manager</p>
                   </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between items-center">
                  Internal Notes
                </h3>
                <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50 space-y-3">
                   <p className="text-xs text-slate-600 italic">No internal notes added yet.</p>
                   <Button variant="ghost" className="h-8 text-[11px] font-bold text-indigo-600 bg-white border border-indigo-100 w-full shadow-sm">
                     Add Admin Note
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
             <CardContent className="p-6 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Details</h3>
                 <div className="space-y-3">
                   <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                     <Mail className="h-4 w-4 text-slate-400" /> {displayEmail}
                   </div>
                   <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                     <MapPin className="h-4 w-4 text-slate-400" /> {displayCountry}
                   </div>
                   <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                     <Clock className="h-4 w-4 text-slate-400" /> {displayAvailability}
                   </div>
                   <div className="flex items-center gap-3 text-sm text-slate-600 font-medium capitalize">
                     <Compass className="h-4 w-4 text-slate-400" /> {displayHeardFrom?.replace('_', ' ')}
                   </div>
                 </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Main Content */}
        <div className="lg:col-span-8 space-y-8">
           <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
             <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" /> Professional Overview
                </h3>
             </div>
              <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Headline</p>
                      <p className="text-lg font-semibold text-slate-900 leading-tight">{headline}</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Experience</p>
                      <p className="text-lg font-semibold text-slate-900">{experience} Years</p>
                   </div>
                </div>

                <div className="space-y-4 pt-2">
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Professional Summary</p>
                   <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-5 rounded-2xl italic">
                     {summary}
                   </p>
                </div>
              </CardContent>
           </Card>

           {/* Detailed Sections Rendering */}
           <div className="space-y-8">
              {Object.entries(SECTION_LABELS).map(([key, label]) => {
                if (key === "basic_info" || key === "professional_details") return null;
                const section = sections.find(s => s.section_key === key);
                if (!section || !section.data || Object.keys(section.data).length === 0) return null;

                return (
                  <Card key={key} className="rounded-2xl border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                       <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                         <FileText className="h-4 w-4 text-slate-400" /> {label}
                       </h3>
                       <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-white border-slate-200 text-slate-500">
                         {section.status}
                       </Badge>
                    </div>
                    <CardContent className="p-6 space-y-6">
                       <div className="grid grid-cols-1 gap-6 max-w-3xl">
                          {Object.entries(section.data).map(([field, value]) => {
                            if (field === "id") return null;
                            const isDocUrl = typeof value === "string" && (
                              field.endsWith("Url") || field.endsWith("_url")
                            ) && value.includes("/");

                            return (
                              <div key={field} className="flex flex-col gap-1.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  {field.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, s => s.toUpperCase())}
                                </p>
                                {isDocUrl ? (
                                  <Button
                                    variant="outline" size="sm"
                                    onClick={() => downloadFile(String(value))}
                                    className="w-fit gap-2 border-slate-200 hover:bg-slate-50 h-8 rounded-lg text-xs"
                                  >
                                    <Download className="h-3.5 w-3.5 text-emerald-600" />
                                    Download File
                                  </Button>
                                ) : Array.isArray(value) ? (
                                  <div className="space-y-3">
                                    {value.map((item: any, idx: number) => (
                                      <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs shadow-none">
                                        {typeof item === "object" ? (
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {Object.entries(item).filter(([k]) => k !== "id").map(([k, v]) => (
                                              <div key={k} className="flex flex-col gap-0.5">
                                                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{k.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}</span>
                                                <span className="text-slate-800 font-semibold">{String(v || "—")}</span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-slate-800 font-semibold">{String(item)}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm font-semibold text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100 inline-block">
                                    {String(value || "—")}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                       </div>
                    </CardContent>
                  </Card>
                );
              })}
           </div>
        </div>
      </div>

      {/* Action Drawers */}
      <TalentActionsDrawers 
        emailOpen={emailOpen} 
        setEmailOpen={setEmailOpen}
        shortlistOpen={shortlistOpen}
        setShortlistOpen={setShortlistOpen}
        suspendOpen={suspendOpen}
        setSuspendOpen={setSuspendOpen}
        assignOpen={assignOpen}
        setAssignOpen={setAssignOpen}
        tp={tp}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default AdminTalentProfileView;
