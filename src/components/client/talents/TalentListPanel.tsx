import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  if (talents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-sm font-medium">No talents match your filters.</p>
        <p className="text-xs mt-1">Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {talents.map((talent) => {
        return (
          <div
            key={talent.id}
            onClick={() => onSelectTalent(talent)}
            className="p-5 rounded-xl cursor-pointer transition-all border bg-white border-gray-200 hover:border-gray-300 hover:shadow-md flex flex-col"
          >
            <div className="flex gap-4 items-start mb-4">
              <Avatar className="h-12 w-12 border border-gray-100 shrink-0">
                <AvatarImage src={talent.avatar_url} />
                <AvatarFallback className="text-sm bg-gray-50 text-gray-600 font-medium">
                  {getInitials(talent.first_name, talent.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-semibold truncate pr-2 text-gray-900">
                    {talent.first_name} {talent.last_name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 truncate mt-0.5 font-medium">
                  {ROLE_LABELS[talent.primary_role] || talent.primary_role}
                </p>
                
                <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-green-700 bg-green-50 inline-block px-2 py-0.5 rounded border border-green-200">
                  {talent.availability === 'full_time' ? "Full-Time" : "Part-Time"}
                </div>
              </div>
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
              {talent.years_of_experience && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-gray-400" /> 
                  <span className="font-medium text-gray-700">{talent.years_of_experience}y Exp</span>
                </div>
              )}
              {talent.country && (
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" /> 
                  <span className="truncate font-medium text-gray-700">{talent.country}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 col-span-2 mt-1">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-blue-700 font-medium">Taskive Verified</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
