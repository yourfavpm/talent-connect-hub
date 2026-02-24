import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Code, Wrench, Languages, Clock } from "lucide-react";

interface ProfessionalDetailsViewerProps {
  talent: any;
}

const ProfessionalDetailsViewer = ({ talent }: ProfessionalDetailsViewerProps) => {
  const Field = ({ label, value, icon: Icon }: { label: string, value: string | null, icon: any }) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3 w-3 text-gray-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-900 leading-tight">
        {value || <span className="text-gray-300 italic">Not provided</span>}
      </span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gray-400" />
            Core Expertise
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-2 gap-8">
          <Field label="Primary Role" value={talent.primary_role} icon={Briefcase} />
          <Field label="Years of Experience" value={talent.years_of_experience?.toString()} icon={Clock} />
          <Field label="Availability" value={talent.availability} icon={Clock} />
        </CardContent>
      </Card>

      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2">
            <Code className="h-4 w-4 text-gray-400" />
            Skills & Stack
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Code className="h-3 w-3 text-gray-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Secondary Skills</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {talent.secondary_skills?.length > 0 ? (
                talent.secondary_skills.map((skill: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="bg-gray-50 text-gray-700 border-gray-100 font-bold text-[10px] px-2 py-0.5 shadow-none uppercase">
                    {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-300 italic">None listed</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-3 w-3 text-gray-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tools Familiar With</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {talent.tools_familiar_with?.length > 0 ? (
                talent.tools_familiar_with.map((tool: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-gray-600 border-gray-200 font-bold text-[10px] px-2 py-0.5 shadow-none uppercase">
                    {tool}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-300 italic">None listed</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2">
            <Languages className="h-4 w-4 text-gray-400" />
            Communication
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Languages className="h-3 w-3 text-gray-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Languages Spoken</span>
            </div>
            <div className="flex flex-wrap gap-4">
              {talent.languages_spoken?.length > 0 ? (
                talent.languages_spoken.map((lang: string, idx: number) => (
                  <span key={idx} className="text-sm font-bold text-gray-900">{lang}</span>
                ))
              ) : (
                <span className="text-sm text-gray-300 italic">None listed</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalDetailsViewer;
