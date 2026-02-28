import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Clock,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TalentProfileStep, StepStatus } from "@/types/talent";

interface StepNavigatorProps {
  steps: TalentProfileStep[];
  activeStep: string;
  onStepSelect: (key: string) => void;
}

const StepNavigator = ({ steps, activeStep, onStepSelect }: StepNavigatorProps) => {
  const stepConfig = [
    { key: "basic_info", label: "Basic Information" },
    { key: "professional_details", label: "Professional Details" },
    { key: "work_history", label: "Work History" },
    { key: "documents", label: "Documents" },
    { key: "education", label: "Education" },
    { key: "certifications", label: "Certifications" },
    { key: "references", label: "References" },
    { key: "review", label: "Review & Submit" },
  ];

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "changes_requested":
        return <AlertCircle className="h-3.5 w-3.5 text-orange-500" />;
      case "submitted":
      case "in_review":
        return <Clock className="h-3.5 w-3.5 text-blue-500" />;
      default:
        return <Circle className="h-3.5 w-3.5 text-gray-300" />;
    }
  };

  const getStatusBadge = (status: StepStatus) => {
    const styles: Record<string, string> = {
      approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
      changes_requested: "bg-orange-50 text-orange-600 border-orange-100",
      submitted: "bg-blue-50 text-blue-600 border-blue-100",
      in_review: "bg-purple-50 text-purple-600 border-purple-100",
      incomplete: "bg-gray-50 text-gray-500 border-gray-100",
      not_started: "bg-gray-50 text-gray-400 border-gray-100",
    };
    return (
      <Badge variant="outline" className={cn("shadow-none h-4 px-1.5 text-[8px] font-semibold uppercase tracking-tighter", styles[status] || styles.not_started)}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const approvedCount = steps.filter(s => s.status === "approved").length;
  const progress = (approvedCount / stepConfig.length) * 100;

  return (
    <aside className="w-64 border-r border-gray-100 flex flex-col shrink-0 bg-white">
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Profile Steps</h2>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">
            <span className="text-emerald-600">{approvedCount}</span>
            <span className="text-gray-300">/</span>
            <span>{stepConfig.length}</span>
          </div>
        </div>
        <Progress value={progress} className="h-1 bg-gray-50" />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {stepConfig.map((config) => {
          const step = steps.find(s => s.step_key === config.key);
          const status = step?.status || "not_started";
          const isActive = activeStep === config.key;

          return (
            <button
              key={config.key}
              onClick={() => onStepSelect(config.key)}
              className={cn(
                "w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-left group gap-3",
                isActive ? "bg-gray-900 shadow-sm" : "hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-white" : ""
                )}>
                    {getStepIcon(status)}
                </div>
                <span className={cn(
                  "text-[12px] font-semibold truncate transition-colors",
                  isActive ? "text-white" : "text-gray-700"
                )}>
                  {config.label}
                </span>
              </div>
              <div className="shrink-0">
                {isActive ? (
                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                ) : (
                    getStatusBadge(status)
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-gray-50 mt-auto bg-gray-50/20">
        <div className="flex items-center justify-between gap-1">
            <button className="flex-1 py-1.5 px-2 rounded bg-white border border-gray-200 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5 shadow-sm">
                <Filter className="h-3 w-3" />
                Filter Needs Review
            </button>
        </div>
      </div>
    </aside>
  );
};

export default StepNavigator;
