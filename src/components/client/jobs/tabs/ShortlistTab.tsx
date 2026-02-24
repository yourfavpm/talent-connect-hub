import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarIcon, FilePenLine, UserCheck, SearchX } from "lucide-react";

interface ShortlistTabProps {
  applications: any[];
  onRequestInterview: (appId: string) => void;
  onInitiateOffer: (appId: string) => void;
  isOfferPending: boolean;
}

export const ShortlistTab = ({ applications, onRequestInterview, onInitiateOffer, isOfferPending }: ShortlistTabProps) => {
  // Shortlist includes candidates moved to shortlist, or already in interview/offer phases.
  const shortlisted = applications?.filter(app => 
    ['shortlisted', 'interview_requested', 'interview_scheduled', 'offer_initiated', 'offer_sent', 'offer_accepted', 'hired'].includes(app.status)
  ) || [];

  if (shortlisted.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
        <UserCheck className="w-10 h-10 mx-auto text-gray-300 mb-4" />
        <h3 className="text-sm font-medium text-gray-900">Your shortlist is empty</h3>
        <p className="text-sm text-gray-500 mt-1">Review applicants and request interviews to add them here.</p>
      </div>
    );
  }

  const getInterviewStatus = (status: string) => {
    switch (status) {
      case 'offer_initiated':
      case 'offer_sent':
      case 'offer_accepted':
      case 'hired':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Selected</Badge>;
      case 'interview_scheduled':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">Interview Scheduled</Badge>;
      case 'interview_requested':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Interview Requested</Badge>;
      case 'shortlisted':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-none">Awaiting Action</Badge>;
      default:
        return <Badge variant="outline">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-fade-in">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
          <tr>
            <th className="px-6 py-4">Shortlisted Talent</th>
            <th className="px-6 py-4">Current Status</th>
            <th className="px-6 py-4 text-right">Operational Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {shortlisted.map((app) => (
            <tr key={app.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-gray-100">
                    <AvatarImage src={app.talent?.avatar_url} />
                    <AvatarFallback className="bg-gray-100 text-gray-600">
                      {app.talent?.first_name?.[0]}{app.talent?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-gray-900">{app.talent?.first_name} {app.talent?.last_name}</h4>
                    <p className="text-xs text-gray-500">{app.talent?.primary_role?.replace(/_/g, ' ') || "Role unspecified"}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {getInterviewStatus(app.status)}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {/* Interview Request Action */}
                  {['shortlisted'].includes(app.status) && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-white shadow-sm"
                      onClick={() => onRequestInterview(app.id)}
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" /> Request Interview
                    </Button>
                  )}

                  {/* Hire Action */}
                  {['interview_scheduled', 'shortlisted', 'interview_requested'].includes(app.status) && (
                    <Button
                      size="sm"
                      onClick={() => onInitiateOffer(app.id)}
                      disabled={isOfferPending}
                      className={isOfferPending ? "bg-gray-100 text-gray-400" : "bg-gray-900 text-white hover:bg-gray-800"}
                    >
                      <FilePenLine className="w-4 h-4 mr-2" />
                      Generate Offer
                    </Button>
                  )}
                  
                  {['offer_initiated', 'offer_sent', 'offer_accepted', 'hired'].includes(app.status) && (
                     <Button size="sm" variant="outline" disabled className="bg-gray-50 text-gray-400 border-dashed">
                      Offer Generated
                     </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
