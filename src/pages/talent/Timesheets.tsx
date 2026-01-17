import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Clock,
    Plus,
    Calendar,
    FileText,
    CheckCircle,
    Timer,
    XCircle,
    AlertCircle,
    Building2,
    ArrowRight,
    Edit
} from "lucide-react";
import { format } from "date-fns";

interface Timesheet {
    id: string;
    week_start: string;
    week_end: string;
    total_hours: number;
    status: string;
    submitted_at: string | null;
    rejection_reason: string | null;
    contract: {
        contract_number: string;
        role_title: string;
        client: {
            company_name: string;
        };
    };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
    draft: { label: "Draft", color: "text-slate-600", icon: <Edit className="h-3 w-3" />, bg: "bg-slate-500" },
    submitted: { label: "Submitted", color: "text-blue-600", icon: <Timer className="h-3 w-3" />, bg: "bg-blue-500" },
    approved: { label: "Approved", color: "text-emerald-600", icon: <CheckCircle className="h-3 w-3" />, bg: "bg-emerald-500" },
    rejected: { label: "Rejected", color: "text-red-600", icon: <XCircle className="h-3 w-3" />, bg: "bg-red-500" },
};

const TalentTimesheets = () => {
    const { user } = useAuth();
    const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        if (user) {
            fetchTimesheets();
        }
    }, [user]);

    const fetchTimesheets = async () => {
        try {
            const { data: talent } = await supabase
                .from("talents")
                .select("id")
                .eq("user_id", user?.id)
                .single();

            if (!talent) return;

            const { data, error } = await supabase
                .from("timesheets")
                .select(`
          id,
          week_start,
          week_end,
          total_hours,
          status,
          submitted_at,
          rejection_reason,
          contract:contracts (
            contract_number,
            role_title,
            client:clients (
              company_name
            )
          )
        `)
                .eq("talent_id", talent.id)
                .order("week_start", { ascending: false });

            if (error) throw error;
            setTimesheets(data || []);
        } catch (error) {
            console.error("Error fetching timesheets:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTimesheets = timesheets.filter((ts) =>
        filterStatus === "all" || ts.status === filterStatus
    );

    const statusCounts = {
        all: timesheets.length,
        draft: timesheets.filter((ts) => ts.status === "draft").length,
        submitted: timesheets.filter((ts) => ts.status === "submitted").length,
        approved: timesheets.filter((ts) => ts.status === "approved").length,
        rejected: timesheets.filter((ts) => ts.status === "rejected").length,
    };

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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="h-6 w-6" />
                            <h1 className="text-2xl md:text-3xl font-bold">Timesheets</h1>
                        </div>
                        <p className="text-white/80">Submit and track your weekly timesheets</p>
                    </div>
                    <Link to="/talent/timesheets/new">
                        <Button className="bg-white text-purple-700 hover:bg-white/90 shadow-lg">
                            <Plus className="h-4 w-4 mr-2" />
                            New Timesheet
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`p-4 rounded-xl border transition-all ${filterStatus === status
                                ? "bg-accent text-white border-accent shadow-lg"
                                : "bg-card hover:border-accent/50"
                            }`}
                    >
                        <p className={`text-2xl font-bold ${filterStatus === status ? "" : status === "draft" ? "text-slate-600" : status === "submitted" ? "text-blue-600" : status === "approved" ? "text-emerald-600" : status === "rejected" ? "text-red-600" : ""}`}>
                            {count}
                        </p>
                        <p className={`text-sm ${filterStatus === status ? "text-white/80" : "text-muted-foreground"}`}>
                            {status === "all" ? "All" : statusConfig[status]?.label || status}
                        </p>
                    </button>
                ))}
            </div>

            {/* Timesheets List */}
            {filteredTimesheets.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Timesheets Found</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            {timesheets.length === 0
                                ? "You haven't submitted any timesheets yet. Create one to get started!"
                                : "No timesheets match the selected filter."}
                        </p>
                        {timesheets.length === 0 && (
                            <Link to="/talent/timesheets/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Timesheet
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredTimesheets.map((timesheet) => {
                        const status = statusConfig[timesheet.status] || statusConfig.draft;
                        return (
                            <Card key={timesheet.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                                <div className="flex">
                                    <div className={`w-2 ${status.bg}`}></div>
                                    <CardContent className="flex-1 p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-semibold">
                                                                {format(new Date(timesheet.week_start), "MMM d")} — {format(new Date(timesheet.week_end), "MMM d, yyyy")}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Building2 className="h-4 w-4" />
                                                            {timesheet.contract?.client?.company_name || "Unknown"} • {timesheet.contract?.role_title}
                                                        </div>
                                                    </div>
                                                    <Badge className={`${status.color} bg-opacity-10 border border-current`}>
                                                        {status.icon}
                                                        <span className="ml-1">{status.label}</span>
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-mono text-xs">{timesheet.contract?.contract_number}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 text-accent font-semibold">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{timesheet.total_hours} hours</span>
                                                    </div>
                                                    {timesheet.submitted_at && (
                                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm">
                                                            Submitted: {format(new Date(timesheet.submitted_at), "MMM d, yyyy")}
                                                        </div>
                                                    )}
                                                </div>

                                                {timesheet.status === "rejected" && timesheet.rejection_reason && (
                                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                        <span>{timesheet.rejection_reason}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                {timesheet.status === "draft" || timesheet.status === "rejected" ? (
                                                    <Link to={`/talent/timesheets/${timesheet.id}`}>
                                                        <Button size="sm">
                                                            <Edit className="h-4 w-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Link to={`/talent/timesheets/${timesheet.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            View Details
                                                            <ArrowRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TalentTimesheets;
