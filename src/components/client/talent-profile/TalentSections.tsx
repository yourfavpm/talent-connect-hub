import { ClientTalentProfileData } from "@/types/talent";
import { TalentSectionEditorial } from "./TalentSectionEditorial";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Settings, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Star,
  Globe,
  Database
} from "lucide-react";

interface TalentSectionsProps {
  talent: ClientTalentProfileData;
}

export function TalentSections({ talent }: TalentSectionsProps) {
  return (
    <div className="space-y-8">
      {/* 1. Professional Summary */}
      {talent.about && (
        <TalentSectionEditorial title="Professional Summary" icon={User}>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 leading-relaxed font-medium selection:bg-blue-100 selection:text-blue-900 whitespace-pre-wrap">
              {talent.about}
            </p>
          </div>
        </TalentSectionEditorial>
      )}

      {/* 2. Expertise & Skills */}
      {((talent.skills && talent.skills.length > 0) || (talent.tools && talent.tools.length > 0) || (talent.languages && talent.languages.length > 0)) && (
        <TalentSectionEditorial title="Expertise" icon={Settings}>
          <div className="space-y-12">
            {talent.skills && talent.skills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                   <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                   <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Core Competencies</h3>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-5">
                  {talent.skills.map((skill, idx) => (
                    <div key={idx} className="flex items-center gap-3 group">
                      <div className="w-2 h-2 rounded-full bg-blue-600 group-hover:scale-150 transition-transform" />
                      <span className="text-base font-bold text-slate-700 transition-colors group-hover:text-slate-900">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-slate-50">
              {talent.tools && talent.tools.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <Database className="w-4 h-4 text-slate-400" />
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Technical Stack</h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {talent.tools.map((tool, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold px-3 py-1.5 border border-slate-100 shadow-sm transition-all hover:-translate-y-0.5">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {talent.languages && talent.languages.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Communication</h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {talent.languages.map((lang, idx) => (
                      <Badge key={idx} variant="outline" className="border-slate-200 text-slate-500 font-bold px-3 py-1.5 hover:bg-slate-50 transition-colors">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TalentSectionEditorial>
      )}

      {/* 3. Work History */}
      {talent.work_history && talent.work_history.length > 0 && (
        <TalentSectionEditorial title="Experience" icon={Briefcase}>
          <div className="space-y-12">
            {talent.work_history.map((work, idx) => (
              <div key={work.id} className="relative group pl-10">
                {/* Visual Connector */}
                {idx !== talent.work_history.length - 1 && (
                  <div className="absolute left-[3px] top-6 bottom-[-48px] w-0.5 bg-slate-100 group-hover:bg-blue-100 transition-colors" />
                )}
                <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-slate-200 border-2 border-white ring-4 ring-slate-50 group-hover:bg-blue-500 group-hover:ring-blue-50 transition-all z-10" />

                <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-5">
                  <div>
                    <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-1">{work.role}</h4>
                    <div className="text-base font-bold text-slate-500">{work.company}</div>
                  </div>
                  <Badge variant="outline" className="w-fit text-[10px] font-black text-slate-400 uppercase tracking-widest border-slate-100 bg-slate-50/50">
                    {work.duration}
                  </Badge>
                </div>
                <div className="text-slate-600 text-[15px] font-medium leading-relaxed whitespace-pre-wrap max-w-[640px] bg-slate-50/30 p-5 rounded-2xl border border-slate-50 border-dashed">
                  {work.description}
                </div>
              </div>
            ))}
          </div>
        </TalentSectionEditorial>
      )}

      {/* 4. Academic Background */}
      {( (talent.education && talent.education.length > 0) || (talent.certifications && talent.certifications.length > 0) ) && (
        <TalentSectionEditorial title="Academics & Training" icon={GraduationCap}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {talent.education && talent.education.length > 0 && (
              <div className="space-y-10">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6">Education</h3>
                {talent.education.map((edu) => (
                  <div key={edu.id} className="group">
                    <h4 className="text-lg font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{edu.degree}</h4>
                    <div className="text-slate-500 font-bold mb-3">{edu.institution}</div>
                    <Badge variant="secondary" className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5">Class of {edu.year}</Badge>
                  </div>
                ))}
              </div>
            )}

            {talent.certifications && talent.certifications.length > 0 && (
              <div className="space-y-10">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6">Certifications</h3>
                <div className="space-y-4">
                  {talent.certifications.map((cert) => (
                    <div key={cert.id} className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm group">
                      <div className="h-10 w-10 shrink-0 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors border border-slate-100">
                         <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 mb-0.5 group-hover:text-blue-600 transition-colors">{cert.name}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Issued by {cert.issuer}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TalentSectionEditorial>
      )}
      {/* 5. Professional References */}
      {talent.references && talent.references.length > 0 && (
        <TalentSectionEditorial title="References" icon={Star}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {talent.references.map((ref) => (
              <div key={ref.id} className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col items-center text-center group transition-all hover:bg-white hover:shadow-md hover:border-blue-100/50">
                <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center mb-6 shadow-sm font-black text-slate-300 text-xl border border-slate-50 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                  {ref.name.charAt(0)}
                </div>
                <div className="font-black text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">{ref.name}</div>
                <div className="text-sm font-bold text-blue-600/70 uppercase tracking-widest">{ref.company}</div>
              </div>
            ))}
          </div>
        </TalentSectionEditorial>
      )}
    </div>
  );
}
