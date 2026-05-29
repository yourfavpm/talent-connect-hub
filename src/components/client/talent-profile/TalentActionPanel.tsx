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
  const stats = [
    { icon: Star, label: "Expertise", value: talent.skill_level, pill: true },
    { icon: Clock, label: "Availability", value: talent.availability },
    { icon: Globe, label: "Timezone", value: talent.timezone },
  ];

  return (
    <div className="sticky top-6 space-y-4">
      {/* Professional snapshot */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <Zap className="w-3 h-3 text-blue-500" /> Professional Snapshot
        </p>

        <div className="space-y-3">
          {stats.map(({ icon: Icon, label, value, pill }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-2 text-slate-500">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium">{label}</span>
              </div>
              {pill ? (
                <Badge className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-semibold capitalize px-2.5 py-0.5">
                  {value}
                </Badge>
              ) : (
                <span className="text-xs font-semibold text-slate-800 capitalize">{value}</span>
              )}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
          <Button
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl shadow-sm gap-2"
            onClick={onInvite}
          >
            <Calendar className="w-3.5 h-3.5" /> Invite to Interview
          </Button>
          <Button
            variant="outline"
            className="w-full h-10 rounded-xl border-slate-200 text-slate-600 text-xs font-medium gap-2 hover:bg-slate-50"
            onClick={onMessage}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Send Message
          </Button>
        </div>
      </div>

      {/* Trust card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-5">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Trusted Professional</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Vetted for technical excellence and soft skills by our OPSly experts.
        </p>
      </div>
    </div>
  );
}
