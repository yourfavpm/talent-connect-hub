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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Search, FileText, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

const AdminTimesheets = () => {
    const [timesheets, setTimesheets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchTimesheets();
    }, []);

    const fetchTimesheets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("timesheets")
                .select(`
                    *,
                    contract:contracts (
                        contract_number,
                        role_title,
                        weekly_hours,
                        client:clients (company_name),
                        talent:talents (first_name, last_name)
                    )
                `)
                .order("submitted_at", { ascending: false });

            if (error) throw error;
            setTimesheets(data || []);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
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

            toast({ title: "Approved", description: "Timesheet has been approved." });
            fetchTimesheets();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleReject = async () => {
        if (!selectedTimesheet || !rejectionReason) return;

        try {
            const { error } = await supabase
                .from("timesheets")
                .update({
                    status: "rejected",
                    rejection_reason: rejectionReason
                })
                .eq("id", selectedTimesheet.id);

            if (error) throw error;

            toast({ title: "Rejected", description: "Timesheet returned to talent." });
            setIsRejectDialogOpen(false);
            setRejectionReason("");
            setSelectedTimesheet(null);
            fetchTimesheets();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved": return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Approved</Badge>;
            case "submitted": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Submitted</Badge>;
            case "draft": return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
            case "rejected": return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredTimesheets = timesheets.filter(ts =>
        (ts.contract?.talent?.first_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ts.contract?.talent?.last_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ts.contract?.client?.company_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const [viewDialogOpen, setViewDialogOpen] = useState(false);

    const handleViewDetails = (ts: any) => {
        setSelectedTimesheet(ts);
        setViewDialogOpen(true);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Timesheets</h1>
                    <p className="text-muted-foreground">Review and approve talent timesheets</p>
                </div>
            </div>

            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search talent or client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Week Of</TableHead>
                            <TableHead>Talent</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : filteredTimesheets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No timesheets found</TableCell>
                            </TableRow>
                        ) : (
                            filteredTimesheets.map((ts) => (
                                <TableRow key={ts.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            {new Date(ts.week_start).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>{ts.contract?.talent?.first_name} {ts.contract?.talent?.last_name}</TableCell>
                                    <TableCell>{ts.contract?.client?.company_name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold">{ts.total_hours} hrs</span>
                                            {ts.total_hours > (ts.contract?.weekly_hours || 40) && (
                                                <span className="text-xs text-amber-600 font-medium">
                                                    {(ts.total_hours - (ts.contract?.weekly_hours || 40)).toFixed(1)} hrs OT
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(ts.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(ts)}>
                                            <FileText className="h-4 w-4 mr-2" />
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Reject Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Timesheet</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            Reason for rejection:
                        </p>
                        <Textarea
                            placeholder="e.g. Incorrect hours for Monday..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject}>Reject Timesheet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Timesheet Details</DialogTitle>
                    </DialogHeader>

                    {selectedTimesheet && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        {selectedTimesheet.contract?.talent?.first_name} {selectedTimesheet.contract?.talent?.last_name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{selectedTimesheet.contract?.role_title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{selectedTimesheet.contract?.client?.company_name}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-xl font-bold">{selectedTimesheet.total_hours} hrs</div>
                                    <div className="text-xs text-muted-foreground">Total for week</div>
                                </div>
                            </div>

                            {/* Hypothetical Daily Breakdown Visualization */}
                            <div className="grid grid-cols-7 gap-1 text-center">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <div key={day} className="p-2 border rounded bg-background">
                                        <div className="text-xs text-muted-foreground font-semibold">{day}</div>
                                        {/* Mocking daily distribution for now as we don't store daily lines yet */}
                                        <div className="text-sm font-bold mt-1">{(selectedTimesheet.total_hours / 5).toFixed(1)}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-900">Contract Weekly Limit</p>
                                        <p className="text-xs text-yellow-700">{selectedTimesheet.contract?.weekly_hours || 40} hours / week</p>
                                    </div>
                                </div>
                                {selectedTimesheet.total_hours > (selectedTimesheet.contract?.weekly_hours || 40) ? (
                                    <Badge variant="destructive">Overtime Detected</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Within Limits</Badge>
                                )}
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                {selectedTimesheet.status === 'submitted' && (
                                    <>
                                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => {
                                            setViewDialogOpen(false);
                                            setIsRejectDialogOpen(true);
                                        }}>
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject
                                        </Button>
                                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                                            handleApprove(selectedTimesheet.id);
                                            setViewDialogOpen(false);
                                        }}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve Timesheet
                                        </Button>
                                    </>
                                )}
                                <Button variant="secondary" onClick={() => setViewDialogOpen(false)}>Close</Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminTimesheets;
