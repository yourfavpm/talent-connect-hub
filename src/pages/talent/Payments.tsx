import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
    DollarSign,
    CheckCircle,
    Clock,
    TrendingUp,
    Briefcase,
    Calendar,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Search,
    HelpCircle,
    FileText,
    X,
    Info
} from "lucide-react";
import { format } from "date-fns";

interface PaymentSummary {
    totalEarned: number;
    totalPaid: number;
    pendingPayments: number;
    upcomingPayments: number;
}

interface Contract {
    id: string;
    contract_number: string;
    client: { company_name: string };
    role_title: string;
    contract_type: string;
    talent_rate: number;
    payment_cycle: string;
    status: string;
    start_date: string;
    end_date: string | null;
}

interface PaymentEntry {
    id: string;
    date: string;
    contract_number: string;
    client_name: string;
    work_period: string;
    amount: number;
    status: "pending_approval" | "approved" | "paid" | "rejected";
    admin_note: string | null;
    reference_id: string | null;
    contract_id: string;
    role_title: string;
}

interface Timesheet {
    id: string;
    week_start: string;
    week_end: string;
    total_hours: number;
    status: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending_approval: { label: "Pending Approval", color: "bg-amber-100 text-amber-700", icon: <Clock className="h-3 w-3" /> },
    approved: { label: "Awaiting Payment", color: "bg-blue-100 text-blue-700", icon: <Clock className="h-3 w-3" /> },
    paid: { label: "Paid", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle className="h-3 w-3" /> },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: <AlertCircle className="h-3 w-3" /> },
};

