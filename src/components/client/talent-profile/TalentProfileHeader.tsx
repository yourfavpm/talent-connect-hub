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
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-sm" 
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-2xl border border-slate-100 uppercase">
              {talent.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          )}
          
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{talent.full_name}</h1>
              <Badge variant="outline" className="text-[10px] font-bold text-blue-600 border-blue-100 bg-blue-50/50 uppercase tracking-widest">{talent.talent_id}</Badge>
            </div>
            <div className="text-lg text-gray-500 font-medium mb-4">{talent.primary_role}</div>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-slate-900 text-white border-transparent hover:bg-slate-800 px-3 py-1 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> OPSlyHR Vetted
              </Badge>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 capitalize px-3 py-1 text-xs font-semibold">
                {talent.skill_level} Level
              </Badge>
            </div>
            
            {/* Sub-row */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 font-medium">
                <MapPin className="w-4 h-4 text-gray-400" /> 
                {talent.location}
              </div>
              <div className="flex items-center gap-2 text-gray-600 font-medium">
                <Clock className="w-4 h-4 text-gray-400" /> 
                {talent.timezone}
              </div>
              <div className="flex items-center gap-2 text-gray-600 font-medium">
                <Briefcase className="w-4 h-4 text-gray-400" /> 
                {talent.years_experience}y+ Experience
              </div>
              <div className="flex items-center gap-2 text-gray-600 font-medium">
                <Calendar className="w-4 h-4 text-gray-400" /> 
                {talent.availability}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions (Hidden on large screens because Action Panel takes over) */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-6 md:mt-0 lg:hidden">
          <Button variant="outline" className="w-full sm:w-auto font-semibold border-gray-200" onClick={onMessage}>Message Talent</Button>
          <Button className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-lg shadow-blue-500/20" onClick={onInvite}>Invite to Interview</Button>
        </div>
      </div>
    </div>
  );
}
