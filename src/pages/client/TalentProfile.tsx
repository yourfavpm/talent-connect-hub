import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClientTalentProfileData } from "@/types/talent";
import { TalentProfileHeader } from "@/components/client/talent-profile/TalentProfileHeader";
import { TalentActionPanel } from "@/components/client/talent-profile/TalentActionPanel";
import { TalentSections } from "@/components/client/talent-profile/TalentSections";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useVettingVersion } from "@/hooks/useVettingVersion";

const ClientTalentProfile = () => {
  const { talentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { version, isLoading: isVersionLoading } = useVettingVersion();
  
  const [talent, setTalent] = useState<ClientTalentProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTalentProfile = async (id: string) => {
      try {
        setLoading(true);
        
        const { data, error: talentError } = await supabase
          .from("talents")
          .select("*")
          .eq("id", id)
          .maybeSingle();
          
        if (talentError) throw talentError;
        if (!data) {
          console.error("Talent not found or not vet-approved. ID:", id);
          throw new Error("Talent not found");
        }

        const talentData = data as any; // Ignore strict Supabase types

        if (version === "v2") {
          const { data: v2Profile } = await supabase
            .from("v2_talent_profiles")
            .select("status, vetting_level")
            .eq("user_id", talentData.user_id)
            .maybeSingle();

          const { data: v2Sections } = await supabase
            .from("v2_profile_sections")
            .select("*")
            .eq("user_id", talentData.user_id);

          const merged: Record<string, any> = {};
          (v2Sections || []).forEach(sec => {
            if (sec.data && typeof sec.data === "object") {
              Object.assign(merged, sec.data);
            }
          });

          const profile: ClientTalentProfileData = {
            talent_id: talentData.id?.slice(0, 8).toUpperCase() || id.slice(0, 8).toUpperCase(),
            full_name: `${merged.firstName || talentData.first_name || ""} ${merged.lastName || talentData.last_name || ""}`.trim() || "Unknown Talent",
            avatar: talentData.avatar_url || talentData.avatar || null,
            primary_role: merged.primaryRole || talentData.primary_role || "Professional",
            skill_level: talentData.skill_level || "mid",
            vetting_status: v2Profile?.status as any,
            location: merged.country || talentData.location || talentData.country || "Remote",
            timezone: merged.timezone || talentData.timezone || "UTC",
            years_experience: merged.yearsOfExperience || talentData.years_experience || talentData.years_of_experience || 0,
            availability: merged.availability || talentData.availability || "Full-time",
            about: merged.shortBio || talentData.about_me || talentData.bio || talentData.summary || "No summary provided.",
            skills: merged.secondarySkills || talentData.primary_skills || [],
            tools: merged.toolsFamiliarWith || talentData.secondary_skills || [],
            languages: merged.languagesSpoken || talentData.languages || ["English"],
            work_history: (merged.workHistory || []).map((w: any) => ({
              id: w.id || Date.now().toString(),
              company: w.companyName,
              role: w.roleTitle,
              duration: `${w.startDate ? new Date(w.startDate).getFullYear() : ""} - ${w.isCurrent ? "Present" : (w.endDate ? new Date(w.endDate).getFullYear() : "")}`,
              description: w.roleDescription || "",
            })),
            education: (merged.education || []).map((e: any) => ({
              id: e.id || Date.now().toString(),
              institution: e.institutionName,
              degree: e.degree,
              year: e.endYear || e.startYear || "",
            })),
            certifications: (merged.certifications || []).map((c: any) => ({
              id: c.id || Date.now().toString(),
              name: c.certificationName,
              issuer: c.issuer || "Taskive",
            })),
            references: [],
          };
          setTalent(profile);
        } else {
          const [workHistory, education, certifications] = await Promise.all([
            supabase.from("talent_work_history").select("*").eq("talent_id", id).order("start_date", { ascending: false }),
            supabase.from("talent_education").select("*").eq("talent_id", id).order("start_year", { ascending: false }),
            supabase.from("talent_certifications").select("*").eq("talent_id", id),
          ]);

          const profile: ClientTalentProfileData = {
            talent_id: talentData.id?.slice(0, 8).toUpperCase() || id.slice(0, 8).toUpperCase(),
            full_name: `${talentData.first_name || ""} ${talentData.last_name || ""}`.trim() || "Unknown Talent",
            avatar: talentData.avatar_url || talentData.avatar || null,
            primary_role: talentData.primary_role || "Professional",
            skill_level: talentData.skill_level || "mid",
            vetting_status: talentData.vetting_status as any,
            location: talentData.location || talentData.country || "Remote",
            timezone: talentData.timezone || "UTC",
            years_experience: talentData.years_experience || talentData.years_of_experience || 0,
            availability: talentData.availability || "Full-time",
            about: talentData.about_me || talentData.bio || talentData.summary || "No summary provided.",
            skills: talentData.primary_skills || [],
            tools: talentData.secondary_skills || [],
            languages: talentData.languages || ["English"],
            work_history: (workHistory.data || []).map((w: any) => ({
              id: w.id,
              company: w.company,
              role: w.title || w.role,
              duration: `${w.start_date ? new Date(w.start_date).getFullYear() : ""} - ${w.is_current ? "Present" : (w.end_date ? new Date(w.end_date).getFullYear() : "")}`,
              description: w.description || "",
            })),
            education: (education.data || []).map((e: any) => ({
              id: e.id,
              institution: e.institution,
              degree: e.degree,
              year: e.end_year || e.start_year || "",
            })),
            certifications: (certifications.data || []).map((c: any) => ({
              id: c.id,
              name: c.name,
              issuer: c.issuer || c.organization || "Taskive",
            })),
            references: [],
          };
          setTalent(profile);
        }
      } catch (error: any) {
        console.error("Error fetching talent:", error);
        toast({
          title: "Error",
          description: "Could not load talent profile. They may not be fully vetted yet.",
          variant: "destructive",
        });
        navigate("/client/browse-talents");
      } finally {
        setLoading(false);
      }
    };

    if (talentId && !isVersionLoading) {
      fetchTalentProfile(talentId);
    }
  }, [talentId, navigate, toast, version, isVersionLoading]);

  if (loading || isVersionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500 font-medium font-sans">Loading talent profile...</p>
      </div>
    );
  }

  if (!talent) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6 -ml-4 text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <TalentProfileHeader talent={talent} />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <TalentSections talent={talent} />
        </div>
        
        <div className="w-full lg:w-[320px] shrink-0 hidden lg:block">
          <TalentActionPanel talent={talent} />
        </div>
      </div>
    </div>
  );
};

export default ClientTalentProfile;
