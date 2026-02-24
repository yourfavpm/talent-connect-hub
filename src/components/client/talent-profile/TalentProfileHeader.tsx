import { MapPin, Clock, Briefcase, Calendar, ShieldCheck, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientTalentProfileData } from "@/types/talent";

interface TalentProfileHeaderProps {
  talent: ClientTalentProfileData;
  onInvite?: () => void;
  onMessage?: () => void;
}

export function TalentProfileHeader({ talent, onInvite, onMessage }: TalentProfileHeaderProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        {/* Left: Avatar & Info */}
        <div className="flex gap-4 items-center">
          {talent.avatar ? (
            <img 
              src={talent.avatar} 
              alt={talent.full_name} 
              className="w-16 h-16 rounded-full object-cover border border-gray-100" 
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium text-xl border border-gray-200">
              {talent.full_name.charAt(0)}
            </div>
          )}
          
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-gray-900">{talent.full_name}</h1>
              <Badge variant="outline" className="text-gray-500 border-gray-200">{talent.talent_id}</Badge>
            </div>
            <div className="text-gray-600 font-medium mb-3">{talent.primary_role}</div>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                <ShieldCheck className="w-3 h-3 mr-1" /> Vetted Talent
              </Badge>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 capitalize">
                {talent.skill_level}
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                <CheckCircle className="w-3 h-3 mr-1" /> Identity Verified
              </Badge>
            </div>
            
            {/* Sub-row */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> {talent.location}</div>
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /> {talent.timezone}</div>
              <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-gray-400" /> {talent.years_experience} YOE</div>
              <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" /> {talent.availability}</div>
            </div>
          </div>
        </div>

        {/* Right: Actions (Hidden on large screens because Action Panel takes over) */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0 lg:hidden">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onMessage}>Message Talent</Button>
          <Button className="w-full sm:w-auto bg-black text-white hover:bg-gray-800" onClick={onInvite}>Invite to Interview</Button>
        </div>
      </div>
    </div>
  );
}
