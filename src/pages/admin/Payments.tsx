import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Search, 
    DollarSign, 
    Calendar, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    Filter, 
    Download, 
    ArrowRight,
    MoreHorizontal,
    PauseCircle,
    PlayCircle,
    User,
    FileText,
    CreditCard,
    ChevronRight,
    CheckSquare,
    Square
} from "lucide-react";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

type PayoutStatus = 'ready_for_payout' | 'awaiting_client_payment' | 'processing' | 'paid' | 'on_hold';

interface Payout {
    id: string;
    talent_id: string;
    contract_id: string;
    invoice_id: string | null;
    gross_amount: number;
    commission_amount: number;
    net_amount: number;
    status: PayoutStatus;
    hold_reason: string | null;
    period_start: string;
    period_end: string;
    created_at: string;
    talent: {
        first_name: string;
        last_name: string;
    };
    contract: {
        contract_number: string;
        role_title: string;
        service_model: string;
        compensation_type: string;
        talent_rate: number;
        client: {
            company_name: string;
        };
    };
    invoice?: {
        invoice_number: string;
        status: string;
    };
}

const AdminPayments = () => {
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<string>("ready");
    
    // Selection state for batch processing
    const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
    
    // Detail View State
    const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    
    // Batch Payout Sheet State
    const [batchOpen, setBatchOpen] = useState(false);

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            // In a real scenario, we'd join with talents, contracts, clients, and optionally invoices.
            const { data, error } = await supabase
                .from("payouts")
                .select(`
                    *,
                    talent:talents (first_name, last_name),
                    contract:contracts (
                        contract_number,
                        role_title,
                        service_model,
                        compensation_type,
                        talent_rate,
                        client:clients (company_name)
                    ),
                    invoice:invoices (invoice_number, status)
                `)
                .order("created_at", { ascending: false });

            if (error) {
                // If the table doesn't exist yet (migration not applied in live DB), we might get an error.
                // For the sake of this redesign UI presentation, we'll use mock data if fetch fails.
                console.error("Error fetching payouts:", error);
                throw error;
            }
            setPayouts((data as unknown as Payout[]) || []);
        } catch (error: unknown) {
            const err = error as Error;
            console.error("Error fetching payouts:", err.message);
            toast.error("Error fetching payouts. Showing sample data.");
            setPayouts(MOCK_PAYOUTS as Payout[]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleHold = async (payoutId: string, currentStatus: PayoutStatus) => {
        try {
            const newStatus = currentStatus === 'on_hold' ? 'ready_for_payout' : 'on_hold';
            const { error } = await supabase
                .from("payouts")
                .update({ 
                    status: newStatus,
                    hold_reason: newStatus === 'on_hold' ? 'Admin manual hold' : null
                })
                .eq("id", payoutId);

            if (error) throw error;

            toast.success(`Payout ${newStatus === 'on_hold' ? 'placed on hold' : 'resumed'}`);
            fetchPayouts();
        } catch (error: unknown) {
            const err = error as Error;
            toast.error("Error updating payout: " + err.message);
        }
    };

    const stats = useMemo(() => {
        const ready = payouts.filter(p => p.status === 'ready_for_payout').reduce((sum, p) => sum + p.net_amount, 0);
        const pending = payouts.filter(p => p.status === 'awaiting_client_payment').reduce((sum, p) => sum + p.net_amount, 0);
        const paidThisMonth = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.net_amount, 0); // Simplified filter
        const deductions = payouts.reduce((sum, p) => sum + p.commission_amount, 0); // Example logic
        
        return { ready, pending, paidThisMonth, deductions };
    }, [payouts]);

    const filteredPayouts = useMemo(() => {
        return payouts.filter(p => {
            const matchesSearch = 
                `${p.talent.first_name} ${p.talent.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.contract.client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.contract.contract_number.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesTab = 
                (activeTab === 'ready' && (p.status === 'ready_for_payout' || p.status === 'awaiting_client_payment')) ||
                (activeTab === 'processing' && p.status === 'processing') ||
                (activeTab === 'paid' && p.status === 'paid') ||
                (activeTab === 'hold' && p.status === 'on_hold');
            
            return matchesSearch && matchesTab;
        });
    }, [payouts, searchQuery, activeTab]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedPayouts(filteredPayouts.map(p => p.id));
        } else {
            setSelectedPayouts([]);
        }
    };

    const handleSelectPayout = (payoutId: string, checked: boolean) => {
        if (checked) {
            setSelectedPayouts(prev => [...prev, payoutId]);
        } else {
            setSelectedPayouts(prev => prev.filter(id => id !== payoutId));
        }
    };

    const getStatusBadge = (status: PayoutStatus) => {
        switch (status) {
            case 'ready_for_payout':
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none">Ready</Badge>;
            case 'awaiting_client_payment':
                return <Badge className="bg-amber-50 text-amber-700 border-amber-100 shadow-none">Awaiting Client</Badge>;
            case 'processing':
                return <Badge className="bg-blue-50 text-blue-700 border-blue-100 shadow-none">Processing</Badge>;
            case 'paid':
                return <Badge className="bg-gray-100 text-gray-700 border-gray-200 shadow-none">Paid</Badge>;
            case 'on_hold':
                return <Badge className="bg-red-50 text-red-700 border-red-100 shadow-none">On Hold</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleBatchProcess = () => {
        if (selectedPayouts.length === 0) {
            toast.error("No payouts selected");
            return;
        }
        setBatchOpen(true);
    };

    const handleProcessPayout = async (payoutId: string) => {
        try {
            const { error } = await supabase
                .from("payouts")
                .update({ status: 'paid' })
                .eq("id", payoutId);

            if (error) throw error;

            toast.success("Payout processed successfully");
            setDetailOpen(false);
            fetchPayouts();
        } catch (error: unknown) {
            const err = error as Error;
            toast.error("Error processing payout: " + err.message);
        }
    };

    const executeBatch = async () => {
        try {
            const totalAmount = payouts
                .filter(p => selectedPayouts.includes(p.id))
                .reduce((sum, p) => sum + p.net_amount, 0);

            // 1. Create Batch
            const { data: batch, error: batchError } = await supabase
                .from("payout_batches")
                .insert({
                    total_amount: totalAmount,
                    status: 'completed',
                    processed_at: new Date().toISOString()
                })
                .select()
                .single();

            if (batchError) throw batchError;

            // 2. Update Payouts
            const { error: updateError } = await supabase
                .from("payouts")
                .update({ 
                    status: 'paid',
                    batch_id: batch.id
                })
                .in("id", selectedPayouts);

            if (updateError) throw updateError;

            toast.success(`Batch processed: ${selectedPayouts.length} payouts completed.`);
            setBatchOpen(false);
            setSelectedPayouts([]);
            fetchPayouts();
        } catch (error: unknown) {
            const err = error as Error;
            toast.error("Error executing batch: " + err.message);
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-12 animate-fade-in space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Payments</h1>
                    <p className="text-sm text-gray-500">Manage talent payouts and financial operations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-9 gap-2 text-gray-600 border-gray-200">
                        <Download className="h-4 w-4" />
                        Export Report
                    </Button>
                    <Button 
                        className="h-9 gap-2 bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
                        onClick={handleBatchProcess}
                        disabled={selectedPayouts.length === 0}
                    >
                        <CheckSquare className="h-4 w-4" />
                        Process Batch ({selectedPayouts.length})
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card 
                    className="border-gray-200 shadow-sm bg-white cursor-pointer hover:border-gray-300 transition-colors"
                    onClick={() => setActiveTab('ready')}
                >
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-2 bg-emerald-50 rounded-lg"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
                        <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Ready for Payout</p>
                            <p className="text-xl font-semibold text-gray-900">${stats.ready.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-gray-200 shadow-sm bg-white">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-2 bg-amber-50 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div>
                        <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pending Client Payments</p>
                            <p className="text-xl font-semibold text-gray-900">${stats.pending.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-gray-200 shadow-sm bg-white">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-2 bg-gray-50 rounded-lg"><CheckCircle className="h-5 w-5 text-gray-600" /></div>
                        <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Paid This Period</p>
                            <p className="text-xl font-semibold text-gray-900">${stats.paidThisMonth.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-gray-200 shadow-sm bg-white cursor-pointer hover:border-gray-300" onClick={() => setActiveTab('hold')}>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-2 bg-red-50 rounded-lg"><AlertCircle className="h-5 w-5 text-red-600" /></div>
                        <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Outstanding Deductions</p>
                            <p className="text-xl font-semibold text-gray-900">${stats.deductions.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs and Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <TabsList className="bg-transparent border-b border-gray-200 w-full md:w-auto justify-start h-auto p-0 rounded-none gap-8">
                        <TabsTrigger value="ready" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-sm font-medium">Ready for Payout</TabsTrigger>
                        <TabsTrigger value="processing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-sm font-medium">Processing</TabsTrigger>
                        <TabsTrigger value="paid" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-sm font-medium">Payout History</TabsTrigger>
                        <TabsTrigger value="hold" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-sm font-medium">Exceptions & Holds</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex items-center gap-3 flex-1 md:max-w-xs">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search payments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 border-gray-200 focus-visible:ring-gray-900"
                            />
                        </div>
                        <Button variant="outline" size="icon" className="h-9 w-9 border-gray-200 text-gray-600">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="w-[40px] px-4">
                                    <Checkbox 
                                        checked={selectedPayouts.length === filteredPayouts.length && filteredPayouts.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="text-[10px] uppercase text-gray-400 font-bold py-3">Talent / Contract</TableHead>
                                <TableHead className="text-[10px] uppercase text-gray-400 font-bold py-3">Service & Mode</TableHead>
                                <TableHead className="text-[10px] uppercase text-gray-400 font-bold py-3">Period</TableHead>
                                <TableHead className="text-[10px] uppercase text-gray-400 font-bold py-3">Gross</TableHead>
                                <TableHead className="text-[10px] uppercase text-gray-400 font-bold py-3">Net Payable</TableHead>
                                <TableHead className="text-[10px] uppercase text-gray-400 font-bold py-3">Status</TableHead>
                                <TableHead className="text-right px-4"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={8} className="h-32 text-center text-sm text-gray-500">Loading payout queue...</TableCell></TableRow>
                            ) : filteredPayouts.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="h-32 text-center text-sm text-gray-500">No payouts found matching your criteria.</TableCell></TableRow>
                            ) : filteredPayouts.map((p) => (
                                <TableRow key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <TableCell className="px-4">
                                        <Checkbox 
                                            checked={selectedPayouts.includes(p.id)}
                                            onCheckedChange={(checked) => handleSelectPayout(p.id, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-gray-900">{p.talent.first_name} {p.talent.last_name}</span>
                                            <span className="text-[10px] text-gray-500">{p.contract.client.company_name} • {p.contract.contract_number}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-medium text-gray-700 capitalize">{p.contract.service_model.replace('_', ' ')}</span>
                                            <span className="text-[10px] text-gray-500 capitalize">{p.contract.compensation_type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="text-[10px] text-gray-600">{new Date(p.period_start).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {new Date(p.period_end).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="text-[10px] text-gray-500">${p.gross_amount.toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="text-[10px] font-bold text-gray-900">${p.net_amount.toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        {getStatusBadge(p.status)}
                                    </TableCell>
                                    <TableCell className="text-right px-4">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 text-[10px] font-medium text-gray-600"
                                                onClick={() => {
                                                    setSelectedPayout(p);
                                                    setDetailOpen(true);
                                                }}
                                            >
                                                Details
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedPayout(p);
                                                        setDetailOpen(true);
                                                    }}>
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {p.status !== 'on_hold' ? (
                                                        <DropdownMenuItem 
                                                            className="text-red-600"
                                                            onClick={() => handleToggleHold(p.id, p.status)}
                                                        >
                                                            <PauseCircle className="h-4 w-4 mr-2" />
                                                            On Hold
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem 
                                                            className="text-emerald-600"
                                                            onClick={() => handleToggleHold(p.id, p.status)}
                                                        >
                                                            <PlayCircle className="h-4 w-4 mr-2" />
                                                            Resume
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem>
                                                        <ArrowRight className="h-4 w-4 mr-2" />
                                                        Pay Individually
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Tabs>

            {/* Payout Detail Drawer */}
            <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
                <SheetContent side="right" className="sm:max-w-[540px] w-full p-0 flex flex-col">
                    {selectedPayout && (
                        <>
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <SheetTitle className="text-xl font-semibold">{selectedPayout.talent.first_name} {selectedPayout.talent.last_name}</SheetTitle>
                                        <SheetDescription className="text-sm font-medium text-gray-500">
                                            {selectedPayout.contract.role_title} • {selectedPayout.contract.contract_number}
                                        </SheetDescription>
                                    </div>
                                    {getStatusBadge(selectedPayout.status)}
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Payout Breakdown Card */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payout Breakdown</h4>
                                    <Card className="border-gray-100 bg-gray-50/30 overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="p-4 space-y-3">
                                                <div className="flex justify-between text-xs text-gray-600">
                                                    <span>Gross Earnings</span>
                                                    <span className="font-medium text-gray-900">${selectedPayout.gross_amount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-600">
                                                    <span>Taskive Commission</span>
                                                    <span className="font-medium text-red-600">-${selectedPayout.commission_amount.toLocaleString()}</span>
                                                </div>
                                                {/* Deduction Records loop would go here */}
                                                <div className="flex justify-between text-xs text-gray-600">
                                                    <span>Tax Deductions</span>
                                                    <span className="font-medium text-red-600">-$0.00</span>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-gray-900 flex justify-between items-center text-white">
                                                <span className="text-sm font-medium">Net Payout</span>
                                                <span className="text-lg font-bold">${selectedPayout.net_amount.toLocaleString()}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Source Data */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Source Information</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        <Button variant="outline" className="justify-start h-12 w-full text-xs font-medium border-gray-100 px-4 group">
                                            <FileText className="h-4 w-4 mr-3 text-gray-400 group-hover:text-gray-900" />
                                            Invoice {selectedPayout.invoice?.invoice_number || 'N/A'}
                                            <ChevronRight className="h-3 w-3 ml-auto text-gray-300" />
                                        </Button>
                                        <Button variant="outline" className="justify-start h-12 w-full text-xs font-medium border-gray-100 px-4 group">
                                            <Calendar className="h-4 w-4 mr-3 text-gray-400 group-hover:text-gray-900" />
                                            View Timesheets
                                            <ChevronRight className="h-3 w-3 ml-auto text-gray-300" />
                                        </Button>
                                        <Button variant="outline" className="justify-start h-12 w-full text-xs font-medium border-gray-100 px-4 group">
                                            <Briefcase className="h-4 w-4 mr-3 text-gray-400 group-hover:text-gray-900" />
                                            Contract {selectedPayout.contract.contract_number}
                                            <ChevronRight className="h-3 w-3 ml-auto text-gray-300" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payment Method</h4>
                                    <div className="p-4 border border-gray-100 rounded-lg flex items-center gap-4">
                                        <div className="p-2 bg-gray-50 rounded-md">
                                            <CreditCard className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-900">Bank Transfer (Default)</p>
                                            <p className="text-[10px] text-gray-500">Chase Bank • **** 4242</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <SheetFooter className="p-6 border-t border-gray-100 sm:justify-start gap-3">
                                <Button 
                                    className="flex-1 h-10 bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
                                    onClick={() => handleProcessPayout(selectedPayout.id)}
                                >
                                    Process Payout
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 h-10 border-gray-200 text-gray-600"
                                    onClick={() => handleToggleHold(selectedPayout.id, selectedPayout.status)}
                                >
                                    {selectedPayout.status === 'on_hold' ? 'Resume' : 'On Hold'}
                                </Button>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {/* Batch Payout Drawer */}
            <Sheet open={batchOpen} onOpenChange={setBatchOpen}>
                <SheetContent side="right" className="sm:max-w-[640px] w-full p-0 flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <SheetTitle className="text-xl font-semibold">Process Batch Payouts</SheetTitle>
                        <SheetDescription className="mt-1">Review and execute payouts for {selectedPayouts.length} selected talents.</SheetDescription>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="text-[10px] uppercase text-gray-400 font-bold py-3 pl-6">Talent</TableHead>
                                    <TableHead className="text-[10px] uppercase text-gray-400 font-bold py-3">Payment Method</TableHead>
                                    <TableHead className="text-[10px] uppercase text-gray-400 font-bold py-3 text-right pr-6">Net Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payouts.filter(p => selectedPayouts.includes(p.id)).map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="py-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                                    {p.talent.first_name[0]}{p.talent.last_name[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-gray-900">{p.talent.first_name} {p.talent.last_name}</span>
                                                    <span className="text-[10px] text-gray-500">{p.contract.contract_number}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="text-[10px] text-gray-600">Bank Transfer ****4242</span>
                                        </TableCell>
                                        <TableCell className="py-4 text-right pr-6">
                                            <span className="text-sm font-bold text-gray-900">${p.net_amount.toLocaleString()}</span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Total Batch Amount</span>
                            <span className="text-2xl font-bold text-gray-900">
                                ${payouts.filter(p => selectedPayouts.includes(p.id)).reduce((sum, p) => sum + p.net_amount, 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 h-11 border-gray-200" onClick={() => setBatchOpen(false)}>Cancel</Button>
                            <Button className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={executeBatch}>Execute Payouts</Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

const MOCK_PAYOUTS = [
    {
        id: "p1",
        talent_id: "t1",
        contract_id: "c1",
        invoice_id: "inv1",
        gross_amount: 5000,
        commission_amount: 750,
        net_amount: 4250,
        status: 'ready_for_payout',
        hold_reason: null,
        period_start: '2026-02-01',
        period_end: '2026-02-14',
        created_at: new Date().toISOString(),
        talent: { first_name: "John", last_name: "Doe" },
        contract: {
            contract_number: "CON-10001",
            role_title: "Senior Product Designer",
            service_model: "contract_talent",
            compensation_type: "hourly",
            talent_rate: 65,
            client: { company_name: "Acme Corp" }
        },
        invoice: { invoice_number: "INV-50001", status: "paid" }
    },
    {
        id: "p2",
        talent_id: "t2",
        contract_id: "c2",
        invoice_id: "inv2",
        gross_amount: 4200,
        commission_amount: 630,
        net_amount: 3570,
        status: 'awaiting_client_payment',
        hold_reason: null,
        period_start: '2026-02-01',
        period_end: '2026-02-14',
        created_at: new Date().toISOString(),
        talent: { first_name: "Sarah", last_name: "Smith" },
        contract: {
            contract_number: "CON-10002",
            role_title: "Fullstack Developer",
            service_model: "trial_to_hire",
            compensation_type: "monthly",
            talent_rate: 8500,
            client: { company_name: "Globex Inc" }
        },
        invoice: { invoice_number: "INV-50002", status: "pending" }
    },
    {
        id: "p3",
        talent_id: "t3",
        contract_id: "c3",
        invoice_id: "inv3",
        gross_amount: 3000,
        commission_amount: 450,
        net_amount: 2550,
        status: 'on_hold',
        hold_reason: "Manual review required",
        period_start: '2026-02-01',
        period_end: '2026-02-14',
        created_at: new Date().toISOString(),
        talent: { first_name: "Alex", last_name: "Johnson" },
        contract: {
            contract_number: "CON-10003",
            role_title: "QA Engineer",
            service_model: "contract_talent",
            compensation_type: "hourly",
            talent_rate: 45,
            client: { company_name: "Initech" }
        },
        invoice: { invoice_number: "INV-50003", status: "paid" }
    }
];

export default AdminPayments;
