import { Clock, Briefcase, UserCheck, Search, Text } from "lucide-react";
import { format } from "date-fns";

interface ActivityTabProps {
  job: any;
  applications: any[];
}

export const ActivityTab = ({ job, applications }: ActivityTabProps) => {
  // Synthesize an activity log from dates
  const activities = [];

  // 1. Job Creation
  if (job?.created_at) {
    activities.push({
      id: "create",
      type: "system",
      icon: Briefcase,
      title: "Job created",
      description: "You published the initial job requirements.",
      date: new Date(job.created_at),
    });
  }

  // 2. Application Events
  applications?.forEach(app => {
    activities.push({
      id: `app_${app.id}`,
      type: "application",
      icon: UserCheck,
      title: `New application: ${app.talent?.first_name} ${app.talent?.last_name}`,
      description: `${app.talent?.first_name} applied for this role.`,
      date: new Date(app.created_at),
    });
  });

  // Sort descending
  activities.sort((a, b) => b.date.getTime() - a.date.getTime());

  if (activities.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
        <Text className="w-10 h-10 mx-auto text-gray-300 mb-4" />
        <h3 className="text-sm font-medium text-gray-900">No activity yet</h3>
        <p className="text-sm text-gray-500 mt-1">Actions taken on this job will form an audit trail here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 animate-fade-in">
      <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center">
        <Clock className="w-4 h-4 mr-2 text-gray-400" /> Activity Log
      </h3>
      
      <div className="relative pl-6 sm:pl-8 border-l border-gray-100 space-y-8">
        {activities.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-[35px] sm:-left-[43px] w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                <Icon className="w-3 h-3 text-gray-400" />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                </div>
                <div className="text-xs text-gray-400 sm:text-right shrink-0 font-medium">
                  {format(item.date, "MMM d, yyyy • h:mm a")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
