import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Clock,
  FileText,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface TalentData {
  id: string;
  talent_id: string;
  first_name: string;
  last_name: string;
  email: string;
  primary_role: string;
  vetting_status: string;
  onboarding_completed: boolean;
  onboarding_step: number;
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
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['talentDashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // 1. Fetch Talent
      let { data: talentData } = await supabase
        .from("talents")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // 2. Handle missing profile (Backfill for older users)
      if (!talentData) {
        // Create new talent record
        const { data: talentIdData } = await supabase.rpc("generate_talent_id");
        const generatedTalentId = talentIdData || `TAS-VA-${Date.now()}`;
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
            onboarding_step: 1,
          })
          .select()
          .single();

        if (error) throw error;
        talentData = newTalent;
      } else {
        // Update name if missing (Backfill)
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

      // 3. Fetch Stats
      const [applicationsRes, contractsRes, timesheetsRes, messagesRes, ticketsRes] = await Promise.all([
        supabase.from("job_applications").select("*", { count: "exact", head: true }).eq("talent_id", talentData.id),
        supabase.from("contracts").select("*", { count: "exact", head: true }).eq("talent_id", talentData.id).eq("status", "active"),
        supabase.from("timesheets").select("*", { count: "exact", head: true }).eq("talent_id", talentData.id).eq("status", "draft"),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["open", "in_progress"]),
      ]);

      return {
        talent: talentData as TalentData,
        stats: {
          applications: applicationsRes.count || 0,
          activeAssignments: contractsRes.count || 0,
          pendingTimesheets: timesheetsRes.count || 0,
          unreadMessages: messagesRes.count || 0,
          openTickets: ticketsRes.count || 0,
        } as DashboardStats
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 1, // 1 minute cache for dashboard
  });

  const { talent, stats } = data || {
    talent: null,
    stats: { applications: 0, activeAssignments: 0, pendingTimesheets: 0, unreadMessages: 0, openTickets: 0 }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  const quickActions = [
    { label: "Browse Jobs", icon: Briefcase, href: "/talent/jobs", color: "from-blue-500 to-cyan-500" },
    { label: "Applications", icon: FileText, href: "/talent/applications", count: stats.applications, color: "from-purple-500 to-pink-500" },
    { label: "Assignments", icon: Briefcase, href: "/talent/assignments", count: stats.activeAssignments, color: "from-emerald-500 to-teal-500" },
    { label: "Timesheets", icon: Clock, href: "/talent/timesheets", count: stats.pendingTimesheets, color: "from-amber-500 to-orange-500" },
    { label: "Messages", icon: MessageSquare, href: "/talent/messages", count: stats.unreadMessages, color: "from-indigo-500 to-blue-500" },
    { label: "Support", icon: HelpCircle, href: "/talent/support", count: stats.openTickets, color: "from-rose-500 to-red-500" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Welcome to Taskive</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Hello, {talent?.first_name || "User"}!
          </h1>
          {talent?.talent_id && (
            <div className="mb-4">
              <Badge variant="outline" className="bg-white/10 border-white/30 text-white font-mono">
                ID: {talent.talent_id}
              </Badge>
            </div>
          )}
          <p className="text-slate-300 text-lg mb-6 max-w-2xl">
            Your talent portal for managing applications, assignments, and connecting with opportunities.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/talent/jobs">
              <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                <Briefcase className="h-4 w-4 mr-2" />
                Browse Jobs
              </Button>
            </Link>
            <Link to="/talent/profile">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Complete Profile Banner */}
      {talent && !talent.onboarding_completed && (
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-amber-900 text-lg mb-1">
                  Complete Your Profile to Get Vetted
                </h3>
                <p className="text-amber-700 text-sm">
                  Fill out your professional details to unlock job applications and get verified by our team.
                </p>
              </div>
              <Link to="/talent/onboarding">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap">
                  Start Onboarding
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.href}>
              <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-slate-50">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-medium text-sm mb-1">{action.label}</p>
                  {action.count !== undefined && (
                    <p className="text-2xl font-bold text-slate-900">{action.count}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity - Empty State */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No Recent Activity</h3>
            <p className="text-muted-foreground mb-6">
              Your recent applications, assignments, and updates will appear here.
            </p>
            <Link to="/talent/jobs">
              <Button>
                <Briefcase className="h-4 w-4 mr-2" />
                Browse Available Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TalentDashboard;
