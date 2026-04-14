import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Briefcase,
  UserCheck,
  Calendar,
  AlertCircle,
  Receipt,
  MessageSquare,
  ArrowRight,
  Plus,
  FileText,
  Clock,
  RefreshCw,
  Wallet
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getInternalPath } from "@/utils/subdomain";
import type { Database } from "@/integrations/supabase/types";

type Job = Database["public"]["Tables"]["jobs"]["Row"] & {
  clients?: { company_name: string | null };
};
type Talent = Database["public"]["Tables"]["talents"]["Row"];
type Ticket = Database["public"]["Tables"]["support_tickets"]["Row"];

const AdminDashboard = () => {
  const { user, userRole } = useAuth();
  const isTalentManager = userRole === "talent_manager";
  const [viewMode, setViewMode] = useState<"personal" | "global">(
    userRole === "super_admin" ? "global" : "personal"
  );

  const { data: dashboardData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-dashboard', user?.id, viewMode, userRole],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: versionRow } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "vetting_system_version")
        .maybeSingle();
      const currentVersion = (versionRow?.value as "v1" | "v2") ?? "v2";

      // Filtering logic
      const isPersonal = isTalentManager || viewMode === "personal";

      // 1. Fetch Profiles & Vetting Queue
      let pendingProfiles: any[] = [];
      let unvettedCount = 0;

      if (currentVersion === "v2") {
        let query = supabase
          .from("v2_talent_profiles")
          .select("id, user_id, status, progress_percent, submitted_at, created_at, talent_manager_admin_id", { count: "exact" })
          .or(`status.in.(submitted,resubmitted,in_review,changes_requested,revett_pending),and(status.eq.draft,progress_percent.eq.100)`);

        if (isPersonal) {
          query = query.eq("talent_manager_admin_id", user.id);
        }

        const { data: v2Profiles, count: v2Count } = await query.order("submitted_at", { ascending: false, nullsFirst: false });
        unvettedCount = v2Count || 0;
        
        const limitedV2 = (v2Profiles || []).slice(0, 5);
        if (limitedV2.length > 0) {
          const userIds = limitedV2.map(p => p.user_id);
          const { data: talentsData } = await supabase
            .from("talents")
            .select("*")
            .in("user_id", userIds);
          
          pendingProfiles = limitedV2.map((p: any) => ({
            id: p.id,
            status: p.status,
            progress_percent: p.progress_percent,
            submitted_at: p.submitted_at,
            created_at: p.created_at,
            talents: ((talentsData || []).find((t: any) => t.user_id === p.user_id) || {})
          }));
        }
      } else {
        let query = supabase.from("talent_profiles" as any)
          .select("*, talents(*)", { count: "exact" })
          .in("status", ["SUBMITTED", "RESUBMITTED", "VETTING_IN_PROGRESS"]);

        if (isPersonal) {
          query = query.eq("assigned_admin_id", user.id);
        }

        const { data: v1Profiles, count: v1Count } = await query.order("last_action_at", { ascending: false });
        unvettedCount = v1Count || 0;
        pendingProfiles = (v1Profiles || []).slice(0, 5);
      }

      // 2. Fetch Hired Stats
      let hiredCount = 0;
      if (isPersonal) {
        const { data: managedTalents } = await supabase
          .from("v2_talent_profiles")
          .select("user_id")
          .eq("talent_manager_admin_id", user.id);
        
        if (managedTalents && managedTalents.length > 0) {
          const uids = managedTalents.map(m => m.user_id);
          const { count } = await supabase
            .from("contracts")
            .select("id", { count: "exact", head: true })
            .eq("status", "active")
            .in("talent_id", uids);
          hiredCount = count || 0;
        }
      }

      // 3. Fetch Queues
      const [
        { data: pendingJobsData },
        { data: openTicketsData },
      ] = await Promise.all([
        isTalentManager
          ? Promise.resolve({ data: [] as any[] })
          : supabase.from("jobs").select("*, clients(company_name)").in("status", ["submitted", "under_review"]).order("created_at", { ascending: false }).limit(5),
        isTalentManager
          ? Promise.resolve({ data: [] as any[] })
          : supabase.from("support_tickets").select("*").in("status", ["open", "in_progress"]).order("created_at", { ascending: false }).limit(5),
      ]);

      // 4. Global counts
      const [
        { count: submittedJobsCount },
        { count: activeContractsCount },
        { data: invoicesData },
        { count: openTicketsCount },
        { count: pendingInterviewsCount },
        { data: latestOffers },
        { data: latestTalents },
        { data: latestJobs },
        { data: latestTickets }
      ] = await Promise.all([
        isTalentManager ? Promise.resolve({ count: 0 }) : supabase.from("jobs").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
        isTalentManager ? Promise.resolve({ count: 0 }) : supabase.from("contracts").select("id", { count: "exact", head: true }).eq("status", "active"),
        isTalentManager ? Promise.resolve({ data: [] }) : supabase.from("invoices").select("total_amount, status").neq("status", "paid"),
        isTalentManager ? Promise.resolve({ count: 0 }) : supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "scheduled"), 
        isTalentManager ? Promise.resolve({ data: [] }) : supabase.from("offers").select("*, talents(first_name, last_name)").order("created_at", { ascending: false }).limit(5),
        (isTalentManager
          ? supabase.from("v2_talent_profiles").select("*, talents:talents(first_name, last_name, email)").eq("talent_manager_admin_id", user.id)
          : supabase.from("v2_talent_profiles").select("*, talents:talents(first_name, last_name, email)"))
          .order("created_at", { ascending: false }).limit(5),
        isTalentManager ? Promise.resolve({ data: [] }) : supabase.from("jobs").select("*, clients(company_name)").order("created_at", { ascending: false }).limit(5),
        isTalentManager ? Promise.resolve({ data: [] }) : supabase.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(5)
      ]);

      const invoiceSum = (invoicesData || []).reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0);

      const activities: any[] = [];
      (latestOffers || []).forEach((o: any) => activities.push({
        type: 'Offer Created',
        description: `New offer for ${o.talents?.first_name} ${o.talents?.last_name} as ${o.role_title}`,
        time: o.created_at,
        icon: 'offer'
      }));
      (latestTalents || []).forEach((t: any) => activities.push({
        type: 'Talent Signup',
        description: `${t.talents?.first_name} ${t.talents?.last_name} (${t.status})`,
        time: t.created_at,
        icon: 'user'
      }));
      (latestJobs || []).forEach((j: any) => activities.push({
        type: 'Job Posted',
        description: `${j.title} by ${j.clients?.company_name || 'Client'}`,
        time: j.created_at,
        icon: 'job'
      }));
      (latestTickets || []).forEach((s: any) => activities.push({
        type: 'Support Ticket',
        description: s.subject,
        time: s.created_at,
        icon: 'ticket'
      }));

      return {
        stats: {
          pendingVetting: unvettedCount,
          pendingJobs: submittedJobsCount || 0,
          activeContracts: activeContractsCount || 0,
          outstandingInvoices: invoicesData?.length || 0,
          openTickets: openTicketsCount || 0,
          pendingInterviews: pendingInterviewsCount || 0,
          invoiceTotal: invoiceSum,
          assignedHired: hiredCount,
        },
        queues: {
          talents: pendingProfiles.map((p: any) => ({
            ...p.talents,
            id: p.id,
            vetting_status: p.status.toLowerCase(),
            created_at: p.submitted_at || p.created_at
          })) || [],
          jobs: pendingJobsData || [],
          tickets: openTicketsData || [],
        },
        recentActivity: activities
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 10),
        vettingVersion: currentVersion,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const handleApproveJob = async (jobId: string) => {
    try {
      await supabase.from("jobs").update({ status: "published", published_at: new Date().toISOString() } as any).eq("id", jobId);
      refetch();
    } catch (error) {
      console.error("Error approving job:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'unvetted':
      case 'submitted':
      case 'open':
      case 'pending':
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20 border-0 text-xs font-normal px-2 py-0.5">{status}</Badge>;
      case 'in_progress':
      case 'active':
      case 'published':
        return <Badge className="bg-success/10 text-success hover:bg-success/20 border-0 text-xs font-normal px-2 py-0.5">{status}</Badge>;
      case 'rejected':
      case 'overdue':
      case 'closed':
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-0 text-xs font-normal px-2 py-0.5">{status}</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground hover:bg-muted border-0 text-xs font-normal px-2 py-0.5">{status}</Badge>;
    }
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { stats, queues, recentActivity, vettingVersion } = dashboardData || { 
    stats: { pendingVetting: 0, pendingJobs: 0, activeContracts: 0, outstandingInvoices: 0, openTickets: 0, pendingInterviews: 0, invoiceTotal: 0, assignedHired: 0 },
    queues: { talents: [], jobs: [], tickets: [] },
    recentActivity: [],
    vettingVersion: "v2"
  };

  return (
    <div className="space-y-8 w-full max-w-none px-6 lg:px-10 pb-20 font-inter">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-6">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {isTalentManager ? "Talent Manager Dashboard" : (viewMode === "personal" ? "My Dashboard" : "Platform Overview")}
            </h1>
            {userRole === "super_admin" && (
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 ml-4">
                <button
                  onClick={() => setViewMode("personal")}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
                    viewMode === "personal"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Personal
                </button>
                <button
                  onClick={() => setViewMode("global")}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${
                    viewMode === "global"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Global
                </button>
              </div>
            )}
          </div>
          <p className="text-base text-slate-500 font-medium mt-2">
            {viewMode === "personal" 
              ? "Tracking your assigned talents and recruitment progress." 
              : "Operational summary of all activity across the platform."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()} className="h-11 px-5 rounded-xl border-slate-200 text-slate-600 bg-white font-bold gap-2">
            <RefreshCw className={`h-4 w-4 text-slate-400 ${isFetching ? 'animate-spin' : ''}`} />
            Sync Dashboard
          </Button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
        <Link to={getInternalPath("/admin/talents")} className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-400 transition-all text-left">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <UserCheck className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            {viewMode === "personal" ? "Vetting Queue" : "Pending Vetting"}
          </p>
          <p className="text-3xl font-extrabold text-slate-900">{stats.pendingVetting}</p>
        </Link>

        {viewMode === "personal" && (
          <div className="group rounded-xl border border-indigo-200 bg-indigo-50/30 p-6 shadow-sm transition-all text-left">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white mb-4">
              <UserCheck className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Talents Hired</p>
            <p className="text-3xl font-extrabold text-indigo-900">{stats.assignedHired}</p>
          </div>
        )}

        <Link to={getInternalPath("/admin/jobs")} className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-400 transition-all text-left">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Briefcase className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Job Approvals</p>
          <p className="text-3xl font-extrabold text-slate-900">{stats.pendingJobs}</p>
        </Link>

        <Link to={getInternalPath("/admin/contracts")} className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-400 transition-all text-left">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Contracts</p>
          <p className="text-3xl font-extrabold text-slate-900">{stats.activeContracts}</p>
        </Link>
        
        <Link to={getInternalPath("/admin/invoices")} className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-400 transition-all text-left">
          <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 mb-4 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <Receipt className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unpaid Invoices</p>
          <p className="text-3xl font-extrabold text-slate-900">{stats.outstandingInvoices}</p>
        </Link>

        <Link to={getInternalPath("/admin/support")} className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-400 transition-all text-left">
          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors">
            <MessageSquare className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Open Tickets</p>
          <p className="text-3xl font-extrabold text-slate-900">{stats.openTickets}</p>
        </Link>

        <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-left">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
            <Calendar className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Interviews</p>
          <p className="text-3xl font-extrabold text-slate-900">{stats.pendingInterviews}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Main Operational Column */}
        <div className="xl:col-span-3 space-y-8">
          
          {/* QUEUE 1: Talent Vetting */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 py-5 px-8 flex flex-row items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Users className="h-4 w-4 text-slate-400" />
                Vetting Hotlist
              </h3>
              <Link to={getInternalPath("/admin/vetting")}>
                <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">
                  View Full Queue <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="p-0">
              {queues.talents.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500 font-medium bg-white">No talents pending vetting.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/30">
                    <TableRow className="border-slate-100">
                      <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest py-4 px-8">Talent Name</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest py-4 px-8">Core Role</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest py-4 px-8">Submission Date</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest py-4 px-8">Status</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest py-4 px-8 text-right">Review</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queues.talents.map((t) => (
                      <TableRow key={t.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4 px-8 text-sm font-bold text-slate-900">{t.first_name} {t.last_name}</TableCell>
                        <TableCell className="py-4 px-8 text-sm text-slate-500 font-medium">{t.primary_role || 'General Ops'}</TableCell>
                        <TableCell className="py-4 px-8 text-sm text-slate-400 font-medium">{new Date(t.created_at || '').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</TableCell>
                        <TableCell className="py-4 px-8">{getStatusBadge(t.vetting_status || 'unvetted')}</TableCell>
                        <TableCell className="py-4 px-8 text-right">
                          <Link to={getInternalPath(vettingVersion === "v2" ? `/admin/vetting/${t.id}` : `/admin/talents/${t.id}`)}>
                            <Button variant="outline" size="sm" className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest border-slate-200">Review Profile</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* QUEUE 2: Job Approvals */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 py-5 px-8 flex flex-row items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-slate-400" />
                Opportunities Pending Approval
              </h3>
              <Link to={getInternalPath("/admin/jobs")}>
                <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">
                  Manage All Jobs <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="p-0">
              {queues.jobs.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500 font-medium bg-white">No jobs pending approval.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/30">
                    <TableRow className="border-slate-100">
                      <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest py-4 px-8">Listing Title</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest py-4 px-8">Client Entity</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest py-4 px-8">Model</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest py-4 px-8">Posted</TableHead>
                      <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest py-4 px-8 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queues.jobs.map((j) => (
                      <TableRow key={j.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4 px-8 text-sm font-bold text-slate-900">{j.title}</TableCell>
                        <TableCell className="py-4 px-8 text-sm text-slate-500 font-medium">{j.clients?.company_name || 'Standard Client'}</TableCell>
                        <TableCell className="py-4 px-8 text-sm text-slate-500 font-bold uppercase text-[10px] tracking-widest">{j.service_model?.replace('_', ' ')}</TableCell>
                        <TableCell className="py-4 px-8 text-sm text-slate-400 font-medium">{new Date(j.created_at || '').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</TableCell>
                        <TableCell className="py-4 px-8 text-right flex justify-end gap-3">
                          <Link to={getInternalPath(`/admin/jobs/${j.id}`)}>
                            <Button variant="outline" size="sm" className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest border-slate-200">View</Button>
                          </Link>
                          <Button variant="default" size="sm" className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-sm" onClick={() => handleApproveJob(j.id)}>Publish</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

        </div>

        {/* Right Action & Info Column */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 px-1">Quick Tools</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <Button variant="outline" className="justify-start h-11 text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-50/50 hover:bg-white border-slate-100 hover:border-slate-200 transition-all px-4 rounded-lg">
                <UserCheck className="mr-3 h-4 w-4 text-blue-500" />
                Add New Talent
              </Button>
              <Link to={getInternalPath("/admin/jobs/new")}>
                <Button variant="outline" className="justify-start w-full h-11 text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-50/50 hover:bg-white border-slate-100 hover:border-slate-200 transition-all px-4 rounded-lg">
                  <Briefcase className="mr-3 h-4 w-4 text-amber-500" />
                  Create Posting
                </Button>
              </Link>
              <Button variant="outline" className="justify-start h-11 text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-50/50 hover:bg-white border-slate-100 hover:border-slate-200 transition-all px-4 rounded-lg">
                <FileText className="mr-3 h-4 w-4 text-emerald-500" />
                Gen Contract
              </Button>
              <Button variant="outline" className="justify-start h-11 text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-50/50 hover:bg-white border-slate-100 hover:border-slate-200 transition-all px-4 rounded-lg">
                <MessageSquare className="mr-3 h-4 w-4 text-indigo-500" />
                Live Support
              </Button>
            </div>
          </div>

          {/* Finance Snapshot */}
          <div className="rounded-xl border-none bg-slate-900 text-white shadow-xl shadow-slate-200 p-8 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
            <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Wallet className="h-4 w-4 text-emerald-400" />
                    </div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liquidity Status</h3>
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Awaiting Collection</p>
                <div className="flex items-end gap-3 mb-8">
                    <p className="text-4xl font-black tracking-tight tracking-tighter">₦{stats.invoiceTotal.toLocaleString()}</p>
                </div>
                <Link to={getInternalPath("/admin/invoices")}>
                    <Button variant="outline" className="w-full h-11 bg-white/5 border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all rounded-lg">
                    Reconciliation Hub <ArrowRight className="h-3 w-3 ml-2" />
                    </Button>
                </Link>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="py-5 px-6 border-b border-slate-100 flex items-center gap-3">
              <Clock className="h-4 w-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Real-time Activity</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
                <div key={i} className="p-5 flex gap-4 items-start hover:bg-slate-50 transition-colors">
                  <div className="mt-0.5 p-2 rounded-lg bg-slate-50 shrink-0 border border-slate-100 group-hover:bg-white">
                    {activity.icon === 'offer' && <Wallet className="h-3.5 w-3.5 text-emerald-500" />}
                    {activity.icon === 'user' && <Users className="h-3.5 w-3.5 text-blue-500" />}
                    {activity.icon === 'job' && <Briefcase className="h-3.5 w-3.5 text-amber-500" />}
                    {activity.icon === 'ticket' && <AlertCircle className="h-3.5 w-3.5 text-rose-500" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 leading-none">{activity.type}</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{activity.description}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 pt-0.5">
                      {new Date(activity.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-sm text-slate-500 font-bold bg-white">No platform activity.</div>
              )}
            </div>
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                <Button variant="ghost" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900">
                    Scroll for more
                </Button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
