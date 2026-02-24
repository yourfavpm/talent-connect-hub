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
    <div className="sticky top-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">Talent Summary</h3>
        
        <div className="space-y-4 mb-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Skill Level</div>
            <div className="font-medium text-gray-900 capitalize">{talent.skill_level}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Primary Role</div>
            <div className="font-medium text-gray-900">{talent.primary_role}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Availability</div>
            <div className="font-medium text-gray-900">{talent.availability}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Timezone</div>
            <div className="font-medium text-gray-900">{talent.timezone}</div>
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2" onClick={onInvite}>
            <Calendar className="w-4 h-4" />
            Invite to Interview
          </Button>
          <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={onMessage}>
            <MessageSquare className="w-4 h-4" />
            Message
          </Button>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span>Talent verified by Taskive.</span>
        </div>
      </div>
    </div>
  );
}
