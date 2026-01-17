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
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import SupportThread from "@/components/SupportThread";
import { useAuth } from "@/hooks/useAuth";

const AdminSupport = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [statusUpdate, setStatusUpdate] = useState("");

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            // Need to join user to get email/name?
            // support_tickets has user_id. We might need to fetch profiles separately or rely on user metadata in a real app.
            // For now, we just show user_id or fetch simple data.
            // If we have a profiles table, we join it.

            const { data, error } = await supabase
                .from("support_tickets")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedTicket || !statusUpdate) return;

        try {
            const { error } = await supabase
                .from("support_tickets")
                .update({ status: statusUpdate as any })
                .eq("id", selectedTicket.id);

            if (error) throw error;

            toast.success("Ticket status updated");
            setSelectedTicket(null);
            fetchTickets();
        } catch (error: any) {
            toast.error("Failed to update ticket: " + error.message);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "open": return <Badge variant="destructive">Open</Badge>;
            case "in_progress": return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>;
            case "resolved": return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Resolved</Badge>;
            case "closed": return <Badge variant="outline">Closed</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Support Center</h1>
                    <p className="text-muted-foreground">Manage and resolve user inquiries</p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : tickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No tickets found</TableCell>
                            </TableRow>
                        ) : (
                            tickets.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                            {ticket.subject}
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize">{ticket.category}</TableCell>
                                    <TableCell className="capitalize">{ticket.priority}</TableCell>
                                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                    <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            setSelectedTicket(ticket);
                                            setStatusUpdate(ticket.status);
                                        }}>
                                            Manage
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedTicket?.subject}</DialogTitle>
                        <DialogDescription>
                            <div className="mt-2 text-sm text-foreground bg-muted p-3 rounded-md">
                                {selectedTicket?.description}
                            </div>
                            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                                <span>User ID: {selectedTicket?.user_id}</span>
                                <span>Created: {selectedTicket && new Date(selectedTicket.created_at).toLocaleString()}</span>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium w-24">Update Status:</label>
                            <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" onClick={handleUpdateStatus}>Update Status</Button>
                        </div>

                        {selectedTicket && (
                            <SupportThread
                                ticketId={selectedTicket.id}
                                isAdmin={true}
                                currentUserId={(supabase.auth.getSession() as any)?.user?.id} // This is ugly, better to use useAuth
                                ticketOwnerId={selectedTicket.user_id}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminSupport;
