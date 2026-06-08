import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, Clock, FileText, MessageSquare,
  HelpCircle, ArrowRight, Bell, CheckCircle,
  AlertCircle, Check, Copy, ChevronRight,
  Video, DollarSign, X, LayoutDashboard,
  ExternalLink, ChevronLeft, Info, MoreVertical,
  MapPin, User, Calendar
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import clsx from "clsx";
import { format } from "date-fns";
import { ProfileStatusBanner } from "@/components/talent/ProfileStatusBanner";
import { sendTalentEmailVerifiedEmail } from "@/lib/email/triggers";
import { useEffect, useRef } from "react";
import { getInternalPath } from "@/utils/subdomain";


interface TalentData {
  id: string;
  talent_id: string;
  first_name: string;
  last_name: string;
  email: string;
  primary_role: string;
  vetting_status: string;
  onboarding_completed: boolean;
  onboarding_status: string;
  current_step: number;
  profile_completion?: number;
  profile_change_status?: string;
  changed_sections?: string[];
}



interface Step {
  id: string;
  step_key: string;
  status: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  action_url?: string;
}

interface DashboardStats {
  applications: number;
  activeAssignments: number;
  pendingTimesheets: number;
  activeShortlists: number;
  openTickets: number;
  upcomingInterviews: number;
  pendingInterviews: number;
}


