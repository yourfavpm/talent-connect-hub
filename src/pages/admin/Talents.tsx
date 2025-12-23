import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserCheck, Eye, CheckCircle, Clock, AlertCircle } from "lucide-react";

const AdminTalents = () => {
  const navigate = useNavigate();
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [onboardingFilter, setOnboardingFilter] = useState("all");

  useEffect(() => {
    fetchTalents();
  }, [statusFilter, onboardingFilter]);

  const fetchTalents = async () => {
    try {
      let query = supabase
        .from("talents")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("vetting_status", statusFilter as "unvetted" | "partially_vetted" | "fully_vetted");
      }

      if (onboardingFilter === "complete") {
        query = query.eq("onboarding_completed", true);
      } else if (onboardingFilter === "incomplete") {
        query = query.eq("onboarding_completed", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTalents(data || []);
    } catch (error) {
      console.error("Error fetching talents:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "fully_vetted":
        return <Badge className="bg-success/10 text-success">Fully Vetted</Badge>;
      case "partially_vetted":
        return <Badge className="bg-warning/10 text-warning">Partially Vetted</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Unvetted</Badge>;
    }
  };

  const getOnboardingBadge = (completed: boolean) => {
    return completed ? (
      <Badge variant="outline" className="border-success text-success">
        <CheckCircle className="h-3 w-3 mr-1" />
        Onboarding Complete
      </Badge>
    ) : (
      <Badge variant="outline" className="border-warning text-warning">
        <Clock className="h-3 w-3 mr-1" />
        Onboarding Incomplete
      </Badge>
    );
  };

  const filteredTalents = talents.filter(
    (talent) =>
      talent.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.talent_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group talents by status for quick stats
  const stats = {
    total: talents.length,
    unvetted: talents.filter((t) => t.vetting_status === "unvetted").length,
    partial: talents.filter((t) => t.vetting_status === "partially_vetted").length,
    vetted: talents.filter((t) => t.vetting_status === "fully_vetted").length,
    pendingOnboarding: talents.filter((t) => !t.onboarding_completed).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Talent Management</h1>
        <p className="text-muted-foreground mt-1">Review, vet, and manage talent profiles</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter("all")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Talents</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter("unvetted")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.unvetted}</p>
            <p className="text-sm text-muted-foreground">Unvetted</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter("partially_vetted")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{stats.partial}</p>
            <p className="text-sm text-muted-foreground">Partially Vetted</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter("fully_vetted")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.vetted}</p>
            <p className="text-sm text-muted-foreground">Fully Vetted</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-warning/10 transition-colors" onClick={() => { setOnboardingFilter("incomplete"); setStatusFilter("all"); }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{stats.pendingOnboarding}</p>
            <p className="text-sm text-muted-foreground">Pending Onboarding</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or talent ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Vetting Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unvetted">Unvetted</SelectItem>
            <SelectItem value="partially_vetted">Partially Vetted</SelectItem>
            <SelectItem value="fully_vetted">Fully Vetted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={onboardingFilter} onValueChange={setOnboardingFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Onboarding Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Onboarding</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Talents List */}
      <div className="grid gap-4">
        {filteredTalents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No talents found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTalents.map((talent) => (
            <Card
              key={talent.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/admin/talents/${talent.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {talent.first_name} {talent.last_name}
                      </h3>
                      {getStatusBadge(talent.vetting_status)}
                      {getOnboardingBadge(talent.onboarding_completed)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">ID:</span> {talent.talent_id}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {talent.email}
                      </div>
                      <div>
                        <span className="font-medium">Role:</span> {talent.primary_role?.replace("_", " ") || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Experience:</span> {talent.years_of_experience || 0} years
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminTalents;
