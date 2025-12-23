import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NotificationWidget from "@/components/NotificationWidget";
import { Users, Briefcase, FileText, UserCheck, Clock, DollarSign, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeTalents: 0,
    openJobs: 0,
    pendingOffers: 0,
    pendingVetting: 0,
    activeContracts: 0,
  });
  const [recentOffers, setRecentOffers] = useState<any[]>([]);
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch counts
      const [clientsRes, talentsRes, jobsRes, offersRes, contractsRes, pendingVettingRes] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("talents").select("id", { count: "exact", head: true }).eq("vetting_status", "fully_vetted"),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "sent_to_admin"),
        supabase.from("contracts").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("talents").select("id", { count: "exact", head: true }).eq("vetting_status", "unvetted"),
      ]);

      setStats({
        totalClients: clientsRes.count || 0,
        activeTalents: talentsRes.count || 0,
        openJobs: jobsRes.count || 0,
        pendingOffers: offersRes.count || 0,
        activeContracts: contractsRes.count || 0,
        pendingVetting: pendingVettingRes.count || 0,
      });

      // Fetch recent offers
      const { data: offersData } = await supabase
        .from("offers")
        .select(`
          *,
          clients(company_name),
          talents(first_name, last_name)
        `)
        .in("status", ["sent_to_admin", "pending"])
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentOffers(offersData || []);

      // Fetch pending jobs for approval
      const { data: jobsData } = await supabase
        .from("jobs")
        .select(`
          *,
          clients(company_name)
        `)
        .eq("status", "submitted")
        .order("created_at", { ascending: false })
        .limit(5);

      setPendingJobs(jobsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveJob = async (jobId: string) => {
    try {
      await supabase
        .from("jobs")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", jobId);
      fetchDashboardData();
    } catch (error) {
      console.error("Error approving job:", error);
    }
  };

  const statCards = [
    { title: "Total Clients", value: stats.totalClients, icon: Users, subtitle: "Active accounts" },
    { title: "Vetted Talents", value: stats.activeTalents, icon: UserCheck, subtitle: "In talent pool" },
    { title: "Open Jobs", value: stats.openJobs, icon: Briefcase, subtitle: "Active postings" },
    { title: "Pending Offers", value: stats.pendingOffers, icon: FileText, subtitle: "Awaiting action" },
    { title: "Active Contracts", value: stats.activeContracts, icon: DollarSign, subtitle: "In progress" },
    { title: "Pending Vetting", value: stats.pendingVetting, icon: AlertCircle, subtitle: "Need review" },
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage clients, talents, and contracts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Notifications & Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <NotificationWidget />
        
        {/* Pending Job Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Pending Job Approvals
            </CardTitle>
            <Link to="/admin/jobs">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingJobs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending jobs</p>
            ) : (
              <div className="space-y-3">
                {pendingJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{job.clients?.company_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleApproveJob(job.id)}>
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Offers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Offers
            </CardTitle>
            <Link to="/admin/offers">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOffers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending offers</p>
            ) : (
              <div className="space-y-3">
                {recentOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {offer.talents?.first_name} {offer.talents?.last_name} → {offer.clients?.company_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{offer.role_title}</p>
                    </div>
                    <Badge className={
                      offer.status === "sent_to_admin" 
                        ? "bg-warning/10 text-warning" 
                        : "bg-primary/10 text-primary"
                    }>
                      {offer.status === "sent_to_admin" ? "Generate Contract" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/talents" className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
              <UserCheck className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium">Vet Talents</p>
              <p className="text-sm text-muted-foreground">Review pending profiles</p>
            </Link>
            <Link to="/admin/clients" className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
              <Users className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium">Manage Clients</p>
              <p className="text-sm text-muted-foreground">View all clients</p>
            </Link>
            <Link to="/admin/jobs" className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
              <Briefcase className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium">Manage Jobs</p>
              <p className="text-sm text-muted-foreground">Approve & assign</p>
            </Link>
            <Link to="/admin/contracts" className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left">
              <FileText className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium">Contracts</p>
              <p className="text-sm text-muted-foreground">Generate & manage</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
