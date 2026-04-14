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
    <div className="pb-16 border-b border-gray-100 mb-12">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Left: Avatar */}
        <div className="shrink-0">
          {talent.avatar ? (
            <img 
              src={talent.avatar} 
              alt={talent.full_name} 
              className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700 shadow-2xl shadow-blue-500/10" 
            />
          ) : (
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-gray-300 font-bold text-4xl border border-gray-100 uppercase tracking-tighter">
              {talent.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          )}
        </div>
        
        {/* Right: Info */}
        <div className="flex-1 min-w-0 pt-2 text-center lg:text-left w-full lg:w-auto">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6 mb-4">
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[0.9]">
              {talent.full_name}
            </h1>
            <Badge variant="outline" className="self-center lg:self-end mb-2 px-3 py-1 text-[10px] font-black text-slate-400 border-slate-200 uppercase tracking-[0.2em] h-fit">
              ID: {talent.talent_id}
            </Badge>
          </div>
          
          <div className="text-xl md:text-2xl text-blue-600 font-medium mb-8 max-w-2xl leading-relaxed">
            {talent.primary_role} — {talent.skill_level.charAt(0).toUpperCase() + talent.skill_level.slice(1)} Professional
          </div>
          
          <div className="flex flex-wrap justify-center lg:justify-start gap-y-4 gap-6 text-[13px] font-medium text-slate-500 tracking-wide uppercase">
            <div className="flex items-center gap-2 group">
              <MapPin className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" /> 
              {talent.location}
            </div>
            <div className="flex items-center gap-2 group">
              <Clock className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" /> 
              {talent.timezone}
            </div>
            <div className="flex items-center gap-2 group">
              <Briefcase className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" /> 
              {talent.years_experience}y+ Exp.
            </div>
            <div className="flex items-center gap-2 group">
              <Calendar className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" /> 
              {talent.availability}
            </div>
          </div>
        </div>

        {/* Floating Vetted Badge (Desktop Only) */}
        <div className="hidden lg:flex flex-col items-center gap-3 pt-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner">
            <ShieldCheck className="w-8 h-8 focus:animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/60">OPSly Vetted</span>
        </div>

        {/* Mobile Actions Overlay */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-10 lg:hidden">
          <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 h-14 rounded-2xl font-bold uppercase tracking-widest text-xs" onClick={onInvite}>Invite to Interview</Button>
          <Button variant="outline" className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-xs border-slate-200" onClick={onMessage}>Message</Button>
        </div>
      </div>
    </div>
  );
}
