import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Calendar, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const AdminPayments = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            // Fetch paid invoices which represent payments collected
            // And potentially "Payouts" table if we had one. 
            // For now, let's track "Paid Invoices" as incoming payments, 
            // and we can mock or create a Payouts flow.
            // Let's assume we want to see "Pending Payouts" to talents.

            // Logic: Invoices where status='paid' => we owe Talent.
            // Let's list Paid Invoices and show "Payout Status" (mocked or metadata).

            const { data, error } = await supabase
                .from("invoices")
                .select(`
                    *,
                    contracts (
                        talent_rate,
                        talents (first_name, last_name)
                    )
                `)
                .eq("status", "paid")
                .order("paid_at", { ascending: false });

            if (error) throw error;
            setPayments(data || []);
        } catch (error: any) {
            toast.error("Error fetching payments: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayout = async (invoiceId: string) => {
        toast.success("Payout processed successfully (Mock)");
        // In real app, create a 'payouts' record.
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Talent Payments</h1>
                    <p className="text-muted-foreground">Manage payouts to talents</p>
                </div>
                <Button>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Process Batch Payouts
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$12,450.00</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Payouts</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$48,200.00</div>
                        <p className="text-xs text-muted-foreground">Total disbursed this month</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search talent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Talent</TableHead>
                            <TableHead>Reference Invoice</TableHead>
                            <TableHead>Paid Date</TableHead>
                            <TableHead>Amount Due</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No pending payouts found</TableCell>
                            </TableRow>
                        ) : (
                            payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell>{payment.contracts?.talents?.first_name} {payment.contracts?.talents?.last_name}</TableCell>
                                    <TableCell className="font-mono text-xs">{payment.invoice_number}</TableCell>
                                    <TableCell>{new Date(payment.paid_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-bold">
                                        {/* Estimate Payout: Assuming hourly. Need hours logic from metadata or similar. */}
                                        {/* For MVP let's assume 80% of invoice amount if talent_rate missing, or calc exact */}
                                        ${(payment.total_amount * 0.8).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" onClick={() => handleProcessPayout(payment.id)}>
                                            Mark Processed
                                        </Button>
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

export default AdminPayments;
