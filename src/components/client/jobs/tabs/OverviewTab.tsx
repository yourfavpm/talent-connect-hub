import { Badge } from "@/components/ui/badge";
import { Briefcase, Globe, DollarSign, Calendar, Clock, MapPin, UserCheck, CheckCircle2 } from "lucide-react";

interface OverviewTabProps {
  job: any;
  getCurrencySymbol: (code: string) => string;
}

export const OverviewTab = ({ job, getCurrencySymbol }: OverviewTabProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {job.status === "needs_changes" && job.rejection_reason && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-orange-800 mb-1">Admin Notes</h3>
          <p className="text-sm text-orange-700">{job.rejection_reason}</p>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Service</span>
          <span className="text-sm font-medium text-gray-900 capitalize block mt-1">{job.service_model?.replace(/_/g, ' ') || "N/A"}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Work Mode</span>
          <span className="text-sm font-medium text-gray-900 capitalize block mt-1">{job.work_mode || "N/A"}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Budget</span>
          <span className="text-sm font-medium text-gray-900 block mt-1">
            {getCurrencySymbol(job.preferred_currency)}{job.budget_min || 0} - {getCurrencySymbol(job.preferred_currency)}{job.budget_max || 0} <span className="text-gray-500 font-normal">/{job.salary_type || "hr"}</span>
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</span>
          <span className="text-sm font-medium text-gray-900 block mt-1">{job.location || "Remote"}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Weekly Hours</span>
          <span className="text-sm font-medium text-gray-900 block mt-1">{job.weekly_hours || "Unspecified"}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Duration</span>
          <span className="text-sm font-medium text-gray-900 block mt-1">{job.duration || "Ongoing"}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Experience</span>
          <span className="text-sm font-medium text-gray-900 block mt-1">{job.experience_required ? `${job.experience_required}+ Years` : "Not specified"}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6 bg-white p-6 rounded-xl border border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Job Description</h3>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {job.responsibilities}
            </div>
          </div>
          
          {job.required_skills?.length > 0 && (
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary" className="bg-gray-50 text-gray-700 font-normal border border-gray-200">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {job.special_notes && (
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Special Notes</h3>
              <p className="text-sm text-blue-800 leading-relaxed">{job.special_notes}</p>
            </div>
          )}
          
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Job Lifecycle</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-xs text-gray-500">{new Date(job.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {job.status === "published" && (
                <div className="flex items-start gap-3 relative">
                  <div className="absolute left-3 -top-3 w-px h-3 bg-gray-200"></div>
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Approved & Published</p>
                    <p className="text-xs text-gray-500">{new Date(job.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
