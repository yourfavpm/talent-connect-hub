import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StatCard from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OnboardingBanner from "@/components/OnboardingBanner";
import { Briefcase, Clock, FileText, Receipt, CheckCircle, AlertCircle, Timer, ArrowRight } from "lucide-react";

const TalentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [talent, setTalent] = useState<any>(null);
  const [vettingLevels, setVettingLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTalentData();
    }
  }, [user]);

  const fetchTalentData = async () => {
    try {
      const { data: talentData } = await supabase
        .from("talents")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (talentData) {
        setTalent(talentData);
        
        const { data: vettingData } = await supabase
          .from("talent_vetting")
          .select("*")
          .eq("talent_id", talentData.id)
          .order("level", { ascending: true });

        setVettingLevels(vettingData || []);
      }
    } catch (error) {
      console.error("Error fetching talent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVettingStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success/10 text-success">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive">Rejected</Badge>;
      case "needs_clarification":
        return <Badge className="bg-warning/10 text-warning">Needs Clarification</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Pending</Badge>;
    }
  };

  const stats = [
    { title: "Active Jobs", value: 0, icon: Briefcase, subtitle: "Assigned jobs" },
    { title: "Hours This Week", value: 0, icon: Clock, subtitle: "Logged hours" },
    { title: "Pending Timesheets", value: 0, icon: FileText, subtitle: "Need submission" },
    { title: "Pending Payments", value: "$0", icon: Receipt, subtitle: "To be processed" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Onboarding Incomplete Banner */}
      {talent && !talent.onboarding_completed && <OnboardingBanner portalType="talent" />}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {talent?.first_name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Talent ID: <span className="font-mono font-medium">{talent?.talent_id}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {talent && !talent.onboarding_completed && (
            <Badge className="bg-warning/10 text-warning">
              Onboarding Incomplete
            </Badge>
          )}
          <Badge
            className={
              talent?.vetting_status === "fully_vetted"
                ? "bg-success/10 text-success"
                : talent?.vetting_status === "partially_vetted"
                ? "bg-warning/10 text-warning"
                : "bg-muted text-muted-foreground"
            }
          >
            {talent?.vetting_status === "fully_vetted"
              ? "Fully Vetted"
              : talent?.vetting_status === "partially_vetted"
              ? "Partially Vetted"
              : "Pending Vetting"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Vetting Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Talent Clearance Framework (TCF) Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vettingLevels.map((level) => (
              <div
                key={level.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      level.status === "approved"
                        ? "bg-success/20 text-success"
                        : level.status === "rejected"
                        ? "bg-destructive/20 text-destructive"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {level.status === "approved" ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : level.status === "rejected" ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <Timer className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      Level {level.level}: {level.level_name}
                    </p>
                    {level.admin_notes && (
                      <p className="text-sm text-muted-foreground">{level.admin_notes}</p>
                    )}
                  </div>
                </div>
                {getVettingStatusBadge(level.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
              <Clock className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium">Start Timer</p>
              <p className="text-sm text-muted-foreground">Track work hours</p>
            </button>
            <button className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
              <FileText className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium">View Timesheets</p>
              <p className="text-sm text-muted-foreground">Submit weekly hours</p>
            </button>
            <button className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
              <Briefcase className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium">Browse Jobs</p>
              <p className="text-sm text-muted-foreground">Find new opportunities</p>
            </button>
            <button className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
              <Receipt className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium">View Payments</p>
              <p className="text-sm text-muted-foreground">Check payment status</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TalentDashboard;