const TalentPayments = () => {
    const { user } = useAuth();
    const [talentId, setTalentId] = useState<string>("");
    const [summary, setSummary] = useState<PaymentSummary>({
        totalEarned: 0,
        totalPaid: 0,
        pendingPayments: 0,
        upcomingPayments: 0,
    });
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [payments, setPayments] = useState<PaymentEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedContract, setExpandedContract] = useState<string | null>(null);
    const [contractTimesheets, setContractTimesheets] = useState<Record<string, Timesheet[]>>({});
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPayment, setSelectedPayment] = useState<PaymentEntry | null>(null);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            // Get talent
            const { data: talent } = await supabase
                .from("talents")
                .select("id")
                .eq("user_id", user?.id)
                .single();

            if (!talent) return;
            setTalentId(talent.id);

            // Fetch contracts
            const { data: contractsData } = await supabase
                .from("contracts")
                .select(`
          id,
          contract_number,
          role_title,
          talent_rate,
          status,
          start_date,
          end_date,
          client:clients (
            company_name
          )
        `)
                .eq("talent_id", talent.id)
                .order("created_at", { ascending: false });

            setContracts(contractsData?.map(c => ({
                ...c,
                contract_type: "Hourly",
                payment_cycle: "Monthly",
            })) || []);

            // Fetch timesheets for payment calculation
            const { data: timesheets } = await supabase
                .from("timesheets")
                .select(`
          id,
          week_start,
          week_end,
          total_hours,
          status,
          contract_id,
          contract:contracts (
            contract_number,
            role_title,
            talent_rate,
            client:clients (
              company_name
            )
          )
        `)
                .eq("talent_id", talent.id)
                .order("week_start", { ascending: false });

            // Convert timesheets to payment entries
            const statusMapping: Record<string, PaymentEntry["status"]> = {
                draft: "pending_approval",
                submitted: "pending_approval",
                approved: "approved",
                rejected: "rejected",
            };

            const paymentEntries: PaymentEntry[] = (timesheets || []).map(ts => {
                const status: PaymentEntry["status"] = statusMapping[ts.status] || "pending_approval";

                const rate = (ts.contract as any)?.talent_rate || 0;
                const amount = ts.total_hours * rate;

                return {
                    id: ts.id,
                    date: ts.week_end,
                    contract_number: (ts.contract as any)?.contract_number || "",
                    client_name: (ts.contract as any)?.client?.company_name || "",
                    work_period: `${format(new Date(ts.week_start), "MMM d")} - ${format(new Date(ts.week_end), "MMM d, yyyy")}`,
                    amount,
                    status,
                    admin_note: null,
                    reference_id: `PAY-${ts.id.slice(0, 8).toUpperCase()}`,
                    contract_id: ts.contract_id,
                    role_title: (ts.contract as any)?.role_title || "",
                };
            });

            setPayments(paymentEntries);

            // Calculate summary
            const totalEarned = paymentEntries.reduce((sum, p) => sum + p.amount, 0);
            const totalPaid = paymentEntries.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
            const pendingPayments = paymentEntries.filter(p => p.status === "approved").reduce((sum, p) => sum + p.amount, 0);
            const upcomingPayments = paymentEntries.filter(p => p.status === "pending_approval").reduce((sum, p) => sum + p.amount, 0);

            setSummary({ totalEarned, totalPaid, pendingPayments, upcomingPayments });
        } catch (error) {
            console.error("Error fetching payment data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExpandContract = async (contractId: string) => {
        if (expandedContract === contractId) {
            setExpandedContract(null);
            return;
        }

        setExpandedContract(contractId);

        if (!contractTimesheets[contractId]) {
            const { data } = await supabase
                .from("timesheets")
                .select("id, week_start, week_end, total_hours, status")
                .eq("contract_id", contractId)
                .order("week_start", { ascending: false });

            setContractTimesheets(prev => ({ ...prev, [contractId]: data || [] }));
        }
    };

    const filteredPayments = payments.filter(p => {
        const matchesStatus = statusFilter === "all" || p.status === statusFilter;
        const matchesSearch = p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.contract_number.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Payments</h1>
                <p className="text-muted-foreground">View your earnings and payment history</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Earned", value: summary.totalEarned, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
                    { label: "Total Paid", value: summary.totalPaid, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
                    { label: "Pending Payment", value: summary.pendingPayments, icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
                    { label: "Upcoming", value: summary.upcomingPayments, icon: Calendar, color: "text-amber-600", bg: "bg-amber-100" },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </div>
                            <p className={`text-2xl font-bold ${stat.color}`}>{formatCurrency(stat.value)}</p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Active Contracts */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-accent" />
                        Active Contracts & Payment Cycles
                    </CardTitle>
                    <CardDescription>Your contracts and associated payment details</CardDescription>
                </CardHeader>
                <CardContent>
                    {contracts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Briefcase className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                            <p>No contracts yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {contracts.map((contract) => (
                                <div key={contract.id} className="border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => handleExpandContract(contract.id)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 text-left">
                                            <div>
                                                <p className="font-semibold">{contract.role_title}</p>
                                                <p className="text-sm text-muted-foreground">{contract.client?.company_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden md:block">
                                                <p className="font-semibold text-emerald-600">{formatCurrency(contract.talent_rate)}/hr</p>
                                                <p className="text-xs text-muted-foreground">{contract.payment_cycle}</p>
                                            </div>
                                            <Badge variant={contract.status === "active" ? "default" : "secondary"}>
                                                {contract.status}
                                            </Badge>
                                            {expandedContract === contract.id ? (
                                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </button>

                                    {expandedContract === contract.id && (
                                        <div className="border-t bg-muted/30 p-4">
                                            <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Contract Number</p>
                                                    <p className="font-mono">{contract.contract_number}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Start Date</p>
                                                    <p>{format(new Date(contract.start_date), "MMM d, yyyy")}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Rate</p>
                                                    <p className="font-semibold text-emerald-600">{formatCurrency(contract.talent_rate)}/hr</p>
                                                </div>
                                            </div>

                                            <Separator className="my-4" />

                                            <p className="text-sm font-medium mb-2">Related Timesheets</p>
                                            {contractTimesheets[contract.id]?.length ? (
                                                <div className="space-y-2">
                                                    {contractTimesheets[contract.id].map((ts) => (
                                                        <div key={ts.id} className="flex items-center justify-between p-2 rounded bg-background border">
                                                            <span className="text-sm">
                                                                {format(new Date(ts.week_start), "MMM d")} - {format(new Date(ts.week_end), "MMM d")}
                                                            </span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm">{ts.total_hours} hrs</span>
                                                                <Badge className={statusConfig[ts.status === "draft" ? "pending_approval" : ts.status]?.color || ""}>
                                                                    {ts.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No timesheets found</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-accent" />
                        Payment History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by client or contract..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                                <SelectItem value="approved">Awaiting Payment</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {filteredPayments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <DollarSign className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                            <p className="font-medium mb-1">No payment entries</p>
                            <p className="text-sm">Payments will appear here once you submit approved timesheets.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Contract / Client</TableHead>
                                        <TableHead>Work Period</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPayments.map((payment) => {
                                        const status = statusConfig[payment.status];
                                        return (
                                            <TableRow
                                                key={payment.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => setSelectedPayment(payment)}
                                            >
                                                <TableCell>{format(new Date(payment.date), "MMM d, yyyy")}</TableCell>
                                                <TableCell>
                                                    <p className="font-medium">{payment.client_name}</p>
                                                    <p className="text-xs text-muted-foreground">{payment.contract_number}</p>
                                                </TableCell>
                                                <TableCell>{payment.work_period}</TableCell>
                                                <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                                                <TableCell>
                                                    <Badge className={`${status.color} border-0`}>
                                                        {status.icon}
                                                        <span className="ml-1">{status.label}</span>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{payment.reference_id}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm">
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upcoming Payments */}
            {summary.upcomingPayments > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-accent" />
                            Upcoming Payments
                        </CardTitle>
                        <CardDescription>Expected payments pending approval</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {payments.filter(p => p.status === "pending_approval").map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg bg-amber-50 border border-amber-200">
                                    <div>
                                        <p className="font-medium">{payment.role_title}</p>
                                        <p className="text-sm text-amber-700">{payment.client_name} • {payment.work_period}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-amber-700">{formatCurrency(payment.amount)}</p>
                                        <p className="text-xs text-amber-600">Awaiting admin processing</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Payment Notes */}
            <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-slate-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-slate-900">About Payments</p>
                            <ul className="text-sm text-slate-700 mt-1 space-y-1">
                                <li>• Payments are processed by Taskive Admin</li>
                                <li>• Timelines depend on approved timesheets and client payments</li>
                                <li>• For issues, please contact support</li>
                            </ul>
                        </div>
                        <Link to="/talent/support/new?category=payment">
                            <Button variant="outline" size="sm">
                                <HelpCircle className="h-4 w-4 mr-2" />
                                Contact Support
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Details Modal */}
            <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Payment Details</DialogTitle>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-2xl font-bold text-center">{formatCurrency(selectedPayment.amount)}</p>
                                <div className="flex justify-center mt-2">
                                    <Badge className={statusConfig[selectedPayment.status].color}>
                                        {statusConfig[selectedPayment.status].icon}
                                        <span className="ml-1">{statusConfig[selectedPayment.status].label}</span>
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Client</span>
                                    <span className="font-medium">{selectedPayment.client_name}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Contract</span>
                                    <span className="font-mono text-sm">{selectedPayment.contract_number}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Work Period</span>
                                    <span>{selectedPayment.work_period}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Reference</span>
                                    <span className="font-mono text-sm">{selectedPayment.reference_id}</span>
                                </div>
                                {selectedPayment.admin_note && (
                                    <>
                                        <Separator />
                                        <div>
                                            <span className="text-muted-foreground">Admin Note</span>
                                            <p className="mt-1 p-2 rounded bg-muted text-sm">{selectedPayment.admin_note}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <Link to={`/talent/support/new?category=payment&ref=${selectedPayment.reference_id}`}>
                                <Button variant="outline" className="w-full">
                                    <HelpCircle className="h-4 w-4 mr-2" />
                                    Contact Support About This Payment
                                </Button>
                            </Link>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TalentPayments;
