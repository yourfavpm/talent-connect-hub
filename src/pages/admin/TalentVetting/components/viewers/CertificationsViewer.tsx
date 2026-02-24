import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Calendar, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CertificationsViewerProps {
  talent: any;
}

const CertificationsViewer = ({ talent }: CertificationsViewerProps) => {
  const certifications = talent.certifications || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gray-400" />
                Certifications
            </div>
            <span className="text-[10px] font-bold text-gray-400">{certifications.length} Entries</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {certifications.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {certifications.map((cert: any, idx: number) => (
                <div key={idx} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <Award className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">{cert.certification_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-bold text-gray-600">{cert.issuing_organization}</span>
                        <span className="text-gray-200 text-xs">•</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                          <ClockIcon className="h-3 w-3" />
                          <span>Obtained {cert.year_obtained || "?"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cert.credential_url ? (
                      <Button variant="outline" className="h-8 text-[10px] font-bold border-gray-200" onClick={() => window.open(cert.credential_url, '_blank')}>
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Verify
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 px-2 py-1 rounded border border-gray-100 bg-gray-50/50">
                        <ShieldCheck className="h-3 w-3 text-gray-300" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Self-Reported</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400 font-medium italic">No certification records found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ClockIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export default CertificationsViewer;
