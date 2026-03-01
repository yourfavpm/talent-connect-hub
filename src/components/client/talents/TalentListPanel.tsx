import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, MapPin, Briefcase } from "lucide-react";

interface TalentListPanelProps {
  talents: any[];
  selectedTalentId: string | null;
  onSelectTalent: (talent: any) => void;
}

const ROLE_LABELS: Record<string, string> = {
  virtual_assistant: "Virtual Assistant",
  customer_support: "Customer Support",
  social_media_manager: "Social Media Manager",
  product_manager: "Product Manager",
  operations_manager: "Operations Manager",
  project_manager: "Project Manager",
  executive_assistant: "Executive Assistant",
};

export const TalentListPanel = ({ talents, selectedTalentId, onSelectTalent }: TalentListPanelProps) => {
  const getInitials = (name: string) => {
    if (!name) return "T";
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  if (talents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
        <div className="bg-gray-50 p-4 rounded-full mb-4">
          <Briefcase className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">No professionals found</h3>
        <p className="text-gray-500 mt-2 max-w-xs mx-auto">Try adjusting your filters or search terms to see more results.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {talents.map((talent) => {
        return (
          <Card
            key={talent.talent_id}
            onClick={() => onSelectTalent(talent)}
            className="group p-6 rounded-xl cursor-pointer transition-all border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 flex flex-col bg-white overflow-hidden relative"
          >
            {/* Vetting Badge */}
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50 font-semibold px-2.5 py-0.5 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Vetted
              </Badge>
            </div>

            <div className="flex gap-4 items-start mb-5">
              <Avatar className="h-16 w-16 border-2 border-white shadow-sm shrink-0 rounded-xl">
                <AvatarImage src={talent.avatar_url} className="object-cover" />
                <AvatarFallback className="text-xl bg-slate-50 text-slate-400 font-semibold rounded-xl">
                  {getInitials(talent.anonymized_name || talent.first_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pr-12">
                <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {talent.anonymized_name || `${talent.first_name} ${talent.last_name}`}
                </h3>
                <p className="text-sm text-gray-500 font-medium truncate mt-0.5">
                  {ROLE_LABELS[talent.headline] || talent.headline || "Professional"}
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                   <Badge variant="outline" className="text-[10px] py-0 px-2 font-semibold bg-gray-50/50 border-gray-200 text-gray-600">
                    {talent.availability === 'full_time' ? "Full-Time" : (talent.availability === 'part_time' ? "Part-Time" : talent.availability)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Tags / Skills Preview */}
            <div className="flex flex-wrap gap-1.5 mb-6 min-h-[56px] items-start content-start">
              {(talent.skills || []).slice(0, 4).map((skill: string) => (
                <span 
                  key={skill} 
                  className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-medium rounded-md border border-slate-100 uppercase tracking-tight"
                >
                  {skill}
                </span>
              ))}
              {(talent.skills?.length > 4) && (
                <span className="text-[11px] font-bold text-slate-400 py-1 ml-1 self-center">
                  +{talent.skills.length - 4}
                </span>
              )}
            </div>
            
            <div className="mt-auto flex items-center justify-between text-xs border-t border-gray-50 pt-5">
              <div className="flex items-center gap-4">
                {talent.years_experience !== undefined && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Briefcase className="h-3.5 w-3.5 text-gray-400" /> 
                    <span className="font-semibold">{talent.years_experience}y+ Exp</span>
                  </div>
                )}
                {talent.location && (
                  <div className="flex items-center gap-1.5 text-gray-600 truncate max-w-[120px]">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" /> 
                    <span className="truncate font-semibold">{talent.location}</span>
                  </div>
                )}
              </div>
              <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform">
                View Profile →
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
