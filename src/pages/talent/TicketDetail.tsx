import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import SupportThread from "@/components/SupportThread";

const TicketDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchTicket();
        }
    }, [id]);

    const fetchTicket = async () => {
        try {
            const { data, error } = await supabase
                .from("support_tickets")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            setTicket(data);
        } catch (error) {
            console.error("Error fetching ticket:", error);
        } finally {
            setLoading(false);
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

    if (loading) return <div className="p-8 text-center">Loading ticket...</div>;
    if (!ticket) return <div className="p-8 text-center">Ticket not found</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
            <Link to="/talent/support" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Tickets
            </Link>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline">{ticket.category}</Badge>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(ticket.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
                                </div>
                                {getStatusBadge(ticket.status)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted/30 p-4 rounded-md text-sm leading-relaxed">
                                {ticket.description}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MessageSquare className="h-5 w-5" />
                                Conversation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SupportThread
                                ticketId={ticket.id}
                                isAdmin={false}
                                currentUserId={user?.id}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="w-full md:w-80 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Ticket Details</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div>
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Ticket ID</span>
                                <span className="font-mono text-xs block bg-muted p-1 rounded font-medium">{ticket.id}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Priority</span>
                                <Badge variant="outline" className="capitalize">{ticket.priority}</Badge>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Last Updated</span>
                                <span>{new Date(ticket.updated_at || ticket.created_at).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;
