import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  Receipt,
  Download,
  CreditCard,
  Clock,
  AlertTriangle,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Invoice {
  id: string;
  invoiceNumber: string;
  talentName: string;
  amount: number;
  period: string;
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "upcoming";
  metadata?: any;
}

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useEffect(() => {
    if (user) fetchInvoices();
  }, [user]);

  const fetchInvoices = async () => {
    try {
      // 1. Get Client ID
      const { data: clientData } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!clientData) return;

      // 2. Get Invoices
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          contracts (
            talents (
              first_name,
              last_name
            )
          )
        `)
        .eq("client_id", clientData.id)
        .order("due_date", { ascending: false });

      if (error) throw error;

      // 3. Map to Interface
      const mappedInvoices: Invoice[] = (data || []).map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        talentName: inv.contracts?.talents
          ? `${inv.contracts.talents.first_name} ${inv.contracts.talents.last_name}`
          : "Unknown",
        amount: inv.total_amount,
        period: `${new Date(inv.billing_period_start).toLocaleDateString()} - ${new Date(inv.billing_period_end).toLocaleDateString()}`,
        dueDate: inv.due_date,
        status: (inv.status as "paid" | "pending" | "overdue" | "upcoming") || "pending",
        metadata: inv.metadata
      }));

      setInvoices(mappedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return {
          label: "Paid",
          className: "bg-success/10 text-success border-success/20",
          icon: Check,
        };
      case "pending":
        return {
          label: "Pending",
          className: "bg-warning/10 text-warning border-warning/20",
          icon: Clock,
        };
      case "overdue":
        return {
          label: "Overdue",
          className: "bg-destructive/10 text-destructive border-destructive/20",
          icon: AlertTriangle,
        };
      case "upcoming":
        return {
          label: "Upcoming",
          className: "bg-muted text-muted-foreground",
          icon: Clock,
        };
      default:
        return { label: status, className: "", icon: Clock };
    }
  };

  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const pendingInvoices = invoices.filter((i) => i.status === "pending");
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const upcomingInvoices = invoices.filter((i) => i.status === "upcoming");

  const totalDue = [...pendingInvoices, ...overdueInvoices].reduce(
    (sum, i) => sum + i.amount,
    0
  );

  if (loading) return <div className="p-8">Loading invoices...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            View and pay your talent invoices
          </p>
        </div>
        {totalDue > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Due</p>
              <p className="text-2xl font-bold text-foreground">
                ${totalDue.toLocaleString()}
              </p>
            </div>
            <Button onClick={() => setPaymentDialogOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay All
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm">Overdue</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {overdueInvoices.length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm">Pending</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {pendingInvoices.length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Receipt className="h-4 w-4" />
            <span className="text-sm">Upcoming</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {upcomingInvoices.length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Check className="h-4 w-4 text-success" />
            <span className="text-sm">Paid</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {paidInvoices.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2">
            Overdue
            {overdueInvoices.length > 0 && (
              <Badge variant="destructive">{overdueInvoices.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <InvoiceList
            invoices={invoices}
            getStatusConfig={getStatusConfig}
            onPay={() => setPaymentDialogOpen(true)}
          />
        </TabsContent>
        {/* ... (Other tabs similar mapping) ... */}
        <TabsContent value="overdue" className="mt-6">
          <InvoiceList
            invoices={overdueInvoices}
            getStatusConfig={getStatusConfig}
            emptyMessage="No overdue invoices"
            onPay={() => setPaymentDialogOpen(true)}
          />
        </TabsContent>
        <TabsContent value="pending" className="mt-6">
          <InvoiceList
            invoices={pendingInvoices}
            getStatusConfig={getStatusConfig}
            emptyMessage="No pending invoices"
            onPay={() => setPaymentDialogOpen(true)}
          />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-6">
          <InvoiceList
            invoices={upcomingInvoices}
            getStatusConfig={getStatusConfig}
            emptyMessage="No upcoming invoices"
            onPay={() => setPaymentDialogOpen(true)}
          />
        </TabsContent>
        <TabsContent value="paid" className="mt-6">
          <InvoiceList
            invoices={paidInvoices}
            getStatusConfig={getStatusConfig}
            emptyMessage="No paid invoices"
            onPay={() => setPaymentDialogOpen(true)}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Information</DialogTitle>
            <DialogDescription>
              To process your payment, please contact our accounts team or follow the instructions on your invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="font-medium">Direct Bank Transfer</p>
            <p className="mt-1">Bank: Chase Bank</p>
            <p>Account: 123456789</p>
            <p>Routing: 987654321</p>
            <p className="mt-2 text-xs text-muted-foreground">Please include Invoice # in memo.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Close</Button>
            <Button onClick={() => window.open('mailto:hire@opslyhr.com')}>Contact Accounts</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const InvoiceList = ({
  invoices,
  getStatusConfig,
  emptyMessage = "No invoices",
  onPay,
}: {
  invoices: Invoice[];
  getStatusConfig: (status: string) => any;
  emptyMessage?: string;
  onPay: () => void;
}) => {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-xl border border-border">
        <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {emptyMessage}
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice, index) => {
        const statusConfig = getStatusConfig(invoice.status);
        return (
          <div
            key={invoice.id}
            className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {invoice.invoiceNumber}
                    </h3>
                    <Badge className={statusConfig.className}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {invoice.talentName} • {invoice.period}
                  </p>
                  {(invoice as any).metadata && (
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <span>Reg: {(invoice as any).metadata.regular_hours}hrs</span>
                      {(invoice as any).metadata.overtime_hours > 0 && (
                        <span className="text-amber-600 font-medium">OT: {(invoice as any).metadata.overtime_hours}hrs</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-lg font-semibold text-foreground">
                    ${invoice.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  {(invoice.status === "pending" ||
                    invoice.status === "overdue") && (
                      <Button size="sm" onClick={onPay}>Pay Now</Button>
                    )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Invoices;
