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
  unreadMessages: number;
  openTickets: number;
}


const TalentDashboard = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [hideBanner, setHideBanner] = useState(() => {
    return sessionStorage.getItem('hide_profile_banner_session') === 'true';
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['talentDashboard', user?.id],
    queryFn: async () => {
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
            onboarding_status: "not_started",
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
                onboarding_status: "not_started",
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

      const [applicationsRes, contractsRes, timesheetsRes, messagesRes, ticketsRes, notificationsRes, profileRes, profileV2Res, sectionsRes] = await Promise.all([
        (supabase.from("job_applications" as any).select("*", { count: "exact", head: true }).eq("talent_id", (talentData as any).id) as any),
        (supabase.from("contracts" as any).select("*", { count: "exact", head: true }).eq("talent_id", (talentData as any).id).eq("status", "active") as any),
        (supabase.from("timesheets" as any).select("*", { count: "exact", head: true }).eq("talent_id", (talentData as any).id).eq("status", "draft") as any),
        (supabase.from("messages" as any).select("*", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null) as any),
        (supabase.from("support_tickets" as any).select("*", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["open", "in_progress"]) as any),
        (supabase.from("notifications" as any).select("*").eq("user_id", user.id).order('created_at', { ascending: false }).limit(5) as any),
        (supabase.from("profiles" as any).select("*").eq("user_id", user.id).maybeSingle() as any),
        (supabase.from("v2_talent_profiles" as any).select("*").eq("user_id", user.id).maybeSingle() as any),
        (supabase.from("v2_profile_sections" as any).select("*").eq("user_id", user.id) as any)
      ]);

      const baseProfile = (profileRes as any).data;
      const profile = (profileV2Res as any).data;
      const sections = (sectionsRes as any).data || [];
      let managerName = "";
      if (profile?.talent_manager_admin_id) {
        const { data: managerData } = await (supabase.from("profiles" as any).select("first_name, last_name").eq("id", profile.talent_manager_admin_id).maybeSingle() as any);
        if (managerData) {
          managerName = `${managerData.first_name || ""} ${managerData.last_name || ""}`.trim();
        }
      }
 
      return {
        talent: talentData ? {
          ...(talentData as any),
          vetting_status: profile?.status || (talentData as any).vetting_status || "DRAFT",
          onboarding_status: profile?.status === "DRAFT" ? "not_started" : "submitted",
          current_step: profile?.current_step || (talentData as any).current_step || 1,
          profile_completion: profile?.completion_percent || (talentData as any).profile_completion || 0,
          assigned_manager_name: managerName
        } : null,
        stats: {
          applications: (applicationsRes as any).count || 0,
          activeAssignments: (contractsRes as any).count || 0,
          pendingTimesheets: (timesheetsRes as any).count || 0,
          unreadMessages: (messagesRes as any).count || 0,
          openTickets: (ticketsRes as any).count || 0,
        } as DashboardStats,
        notifications: (notificationsRes.data as Notification[]) || [],
        profile: profile,
        baseProfile: baseProfile,
        sections: sections
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 1, // 1 minute cache
  });
 
  const { talent, stats, notifications, profile, baseProfile, sections } = (data as any) || {
    talent: null,
    stats: { applications: 0, activeAssignments: 0, pendingTimesheets: 0, unreadMessages: 0, openTickets: 0 },
    notifications: [],
    profile: null,
    baseProfile: null,
    sections: []
  };

  const verificationTriggered = useRef(false);

  useEffect(() => {
    const triggerVerificationSuccess = async () => {
      if (verificationTriggered.current) return;
      
      // Check if user is verified but we haven't sent the success email
      if (user?.email_confirmed_at && baseProfile && !(baseProfile as any).email_verified_sent) {
        verificationTriggered.current = true;
        try {
          console.log("Triggering verification success email...");
          await sendTalentEmailVerifiedEmail(
            user.email || "",
            talent?.first_name || user.user_metadata?.first_name || "User"
          );
          
          // Mark as sent in DB
          await (supabase
            .from('profiles')
            .update({ email_verified_sent: true } as any)
            .eq('user_id', user.id) as any);
            
        } catch (err) {
          console.error("Failed to send verification success email:", err);
          verificationTriggered.current = false;
        }
      }
    };

    if (user && baseProfile && talent) {
      triggerVerificationSuccess();
    }
  }, [user, baseProfile, talent]);


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
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10 animate-fade-in min-h-screen">
      {/* ── Page Header Strip ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">
            Welcome back, {talent?.first_name || "User"}
          </h1>
          <p className="text-[15px] text-slate-500 font-medium">Here's an overview of your work on OPSlyHR.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/talent/profile" className="h-10 px-5 bg-white border border-slate-200 hover:border-slate-900 rounded-xl flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all shadow-sm">
            View My Profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>





      {/* ── SHARED STATUS BANNER ───────────────────────────────────── */}
      <ProfileStatusBanner 
        status={profile?.status || "draft"}
        progressPercent={profile?.progress_percent || 0}
        requestedSectionsCount={sections.filter((s: any) => s.status === "changes_requested").length}
        vettingLevelText={profile?.vetting_level_text}
        managerName={talent?.assigned_manager_name}
      />

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
      </div>

      {/* ── KPI Numeric Strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-8 bg-white border border-slate-100 rounded-[32px] space-y-4 shadow-sm group hover:border-slate-300 transition-all">
             <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
               <FileText className="h-5 w-5" />
             </div>
             <div className="space-y-0.5">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Contracts</p>
               <p className="text-[32px] font-black text-slate-900 leading-none">{stats.activeAssignments}</p>
             </div>
          </div>
          <div className="p-8 bg-white border border-slate-100 rounded-[32px] space-y-4 shadow-sm group hover:border-slate-300 transition-all">
             <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
               <Video className="h-5 w-5" />
             </div>
             <div className="space-y-0.5">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Interviews</p>
               <p className="text-[32px] font-black text-slate-900 leading-none">0</p>
             </div>
          </div>
          <div className="p-8 bg-white border border-slate-100 rounded-[32px] space-y-4 shadow-sm group hover:border-slate-300 transition-all">
             <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
               <Clock className="h-5 w-5" />
             </div>
             <div className="space-y-0.5">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timesheet Tasks</p>
               <p className="text-[32px] font-black text-slate-900 leading-none">{stats.pendingTimesheets}</p>
             </div>
          </div>
          <div className="p-8 bg-white border border-slate-100 rounded-[32px] space-y-4 shadow-sm group hover:border-slate-300 transition-all">
             <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
               <MessageSquare className="h-5 w-5" />
             </div>
             <div className="space-y-0.5">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unread Messages</p>
               <p className="text-[32px] font-black text-slate-900 leading-none">{stats.unreadMessages}</p>
             </div>
          </div>
      </div>


      {/* ── Dashboard Grid Section ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Contracts Row */}
        <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm flex flex-col h-full">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest leading-none">Contracts</h3>
            <Link to="/talent/contracts" className="h-8 px-4 bg-slate-50 hover:bg-slate-900 border border-slate-100 hover:border-slate-900 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all">View All</Link>
          </div>
          <div className="flex-1 flex flex-col">
            {stats.activeAssignments > 0 ? (
               <div className="px-8 py-12 text-center space-y-4">
                 <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                    <FileText className="h-8 w-8" />
                 </div>
                 <div className="space-y-1">
                   <p className="text-[15px] font-bold text-slate-900">You have {stats.activeAssignments} Active Assignments</p>
                   <p className="text-[13px] text-slate-500 font-medium">Manage your deliverables and timelines efficiently.</p>
                 </div>
                 <div className="pt-2">
                   <Button variant="outline" className="h-10 border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all" asChild>
                     <Link to="/talent/contracts">Open Workspace</Link>
                   </Button>
                 </div>
               </div>
            ) : (
                <div className="px-8 py-16 text-center space-y-4">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-100">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">Quiet Period</p>
                    <p className="text-[13px] text-slate-500 font-medium">No active work assignments currently active.</p>
                  </div>
                </div>

            )}
          </div>
        </div>

        {/* Interviews Row */}
        <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm flex flex-col h-full">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest leading-none">Interviews</h3>
            <Link to="/talent/interviews" className="h-8 px-4 bg-slate-50 hover:bg-slate-900 border border-slate-100 hover:border-slate-900 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all">Schedule</Link>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="px-8 py-16 text-center space-y-4">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-100">
                <Video className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">Ready for Calls</p>
                <p className="text-[13px] text-slate-500 font-medium">No screenings or technical rounds on the horizon.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Applications Row */}
        <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm flex flex-col h-full">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest leading-none">Pipeline</h3>
            <Link to="/talent/applications" className="h-8 px-4 bg-slate-50 hover:bg-slate-900 border border-slate-100 hover:border-slate-900 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all">View All</Link>
          </div>
          <div className="flex-1 flex flex-col">
            {stats.applications > 0 ? (
               <div className="px-8 py-12 text-center space-y-4">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[15px] font-bold text-slate-900">Tracking {stats.applications} Applications</p>
                    <p className="text-[13px] text-slate-500 font-medium italic">Keep an eye on your status updates.</p>
                  </div>
               </div>
            ) : (
                <div className="px-8 py-16 text-center space-y-6">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-100">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[13px] text-slate-500 font-medium">Your career hunt begins here.</p>
                  </div>
                  <Button className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/10" asChild>
                    <Link to="/talent/jobs">Find Opportunities</Link>
                  </Button>
                </div>
            )}
          </div>
        </div>

        {/* Activity Row */}
        <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm flex flex-col h-full">
          <div className="px-8 py-6 border-b border-slate-50">
            <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-widest leading-none">Intelligence</h3>
          </div>
          <div className="flex-1 flex flex-col max-h-[400px] overflow-y-auto divide-y divide-slate-100/50">
            {notifications && notifications.length > 0 ? (
                notifications.map((notif: Notification) => (
                  <div key={notif.id} className="px-8 py-5 hover:bg-slate-50/50 transition-all flex items-start gap-5 relative group">
                    <div className={clsx("mt-1 flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border transition-all", 
                      notif.type === 'offer' ? 'bg-purple-50 border-purple-100 text-purple-600' :
                      notif.type === 'interview' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                      notif.type === 'system' ? 'bg-slate-50 border-slate-100 text-slate-400' :
                      'bg-slate-50 border-slate-100 text-slate-400'
                    )}>
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[14px] font-bold text-slate-900 truncate">{notif.title}</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{format(new Date(notif.created_at), 'MMM d')}</p>
                      </div>
                      <p className="text-[12px] text-slate-500 font-medium line-clamp-1 group-hover:line-clamp-none transition-all">{notif.message}</p>
                    </div>
                    {notif.action_url && (
                      <Link to={notif.action_url} className="mt-1 flex-shrink-0 h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-slate-900 border border-slate-100 transition-all">
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
                ))
            ) : (
              <div className="px-8 py-16 text-center space-y-4">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-100">
                  <Bell className="h-8 w-8" />
                </div>
                <div className="space-y-1 text-slate-300">
                  <p className="text-[14px] font-bold uppercase tracking-widest leading-none">In Sync</p>
                  <p className="text-[12px] font-medium">Everything is currently up to date.</p>
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
