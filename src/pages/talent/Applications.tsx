import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    FileCheck,
    Search,
    Briefcase,
    Calendar,
    Clock,
    Building2,
    ChevronRight,
    CheckCircle,
    Timer,
    XCircle,
    Eye,
    Filter
} from "lucide-react";
import { format } from "date-fns";

interface Application {
    id: string;
    job_id: string;
    status: string;
    cover_letter: string;
    created_at: string;
    updated_at: string;
    job: {
        id: string;
        title: string;
        role_needed: string;
        weekly_hours: number;
        client: {
            company_name: string;
        };
    };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    applied: { label: "Submitted", color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: <Clock className="h-3 w-3" /> },
    shortlisted: { label: "Shortlisted", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: <CheckCircle className="h-3 w-3" /> },
    rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
    hired: { label: "Hired", color: "bg-purple-500/10 text-purple-600 border-purple-500/30", icon: <CheckCircle className="h-3 w-3" /> },
    withdrawn: { label: "Withdrawn", color: "bg-gray-500/10 text-gray-600 border-gray-500/30", icon: <XCircle className="h-3 w-3" /> },
};

const TalentApplications = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        if (user) {
            fetchApplications();
        }
    }, [user]);

    const fetchApplications = async () => {
        try {
            // First get the talent
            const { data: talent } = await supabase
                .from("talents")
                .select("id")
                .eq("user_id", user?.id)
                .single();

            if (!talent) return;

            // Fetch applications with job details
            const { data, error } = await supabase
                .from("job_applications")
                .select(`
          id,
          job_id,
          status,
          cover_letter,
          created_at,
          updated_at,
          job:jobs (
            id,
            title,
            role_needed,
            weekly_hours,
            client:clients (
              company_name
            )
          )
        `)
                .eq("talent_id", talent.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setApplications(data || []);
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredApplications = applications.filter((app) => {
        const matchesSearch =
            app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.job?.client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusCounts = () => {
        const counts: Record<string, number> = { all: applications.length };
        applications.forEach((app) => {
            counts[app.status] = (counts[app.status] || 0) + 1;
        });
        return counts;
    };

    const statusCounts = getStatusCounts();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-8 text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <FileCheck className="h-6 w-6" />
                        <h1 className="text-2xl md:text-3xl font-bold">My Applications</h1>
                    </div>
                    <p className="text-white/80">Track the status of your job applications</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by job title or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {["all", "applied", "shortlisted", "rejected", "hired"].map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                            className={statusFilter === status ? "bg-accent" : ""}
                        >
                            {status === "all" ? "All" : statusConfig[status]?.label || status}
                            <Badge variant="secondary" className="ml-2 text-xs">
                                {statusCounts[status] || 0}
                            </Badge>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <FileCheck className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            {applications.length === 0
                                ? "You haven't applied to any jobs yet. Browse available jobs to get started!"
                                : "No applications match your search criteria."}
                        </p>
                        {applications.length === 0 && (
                            <Button asChild>
                                <a href="/talent/jobs">Browse Jobs</a>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredApplications.map((application) => {
                        const status = statusConfig[application.status] || statusConfig.applied;
                        return (
                            <Card key={application.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Status indicator */}
                                        <div className={`w-full md:w-2 ${application.status === "shortlisted" ? "bg-emerald-500" :
                                                application.status === "rejected" ? "bg-red-500" :
                                                    application.status === "hired" ? "bg-purple-500" :
                                                        "bg-blue-500"
                                            }`}></div>

                                        <div className="flex-1 p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">
                                                                {application.job?.title || "Untitled Job"}
                                                            </h3>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Building2 className="h-4 w-4" />
                                                                {application.job?.client?.company_name || "Unknown Company"}
                                                            </div>
                                                        </div>
                                                        <Badge className={`${status.color} border`}>
                                                            {status.icon}
                                                            <span className="ml-1">{status.label}</span>
                                                        </Badge>
                                                    </div>

                                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Briefcase className="h-4 w-4" />
                                                            {application.job?.role_needed || "N/A"}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {application.job?.weekly_hours || 0} hrs/week
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4" />
                                                            Applied {format(new Date(application.created_at), "MMM d, yyyy")}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TalentApplications;
