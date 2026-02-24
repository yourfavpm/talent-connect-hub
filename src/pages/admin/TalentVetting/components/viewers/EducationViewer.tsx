import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Calendar, BookOpen, Award } from "lucide-react";

interface EducationViewerProps {
  talent: any;
}

const EducationViewer = ({ talent }: EducationViewerProps) => {
  const education = talent.education || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                Educational Background
            </div>
            <span className="text-[10px] font-bold text-gray-400">{education.length} Entries</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {education.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {education.map((edu: any, idx: number) => (
                <div key={idx} className="p-6 transition-colors hover:bg-gray-50/50">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 leading-tight">{edu.institution_name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-bold text-gray-600">{edu.field_of_study}</span>
                                <span className="text-gray-200 text-xs">•</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{edu.education_level}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-50 rounded border border-gray-100 shrink-0">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-600">
                            {edu.start_year || "?"} — {edu.is_current ? "Present" : edu.end_year || "?"}
                        </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400 font-medium italic">No education records found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EducationViewer;
