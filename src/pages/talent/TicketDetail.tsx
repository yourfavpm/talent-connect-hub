import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MessageSquare, Ticket } from "lucide-react";
import SupportThread from "@/components/SupportThread";
import { formatDistanceToNow, format } from "date-fns";
import clsx from "clsx";

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", color: "bg-amber-50 text-amber-700 border-amber-200" },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed: { label: "Closed", color: "bg-gray-50 text-gray-700 border-gray-200" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-50 text-gray-700" },
  medium: { label: "Medium", color: "bg-blue-50 text-blue-700" },
  high: { label: "High", color: "bg-orange-50 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-50 text-red-700" },
};

const categoryLabels: Record<string, string> = {
  payment: "Payment",
  job: "Job",
  technical: "Technical",
  talent_issue: "Talent Issue",
  billing: "Billing",
  other: "Other",
};

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchTicket();
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="flex flex-col md:flex-row gap-6">
           <div className="flex-1 space-y-4">
              <div className="h-48 bg-gray-100 rounded-xl" />
              <div className="h-[400px] bg-gray-100 rounded-xl" />
           </div>
           <div className="w-full md:w-80 h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center">
        <Ticket className="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900">Ticket not found</h3>
        <p className="text-gray-500 mt-1 mb-6">The support ticket you are looking for does not exist or you do not have permission to view it.</p>
        <Link to="/talent/support">
          <Button variant="outline">Back to Support</Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[ticket.status] || statusConfig.open;
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-fade-in">
      
      {/* Header Breadcrumb */}
      <Link to="/talent/support" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to Support
      </Link>

      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        
        {/* Main Content (Left) */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Ticket Header & Description */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
             
             {/* Header */}
             <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                   <h1 className="text-xl font-semibold text-gray-900 tracking-tight leading-snug">{ticket.subject}</h1>
                   <Badge variant="outline" className={`shrink-0 font-medium px-2.5 py-0.5 text-xs rounded shadow-none whitespace-nowrap ${status.color}`}>
                     {status.label}
                   </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                   <span className="font-mono text-xs bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm text-gray-600">#{ticket.id.split('-')[0].toUpperCase()}</span>
                   <span>•</span>
                   <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                </div>
             </div>

             {/* Description Body */}
             <div className="p-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Original Request</h3>
                <div className="text-[15px] leading-relaxed text-gray-700 whitespace-pre-wrap">
                   {ticket.description}
                </div>
             </div>

          </div>

          {/* Thread / Conversation Component */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
             <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 shrink-0">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900 tracking-tight">Conversation Thread</h2>
             </div>
             <div className="flex-1 overflow-hidden relative">
                {/* 
                  SupportThread inherently handles scrolling and input layout. 
                  We constrain its height here so it scrolls internally rather than pushing the page down. 
                */}
                <div className="absolute inset-0 overflow-y-auto w-full h-full">
                  <SupportThread
                     ticketId={ticket.id}
                     isAdmin={false}
                     currentUserId={user?.id}
                  />
                </div>
             </div>
          </div>

        </div>

        {/* Meta Panel (Right Side) */}
        <div className="w-full md:w-80 shrink-0 space-y-6 sticky top-6">
          <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
              <CardTitle className="text-sm tracking-tight text-gray-900">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-gray-100 text-sm">
              <div className="p-5 space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</p>
                <p className="font-medium text-gray-900">{categoryLabels[ticket.category] || ticket.category}</p>
              </div>
              <div className="p-5 space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</p>
                <div>
                   <Badge variant="secondary" className={clsx("font-medium px-2 py-0.5 text-xs rounded shadow-none mt-1", priority.color)}>
                     {priority.label}
                   </Badge>
                </div>
              </div>
              <div className="p-5 space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</p>
                <p className="text-gray-900">{format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
              <div className="p-5 space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Activity</p>
                <p className="text-gray-900">{formatDistanceToNow(new Date(ticket.updated_at || ticket.created_at), { addSuffix: true })}</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default TicketDetail;
