import { useState, useEffect } from "react";
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
import { Receipt, CheckCircle, Clock, AlertTriangle, Download, FileText, Send, Search, DollarSign } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

const AdminInvoices = () => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const { data, error } = await supabase
                .from("invoices")
                .select(`
          *,
          clients (company_name),
          contracts (
            client_rate,
            talent_rate,
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

    const handleMarkPaid = async () => {
        if (!selectedInvoice) return;

        try {
            const { error } = await supabase
                .from("invoices")
                .update({
                    status: "paid",
                    paid_at: new Date().toISOString()
                })
                .eq("id", selectedInvoice.id);

            if (error) throw error;

            toast.success("Invoice marked as paid");
            setSelectedInvoice(null);
            fetchInvoices();
        } catch (error: any) {
            toast.error("Error updating invoice: " + error.message);
        }
    };

    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalPayout: 0,
        averageMargin: 0
    });

    useEffect(() => {
        if (invoices.length > 0) {
            calculateStats();
        }
    }, [invoices]);

    const calculateStats = () => {
        let revenue = 0;
        let payout = 0;

        invoices.forEach(inv => {
            const amount = inv.total_amount || 0;
            revenue += amount;

            // Estimate payout based on contract rates if available
            const contract = inv.contracts;
            if (contract && contract.client_rate && contract.talent_rate) {
                const margin = (contract.client_rate - contract.talent_rate) / contract.client_rate;
                const cost = amount * (1 - margin); // Or simply amount * (talent_rate / client_rate)
                // Accurate way: amount is (hours * client_rate). Payout is (hours * talent_rate).
                // So Payout = amount * (talent_rate / client_rate).
                payout += amount * (contract.talent_rate / contract.client_rate);
            } else {
                // Fallback if no rates (e.g. fixed price without breakdown): assume 20% margin? 
                // Or just count 0 payout? Let's assume 80% payout.
                payout += amount * 0.8;
            }
        });

        setStats({
            totalRevenue: revenue,
            totalPayout: payout,
            averageMargin: revenue > 0 ? ((revenue - payout) / revenue) * 100 : 0
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "paid": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
            case "pending": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
            case "overdue": return <Badge variant="destructive">Overdue</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleGenerateInvoices = async () => {
        try {
            setLoading(true);

            // 1. Get all approved timesheets that are NOT invoiced
            const { data: timesheets, error: tsError } = await supabase
                .from("timesheets")
                .select(`
                    id, 
                    total_hours, 
                    contract:contracts (
                        id,
                        client_id,
                        client_gross_rate,
                        client_rate, 
                        talent_rate,
                        weekly_hours,
                        contract_number
                    )
                `)
                .eq("status", "approved")
                .is("invoice_id", null);

            if (tsError) throw tsError;

            // Cast to any to handle new columns not yet in types
            const pendingTimesheets = (timesheets || []) as any[];

            if (pendingTimesheets.length === 0) {
                toast.info("No approved timesheets found to invoice.");
                setLoading(false);
                return;
            }

            // 2. Group by Contract (or Client? Usually grouping by Contract for simplicity first)
            // One invoice per timesheet for MVP to handle Overtime Logic easily? 
            // Or group multiple timesheets into one invoice? 
            // Let's do One Invoice Per Timesheet for maximum clarity on the "Overtime" line item.

            let generatedCount = 0;

            for (const ts of pendingTimesheets) {
                const contract = ts.contract;
                const clientRate = contract.client_gross_rate || contract.client_rate || 0;
                const talentRate = contract.talent_rate || 0; // Net logic if needed for payout records later

                // Overtime Logic
                const weeklyThreshold = contract.weekly_hours || 40;
                const regularHours = Math.min(ts.total_hours, weeklyThreshold);
                const overtimeHours = Math.max(0, ts.total_hours - weeklyThreshold);

                const regularAmount = regularHours * clientRate;
                const overtimeAmount = overtimeHours * (clientRate * 1.5);
                const totalAmount = regularAmount + overtimeAmount;

                // Create Invoice
                const { data: invoice, error: invError } = await supabase
                    .from("invoices")
                    .insert({
                        client_id: contract.client_id,
                        contract_id: contract.id,
                        total_amount: totalAmount,
                        status: 'pending',
                        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        metadata: {
                            regular_hours: regularHours,
                            overtime_hours: overtimeHours,
                            regular_rate: clientRate,
                            overtime_rate: clientRate * 1.5,
                            timesheet_id: ts.id
                        }
                    } as any)
                    .select()
                    .single();

                if (invError) {
                    console.error("Failed to create invoice for TS", ts.id, invError);
                    continue;
                }

                // Link TS to Invoice
                await supabase
                    .from("timesheets")
                    .update({ invoice_id: invoice.id } as any)
                    .eq("id", ts.id);

                generatedCount++;
            }

            toast.success(`Generated ${generatedCount} invoices.`);
            fetchInvoices();

        } catch (error: any) {
            toast.error("Error generating invoices: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Invoices & Payments</h1>
                    <p className="text-muted-foreground">Manage client billing and talent payments</p>
                </div>
                <Button onClick={handleGenerateInvoices} disabled={loading}>
                    <Send className="mr-2 h-4 w-4" />
                    Generate Invoices
                </Button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Invoiced</h3>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground mt-1">Gross Revenue from Clients</p>
                </div>
                <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Est. Payout</h3>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold">${stats.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground mt-1">Estimated Talent Payments</p>
                </div>
                <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Net Margin</h3>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                        {stats.averageMargin.toFixed(1)}%
                        <span className="text-base font-normal text-muted-foreground ml-2">
                            (${(stats.totalRevenue - stats.totalPayout).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Average Profit Margin</p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Talent</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">No invoices found</TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="h-4 w-4 text-muted-foreground" />
                                            {inv.invoice_number}
                                        </div>
                                    </TableCell>
                                    <TableCell>{inv.clients?.company_name || "Unknown"}</TableCell>
                                    <TableCell>
                                        {inv.contracts?.talents?.first_name} {inv.contracts?.talents?.last_name}
                                    </TableCell>
                                    <TableCell>${inv.total_amount.toLocaleString()}</TableCell>
                                    <TableCell>{new Date(inv.due_date).toLocaleDateString()}</TableCell>
                                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* Mock Download */}
                                            <Button variant="ghost" size="icon">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            {inv.status !== 'paid' && (
                                                <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(inv)}>
                                                    Action
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Invoice Status</DialogTitle>
                        <DialogDescription>
                            Mark invoice {selectedInvoice?.invoice_number} as paid? This will confirm payment receipt.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm">Amount: <span className="font-bold">${selectedInvoice?.total_amount}</span></p>
                        <p className="text-sm">Client: {selectedInvoice?.clients?.company_name}</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Cancel</Button>
                        <Button onClick={handleMarkPaid}>Confirm Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminInvoices;
