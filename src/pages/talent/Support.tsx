import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    HelpCircle,
    Search,
    Plus,
    Clock,
    AlertCircle,
    CheckCircle,
    MessageSquare,
    ChevronRight,
    Filter
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Ticket {
    id: string;
    category: string;
    priority: string;
    subject: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
    open: { label: "Open", color: "text-blue-600", icon: <AlertCircle className="h-3 w-3" />, bg: "bg-blue-500" },
    in_progress: { label: "In Progress", color: "text-amber-600", icon: <Clock className="h-3 w-3" />, bg: "bg-amber-500" },
    resolved: { label: "Resolved", color: "text-emerald-600", icon: <CheckCircle className="h-3 w-3" />, bg: "bg-emerald-500" },
    closed: { label: "Closed", color: "text-slate-600", icon: <CheckCircle className="h-3 w-3" />, bg: "bg-slate-500" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: "Low", color: "bg-slate-100 text-slate-700" },
    medium: { label: "Medium", color: "bg-blue-100 text-blue-700" },
    high: { label: "High", color: "bg-orange-100 text-orange-700" },
    urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

const categoryLabels: Record<string, string> = {
    payment: "Payment",
    job: "Job",
    technical: "Technical",
    talent_issue: "Talent Issue",
    billing: "Billing",
    other: "Other",
};

const TalentSupport = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        if (user) {
            fetchTickets();
        }
    }, [user]);

    const fetchTickets = async () => {
        try {
            const { data, error } = await supabase
                .from("support_tickets")
                .select("*")
                .eq("user_id", user?.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets.filter((ticket) => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const openCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-8 text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <HelpCircle className="h-6 w-6" />
                            <h1 className="text-2xl md:text-3xl font-bold">Support</h1>
                        </div>
                        <p className="text-white/80">Get help from our support team</p>
                    </div>
                    <div className="flex gap-3">
                        {openCount > 0 && (
                            <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
                                <p className="text-xs text-white/70">Open Tickets</p>
                                <p className="text-2xl font-bold">{openCount}</p>
                            </div>
                        )}
                        <Link to="/talent/support/new">
                            <Button className="bg-white text-red-600 hover:bg-white/90 shadow-lg">
                                <Plus className="h-4 w-4 mr-2" />
                                New Ticket
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {["all", "open", "in_progress", "resolved", "closed"].map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                            className={statusFilter === status ? "bg-accent" : ""}
                        >
                            {status === "all" ? "All" : statusConfig[status]?.label || status}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Tickets List */}
            {filteredTickets.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 rounded-full bg-gradient-to-br from-orange-100 to-red-100 mb-4">
                            <HelpCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Support Tickets</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            {tickets.length === 0
                                ? "You haven't created any support tickets yet."
                                : "No tickets match your search criteria."}
                        </p>
                        {tickets.length === 0 && (
                            <Link to="/talent/support/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Ticket
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredTickets.map((ticket) => {
                        const status = statusConfig[ticket.status] || statusConfig.open;
                        const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
                        return (
                            <Link key={ticket.id} to={`/talent/support/${ticket.id}`}>
                                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
                                    <div className="flex">
                                        <div className={`w-2 ${status.bg}`}></div>
                                        <CardContent className="flex-1 p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-start justify-between">
                                                        <h3 className="font-semibold group-hover:text-accent transition-colors">
                                                            {ticket.subject}
                                                        </h3>
                                                        <Badge className={`${status.color} bg-opacity-10 border border-current`}>
                                                            {status.icon}
                                                            <span className="ml-1">{status.label}</span>
                                                        </Badge>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {ticket.description}
                                                    </p>

                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {categoryLabels[ticket.category] || ticket.category}
                                                        </Badge>
                                                        <Badge className={`${priority.color} text-xs border-0`}>
                                                            {priority.label} Priority
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TalentSupport;
