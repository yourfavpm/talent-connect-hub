import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
    ArrowLeft, 
    Download, 
    Send, 
    FileText, 
    Clock, 
    CheckCircle, 
    AlertTriangle, 
    ExternalLink,
    Receipt,
    DollarSign,
    Calendar,
    User,
    ArrowRight,
    Plus,
    X,
    Info
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { sendClientPaymentReceiptEmail } from "@/lib/email/triggers";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

interface LineItem {
    id: string;
    description: string;
    amount: number;
    quantity: number;
    unit_price: number;
    type: string;
}

const AdminInvoiceDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [invoice, setInvoice] = useState<any>(null); 
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [paymentReceivedDate, setPaymentReceivedDate] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [paymentRef, setPaymentRef] = useState("");

    useEffect(() => {
        if (id) {
            fetchInvoiceData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchInvoiceData = async () => {
        try {
            setLoading(true);
            const { data: rawData, error } = await (supabase
                .from("invoices") as any)
                .select(`
                    *,
                    clients (id, company_name, profiles(email)),
                    contracts (
                        id,
                        contract_number,
                        service_type,
                        compensation_type,
                        billing_frequency,
                        talent_id,
                        talents (id, first_name, last_name)
                    )
                `)
                .eq("id", id)
                .single();

            if (error) throw error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = rawData as any;
            setInvoice(data);
            setPaymentMethod(data.payment_method || "");
            setPaymentRef(data.payment_reference || "");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: items, error: itemsError } = await supabase
                .from("invoice_line_items" as any)
                .select("*")
                .eq("invoice_id", id);
            
            if (itemsError) throw itemsError;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setLineItems((items as any) || []);

        } catch (error: any) {
            toast.error("Error fetching invoice: " + error.message);
            navigate("/admin/invoices");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: InvoiceStatus) => {
        try {
            const { error } = await supabase
                .from("invoices")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .update({ status: newStatus as any })
                .eq("id", id);
            
            if (error) throw error;
            toast.success(`Invoice marked as ${newStatus}`);
            fetchInvoiceData();
        } catch (error: any) {
            toast.error("Update failed: " + error.message);
        }
    };

    const handleRecordPayment = async () => {
        try {
            const { error } = await supabase
                .from("invoices")
                .update({
                    status: 'paid',
                    payment_status: 'paid',
                    paid_at: paymentReceivedDate || new Date().toISOString(),
                    payment_method: paymentMethod,
                    payment_reference: paymentRef
                } as any)
                .eq("id", id);

            if (error) throw error;

            // Trigger Email to Client
            try {
                if (invoice?.clients?.profiles?.email) {
                    await sendClientPaymentReceiptEmail({
                        email: invoice.clients.profiles.email,
                        clientName: invoice.clients.company_name,
                        amount: invoice.total_amount,
                        invoiceNumber: invoice.invoice_number || invoice.id.slice(0, 8)
                    });
                }
            } catch (emailErr) {
                console.error("Failed to send payment receipt email:", emailErr);
            }

            toast.success("Payment recorded and invoice marked as paid");
            fetchInvoiceData();
        } catch (error: any) {
            toast.error("Record failed: " + error.message);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
    if (!invoice) return <div className="p-8">Invoice not found</div>;

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'paid': return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case 'sent': return "bg-blue-50 text-blue-700 border-blue-100";
            case 'draft': return "bg-gray-50 text-gray-600 border-gray-100";
            case 'overdue': return "bg-red-50 text-red-700 border-red-100";
            case 'cancelled': return "bg-gray-100 text-gray-400 border-gray-200";
            default: return "bg-gray-50 text-gray-500";
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50/30 -m-6 md:-m-8">
            {/* Header */}
            <header className="h-16 shrink-0 bg-white border-b border-gray-200 px-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/admin/invoices")} className="text-gray-500">
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Back to Invoices
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            {invoice.invoice_number || `#${invoice.id.slice(0,8)}`}
                        </span>
                        <h1 className="text-sm font-semibold text-gray-900">{invoice.clients?.company_name}</h1>
                        <Badge variant="outline" className={cn("shadow-none capitalize", getStatusStyles(invoice.status))}>
                            {invoice.status}
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                        <Download className="h-4 w-4" />
                        Download
                    </Button>
                    {invoice.status === 'draft' && (
                        <Button className="h-9 gap-2 bg-gray-900 hover:bg-gray-800" onClick={() => handleUpdateStatus('sent')}>
                            <Send className="h-4 w-4" />
                            Send Invoice
                        </Button>
                    )}
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Breakdown */}
                <div className="flex-1 overflow-y-auto p-8 bg-white border-r border-gray-200">
                    <div className="max-w-4xl mx-auto space-y-10">
                        
                        {/* Contract Context */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Contract Context</h3>
                            </div>
                            <Card className="shadow-none border-gray-100 bg-gray-50/30">
                                <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Contract #</p>
                                        <Link to={`/admin/contracts?search=${invoice.contracts?.contract_number}`} className="text-sm font-medium text-brand-primary hover:underline">
                                            {invoice.contracts?.contract_number || "N/A"}
                                        </Link>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Talent</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {invoice.contracts?.talents?.first_name} {invoice.contracts?.talents?.last_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Service Type</p>
                                        <Badge variant="outline" className="bg-white text-[10px] font-mono py-0">{invoice.contracts?.service_type || 'N/A'}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Billing Period</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {invoice.billing_period_start ? format(new Date(invoice.billing_period_start), "MMM d") : "-"} — {invoice.billing_period_end ? format(new Date(invoice.billing_period_end), "MMM d, yyyy") : "-"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Line Items */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-gray-400" />
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Line Items</h3>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 uppercase tracking-tight">
                                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Line Item
                                </Button>
                            </div>
                            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow className="hover:bg-transparent border-gray-100">
                                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase h-10">Description</TableHead>
                                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase h-10 text-right">Qty/Hours</TableHead>
                                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase h-10 text-right">Rate</TableHead>
                                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase h-10 text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lineItems.length > 0 ? lineItems.map((item) => (
                                            <TableRow key={item.id} className="border-gray-50">
                                                <TableCell className="text-[13px] text-gray-700">{item.description}</TableCell>
                                                <TableCell className="text-[13px] text-gray-900 text-right font-mono">{item.quantity}</TableCell>
                                                <TableCell className="text-[13px] text-gray-900 text-right font-mono">${item.unit_price?.toLocaleString() || (item.amount/item.quantity).toLocaleString()}</TableCell>
                                                <TableCell className="text-[13px] text-gray-900 font-bold text-right font-mono">${item.amount.toLocaleString()}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow className="border-gray-50">
                                                <TableCell className="text-[13px] text-gray-700">Billing for {invoice.total_hours || 0} hours</TableCell>
                                                <TableCell className="text-[13px] text-gray-900 text-right font-mono">{invoice.total_hours || 0}</TableCell>
                                                <TableCell className="text-[13px] text-gray-900 text-right font-mono">${invoice.hourly_rate?.toLocaleString() || 0}</TableCell>
                                                <TableCell className="text-[13px] text-gray-900 font-bold text-right font-mono">${invoice.total_amount?.toLocaleString() || 0}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </section>

                        {/* Deductions section */}
                        {(invoice.deduction_amount > 0 || invoice.metadata?.deductions) && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest">Deductions Applied</h3>
                                </div>
                                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex gap-4">
                                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                        <Info className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[13px] font-medium text-amber-900">Reduced hours recorded</p>
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            Deductions applied due to incomplete hours. Tracked hours: {invoice.metadata?.logged_hours || 0} vs Expected: {invoice.metadata?.expected_hours || 0}.
                                        </p>
                                        <p className="text-sm font-bold text-amber-800 mt-2">Deduction amount: -${invoice.deduction_amount?.toLocaleString() || 0}</p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Summary Block */}
                        <div className="flex justify-end pt-4">
                            <div className="w-80 space-y-3">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Gross Total</span>
                                    <span className="font-mono">${(invoice.total_amount + (invoice.deduction_amount || 0)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>Total Deductions</span>
                                    <span className="font-mono">-${(invoice.deduction_amount || 0).toLocaleString()}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-[16px] font-bold text-gray-900">
                                    <span>Net Invoice Amount</span>
                                    <span className="font-mono">${invoice.total_amount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Insight */}
                        <section className="pt-8">
                             <div className="flex items-center gap-2 mb-4">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Revenue vs Payout Insight</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="shadow-none border-gray-100 bg-emerald-50/20">
                                    <CardContent className="p-4">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Client Paid</p>
                                        <p className="text-xl font-bold text-emerald-700 font-mono">${invoice.total_amount.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-none border-gray-100 bg-orange-50/20">
                                    <CardContent className="p-4">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Talent Payout</p>
                                        <p className="text-xl font-bold text-orange-700 font-mono">${invoice.payout_amount?.toLocaleString() || (invoice.total_amount * 0.8).toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-none border-gray-100 bg-blue-50/20">
                                    <CardContent className="p-4">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">OPSlyHR Margin</p>
                                        <p className="text-xl font-bold text-blue-700 font-mono">${(invoice.margin_amount || (invoice.total_amount * 0.2)).toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Right Panel - Finance Actions */}
                <aside className="w-[380px] shrink-0 bg-gray-50/50 p-6 flex flex-col gap-6 overflow-y-auto">
                    
                    {/* Payment Tracking Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reconciliation</h3>
                            <Badge className={cn("text-[10px] py-0 shadow-none uppercase", 
                                invoice.payment_status === 'paid' ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                            )}>
                                {invoice.payment_status || 'unpaid'}
                            </Badge>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Payment Date</Label>
                                <div className="relative">
                                    <Input 
                                        type="date" 
                                        className="h-9 text-[13px] bg-gray-50/50 border-gray-200" 
                                        value={paymentReceivedDate}
                                        onChange={(e) => setPaymentReceivedDate(e.target.value)}
                                        disabled={invoice.status === 'paid'}
                                    />
                                    {!paymentReceivedDate && <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Method</Label>
                                <Input 
                                    placeholder="e.g. Bank Transfer" 
                                    className="h-9 text-[13px] bg-gray-50/50 border-gray-200" 
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    disabled={invoice.status === 'paid'}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Reference ID</Label>
                                <Input 
                                    placeholder="TXN-98234..." 
                                    className="h-9 text-[13px] font-mono bg-gray-50/50 border-gray-200 uppercase" 
                                    value={paymentRef}
                                    onChange={(e) => setPaymentRef(e.target.value)}
                                    disabled={invoice.status === 'paid'}
                                />
                            </div>
                            {invoice.status !== 'paid' && (
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 gap-2 mt-2" onClick={handleRecordPayment}>
                                    <CheckCircle className="h-4 w-4" />
                                    Confirm Receipt
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Payout Linkage */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-orange-500" />
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Payout Blueprint</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[13px]">
                                <span className="text-gray-500">Talent Amount</span>
                                <span className="font-bold text-gray-900 font-mono">${(invoice.payout_amount || (invoice.total_amount * 0.8)).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[13px]">
                                <span className="text-gray-500">Payout Status</span>
                                <Badge variant="outline" className="py-0 text-[10px] bg-gray-50 text-gray-500 border-gray-100 uppercase">
                                    {invoice.status === 'paid' ? 'Unlocked' : 'Locked'}
                                </Badge>
                            </div>
                            <Separator />
                            <Button variant="ghost" className="w-full text-brand-primary h-8 p-0 text-[12px] font-bold hover:bg-transparent hover:underline justify-between">
                                VIEW PAYOUT Record <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Meta Section */}
                    <div className="px-1 space-y-3">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-400 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Generated</span>
                            <span className="text-gray-600 font-medium">{format(new Date(invoice.created_at), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-400 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Due Date</span>
                            <span className="text-gray-900 font-bold">{format(new Date(invoice.due_date), "MMM d, yyyy")}</span>
                        </div>
                    </div>

                    {/* Context Links */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                        <Button variant="outline" className="h-[72px] flex-col gap-1.5 border-gray-200 hover:bg-white hover:border-brand-primary/30 group">
                            <User className="h-4 w-4 text-gray-400 group-hover:text-brand-primary" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">View User</span>
                        </Button>
                        <Button variant="outline" className="h-[72px] flex-col gap-1.5 border-gray-200 hover:bg-white hover:border-brand-primary/30 group">
                            <Clock className="h-4 w-4 text-gray-400 group-hover:text-brand-primary" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">View Timesheet</span>
                        </Button>
                    </div>

                    <div className="pt-2">
                        <Button 
                            variant="ghost" 
                            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 text-[11px] font-bold gap-2 h-9 border border-transparent hover:border-red-100 uppercase tracking-wider"
                            onClick={() => handleUpdateStatus('cancelled')}
                        >
                            <X className="h-3.5 w-3.5" />
                            Void Invoice
                        </Button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

// Placeholder components if needed for better organization
const Shield = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>;

export default AdminInvoiceDetail;
