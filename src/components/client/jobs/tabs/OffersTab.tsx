import { FileText, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OffersTabProps {
  applications: any[];
}

export const OffersTab = ({ applications }: OffersTabProps) => {
  const offers = applications?.filter(app => 
    ['offer_initiated', 'offer_sent', 'offer_accepted', 'contract_pending', 'contract_sent', 'waiting_for_talent', 'active', 'hired'].includes(app.status)
  ) || [];

  if (offers.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
        <FileText className="w-10 h-10 mx-auto text-gray-300 mb-4" />
        <h3 className="text-sm font-medium text-gray-900">No active offers</h3>
        <p className="text-sm text-gray-500 mt-1">When you generate an offer for a candidate, it will trigger an admin process and appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {offers.map((app) => (
        <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <Avatar className="h-12 w-12 border border-gray-100 hidden sm:block">
              <AvatarImage src={app.talent?.avatar_url} />
              <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
                {app.talent?.first_name?.[0]}{app.talent?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900">{app.talent?.first_name} {app.talent?.last_name}</h4>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0">
                  {app.status === 'offer_initiated' ? 'Admin Generating' : app.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Initiated offer workflow for complete onboarding
              </p>
            </div>
          </div>
          
          <div className="flex shrink-0">
             <div className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center">
               Pending Signatures <ExternalLink className="w-3.5 h-3.5 ml-2 text-gray-400" />
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};
