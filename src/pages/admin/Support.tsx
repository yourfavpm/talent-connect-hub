import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Search, 
    Filter, 
    MessageSquare, 
    Clock, 
    AlertCircle, 
    CheckCircle, 
    User, 
    ArrowRight,
    RotateCcw,
    ChevronRight,
    CircleDot
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketCategory = 'payment' | 'job' | 'technical' | 'talent_issue' | 'billing' | 'other';

interface SupportTicket {
    id: string;
    user_id: string;
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    unread_by_admin: boolean;
    created_at: string;
    updated_at: string;
    user?: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        role_type?: 'talent' | 'client';
    };
}

const AdminSupport = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [userTypeFilter, setUserTypeFilter] = useState<string>("all");

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("support_tickets")
                .select(`
                    *,
                    user:profiles (id, email, first_name, last_name)
                `)
                .order("unread_by_admin", { ascending: false })
                .order("created_at", { ascending: false });

            if (error) throw error;

            // In a real scenario, we'd also determine user type (Talent/Client)
            // For now, mapping data for the UI
            setTickets(data as any[] || []);
        } catch (error: any) {
            toast.error("Error fetching tickets: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const open = tickets.filter(t => t.status === 'open').length;
        const inProgress = tickets.filter(t => t.status === 'in_progress').length;
        const urgent = tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed').length;
        // Resolved today - simplified logic
        const resolvedToday = tickets.filter(t => t.status === 'resolved').length;
        
        return { open, inProgress, urgent, resolvedToday };
    }, [tickets]);

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            const matchesSearch = 
                t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                `${t.user?.first_name} ${t.user?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.id.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesStatus = statusFilter === "all" || t.status === statusFilter;
            const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
            const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
            
            return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
        });
    }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter]);

    const resetFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setPriorityFilter("all");
        setCategoryFilter("all");
        setUserTypeFilter("all");
    };

    const getStatusBadge = (status: TicketStatus) => {
        switch (status) {
            case 'open':
                return <Badge className="bg-blue-50 text-blue-700 border-blue-100 shadow-none">Open</Badge>;
            case 'in_progress':
                return <Badge className="bg-amber-50 text-amber-700 border-amber-100 shadow-none font-medium">In Progress</Badge>;
            case 'resolved':
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none font-medium">Resolved</Badge>;
            case 'closed':
                return <Badge className="bg-gray-100 text-gray-500 border-gray-200 shadow-none font-medium border">Closed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: TicketPriority) => {
        switch (priority) {
            case 'urgent':
                return <Badge className="bg-red-600 text-white border-red-200 shadow-sm animate-pulse">URGENT</Badge>;
            case 'high':
                return <Badge className="bg-orange-50 text-orange-700 border-orange-100 shadow-none font-medium">High</Badge>;
            case 'medium':
                return <Badge className="bg-gray-50 text-gray-600 border-gray-100 shadow-none font-medium">Medium</Badge>;
            case 'low':
                return <Badge className="bg-gray-50 text-gray-400 border-gray-100 shadow-none font-medium">Low</Badge>;
            default:
                return <Badge variant="outline">{priority}</Badge>;
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-12 animate-fade-in space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Support</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and resolve user inquiries.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Open Tickets", value: stats.open, color: "bg-blue-50 text-blue-700", icon: MessageSquare, filterValue: 'open' },
                    { label: "In Progress", value: stats.inProgress, color: "bg-amber-50 text-amber-700", icon: Clock, filterValue: 'in_progress' },
                    { label: "Urgent", value: stats.urgent, color: "bg-red-50 text-red-700", icon: AlertCircle, filterValue: 'all', priority: 'urgent' },
                    { label: "Resolved Today", value: stats.resolvedToday, color: "bg-emerald-50 text-emerald-700", icon: CheckCircle, filterValue: 'resolved' }
                ].map((stat) => (
                    <Card 
                        key={stat.label} 
                        className="border-gray-200 shadow-sm bg-white cursor-pointer hover:border-gray-300 transition-colors"
                        onClick={() => {
                            if (stat.priority) setPriorityFilter(stat.priority);
                            else setStatusFilter(stat.filterValue);
                        }}
                    >
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Toolbar */}
            <Card className="border-gray-200 shadow-sm bg-white overflow-visible">
                <CardContent className="p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-3 w-full max-w-xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                placeholder="Search by subject, user, or ticket ID..." 
                                className="pl-9 h-10 border-gray-200 shadow-none focus-visible:ring-gray-400 bg-gray-50/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px] h-10 border-gray-200 bg-white">
                                <span className="text-gray-500 mr-2 text-xs">Status:</span>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[140px] h-10 border-gray-200 bg-white">
                                <span className="text-gray-500 mr-2 text-xs">Priority:</span>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[150px] h-10 border-gray-200 bg-white">
                                <span className="text-gray-500 mr-2 text-xs">Category:</span>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="payment">Payment</SelectItem>
                                <SelectItem value="job">Job</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="billing">Billing</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button 
                            variant="ghost" 
                            className="h-10 text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200 px-3"
                            onClick={resetFilters}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Ticket Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50 border-b border-gray-100">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[120px] text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-6">Ticket ID</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-40 text-center text-gray-400 text-sm">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-5 w-5 border-2 border-gray-200 border-t-brand-primary rounded-full animate-spin" />
                                        <span>Loading tickets...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredTickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-40 text-center">
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <MessageSquare className="h-8 w-8 opacity-20" />
                                        <p>No support tickets found</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTickets.map((ticket) => (
                                <TableRow 
                                    key={ticket.id} 
                                    className={`group cursor-pointer border-b border-gray-50 hover:bg-gray-50/80 transition-colors ${ticket.unread_by_admin ? 'bg-blue-50/30' : ''}`}
                                    onClick={() => navigate(`/admin/support/${ticket.id}`)}
                                >
                                    <TableCell className="pl-6 font-mono text-[11px] text-gray-500">
                                        <div className="flex items-center gap-2">
                                            {ticket.unread_by_admin && <CircleDot className="h-2 w-2 text-blue-600 fill-blue-600" />}
                                            #{ticket.id.split('-')[0].toUpperCase()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className={`text-[13px] tracking-tight ${ticket.unread_by_admin ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                {ticket.subject}
                                            </span>
                                            <span className="text-[11px] text-gray-400 truncate max-w-[300px]">
                                                {ticket.id}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-[13px] text-gray-600 capitalize">{ticket.category.replace('_', ' ')}</span>
                                    </TableCell>
                                    <TableCell>
                                        {getPriorityBadge(ticket.priority)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(ticket.status)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200 shrink-0">
                                                {ticket.user?.first_name?.charAt(0) || "U"}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[13px] text-gray-700 font-medium truncate">{ticket.user?.first_name} {ticket.user?.last_name}</span>
                                                <span className="text-[11px] text-gray-400 truncate">{ticket.user?.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-[12px]">
                                            <span className="text-gray-600">{format(new Date(ticket.created_at), "MMM d, yyyy")}</span>
                                            <span className="text-gray-400 text-[10px]">{format(new Date(ticket.created_at), "h:mm a")}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="pr-6">
                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminSupport;
