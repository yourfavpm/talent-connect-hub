import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  
  const [stats, setStats] = useState({
    pendingVetting: 0,
    pendingJobs: 0,
    activeContracts: 0,
    outstandingInvoices: 0,
    openTickets: 0,
    pendingInterviews: 0,
    invoiceTotal: 0,
    assignedHired: 0, // New stat: talents assigned to me that are hired
  });

  const [queues, setQueues] = useState<{
    talents: Talent[];
    jobs: Job[];
    tickets: Ticket[];
  }>({ talents: [], jobs: [], tickets: [] });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vettingVersion, setVettingVersion] = useState<"v1" | "v2">("v2");

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, viewMode]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: versionRow } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "vetting_system_version")
        .maybeSingle() as { data: any | null };
      const currentVersion = (versionRow?.value as "v1" | "v2") ?? "v2";
      setVettingVersion(currentVersion);

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
            .in("user_id", userIds) as { data: any[] | null };
          
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
        let query = (supabase.from("talent_profiles" as any) as any)
          .select("*, talents(*)", { count: "exact" })
          .in("status", ["SUBMITTED", "RESUBMITTED", "VETTING_IN_PROGRESS"]);

        if (isPersonal) {
          query = query.eq("assigned_admin_id", user.id);
        }

        const { data: v1Profiles, count: v1Count } = await query.order("last_action_at", { ascending: false });
        
        unvettedCount = v1Count || 0;
        pendingProfiles = (v1Profiles || []).slice(0, 5);
      }

      // 2. Fetch Hired Stats for Personal View
      let hiredCount = 0;
      if (isPersonal) {
        // Find talents assigned to me who have active contracts
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
            .in("talent_id", uids); // Assuming contract talent_id is user_id or linked to talent record user_id
          
          hiredCount = count || 0;
        }
      }

      // 3. Fetch other queue tables (Jobs & Tickets are usually global or business-unit wide, but we'll keep them 5)
      const [
        { data: pendingJobsData },
        { data: openTicketsData },
      ] = await Promise.all([
        isTalentManager
          ? Promise.resolve({ data: [] as any[] } as any)
          : supabase.from("jobs").select("*, clients(company_name)").in("status", ["submitted", "under_review"]).order("created_at", { ascending: false }).limit(5),
        isTalentManager
          ? Promise.resolve({ data: [] as any[] } as any)
          : supabase.from("support_tickets").select("*").in("status", ["open", "in_progress"]).order("created_at", { ascending: false }).limit(5),
      ]);

      setQueues({
        talents: pendingProfiles.map((p: any) => ({
          ...p.talents,
          id: p.id,
          vetting_status: p.status.toLowerCase(),
          created_at: p.submitted_at || p.created_at
        })) || [],
        jobs: pendingJobsData || [],
        tickets: openTicketsData || [],
      });

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
        isTalentManager ? Promise.resolve({ count: 0 } as any) : supabase.from("jobs").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
        isTalentManager ? Promise.resolve({ count: 0 } as any) : supabase.from("contracts").select("id", { count: "exact", head: true }).eq("status", "active"),
        isTalentManager ? Promise.resolve({ data: [] } as any) : supabase.from("invoices").select("total_amount, status").neq("status", "paid"),
        isTalentManager ? Promise.resolve({ count: 0 } as any) : supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "scheduled"), 
        isTalentManager ? Promise.resolve({ data: [] } as any) : supabase.from("offers").select("*, talents(first_name, last_name)").order("created_at", { ascending: false }).limit(5),
        (isTalentManager
          ? supabase.from("v2_talent_profiles").select("*, talents:talents(first_name, last_name, email)").eq("talent_manager_admin_id", user.id)
          : supabase.from("v2_talent_profiles").select("*, talents:talents(first_name, last_name, email)"))
          .order("created_at", { ascending: false }).limit(5),
        isTalentManager ? Promise.resolve({ data: [] } as any) : supabase.from("jobs").select("*, clients(company_name)").order("created_at", { ascending: false }).limit(5),
        isTalentManager ? Promise.resolve({ data: [] } as any) : supabase.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(5)
      ]);

      const invoiceSum = (invoicesData || []).reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0);

      setStats({
        pendingVetting: unvettedCount,
        pendingJobs: submittedJobsCount || 0,
        activeContracts: activeContractsCount || 0,
        outstandingInvoices: invoicesData?.length || 0,
        openTickets: openTicketsCount || 0,
        pendingInterviews: pendingInterviewsCount || 0,
        invoiceTotal: invoiceSum,
        assignedHired: hiredCount,
      });

      // Enrich recent activity
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

      setRecentActivity(
        activities
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 10)
      );

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveJob = async (jobId: string) => {
    try {
      await supabase.from("jobs").update({ status: "published", published_at: new Date().toISOString() } as any).eq("id", jobId);
      fetchDashboardData();
    } catch (error) {
      console.error("Error approving job:", error);
    }
  };

  const hasAccess = (roles: string[]) => !userRole || roles.includes(userRole);

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {isTalentManager ? "Talent Manager Dashboard" : (viewMode === "personal" ? "My Dashboard" : "Admin Overview")}
            </h1>
            {userRole === "super_admin" && (
              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 ml-2">
                <button
                  onClick={() => setViewMode("personal")}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                    viewMode === "personal"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Personal
                </button>
                <button
                  onClick={() => setViewMode("global")}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                    viewMode === "global"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Global
                </button>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {viewMode === "personal" 
              ? "Tracking your assigned talents and recruitment progress." 
              : "Operational summary across the entire platform."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDashboardData} className="h-9 px-3 text-gray-600">
            <RefreshCw className="h-4 w-4 mr-2 text-gray-400" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Link to={getInternalPath("/admin/talents")} className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 hover:shadow transition-all text-left">
          <div className="flex items-center justify-between mb-3">
            <UserCheck className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            {viewMode === "personal" ? "My Pending Vetting" : "Pending Vetting"}
          </p>
          <p className="text-2xl font-semibold text-gray-900">{stats.pendingVetting}</p>
        </Link>

        {viewMode === "personal" && (
          <div className="group rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 shadow-sm hover:border-brand-primary/30 transition-all text-left">
            <div className="flex items-center justify-between mb-3">
              <UserCheck className="h-4 w-4 text-brand-primary" />
            </div>
            <p className="text-xs font-medium text-brand-primary/70 mb-1">Talents Hired</p>
            <p className="text-2xl font-semibold text-brand-primary">{stats.assignedHired}</p>
          </div>
        )}

        <Link to={getInternalPath("/admin/jobs")} className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 hover:shadow transition-all text-left">
          <div className="flex items-center justify-between mb-3">
            <Briefcase className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">Jobs for Approval</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.pendingJobs}</p>
        </Link>

        <Link to={getInternalPath("/admin/contracts")} className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 hover:shadow transition-all text-left">
          <div className="flex items-center justify-between mb-3">
            <FileText className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">Active Contracts</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.activeContracts}</p>
        </Link>
        
        <Link to={getInternalPath("/admin/invoices")} className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 hover:shadow transition-all text-left">
          <div className="flex items-center justify-between mb-3">
            <Receipt className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">Unpaid Invoices</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.outstandingInvoices}</p>
        </Link>

        <Link to={getInternalPath("/admin/support")} className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 hover:shadow transition-all text-left">
          <div className="flex items-center justify-between mb-3">
            <MessageSquare className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">Open Tickets</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.openTickets}</p>
        </Link>

        <div className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-left">
          <div className="flex items-center justify-between mb-3">
            <Calendar className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">Interviews</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.pendingInterviews}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Operational Column (Left 2/3) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* QUEUE 1: Talent Vetting */}
          <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                Talent Vetting Queue
              </CardTitle>
              <Link to={getInternalPath("/admin/vetting")}>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-600 hover:text-gray-900">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {queues.talents.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No talents pending vetting.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-transparent">
                    <TableRow className="hover:bg-transparent border-gray-100">
                      <TableHead className="font-medium text-xs text-gray-500 py-3">Talent</TableHead>
                      <TableHead className="font-medium text-xs text-gray-500 py-3">Role</TableHead>
                      <TableHead className="font-medium text-xs text-gray-500 py-3">Submitted</TableHead>
                      <TableHead className="font-medium text-xs text-gray-500 py-3">Status</TableHead>
                      <TableHead className="font-medium text-xs text-gray-500 py-3 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queues.talents.map((t) => (
                      <TableRow key={t.id} className="border-gray-100">
                        <TableCell className="py-3 text-sm font-medium text-gray-900">{t.first_name} {t.last_name}</TableCell>
                        <TableCell className="py-3 text-sm text-gray-600">{t.primary_role || 'General'}</TableCell>
                        <TableCell className="py-3 text-sm text-gray-600">{new Date(t.created_at || '').toLocaleDateString()}</TableCell>
                        <TableCell className="py-3">{getStatusBadge(t.vetting_status || 'unvetted')}</TableCell>
                        <TableCell className="py-3 text-right">
                          <Link to={getInternalPath(vettingVersion === "v2" ? `/admin/vetting/${t.id}` : `/admin/talents/${t.id}`)}>
                            <Button variant="secondary" size="sm" className="h-7 px-3 text-xs">Review</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* QUEUE 2: Job Approvals */}
          <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                Job Approval Queue
              </CardTitle>
              <Link to={getInternalPath("/admin/jobs")}>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-600 hover:text-gray-900">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {queues.jobs.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No jobs pending approval.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-transparent">
                    <TableRow className="hover:bg-transparent border-gray-100">
                      <TableHead className="font-medium text-xs text-gray-500 py-3">Job Title</TableHead>
                      <TableHead className="font-medium text-xs text-gray-500 py-3">Client</TableHead>
                      <TableHead className="font-medium text-xs text-gray-500 py-3">Type</TableHead>
                      <TableHead className="font-medium text-xs text-gray-500 py-3">Submitted</TableHead>
                      <TableHead className="font-medium text-xs text-gray-500 py-3 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queues.jobs.map((j) => (
                      <TableRow key={j.id} className="border-gray-100">
                        <TableCell className="py-3 text-sm font-medium text-gray-900">{j.title}</TableCell>
                        <TableCell className="py-3 text-sm text-gray-600">{j.clients?.company_name || 'Internal'}</TableCell>
                        <TableCell className="py-3 text-sm text-gray-600 capitalize">{j.service_model?.replace('_', ' ')}</TableCell>
                        <TableCell className="py-3 text-sm text-gray-600">{new Date(j.created_at || '').toLocaleDateString()}</TableCell>
                        <TableCell className="py-3 text-right flex justify-end gap-2">
                          <Link to={getInternalPath(`/admin/jobs/${j.id}`)}>
                            <Button variant="outline" size="sm" className="h-7 px-3 text-xs">Review</Button>
                          </Link>
                          <Button variant="default" size="sm" className="h-7 px-3 text-xs" onClick={() => handleApproveJob(j.id)}>Approve</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* QUEUE 3: Support Tickets */}
          <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500" />
                Active Support Tickets
              </CardTitle>
              <Link to={getInternalPath("/admin/support")}>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-600 hover:text-gray-900">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {queues.tickets.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No active support tickets.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-transparent">
                    <TableRow className="hover:bg-transparent border-gray-100">
                      <TableHead className="font-medium text-xs text-gray-500 py-3">Subject</TableHead>
                      <TableHead className="font-medium text-xs text-gray-500 py-3">Priority</TableHead>
                      <TableHead className="font-medium text-xs text-gray-500 py-3">Status</TableHead>
                      <TableHead className="font-medium text-xs text-gray-500 py-3 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queues.tickets.map((ticket) => (
                      <TableRow key={ticket.id} className="border-gray-100">
                        <TableCell className="py-3 text-sm font-medium text-gray-900">{ticket.subject}</TableCell>
                        <TableCell className="py-3 text-sm text-gray-600 capitalize">{ticket.priority}</TableCell>
                        <TableCell className="py-3">{getStatusBadge(ticket.status || 'open')}</TableCell>
                        <TableCell className="py-3 text-right">
                          <Link to={getInternalPath(`/admin/support/${ticket.id}`)}>
                            <Button variant="secondary" size="sm" className="h-7 px-3 text-xs">Resolve</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Action & Info Column (Right 1/3) */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <Card className="rounded-xl border border-gray-200 shadow-sm">
            <CardHeader className="py-4 px-5 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="justify-start h-9 text-sm font-normal text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 shadow-none">
                  <UserCheck className="mr-2 h-4 w-4 text-gray-400" />
                  Add Talent
                </Button>
                <Link to={getInternalPath("/admin/jobs/new")}>
                  <Button variant="outline" className="justify-start w-full h-9 text-sm font-normal text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 shadow-none">
                    <Briefcase className="mr-2 h-4 w-4 text-gray-400" />
                    Post Job
                  </Button>
                </Link>
                <Button variant="outline" className="justify-start h-9 text-sm font-normal text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 shadow-none">
                  <FileText className="mr-2 h-4 w-4 text-gray-400" />
                  Create Contract
                </Button>
                <Button variant="outline" className="justify-start h-9 text-sm font-normal text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 shadow-none">
                  <MessageSquare className="mr-2 h-4 w-4 text-gray-400" />
                  Open Support
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Finance Snapshot */}
          <Card className="rounded-xl border border-gray-200 shadow-sm bg-gray-900 text-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-300">Finance Snapshot</h3>
              </div>
              <p className="text-xs text-gray-400 mb-1">Outstanding Invoices</p>
              <div className="flex items-end gap-3 mb-6">
                <p className="text-3xl font-semibold">${stats.invoiceTotal.toLocaleString()}</p>
                <span className="text-sm font-medium text-warning mb-1">{stats.outstandingInvoices} Pending</span>
              </div>
              <Link to={getInternalPath("/admin/invoices")}>
                <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white shadow-none">
                  Go to Finance <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="rounded-xl border border-gray-200 shadow-sm">
            <CardHeader className="py-4 px-5 border-b border-gray-100">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
                  <div key={i} className="p-4 flex gap-3 items-start hover:bg-gray-50 transition-colors">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-gray-50 shrink-0">
                      {activity.icon === 'offer' && <Wallet className="h-3 w-3 text-brand-primary" />}
                      {activity.icon === 'user' && <Users className="h-3 w-3 text-success" />}
                      {activity.icon === 'job' && <Briefcase className="h-3 w-3 text-blue-500" />}
                      {activity.icon === 'ticket' && <AlertCircle className="h-3 w-3 text-warning" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{activity.type}</p>
                      <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{activity.description}</p>
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(activity.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="p-6 text-center text-sm text-gray-500">No recent activity.</div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
