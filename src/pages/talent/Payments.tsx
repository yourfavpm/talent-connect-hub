import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DollarSign,
  CheckCircle,
  Clock,
  Briefcase,
  ChevronRight,
  TrendingUp,
  FileText,
  Building2,
  Calendar,
  MoreVertical,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

interface PaymentSummary {
  totalEarned: number;
  totalPaid: number;
  pendingPayments: number;
  upcomingPayments: number;
}

interface PaymentEntry {
  id: string;
  date: string;
  contract_number: string;
  client_name: string;
  work_period: string;
  amount: number;
  status: "pending_approval" | "approved" | "paid" | "rejected";
  reference_id: string | null;
  contract_id: string;
  role_title: string;
  timesheet_id: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_approval: { label: "Processing", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3 mr-1" /> },
  approved: { label: "Pending Payout", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Clock className="h-3 w-3 mr-1" /> },
  paid: { label: "Paid Tasks", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
};

const TalentPayments = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<PaymentSummary>({
    totalEarned: 0,
    totalPaid: 0,
    pendingPayments: 0,
    upcomingPayments: 0,
  });
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentEntry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: talent } = await supabase.from("talents").select("id").eq("user_id", user?.id).single();
      if (!talent) return;

      const { data: timesheets } = await supabase
        .from("timesheets")
        .select(`
          id, week_start, week_end, total_hours, status, contract_id,
          contract:contracts (
            contract_number, role_title, talent_rate,
            client:clients (company_name)
          )
        `)
        .eq("talent_id", talent.id)
        .order("week_end", { ascending: false });

      const statusMapping: Record<string, PaymentEntry["status"]> = {
        draft: "pending_approval",
        submitted: "pending_approval",
        approved: "approved",
        paid: "paid",
        rejected: "rejected",
      };

      const paymentEntries: PaymentEntry[] = (timesheets || []).map((ts: any) => {
        const status = statusMapping[ts.status] || "pending_approval";
        const rate = ts.contract?.talent_rate || 0;
        const amount = ts.total_hours * rate;

        return {
          id: `pay_${ts.id}`,
          timesheet_id: ts.id,
          date: ts.week_end,
          contract_number: ts.contract?.contract_number || "N/A",
          client_name: ts.contract?.client?.company_name || "Unknown Client",
          work_period: `${format(new Date(ts.week_start), "MMM d")} - ${format(new Date(ts.week_end), "MMM d, yyyy")}`,
          amount,
          status,
          reference_id: `INV-${ts.id.slice(0, 8).toUpperCase()}`,
          contract_id: ts.contract_id,
          role_title: ts.contract?.role_title || "Role",
        };
      }).filter(p => p.status !== "rejected" && p.amount > 0); // Hide rejected/zero hour from payment ledger

      setPayments(paymentEntries);

