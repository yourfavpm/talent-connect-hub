import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, MoreHorizontal, FileText, AlertCircle, Briefcase, Eye, Calendar, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";

const Jobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const { data: clientData } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (clientData) {
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("*, job_applications(count), job_shortlist:job_applications(count)") // Simplified count attempts
          .eq("client_id", clientData.id)
          .order("created_at", { ascending: false });

        setJobs(jobsData || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (job: any) => {
    const status = job.status;
    const hasRejection = !!job.rejection_reason;

    if (hasRejection && (status === 'draft' || status === 'rejected')) {
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">Needs Changes</Badge>;
    }

    switch (status) {
      case "draft":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none">Draft</Badge>;
      case "submitted":
      case "under_review":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">Awaiting Approval</Badge>;
      case "approved":
      case "published":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Active</Badge>;
      case "filled":
      case "closed":
        return <Badge variant="outline" className="text-gray-500 border-gray-200">Closed</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none">{status}</Badge>;
    }
  };

  const getJobGroup = (job: any) => {
    const status = job.status;
    const hasRejection = !!job.rejection_reason;

    if (hasRejection && (status === 'draft' || status === 'rejected')) return "needs_changes";
    if (status === "submitted" || status === "under_review") return "awaiting_approval";
    if (status === "approved" || status === "published") return "active";
    if (status === "filled" || status === "closed") return "closed";
    return "draft";
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
      const group = getJobGroup(job);

      if (!matchesSearch) return false;
      if (activeTab === "all") return true;
      if (activeTab === "active" && group === "active") return true;
      if (activeTab === "awaiting" && group === "awaiting_approval") return true;
      if (activeTab === "changes" && group === "needs_changes") return true;
      if (activeTab === "closed" && group === "closed") return true;

      return false;
    });
  }, [jobs, searchQuery, activeTab]);

  const hasAwaitingApproval = jobs.some(j => getJobGroup(j) === "awaiting_approval");

  const renderDesktopTable = () => (
    <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 font-medium">Job Title</th>
            <th className="px-6 py-4 font-medium">Service Type</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium text-center">Applicants</th>
            <th className="px-6 py-4 font-medium text-center">Shortlist</th>
            <th className="px-6 py-4 font-medium">Last Updated</th>
            <th className="px-6 py-4 font-medium text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filteredJobs.map((job) => (
            <tr 
              key={job.id} 
              className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
              onClick={() => navigate(getInternalPath(`/client/jobs/${job.id}`))}
            >
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{job.title}</div>
                {getJobGroup(job) === "needs_changes" && (
                  <div className="text-xs text-orange-600 mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> Admin requested changes
                  </div>
                )}
              </td>
              <td className="px-6 py-4 text-gray-500 capitalize">
                {job.service_model?.replace(/_/g, " ") || "Not specified"}
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(job)}
              </td>
              <td className="px-6 py-4 text-center text-gray-600 font-medium">
                —
              </td>
              <td className="px-6 py-4 text-center text-gray-600 font-medium">
                —
              </td>
              <td className="px-6 py-4 text-gray-500 text-xs">
                {format(new Date(job.updated_at || job.created_at), "MMM d, yyyy")}
              </td>
              <td className="px-6 py-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(getInternalPath(`/client/jobs/${job.id}`)); }}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    {getJobGroup(job) === "needs_changes" && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(getInternalPath(`/client/jobs/${job.id}`)); }}>
                        <FileText className="mr-2 h-4 w-4" /> Edit & Resubmit
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMobileList = () => (
    <div className="md:hidden space-y-3">
      {filteredJobs.map((job) => (
        <div 
          key={job.id}
          className="bg-white border border-gray-200 rounded-xl p-4 active:scale-[0.98] transition-all"
          onClick={() => navigate(getInternalPath(`/client/jobs/${job.id}`))}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-gray-900 leading-tight">{job.title}</h3>
            <div className="ml-3 shrink-0">{getStatusBadge(job)}</div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 mb-3">
            <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1" /> {job.service_model?.replace(/_/g, " ") || "Any"}</span>
            <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(job.created_at), "MMM d, yyyy")}</span>
          </div>
          {getJobGroup(job) === "needs_changes" && (
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded-md flex items-start mb-3">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5 shrink-0 mt-0.5" /> 
              <span>Admin requested changes to this job post.</span>
            </div>
          )}
          <div className="flex bg-gray-50 rounded-lg p-2 divide-x divide-gray-200">
            <div className="flex-1 text-center">
              <div className="text-sm font-semibold text-gray-900">—</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Applied</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-sm font-semibold text-gray-900">—</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Shortlist</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-sm font-semibold text-gray-900">—</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Interviews</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-8 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your job postings and applicants.</p>
        </div>
        <Button onClick={() => navigate(getInternalPath("/client/jobs/new"))}>
          <Plus className="h-4 w-4 mr-2" />
          Post Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Active Roles</h3>
            <div className="bg-green-100 p-2 rounded-lg">
              <Briefcase className="w-4 h-4 text-green-700" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {jobs.filter(j => getJobGroup(j) === "active").length}
          </p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Awaiting Approval</h3>
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-700" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {jobs.filter(j => getJobGroup(j) === "awaiting_approval").length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Needs Changes</h3>
            <div className="bg-orange-100 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4 text-orange-700" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {jobs.filter(j => getJobGroup(j) === "needs_changes").length}
          </p>
        </div>
      </div>

      {/* Optional Awaiting Approval Banner */}
      {hasAwaitingApproval && activeTab === "all" && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Jobs pending approval</h4>
            <p className="text-sm text-yellow-700 mt-1">
              You have job postings waiting for OpslyHR admin approval. They will be published to the talent network once approved.
            </p>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto overflow-x-auto scrollbar-hide">
          <TabsList className="bg-gray-100 p-1 border border-gray-200">
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500">All</TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500">Active</TabsTrigger>
            <TabsTrigger value="awaiting" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500">Awaiting Approval</TabsTrigger>
            <TabsTrigger value="changes" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500">Needs Changes</TabsTrigger>
            <TabsTrigger value="closed" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500">Closed / Past</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-white border-gray-200 focus-visible:ring-gray-200 text-sm"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-500">
          Loading jobs...
        </div>
      ) : filteredJobs.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
          <Briefcase className="h-10 w-10 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-medium text-gray-900 mb-1">
            {searchQuery || activeTab !== "all" ? "No jobs match your filters" : "You haven't posted any jobs yet"}
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            {searchQuery || activeTab !== "all" 
              ? "Try adjusting your search query or changing tabs to find what you're looking for."
              : "Create your first job posting to start finding the perfect talent for your operational needs."}
          </p>
          {(searchQuery || activeTab !== "all") ? (
            <Button variant="outline" onClick={() => { setSearchQuery(""); setActiveTab("all"); }}>
              Reset Filters
            </Button>
          ) : (
            <Button onClick={() => navigate(getInternalPath("/client/jobs/new"))}>
              <Plus className="h-4 w-4 mr-2" />
              Post your first job
            </Button>
          )}
        </div>
      ) : (
        <>
          {renderDesktopTable()}
          {renderMobileList()}
        </>
      )}
    </div>
  );
};

export default Jobs;
