import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { 
  MapPin, Globe, Briefcase, Languages, GraduationCap, Award, 
  CheckCircle2, MessageSquare, CalendarDays, Shield, ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TalentProfilePreviewProps {
  talent: any;
  onInvite: (talent: any) => void;
}

const ROLE_LABELS: Record<string, string> = {
  virtual_assistant: "Virtual Assistant",
  customer_support: "Customer Support",
  social_media_manager: "Social Media Manager",
  product_manager: "Product Manager",
  operations_manager: "Operations Manager",
  project_manager: "Project Manager",
  executive_assistant: "Executive Assistant",
};

export const TalentProfilePreview = ({ talent, onInvite }: TalentProfilePreviewProps) => {
  const { toast } = useToast();
  
  if (!talent) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };
  
  // Mask last name for privacy
  const maskedLastName = talent.last_name ? `${talent.last_name.charAt(0)}.` : "";
  const displayName = `${talent.first_name} ${maskedLastName}`;

  const handleMessage = () => {
    toast({
      title: "Opening chat thread...",
      description: `Starting a conversation with ${talent.first_name}.`,
    });
  };

  const ChipGroup = ({ label, items, variant }: { label: string; items?: string[] | null; variant?: "outline" | "text" }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-4 last:mb-0">
        <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</h4>
        {variant === "text" ? (
          <p className="text-sm text-gray-700">{items.join(", ")}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {items.map((item, i) => (
              <Badge key={i} variant={variant === "outline" ? "outline" : "secondary"} className="text-xs font-normal bg-gray-50 text-gray-700 border-gray-200">
                {item}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border border-gray-200 rounded-xl shadow-sm overflow-hidden font-[Inter]">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide space-y-5">
        
        {/* Profile Header Card */}
        <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <Avatar className="h-20 w-20 border border-gray-100 shrink-0 rounded-2xl">
                <AvatarImage src={talent.avatar_url} className="rounded-2xl object-cover" />
                <AvatarFallback className="text-2xl bg-gray-50 text-gray-400 font-bold rounded-2xl">
                  {getInitials(talent.first_name, talent.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-2">
                  <h2 className="text-xl font-bold text-gray-900 truncate tracking-tight">{displayName}</h2>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 border text-[10px] font-semibold">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-semibold capitalize border-gray-200">
                      Top Rated
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="bg-gray-50 text-gray-500 border-gray-200 border text-[10px] font-semibold gap-1 cursor-help">
                          <Shield className="h-3 w-3" /> ID Verified
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">OPSlyHR has verified this talent's identity.</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mt-1">
                  {ROLE_LABELS[talent.primary_role] || talent.primary_role?.replace(/_/g, " ") || "Professional"}
                </p>
                
                {/* Details Row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[13px] text-gray-500 font-medium">
                  {talent.country && (
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {talent.country}</span>
                  )}
                  {talent.timezone && (
                    <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-gray-400" /> {talent.timezone}</span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-gray-400" /> 
                    {talent.years_of_experience ? `${talent.years_of_experience} years exp.` : "Experience N/A"}
                  </span>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 shadow-none px-2 py-0 h-5 text-[10px]">
                    {talent.availability === 'full_time' ? 'Full-Time' : talent.availability?.replace(/_/g, " ") || "Available"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Summary */}
        {talent.bio && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">About</h3>
            </div>
            <CardContent className="p-6 pt-5">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {talent.bio}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Skills & Tools */}
        {(talent.secondary_skills?.length > 0 || talent.tools_familiar_with?.length > 0 || talent.languages_spoken?.length > 0) && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
              <Award className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Skills & Tools</h3>
            </div>
            <CardContent className="p-6 pt-5">
              <ChipGroup label="Core Skills" items={talent.secondary_skills} />
              <ChipGroup label="Software & Tools" items={talent.tools_familiar_with} variant="outline" />
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                <Languages className="h-4 w-4 text-gray-400" />
                <span className="font-semibold text-gray-900">Languages:</span> 
                {talent.languages_spoken?.join(", ") || "English"}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work History */}
        {talent.work_history && talent.work_history.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Work History</h3>
            </div>
            <CardContent className="p-6 pt-6">
              <div className="space-y-6">
                {talent.work_history.map((work: any, i: number) => (
                  <div key={work.id} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-gray-900" />
                    {i !== talent.work_history.length - 1 && <div className="absolute left-[3px] top-4 bottom-[-28px] w-px bg-gray-100" /> }
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1.5">
                      <h4 className="text-sm font-bold text-gray-900">{work.role_title}</h4>
                      <span className="text-xs text-gray-400 font-medium">{new Date(work.start_date).getFullYear()} – {work.is_current ? "Present" : new Date(work.end_date).getFullYear()}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">{work.company_name}</p>
                    {work.role_description && <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{work.role_description}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Education */}
        {talent.education && talent.education.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Education</h3>
            </div>
            <CardContent className="p-6 pt-5">
              <div className="grid gap-3">
                {talent.education.map((edu: any) => (
                  <div key={edu.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 gap-y-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{edu.institution_name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{edu.education_level}{edu.field_of_study ? ` — ${edu.field_of_study}` : ""}</p>
                    </div>
                    <span className="text-xs text-gray-400 font-medium bg-white px-2.5 py-1 rounded-md border border-gray-200 whitespace-nowrap hidden sm:block">
                      {edu.start_year} – {edu.is_current ? "Present" : edu.end_year}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        {talent.certifications && talent.certifications.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
              <Award className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Certifications</h3>
            </div>
            <CardContent className="p-6 pt-5">
              <div className="space-y-4">
                {talent.certifications.map((cert: any) => (
                  <div key={cert.id} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{cert.certification_name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{cert.issuing_organization}</p>
                      </div>
                      {cert.credential_url && (
                        <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline font-semibold flex items-center gap-1 shrink-0 bg-blue-50 px-2 py-1 rounded-md">
                          <ExternalLink className="h-3 w-3" /> Verify
                        </a>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-2 block font-medium">Issued: {cert.year_obtained}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-4 md:px-6 md:py-4 bg-white border-t border-gray-200 flex gap-3 mt-auto shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        <Button className="flex-1 bg-gray-900 hover:bg-gray-800 text-white shadow-sm" onClick={() => onInvite(talent)}>
          <CalendarDays className="mr-2 h-4 w-4" />
          Invite to Interview
        </Button>
        <Button variant="outline" className="flex-1 bg-white border-gray-200 hover:bg-gray-50 shadow-sm" onClick={handleMessage}>
          <MessageSquare className="mr-2 h-4 w-4 text-gray-500" />
          Message Talent
        </Button>
      </div>
    </div>
  );
};
