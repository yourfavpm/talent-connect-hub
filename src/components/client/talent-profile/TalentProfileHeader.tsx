import { MapPin, Clock, Briefcase, Calendar, ShieldCheck, MessageSquare } from "lucide-react";
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
  const initials = talent.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const levelColor =
    talent.skill_level === "senior" || talent.skill_level === "expert"
      ? "bg-violet-50 text-violet-700 border-violet-100"
      : talent.skill_level === "mid"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Subtle gradient banner */}
      <div className="h-24 w-full bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{backgroundImage: "radial-gradient(circle at 70% 50%, #3b82f620 0%, transparent 60%)"}} />
      </div>

      <div className="px-6 sm:px-8 pb-7 -mt-10 relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-6">
          {/* Avatar */}
          <div className="shrink-0 relative">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-md rounded-2xl">
              <AvatarImage src={talent.avatar || ""} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 text-2xl font-bold rounded-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 sm:pb-1">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">{talent.full_name}</h1>
                  <Badge variant="outline" className="text-[9px] font-semibold text-slate-400 border-slate-200 bg-slate-50 px-2 py-0.5 uppercase tracking-widest">
                    {talent.talent_id}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 font-medium">{talent.primary_role}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className={`text-[10px] font-semibold px-2.5 py-0.5 border rounded-lg capitalize ${levelColor}`}>
                    {talent.skill_level} Level
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="w-3 h-3" /> {talent.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Briefcase className="w-3 h-3" /> {talent.years_experience}y+ exp
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3 h-3" /> {talent.timezone}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" /> {talent.availability}
                  </div>
                </div>
              </div>

              {/* Desktop CTAs */}
              <div className="hidden sm:flex items-center gap-2.5 shrink-0">
                <button
                  onClick={onMessage}
                  className="flex items-center gap-1.5 px-4 h-9 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </button>
                <Button
                  onClick={onInvite}
                  className="h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl shadow-sm"
                >
                  Schedule Interview
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile CTAs */}
        <div className="flex gap-2.5 mt-5 sm:hidden">
          <Button className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl" onClick={onInvite}>
            Schedule Interview
          </Button>
          <Button variant="outline" className="flex-1 h-10 rounded-xl border-slate-200 text-slate-600 text-xs font-medium gap-1.5" onClick={onMessage}>
            <MessageSquare className="w-3.5 h-3.5" /> Message
          </Button>
        </div>
      </div>
    </div>
  );
}
