import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Clock,
  FileText,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  Bell,
  CheckCircle,
  AlertCircle,
  Check,
  Copy,
  ChevronRight,
  Video,
  DollarSign,
  X
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        talent: {
          ...talentData,
          onboarding_status: talentData.onboarding_status || "not_started",
          current_step: talentData.current_step || 1
        } as TalentData,
        stats: {
          applications: applicationsRes.count || 0,
          activeAssignments: contractsRes.count || 0,
          pendingTimesheets: timesheetsRes.count || 0,
          unreadMessages: messagesRes.count || 0,
          openTickets: ticketsRes.count || 0,
        } as DashboardStats,
        notifications: notificationsRes.data || [],
        steps: (stepsRes.data as any[]) || []
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
    <div className="space-y-8 animate-fade-in max-w-[1200px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Welcome back, {talent?.first_name || "User"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's an overview of your work on Taskive.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/talent/profile" className="text-sm font-medium text-brand-primary hover:text-brand-primary/80 flex items-center gap-1.5 transition-colors">
            View Profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Talent ID Block & Profile Completion Banner */}
      <div className="space-y-4">
        {talent?.talent_id && (
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Talent ID</span>
            <div className="h-4 w-px bg-gray-200 mx-1" />
            <span className="text-sm font-mono text-gray-900">{talent.talent_id}</span>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={copyId} className="ml-1 p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                    {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white text-xs border-none">
                  Copy to clipboard
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        {(() => {
          console.log("Banner conditions:", { 
            talentExists: !!talent, 
            onboardingCompleted: talent?.onboarding_completed, 
            hideBanner 
          });
          return null;
        })()}
        {talent && !talent.onboarding_completed && talent.onboarding_status !== 'submitted' && !hideBanner && (
          <div className="bg-[#EFF6FF] border border-gray-200 rounded-[12px] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in transition-all relative">
            <button 
              onClick={() => {
                setHideBanner(true);
                sessionStorage.setItem('hide_profile_banner_session', 'true');
              }}
              className="absolute top-3 right-3 sm:hidden text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start sm:items-center gap-3 flex-1">
              <div className="mt-0.5 sm:mt-0">
                <AlertCircle className="h-5 w-5 text-blue-600/80" />
              </div>
              <div className="space-y-1 sm:space-y-0.5 pr-6 sm:pr-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <h3 className="text-sm font-medium text-gray-900">Complete your professional profile</h3>
                  <Badge variant="outline" className="w-fit text-[10px] uppercase font-semibold text-blue-700 border-blue-200 bg-blue-50/50">
                    Step {Math.min(talent.current_step || 1, 8)} of 8
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">Finish setting up your profile to get vetted and matched with opportunities.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t border-blue-100 sm:border-t-0">
              <Link to="/talent/onboarding" className="w-full sm:w-auto">
                <Button size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-none h-8 text-xs font-medium px-4">
                  Complete Profile
                </Button>
              </Link>
              <button 
                onClick={() => {
                  setHideBanner(true);
                  sessionStorage.setItem('hide_profile_banner_session', 'true');
                }}
                className="hidden sm:block text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Continue later
              </button>
            </div>
          </div>
        )}

        {/* Vetting Status Banner */}
        {talent && talent.vetting_status === "changes_requested" && (
          <div className="bg-orange-50 border border-orange-200 rounded-[12px] px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in shadow-sm">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Changes Requested on your Profile</h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  Our vetting team has reviewed your profile and requested some adjustments. 
                  Please update the marked sections to proceed.
                </p>
                {steps && steps.some(s => s.status === 'changes_requested') && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {steps.filter(s => s.status === 'changes_requested').map(s => (
                      <Badge key={s.id} variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none text-[10px] font-bold uppercase tracking-wide">
                        {s.step_key.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Link to="/talent/onboarding" className="shrink-0">
              <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white h-10 px-6 font-bold uppercase text-[11px] tracking-widest shadow-lg shadow-orange-200">
                Update Profile
              </Button>
            </Link>
          </div>
        )}

        {/* Vetting Status Banner - Approved */}
        {talent && talent.vetting_status === "approved" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-[12px] px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in shadow-sm">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Profile Fully Vetted</h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  Congratulations! Your profile has been successfully vetted and verified. You are now eligible for exclusive job opportunities and client matches.
                </p>
              </div>
            </div>
            <Link to="/talent/jobs" className="shrink-0">
              <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-6 font-bold uppercase text-[11px] tracking-widest shadow-lg shadow-emerald-200">
                Browse Jobs
              </Button>
            </Link>
          </div>
        )}

        {/* Profile Draft Changes Banner */}
        {talent && (talent as any).profile_change_status === "draft" && (talent as any).changed_sections?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-[12px] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in">
            <div className="flex items-center gap-3 flex-1">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">You've updated your profile</h3>
                <p className="text-xs text-gray-600">Submit for review to reflect changes publicly.</p>
              </div>
            </div>
            <Link to="/talent/profile" className="shrink-0">
              <Button size="sm" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white h-8 px-4 text-xs font-medium">
                Review & Submit
              </Button>
            </Link>
          </div>
        )}

        {/* Profile Submitted for Review Banner */}
        {talent && (talent as any).profile_change_status === "submitted" && (
          <div className="bg-blue-50 border border-blue-200 rounded-[12px] px-4 py-3 flex items-center gap-3 animate-fade-in">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600 shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Profile under review</h3>
              <p className="text-xs text-gray-600">Your profile changes are being reviewed by our team.</p>
            </div>
          </div>
        )}

        {/* Profile Rejected Banner */}
        {talent && (talent as any).profile_change_status === "rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-[12px] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in">
            <div className="flex items-center gap-3 flex-1">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Profile changes were rejected</h3>
                <p className="text-xs text-gray-600">Please review admin feedback and make corrections.</p>
              </div>
            </div>
            <Link to="/talent/profile" className="shrink-0">
              <Button size="sm" variant="outline" className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-100 h-8 px-4 text-xs font-medium">
                View Feedback
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-gray-200/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Contracts</p>
              <p className="text-2xl font-semibold text-gray-900 mt-0.5">{stats.activeAssignments}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center">
              <Video className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Interviews</p>
              <p className="text-2xl font-semibold text-gray-900 mt-0.5">0</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Timesheets</p>
              <p className="text-2xl font-semibold text-gray-900 mt-0.5">{stats.pendingTimesheets}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-amber-50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Unread Messages</p>
              <p className="text-2xl font-semibold text-gray-900 mt-0.5">{stats.unreadMessages}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Contracts */}
        <Card className="border-gray-200 shadow-sm flex flex-col h-full">
          <CardHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Active Contracts</CardTitle>
            <Link to="/talent/contracts" className="text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors">
              View All
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            {stats.activeAssignments > 0 ? (
               <div className="p-8 text-center flex-1 flex flex-col items-center justify-center text-gray-500">
                 {/* Placeholder for real list mapping if data was fetched */}
                 You have {stats.activeAssignments} active contracts.
                 <Link to="/talent/contracts" className="mt-4 text-sm font-medium text-brand-primary hover:text-brand-primary/80 flex items-center gap-1.5 justify-center transition-colors">
                   Go to Contracts <ArrowRight className="h-4 w-4" />
                 </Link>
               </div>
            ) : (
                <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto border-gray-100 mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No active contracts</p>
                  <p className="text-xs text-gray-500 max-w-[200px]">You don't have any ongoing work assignments at the moment.</p>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Interviews */}
        <Card className="border-gray-200 shadow-sm flex flex-col h-full">
          <CardHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Upcoming Interviews</CardTitle>
            <Link to="/talent/interviews" className="text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors">
              View All
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
              <Video className="h-8 w-8 text-gray-300 mx-auto border-gray-100 mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">No upcoming interviews</p>
              <p className="text-xs text-gray-500 max-w-[200px]">You don't have any scheduled interviews with clients right now.</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="border-gray-200 shadow-sm flex flex-col h-full">
          <CardHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Recent Applications</CardTitle>
            <Link to="/talent/applications" className="text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors">
              View All
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            {stats.applications > 0 ? (
               <div className="p-8 text-center flex-1 flex flex-col items-center justify-center text-gray-500">
                 You have {stats.applications} recent applications.
                 <Link to="/talent/applications" className="mt-4 text-sm font-medium text-brand-primary hover:text-brand-primary/80 flex items-center gap-1.5 justify-center transition-colors">
                   Go to Applications <ArrowRight className="h-4 w-4" />
                 </Link>
               </div>
            ) : (
                <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
                  <Briefcase className="h-8 w-8 text-gray-300 mx-auto border-gray-100 mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No recent applications</p>
                  <p className="text-xs text-gray-500 max-w-[200px]">Start browsing open roles to submit new applications.</p>
                  <Link to="/talent/jobs" className="mt-4 text-sm font-medium text-brand-primary hover:text-brand-primary/80 flex items-center gap-1.5 justify-center transition-colors">
                    Browse Jobs <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity / Notifications */}
        <Card className="border-gray-200 shadow-sm flex flex-col h-full">
          <CardHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col max-h-[300px] overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif: { id: string; type: string; title: string; message: string; created_at: string; action_url?: string }) => (
                  <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-3">
                    <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      notif.type === 'offer' ? 'bg-purple-50 text-purple-600' :
                      notif.type === 'interview' ? 'bg-blue-50 text-blue-600' :
                      notif.type === 'system' ? 'bg-indigo-50 text-indigo-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{notif.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                    </div>
                    {notif.action_url && (
                      <Link to={notif.action_url}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-gray-400 hover:text-gray-900">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto border-gray-100 mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">No new notifications</p>
                <p className="text-xs text-gray-500 max-w-[200px]">You're all caught up! We'll alert you when there's an update.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default TalentDashboard;
