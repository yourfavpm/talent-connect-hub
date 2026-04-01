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
          title: "Error",
          description: "Could not load talent profile. They may not be fully vetted yet.",
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
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6 -ml-4 text-gray-500 hover:text-gray-900 group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Professionals
      </Button>

      <TalentProfileHeader talent={talent} />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <TalentSections talent={talent} />
        </div>
        
        <div className="w-full lg:w-[320px] shrink-0 hidden lg:block">
          <TalentActionPanel 
            talent={talent} 
            onInvite={handleInvite}
            onMessage={() => navigate(getInternalPath(`/client/messages`))}
          />
          
          <div className="mt-4">
             <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm font-semibold py-6 h-auto border border-dashed border-blue-200" onClick={handleRequestCV}>
                Request Full CV / Resume
             </Button>
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
