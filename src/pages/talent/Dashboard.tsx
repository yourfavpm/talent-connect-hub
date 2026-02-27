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

      let { data: talentData } = await supabase
        .from("talents")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!talentData) {
        // Fallback robust ID generation if RPC fails or returns concurrently identical values
        const fallbackId = `TAS-VA-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        const { data: talentIdData } = await supabase.rpc("generate_talent_id");
        const generatedTalentId = talentIdData || fallbackId;
        
        const firstName = user.user_metadata?.first_name || user.user_metadata?.firstName || "User";
        const lastName = user.user_metadata?.last_name || user.user_metadata?.lastName || "";

        const { data: newTalent, error } = await supabase
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
          })
          .select()
          .single();

        // If insert fails due to unique constraint on talent_id concurrently, retry with fallback
        if (error?.code === '23505') {
            const { data: retryTalent, error: retryError } = await supabase
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
              })
              .select()
              .single();
              
            if (retryError) throw retryError;
            talentData = retryTalent;
        } else if (error) {
            throw error;
        } else {
            talentData = newTalent;
        }
      } else {
        if (!talentData.first_name || talentData.first_name === "User") {
          const firstName = user.user_metadata?.first_name || user.user_metadata?.firstName || "User";
          const lastName = user.user_metadata?.last_name || user.user_metadata?.lastName || "";

          if (firstName !== "User") {
            const { data: updatedTalent } = await supabase
              .from("talents")
              .update({ first_name: firstName, last_name: lastName })
              .eq("id", talentData.id)
              .select()
              .single();
            if (updatedTalent) talentData = updatedTalent;
          }
        }
      }

      const [applicationsRes, contractsRes, timesheetsRes, messagesRes, ticketsRes, notificationsRes, stepsRes] = await Promise.all([
        supabase.from("job_applications").select("*", { count: "exact", head: true }).eq("talent_id", talentData.id),
        supabase.from("contracts").select("*", { count: "exact", head: true }).eq("talent_id", talentData.id).eq("status", "active"),
        supabase.from("timesheets").select("*", { count: "exact", head: true }).eq("talent_id", talentData.id).eq("status", "draft"),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["open", "in_progress"]),
        supabase.from("notifications").select("*").eq("user_id", user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from("talent_profile_steps" as any).select("*").eq("talent_id", talentData.id)
      ]);
 
      return {
        talent: talentData ? {
          ...talentData,
          onboarding_status: (talentData as any).onboarding_status || "not_started",
          current_step: (talentData as any).current_step || 1,
          profile_completion: (talentData as any).profile_completion || 0
        } as TalentData : null as any,
        stats: {
          applications: applicationsRes.count || 0,
          activeAssignments: contractsRes.count || 0,
          pendingTimesheets: timesheetsRes.count || 0,
          unreadMessages: messagesRes.count || 0,
          openTickets: ticketsRes.count || 0,
        } as DashboardStats,
        notifications: (notificationsRes.data as Notification[]) || [],
        steps: (stepsRes.data as unknown as Step[]) || []
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 1, // 1 minute cache
  });
 
  const { talent, stats, notifications, steps } = data || {
    talent: null,
    stats: { applications: 0, activeAssignments: 0, pendingTimesheets: 0, unreadMessages: 0, openTickets: 0 },
    notifications: [],
    steps: []
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
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10 animate-fade-in min-h-screen">
      {/* ── Page Header Strip ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">
            Welcome back, {talent?.first_name || "User"}
          </h1>
          <p className="text-[15px] text-slate-500 font-medium">Here's an overview of your work on Taskive.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/talent/profile" className="h-10 px-5 bg-white border border-slate-200 hover:border-slate-900 rounded-xl flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all shadow-sm">
            View My Profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>





      {/* ── Status Banners Group ─────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Profile Draft Changes Banner */}
        {talent && talent.profile_change_status === "draft" && (talent.changed_sections?.length || 0) > 0 && (
          <div className="bg-amber-50/50 border border-amber-100 rounded-[32px] px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
            <div className="absolute left-0 top-0 h-full w-2 bg-amber-600" />
            <div className="flex items-start gap-5">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200 text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-slate-900">Portfolio Update Detected</h3>
                <p className="text-[13px] text-slate-500 font-medium">You have unpublished changes in your profile. Submit them for vetting review.</p>
              </div>
            </div>
            <Link to="/talent/profile" className="shrink-0">
              <Button className="h-11 px-8 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/10">
                Review & Submit
              </Button>
            </Link>
          </div>
        )}

        {/* Profile Submitted for Review Banner */}
        {talent && talent.profile_change_status === "submitted" && (
          <div className="bg-slate-50 border border-slate-100 rounded-[32px] px-8 py-7 flex flex-col md:flex-row md:items-center gap-6 relative">
            <div className="absolute left-0 top-0 h-full w-2 bg-blue-600" />
            <div className="flex items-start gap-5">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 shrink-0 mt-1" />
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-slate-900">Profile Revision in Progress</h3>
                <p className="text-[13px] text-slate-500 font-medium">Our team is currently reviewing your recent profile updates.</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Rejected Banner */}
        {talent && talent.profile_change_status === "rejected" && (
          <div className="bg-red-50/50 border border-red-100 rounded-[32px] px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
            <div className="absolute left-0 top-0 h-full w-2 bg-red-600" />
            <div className="flex items-start gap-5">
              <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0 border border-red-200 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-slate-900">Profile Update Status: Issues Identified</h3>
                <p className="text-[13px] text-slate-500 font-medium">Some of your recent updates require further clarification or correction.</p>
              </div>
            </div>
            <Link to="/talent/profile" className="shrink-0">
              <Button className="h-11 px-8 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/10">
                View Feedback
              </Button>
            </Link>
          </div>
        )}

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

        {/* Onboarding Incomplete Banner */}
        {talent && !talent.onboarding_completed && talent.onboarding_status !== 'submitted' && !hideBanner && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-[32px] px-8 py-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6">
               <button 
                onClick={() => { setHideBanner(true); sessionStorage.setItem('hide_profile_banner_session', 'true'); }}
                className="h-10 w-10 flex items-center justify-center bg-white border border-blue-100 rounded-xl text-blue-300 hover:text-blue-600 transition-all"
               >
                 <X className="h-5 w-5" />
               </button>
            </div>
            
            <div className="h-20 w-20 rounded-[24px] bg-blue-100/50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-200/50">
               <User className="h-10 w-10" />
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Complete your professional profile</h3>
                  <div className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    Step {Math.min(talent.current_step || 1, 8)} of 8
                  </div>
                </div>
                <p className="text-[14px] text-slate-500 font-medium max-w-[500px]">Finish setting up your profile to get vetted and matched with global opportunities.</p>
              </div>

              {talent.profile_completion !== undefined && (
                <div className="space-y-3">
                   <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-blue-600">
                     <span>Profile Integrity</span>
                     <span>{talent.profile_completion}%</span>
                   </div>
                   <div className="h-2 w-full bg-blue-100/50 rounded-full overflow-hidden border border-blue-100/50 p-0.5">
                     <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${talent.profile_completion}%` }} />
                   </div>
                </div>
              )}
            </div>

            <div className="shrink-0 flex flex-col items-center gap-3">
               <Button className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[12px] font-bold uppercase tracking-widest shadow-xl shadow-blue-500/10 transition-all active:scale-[0.98]" asChild>
                 <Link to="/talent/onboarding">Complete Profile Now</Link>
               </Button>
               <button onClick={() => { setHideBanner(true); sessionStorage.setItem('hide_profile_banner_session', 'true'); }} className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
                  I'll do this later
               </button>
            </div>
          </div>
        )}

        {/* Status Banners (Vetting, Review, etc.) */}
        {talent && talent.onboarding_status === 'submitted' && talent.vetting_status === 'in_review' && (
          <div className="bg-slate-50 border border-slate-100 rounded-[32px] px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
            <div className="absolute left-0 top-0 h-full w-2 bg-blue-600" />
            <div className="flex items-start gap-5">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 text-blue-600">
                <Clock className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-slate-900">Application Under Review</h3>
                <p className="text-[13px] text-slate-500 font-medium">Our specialized vetting team is currently analyzing your credentials. You'll hear from us shortly.</p>
              </div>
            </div>
            <Button className="h-11 px-8 border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm" asChild>
              <Link to="/talent/profile">Track Progress</Link>
            </Button>
          </div>
        )}

        {talent && talent.vetting_status === "changes_requested" && (
          <div className="bg-amber-50/50 border border-amber-100 rounded-[32px] px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
            <div className="absolute left-0 top-0 h-full w-2 bg-amber-600" />
            <div className="flex items-start gap-5">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200 text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-slate-900">Action Required: Refinement Needed</h3>
                <p className="text-[13px] text-slate-500 font-medium">Your vetting requires minor adjustments to proceed. Please review the highlighted sections.</p>
                {steps && steps.some(s => s.status === 'changes_requested') && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {steps.filter(s => s.status === 'changes_requested').map(s => (
                      <div key={s.id} className="px-3 py-1 bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
                        {s.step_key.replace('_', ' ')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button className="h-11 px-8 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/10" asChild>
              <Link to="/talent/onboarding">Resolve Now</Link>
            </Button>
          </div>
        )}

        {talent && talent.vetting_status === "approved" && (
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-[32px] px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
            <div className="absolute left-0 top-0 h-full w-2 bg-emerald-600" />
            <div className="flex items-start gap-5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200 text-emerald-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-slate-900">Professional Identity Verified</h3>
                <p className="text-[13px] text-slate-500 font-medium">Congratulations! You are now a fully vetted member. Start applying to premium global roles.</p>
              </div>
            </div>
            <Button className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10" asChild>
              <Link to="/talent/jobs">Explore Opportunities</Link>
            </Button>
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
