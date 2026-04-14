import { ClientTalentProfileData } from "@/types/talent";
import { TalentSectionEditorial } from "./TalentSectionEditorial";
import { Badge } from "@/components/ui/badge";

interface TalentSectionsProps {
  talent: ClientTalentProfileData;
}

export function TalentSections({ talent }: TalentSectionsProps) {
  return (
    <div className="space-y-4">
      {/* 1. Professional Summary */}
      {talent.about && (
        <TalentSectionEditorial title="About">
          <p className="text-xl text-slate-600 leading-relaxed font-normal selection:bg-blue-100 selection:text-blue-900">
            {talent.about}
          </p>
        </TalentSectionEditorial>
      )}

      {/* 2. Skills & Tools */}
      {((talent.skills && talent.skills.length > 0) || (talent.tools && talent.tools.length > 0) || (talent.languages && talent.languages.length > 0)) && (
        <TalentSectionEditorial title="Expertise">
          <div className="space-y-12">
            {talent.skills && talent.skills.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em]">Core Competencies</h3>
                <div className="flex flex-wrap gap-x-8 gap-y-4">
                  {talent.skills.map((skill, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-base font-semibold text-slate-700">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-50">
              {talent.tools && talent.tools.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Tech Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {talent.tools.map((tool, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium px-3 py-1 border-transparent">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {talent.languages && talent.languages.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {talent.languages.map((lang, idx) => (
                      <Badge key={idx} variant="outline" className="border-slate-200 text-slate-500 font-medium px-3 py-1">
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
        <TalentSectionEditorial title="Experience">
          <div className="space-y-16">
            {talent.work_history.map((work) => (
              <div key={work.id} className="group transition-all">
                <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-6">
                  <div>
                    <h4 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">{work.role}</h4>
                    <div className="text-lg font-semibold text-slate-500">{work.company}</div>
                  </div>
                  <div className="text-sm font-black text-slate-300 uppercase tracking-widest">{work.duration}</div>
                </div>
                <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap max-w-2xl">
                  {work.description}
                </p>
              </div>
            ))}
          </div>
        </TalentSectionEditorial>
      )}

      {/* 4. Education & Certs */}
      {( (talent.education && talent.education.length > 0) || (talent.certifications && talent.certifications.length > 0) ) && (
        <TalentSectionEditorial title="Education">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {talent.education && talent.education.length > 0 && (
              <div className="space-y-8">
                {talent.education.map((edu) => (
                  <div key={edu.id}>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{edu.degree}</h4>
                    <div className="text-slate-500 font-medium mb-1">{edu.institution}</div>
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{edu.year}</div>
                  </div>
                ))}
              </div>
            )}

            {talent.certifications && talent.certifications.length > 0 && (
              <div className="space-y-6">
                {talent.certifications.map((cert) => (
                  <div key={cert.id} className="flex flex-col p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <span className="font-bold text-slate-900 mb-1">{cert.name}</span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Issued by {cert.issuer}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TalentSectionEditorial>
      )}

      {/* 5. References */}
      {talent.references && talent.references.length > 0 && (
        <TalentSectionEditorial title="References">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {talent.references.map((ref) => (
              <div key={ref.id} className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm font-black text-slate-300">
                  {ref.name.charAt(0)}
                </div>
                <div className="font-bold text-slate-900 text-lg">{ref.name}</div>
                <div className="text-sm font-medium text-blue-600">{ref.company}</div>
              </div>
            ))}
          </div>
        </TalentSectionEditorial>
      )}
    </div>
  );
}
