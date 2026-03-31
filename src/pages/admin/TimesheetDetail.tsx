import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
    ArrowLeft, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertCircle, 
    Info, 
    DollarSign, 
    Calculator,
    Calendar,
    FileText,
    ExternalLink
} from "lucide-react";
import { sendTimesheetApprovedEmail, sendTimesheetRejectedEmail } from "@/lib/email/triggers";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";

interface Timesheet {
    id: string;
    total_hours: number;
    status: string;
    week_start: string;
    week_end: string;
    submitted_at: string | null;
    updated_at: string | null;
    invoice_id: string | null;
    rejection_reason?: string;
    notes?: string;
    contract: {
        id: string;
        contract_number: string;
        role_title: string;
        weekly_hours: number;
        compensation_type: string;
        service_model: string;
        billing_frequency: string;
        time_tracking_required: boolean;
        client_gross_amount: number;
        client: { company_name: string };
        talent: { first_name: string, last_name: string, user_id: string };
    };
}

interface TimesheetEntry {
    id: string;
    date: string;
    hours: number;
    description: string;
}

const AdminTimesheetDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
    const [entries, setEntries] = useState<TimesheetEntry[]>([]);
    const [isRejectSheetOpen, setIsRejectSheetOpen] = useState(false);
    const [isApproveSheetOpen, setIsApproveSheetOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (id) fetchTimesheetDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchTimesheetDetails = async () => {
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
                        billing_frequency,
                        time_tracking_required,
                        client_gross_amount,
                        client:clients (company_name),
                        talent:talents (first_name, last_name, user_id, profiles(email))
                    )
                `)
                .eq("id", id)
                .single();

            if (error) throw error;
            setTimesheet(data as any);

            const { data: entriesData, error: entriesError } = await supabase
                .from("timesheet_entries")
                .select("*")
                .eq("timesheet_id", id)
                .order("date", { ascending: true });

            if (entriesError) throw entriesError;
            setEntries((entriesData as any) || []);

        } catch (error: unknown) {
            const err = error as Error;
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setProcessing(true);
        try {
            const { error } = await supabase
                .from("timesheets")
                .update({ status: "approved" })
                .eq("id", id);

            if (error) throw error;

            // Trigger Email
            try {
                const talent = (timesheet as any)?.contract?.talent;
                if (talent?.profiles?.email) {
                    await sendTimesheetApprovedEmail({
                        email: talent.profiles.email,
                        firstName: talent.first_name,
                        periodEnd: new Date(timesheet!.week_end).toLocaleDateString()
                    });
                }
            } catch (emailErr) {
                console.error("Failed to send timesheet approval email:", emailErr);
            }

            toast({ title: "Approved", description: "Timesheet approved and notification sent." });
            setIsApproveSheetOpen(false);
            fetchTimesheetDetails();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason) return;
        setProcessing(true);
        try {
            const { error } = await supabase
                .from("timesheets")
                .update({ 
                    status: "rejected",
                    rejection_reason: rejectionReason
                })
                .eq("id", id);

            if (error) throw error;

            // Trigger Email
            try {
                const talent = (timesheet as any)?.contract?.talent;
                if (talent?.profiles?.email) {
                    await sendTimesheetRejectedEmail({
                        email: talent.profiles.email,
                        firstName: talent.first_name,
                        periodEnd: new Date(timesheet!.week_end).toLocaleDateString(),
                        reason: rejectionReason
                    });
                }
            } catch (emailErr) {
                console.error("Failed to send timesheet rejection email:", emailErr);
            }

            toast({ title: "Rejected", description: "Timesheet returned to talent and notification sent." });
            setIsRejectSheetOpen(false);
            setRejectionReason("");
            fetchTimesheetDetails();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div></div>;
    if (!timesheet) return <div className="p-8 text-center text-gray-500">Timesheet not found.</div>;

    const { contract } = timesheet;
    const expectedHours = contract?.weekly_hours || 40;
    const loggedHours = timesheet.total_hours;
    const diff = loggedHours - expectedHours;
    
    const isMonthlyOrBiWeekly = contract?.billing_frequency === 'monthly' || contract?.billing_frequency === 'bi_weekly';
    const isSalaried = contract?.compensation_type === 'monthly' || contract?.compensation_type === 'fixed';
    const showDeduction = isSalaried && contract?.time_tracking_required;

    // Financial logic (frontend-only helpers as per requirements)
    const hourlyRate = (contract?.client_gross_amount || 0);
    const estimatedDeduction = diff < 0 ? Math.abs(diff) * (hourlyRate / (expectedHours * 4.33)) : 0; // Rough monthly logic if gross is monthly
    // If gross is monthly, hourly equiv = monthly / (weekly * 4.33)
    const computedHourlyRate = isSalaried ? (hourlyRate / (expectedHours * 4.33)) : hourlyRate;
    const actualDeduction = diff < 0 ? Math.abs(diff) * computedHourlyRate : 0;
    const projectedAmount = isSalaried ? (hourlyRate - actualDeduction) : (loggedHours * hourlyRate);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "approved": return "bg-green-50 text-green-700 border-green-200";
            case "submitted": return "bg-blue-50 text-blue-700 border-blue-200";
            case "draft": return "bg-gray-50 text-gray-700 border-gray-200";
            case "rejected": return "bg-red-50 text-red-700 border-red-200";
            default: return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-12 animate-fade-in space-y-6">
            <div className="flex items-center text-sm text-gray-500 hover:text-gray-900 cursor-pointer w-fit transition-colors" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Timesheets
            </div>

            <div className="grid lg:grid-cols-4 gap-8 items-start">
                
                {/* Left Panel: Content (Read Only) */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="p-6 border-b border-gray-100 flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <h1 className="text-xl font-semibold text-gray-900">{contract?.talent?.first_name} {contract?.talent?.last_name}</h1>
                                <p className="text-sm text-gray-500">{contract?.role_title} • {contract?.client?.company_name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Period Range</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {new Date(timesheet.week_start).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {new Date(timesheet.week_end).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow>
                                        <TableHead className="w-[120px] text-xs font-semibold text-gray-500">Day</TableHead>
                                        <TableHead className="text-xs font-semibold text-gray-500">Hours</TableHead>
                                        <TableHead className="text-xs font-semibold text-gray-500">Notes / Task</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} className="h-32 text-center text-sm text-gray-400">No daily entries submitted.</TableCell></TableRow>
                                    ) : entries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="text-[11px] font-medium text-gray-700">
                                                {new Date(entry.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </TableCell>
                                            <TableCell className="text-sm font-bold text-gray-900">{entry.hours}h</TableCell>
                                            <TableCell className="text-xs text-gray-600 max-w-md truncate">{entry.description || "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-gray-50/30">
                                        <TableCell className="text-xs font-bold text-gray-900">Weekly Total</TableCell>
                                        <TableCell className="text-sm font-black text-brand-primary">{timesheet.total_hours}h</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Contract Context Card */}
                    <Card className="border-gray-200 shadow-sm bg-white">
                        <CardContent className="p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                Contractual Context
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Billing Frequency</p>
                                    <p className="text-sm font-medium text-gray-900 capitalize">{contract?.billing_frequency?.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Compensation</p>
                                    <p className="text-sm font-medium text-gray-900 capitalize">{contract?.compensation_type}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Weekly Target</p>
                                    <p className="text-sm font-medium text-gray-900">{expectedHours} Hours</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Contract Total</p>
                                    <p className="text-sm font-medium text-gray-900">${contract?.client_gross_amount?.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {timesheet.notes && (
                      <Card className="border-gray-200 shadow-sm bg-white">
                        <CardContent className="p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Talent Comments</h3>
                            <p className="text-sm text-gray-600 italic">"{timesheet.notes}"</p>
                        </CardContent>
                      </Card>
                    )}
                </div>

                {/* Right Panel: Actions + Finance (Sticky) */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
                    <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
                        <div className={`p-4 border-b ${getStatusStyles(timesheet.status)}`}>
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-wider">Status</p>
                                <Badge variant="outline" className={`h-5 text-[9px] uppercase font-bold shadow-none ${getStatusStyles(timesheet.status)}`}>
                                    {timesheet.status}
                                </Badge>
                            </div>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            
                            {/* Deduction / Finance Preview */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
                                    <Calculator className="h-4 w-4 text-gray-400" />
                                    Finance Preview
                                </h3>

                                {showDeduction ? (
                                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-3">
                                      <div className="flex justify-between text-xs">
                                          <span className="text-gray-500">Expected Hours</span>
                                          <span className="font-medium text-gray-900">{expectedHours}h</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                          <span className="text-gray-500">Logged Hours</span>
                                          <span className="font-medium text-gray-900">{loggedHours}h</span>
                                      </div>
                                      {diff < 0 && (
                                        <>
                                          <div className="flex justify-between text-xs">
                                              <span className="text-gray-500">Missing Hours</span>
                                              <span className="font-medium text-red-600">{Math.abs(diff)}h</span>
                                          </div>
                                          <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between text-xs">
                                              <span className="text-gray-500 font-semibold italic text-[10px]">Estimated Deduction</span>
                                              <span className="font-bold text-red-600">-${actualDeduction.toFixed(2)}</span>
                                          </div>
                                        </>
                                      )}
                                      <div className="pt-3 mt-3 border-t border-gray-200 flex items-center justify-between">
                                          <span className="text-xs font-bold text-gray-900">Projected Payable</span>
                                          <span className="text-sm font-black text-gray-900">${projectedAmount.toFixed(2)}</span>
                                      </div>
                                      <p className="text-[9px] text-gray-400 leading-tight">Estimated deduction based on missing hours for salaried contract with tracking enabled.</p>
                                  </div>
                                ) : (
                                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-3">
                                      <div className="flex justify-between text-xs">
                                          <span className="text-gray-500">Computation Rate</span>
                                          <span className="font-medium text-gray-900">${hourlyRate.toFixed(2)} /h</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                          <span className="text-gray-500">Logged Hours</span>
                                          <span className="font-medium text-gray-900">{loggedHours}h</span>
                                      </div>
                                      <div className="pt-3 mt-3 border-t border-gray-200 flex items-center justify-between">
                                          <span className="text-xs font-bold text-gray-900">Estimated Total</span>
                                          <span className="text-lg font-black text-gray-900">${projectedAmount.toFixed(2)}</span>
                                      </div>
                                      <p className="text-[9px] text-gray-400 leading-tight">{isSalaried ? "Fixed billing – no deductions applied or hours tracking not mandatory." : "Standard hourly billing computation."}</p>
                                  </div>
                                )}
                            </div>

                            {/* Approval Actions */}
                            {timesheet.status === 'submitted' && (
                                <div className="space-y-3 pt-6 border-t border-gray-100">
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm" onClick={() => setIsApproveSheetOpen(true)}>
                                        <CheckCircle className="h-4 w-4 mr-2" /> Approve Timesheet
                                    </Button>
                                    <Button variant="outline" className="w-full text-red-600 border-red-100 hover:bg-red-50" onClick={() => setIsRejectSheetOpen(true)}>
                                        <XCircle className="h-4 w-4 mr-2" /> Reject Timesheet
                                    </Button>
                                </div>
                            )}

                            {/* Batch/Invoice Info */}
                            <div className="pt-6 border-t border-gray-100 space-y-3">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Invoice Readiness</h3>
                                {timesheet.invoice_id ? (
                                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                      <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-indigo-600" />
                                          <span className="text-xs font-semibold text-indigo-900">#INV-{timesheet.invoice_id.slice(0, 8)}</span>
                                      </div>
                                      <ExternalLink className="h-3 w-3 text-indigo-400" />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-60">
                                      <FileText className="h-4 w-4 text-gray-400" />
                                      <span className="text-xs font-medium text-gray-500">Not yet invoiced</span>
                                  </div>
                                )}
                            </div>
                        </CardContent>
                        
                        {/* Audit Footer */}
                        <div className="bg-gray-50 p-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[8px] uppercase font-bold text-gray-400">Submitted</p>
                                <p className="text-[9px] font-medium text-gray-600">{timesheet.submitted_at ? new Date(timesheet.submitted_at).toLocaleDateString() : "—"}</p>
                            </div>
                            <div>
                                <p className="text-[8px] uppercase font-bold text-gray-400">Processed</p>
                                <p className="text-[9px] font-medium text-gray-600">{timesheet.updated_at ? new Date(timesheet.updated_at).toLocaleDateString() : "Pending"}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Approval Confirm Sheet */}
            <Sheet open={isApproveSheetOpen} onOpenChange={setIsApproveSheetOpen}>
                <SheetContent side="right" className="sm:max-w-md bg-white border-l shadow-2xl p-0 flex flex-col h-full">
                    <SheetHeader className="p-6 border-b border-gray-100">
                        <SheetTitle className="text-gray-900">Confirm Approval</SheetTitle>
                        <SheetDescription>You are approving {timesheet.total_hours} hours for {contract?.talent?.first_name}.</SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 p-6 space-y-6">
                        <div className="bg-green-50 rounded-lg p-5 border border-green-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-green-800 font-medium">Approved Hours</span>
                                <span className="text-xl font-black text-green-900">{timesheet.total_hours}h</span>
                            </div>
                            <div className="flex justify-between items-center text-xs pt-4 border-t border-green-100">
                                <span className="text-green-800">Final Gross Impact</span>
                                <span className="font-bold text-green-900">${projectedAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-[10px] text-gray-500 leading-normal italic">By approving, this timesheet will be locked and queued for the next automated invoicing cycle. Notifications will be sent to the talent and client.</p>
                        </div>
                    </div>
                    <SheetFooter className="p-6 border-t border-gray-100 bg-gray-50/50">
                        <Button variant="outline" className="bg-white" onClick={() => setIsApproveSheetOpen(false)}>Cancel</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={processing}>
                            {processing ? "Processing..." : "Confirm & Send"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Rejection Sheet */}
            <Sheet open={isRejectSheetOpen} onOpenChange={setIsRejectSheetOpen}>
                <SheetContent side="right" className="sm:max-w-md bg-white border-l shadow-2xl p-0 flex flex-col h-full">
                    <SheetHeader className="p-6 border-b border-gray-100 shadow-sm">
                        <SheetTitle className="text-gray-900">Reject Timesheet</SheetTitle>
                        <SheetDescription>Provide context to the talent for the requested changes.</SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 p-6 space-y-4">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Reason for rejection</label>
                        <Textarea 
                            placeholder="e.g. Please clarify hours for Tuesday or provide missing notes for tasks..." 
                            className="text-sm min-h-[160px] bg-white border-gray-200 shadow-none focus-visible:ring-brand-primary/20"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <SheetFooter className="p-6 border-t border-gray-100 bg-red-50/30">
                        <Button variant="outline" className="bg-white" onClick={() => setIsRejectSheetOpen(false)}>Cancel</Button>
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={handleReject} disabled={processing || !rejectionReason}>
                            {processing ? "Rejecting..." : "Reject Timesheet"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default AdminTimesheetDetail;
