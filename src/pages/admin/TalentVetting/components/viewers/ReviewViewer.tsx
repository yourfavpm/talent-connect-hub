import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, ShieldCheck, Clock, FileText, Send } from "lucide-react";
import { TalentProfileStep } from "@/types/talent";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ReviewViewerProps {
  talent: any;
  steps: TalentProfileStep[];
}

const ReviewViewer = ({ talent, steps }: ReviewViewerProps) => {
  const approvedCount = steps.filter(s => s.status === "approved").length;
  const totalSteps = steps.length;
  const progress = (approvedCount / totalSteps) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "changes_requested":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "submitted":
      case "in_review":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-gray-200" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-6">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-900 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-gray-900" />
                Vetting Summary Checklist
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-gray-400 lowercase italic">
                    {totalSteps - approvedCount} steps remaining
                </span>
                <div className="h-4 w-px bg-gray-200" />
                <span className="text-xl font-black text-gray-900">{Math.round(progress)}%</span>
            </div>
          </CardTitle>
          <Progress value={progress} className="h-1.5 mt-6 bg-gray-100" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {steps.map((step, idx) => (
              <div key={idx} className="p-6 flex items-center justify-between group hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 flex items-center justify-center shrink-0">
                        {getStatusIcon(step.status)}
                   </div>
                   <div>
                        <h4 className="text-sm font-bold text-gray-900 leading-tight capitalize">
                            {step.step_key.replace("_", " ")}
                        </h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1 block">
                            Status: {step.status.replace("_", " ")}
                        </span>
                   </div>
                </div>
                
                <Button variant="ghost" className="h-8 text-[10px] font-bold text-gray-400 hover:text-gray-900 px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    Jump to Step
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-100 bg-emerald-50/20 shadow-none">
        <CardContent className="p-6 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                <Send className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1">Overall Decision</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Once all steps are approved, the overall vetting status will update to "Fully Vetted". 
                    This will grant the talent access to applied jobs and public visibility.
                </p>
            </div>
            <Button 
                disabled={progress < 100}
                className="h-12 px-8 font-black uppercase text-[11px] tracking-widest bg-gray-900 hover:bg-gray-800 shadow-xl shadow-gray-200/50"
            >
                Final Approval
            </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewViewer;
