import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
    MessageSquare,
    Plus,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
} from "lucide-react";

export default function Support() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newTicket, setNewTicket] = useState({
        subject: "",
        description: "",
        category: "other",
        priority: "normal",
    });

    useEffect(() => {
        if (user) fetchTickets();
    }, [user]);

    const fetchTickets = async () => {
        try {
            const { data, error } = await supabase
                .from("support_tickets")
                .select("*")
                .eq("user_id", user?.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!newTicket.subject || !newTicket.description) {
            toast({
                title: "Required Fields",
                description: "Please fill in subject and description.",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from("support_tickets").insert({
                user_id: user.id,
                subject: newTicket.subject,
                description: newTicket.description,
                category: newTicket.category as any,
                priority: newTicket.priority,
                status: "open",
            });

            if (error) throw error;

            toast({
                title: "Ticket Created",
                description: "Support request submitted successfully.",
            });
            setDialogOpen(false);
            setNewTicket({ subject: "", description: "", category: "other", priority: "normal" });
            fetchTickets();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            open: "bg-blue-100 text-blue-700 border-blue-200",
            in_progress: "bg-purple-100 text-purple-700 border-purple-200",
            resolved: "bg-green-100 text-green-700 border-green-200",
            closed: "bg-gray-100 text-gray-700 border-gray-200",
        };
        return (
            <Badge variant="outline" className={styles[status] || "bg-gray-100"}>
                {status.replace("_", " ").toUpperCase()}
            </Badge>
        );
    };

    const openTickets = tickets.filter((t) => ["open", "in_progress"].includes(t.status));
    const resolvedTickets = tickets.filter((t) => ["resolved", "closed"].includes(t.status));

    if (loading) return <div className="p-8">Loading support tickets...</div>;

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Support Center</h1>
                    <p className="text-muted-foreground mt-1">
                        Track your requests and communicate with our team
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create Support Ticket</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject</label>
                                <Input
                                    placeholder="e.g., Billing Inquiry"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <Select
                                        value={newTicket.category}
                                        onValueChange={(val) => setNewTicket({ ...newTicket, category: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="job">Job/Hiring</SelectItem>
                                            <SelectItem value="billing">Billing</SelectItem>
                                            <SelectItem value="technical">Technical Issue</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Priority</label>
                                    <Select
                                        value={newTicket.priority}
                                        onValueChange={(val) => setNewTicket({ ...newTicket, priority: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    placeholder="Describe your issue..."
                                    rows={4}
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Submitting..." : "Submit Ticket"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="open">
                <TabsList>
                    <TabsTrigger value="open">Open Requests ({openTickets.length})</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved ({resolvedTickets.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="open" className="mt-6 space-y-4">
                    {openTickets.length === 0 ? (
                        <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                            <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No open tickets</p>
                        </div>
                    ) : (
                        openTickets.map((ticket) => (
                            <TicketCard key={ticket.id} ticket={ticket} getStatusBadge={getStatusBadge} />
                        ))
                    )}
                </TabsContent>
                <TabsContent value="resolved" className="mt-6 space-y-4">
                    {resolvedTickets.length === 0 ? (
                        <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                            <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No resolved tickets yet</p>
                        </div>
                    ) : (
                        resolvedTickets.map((ticket) => (
                            <TicketCard key={ticket.id} ticket={ticket} getStatusBadge={getStatusBadge} />
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

const TicketCard = ({ ticket, getStatusBadge }: { ticket: any, getStatusBadge: any }) => (
    <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
                <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {ticket.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                        <Badge variant="secondary" className="capitalize">
                            {ticket.category}
                        </Badge>
                        <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 'outline'} className="capitalize">
                            {ticket.priority} Priority
                        </Badge>
                        {ticket.id.startsWith('job') && (
                            <span className="flex items-center gap-1 text-indigo-600 font-medium">
                                <FileText className="h-3 w-3" />
                                Related to Job
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div>{getStatusBadge(ticket.status)}</div>
        </div>
    </Card>
);