const TalentDashboard = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [hideBanner, setHideBanner] = useState(() => {
    return sessionStorage.getItem('hide_profile_banner_session') === 'true';
  });

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['talentDashboard', user?.id],
    queryFn: async () => {
      // ... previous logic ...
      if (!user?.id) return null;

      let { data: talentData } = await (supabase
        .from("talents")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle() as any);

      if (!talentData) {
        // Fallback robust ID generation if RPC fails or returns concurrently identical values
        const fallbackId = `TAS-VA-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        const { data: talentIdData } = await (supabase.rpc("generate_talent_id") as any);
        const generatedTalentId = talentIdData || fallbackId;
        
        const firstName = user.user_metadata?.first_name || user.user_metadata?.firstName || "User";
        const lastName = user.user_metadata?.last_name || user.user_metadata?.lastName || "";

        const { data: newTalent, error } = await (supabase
          .from("talents")
          .insert({
            user_id: user.id,
            talent_id: generatedTalentId,
            first_name: firstName,
            last_name: lastName,
            email: user.email || "",
            onboarding_completed: false,
            onboarding_status: "draft",
            current_step: 1,
          } as any)
          .select()
          .single() as any);

        // If insert fails due to unique constraint on talent_id concurrently, retry with fallback
        if (error?.code === '23505') {
            const { data: retryTalent, error: retryError } = await (supabase
              .from("talents")
              .insert({
                user_id: user.id,
                talent_id: fallbackId,
                first_name: firstName,
                last_name: lastName,
                email: user.email || "",
                onboarding_completed: false,
                onboarding_status: "draft",
                current_step: 1,
              } as any)
              .select()
              .single() as any);
              
            if (retryError) throw retryError;
            talentData = retryTalent;
        } else if (error) {
            throw error;
        } else {
            talentData = newTalent;
        }
      } else {
        const currentTalent: any = talentData;
        if (!currentTalent.first_name || currentTalent.first_name === "User") {
          const firstName = user.user_metadata?.first_name || user.user_metadata?.firstName || "User";
          const lastName = user.user_metadata?.last_name || user.user_metadata?.lastName || "";

          if (firstName !== "User") {
            const { data: updatedTalent } = await (supabase
              .from("talents" as any)
              .update({ first_name: firstName, last_name: lastName } as any)
              .eq("id", currentTalent.id)
              .select()
              .single() as any);
            if (updatedTalent) talentData = updatedTalent;
          }
        }
      }

      const [v2AppsRes, v2ShortlistsRes, contractsRes, timesheetsRes, ticketsRes, openRequestsRes, profileRes, profileV2Res, sectionsRes, interviewsRes] = await Promise.all([
        (supabase.from("hr_v2_applications" as any).select("hire_request_id").eq("talent_user_id", user.id) as any),
        (supabase.from("hr_v2_shortlists" as any).select("hire_request_id, status").eq("talent_user_id", user.id) as any),
        (supabase.from("contracts" as any).select("*", { count: "exact", head: true }).eq("talent_id", (talentData as any).id).eq("status", "active") as any),
        (supabase.from("timesheets" as any).select("*", { count: "exact", head: true }).eq("talent_id", (talentData as any).id).eq("status", "draft") as any),
        (supabase.from("support_tickets" as any).select("*", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["open", "in_progress"]) as any),
        supabase.from("hr_v2_hire_requests").select("id, title, role_summary, created_at").eq("status", "published").order("created_at", { ascending: false }).limit(3),
        (supabase.from("profiles" as any).select("*").eq("user_id", user.id).maybeSingle() as any),
        (supabase.from("v2_talent_profiles" as any).select("*").eq("user_id", user.id).maybeSingle() as any),
        (supabase.from("v2_profile_sections" as any).select("*").eq("user_id", user.id) as any),
        (supabase.from("hr_v2_interviews" as any).select("id, status, scheduled_time").eq("talent_user_id", user.id) as any),
      ]);

      const uniqueAppIds = new Set([
        ...(v2AppsRes.data || []).map(a => a.hire_request_id),
        ...(v2ShortlistsRes.data || []).map(s => s.hire_request_id)
      ]);
      const applicationsCount = uniqueAppIds.size;
      const activeShortlistCount = (v2ShortlistsRes.data || []).filter(s => s.status !== 'rejected' && s.status !== 'withdrawn').length;

      const baseProfile = (profileRes as any).data;
      const profile = (profileV2Res as any).data;
      const sections = (sectionsRes as any).data || [];
      let managerName = "";
      let managerEmail = "";
      if (profile?.talent_manager_admin_id) {
        const { data: managerData } = await (supabase.from("admin_users" as any).select("full_name, email").eq("id", profile.talent_manager_admin_id).maybeSingle() as any);
        if (managerData) {
          managerName = managerData.full_name || "Admin";
          managerEmail = managerData.email || "";
        }
      }

      const allInterviews: any[] = (interviewsRes as any)?.data || [];
      const upcomingInterviews = allInterviews.filter((i: any) =>
        (i.status === "scheduled" || i.status === "accepted") &&
        i.scheduled_time && new Date(i.scheduled_time) >= new Date()
      ).length;
      const pendingInterviews = allInterviews.filter((i: any) =>
        i.status === "pending" || i.status === "reschedule_requested"
      ).length;

      return {
        talent: talentData ? {
          ...(talentData as any),
          vetting_status: profile?.status || (talentData as any).vetting_status || "DRAFT",
          onboarding_status: profile?.status === "DRAFT" ? "draft" : "submitted",
          current_step: profile?.current_step || (talentData as any).current_step || 1,
          profile_completion: profile?.completion_percent || (talentData as any).profile_completion || 0,
          assigned_manager_name: managerName,
          assigned_manager_email: managerEmail
        } : null,
        stats: {
          applications: applicationsCount || 0,
          activeAssignments: (contractsRes as any).count || 0,
          pendingTimesheets: (timesheetsRes as any).count || 0,
          activeShortlists: activeShortlistCount || 0,
          openTickets: (ticketsRes as any).count || 0,
          upcomingInterviews,
          pendingInterviews,
        } as DashboardStats,
        opportunities: openRequestsRes.data || [],
        profile: profile,
        baseProfile: baseProfile,
        sections: sections
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 1, // 1 minute cache
  });
 
  const { talent, stats, opportunities, profile, baseProfile, sections } = (dashboardData as any) || {
    talent: null,
    stats: { applications: 0, activeAssignments: 0, pendingTimesheets: 0, activeShortlists: 0, openTickets: 0, upcomingInterviews: 0, pendingInterviews: 0 },
    opportunities: [],
    profile: null,
    baseProfile: null,
    sections: []
  };


  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 m-4 rounded-md font-mono text-sm max-w-full overflow-auto">
        Error loading dashboard: {JSON.stringify(error, null, 2)}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const copyId = () => {
    if (talent?.talent_id) {
      navigator.clipboard.writeText(talent.talent_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in font-light">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">
            Welcome back, {talent?.first_name || "User"}
          </h1>
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-xs text-slate-400 font-light flex items-center gap-2">
              <span>You have <span className="text-slate-900 font-medium">{stats.activeShortlists || 0} active shortlists</span> and <span className="text-slate-900 font-medium">{stats.openTickets || 0} active support tickets</span>.</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Link to={getInternalPath("/talent/profile")}>
            <Button variant="outline" className="h-9 gap-2 text-[12px] font-medium border-slate-200">
              <User className="h-3.5 w-3.5" /> View Profile
            </Button>
          </Link>
          <Link to={getInternalPath("/talent/jobs")}>
            <Button className="h-9 gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold shadow-sm">
              <Briefcase className="h-3.5 w-3.5" /> Browse Jobs
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {talent?.talent_id && (
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Talent ID</span>
            <div className="h-3 w-px bg-slate-200" />
            <span className="text-[13px] font-mono font-bold text-slate-900">{talent.talent_id}</span>
            <button onClick={copyId} className="ml-2 h-6 w-6 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all">
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        )}
        {talent?.assigned_manager_name && (
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Talent Manager</span>
            <div className="h-3 w-px bg-blue-200" />
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <span className="text-[13px] font-semibold text-blue-900">{talent.assigned_manager_name}</span>
              {talent.assigned_manager_email && (
                <span className="text-[11px] text-blue-600/70 font-medium font-mono">{talent.assigned_manager_email}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── KPI Numeric Strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-6">
        {[
          { label: "Active Contracts", value: stats.activeAssignments, icon: FileText, color: "blue" },
          { label: "Pending Timesheets", value: stats.pendingTimesheets, icon: Clock, color: "indigo" },
          { label: "Job Applications", value: stats.applications, icon: Briefcase, color: "emerald" },
          { label: "Active Shortlists", value: stats.activeShortlists, icon: FileText, color: "cyan" },
        ].map((kpi) => (
          <div key={kpi.label} className="p-4 bg-white border border-slate-200/60 rounded-xl space-y-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] transition-all hover:border-slate-300">
             <div className={`h-8 w-8 rounded-lg bg-${kpi.color}-50 flex items-center justify-center text-${kpi.color}-600 border border-${kpi.color}-100/50`}>
               <kpi.icon className="h-4 w-4" />
             </div>
             <div className="space-y-0.5">
               <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-0.5">{kpi.label}</p>
               <p className="text-xl font-bold text-slate-900 leading-none">{kpi.value || 0}</p>
             </div>
          </div>
        ))}
      </div>


      {/* ── Dashboard Grid Section ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        
        {/* Opportunities Row */}
        <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] flex flex-col h-full hover:shadow-xs transition-shadow">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest leading-none">Opportunities</h3>
            <Link to={getInternalPath("/talent/jobs")} className="h-7 px-3 bg-white hover:bg-slate-900 border border-slate-200 hover:border-slate-900 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-all">View All</Link>
          </div>
          <div className="flex-1 flex flex-col divide-y divide-slate-100/50">
            {opportunities && opportunities.length > 0 ? (
               opportunities.map((opp: any) => (
                 <div key={opp.id} className="px-5 py-3.5 hover:bg-slate-50/50 transition-all flex items-center gap-3.5 group">
                    <div className="flex-shrink-0 h-9 w-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
                      <Briefcase className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h4 className="text-[13px] font-bold text-slate-900 truncate">{opp.title}</h4>
                      <p className="text-[11.5px] text-slate-400 font-medium line-clamp-1">{opp.role_summary || "Open role"}</p>
                    </div>
                    <Link to={getInternalPath(`/talent/jobs/${opp.id}`)} className="flex-shrink-0 h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 border border-slate-150 transition-all">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                 </div>
               ))
            ) : (
                <div className="px-6 py-10 text-center space-y-4">
                  <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-slate-100">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[12.5px] text-slate-500 font-medium">Your career hunt begins here.</p>
                  </div>
                  <Button className="h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all" asChild>
                    <Link to={getInternalPath("/talent/jobs")}>Find Opportunities</Link>
                  </Button>
                </div>
            )}
          </div>
        </div>

        {/* Active Contracts Row */}
        <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] flex flex-col h-full hover:shadow-xs transition-shadow">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest leading-none">Contracts</h3>
            <Link to={getInternalPath("/talent/contracts")} className="h-7 px-3 bg-white hover:bg-slate-900 border border-slate-200 hover:border-slate-900 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-all">View All</Link>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {stats.activeAssignments > 0 ? (
               <div className="px-6 py-10 text-center space-y-4">
                 <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-slate-100">
                    <FileText className="h-6 w-6" />
                 </div>
                 <div className="space-y-1">
                   <p className="text-[13px] font-bold text-slate-900">You have {stats.activeAssignments} Active Assignments</p>
                   <p className="text-[12px] text-slate-500 font-medium">Manage your deliverables and timelines efficiently.</p>
                 </div>
                 <div className="pt-1">
                   <Button variant="outline" className="h-9 border-slate-200 rounded-lg text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all" asChild>
                     <Link to={getInternalPath("/talent/contracts")}>Open Workspace</Link>
                   </Button>
                 </div>
               </div>
            ) : (
                <div className="px-6 py-12 text-center space-y-3">
                  <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-slate-100">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Quiet Period</p>
                    <p className="text-[12px] text-slate-500 font-medium">No active work assignments currently active.</p>
                  </div>
                </div>

            )}
          </div>
        </div>

        {/* Interviews Row */}
        <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] flex flex-col h-full hover:shadow-xs transition-shadow">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest leading-none">Interviews</h3>
            <Link to={getInternalPath("/talent/interviews")} className="h-7 px-3 bg-white hover:bg-slate-900 border border-slate-200 hover:border-slate-900 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-all">Schedule</Link>
          </div>
          <div className="flex-1 flex flex-col justify-center p-4">
            {(stats.upcomingInterviews > 0 || stats.pendingInterviews > 0) ? (
               <Link to={getInternalPath("/talent/interviews")} className="group block border border-slate-100 bg-slate-50/50 rounded-xl p-5 hover:bg-slate-50 hover:border-blue-200 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                      <Video className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                         <span className="text-[13px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Upcoming Interviews</span>
                         <span className="text-[13px] font-bold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">{stats.upcomingInterviews}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[13px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Pending Requests</span>
                         <span className="text-[13px] font-bold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">{stats.pendingInterviews}</span>
                      </div>
                    </div>
                  </div>
               </Link>
            ) : (
              <div className="px-6 py-12 text-center space-y-3">
                <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-slate-100">
                  <Video className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ready for Calls</p>
                  <p className="text-[12px] text-slate-500 font-medium">No screenings or technical rounds on the horizon.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default TalentDashboard;
