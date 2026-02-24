import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
    Clock, 
    CheckCircle, 
    XCircle, 
    FileText, 
    AlertCircle, 
    Search,
    Filter,
    ArrowRight,
    DollarSign,
    Users,
    Calendar
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface Timesheet {
    id: string;
    status: string;
    week_start: string;
    week_end: string;
    total_hours: number;
    submitted_at: string | null;
    updated_at: string | null;
    invoice_id: string | null;
    contract: {
        id: string;
        contract_number: string;
        role_title: string;
        weekly_hours: number;
        compensation_type: string;
        service_model: string;
        client_gross_amount: number;
        client: { id: string, company_name: string };
        talent: { id: string, first_name: string, last_name: string };
    };
}

const AdminTimesheets = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [clientFilter, setClientFilter] = useState("all");

    useEffect(() => {
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("timesheets")
                .select(`
                    *,
                    contract:contracts (
                        id,
                        contract_number,
                        role_title,
                        weekly_hours,
                        compensation_type,
                        service_model,
                        client_gross_amount,
                        client:clients (id, company_name),
                        talent:talents (id, first_name, last_name)
                    )
                `)
                .order("submitted_at", { ascending: false });

            if (error) throw error;
            setTimesheets((data as any) || []);
        } catch (error: unknown) {
            const err = error as Error;
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Derived Stats
    const pendingTotal = timesheets.filter(ts => ts.status === 'submitted').length;
    const approvedThisMonth = timesheets.filter(ts => {
        if (ts.status !== 'approved' || !ts.updated_at) return false;
        const updatedAt = new Date(ts.updated_at);
        const now = new Date();
        return updatedAt.getMonth() === now.getMonth() && updatedAt.getFullYear() === now.getFullYear();
    }).length;
    const rejectedTotal = timesheets.filter(ts => ts.status === 'rejected').length;
    const readyForInvoice = timesheets.filter(ts => ts.status === 'approved' && !ts.invoice_id).length;

    // Filters
    const uniqueClients = Array.from(new Set(timesheets.map((ts: Timesheet) => ts.contract?.client?.company_name).filter(Boolean))) as string[];

    const filteredList = timesheets.filter((ts: Timesheet) => {
        const matchesSearch = 
            (ts.contract?.talent?.first_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ts.contract?.talent?.last_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ts.contract?.client?.company_name || "").toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || ts.status === statusFilter;
        const matchesClient = clientFilter === 'all' || ts.contract?.client?.company_name === clientFilter;
        
        return matchesSearch && matchesStatus && matchesClient;
    });

    const pendingQueue = timesheets.filter(ts => ts.status === 'submitted').slice(0, 5);
    const readyQueue = timesheets.filter(ts => ts.status === 'approved' && !ts.invoice_id).slice(0, 5);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "approved": return "bg-green-50 text-green-700 border-green-100";
            case "submitted": return "bg-blue-50 text-blue-700 border-blue-100";
            case "draft": return "bg-gray-50 text-gray-700 border-gray-100";
            case "rejected": return "bg-red-50 text-red-700 border-red-100";
            default: return "bg-gray-50 text-gray-700 border-gray-100";
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-12 animate-fade-in space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Timesheets</h1>
                <p className="text-sm text-gray-500">Review submitted hours and prepare billing for processing.</p>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-8">
                <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start h-auto p-0 rounded-none gap-8">
                    <TabsTrigger value="dashboard" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-sm font-medium">Overview</TabsTrigger>
                    <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-sm font-medium">All Timesheets</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-8 outline-none mt-0">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-gray-200 shadow-sm bg-white cursor-pointer hover:border-gray-300 transition-colors" onClick={() => { setStatusFilter('submitted'); /* Switch tab logic if needed */ }}>
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="p-2 bg-blue-50 rounded-lg"><Clock className="h-5 w-5 text-blue-600" /></div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pending Approval</p>
                                    <p className="text-xl font-semibold text-gray-900">{pendingTotal}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-gray-200 shadow-sm bg-white">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Approved This Period</p>
                                    <p className="text-xl font-semibold text-gray-900">{approvedThisMonth}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-gray-200 shadow-sm bg-white">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="p-2 bg-red-50 rounded-lg"><XCircle className="h-5 w-5 text-red-600" /></div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Rejected</p>
                                    <p className="text-xl font-semibold text-gray-900">{rejectedTotal}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-gray-200 shadow-sm bg-white">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="p-2 bg-amber-50 rounded-lg"><FileText className="h-5 w-5 text-amber-600" /></div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Ready for Invoice</p>
                                    <p className="text-xl font-semibold text-gray-900">{readyForInvoice}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Priority Queues */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Queue A: Pending Approval */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    Pending Approval
                                </h3>
                                <Button variant="link" className="text-xs text-blue-600 h-auto p-0" onClick={() => { setStatusFilter('submitted'); /* Tab switch */ }}>View All</Button>
                            </div>
                            <Card className="border-gray-200 shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow>
                                            <TableHead className="text-[10px] uppercase text-gray-400 font-bold">Talent</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 font-bold">Week</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 font-bold">Hours</TableHead>
                                            <TableHead className="text-right"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingQueue.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="h-24 text-center text-xs text-gray-500">No pending submissions.</TableCell></TableRow>
                                        ) : pendingQueue.map(ts => (
                                            <TableRow key={ts.id} className="cursor-pointer hover:bg-gray-50/50" onClick={() => navigate(`/admin/timesheets/${ts.id}`)}>
                                                <TableCell className="py-3">
                                                    <p className="text-xs font-semibold text-gray-900">{ts.contract?.talent?.first_name} {ts.contract?.talent?.last_name}</p>
                                                    <p className="text-[10px] text-gray-500">{ts.contract?.client?.company_name}</p>
                                                </TableCell>
                                                <TableCell className="py-3 text-[10px] text-gray-600">{new Date(ts.week_start).toLocaleDateString([], { month: 'short', day: 'numeric' })}</TableCell>
                                                <TableCell className="py-3 text-[10px] font-medium text-gray-900">{ts.total_hours}h</TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-semibold text-gray-400 hover:text-gray-900">
                                                        Review <ArrowRight className="h-3 w-3 ml-1" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>

                        {/* Queue B: Ready for Invoice */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                    Ready for Invoice
                                </h3>
                                <Button variant="link" className="text-xs text-green-600 h-auto p-0">Go to Invoices</Button>
                            </div>
                            <Card className="border-gray-200 shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow>
                                            <TableHead className="text-[10px] uppercase text-gray-400 font-bold">Talent</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 font-bold">Week</TableHead>
                                            <TableHead className="text-[10px] uppercase text-gray-400 font-bold text-right">Estimated</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {readyQueue.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="h-24 text-center text-xs text-gray-500">No approved timesheets pending invoice.</TableCell></TableRow>
                                        ) : readyQueue.map(ts => (
                                            <TableRow key={ts.id} className="cursor-pointer hover:bg-gray-50/50" onClick={() => navigate(`/admin/timesheets/${ts.id}`)}>
                                                <TableCell className="py-3">
                                                    <p className="text-xs font-semibold text-gray-900">{ts.contract?.talent?.first_name} {ts.contract?.talent?.last_name}</p>
                                                    <p className="text-[10px] text-gray-500">{ts.contract?.client?.company_name}</p>
                                                </TableCell>
                                                <TableCell className="py-3 text-[10px] text-gray-600">{new Date(ts.week_start).toLocaleDateString([], { month: 'short', day: 'numeric' })}</TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <p className="text-xs font-semibold text-gray-900">${(ts.total_hours * (ts.contract?.client_gross_amount || 0)).toFixed(2)}</p>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="all" className="space-y-6 outline-none mt-0">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex flex-1 items-center gap-3 min-w-[240px]">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search talent or client..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 border-gray-200 focus-visible:ring-brand-primary"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] h-9 border-gray-200">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="submitted">Submitted</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={clientFilter} onValueChange={setClientFilter}>
                                <SelectTrigger className="w-[160px] h-9 border-gray-200">
                                    <SelectValue placeholder="Client" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Clients</SelectItem>
                                    {uniqueClients.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" className="h-9 gap-2 border-gray-200 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            Date Range
                        </Button>
                    </div>

                    <Card className="border-gray-200 shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="text-[10px] uppercase font-bold text-gray-500">Talent</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold text-gray-500">Contract / Role</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold text-gray-500">Week Range</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold text-gray-500">Status</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold text-gray-500">Hours</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold text-gray-500 text-right">Invoiced</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-sm text-gray-500">Loading timesheets...</TableCell></TableRow>
                                ) : filteredList.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-sm text-gray-500">No timesheets found matching criteria.</TableCell></TableRow>
                                ) : filteredList.map(ts => (
                                    <TableRow key={ts.id} className="cursor-pointer hover:bg-gray-50/50 group" onClick={() => navigate(`/admin/timesheets/${ts.id}`)}>
                                        <TableCell>
                                            <p className="text-xs font-semibold text-gray-900 group-hover:text-brand-primary transition-colors">{ts.contract?.talent?.first_name} {ts.contract?.talent?.last_name}</p>
                                            <p className="text-[10px] text-gray-500">{ts.contract?.client?.company_name}</p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-[10px] font-medium text-gray-700">{ts.contract?.role_title}</p>
                                            <p className="text-[9px] text-gray-400 capitalize">{ts.contract?.compensation_type} • {ts.contract?.service_model?.replace('_', ' ')}</p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-[10px] text-gray-600">{new Date(ts.week_start).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {new Date(ts.week_end).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`text-[9px] px-2 py-0 h-5 mt-0.5 border capitalize ${getStatusStyles(ts.status)} shadow-none`}>
                                                {ts.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-900">{ts.total_hours} hrs</span>
                                                {ts.total_hours > (ts.contract?.weekly_hours || 40) && (
                                                    <span className="text-[9px] text-amber-600 font-medium">Overtime</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {ts.invoice_id ? (
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[9px] h-5">#INV-{ts.invoice_id.slice(0,4)}</Badge>
                                            ) : (
                                                <span className="text-[9px] text-gray-400">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminTimesheets;
