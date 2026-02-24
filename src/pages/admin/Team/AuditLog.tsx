import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    ArrowLeft, 
    Search, 
    Filter, 
    Calendar, 
    User, 
    Database, 
    AlertCircle,
    Download,
    RefreshCcw,
    Loader2,
    Clock,
    Shield
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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

interface AuditLogEntry {
    id: string;
    created_at: string;
    action: string;
    module: string;
    target_id: string | null;
    metadata: Record<string, unknown> | null;
    admin_id: string;
    admin: {
        full_name: string;
        email: string;
    } | null;
}

const AuditLog = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [search, setSearch] = useState("");
    const [moduleFilter, setModuleFilter] = useState("all");

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("audit_logs")
                .select(`
                    *,
                    admin:admin_users(full_name, email)
                `)
                .order("created_at", { ascending: false })
                .limit(100);

            if (error) throw error;
            setLogs((data as unknown as AuditLogEntry[]) || []);
        } catch (error: unknown) {
            toast.error("Failed to load audit logs: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action: string) => {
        const base = "shadow-none border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider";
        if (action.includes('CREATE') || action.includes('INSERT')) return <Badge className={cn(base, "bg-emerald-50 text-emerald-700")}>{action}</Badge>;
        if (action.includes('UPDATE')) return <Badge className={cn(base, "bg-blue-50 text-blue-700")}>{action}</Badge>;
        if (action.includes('DELETE')) return <Badge className={cn(base, "bg-red-50 text-red-700")}>{action}</Badge>;
        return <Badge className={cn(base, "bg-gray-100 text-gray-600")}>{action}</Badge>;
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.action?.toLowerCase().includes(search.toLowerCase()) || 
            log.admin?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            log.target_id?.toLowerCase().includes(search.toLowerCase());
        const matchesModule = moduleFilter === "all" || log.module === moduleFilter;
        return matchesSearch && matchesModule;
    });

    const uniqueModules = Array.from(new Set(logs.map(l => l.module || "system"))).sort();

    return (
        <div className="space-y-6 animate-fade-in bg-white p-6 -m-6 rounded-lg min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/admin/team")} className="h-8 w-8 text-gray-400">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">Security & Audit Log</h1>
                        <p className="text-[12px] text-gray-500 font-medium mt-0.5">Immutable record of all administrative actions and system changes.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600 font-bold" onClick={fetchLogs}>
                        <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600 font-bold">
                        <Download className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input 
                            placeholder="Search by action, admin, or target ID..." 
                            className="pl-9 h-9 text-sm border-gray-200 focus-visible:ring-gray-200 placeholder:text-gray-400"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={moduleFilter} onValueChange={setModuleFilter}>
                        <SelectTrigger className="w-[160px] h-9 border-gray-200 text-[12px] font-bold">
                            <Database className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            <SelectValue placeholder="All Modules" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Modules</SelectItem>
                            {uniqueModules.map(m => (
                                <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="border border-gray-100 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="hover:bg-transparent border-gray-100">
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10 w-[180px]">Timestamp</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10">Administrator</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10">Action</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10">Module</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10">Target ID</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10 text-right">Context</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Retrieving Audit Stream...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-gray-400 italic">No activity logs found matching your criteria.</TableCell>
                            </TableRow>
                        ) : filteredLogs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-gray-50/30 border-gray-100">
                                <TableCell className="whitespace-nowrap font-mono text-[11px] text-gray-500">
                                    {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">{log.admin?.full_name || "System"}</span>
                                        <span className="text-[10px] text-gray-500">{log.admin?.email || "automated-process"}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{getActionBadge(log.action)}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-gray-50 border-gray-100 text-[10px] font-bold uppercase text-gray-600 shadow-none">
                                        {log.module}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-[11px] text-gray-400">
                                    {log.target_id ? log.target_id.substring(0, 12) + "..." : "---"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-50">
                                        View Data
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            <div className="py-4 flex justify-center">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic flex items-center gap-2">
                    <Shield className="h-3 w-3" /> End of cryptographically signed logs
                </p>
            </div>
        </div>
    );
};

export default AuditLog;
