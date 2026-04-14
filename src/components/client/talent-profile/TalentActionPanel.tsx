import { ShieldCheck, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientTalentProfileData } from "@/types/talent";

interface TalentActionPanelProps {
  talent: ClientTalentProfileData;
  onInvite?: () => void;
  onMessage?: () => void;
}

export function TalentActionPanel({ talent, onInvite, onMessage }: TalentActionPanelProps) {
  return (
    <div className="sticky top-12">
      <div className="space-y-12">
        <div className="space-y-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Details</h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-y-8 gap-x-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Expertise</div>
              <div className="text-lg font-bold text-slate-900 capitalize">{talent.skill_level} Level</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Availability</div>
              <div className="text-lg font-bold text-slate-900">{talent.availability}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Focus Area</div>
              <div className="text-lg font-bold text-slate-900">{talent.primary_role}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Timezone</div>
              <div className="text-lg font-bold text-slate-900">{talent.timezone}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-8 border-t border-slate-100">
          <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 h-16 rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/20 group" onClick={onInvite}>
            <Calendar className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            Invite to Interview
          </Button>
          <Button variant="ghost" className="w-full h-16 rounded-2xl font-bold uppercase tracking-widest text-[11px] text-slate-600 hover:bg-slate-50 border border-slate-100" onClick={onMessage}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Direct Message
          </Button>
        </div>

        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100/50">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">Guaranteed Quality</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            This professional has passed our multi-stage vetting process including skill assessment and soft skill evaluation.
          </p>
        </div>
      </div>
    </div>
  );
}
