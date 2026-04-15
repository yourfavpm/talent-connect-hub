import { MapPin, Clock, Briefcase, Calendar, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientTalentProfileData } from "@/types/talent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TalentProfileHeaderProps {
  talent: ClientTalentProfileData;
  onInvite?: () => void;
  onMessage?: () => void;
}

export function TalentProfileHeader({ talent, onInvite, onMessage }: TalentProfileHeaderProps) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-8 transition-all duration-500 hover:shadow-md">
      {/* Decorative Banner */}
      <div className="h-32 w-full bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-50" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      </div>

      <div className="px-8 pb-10 -mt-16 relative">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Avatar Section */}
          <div className="shrink-0 relative">
            <Avatar className="h-40 w-40 md:h-48 md:w-48 border-8 border-white shadow-2xl rounded-[3rem]">
              <AvatarImage src={talent.avatar || ""} className="object-cover" />
              <AvatarFallback className="bg-slate-50 text-4xl font-black text-slate-300 rounded-[3rem]">
                {talent.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-50">
               <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                  <ShieldCheck className="h-6 w-6" />
               </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 min-w-0 lg:pt-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                    {talent.full_name}
                  </h1>
                  <Badge variant="outline" className="hidden md:flex px-3 py-1 text-[10px] font-black text-slate-400 border-slate-200 uppercase tracking-widest bg-slate-50">
                    ID: {talent.talent_id}
                  </Badge>
                </div>
                
                <p className="text-xl md:text-2xl text-blue-600 font-bold tracking-tight">
                  {talent.primary_role} <span className="text-slate-300 mx-2">—</span> <span className="text-slate-500">{talent.skill_level.charAt(0).toUpperCase() + talent.skill_level.slice(1)} Level</span>
                </p>
              </div>

              {/* Desktop Actions (Integrated) */}
              <div className="hidden lg:flex items-center gap-3">
                <button 
                  onClick={onMessage}
                  className="px-6 h-14 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Message
                </button>
                <Button 
                  onClick={onInvite}
                  className="px-8 h-14 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-slate-900/10"
                >
                  Schedule Interview
                </Button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-y-4 gap-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-8">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-slate-300" /> 
                <span className="text-slate-600">{talent.location}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-300" /> 
                <span className="text-slate-600">{talent.timezone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-slate-300" /> 
                <span className="text-slate-600 font-black">{talent.years_experience}y+ Exp.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-300" /> 
                <span className="text-slate-600 capitalize">{talent.availability}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Actions Overlay */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-10 lg:hidden">
          <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 h-14 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg" onClick={onInvite}>Interview</Button>
          <Button variant="outline" className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-xs border-slate-200" onClick={onMessage}>Message</Button>
        </div>
      </div>
    </div>
  );
}
