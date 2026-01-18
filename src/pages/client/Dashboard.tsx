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
  const [client, setClient] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        setUser(authData.user);

        const { data: clientData } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (clientData) {
          setClient(clientData);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const stats = [
    // Real stats would be fetched here. For MVP layout we keep placeholders but prepared for data.
    {
      title: "Active Jobs",
      value: 0,
      icon: Briefcase,
      subtitle: "Accepting proposals",
      color: "text-blue-600 bg-blue-100",
    },
    {
      title: "Interviews",
      value: 0,
      icon: Users,
      subtitle: "Pending schedule",
      color: "text-purple-600 bg-purple-100",
    },
    {
      title: "Active Hires",
      value: 0,
      icon: UserCheck,
      subtitle: "On active contracts",
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      title: "Invoices Due",
      value: 0,
      icon: FileText,
      subtitle: "Upcoming payments",
      color: "text-amber-600 bg-amber-100",
    },
  ];

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium backdrop-blur-sm border border-white/20">
                {client?.status === 'active' ? 'Active Account' : 'Account Pending Verification'}
              </span>
              {client?.client_id && (
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-mono font-medium border border-indigo-500/30">
                  {client.client_id}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold">
              Welcome, {client?.company_name || "Partner"}
            </h1>
            <p className="text-indigo-200 mt-2 max-w-xl">
              Manage your talent pipeline, interviews, and contracts from your command center.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/client/browse-talents">
              <Button className="bg-white text-indigo-900 hover:bg-indigo-50 border-0">
                <Users className="h-4 w-4 mr-2" />
                Browse Talent
              </Button>
            </Link>
            <Link to="/client/jobs">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} className="border-t-4 border-t-indigo-500" />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Operational */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Job Requests */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-500" />
                Active Job Requests
              </h3>
              <Link to="/client/jobs" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            <div className="p-8 text-center text-muted-foreground bg-slate-50/50">
              <p>No active job requests found.</p>
              <Button variant="link" className="mt-2 text-indigo-600" asChild>
                <Link to="/client/jobs">Create a new job posting</Link>
              </Button>
            </div>
          </div>

          {/* Interview Requests */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Pending Interviews
              </h3>
            </div>
            <div className="p-8 text-center text-muted-foreground bg-slate-50/50">
              <p>No interviews scheduled yet.</p>
            </div>
          </div>
        </div>

        {/* Right Column - Financial & Support */}
        <div className="space-y-6">
          {/* Invoices */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                Recent Invoices
              </h3>
              <Link to="/client/invoices" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            <div className="p-8 text-center text-muted-foreground bg-slate-50/50">
              <p>No invoices due.</p>
            </div>
          </div>

          {/* Support */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-xl p-6 text-white">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-indigo-200 text-sm mb-4">
              Contact our support team for assistance with hiring or contracts.
            </p>
            <Button variant="secondary" className="w-full" size="sm" asChild>
              <Link to="/client/support">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
