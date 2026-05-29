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
  Database,
} from "lucide-react";

interface TalentSectionsProps {
  talent: ClientTalentProfileData;
}

export function TalentSections({ talent }: TalentSectionsProps) {
  return (
    <div className="space-y-4">
      {/* 1. Summary */}
      {talent.about && (
        <TalentSectionEditorial title="Professional Summary" icon={User}>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {talent.about}
          </p>
        </TalentSectionEditorial>
      )}

      {/* 2. Skills & Expertise */}
      {((talent.skills && talent.skills.length > 0) ||
        (talent.tools && talent.tools.length > 0) ||
        (talent.languages && talent.languages.length > 0)) && (
        <TalentSectionEditorial title="Expertise & Skills" icon={Settings}>
          <div className="space-y-5">
            {talent.skills && talent.skills.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Core Competencies</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {talent.skills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 border border-blue-100 font-medium px-3 py-1 text-xs"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(talent.tools?.length > 0 || talent.languages?.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                {talent.tools && talent.tools.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <Database className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tech Stack</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {talent.tools.map((tool, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="bg-slate-50 text-slate-600 border border-slate-100 font-medium px-2.5 py-1 text-xs"
                        >
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {talent.languages && talent.languages.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Languages</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {talent.languages.map((lang, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="border-slate-200 text-slate-500 font-medium px-2.5 py-1 text-xs"
                        >
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TalentSectionEditorial>
      )}

      {/* 3. Experience */}
      {talent.work_history && talent.work_history.length > 0 && (
        <TalentSectionEditorial title="Experience" icon={Briefcase}>
          <div className="space-y-6">
            {talent.work_history.map((work, idx) => (
              <div key={work.id} className={`relative pl-5 ${idx !== talent.work_history.length - 1 ? "pb-6 border-b border-slate-100" : ""}`}>
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-slate-200" />

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{work.role}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{work.company}</p>
                  </div>
                  <Badge variant="outline" className="w-fit text-[10px] font-medium text-slate-400 border-slate-200 bg-slate-50 shrink-0">
                    {work.duration}
                  </Badge>
                </div>

                {work.description && (
                  <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
                    {work.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </TalentSectionEditorial>
      )}

      {/* 4. Education & Certifications */}
      {((talent.education && talent.education.length > 0) ||
        (talent.certifications && talent.certifications.length > 0)) && (
        <TalentSectionEditorial title="Education & Certifications" icon={GraduationCap}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {talent.education && talent.education.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Education</p>
                {talent.education.map((edu) => (
                  <div key={edu.id} className="py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm font-medium text-slate-800">{edu.degree}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{edu.institution}</p>
                    {edu.year && (
                      <Badge variant="secondary" className="mt-2 bg-white text-[10px] font-medium text-slate-400 border border-slate-200 px-2 py-0.5">
                        Class of {edu.year}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {talent.certifications && talent.certifications.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Certifications</p>
                {talent.certifications.map((cert) => (
                  <div key={cert.id} className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-7 h-7 shrink-0 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-800">{cert.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Issued by {cert.issuer}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TalentSectionEditorial>
      )}

      {/* 5. References */}
      {talent.references && talent.references.length > 0 && (
        <TalentSectionEditorial title="References" icon={Star}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {talent.references.map((ref) => (
              <div key={ref.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-semibold text-sm shrink-0">
                  {ref.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{ref.name}</p>
                  <p className="text-xs text-slate-400">{ref.company}</p>
                </div>
              </div>
            ))}
          </div>
        </TalentSectionEditorial>
      )}
    </div>
  );
}
