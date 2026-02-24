import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Calendar, MapPin, Building2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkHistoryViewerProps {
  talent: any;
}

const WorkHistoryViewer = ({ talent }: WorkHistoryViewerProps) => {
  const experiences = talent.work_history || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-400" />
                Work Experience
            </div>
            <span className="text-[10px] font-bold text-gray-400">{experiences.length} Entries</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {experiences.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {experiences.map((exp: any, idx: number) => (
                <div key={idx} className="p-6 transition-colors hover:bg-gray-50/50">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 leading-tight">{exp.role_title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-bold text-gray-600">{exp.company_name}</span>
                                {exp.is_current && (
                                    <Badge className="h-4 px-1.5 text-[8px] font-bold uppercase bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none">Current</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Calendar className="h-3 w-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">
                                {exp.start_date || "?"} — {exp.is_current ? "Present" : exp.end_date || "?"}
                            </span>
                        </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium pl-14">
                    {exp.role_description || <span className="text-gray-300 italic">No description provided</span>}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400 font-medium italic">No work history records found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Internal Badge to avoid import issues
const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
        {children}
    </div>
);

export default WorkHistoryViewer;
