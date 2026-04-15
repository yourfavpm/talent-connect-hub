import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  ChevronRight,
  LifeBuoy
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Ticket {
  id: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

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

const TalentSupport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredTickets = tickets.filter((ticket) =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 w-full mx-auto p-4 md:p-8">
        <div className="flex justify-between">
           <div className="h-8 w-48 bg-gray-100 animate-pulse rounded" />
           <div className="h-10 w-32 bg-gray-100 animate-pulse rounded" />
        </div>
        <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-xl mt-4" />
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full animate-fade-in pb-20 p-4 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Support</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your helpdesk tickets and requests.</p>
        </div>
        <Button onClick={() => navigate("/talent/support/new")} className="bg-brand-primary text-white hover:bg-brand-primary/90 shadow-sm shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Ticket List Area */}
      <div className="space-y-4">
         
         {/* Search Filter */}
         <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
               placeholder="Search tickets by subject or ID..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9 bg-white border-gray-200 shadow-sm"
            />
         </div>

         {/* Tickets Table */}
         <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
            {filteredTickets.length === 0 ? (
               <div className="py-16 text-center bg-gray-50/50">
                  <LifeBuoy className="h-8 w-8 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-900">No support tickets yet.</p>
                  <p className="text-sm text-gray-500 mt-1">When you create a ticket, it will appear here.</p>
               </div>
            ) : (
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50/80 border-b border-gray-200">
                        <tr className="text-gray-500 font-medium">
                           <th className="px-5 py-3 font-medium w-24">Ticket ID</th>
                           <th className="px-5 py-3 font-medium">Subject</th>
                           <th className="px-5 py-3 font-medium">Category</th>
                           <th className="px-5 py-3 font-medium">Priority</th>
                           <th className="px-5 py-3 font-medium">Status</th>
                           <th className="px-5 py-3 font-medium whitespace-nowrap">Last Updated</th>
                           <th className="px-5 py-3 w-10"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {filteredTickets.map(ticket => {
                           const status = statusConfig[ticket.status] || statusConfig.open;
                           const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
                           return (
                              <tr 
                                 key={ticket.id} 
                                 onClick={() => navigate(`/talent/support/${ticket.id}`)}
                                 className="hover:bg-gray-50/50 cursor-pointer transition-colors group"
                              >
                                 <td className="px-5 py-4 whitespace-nowrap">
                                    <span className="font-mono text-xs text-gray-500">{ticket.id.slice(0, 8).toUpperCase()}</span>
                                 </td>
                                 <td className="px-5 py-4 min-w-[200px]">
                                    <p className="font-medium text-gray-900 group-hover:text-brand-primary transition-colors line-clamp-1">{ticket.subject}</p>
                                 </td>
                                 <td className="px-5 py-4 whitespace-nowrap">
                                    <span className="text-gray-600">{categoryLabels[ticket.category] || ticket.category}</span>
                                 </td>
                                 <td className="px-5 py-4 whitespace-nowrap">
                                    <Badge variant="secondary" className={`font-medium px-2 py-0.5 text-xs rounded shadow-none ${priority.color}`}>
                                       {priority.label}
                                    </Badge>
                                 </td>
                                 <td className="px-5 py-4 whitespace-nowrap">
                                    <Badge variant="outline" className={`font-medium px-2 py-0.5 text-xs rounded shadow-none ${status.color}`}>
                                       {status.label}
                                    </Badge>
                                 </td>
                                 <td className="px-5 py-4 whitespace-nowrap text-gray-500 text-xs text-right">
                                    {formatDistanceToNow(new Date(ticket.updated_at || ticket.created_at), { addSuffix: true })}
                                 </td>
                                 <td className="px-5 py-4 text-right">
                                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 ml-auto" />
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            )}
         </Card>
      </div>

    </div>
  );
};

export default TalentSupport;
