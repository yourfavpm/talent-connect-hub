import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AuditLogEntry {
    id: string;
    created_at: string;
    action: string;
    module: string;
    target_id: string | null;
    metadata: Record<string, unknown> | null;
    admin: {
        full_name: string;
        email: string;
    } | null;
}

const AuditLogs = () => {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [search, setSearch] = useState("");

    const settingsModules = [
        'organization', 'pricing', 'contracts', 'finance', 
        'workflows', 'notifications', 'security', 'branding', 
        'integrations', 'compliance'
    ];

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
                .in('module', settingsModules)
                .order("created_at", { ascending: false })
                .limit(100);

            if (error) throw error;
            setLogs((data as any) || []);
        } catch (error: any) {
            console.error("Failed to load audit logs:", error.message);
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

    const filteredLogs = logs.filter(log => 
        log.action?.toLowerCase().includes(search.toLowerCase()) || 
        log.module?.toLowerCase().includes(search.toLowerCase()) ||
        log.admin?.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Settings Audit Trail</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Track every change made to platform configurations.</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input 
                        placeholder="Search changes..." 
                        className="pl-9 h-9 text-xs"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border border-gray-100 rounded-lg overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="hover:bg-transparent border-gray-100">
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10 w-[150px]">Timestamp</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10">Admin</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10">Category</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10">Action</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10 text-right">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-gray-400 italic text-sm">
                                    No settings-related activity recorded yet.
                                </TableCell>
                            </TableRow>
                        ) : filteredLogs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-gray-50/30 border-gray-100">
                                <TableCell className="whitespace-nowrap font-mono text-[11px] text-gray-500">
                                    {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">{log.admin?.full_name || "System"}</span>
                                        <span className="text-[10px] text-gray-500">{log.admin?.email || "automated"}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-gray-50 border-gray-100 text-[10px] font-bold uppercase text-gray-600 shadow-none">
                                        {log.module}
                                    </Badge>
                                </TableCell>
                                <TableCell>{getActionBadge(log.action)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-50">
                                        View Diff
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="py-2 flex justify-center">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic flex items-center gap-2">
                    <Shield className="h-3 w-3" /> End of settings audit stream
                </p>
            </div>
        </div>
    );
};

export default AuditLogs;
