import { ShieldCheck, MessageSquare, Calendar, Star, Zap, Globe, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientTalentProfileData } from "@/types/talent";
import { Badge } from "@/components/ui/badge";

interface TalentActionPanelProps {
  talent: ClientTalentProfileData;
  onInvite?: () => void;
  onMessage?: () => void;
}

export function TalentActionPanel({ talent, onInvite, onMessage }: TalentActionPanelProps) {
  return (
    <div className="sticky top-12 space-y-6">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8">
        <div className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Zap className="h-3 w-3 text-blue-600" /> Professional Insight
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                   <div className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                      <Star className="h-4 w-4" />
                   </div>
                   <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Expertise</span>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-black text-[10px] px-2.5 py-0.5 border-none rounded-lg capitalize">
                  {talent.skill_level}
                </Badge>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                   <div className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                      <Clock className="h-4 w-4" />
                   </div>
                   <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Availability</span>
                </div>
                <span className="text-xs font-black text-slate-900">{talent.availability}</span>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                   <div className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                      <Globe className="h-4 w-4" />
                   </div>
                   <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Timezone</span>
                </div>
                <span className="text-xs font-black text-slate-900">{talent.timezone}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-8 border-t border-slate-50">
            <Button 
              className="w-full h-14 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20 group transition-all hover:-translate-y-1" 
              onClick={onInvite}
            >
              <Calendar className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Invite to Interview
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all active:scale-95" 
              onClick={onMessage}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
               <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Trusted Professional</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-bold">
            Vetted for technical excellence and soft skills by our OPSly experts.
          </p>
        </div>
      </div>
    </div>
  );
}
