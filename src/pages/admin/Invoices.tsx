import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { 
    Receipt, 
    CheckCircle, 
    Clock, 
    AlertTriangle, 
    Download, 
    FileText, 
    Send, 
    Search, 
    DollarSign,
    Filter,
    Plus,
    MoreHorizontal,
    ArrowUpRight,
    Loader2,
    Calendar,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const AdminInvoices = () => {
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [invoices, setInvoices] = useState<any[]>([]); 
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    
    // Generation Drawer State
    const [isGenerating, setIsGenerating] = useState(false);
    const [billingPeriod, setBillingPeriod] = useState("current_month");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pendingTimesheets, setPendingTimesheets] = useState<any[]>([]);
    const [selectedTimesheets, setSelectedTimesheets] = useState<string[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("invoices")
                .select(`
                    *,
                    clients (company_name),
                    contracts (
                        service_type,
                        talents (first_name, last_name)
                    )
                `)
                .order("due_date", { ascending: false });

            if (error) throw error;
            setInvoices(data || []);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const [stats, setStats] = useState({
        draft: 0,
        outstanding: 0,
        paidThisPeriod: 0,
        pendingPayout: 0
    });

    useEffect(() => {
        if (invoices.length > 0) {
            calculateStats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoices]);

    const calculateStats = () => {
        const now = new Date();
        const startOfCurMonth = startOfMonth(now);

        let draftCount = 0;
        let outstandingAmt = 0;
        let paidAmt = 0;
        let pendingPayoutAmt = 0;

        invoices.forEach(inv => {
            if (inv.status === 'draft' || inv.status === 'pending') draftCount++;
            if (inv.status !== 'paid' && inv.status !== 'cancelled') outstandingAmt += (inv.total_amount || 0);
            
            if (inv.status === 'paid' && inv.paid_at && new Date(inv.paid_at) >= startOfCurMonth) {
                paidAmt += (inv.total_amount || 0);
            }

            if (inv.status === 'paid' && inv.payment_status === 'paid') {
                // If paid but payout not reconciled? 
                // For simplified finance card, we show margin/payout readiness
                pendingPayoutAmt += (inv.payout_amount || (inv.total_amount * 0.8));
            }
        });

        setStats({
            draft: draftCount,
            outstanding: outstandingAmt,
            paidThisPeriod: paidAmt,
            pendingPayout: pendingPayoutAmt
        });
    };

    const fetchPendingTimesheets = async () => {
        try {
            setIsGenerating(true);
            const { data, error } = await supabase
                .from("timesheets")
                .select(`
                    id,
                    total_hours,
                    week_start,
                    week_end,
                    contract:contracts (
                        id,
                        contract_number,
                        client_gross_rate,
                        client_id,
                        clients:clients (company_name),
                        talents (first_name, last_name)
                    )
                `)
                .eq("status", "approved")
                .is("invoice_id", null);

            if (error) throw error;
            setPendingTimesheets(data || []);
            setSelectedTimesheets((data || []).map(ts => ts.id));
        } catch (error: any) {
            toast.error("Failed to fetch pending timesheets");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmGeneration = async () => {
        if (selectedTimesheets.length === 0) return;
        
        try {
            setIsGenerating(true);
            let count = 0;
            
            for (const tsId of selectedTimesheets) {
                const ts = pendingTimesheets.find(t => t.id === tsId);
                if (!ts) continue;

                const contract = ts.contract;
                const rate = contract.client_gross_rate || 0;
                const amount = ts.total_hours * rate;
                
                // 1. Create Invoice
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: inv, error: invErr } = await (supabase.from('invoices').insert({
                    invoice_number: `INV-${Math.floor(Math.random() * 900000) + 100000}`,
                    client_id: contract.client_id,
                    contract_id: contract.id,
                    billing_period_start: ts.week_start,
                    billing_period_end: ts.week_end,
                    total_hours: ts.total_hours,
                    hourly_rate: rate,
                    subtotal: amount,
                    total_amount: amount,
                    status: 'draft',
                    due_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
                    payout_amount: amount * 0.8, // simplified logic for demo
                    margin_amount: amount * 0.2
                } as any).select().single() as any);

                if (invErr) throw invErr;

                // 2. Link Timesheet
                await supabase.from('timesheets').update({ invoice_id: inv.id } as any).eq('id', ts.id);
                
                // 3. Create Line Item
                await supabase.from('invoice_line_items' as any).insert({
                    invoice_id: inv.id,
                    description: `Professional Services: ${format(new Date(ts.week_start), "MMM d")} - ${format(new Date(ts.week_end), "MMM d")}`,
                    amount: amount,
                    quantity: ts.total_hours,
                    unit_price: rate,
                    type: 'regular'
                });

                count++;
            }

            toast.success(`Generated ${count} draft invoices`);
            setDrawerOpen(false);
            fetchInvoices();
        } catch (error: any) {
            toast.error("Generation failed: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const base = "shadow-none border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider";
        switch (status) {
            case "paid": return <Badge className={cn(base, "bg-emerald-50 text-emerald-700")}>Paid</Badge>;
            case "draft": return <Badge className={cn(base, "bg-gray-100 text-gray-600")}>Draft</Badge>;
            case "pending": return <Badge className={cn(base, "bg-blue-50 text-blue-700")}>Pending</Badge>;
            case "overdue": return <Badge className={cn(base, "bg-red-50 text-red-700")}>Overdue</Badge>;
            case "sent": return <Badge className={cn(base, "bg-blue-50 text-blue-700")}>Sent</Badge>;
            default: return <Badge variant="outline" className={base}>{status}</Badge>;
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             inv.clients?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 w-full max-w-none px-6 lg:px-10 pb-20 font-inter">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Invoices</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage client billing and revenue cycle.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600 font-bold px-4">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Sheet open={drawerOpen} onOpenChange={(open) => {
                        setDrawerOpen(open);
                        if (open) fetchPendingTimesheets();
                    }}>
                        <SheetTrigger asChild>
                            <Button className="h-9 bg-gray-900 hover:bg-gray-800 text-white font-bold px-4 shadow-sm border-0">
                                <Plus className="h-4 w-4 mr-2" />
                                Generate Invoices
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-xl p-0 flex flex-col h-full border-l border-gray-100">
                            <SheetHeader className="p-6 border-b border-gray-50 bg-gray-50/50">
                                <SheetTitle className="text-xl font-bold">Generate Invoices</SheetTitle>
                                <SheetDescription className="text-sm">Batch create invoices from approved timesheets.</SheetDescription>
                            </SheetHeader>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 text-gray-900">
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Billing Period</Label>
                                    <Select value={billingPeriod} onValueChange={setBillingPeriod}>
                                        <SelectTrigger className="h-10 text-sm border-gray-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="current_month">Current Month ({format(new Date(), "MMMM")})</SelectItem>
                                            <SelectItem value="last_month">Last Month ({format(subMonths(new Date(), 1), "MMMM")})</SelectItem>
                                            <SelectItem value="custom">Custom Range</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Review Drafts ({selectedTimesheets.length})</Label>
                                        <Button variant="ghost" size="sm" className="text-[11px] underline h-6 px-0 decoration-gray-300" 
                                            onClick={() => setSelectedTimesheets(pendingTimesheets.map(t => t.id))}>Select All</Button>
                                    </div>
                                    
                                    <div className="space-y-0.5 border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                                        {isGenerating ? (
                                            <div className="p-8 flex flex-col items-center gap-3 text-gray-400">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                <span className="text-[11px] font-bold uppercase tracking-tighter">Analyzing approvals...</span>
                                            </div>
                                        ) : pendingTimesheets.length === 0 ? (
                                            <div className="p-8 text-center text-gray-400 text-xs italic">No approved timesheets pending.</div>
                                        ) : pendingTimesheets.map((ts) => (
                                            <div key={ts.id} className="p-4 bg-white hover:bg-gray-50/50 border-b border-gray-50 last:border-0 flex items-center justify-between transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <Checkbox 
                                                        checked={selectedTimesheets.includes(ts.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setSelectedTimesheets(prev => [...prev, ts.id]);
                                                            else setSelectedTimesheets(prev => prev.filter(id => id !== ts.id));
                                                        }}
                                                    />
                                                    <div>
                                                        <p className="text-[13px] font-bold text-gray-900">{ts.contract?.clients?.company_name}</p>
                                                        <p className="text-[11px] text-gray-500 font-mono tracking-tighter uppercase">
                                                            {ts.contract?.talents?.first_name} {ts.contract?.talents?.last_name} • {ts.total_hours}h • {ts.contract?.contract_number}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[13px] font-bold text-gray-900">${(ts.total_hours * (ts.contract?.client_gross_rate || 0)).toLocaleString()}</p>
                                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Approx. Invoice</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <SheetFooter className="p-6 border-t border-gray-100 bg-gray-50/50">
                                <Button variant="outline" className="flex-1 h-11 border-gray-200 text-gray-600 font-bold" onClick={() => setDrawerOpen(false)}>Cancel</Button>
                                <Button 
                                    className="flex-1 h-11 bg-gray-900 hover:bg-gray-800 text-white font-bold" 
                                    onClick={handleConfirmGeneration}
                                    disabled={selectedTimesheets.length === 0 || isGenerating}
                                >
                                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirm & Generate ({selectedTimesheets.length})
                                </Button>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Financial Overview - Stripe Style */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group hover:border-gray-300 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Draft Invoices</span>
                        <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-gray-100"><Receipt className="h-4 w-4" /></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-gray-900">{stats.draft}</span>
                        <span className="text-xs text-gray-400 font-medium">unissued</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group hover:border-gray-300 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Outstanding</span>
                        <div className="p-1.5 rounded-lg bg-orange-50 text-orange-400 group-hover:bg-orange-100"><Clock className="h-4 w-4" /></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-gray-900">${stats.outstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <span className="text-xs text-orange-400 font-bold">Awaiting</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group hover:border-gray-300 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Paid (Period)</span>
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-400 group-hover:bg-emerald-100"><CheckCircle className="h-4 w-4" /></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-gray-900">${stats.paidThisPeriod.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <span className="text-xs text-emerald-400 font-bold">Collected</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group hover:border-gray-300 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Est. Payouts</span>
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-400 group-hover:bg-blue-100"><DollarSign className="h-4 w-4" /></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-gray-900">${stats.pendingPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <span className="text-xs text-blue-400 font-bold">Payable</span>
                    </div>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search ID or Client..." 
                            className="pl-10 h-10 border-gray-200 bg-white shadow-sm focus:border-brand-primary" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 h-10 border-gray-200 bg-white font-medium text-gray-600">
                             <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-9 px-3 text-gray-500 font-bold text-xs uppercase tracking-tight">
                        <Calendar className="h-4 w-4 mr-2" />
                        Custom Range
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/30">
                        <TableRow className="hover:bg-transparent border-gray-100">
                            <TableHead className="w-[120px] text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-6">ID</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</TableHead>
                            <TableHead className="w-[50px] pr-6"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-3 text-gray-300">
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-200" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Retrieving Ledger...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <Receipt className="h-8 w-8 text-gray-200" />
                                        <span className="text-sm font-medium">No records found matching criteria.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvoices.map((inv) => (
                                <TableRow 
                                    key={inv.id} 
                                    className="group cursor-pointer hover:bg-gray-50/50 transition-colors border-gray-50 last:border-0"
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                                >
                                    <TableCell className="pl-6">
                                        <span className="font-mono text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded group-hover:border-gray-200 group-hover:text-gray-500 transition-colors">
                                            {inv.invoice_number || `#${inv.id.slice(0,8)}`}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-gray-900 tracking-tight">{inv.clients?.company_name}</span>
                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                                                {inv.contracts?.talents?.first_name} {inv.contracts?.talents?.last_name?.[0]}.
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 border-gray-100 text-gray-500 bg-gray-50/30 shadow-none font-mono capitalize">
                                            {inv.contracts?.service_type || "N/A"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-[13px] font-bold text-gray-900 font-mono">${(inv.total_amount || 0).toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {getStatusBadge(inv.status)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-medium text-gray-600">{format(new Date(inv.due_date), "MMM d, yyyy")}</span>
                                            {new Date(inv.due_date) < new Date() && inv.status !== 'paid' && (
                                                <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter leading-none mt-0.5">Overdue</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-900 transition-colors inline-block" />
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

export default AdminInvoices;
