import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  History,
  ShieldAlert,
  Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TalentProfileStep, StepChangeRequest, StepStatus } from "@/types/talent";
import BasicInfoViewer from "./viewers/BasicInfoViewer";
import ProfessionalDetailsViewer from "./viewers/ProfessionalDetailsViewer";
import WorkHistoryViewer from "./viewers/WorkHistoryViewer";
import DocumentsViewer from "./viewers/DocumentsViewer";
import EducationViewer from "./viewers/EducationViewer";
import CertificationsViewer from "./viewers/CertificationsViewer";
import ReferencesViewer from "./viewers/ReferencesViewer";
import ReviewViewer from "./viewers/ReviewViewer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StepViewerProps {
  talent: any;
  stepKey: string;
  step?: TalentProfileStep;
  changeRequests: StepChangeRequest[];
  steps: TalentProfileStep[];
  onRefresh: () => void;
  onRequestChanges: () => void;
}

const StepViewer = ({ talent, stepKey, step, changeRequests, steps, onRefresh, onRequestChanges }: StepViewerProps) => {
  const status = step?.status || "not_started";

  const getStatusDisplay = (status: StepStatus) => {
    const styles: Record<string, { bg: string, text: string, icon: any }> = {
      approved: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2 },
      changes_requested: { bg: "bg-orange-50", text: "text-orange-700", icon: ShieldAlert },
      submitted: { bg: "bg-blue-50", text: "text-blue-700", icon: MessageSquare },
      in_review: { bg: "bg-purple-50", text: "text-purple-700", icon: History },
      incomplete: { bg: "bg-gray-50", text: "text-gray-500", icon: AlertCircle },
      not_started: { bg: "bg-gray-50", text: "text-gray-400", icon: AlertCircle },
    };
    const config = styles[status] || styles.not_started;
    const Icon = config.icon;

    return (
      <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/5", config.bg, config.text)}>
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-bold uppercase tracking-wider">{status.replace("_", " ")}</span>
      </div>
    );
  };

  const renderContent = () => {
    switch (stepKey) {
      case "basic_info":
        return <BasicInfoViewer talent={talent} />;
      case "professional_details":
        return <ProfessionalDetailsViewer talent={talent} />;
      case "work_history":
        return <WorkHistoryViewer talent={talent} />;
      case "documents":
        return <DocumentsViewer talent={talent} />;
      case "education":
        return <EducationViewer talent={talent} />;
      case "certifications":
        return <CertificationsViewer talent={talent} />;
      case "references":
        return <ReferencesViewer talent={talent} />;
      case "review":
        return <ReviewViewer talent={talent} steps={steps} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
            <span className="text-sm text-gray-400 font-medium">Viewer for {stepKey} is under construction.</span>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight capitalize">
            {stepKey.replace("_", " ")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Review the talent's information for this section.</p>
        </div>
        <div className="flex items-center gap-4">
            {getStatusDisplay(status)}
            <div className="flex items-center gap-3">
            <Button 
                variant="outline" 
                className="h-9 px-4 font-black uppercase text-[10px] tracking-widest border-gray-200 group"
                onClick={onRequestChanges}
            >
              <ShieldAlert className="h-3.5 w-3.5 mr-2 text-orange-400 transition-transform group-hover:scale-110" />
              Request Changes
            </Button>
            <Button 
                className="h-9 px-4 font-black uppercase text-[10px] tracking-widest bg-gray-900 shadow-lg shadow-gray-200"
                onClick={async () => {
                    // Quick approve step
                    const { error } = await supabase
                        .from("talent_profile_steps")
                        .update({ 
                            status: "approved",
                            last_reviewed_at: new Date().toISOString(),
                            reviewed_by: (await supabase.auth.getUser()).data.user?.id
                        })
                        .eq("talent_id", talent.id)
                        .eq("step_key", stepKey);
                    
                    if (error) toast.error("Failed to approve step: " + error.message);
                    else {
                        toast.success("Step approved");
                        onRefresh();
                    }
                }}
            >
              Approve Step
            </Button>
          </div>
        </div>
      </div>

      {changeRequests.length > 0 && (
        <div className="mb-8 p-4 rounded-xl bg-orange-50 border border-orange-100 flex flex-start gap-4 shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-white border border-orange-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-4 w-4 text-orange-600" />
            </div>
            <div>
                <h4 className="text-[11px] font-bold text-orange-800 uppercase tracking-wider mb-1">Active Change Request</h4>
                {changeRequests.map((cr, idx) => (
                    <p key={idx} className="text-sm text-orange-800/80 leading-relaxed font-medium">
                        "{cr.message}"
                    </p>
                ))}
            </div>
        </div>
      )}

      <div className="space-y-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default StepViewer;
