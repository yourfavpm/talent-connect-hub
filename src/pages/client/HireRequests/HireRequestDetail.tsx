import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, FileText, Users, Building, Globe, MapPin, DollarSign, UserCheck, Video } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { TalentProfileDrawer } from "@/components/client/talents/TalentProfileDrawer";

export default function HireRequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTalentUserId, setSelectedTalentUserId] = useState<string | null>(null);

  const fetchRequestDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: requestData, error: reqError } = await supabase
        .from('hr_v2_hire_requests')
        .select('*')
        .eq('id', id)
        .single();
        
      if (reqError) throw reqError;
      setRequest(requestData);

      // Fetch shortlisted candidates — query then enrich with profiles
      const { data: shortlistData } = await supabase
        .from('hr_v2_shortlists')
        .select('*')
        .eq('hire_request_id', id)
        .order('created_at', { ascending: false });

      const enrichedShortlist = [];
      for (const item of (shortlistData || [])) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, avatar_url')
          .eq('user_id', item.talent_user_id)
          .maybeSingle();
        enrichedShortlist.push({ ...item, profiles: profile });
      }
      setShortlist(enrichedShortlist);

      // Fetch interviews
      const { data: interviewData } = await supabase
        .from('hr_v2_interviews')
        .select('*')
        .eq('hire_request_id', id);
      setInterviews(interviewData || []);

    } catch (error) {
      console.error("Error fetching request details:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user && id) fetchRequestDetails();
  }, [user, id, fetchRequestDetails]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      draft: { label: "Draft", cls: "bg-slate-100 text-slate-700" },
      submitted: { label: "In Review", cls: "bg-amber-100 text-amber-700" },
      admin_review: { label: "In Review", cls: "bg-amber-100 text-amber-700" },
      approved: { label: "Approved", cls: "bg-blue-100 text-blue-700" },
      published: { label: "Published", cls: "bg-emerald-100 text-emerald-700" },
      paused: { label: "Paused", cls: "bg-slate-100 text-slate-500" },
      closed: { label: "Closed", cls: "bg-red-100 text-red-600" },
      hired: { label: "Hired", cls: "bg-purple-100 text-purple-700" },
    };
    const s = map[status] || { label: status, cls: "bg-slate-100 text-slate-600" };
    return <Badge className={`${s.cls} hover:${s.cls} border-none`}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="w-full max-w-none px-4 sm:px-6 py-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-64 rounded-2xl mb-6" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="w-full max-w-none px-4 sm:px-6 py-12 text-center">
        <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Request Not Found</h2>
        <p className="text-slate-500 mb-6">This hire request doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => navigate(getInternalPath("/client/hire-requests"))}>Back to Requests</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none px-4 sm:px-6 py-8 font-sans pb-32 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(getInternalPath("/client/hire-requests"))} className="text-slate-500 rounded-full hover:bg-slate-100 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{request.title}</h1>
              {getStatusBadge(request.status)}
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Building className="w-4 h-4" /> {request.service_model?.replace(/_/g, " ") || "—"}
              <span className="text-slate-300">•</span>
              Submitted {format(new Date(request.created_at), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
      </div>

      {request.status === 'closed' && request.close_reason && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700">
          <strong>Closed:</strong> {request.close_reason}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-white border text-slate-500 border-slate-200 p-1 w-full justify-start rounded-xl h-auto overflow-x-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 py-2.5 px-6 rounded-lg text-sm font-medium">
            <FileText className="w-4 h-4 mr-2" /> Request Overview
          </TabsTrigger>
          <TabsTrigger value="candidates" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 py-2.5 px-6 rounded-lg text-sm font-medium">
            <Users className="w-4 h-4 mr-2" /> Shortlisted Candidates
            {shortlist.length > 0 && <Badge className="ml-2 bg-slate-900 text-white hover:bg-slate-800 rounded-full px-2 py-0 border-none">{shortlist.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="animate-fade-in space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Format", value: request.engagement_type?.replace(/_/g, " ") || "—", icon: Clock },
              { label: "Location", value: request.location_preference || "Any", icon: MapPin },
              { label: "Timezone", value: request.timezone_overlap?.replace(/_/g, " ") || "Flexible", icon: Globe },
              { 
                label: `Budget (${request.budget_type || "—"})`, 
                value: (() => {
                  const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", NGN: "₦", KES: "KSh ", ZAR: "R " };
                  const sym = symbols[request.preferred_currency || "USD"] || "$";
                  const freq = request.salary_type === "monthly" ? "/mo" : (request.salary_type === "hourly" ? "/hr" : "");
                  if (request.budget_type === "fixed" && request.fixed_budget) {
                    return `${sym}${request.fixed_budget.toLocaleString()}${freq}`;
                  }
                  if (request.budget_min && request.budget_max) {
                    return `${sym}${request.budget_min.toLocaleString()} – ${sym}${request.budget_max.toLocaleString()}${freq}`;
                  }
                  if (request.budget_min) return `From ${sym}${request.budget_min.toLocaleString()}${freq}`;
                  return "TBD";
                })(), 
                icon: DollarSign 
              },
            ].map((item) => (
              <div key={item.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center"><item.icon className="w-3 h-3 mr-1.5" />{item.label}</p>
                <p className="font-semibold text-slate-900 capitalize">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {[
                { title: "Role Summary", content: request.role_summary },
                { title: "Key Responsibilities", content: request.responsibilities },
                { title: "Requirements & Skills", content: request.requirements || "No specific requirements listed." },
              ].map((s) => (
                <div key={s.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50"><h3 className="font-semibold text-slate-900">{s.title}</h3></div>
                  <div className="p-6"><p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{s.content || "—"}</p></div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> OPSlyHR Process</h3>
                <div className="space-y-3">
                  {[
                    { label: "Submitted", active: true },
                    { label: "Approved", active: ["approved", "published", "hired"].includes(request.status) },
                    { label: "Sourcing Candidates", active: ["published", "hired"].includes(request.status) },
                    { label: "Hired", active: request.status === "hired" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${step.active ? "border-blue-600 bg-blue-600" : "border-blue-200 bg-white"}`} />
                      <span className={`text-sm font-medium ${step.active ? "text-blue-900" : "text-blue-300"}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="candidates" className="animate-fade-in">
          {["draft", "submitted", "admin_review"].includes(request.status) ? (
            <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
              <UserCheck className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">We are reviewing your request</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">Once approved and published, our team will hand-pick and shortlist candidates for you.</p>
            </div>
          ) : shortlist.length === 0 ? (
            <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">No candidates shortlisted yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">Our recruitment team is actively sourcing and vetting candidates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shortlist.map((candidate) => {
                const profile = candidate.profiles;
                if (!profile) return null;
                const hasInterview = interviews.some((i) => i.talent_user_id === candidate.talent_user_id);
                return (
                  <div key={candidate.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group cursor-pointer" onClick={() => setSelectedTalentUserId(candidate.talent_user_id)}>
                    <div className="p-6 flex-grow">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold text-lg shrink-0">
                          {profile.first_name?.[0]}{profile.last_name?.[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 leading-tight">{profile.first_name} {profile.last_name}</h3>
                          <p className="text-sm text-slate-500 truncate max-w-[150px]">{profile.title}</p>
                        </div>
                      </div>
                      {profile.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {profile.skills.slice(0, 4).map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="bg-slate-50 text-slate-600 text-[10px] py-0">{skill}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Shortlisted {format(new Date(candidate.created_at), "MMM d")}</span>
                      {hasInterview ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-none"><Video className="w-3 h-3 mr-1" /> Interviewing</Badge>
                      ) : (
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedTalentUserId(candidate.talent_user_id); }}>View Profile</Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedTalentUserId && (
        <TalentProfileDrawer
          userId={selectedTalentUserId}
          isOpen={!!selectedTalentUserId}
          onClose={() => setSelectedTalentUserId(null)}
        />
      )}
    </div>
  );
}
