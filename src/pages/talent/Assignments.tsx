import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    FolderKanban,
    Building2,
    Calendar,
    Clock,
    User,
    DollarSign,
    FileText,
    CheckCircle,
    Timer,
    Pause,
    XCircle,
    ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface Assignment {
    id: string;
    contract_number: string;
    role_title: string;
    hourly_rate: number;
    talent_rate: number;
    weekly_hours: number;
    start_date: string;
    end_date: string | null;
    status: string;
    client: {
        company_name: string;
        primary_contact_name: string;
    };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
    pending: { label: "Pending", color: "text-amber-600", icon: <Timer className="h-4 w-4" />, bg: "from-amber-500 to-orange-500" },
    active: { label: "Active", color: "text-emerald-600", icon: <CheckCircle className="h-4 w-4" />, bg: "from-emerald-500 to-teal-500" },
    paused: { label: "Paused", color: "text-blue-600", icon: <Pause className="h-4 w-4" />, bg: "from-blue-500 to-indigo-500" },
    completed: { label: "Completed", color: "text-purple-600", icon: <CheckCircle className="h-4 w-4" />, bg: "from-purple-500 to-violet-500" },
    terminated: { label: "Terminated", color: "text-red-600", icon: <XCircle className="h-4 w-4" />, bg: "from-red-500 to-rose-500" },
};

const TalentAssignments = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchAssignments();
        }
    }, [user]);

    const fetchAssignments = async () => {
        try {
            const { data: talent } = await supabase
                .from("talents")
                .select("id")
                .eq("user_id", user?.id)
                .single();

            if (!talent) return;

            const { data, error } = await supabase
                .from("contracts")
                .select(`
          id,
          contract_number,
          role_title,
          hourly_rate,
          talent_rate,
          weekly_hours,
          start_date,
          end_date,
          status,
          client:clients (
            company_name,
            primary_contact_name
          )
        `)
                .eq("talent_id", talent.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAssignments(data || []);
        } catch (error) {
            console.error("Error fetching assignments:", error);
        } finally {
            setLoading(false);
        }
    };

    const activeAssignments = assignments.filter((a) => a.status === "active");
    const otherAssignments = assignments.filter((a) => a.status !== "active");

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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 p-8 text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <FolderKanban className="h-6 w-6" />
                            <h1 className="text-2xl md:text-3xl font-bold">My Assignments</h1>
                        </div>
                        <p className="text-white/80">View your active contracts and assignments</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
                            <p className="text-xs text-white/70">Active</p>
                            <p className="text-2xl font-bold">{activeAssignments.length}</p>
                        </div>
                        <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
                            <p className="text-xs text-white/70">Total</p>
                            <p className="text-2xl font-bold">{assignments.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {assignments.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <FolderKanban className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Assignments appear here once admin creates a contract for you after you're hired.
                        </p>
                        <Button asChild>
                            <Link to="/talent/jobs">Browse Available Jobs</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Active Assignments */}
                    {activeAssignments.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                Active Assignments
                            </h2>
                            <div className="grid gap-4">
                                {activeAssignments.map((assignment) => (
                                    <AssignmentCard key={assignment.id} assignment={assignment} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Other Assignments */}
                    {otherAssignments.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Past & Pending Assignments</h2>
                            <div className="grid gap-4">
                                {otherAssignments.map((assignment) => (
                                    <AssignmentCard key={assignment.id} assignment={assignment} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const AssignmentCard = ({ assignment }: { assignment: Assignment }) => {
    const status = statusConfig[assignment.status] || statusConfig.pending;

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
            <div className="flex">
                <div className={`w-2 bg-gradient-to-b ${status.bg}`}></div>
                <CardContent className="flex-1 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-3 flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">
                                        {assignment.role_title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Building2 className="h-4 w-4" />
                                        {assignment.client?.company_name || "Unknown Client"}
                                    </div>
                                </div>
                                <Badge className={`${status.color} bg-${status.color.split("-")[1]}-500/10 border border-current`}>
                                    {status.icon}
                                    <span className="ml-1">{status.label}</span>
                                </Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-mono text-xs">{assignment.contract_number}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{assignment.weekly_hours} hrs/week</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700">
                                    <DollarSign className="h-4 w-4" />
                                    <span className="font-semibold">${assignment.talent_rate}/hr</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Started {format(new Date(assignment.start_date), "MMM d, yyyy")}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                Contact: {assignment.client?.primary_contact_name || "N/A"}
                            </div>
                        </div>

                        {assignment.status === "active" && (
                            <div className="flex gap-2">
                                <Link to="/talent/timesheets/new">
                                    <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-500">
                                        Submit Timesheet
                                        <ArrowRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </CardContent>
            </div>
        </Card>
    );
};

export default TalentAssignments;