      setSummary({
        totalEarned: paymentEntries.reduce((sum, p) => sum + p.amount, 0),
        totalPaid: paymentEntries.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0),
        pendingPayments: paymentEntries.filter(p => p.status === "approved").reduce((sum, p) => sum + p.amount, 0),
        upcomingPayments: paymentEntries.filter(p => p.status === "pending_approval").reduce((sum, p) => sum + p.amount, 0),
      });
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = (payment: PaymentEntry) => {
    setSelectedPayment(payment);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 max-w-5xl mx-auto p-4">
        <div className="h-8 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
        <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-xl mt-4" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">Track your earnings and payout status.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200 shadow-sm bg-white hover:border-gray-300 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
             <div className="flex items-start justify-between">
                <div className="h-8 w-8 rounded-md bg-gray-50 flex items-center justify-center border border-gray-100">
                   <TrendingUp className="h-4 w-4 text-gray-600" />
                </div>
             </div>
             <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalEarned)}</p>
             </div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 shadow-sm bg-white hover:border-gray-300 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
             <div className="flex items-start justify-between">
                <div className="h-8 w-8 rounded-md bg-emerald-50 flex items-center justify-center border border-emerald-100">
                   <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
             </div>
             <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalPaid)}</p>
             </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm bg-white hover:border-gray-300 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
             <div className="flex items-start justify-between">
                <div className="h-8 w-8 rounded-md bg-blue-50 flex items-center justify-center border border-blue-100">
                   <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
             </div>
             <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Payout</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.pendingPayments)}</p>
             </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm bg-white hover:border-gray-300 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
             <div className="flex items-start justify-between">
                <div className="h-8 w-8 rounded-md bg-amber-50 flex items-center justify-center border border-amber-100">
                   <Clock className="h-4 w-4 text-amber-600" />
                </div>
             </div>
             <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Processing</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.upcomingPayments)}</p>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
          {payments.length === 0 ? (
            <div className="py-16 text-center bg-gray-50/50">
               <DollarSign className="h-8 w-8 mx-auto text-gray-300 mb-3" />
               <p className="text-sm font-medium text-gray-900">No transactions to display.</p>
               <p className="text-sm text-gray-500 mt-1">Payments will appear here once timesheets are processed.</p>
            </div>
          ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/80 border-b border-gray-200">
                    <tr className="text-gray-500 font-medium">
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Description</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Amount</th>
                      <th className="px-5 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map(payment => {
                      const status = statusConfig[payment.status];
                      return (
                        <tr 
                          key={payment.id} 
                          onClick={() => openDrawer(payment)}
                          className="hover:bg-gray-50/50 cursor-pointer transition-colors group"
                        >
                          <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                             {format(new Date(payment.date), "MMM d, yyyy")}
                          </td>
                          <td className="px-5 py-4">
                             <p className="font-medium text-gray-900">{payment.client_name}</p>
                             <p className="text-xs text-gray-500 mt-0.5">{payment.work_period}</p>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                             <Badge variant="outline" className={`font-medium px-2 py-0.5 text-xs rounded shadow-none ${status.color}`}>
                               {status.icon} {status.label}
                             </Badge>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                             <span className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                             <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 ml-auto" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          )}
        </Card>
      </div>

      {/* Payment Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 border-l border-gray-200">
          {selectedPayment && (
            <div className="flex flex-col h-full bg-gray-50">
              
              {/* Drawer Header */}
              <div className="bg-white px-6 py-8 border-b border-gray-200 text-center">
                 <Badge variant="outline" className={`mx-auto mb-4 font-medium px-2.5 py-1 text-xs rounded shadow-none ${statusConfig[selectedPayment.status].color}`}>
                    {statusConfig[selectedPayment.status].icon} {statusConfig[selectedPayment.status].label}
                 </Badge>
                 <h2 className="text-4xl font-bold text-gray-900">{formatCurrency(selectedPayment.amount)}</h2>
                 <p className="text-sm text-gray-500 mt-2">Payout for {format(new Date(selectedPayment.date), "MMM d, yyyy")}</p>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 p-6 space-y-6">

                 {/* Breakdown */}
                 <section>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Breakdown</h3>
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Base Earnings</span>
                          <span className="font-medium text-gray-900">{formatCurrency(selectedPayment.amount)}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Platform Fees</span>
                          <span className="font-medium text-gray-900">{formatCurrency(0)}</span>
                       </div>
                       <div className="h-px bg-gray-100 my-1" />
                       <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-gray-900">Total Payout</span>
                          <span className="font-bold text-gray-900">{formatCurrency(selectedPayment.amount)}</span>
                       </div>
                    </div>
                 </section>

                 {/* Linkage / Source */}
                 <section>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Source References</h3>
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">
                       
                       <Link to={`/talent/assignments`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                          <div className="flex items-center gap-3">
                             <Briefcase className="h-4 w-4 text-gray-400" />
                             <div>
                                <p className="text-sm font-medium text-gray-900">Contract</p>
                                <p className="text-xs text-gray-500">{selectedPayment.client_name}</p>
                             </div>
                          </div>
                          <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-gray-500" />
                       </Link>

                       <Link to={`/talent/timesheets`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                          <div className="flex items-center gap-3">
                             <Calendar className="h-4 w-4 text-gray-400" />
                             <div>
                                <p className="text-sm font-medium text-gray-900">Timesheet</p>
                                <p className="text-xs text-gray-500">{selectedPayment.work_period}</p>
                             </div>
                          </div>
                          <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-gray-500" />
                       </Link>

                       <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                             <FileText className="h-4 w-4 text-gray-400" />
                             <div>
                                <p className="text-sm font-medium text-gray-900">Reference ID</p>
                                <p className="text-xs text-gray-500 font-mono">{selectedPayment.reference_id}</p>
                             </div>
                          </div>
                       </div>

                    </div>
                 </section>

              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
};

export default TalentPayments;
