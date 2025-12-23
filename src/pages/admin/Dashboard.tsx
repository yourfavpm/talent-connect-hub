import StatCard from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, FileText, Receipt, UserCheck, Clock } from "lucide-react";

const AdminDashboard = () => {
  const stats = [
    { title: "Total Clients", value: 24, icon: Users, subtitle: "Active accounts" },
    { title: "Active Talents", value: 156, icon: UserCheck, subtitle: "In talent pool" },
    { title: "Open Jobs", value: 18, icon: Briefcase, subtitle: "Active postings" },
    { title: "Pending Offers", value: 7, icon: FileText, subtitle: "Awaiting action" },
  ];

  const recentOffers = [
    { id: "1", client: "Acme Corp", talent: "Sarah Chen", role: "Product Manager", status: "pending", date: "2024-01-20" },
    { id: "2", client: "TechStart", talent: "Michael O.", role: "Operations Lead", status: "contract_pending", date: "2024-01-19" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage clients, talents, and contracts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Offers & Contracts</h2>
        <div className="space-y-3">
          {recentOffers.map((offer) => (
            <div key={offer.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">{offer.talent} → {offer.client}</p>
                <p className="text-sm text-muted-foreground">{offer.role}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={offer.status === "pending" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}>
                  {offer.status === "pending" ? "Pending Review" : "Generate Contract"}
                </Badge>
                <Button size="sm">{offer.status === "pending" ? "Review" : "Generate"}</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
