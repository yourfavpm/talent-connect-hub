import { ClientTalentProfileData } from "@/types/talent";
import { TalentSectionCard } from "./TalentSectionCard";
import { Badge } from "@/components/ui/badge";

interface TalentSectionsProps {
  talent: ClientTalentProfileData;
}

export function TalentSections({ talent }: TalentSectionsProps) {
  return (
    <div className="space-y-6">
      {/* 1. Professional Summary */}
      {talent.about && (
        <TalentSectionCard title="Professional Summary">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {talent.about}
          </p>
        </TalentSectionCard>
      )}

      {/* 2. Skills & Tools */}
      {((talent.skills && talent.skills.length > 0) || (talent.tools && talent.tools.length > 0) || (talent.languages && talent.languages.length > 0)) && (
        <TalentSectionCard title="Skills & Tools">
          <div className="space-y-6">
            {talent.skills && talent.skills.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Core Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {talent.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100 font-normal">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {talent.tools && talent.tools.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Software & Tools</h3>
                <div className="flex flex-wrap gap-2">
                  {talent.tools.map((tool, idx) => (
                    <Badge key={idx} variant="outline" className="text-gray-700 font-normal border-gray-200">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {talent.languages && talent.languages.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {talent.languages.map((lang, idx) => (
                    <Badge key={idx} variant="outline" className="border-gray-200 text-gray-700 font-normal">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TalentSectionCard>
      )}

      {/* 3. Work History */}
      {talent.work_history && talent.work_history.length > 0 && (
        <TalentSectionCard title="Work History">
          <div className="space-y-8">
            {talent.work_history.map((work) => (
              <div key={work.id} className="relative pl-6 border-l w-full border-gray-200 last:pb-0">
                {/* Timeline dot */}
                <div className="absolute w-2.5 h-2.5 bg-gray-300 rounded-full -left-[5.5px] top-1.5 border border-white"></div>
                
                <div className="mb-1">
                  <h4 className="text-lg font-medium text-gray-900">{work.role}</h4>
                  <div className="text-gray-700 font-medium">{work.company}</div>
                </div>
                <div className="text-sm text-gray-500 mb-3">{work.duration}</div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {work.description}
                </p>
              </div>
            ))}
          </div>
        </TalentSectionCard>
      )}

      {/* 4. Education */}
      {talent.education && talent.education.length > 0 && (
        <TalentSectionCard title="Education">
          <div className="space-y-6">
            {talent.education.map((edu) => (
              <div key={edu.id}>
                <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                <div className="text-gray-700 mb-1">{edu.institution}</div>
                <div className="text-sm text-gray-500">{edu.year}</div>
              </div>
            ))}
          </div>
        </TalentSectionCard>
      )}

      {/* 5. Certifications */}
      {talent.certifications && talent.certifications.length > 0 && (
        <TalentSectionCard title="Certifications">
          <div className="space-y-5">
            {talent.certifications.map((cert) => (
              <div key={cert.id} className="flex flex-col">
                <span className="font-medium text-gray-900">{cert.name}</span>
                <span className="text-sm text-gray-600">Issuer: {cert.issuer}</span>
              </div>
            ))}
          </div>
        </TalentSectionCard>
      )}

      {/* 6. References */}
      {talent.references && talent.references.length > 0 && (
        <TalentSectionCard title="References">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {talent.references.map((ref) => (
              <div key={ref.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div className="font-medium text-gray-900">{ref.name}</div>
                <div className="text-sm text-gray-600">{ref.company}</div>
              </div>
            ))}
          </div>
        </TalentSectionCard>
      )}
    </div>
  );
}
