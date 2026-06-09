import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  Search,
  Loader2,
  User,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

interface Conversation {
  userId: string;
  name: string;
  email: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

interface Message {
  id: string;
  sender_user_id: string;
  recipient_user_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [clientId, setClientId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { if (user) init(); }, [user]);

  const init = async () => {
    const { data: cId } = await (supabase.rpc("get_my_client_id" as any) as any);
    if (!cId) return;
    setClientId(cId);
    await loadConversations(cId);
    setLoadingConvs(false);

    // Realtime subscription for new messages
    const channel = supabase
      .channel("client-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "client_messages",
          filter: `client_id=eq.${cId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (
            (msg.sender_user_id === user?.id && msg.recipient_user_id === selectedUserId) ||
            (msg.recipient_user_id === user?.id && msg.sender_user_id === selectedUserId)
          ) {
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
          }
          loadConversations(cId);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const loadConversations = async (cId: string) => {
    // Get all messages for this workspace involving the current user
    const { data } = await (supabase
      .from("client_messages" as any)
      .select("sender_user_id, recipient_user_id, content, read_at, created_at")
      .eq("client_id", cId)
      .or(`sender_user_id.eq.${user?.id},recipient_user_id.eq.${user?.id}`)
      .order("created_at", { ascending: false }) as any);

    if (!data) return;

    // Group by conversation partner
    const convMap: Record<string, any> = {};
    for (const msg of data) {
      const partnerId = msg.sender_user_id === user?.id ? msg.recipient_user_id : msg.sender_user_id;
      if (!convMap[partnerId]) {
        convMap[partnerId] = { lastMessage: msg.content, lastAt: msg.created_at, unread: 0 };
      }
      if (msg.recipient_user_id === user?.id && !msg.read_at) {
        convMap[partnerId].unread++;
      }
    }

    // Fetch profiles for each partner
    const partnerIds = Object.keys(convMap);
    if (partnerIds.length === 0) { setConversations([]); return; }

    const { data: profiles } = await (supabase
      .from("profiles" as any)
      .select("user_id, first_name, last_name, email")
      .in("user_id", partnerIds) as any);

    const convs: Conversation[] = partnerIds.map((uid) => {
      const profile = (profiles || []).find((p: any) => p.user_id === uid);
      return {
        userId: uid,
        name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email : uid,
        email: profile?.email || "",
        lastMessage: convMap[uid].lastMessage,
        lastAt: convMap[uid].lastAt,
        unread: convMap[uid].unread,
      };
    }).sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

    setConversations(convs);
  };

  const selectConversation = async (userId: string) => {
    setSelectedUserId(userId);
    setLoadingMsgs(true);
    const { data } = await (supabase
      .from("client_messages" as any)
      .select("*")
      .eq("client_id", clientId)
      .or(`and(sender_user_id.eq.${user?.id},recipient_user_id.eq.${userId}),and(sender_user_id.eq.${userId},recipient_user_id.eq.${user?.id})`)
      .order("created_at", { ascending: true }) as any);
    setMessages(data || []);
    setLoadingMsgs(false);
    scrollToBottom(true);

    // Mark received messages as read
    await (supabase
      .from("client_messages" as any)
      .update({ read_at: new Date().toISOString() })
      .eq("client_id", clientId)
      .eq("sender_user_id", userId)
      .eq("recipient_user_id", user?.id)
      .is("read_at", null) as any);

    // Update local unread count
    setConversations((prev) => prev.map((c) => c.userId === userId ? { ...c, unread: 0 } : c));
  };

  const scrollToBottom = (immediate = false) => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: immediate ? "auto" : "smooth" });
    }, 50);
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !clientId) return;
    setSending(true);
    try {
      const { error } = await (supabase.from("client_messages" as any).insert({
        client_id: clientId,
        sender_user_id: user?.id,
        recipient_user_id: selectedUserId,
        content: newMessage.trim(),
      }) as any);
      if (error) throw error;
      setNewMessage("");
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message, variant: "destructive" });
    } finally { setSending(false); }
  };

  const selectedConv = conversations.find((c) => c.userId === selectedUserId);
  const filteredConvs = conversations.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* ── Left: Conversation List ──────────────────────────── */}
      <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-sm font-semibold text-gray-900">Messages</h1>
            {totalUnread > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{totalUnread}</span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-8 h-8 text-xs border-gray-200"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-300" /></div>
          ) : filteredConvs.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-200" />
              <p className="text-xs text-gray-400">No messages yet</p>
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <button
                key={conv.userId}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50",
                  selectedUserId === conv.userId && "bg-blue-50 hover:bg-blue-50"
                )}
                onClick={() => selectConversation(conv.userId)}
              >
                <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-sm font-semibold text-gray-600">
                  {conv.name[0]?.toUpperCase() || <User className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">{conv.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">{formatTime(conv.lastAt)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2 shrink-0">{conv.unread}</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right: Chat Thread ───────────────────────────────── */}
      {selectedUserId ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
              {selectedConv?.name[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{selectedConv?.name}</p>
              <p className="text-xs text-gray-400">{selectedConv?.email}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {loadingMsgs ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-300" /></div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400">Send your first message</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_user_id === user?.id;
                return (
                  <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                        isMine
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-900 rounded-bl-sm"
                      )}
                    >
                      <p>{msg.content}</p>
                      <p className={cn("text-[10px] mt-1", isMine ? "text-blue-200" : "text-gray-400")}>
                        {format(new Date(msg.created_at), "HH:mm")}
                        {isMine && msg.read_at && " · Read"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 h-10 border-gray-200"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
            />
            <Button type="submit" size="icon" disabled={sending || !newMessage.trim()} className="h-10 w-10 shrink-0">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}
