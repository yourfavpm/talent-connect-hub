import { Video, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface InterviewsTabProps {
  applications: any[];
}

export const InterviewsTab = ({ applications }: InterviewsTabProps) => {
  const interviews = applications?.filter(app => 
    ['interview_requested', 'interview_scheduled'].includes(app.status)
  ) || [];

  if (interviews.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
        <Video className="w-10 h-10 mx-auto text-gray-300 mb-4" />
        <h3 className="text-sm font-medium text-gray-900">No active interviews</h3>
        <p className="text-sm text-gray-500 mt-1">Interviews you schedule with shortlisted candidates will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
      {interviews.map((app) => (
        <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <Avatar className="h-10 w-10 border border-gray-100">
              <AvatarImage src={app.talent?.avatar_url} />
              <AvatarFallback className="bg-gray-100 text-gray-600">
                {app.talent?.first_name?.[0]}{app.talent?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <Badge variant={app.status === 'interview_scheduled' ? 'default' : 'secondary'} className={app.status === 'interview_scheduled' ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-50 border-none'}>
              {app.status === 'interview_scheduled' ? 'Scheduled' : 'Requested'}
            </Badge>
          </div>
          
          <h4 className="font-semibold text-gray-900 mb-1">{app.talent?.first_name} {app.talent?.last_name}</h4>
          <p className="text-sm text-gray-500 mb-4">{app.talent?.primary_role?.replace(/_/g, ' ') || "Candidate"}</p>
          
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" /> 
              <span>Pending OpslyHR scheduling</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2 text-gray-400" /> 
              <span>TBD</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
