import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, MoreHorizontal, FileText, AlertCircle, Briefcase, Eye, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

export default function HireRequestsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const { data } = await supabase
        .from("hr_v2_hire_requests")
        .select(`
          *,
          hr_v2_shortlists(count),
          hr_v2_interviews(count)
        `)
        .order("created_at", { ascending: false });

      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching hire requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">Draft</Badge>;
      case "submitted":
      case "admin_review":
      case "approved":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">In Review</Badge>;
      case "published":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Published</Badge>;
      case "paused":
        return <Badge variant="outline" className="text-slate-500 border-slate-200">Paused</Badge>;
      case "closed":
        return <Badge variant="outline" className="text-slate-400 border-slate-200 line-through">Closed</Badge>;
      case "hired":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Hired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRequestGroup = (status: string) => {
    if (["submitted", "admin_review", "approved"].includes(status)) return "review";
    if (status === "published") return "published";
    if (["closed", "paused"].includes(status)) return "closed";
    if (status === "hired") return "hired";
    return "draft";
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase());
      const group = getRequestGroup(req.status);

      if (!matchesSearch) return false;
      if (activeTab === "all") return true;
      if (activeTab === group) return true;

      return false;
    });
  }, [requests, searchQuery, activeTab]);

  const renderDesktopTable = () => (
    <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Hire Request</th>
            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Model</th>
            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-center">Shortlist</th>
            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-center">Interviews</th>
            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Created</th>
            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredRequests.map((req) => (
            <tr 
              key={req.id} 
              className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
              onClick={() => navigate(getInternalPath(`/client/hire-requests/${req.id}`))}
            >
              <td className="px-6 py-4">
                <div className="font-semibold text-slate-900">{req.title}</div>
              </td>
              <td className="px-6 py-4 text-slate-500 capitalize">
                {req.service_model?.replace(/_/g, " ")}
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(req.status)}
              </td>
              <td className="px-6 py-4 text-center text-slate-600 font-medium">
                {req.hr_v2_shortlists?.[0]?.count || 0}
              </td>
              <td className="px-6 py-4 text-center text-slate-600 font-medium">
                {req.hr_v2_interviews?.[0]?.count || 0}
              </td>
              <td className="px-6 py-4 text-slate-500 text-xs">
                {format(new Date(req.created_at), "MMM d, yyyy")}
              </td>
              <td className="px-6 py-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(getInternalPath(`/client/hire-requests/${req.id}`)); }}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    {req.status === "draft" && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(getInternalPath(`/client/hire-requests/${req.id}`)); }}>
                        <FileText className="mr-2 h-4 w-4" /> Edit & Submit
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
      {filteredRequests.map((req) => (
        <div 
          key={req.id}
          className="bg-white border border-slate-200 rounded-xl p-4 active:scale-[0.98] transition-all shadow-sm"
          onClick={() => navigate(`/client/hire-requests/${req.id}`)}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-slate-900 leading-tight">{req.title}</h3>
            <div className="ml-3 shrink-0">{getStatusBadge(req.status)}</div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 mb-3">
            <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1" /> {req.service_model?.replace(/_/g, " ")}</span>
            <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(req.created_at), "MMM d, yyyy")}</span>
          </div>
          <div className="flex bg-slate-50 rounded-lg p-2 divide-x divide-slate-200">
            <div className="flex-1 text-center">
              <div className="text-sm font-semibold text-slate-900">{req.hr_v2_shortlists?.[0]?.count || 0}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Shortlist</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-sm font-semibold text-slate-900">{req.hr_v2_interviews?.[0]?.count || 0}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Interviews</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-8 font-sans animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hire Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Submit requirements to our Admin team and review shortlisted candidates.</p>
        </div>
        <Button onClick={() => navigate(getInternalPath("/client/hire-requests/new"))} className="bg-slate-900 text-white hover:bg-slate-800">
          <Plus className="h-4 w-4 mr-2" />
          New Hire Request
        </Button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto overflow-x-auto scrollbar-hide">
          <TabsList className="bg-slate-100/50 p-1 border border-slate-200 rounded-lg h-auto">
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 text-xs font-medium py-1.5 px-3">All</TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 text-xs font-medium py-1.5 px-3">Draft</TabsTrigger>
            <TabsTrigger value="review" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 text-xs font-medium py-1.5 px-3">In Review</TabsTrigger>
            <TabsTrigger value="published" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 text-xs font-medium py-1.5 px-3">Published</TabsTrigger>
            <TabsTrigger value="hired" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 text-xs font-medium py-1.5 px-3">Hired</TabsTrigger>
            <TabsTrigger value="closed" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 text-xs font-medium py-1.5 px-3">Closed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-white border-slate-200 focus-visible:ring-slate-200 text-sm shadow-sm"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-slate-500 font-medium">
          Loading hire requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-xl shadow-sm">
          <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
             <Briefcase className="h-5 w-5 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {searchQuery || activeTab !== "all" ? "No requests match your filters" : "No hire requests yet"}
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            {searchQuery || activeTab !== "all" 
              ? "Try adjusting your search query or changing tabs."
              : "Create your first hire request to get matched with vetted operational talent."}
          </p>
          {(searchQuery || activeTab !== "all") ? (
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setActiveTab("all"); }}>
              Clear Filters
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate(getInternalPath("/client/hire-requests/new"))} className="bg-slate-900 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Hire Request
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
}
