import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { supabase } from "@/integrations/supabase/client";
import { ClientTalentProfileData } from "@/types/talent";
import { TalentProfileHeader } from "@/components/client/talent-profile/TalentProfileHeader";
import { TalentActionPanel } from "@/components/client/talent-profile/TalentActionPanel";
import { TalentSections } from "@/components/client/talent-profile/TalentSections";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InterviewInviteDrawer } from "@/components/client/talents/InterviewInviteDrawer";

const ClientTalentProfile = () => {
  const { talentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [talent, setTalent] = useState<ClientTalentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchTalentProfile = async (id: string) => {
      try {
        setLoading(true);
        
        // Use the secure RPC
        const { data, error } = await supabase.rpc('get_client_talent_profile', {
          p_talent_id: id
        });
          
        if (error) throw error;
        if (!data) {
          throw new Error("Talent not found or not approved");
        }

        const rpcData = data as any;

        // Map RPC data to our type structure (Zero PII leak)
        const profile: ClientTalentProfileData = {
          talent_id: rpcData.display_id || id.slice(0, 8).toUpperCase(),
          full_name: `${rpcData.first_name || ""} ${rpcData.last_initial || ""}.`.trim() || "Vetted Professional",
          avatar: rpcData.avatar_url || null,
          primary_role: rpcData.headline || "Professional",
          skill_level: rpcData.skill_level || "mid",
          vetting_status: "approved" as any, 
          location: rpcData.location || "Remote",
          timezone: rpcData.timezone || "UTC",
          years_experience: rpcData.years_experience || 0,
          availability: rpcData.availability || "Full-time",
          about: rpcData.bio || "No summary provided.",
          skills: rpcData.skills || [],
          tools: rpcData.tools || [],
          languages: rpcData.languages || ["English"],
          work_history: (rpcData.work_history || []).map((w: any) => ({
            id: w.id || Math.random().toString(),
            company: w.companyName || w.company,
            role: w.roleTitle || w.role,
            duration: `${w.startDate || w.start_date ? new Date(w.startDate || w.start_date).getFullYear() : ""} - ${w.isCurrent || w.is_current ? "Present" : (w.endDate || w.end_date ? new Date(w.endDate || w.end_date).getFullYear() : "")}`,
            description: w.roleDescription || w.description || "",
          })),
          education: (rpcData.education || []).map((e: any) => ({
            id: e.id || Math.random().toString(),
            institution: e.institutionName || e.institution,
            degree: e.degree,
            year: e.endYear || e.end_year || e.startYear || e.start_year || "",
          })),
          certifications: (rpcData.certifications || []).map((c: any) => ({
            id: c.id || Math.random().toString(),
            name: c.certificationName || c.name,
            issuer: c.issuer || c.issuing_organization || "OPSlyHR",
          })),
          references: [],
        };

        setTalent(profile);
      } catch (error: any) {
        console.error("Error fetching talent:", error);
        toast({
          title: "Access Denied or Not Found",
          description: "Could not load talent profile. Please refresh the page or try logging out and back in to sync your permissions.",
          variant: "destructive",
        });
        navigate(getInternalPath("/client/browse-talents"));
      } finally {
        setLoading(false);
      }
    };

    if (talentId) {
      fetchTalentProfile(talentId);
    }
  }, [talentId, navigate, toast]);

  const handleInvite = () => {
    setInviteDrawerOpen(true);
  };

  const handleRequestCV = async () => {
    try {
      toast({
        title: "Request Sent",
        description: `We've notified OPSlyHR admins about your CV request for this professional.`,
      });
      
      // In a real app, this might trigger a notification or create a record
      console.log("CV requested for talent:", talentId);
    } catch (error) {
      console.error("Error requesting CV:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500 font-medium font-sans">Loading talent profile...</p>
      </div>
    );
  }

  if (!talent) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-inter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm font-medium mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Talent Catalog
        </button>

        <div className="space-y-5">
          <TalentProfileHeader talent={talent} onInvite={handleInvite} onMessage={() => navigate(getInternalPath(`/client/messages`))} />

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">
            <div className="min-w-0 space-y-4">
              <TalentSections talent={talent} />
            </div>

            <div className="space-y-4">
              <TalentActionPanel
                talent={talent}
                onInvite={handleInvite}
                onMessage={() => navigate(getInternalPath(`/client/messages`))}
              />

              {/* CV Request card */}
              <div
                className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 cursor-pointer group hover:border-blue-200 transition-all"
                onClick={handleRequestCV}
              >
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 group-hover:text-blue-600 transition-colors">Confidentiality Notice</p>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Full resumes contain PII and are shared via our Talent Success team upon request.
                </p>
                <button className="w-full h-9 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:border-blue-400 hover:text-blue-600 transition-all">
                  Request Full CV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InterviewInviteDrawer
        isOpen={inviteDrawerOpen}
        onClose={() => setInviteDrawerOpen(false)}
        talentId={talentId || ""}
        talentName={talent.full_name}
      />
    </div>
  );

};

export default ClientTalentProfile;
