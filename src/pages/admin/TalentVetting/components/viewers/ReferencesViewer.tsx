import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Mail, Phone, User, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReferencesViewerProps {
  talent: any;
}

const ReferencesViewer = ({ talent }: ReferencesViewerProps) => {
  const references = talent.references || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="h-4 px-1.5 text-[8px] font-bold uppercase bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none">Verified</Badge>;
      case "needs_clarification":
        return <Badge className="h-4 px-1.5 text-[8px] font-bold uppercase bg-orange-50 text-orange-600 border-orange-100 shadow-none">Action Required</Badge>;
      case "rejected":
        return <Badge className="h-4 px-1.5 text-[8px] font-bold uppercase bg-red-50 text-red-600 border-red-100 shadow-none">Rejected</Badge>;
      default:
        return <Badge className="h-4 px-1.5 text-[8px] font-bold uppercase bg-blue-50 text-blue-600 border-blue-100 shadow-none">Pending Verification</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-gray-400" />
                Professional References
            </div>
            <span className="text-[10px] font-bold text-gray-400">{references.length} Entries</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {references.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {references.map((ref: any, idx: number) => (
                <div key={idx} className="p-6 transition-colors hover:bg-gray-50/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h4 className="text-sm font-bold text-gray-900 leading-tight">{ref.reference_name}</h4>
                                {getStatusBadge(ref.verification_status)}
                            </div>
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mt-1 block">{ref.relationship}</span>
                            
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded bg-white border border-gray-100 flex items-center justify-center">
                                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">{ref.email || "No email provided"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded bg-white border border-gray-100 flex items-center justify-center">
                                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">{ref.phone || "No phone provided"}</span>
                                </div>
                            </div>

                            {ref.admin_notes && (
                                <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100 border-dashed">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="h-3 w-3 text-gray-400" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Admin Note</span>
                                    </div>
                                    <p className="text-xs text-gray-600 font-medium italic">{ref.admin_notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400 font-medium italic">No reference records found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferencesViewer;
