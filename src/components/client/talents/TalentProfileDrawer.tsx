import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { ClientTalentProfileData } from "@/types/talent";
import { TalentSections } from "@/components/client/talent-profile/TalentSections";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TalentProfileDrawerProps {
  talentId?: string;
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TalentProfileDrawer = ({ talentId, userId, isOpen, onClose }: TalentProfileDrawerProps) => {
  const [talent, setTalent] = useState<ClientTalentProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || (!talentId && !userId)) return;

    const fetchTalentProfile = async () => {
      try {
        setLoading(true);
        let idToUse = talentId;

        if (!idToUse && userId) {
           // Find the talentId using the userId
           const { data: tData } = await supabase
             .from('talents')
             .select('id')
             .eq('user_id', userId)
             .maybeSingle();
           
           if (tData) {
             idToUse = tData.id;
           }
        }

        if (!idToUse) throw new Error("Talent not found");

        const { data, error } = await supabase.rpc('get_client_talent_profile', {
          p_talent_id: idToUse
        });
          
        if (error) throw error;
        if (!data) throw new Error("Talent not found");

        const rpcData = data as any;
        const profile: ClientTalentProfileData = {
          talent_id: rpcData.display_id || idToUse.slice(0, 8).toUpperCase(),
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
      } catch (error) {
        console.error("Error fetching talent:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTalentProfile();
  }, [talentId, userId, isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] md:w-[600px] border-l-gray-200 p-0 overflow-y-auto bg-[#f8f9fc]">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500 font-medium font-sans text-sm">Loading talent profile...</p>
          </div>
        ) : talent ? (
          <>
            {/* Header section similar to TalentProfileHeader but condensed */}
            <div className="bg-white px-6 py-8 border-b border-gray-200">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 border-2 border-white shadow-md ring-1 ring-slate-100">
                  <AvatarImage src={talent.avatar || undefined} />
                  <AvatarFallback className="bg-slate-100 text-slate-600 text-2xl font-medium">
                    {talent.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <SheetTitle className="text-2xl font-semibold text-slate-900 tracking-tight truncate">
                      {talent.full_name}
                    </SheetTitle>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none shrink-0 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                      Vetted
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-3">{talent.primary_role}</p>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{talent.location}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span>{talent.availability}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <TalentSections talent={talent} />
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">Profile unavailable.</div>
        )}
      </SheetContent>
    </Sheet>
  );
};
