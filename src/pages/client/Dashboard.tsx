import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import OnboardingBanner from "@/components/OnboardingBanner";
import NotificationWidget from "@/components/NotificationWidget";
import {
  Users,
  Briefcase,
  FileText,
  UserCheck,
  Plus,
  ArrowRight,
} from "lucide-react";

const ClientDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [clientId, setClientId] = useState<string>("");
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        setUser(authData.user);
        const id = `CLT-${authData.user.id.slice(0, 8).toUpperCase()}`;
        setClientId(id);

        // Check if client record exists (onboarding complete)
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        setOnboardingComplete(!!clientData);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      title: "Active Talents",
      value: 0,
      icon: Users,
      subtitle: "Team members",
    },
    {
      title: "Open Jobs",
      value: 0,
      icon: Briefcase,
      subtitle: "Active postings",
    },
    {
      title: "Active Contracts",
      value: 0,
      icon: FileText,
      subtitle: "Ongoing",
    },
    {
      title: "Pending Offers",
      value: 0,
      icon: UserCheck,
      subtitle: "Awaiting response",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Onboarding Banner */}
      {onboardingComplete === false && <OnboardingBanner portalType="client" />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your talent pipeline
          </p>
          <p className="text-sm text-primary font-medium mt-2">
            Client ID: {clientId}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/client/talents">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Browse Talents
            </Button>
          </Link>
          <Link to="/client/jobs">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Post a Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications */}
        <NotificationWidget />

        {/* Recent Jobs */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Job Postings</h2>
            <Link to="/client/jobs" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No job postings yet</p>
            <Link to="/client/jobs">
              <Button variant="link" className="mt-2">
                Create your first job posting
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Contracts */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Active Contracts</h2>
            <Link to="/client/contracts" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No active contracts</p>
            <Link to="/client/talents">
              <Button variant="link" className="mt-2">
                Browse talents to get started
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* My Team Preview */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">My Team</h2>
          <Link to="/client/team" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No team members yet</p>
          <p className="text-sm mt-1">Your hired talents will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
