import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    MessageSquare,
    Search,
    Send,
    User,
    Mail,
    Clock,
    ChevronRight,
    Plus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
    id: string;
    recipientId: string;
    recipientName: string;
    recipientEmail: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    isAdmin: boolean;
}

const TalentMessages = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user]);

    const fetchConversations = async () => {
        try {
            // Get all messages where user is sender or recipient
            const { data: messages, error } = await supabase
                .from("messages")
                .select(`
          id,
          sender_id,
          recipient_id,
          content,
          read_at,
          created_at
        `)
                .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Group by conversation partner
            const conversationMap = new Map<string, any>();

            for (const msg of messages || []) {
                const partnerId = msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id;

                if (!conversationMap.has(partnerId)) {
                    // Fetch partner info
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("email, first_name, last_name")
                        .eq("user_id", partnerId)
                        .single();

                    // Check if partner is admin
                    const { data: roles } = await supabase
                        .from("user_roles")
                        .select("role")
                        .eq("user_id", partnerId);

                    const isAdmin = roles?.some((r) =>
                        ["super_admin", "operations_admin", "vetting_admin", "finance_admin", "support_admin"].includes(r.role)
                    );

                    // Count unread
                    const unreadCount = (messages || []).filter(
                        (m) => m.sender_id === partnerId && m.recipient_id === user?.id && !m.read_at
                    ).length;

                    conversationMap.set(partnerId, {
                        id: partnerId,
                        recipientId: partnerId,
                        recipientName: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Admin" : "Admin",
                        recipientEmail: profile?.email || "",
                        lastMessage: msg.content,
                        lastMessageTime: msg.created_at,
                        unreadCount,
                        isAdmin,
                    });
                }
            }

            setConversations(Array.from(conversationMap.values()));
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredConversations = conversations.filter((conv) =>
        conv.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 p-8 text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <MessageSquare className="h-6 w-6" />
                            <h1 className="text-2xl md:text-3xl font-bold">Messages</h1>
                        </div>
                        <p className="text-white/80">Communicate with Taskive administrators</p>
                    </div>
                    <Link to="/talent/messages/new">
                        <Button className="bg-white text-blue-700 hover:bg-white/90 shadow-lg">
                            <Plus className="h-4 w-4 mr-2" />
                            New Message
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Conversations List */}
            {filteredConversations.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 mb-4">
                            <MessageSquare className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Start a conversation with a Taskive administrator
                        </p>
                        <Link to="/talent/messages/new">
                            <Button>
                                <Send className="h-4 w-4 mr-2" />
                                Send First Message
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredConversations.map((conversation) => (
                        <Link key={conversation.id} to={`/talent/messages/${conversation.id}`}>
                            <Card className="hover:shadow-md transition-all duration-200 hover:border-accent/50 group cursor-pointer">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500">
                                            <AvatarFallback className="text-white font-semibold">
                                                {conversation.recipientName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold truncate group-hover:text-accent transition-colors">
                                                        {conversation.recipientName}
                                                    </h3>
                                                    {conversation.isAdmin && (
                                                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                                            Admin
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {conversation.lastMessage}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {conversation.unreadCount > 0 && (
                                                <Badge className="bg-accent text-white">
                                                    {conversation.unreadCount}
                                                </Badge>
                                            )}
                                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* Info Note */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500 text-white">
                        <Mail className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-medium text-amber-900">Admin Communication Only</p>
                        <p className="text-sm text-amber-700">
                            In the MVP, you can only message Taskive administrators. Direct client messaging will be available in future updates.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TalentMessages;
