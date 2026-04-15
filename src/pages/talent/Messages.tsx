import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MessageSquare,
  Clock,
  Edit
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

interface Conversation {
  id: string; // The partner's UUID
  recipientName: string;
  recipientEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const TalentMessages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data: messages, error } = await supabase
        .from("messages")
        .select(`id, sender_id, recipient_id, content, read_at, created_at`)
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const conversationMap = new Map<string, any>();

      for (const msg of messages || []) {
        const partnerId = msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id;

        if (!conversationMap.has(partnerId)) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, first_name, last_name")
            .eq("user_id", partnerId)
            .single();

          const unreadCount = (messages || []).filter(
            (m) => m.sender_id === partnerId && m.recipient_id === user?.id && !m.read_at
          ).length;

          conversationMap.set(partnerId, {
            id: partnerId,
            recipientName: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Admin" : "Admin",
            recipientEmail: profile?.email || "",
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount,
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
      <div className="flex h-[calc(100vh-6rem)] animate-pulse">
        <div className="w-80 border-r border-gray-200 bg-gray-50/50 p-4 hidden md:flex flex-col gap-4">
          <div className="h-10 bg-gray-200 rounded-md w-full" />
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-200 rounded-lg w-full" />)}
        </div>
        <div className="flex-1 bg-white p-6 flex flex-col justify-end gap-6">
           <div className="h-16 w-3/4 bg-gray-100 rounded-2xl rounded-bl-sm self-start" />
           <div className="h-12 w-1/2 bg-gray-200 rounded-2xl rounded-br-sm self-end" />
           <div className="h-16 w-full bg-gray-50 border border-gray-100 rounded-lg mt-10" />
        </div>
      </div>
    );
  }

  // If we are on mobile and AT /talent/messages, we show ONLY the list.
  // We navigate to /talent/messages/:id to view the thread.
  // In the desktop dual-pane architecture, /talent/messages usually handles just the list and renders an empty state on the right, mapped via React Router Outlets or handled conditionally.
  // Since `App.tsx` routes `<Route path="messages/:id" element={<TalentMessageThread />} />`, we will build the list here and let it link out. The thread view will implement the dual pane by importing this list if needed, OR we can just keep them architecturally separate but visually identical.
  // Let's keep them separated to respect existing routes: `TalentMessages` is the List View. `TalentMessageThread` is the List View (Left) + Chat View (Right).

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row bg-white border border-gray-200 shadow-sm overflow-hidden w-full">
      
      {/* Left Pane: Conversation List */}
      <div className="w-full md:w-80 lg:w-[350px] flex flex-col border-r border-gray-200 bg-gray-50/30 h-full">
        <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Messages</h1>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900">
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-gray-50 border-gray-200 shadow-none focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
               <MessageSquare className="h-8 w-8 text-gray-300 mb-3" />
               <p className="text-sm font-medium text-gray-900">No messages found.</p>
               <p className="text-sm text-gray-500 mt-1">Start a conversation with an administrator.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conv) => (
                <Link 
                  key={conv.id} 
                  to={`/talent/messages/${conv.id}`}
                  className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors relative"
                >
                  <Avatar className="h-10 w-10 border border-gray-200 shrink-0 shadow-sm">
                    <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm font-semibold">
                      {conv.recipientName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={clsx("text-sm truncate", conv.unreadCount > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700")}>
                        {conv.recipientName}
                      </h3>
                      <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                        {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: false }).replace('about', '')}
                      </span>
                    </div>
                    <p className={clsx("text-sm truncate", conv.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500")}>
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2.5 w-2.5 bg-brand-primary rounded-full ring-4 ring-white" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Empty State (only visible on desktop when no thread selected) */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-white p-8">
         <div className="h-16 w-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
           <MessageSquare className="h-8 w-8 text-gray-300" />
         </div>
         <h2 className="text-lg font-medium text-gray-900">Your Messages</h2>
         <p className="text-sm text-gray-500 mt-1 max-w-[280px] text-center">Select a conversation from the sidebar or start a new message.</p>
      </div>

    </div>
  );
};

export default TalentMessages;
