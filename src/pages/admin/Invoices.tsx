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
import { Receipt, CheckCircle, Clock, AlertTriangle, Download } from "lucide-react";
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "paid": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
            case "pending": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
            case "overdue": return <Badge variant="destructive">Overdue</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Invoices & Payments</h1>
                    <p className="text-muted-foreground">Manage client billing and talent payments</p>
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
