import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    User,
    FileText,
    Calendar,
    ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Timesheet {
    id: string;
    week_start: string;
    week_end: string;
    total_hours: number;
    status: string;
    submitted_at: string | null;
    rejection_reason: string | null;
    contract: {
        contract_number: string;
        role_title: string;
        talent: {
            first_name: string;
            last_name: string;
        };
    };
    timesheet_entries: {
        date: string;
        hours: number;
        description: string;
    }[];
}

const ClientTimesheets = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("submitted");
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [viewingId, setViewingId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchTimesheets();
        }
    }, [user, statusFilter]);

    const fetchTimesheets = async () => {
        try {
            // Get client ID
            const { data: client } = await supabase
                .from("clients")
                .select("id")
                .eq("user_id", user?.id)
                .single();

            if (!client) return;

            let query = supabase
                .from("timesheets")
                .select(`
                    id,
                    week_start,
                    week_end,
                    total_hours,
                    status,
                    submitted_at,
                    rejection_reason,
                    contract:contracts!inner (
                        contract_number,
                        role_title,
                        talent:talents (
                            first_name,
                            last_name
                        )
                    ),
                    timesheet_entries (
                        date,
                        hours,
                        description
                    )
                `)
                .eq("contract.client_id", client.id)
                .order("submitted_at", { ascending: false });

            if (statusFilter !== "all") {
                query = query.eq("status", statusFilter);
            } else {
                query = query.neq("status", "draft");
            }

            const { data, error } = await query;
            if (error) throw error;
            // @ts-ignore
            setTimesheets(data || []);
        } catch (error) {
            console.error("Error fetching timesheets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const { error } = await supabase
                .from("timesheets")
                .update({ status: "approved" })
                .eq("id", id);

            if (error) throw error;

            toast({
                title: "Timesheet Approved",
                description: "The timesheet has been approved successfully.",
            });
            fetchTimesheets();
            setViewingId(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleReject = async () => {
        if (!rejectingId || !rejectionReason) return;

        try {
            const { error } = await supabase
                .from("timesheets")
                .update({
                    status: "rejected",
                    rejection_reason: rejectionReason
                })
                .eq("id", rejectingId);

            if (error) throw error;

            toast({
                title: "Timesheet Rejected",
                description: "The timesheet has been returned to the talent.",
            });
            setRejectingId(null);
            setRejectionReason("");
            fetchTimesheets();
            setViewingId(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved": return "bg-emerald-100 text-emerald-800 border-emerald-200";
            case "rejected": return "bg-red-100 text-red-800 border-red-200";
            case "submitted": return "bg-blue-100 text-blue-800 border-blue-200";
            default: return "bg-slate-100 text-slate-800 border-slate-200";
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Loading timesheets...</div>;

    const selectedTimesheet = timesheets.find(t => t.id === viewingId);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-indigo-800">
                        Timesheets
                    </h1>
                    <p className="text-muted-foreground mt-1">Review and approve hours submitted by your team</p>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Filter: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Statuses</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("submitted")}>Pending Approval</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("approved")}>Approved</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>Rejected</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid gap-4">
                {timesheets.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No timesheets found matching this filter.</p>
                        </CardContent>
                    </Card>
                ) : (
                    timesheets.map((ts) => (
                        <Card key={ts.id} className="hover:shadow-md transition-all">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className={getStatusColor(ts.status)} variant="outline">
                                                {ts.status.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(ts.week_start), "MMM d")} - {format(new Date(ts.week_end), "MMM d")}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                {ts.contract.talent.first_name} {ts.contract.talent.last_name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                <FileText className="h-3 w-3" />
                                                {ts.contract.role_title} ({ts.contract.contract_number})
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Total Hours</p>
                                            <p className="text-2xl font-bold font-mono">{ts.total_hours}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => setViewingId(ts.id)}>View Details</Button>

                                            {ts.status === 'submitted' && (
                                                <>
                                                    <Button size="icon" variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleApprove(ts.id)}>
                                                        <CheckCircle className="h-5 w-5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setRejectingId(ts.id)}>
                                                        <XCircle className="h-5 w-5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* View Details Dialog */}
            <Dialog open={!!viewingId} onOpenChange={(open) => !open && setViewingId(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Timesheet Details</DialogTitle>
                    </DialogHeader>

                    {selectedTimesheet && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <Label className="text-muted-foreground">Talent</Label>
                                    <p className="font-medium">{selectedTimesheet.contract.talent.first_name} {selectedTimesheet.contract.talent.last_name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Week</Label>
                                    <p className="font-medium">{format(new Date(selectedTimesheet.week_start), "MMM d")} - {format(new Date(selectedTimesheet.week_end), "MMM d, yyyy")}</p>
                                </div>
                            </div>

                            <div className="border rounded-md overflow-hidden">
                                <div className="bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wider flex justify-between">
                                    <span>Date</span>
                                    <span>Hours</span>
                                </div>
                                <div className="divide-y">
                                    {selectedTimesheet.timesheet_entries?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(entry => (
                                        <div key={entry.date} className="px-4 py-3 flex justify-between items-center text-sm">
                                            <div>
                                                <p className="font-medium">{format(new Date(entry.date), "EEEE, MMM d")}</p>
                                                {entry.description && <p className="text-muted-foreground text-xs">{entry.description}</p>}
                                            </div>
                                            <span className="font-mono font-medium">{entry.hours}</span>
                                        </div>
                                    ))}
                                    <div className="bg-muted/50 px-4 py-3 flex justify-between items-center font-bold text-sm">
                                        <span>Total</span>
                                        <span>{selectedTimesheet.total_hours}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedTimesheet.rejection_reason && (
                                <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm flex gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold">Rejection Reason:</span> {selectedTimesheet.rejection_reason}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        {selectedTimesheet?.status === 'submitted' && (
                            <>
                                <Button variant="destructive" onClick={() => { setViewingId(null); setRejectingId(selectedTimesheet.id); }}>Reject</Button>
                                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(selectedTimesheet.id)}>Approve</Button>
                            </>
                        )}
                        <Button variant="outline" onClick={() => setViewingId(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rejection Dialog */}
            <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Timesheet</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>Reason for rejection</Label>
                        <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Please explain why this timesheet is being rejected..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject}>Reject Timesheet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientTimesheets;
