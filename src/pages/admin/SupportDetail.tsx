import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
    ArrowLeft, 
    Send, 
    Paperclip, 
    User, 
    ExternalLink, 
    Copy, 
    Check,
    Clock,
    AlertCircle,
    MoreHorizontal,
    FileText,
    Shield,
    Trash2
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Reply {
    id: string;
    message: string;
    is_admin_reply: boolean;
    user_id: string;
    created_at: string;
    attachment_url?: string;
}

interface TicketRecord {
    id: string;
    subject: string;
    description: string;
    category: string;
    priority: TicketPriority;
    status: TicketStatus;
    unread_by_admin: boolean;
    internal_notes: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
    };
}

const AdminSupportDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: adminUser } = useAuth();
    
    const [ticket, setTicket] = useState<TicketRecord | null>(null);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    const [replyText, setReplyText] = useState("");
    const [internalNotes, setInternalNotes] = useState("");
    const [statusUpdate, setStatusUpdate] = useState<TicketStatus>("open");
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (id) {
            const init = async () => {
                await fetchTicket();
                await fetchReplies();
                await markAsRead();
            };
            init();
            
            // Real-time subscription
            const channel = supabase
                .channel(`ticket_replies_${id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'ticket_replies', filter: `ticket_id=eq.${id}` },
                    (payload) => {
                        setReplies(current => {
                            if (current.find(r => r.id === payload.new.id)) return current;
                            return [...current, payload.new as Reply];
                        });
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [id, adminUser]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [replies]);

    const fetchTicket = async () => {
        try {
            const { data: ticketData, error } = await supabase
                .from("support_tickets")
                .select(`
                    *,
                    user:profiles (id, email, first_name, last_name)
                `)
                .eq("id", id)
                .single();

            if (error) throw error;
            const finalTicket = ticketData as any;
            setTicket(finalTicket);
            setInternalNotes(finalTicket.internal_notes || "");
            setStatusUpdate(finalTicket.status);
        } catch (error: any) {
            toast.error("Error fetching ticket: " + error.message);
            navigate("/admin/support");
        } finally {
            setLoading(false);
        }
    };

    const fetchReplies = async () => {
        try {
            const { data, error } = await (supabase
                .from("ticket_replies" as any)
                .select("*")
                .eq("ticket_id", id)
                .order("created_at", { ascending: true }) as any);

            if (error) throw error;
            setReplies(data || []);
        } catch (error: any) {
            console.error("Error fetching replies:", error);
        }
    };

    const markAsRead = async () => {
        await supabase
            .from("support_tickets")
            .update({ unread_by_admin: false })
            .eq("id", id);
    };

    const handleSendReply = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!replyText.trim() || sending) return;

        setSending(true);
        try {
            const { error: replyError } = await (supabase
                .from("ticket_replies" as any)
                .insert({
                    ticket_id: id,
                    user_id: adminUser?.id,
                    message: replyText,
                    is_admin_reply: true
                }) as any);

            if (replyError) throw replyError;

            // Auto-update status to In Progress on reply
            if (ticket?.status === 'open') {
                await supabase
                    .from("support_tickets")
                    .update({ status: 'in_progress' })
                    .eq("id", id);
                setStatusUpdate('in_progress');
            }

            setReplyText("");
            toast.success("Reply sent");
        } catch (error: any) {
            toast.error("Failed to send reply: " + error.message);
        } finally {
            setSending(false);
        }
    };

    const handleUpdateMetadata = async () => {
        try {
            const { error } = await supabase
                .from("support_tickets")
                .update({ 
                    status: statusUpdate,
                    internal_notes: internalNotes
                })
                .eq("id", id);

            if (error) throw error;
            toast.success("Ticket updated successfully");
            fetchTicket();
        } catch (error: any) {
            toast.error("Failed to update ticket: " + error.message);
        }
    };

    const copyUserId = () => {
        if (!ticket?.user_id) return;
        navigator.clipboard.writeText(ticket.user_id);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.info("User ID copied to clipboard");
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <div className="h-8 w-8 border-4 border-gray-200 border-t-brand-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50/30 -m-6 md:-m-8">
            {/* Header */}
            <header className="h-16 shrink-0 bg-white border-b border-gray-200 px-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4 min-w-0">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate("/admin/support")}
                        className="text-gray-500 hover:text-gray-900 -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Back
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                            #{ticket.id.split('-')[0].toUpperCase()}
                        </span>
                        <h1 className="text-sm font-semibold text-gray-900 truncate tracking-tight">
                            {ticket.subject}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge className={cn("shadow-none py-0.5", 
                        ticket.priority === 'urgent' ? "bg-red-50 text-red-700 border-red-100" :
                        ticket.priority === 'high' ? "bg-orange-50 text-orange-700 border-orange-100" :
                        "bg-gray-50 text-gray-500 border-gray-100"
                    )}>
                        {ticket.priority.toUpperCase()}
                    </Badge>
                    <Badge className={cn("shadow-none py-0.5 capitalize", 
                        ticket.status === 'open' ? "bg-blue-50 text-blue-700 border-blue-100" :
                        ticket.status === 'in_progress' ? "bg-amber-50 text-amber-700 border-amber-100" :
                        ticket.status === 'resolved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        "bg-gray-100 text-gray-500 border-gray-200"
                    )}>
                        {ticket.status.replace('_', ' ')}
                    </Badge>
                </div>
            </header>

            {/* Main Split Layout */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left Panel - Conversation */}
                <div className="flex-1 flex flex-col bg-white min-w-0 border-r border-gray-200">
                    <ScrollArea className="flex-1" ref={scrollRef}>
                        <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
                            
                            {/* Original Request */}
                            <div className="flex gap-4">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 text-xs font-bold text-gray-500">
                                    {ticket.user?.first_name?.charAt(0) || "U"}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-900">{ticket.user?.first_name} {ticket.user?.last_name}</span>
                                        <span className="text-[11px] text-gray-400">
                                            {format(new Date(ticket.created_at), "MMM d, h:mm a")}
                                        </span>
                                    </div>
                                    <div className="text-[15px] leading-relaxed text-gray-700 whitespace-pre-wrap bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                        {ticket.description}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 py-4">
                                <Separator className="flex-1" />
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest whitespace-nowrap">Discussion History</span>
                                <Separator className="flex-1" />
                            </div>

                            {/* Replies */}
                            {replies.map((reply) => (
                                <div key={reply.id} className={cn("flex gap-4", reply.is_admin_reply ? "flex-row-reverse" : "")}>
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 border text-xs font-bold shadow-sm",
                                        reply.is_admin_reply ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-200 text-gray-500"
                                    )}>
                                        {reply.is_admin_reply ? <Shield className="h-4 w-4" /> : (ticket.user?.first_name?.charAt(0) || "U")}
                                    </div>
                                    <div className={cn("flex-1 space-y-1.5 flex flex-col", reply.is_admin_reply ? "items-end" : "items-start")}>
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="text-xs font-bold text-gray-900">
                                                {reply.is_admin_reply ? "OPSlyHR Admin" : `${ticket.user?.first_name} ${ticket.user?.last_name}`}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <div className={cn("px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm max-w-[80%] whitespace-pre-wrap",
                                            reply.is_admin_reply ? "bg-brand-primary text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
                                        )}>
                                            {reply.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Reply Composer */}
                    <div className="shrink-0 p-6 bg-white border-t border-gray-200">
                        <form onSubmit={handleSendReply} className="max-w-4xl mx-auto w-full relative">
                            <Textarea 
                                placeholder="Type your reply... (Enter to send, Shift+Enter for new line)"
                                className="min-h-[120px] pb-14 pr-4 bg-gray-50/50 border-gray-200 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary rounded-xl resize-none text-[14px]"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendReply();
                                    }
                                }}
                            />
                            <div className="absolute right-3 bottom-3 flex items-center gap-2">
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg">
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-gray-900 text-white hover:bg-gray-800 h-9 px-4 gap-2 rounded-lg"
                                    disabled={!replyText.trim() || sending}
                                >
                                    {sending ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                    Send Reply
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Panel - Metadata & Context */}
                <div className="w-[380px] shrink-0 flex flex-col bg-gray-50/50 overflow-y-auto border-l border-gray-200">
                    <div className="p-6 space-y-6">
                        
                        {/* User Context */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">User Context</h3>
                                <Link to={`/admin/talents/${ticket.user_id}`} className="text-[10px] font-bold text-brand-primary hover:underline flex items-center gap-1">
                                    PROFILE <ExternalLink className="h-2.5 w-2.5" />
                                </Link>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm">
                                        {ticket.user?.first_name?.charAt(0) || "U"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {ticket.user?.first_name} {ticket.user?.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{ticket.user?.email}</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center justify-between text-[13px] p-2 bg-gray-50 rounded-lg border border-gray-100">
                                        <span className="text-gray-500">User ID</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-[11px] text-gray-400">...{ticket.user_id.slice(-8)}</span>
                                            <button onClick={copyUserId} className="text-gray-400 hover:text-gray-600 transition-colors">
                                                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full h-9 text-[13px] bg-white hover:bg-gray-50 border-gray-200 text-gray-700 shadow-none justify-start px-3">
                                        <FileText className="h-4 w-4 mr-2.5 text-gray-400" />
                                        View Active Contracts
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Ticket Control */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ticket Control</h3>
                            </div>
                            <div className="p-5 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'open', label: 'Open', color: 'bg-blue-50 text-blue-700' },
                                            { id: 'in_progress', label: 'In Progress', color: 'bg-amber-50 text-amber-700' },
                                            { id: 'resolved', label: 'Resolved', color: 'bg-emerald-50 text-emerald-700' },
                                            { id: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-600' }
                                        ].map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => setStatusUpdate(s.id as TicketStatus)}
                                                className={cn(
                                                    "px-3 py-2 text-[12px] font-medium rounded-lg border transition-all flex items-center justify-center",
                                                    statusUpdate === s.id 
                                                        ? `${s.color} border-current ring-1 ring-current`
                                                        : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                                                )}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Internal Notes</label>
                                    <Textarea 
                                        className="min-h-[100px] text-[13px] bg-gray-50/30 border-gray-200 rounded-xl resize-none"
                                        placeholder="Admin-only notes..."
                                        value={internalNotes}
                                        onChange={(e) => setInternalNotes(e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-400 italic">Not visible to user.</p>
                                </div>

                                <Button 
                                    className="w-full bg-gray-900 text-white hover:bg-gray-800 h-10 shadow-sm font-medium"
                                    onClick={handleUpdateMetadata}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>

                        {/* Audit Details */}
                        <div className="px-1 space-y-3">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-400 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Created</span>
                                <span className="text-gray-600 font-medium">{format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-400 flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> Last Activity</span>
                                <span className="text-gray-600 font-medium">{formatDistanceToNow(new Date(ticket.updated_at || ticket.created_at), { addSuffix: true })}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-400 flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Assigned To</span>
                                <span className="text-gray-600 font-medium italic">Unassigned</span>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button 
                                variant="ghost" 
                                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 text-xs gap-2 h-9 border border-transparent hover:border-red-100"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Ticket
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSupportDetail;
