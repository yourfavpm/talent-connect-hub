import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShieldCheck, 
  AlertTriangle, 
  UserCog, 
  CheckCircle2, 
  XCircle,
  Clock,
  ChevronRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TalentVettingStatus, TalentProfileStep } from "@/types/talent";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VettingActionsProps {
  talent: any;
  steps: TalentProfileStep[];
  talentManager: { full_name: string, email: string } | null;
  onRefresh: () => void;
  onAssignManager: () => void;
  onSkillAssessment: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRequestChanges: () => void;
}

const VettingActions = ({ talent, steps, talentManager, onRefresh, onAssignManager, onSkillAssessment, onApprove, onReject, onRequestChanges }: VettingActionsProps) => {
  const [internalNotes, setInternalNotes] = useState(talent.skill_assessment_notes || "");
  const [saving, setSaving] = useState(false);

  const saveNotes = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("talents")
        .update({ skill_assessment_notes: internalNotes } as any)
        .eq("id", talent.id);
      if (error) throw error;
      toast.success("Internal notes updated");
      onRefresh();
    } catch (error: any) {
      toast.error("Failed to save notes: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const complianceItems = [
    { label: "ID Verification", met: steps.find(s => s.step_key === "basic_info")?.status === "approved" },
    { label: "Required Documents", met: steps.find(s => s.step_key === "documents")?.status === "approved" },
    { label: "Work History", met: steps.find(s => s.step_key === "work_history")?.status === "approved" },
    { label: "Skill Assessment", met: talent.overall_skill_level !== null },
  ];

  const allMet = complianceItems.every(item => item.met);

  return (
    <aside className="w-80 border-l border-gray-100 flex flex-col shrink-0 bg-white sticky top-0 h-full overflow-y-auto pb-10">
      <div className="p-5 border-b border-gray-50 flex flex-col gap-4">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Workspace Status</h2>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 mb-4">
            <div className="h-10 w-10 flex items-center justify-center bg-white rounded-lg border border-gray-100 shadow-sm">
                <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-medium text-gray-400 leading-none">Overall Status</span>
                <span className="text-sm font-semibold text-gray-900 leading-tight capitalize">{talent.vetting_status.replace("_", " ")}</span>
            </div>
          </div>
        </div>

        <footer className="p-6 border-t border-gray-100 bg-gray-50/30 space-y-3">
            <Button 
                className="w-full h-11 font-bold uppercase text-[11px] tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                onClick={onApprove}
            >
                Approve Talent
            </Button>
            <div className="grid grid-cols-2 gap-3">
                <Button 
                    variant="outline" 
                    className="h-11 font-bold uppercase text-[10px] tracking-widest border-gray-200"
                    onClick={onRequestChanges}
                >
                    Request Changes
                </Button>
                <Button 
                    variant="outline" 
                    className="h-11 font-bold uppercase text-[10px] tracking-widest border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-100"
                    onClick={onReject}
                >
                    Reject
                </Button>
            </div>
        </footer>
      </div>

      <div className="p-5 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Internal Review Notes</h3>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={saveNotes} 
                className="h-6 text-[10px] font-semibold text-blue-600 px-2"
                disabled={saving}
            >
                {saving ? "Saving..." : "Save"}
            </Button>
          </div>
          <Textarea 
            placeholder="Add internal notes about the candidate..."
            className="min-h-[120px] text-xs resize-none border-gray-100 focus-visible:ring-gray-200 bg-gray-50 font-medium leading-relaxed"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
          />
          <p className="mt-2 text-[9px] text-gray-400 italic flex items-center gap-1.5">
            <Info className="h-3 w-3" />
            These notes are internal and never shown to the talent.
          </p>
        </section>

        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Compliance Summary</h3>
          <div className="space-y-2">
            {complianceItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-50 bg-white">
                <span className="text-[11px] font-semibold text-gray-600">{item.label}</span>
                {item.met ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-gray-200" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Assigned Manager</h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronRight className="h-4 w-4 text-gray-300" />
            </Button>
          </div>
          <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center gap-3">
             <div className="h-9 w-9 rounded-full bg-white border border-gray-100 flex items-center justify-center">
                <UserCog className="h-4 w-4 text-gray-400" />
             </div>
             <div className="flex flex-col overflow-hidden">
                <span className="text-[11px] font-semibold text-gray-900 truncate">
                    {talentManager?.full_name || "Unassigned"}
                </span>
                <span className="text-[9px] text-gray-400 truncate">
                    {talentManager?.email || "Click to assign manager"}
                </span>
             </div>
          </div>
        </section>

        <section className="bg-blue-50/30 rounded-xl border border-blue-100 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-blue-700">Skill Level</h3>
                <Button variant="ghost" className="h-6 text-[10px] font-semibold text-blue-600 px-2 hover:bg-blue-100/50" onClick={onSkillAssessment}>Edit</Button>
            </div>
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-white shadow-sm flex items-center justify-center border border-blue-100">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                    <span className="text-sm font-bold text-blue-900 uppercase tracking-tight">
                        {talent.overall_skill_level || "Not Rated"}
                    </span>
                </div>
            </div>
        </section>
      </div>
    </aside>
  );
};

export default VettingActions;
