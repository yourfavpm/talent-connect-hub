import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Briefcase, Calendar, Building2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface HireRequest {
  id: string;
  title: string;
  service_model: string;
  engagement_type: string;
  status: string;
  client_user_id: string;
  created_at: string;
  published_at: string | null;
  client_name?: string;
  app_count?: number;
  shortlist_count?: number;
  interview_count?: number;
}

export default function AdminHireRequestsList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Fetch all hire requests
      const { data, error } = await supabase
        .from("hr_v2_hire_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const requestsData = (data || []) as HireRequest[];
      const clientUserIds = [...new Set(requestsData.map((req) => req.client_user_id).filter(Boolean))];

      let profiles: any[] = [];
      let clients: any[] = [];
      if (clientUserIds.length > 0) {
        const [{ data: profilesData }, { data: clientsData }] = await Promise.all([
          supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", clientUserIds),
          supabase.from("clients").select("user_id, company_name").in("user_id", clientUserIds),
        ]);
        profiles = profilesData || [];
        clients = clientsData || [];
      }

      const profileMap = profiles.reduce((acc, profile) => {
        acc[profile.user_id] = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
        return acc;
      }, {} as Record<string, string>);

      const clientMap = clients.reduce((acc, client) => {
        acc[client.user_id] = client.company_name;
        return acc;
      }, {} as Record<string, string>);

      const enriched: HireRequest[] = [];
      for (const req of requestsData) {
        const clientName = profileMap[req.client_user_id] || clientMap[req.client_user_id] || "—";

        const [apps, shorts, intrvs] = await Promise.all([
          supabase.from("hr_v2_applications").select("id", { count: "exact", head: true }).eq("hire_request_id", req.id),
          supabase.from("hr_v2_shortlists").select("id", { count: "exact", head: true }).eq("hire_request_id", req.id),
          supabase.from("hr_v2_interviews").select("id", { count: "exact", head: true }).eq("hire_request_id", req.id),
        ]);

        enriched.push({
          ...req,
          client_name: clientName,
          app_count: apps.count || 0,
          shortlist_count: shorts.count || 0,
          interview_count: intrvs.count || 0,
        });
      }

      setRequests(enriched);
    } catch (error) {
      console.error("Error fetching hire requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
      submitted: { label: "Pending Review", className: "bg-amber-100 text-amber-700" },
      admin_review: { label: "Under Review", className: "bg-amber-100 text-amber-700" },
      approved: { label: "Approved", className: "bg-blue-100 text-blue-700" },
      published: { label: "Published", className: "bg-emerald-100 text-emerald-700" },
      paused: { label: "Paused", className: "bg-slate-100 text-slate-500" },
      closed: { label: "Closed", className: "bg-red-100 text-red-600" },
      hired: { label: "Hired", className: "bg-purple-100 text-purple-700" },
    };
    const s = map[status] || { label: status, className: "bg-slate-100 text-slate-600" };
    return <Badge className={`${s.className} hover:${s.className} border-none font-semibold text-[10px] uppercase tracking-wider`}>{s.label}</Badge>;
  };

  const getGroup = (status: string) => {
    if (["submitted", "admin_review"].includes(status)) return "pending";
    if (status === "approved") return "approved";
    if (status === "published") return "active";
    if (status === "hired") return "hired";
    if (["closed", "paused"].includes(status)) return "closed";
    return "draft";
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeTab === "all") return true;
      return getGroup(req.status) === activeTab;
    });
  }, [requests, searchQuery, activeTab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: requests.length, pending: 0, approved: 0, active: 0, hired: 0, closed: 0, draft: 0 };
    requests.forEach((r) => { c[getGroup(r.status)] = (c[getGroup(r.status)] || 0) + 1; });
    return c;
  }, [requests]);

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 font-sans animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hire Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Manage client hiring requests across the full lifecycle.</p>
        </div>
        <Button onClick={() => navigate(getInternalPath("/admin/hire-requests/new"))} className="h-10 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
          New Hire Request
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto overflow-x-auto scrollbar-hide">
          <TabsList className="bg-white p-1 border border-slate-200 rounded-lg h-auto shadow-sm">
            {[
              { value: "all", label: "All" },
              { value: "pending", label: "Pending Review" },
              { value: "approved", label: "Approved" },
              { value: "active", label: "Active" },
              { value: "hired", label: "Hired" },
              { value: "closed", label: "Closed" },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-500 text-xs font-medium py-1.5 px-3 rounded-md">
                {tab.label}
                {counts[tab.value] > 0 && (
                  <span className="ml-1.5 bg-slate-200/50 px-1.5 py-0 rounded text-[10px]">{counts[tab.value]}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search requests..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 bg-white border-slate-200 text-sm shadow-sm" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-slate-500">Loading...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-xl">
          <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">No hire requests match your filters</h3>
          <p className="text-sm text-slate-500">Try adjusting your search or switching tabs.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 font-bold text-[10px] uppercase tracking-widest">Request</th>
                  <th className="px-5 py-3.5 font-bold text-[10px] uppercase tracking-widest">Client</th>
                  <th className="px-5 py-3.5 font-bold text-[10px] uppercase tracking-widest">Model</th>
                  <th className="px-5 py-3.5 font-bold text-[10px] uppercase tracking-widest">Status</th>
                  <th className="px-5 py-3.5 font-bold text-[10px] uppercase tracking-widest text-center">Apps</th>
                  <th className="px-5 py-3.5 font-bold text-[10px] uppercase tracking-widest text-center">Shortlist</th>
                  <th className="px-5 py-3.5 font-bold text-[10px] uppercase tracking-widest">Submitted</th>
                  <th className="px-5 py-3.5 font-bold text-[10px] uppercase tracking-widest text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate(getInternalPath(`/admin/hire-requests/${req.id}`))}>
                    <td className="px-5 py-4"><div className="font-semibold text-slate-900">{req.title}</div></td>
                    <td className="px-5 py-4 text-slate-600 text-xs">{req.client_name}</td>
                    <td className="px-5 py-4 text-slate-500 capitalize text-xs">{req.service_model?.replace(/_/g, " ")}</td>
                    <td className="px-5 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-5 py-4 text-center text-slate-600 font-medium">{req.app_count}</td>
                    <td className="px-5 py-4 text-center text-slate-600 font-medium">{req.shortlist_count}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{format(new Date(req.created_at), "MMM d, yyyy")}</td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 h-8"><ArrowRight className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredRequests.map((req) => (
              <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all" onClick={() => navigate(getInternalPath(`/admin/hire-requests/${req.id}`))}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight">{req.title}</h3>
                  {getStatusBadge(req.status)}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                  <span className="flex items-center"><Building2 className="w-3 h-3 mr-1" /> {req.client_name}</span>
                  <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(req.created_at), "MMM d, yyyy")}</span>
                </div>
                <div className="flex bg-slate-50 rounded-lg p-2 divide-x divide-slate-200 text-center">
                  <div className="flex-1"><div className="text-sm font-semibold text-slate-900">{req.app_count}</div><div className="text-[10px] text-slate-500 uppercase">Apps</div></div>
                  <div className="flex-1"><div className="text-sm font-semibold text-slate-900">{req.shortlist_count}</div><div className="text-[10px] text-slate-500 uppercase">Shortlist</div></div>
                  <div className="flex-1"><div className="text-sm font-semibold text-slate-900">{req.interview_count}</div><div className="text-[10px] text-slate-500 uppercase">Interviews</div></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
