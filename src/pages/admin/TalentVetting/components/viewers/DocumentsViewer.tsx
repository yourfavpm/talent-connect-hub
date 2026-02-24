import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, ExternalLink, ShieldCheck, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentsViewerProps {
  talent: any;
}

const DocumentsViewer = ({ talent }: DocumentsViewerProps) => {
  const docs = [
    { label: "Curriculum Vitae (CV)", url: talent.cv_url, key: "cv" },
    { label: "Government ID", url: talent.government_id_url, key: "gov_id" },
    { label: "Proof of Address", url: talent.proof_of_address_url, key: "address" },
  ];

  const getFileIcon = (url: string) => {
    if (url.includes(".pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (url.includes(".jpg") || url.includes(".png") || url.includes(".jpeg")) return <FileIcon className="h-5 w-5 text-blue-500" />;
    return <FileText className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            Verification Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {docs.map((doc, idx) => (
              <div key={idx} className="p-6 flex items-center justify-between group hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    {doc.url ? getFileIcon(doc.url) : <FileText className="h-6 w-6 text-gray-200" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 leading-tight">{doc.label}</h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        {doc.url ? "File Uploaded" : "Not Provided"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {doc.url ? (
                    <>
                      <Button variant="outline" className="h-9 text-[11px] font-bold border-gray-200" onClick={() => window.open(doc.url, '_blank')}>
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" className="h-9 w-9 p-0 border-gray-200">
                        <Download className="h-4 w-4 text-gray-400" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50/50">
                        <ShieldCheck className="h-3.5 w-3.5 text-gray-300" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Pending Upload</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsViewer;
