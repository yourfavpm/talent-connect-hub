import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, ArrowRight, UserPlus, Inbox } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface ApplicantsTabProps {
  applications: any[];
  onRequestInterview: (appId: string) => void;
}

export const ApplicantsTab = ({ applications, onRequestInterview }: ApplicantsTabProps) => {
  const applicants = applications?.filter(app => app.status === 'applied') || [];

  if (applicants.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
        <Inbox className="w-10 h-10 mx-auto text-gray-300 mb-4" />
        <h3 className="text-sm font-medium text-gray-900">No new applicants yet</h3>
        <p className="text-sm text-gray-500 mt-1">When talents apply to this role, they will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-fade-in">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
          <tr>
            <th className="px-6 py-4">Talent</th>
            <th className="px-6 py-4">Location</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {applicants.map((app) => (
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
                    <p className="text-xs text-gray-500">{app.talent?.primary_role?.replace(/_/g, ' ') || "Talent"}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-500">
                {app.talent?.country ? (
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{app.talent.country}</span>
                ) : "Unspecified"}
              </td>
              <td className="px-6 py-4">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none font-medium">Applied</Badge>
              </td>
              <td className="px-6 py-4 text-right">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white text-gray-700 h-8">
                      View Application
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[540px] border-l-gray-200 p-0 overflow-y-auto">
                    <div className="px-6 py-8 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 border border-gray-200 shadow-sm">
                          <AvatarImage src={app.talent?.avatar_url} />
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-xl font-medium">
                            {app.talent?.first_name?.[0]}{app.talent?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <SheetTitle className="text-xl font-medium text-gray-900">
                            {app.talent?.first_name} {app.talent?.last_name}
                          </SheetTitle>
                          <p className="text-sm text-gray-500 mt-1">{app.talent?.primary_role?.replace(/_/g, ' ') || "Talent"}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4 bg-white border border-gray-100 rounded-xl p-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Country</p>
                          <p className="text-sm text-gray-900">{app.talent?.country || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Experience</p>
                          <p className="text-sm text-gray-900">{app.talent?.years_of_experience ? `${app.talent.years_of_experience} yrs` : "N/A"}</p>
                        </div>
                      </div>

                      {app.cover_letter && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Application Note / Cover Letter</h4>
                          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                            {app.cover_letter}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-6 border-t border-gray-100">
                        <Button 
                          className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
                          onClick={() => onRequestInterview(app.id)}
                        >
                          Request Interview <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
