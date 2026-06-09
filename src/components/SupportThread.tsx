import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { notifyUser } from "@/utils/notifications";
import { useAuth } from "@/hooks/useAuth";
import { sendSupportRepliedEmail } from "@/lib/email/triggers";

interface SupportThreadProps {
    ticketId: string;
    isAdmin?: boolean;
    currentUserId?: string;
    ticketOwnerId?: string;
}

interface Reply {
    id: string;
    message: string;
    created_at: string;
    is_admin_reply: boolean;
    user_id: string;
}

const SupportThread = ({ ticketId, isAdmin = false, currentUserId, ticketOwnerId }: SupportThreadProps) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [replies, setReplies] = useState<Reply[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReplies();

        // Optional: Realtime subscription could go here
        const channel = supabase
            .channel('ticket_replies')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'ticket_replies', filter: `ticket_id=eq.${ticketId}` },
                (payload) => {
                    setReplies((current) => [...current, payload.new as any as Reply]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [ticketId]);

    const fetchReplies = async () => {
        try {
            const { data, error } = await supabase
                .from("ticket_replies" as any)
                .select("*")
                .eq("ticket_id", ticketId)
                .order("created_at", { ascending: true }); // Oldest first for chat

            if (error) throw error;
            if (error) throw error;
            setReplies((data || []) as unknown as Reply[]);
        } catch (error) {
            console.error("Error fetching replies:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        setSending(true);
        try {
            const { error } = await supabase
                .from("ticket_replies" as any)
                .insert({
                    ticket_id: ticketId,
                    user_id: currentUserId,
                    message: newMessage,
                    is_admin_reply: isAdmin
                });

            if (error) throw error;
            setNewMessage("");

            // Manual fetch to play safe
            const { data: inserted } = await supabase
                .from("ticket_replies" as any)
                .select("*")
                .eq("ticket_id", ticketId)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (inserted) {
                setReplies(prev => {
                    // Cast inserted to Reply
                    const newReply = inserted as unknown as Reply;
                    if (prev.find(r => r.id === newReply.id)) return prev;
                    return [...prev, newReply];
                });

                // Notify logic
                if (isAdmin && ticketOwnerId) {
                    await notifyUser(
                        ticketOwnerId,
                        "New Support Reply",
                        "An admin has replied to your support ticket.",
                        "support",
                        `/talent/support/${ticketId}`
                    );
                } else if (!isAdmin) {
                    // User replied, notify admin
                    try {
                        await sendSupportRepliedEmail({
                            email: user?.email || '',
                            ticketId: ticketId,
                            isTalent: window.location.pathname.includes('/talent/'),
                            isAdminReply: false,
                            replyContent: newMessage
                        });
                    } catch (e) {
                        console.error("Failed to send admin notification", e);
                    }
                }
            }

        } catch (error: any) {
            toast({ title: "Failed to send", description: error.message, variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[400px] border rounded-md">
            <div className="p-3 border-b bg-muted/30">
                <h3 className="font-semibold text-sm">Discussion History</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                {loading ? (
                    <div className="text-center text-muted-foreground text-sm">Loading history...</div>
                ) : replies.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">No replies yet. Start the conversation.</div>
                ) : (
                    <div className="space-y-4">
                        {replies.map((reply) => {
                            const isMe = isAdmin ? reply.is_admin_reply : (!reply.is_admin_reply && reply.user_id === currentUserId);

                            // Logic:
                            // If I am Admin -> My messages are Right (Green). User messages are Left (Gray).
                            // If I am User -> My messages are Right (Blue). Admin messages are Left (Gray).
                            // But usually support chat: User = Right, Support = Left?
                            // Admin view: Me(Admin) = Right. User = Left.
                            // User view: Me(User) = Right. Admin = Left.

                            const isRight = (isAdmin && reply.is_admin_reply) || (!isAdmin && !reply.is_admin_reply && reply.user_id === currentUserId);

                            return (
                                <div key={reply.id} className={cn("flex gap-2 max-w-[80%]", isRight ? "ml-auto flex-row-reverse" : "")}>
                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                        reply.is_admin_reply ? "bg-primary/20" : "bg-muted")}>
                                        {reply.is_admin_reply ? <Shield className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                    <div className={cn("rounded-lg p-3 text-sm",
                                        isRight ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                                        <p>{reply.message}</p>
                                        <p className={cn("text-[10px] mt-1 opacity-70", isRight ? "text-primary-foreground" : "text-muted-foreground")}>
                                            {new Date(reply.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>

            <div className="p-3 border-t bg-background mt-auto flex gap-2">
                <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <Button onClick={handleSend} disabled={sending || !newMessage.trim()} size="icon" className="h-[60px] w-[60px]">
                    <Send className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
};

export default SupportThread;
