import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
    Search, 
    Calendar, 
    Clock, 
    MessageSquare, 
    Mail, 
    Building, 
    Filter,
    ArrowUpRight,
    Users,
    Zap,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getInternalPath } from "@/utils/subdomain";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const AdminConsultations = () => {
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [objectiveFilter, setObjectiveFilter] = useState("all");

    useEffect(() => {
        fetchConsultations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const fetchConsultations = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let query = supabase.from("consultations" as any).select("*").order("created_at", { ascending: false });

            if (statusFilter !== "all") {
                query = query.eq("lead_status", statusFilter);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (query as any);
            if (error) throw error;
            setConsultations(data || []);
        } catch (error: any) {
            console.error("Error fetching consultations:", error);
            toast.error("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        new: consultations.filter(c => c.lead_status === 'new').length,
        contacted: consultations.filter(c => c.lead_status === 'contacted').length,
        converted: consultations.filter(c => c.lead_status === 'converted').length,
        closed: consultations.filter(c => c.lead_status === 'closed').length,
    };

    const filteredConsultations = consultations.filter(c => {
        const matchesSearch = !searchQuery || (
            (c.first_name + " " + c.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.company || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
        const matchesObjective = objectiveFilter === "all" || c.objective === objectiveFilter;
        return matchesSearch && matchesObjective;
    });

    const getStatusBadge = (status: string) => {
        const base = "shadow-none border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider";
        switch (status) {
            case "new": return <Badge className={cn(base, "bg-blue-50 text-blue-700")}>New</Badge>;
            case "contacted": return <Badge className={cn(base, "bg-amber-50 text-amber-700")}>Contacted</Badge>;
            case "converted": return <Badge className={cn(base, "bg-emerald-50 text-emerald-700")}>Converted</Badge>;
            case "closed": return <Badge className={cn(base, "bg-gray-100 text-gray-600")}>Closed</Badge>;
            default: return <Badge variant="outline" className={base}>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in p-6 bg-white -m-6 rounded-lg min-h-screen">
            <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Consultations</h1>
                <p className="text-[13px] text-gray-500 font-medium">Manage incoming business inquiries and lead conversion.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "New Requests", value: stats.new, color: "blue", icon: Users },
                    { label: "Contacted", value: stats.contacted, color: "amber", icon: MessageSquare },
                    { label: "Converted", value: stats.converted, color: "emerald", icon: Zap },
                    { label: "Closed", value: stats.closed, color: "gray", icon: XCircle },
                ].map((stat) => (
                    <div 
                        key={stat.label}
                        className={cn(
                            "p-4 rounded-xl border border-gray-100 bg-white transition-all cursor-pointer hover:shadow-sm",
                            statusFilter === stat.color && "border-gray-900 ring-1 ring-gray-900"
                        )}
                        onClick={() => setStatusFilter(stat.label.toLowerCase().includes('new') ? 'new' : stat.label.toLowerCase())}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <stat.icon className={cn("h-4 w-4", `text-${stat.color}-500`)} />
                            <ArrowUpRight className="h-3 w-3 text-gray-300" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 leading-none tracking-tight">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex flex-1 items-center gap-3 w-full">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Find leads by name, email or company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 pl-10 border-gray-100 bg-gray-50/50 text-sm focus:bg-white transition-all"
                        />
                    </div>
                    <Select value={objectiveFilter} onValueChange={setObjectiveFilter}>
                        <SelectTrigger className="w-[160px] h-10 border-gray-100 text-[13px] font-medium text-gray-600 bg-gray-50/50">
                            <Filter className="h-3.5 w-3.5 mr-2" />
                            <SelectValue placeholder="Objective" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Objectives</SelectItem>
                            <SelectItem value="hire">Hire Talent</SelectItem>
                            <SelectItem value="advisory">Advisory</SelectItem>
                            <SelectItem value="project">Project Fee</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px] h-10 border-gray-100 text-[13px] font-medium text-gray-600 bg-gray-50/50">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter mr-2">{filteredConsultations.length} Results</p>
                </div>
            </div>

            {/* Table */}
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="hover:bg-transparent border-gray-100">
                            <TableHead className="w-[250px] font-bold text-[10px] text-gray-400 uppercase tracking-widest pl-6 h-11">Lead Name / Profile</TableHead>
                            <TableHead className="font-bold text-[10px] text-gray-400 uppercase tracking-widest h-11">Company</TableHead>
                            <TableHead className="font-bold text-[10px] text-gray-400 uppercase tracking-widest h-11">Objective</TableHead>
                            <TableHead className="font-bold text-[10px] text-gray-400 uppercase tracking-widest h-11">Preferred Date</TableHead>
                            <TableHead className="font-bold text-[10px] text-gray-400 uppercase tracking-widest h-11">Status</TableHead>
                            <TableHead className="font-bold text-[10px] text-gray-400 uppercase tracking-widest text-right pr-6 h-11">Requested</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-200" />
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">Indexing Leads...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredConsultations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center text-gray-400 font-medium italic text-sm">
                                    No active business inquiries found matching filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            filteredConsultations.map((c: any) => (
                                <TableRow 
                                    key={c.id} 
                                    className="group cursor-pointer hover:bg-gray-50/50 transition-colors border-gray-50 last:border-0"
                                    onClick={() => navigate(getInternalPath(`/admin/consultations/${c.id}`))}
                                >
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                                {c.first_name} {c.last_name}
                                                {c.lead_status === 'new' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>}
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-mono italic">{c.email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
                                            <Building className="h-3 w-3 text-gray-300" />
                                            {c.company || "Individual"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] border-gray-100 font-bold capitalize text-gray-500 bg-gray-50/50 shadow-none">
                                            {c.objective || "Inquiry"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-[12px] font-medium text-gray-600">
                                            <Calendar className="h-3 w-3 text-gray-300" />
                                            {c.preferred_date ? format(new Date(c.preferred_date), "MMM d") : "Flexible"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(c.lead_status)}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="text-[12px] font-bold text-gray-900">
                                                {format(new Date(c.created_at), "MMM d")}
                                            </div>
                                            <div className="text-[9px] text-gray-400 font-mono uppercase">
                                                {format(new Date(c.created_at), "HH:mm")}
                                            </div>
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

export default AdminConsultations;
