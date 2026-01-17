import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    Send,
    Paperclip,
    Check,
    CheckCheck,
    User
} from "lucide-react";
import { format } from "date-fns";

interface Message {
    id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    read_at: string | null;
    attachment_url: string | null;
    created_at: string;
}

interface Recipient {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
}

const MessageThread = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [recipient, setRecipient] = useState<Recipient | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (user && id) {
            fetchMessages();
            fetchRecipient();
            markAsRead();
        }
    }, [user, id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchRecipient = async () => {
        const { data: profile } = await supabase
            .from("profiles")
            .select("email, first_name, last_name")
            .eq("user_id", id)
            .single();

        const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", id);

        const isAdmin = roles?.some((r) =>
            ["super_admin", "operations_admin", "vetting_admin", "finance_admin", "support_admin"].includes(r.role)
        );

        setRecipient({
            id: id!,
            name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Admin" : "Admin",
            email: profile?.email || "",
            isAdmin: isAdmin || false,
        });
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${id}),and(sender_id.eq.${id},recipient_id.eq.${user?.id})`)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("sender_id", id)
            .eq("recipient_id", user?.id)
            .is("read_at", null);
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const { error } = await supabase.from("messages").insert({
                sender_id: user?.id,
                recipient_id: id,
                content: newMessage.trim(),
            });

            if (error) throw error;

            setNewMessage("");
            fetchMessages();
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to send message",
                variant: "destructive",
            });
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
            {/* Header */}
            <Card className="rounded-b-none border-b-0">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/talent/messages")}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500">
                            <AvatarFallback className="text-white font-semibold">
                                {recipient?.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "AD"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="font-semibold">{recipient?.name}</h2>
                                {recipient?.isAdmin && (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                        Admin
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">{recipient?.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Messages */}
            <Card className="flex-1 rounded-none border-y-0 overflow-hidden">
                <CardContent className="p-4 h-full overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
                    <div className="space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                <div className="p-4 rounded-full bg-muted mb-4">
                                    <Send className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const isSent = message.sender_id === user?.id;
                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-2xl px-4 py-3 ${isSent
                                                    ? "bg-gradient-to-r from-accent to-blue-500 text-white rounded-br-md"
                                                    : "bg-white border shadow-sm rounded-bl-md"
                                                }`}
                                        >
                                            <p className="text-sm">{message.content}</p>
                                            <div className={`flex items-center gap-1 mt-1 text-xs ${isSent ? "text-white/70" : "text-muted-foreground"}`}>
                                                <span>{format(new Date(message.created_at), "h:mm a")}</span>
                                                {isSent && (
                                                    message.read_at ? (
                                                        <CheckCheck className="h-3 w-3 text-white" />
                                                    ) : (
                                                        <Check className="h-3 w-3" />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </CardContent>
            </Card>

            {/* Input */}
            <Card className="rounded-t-none border-t-0">
                <CardContent className="p-4">
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="shrink-0">
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <Input
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!newMessage.trim() || sending}
                            className="bg-gradient-to-r from-accent to-blue-500"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MessageThread;
