import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, MapPin, Globe, Clock, Languages } from "lucide-react";

interface BasicInfoViewerProps {
  talent: any;
}

const BasicInfoViewer = ({ talent }: BasicInfoViewerProps) => {
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
            <User className="h-4 w-4 text-gray-400" />
            Identity Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-2 gap-8">
          <Field label="First Name" value={talent.first_name} icon={User} />
          <Field label="Last Name" value={talent.last_name} icon={User} />
          <Field label="Email Address" value={talent.email} icon={Mail} />
          <Field label="Phone Number" value={talent.phone} icon={Phone} />
        </CardContent>
      </Card>

      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-400" />
            Location & Timezone
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-2 gap-8">
          <Field label="Country" value={talent.country} icon={Globe} />
          <Field label="Timezone" value={talent.timezone} icon={MapPin} />
          <Field label="Preferred Working Hours" value={talent.preferred_working_hours} icon={Clock} />
          <div className="col-span-2 flex flex-col gap-1.5 pt-2 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <Languages className="h-3 w-3 text-gray-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Languages Spoken</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {talent.languages_spoken?.length > 0 ? (
                talent.languages_spoken.map((lang: string, idx: number) => (
                  <span key={idx} className="text-sm font-semibold text-gray-900">{lang}</span>
                ))
              ) : (
                <span className="text-sm text-gray-300 italic">No languages listed</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicInfoViewer;
