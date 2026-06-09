import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  ArrowLeft, 
  MessageSquare, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Clock, 
  CreditCard,
  FileText,
  Users,
  Zap
} from "lucide-react";

export default function AdminClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch core client profile
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Fetch related sub-data in parallel
      if (clientData) {
        const [jobsRes, contractsRes, invoicesRes, supportRes, membersRes, subRes] = await Promise.all([
          supabase.from("jobs").select("*").eq("client_id", id).order("created_at", { ascending: false }),
          supabase.from("contracts").select("*, talents(first_name, last_name)").eq("client_id", id).order("created_at", { ascending: false }),
          supabase.from("invoices").select("*").eq("client_id", id).order("created_at", { ascending: false }),
          supabase.from("support_tickets").select("*").eq("user_id", clientData.user_id).order("created_at", { ascending: false }),
          supabase.from("client_members").select("*, profile:profiles(first_name, last_name, email)").eq("client_id", id).order("created_at", { ascending: true }),
          supabase.from("client_subscriptions").select("*").eq("client_id", id).single()
        ]);

        if (jobsRes.data) setJobs(jobsRes.data);
        if (contractsRes.data) setContracts(contractsRes.data);
        if (invoicesRes.data) setInvoices(invoicesRes.data);
        if (supportRes.data) setSupportTickets(supportRes.data);
        if (membersRes.data) setMembers(membersRes.data);
        if (subRes.data) setSubscription(subRes.data);
      }
    } catch (error: any) {
      console.error("Error fetching client details:", error);
      toast({ title: "Error", description: "Failed to load client details.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClientDetails();
    }
  }, [id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="py-12 text-center text-muted-foreground animate-fade-in">
        Client not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-8">
      {/* Back & Top Actions */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/clients")} className="text-gray-500 hover:text-gray-900 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to directory
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{client.company_name}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <button 
              onClick={() => copyToClipboard(client.client_id)}
              className="text-sm font-mono text-gray-500 hover:text-gray-900 transition-colors"
            >
              {client.client_id}
            </button>
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
            <Badge variant="outline" className={
                client.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200 uppercase text-[10px] tracking-wider' :
                client.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200 uppercase text-[10px] tracking-wider' :
                'bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px] tracking-wider'
              }>
              {client.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto text-sm border-gray-200 bg-white">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Client
          </Button>
          {/* We assume there's a view portal or disable feature we can add later if requested, keeping it clean for now */}
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Profile Cards */}
        <div className="lg:col-span-4 space-y-6">
          {/* Company Info */}
          <Card className="border-gray-100 shadow-sm bg-gray-50/30">
            <CardHeader className="pb-3 px-5 pt-5">
              <CardTitle className="text-sm font-semibold text-gray-900">Company Info</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Primary Contact</p>
                <p className="text-sm text-gray-900">{client.primary_contact_name || "N/A"}</p>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-900 break-all">{client.primary_contact_email}</p>
              </div>
              {client.primary_contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-900">{client.primary_contact_phone}</p>
                </div>
              )}
              {client.country && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-900">{client.country}</p>
                </div>
              )}
              {(client.industry || client.company_size) && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-600">
                    {client.industry || "Unknown industry"} &bull; {client.company_size || "Unknown size"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Summary */}
          <Card className="border-gray-100 shadow-sm bg-gray-50/30">
            <CardHeader className="pb-3 px-5 pt-5">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                Account Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-500">Date joined</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(client.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-500">Total jobs posted</span>
                <span className="text-sm font-medium text-gray-900">0</span> {/* Placeholder mapping */}
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-500">Active contracts</span>
                <span className="text-sm font-medium text-gray-900">0</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Billing Info */}
          <Card className="border-gray-100 shadow-sm bg-gray-50/30">
            <CardHeader className="pb-3 px-5 pt-5">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-400" />
                Billing Info
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {client.billing_address ? (
                <div className="text-sm text-gray-900 whitespace-pre-line">
                  {client.billing_address}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No billing address on file.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Activity Tabs */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start h-auto p-0 rounded-none overflow-x-auto flex-nowrap">
              <TabsTrigger 
                value="jobs" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-medium data-[state=active]:text-gray-900 text-gray-500"
              >
                Jobs
              </TabsTrigger>
              <TabsTrigger 
                value="contracts" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-medium data-[state=active]:text-gray-900 text-gray-500"
              >
                Contracts
              </TabsTrigger>
              <TabsTrigger 
                value="invoices" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-medium data-[state=active]:text-gray-900 text-gray-500"
              >
                Invoices
              </TabsTrigger>
              <TabsTrigger 
                value="support" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-medium data-[state=active]:text-gray-900 text-gray-500"
              >
                Support Tickets
              </TabsTrigger>
              <TabsTrigger 
                value="members" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-medium data-[state=active]:text-gray-900 text-gray-500"
              >
                Members
              </TabsTrigger>
              <TabsTrigger 
                value="subscription" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-medium data-[state=active]:text-gray-900 text-gray-500"
              >
                Subscription
              </TabsTrigger>
            </TabsList>
            
            <div className="pt-6">
              <TabsContent value="jobs" className="mt-0 outline-none">
                <Card className="border-gray-100 shadow-sm overflow-hidden">
                  {jobs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      Jobs linked to this client will appear here.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-5 py-3 font-medium">Job Title</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3 font-medium text-right font-mono">Applicants</th>
                            <th className="px-5 py-3 font-medium">Created</th>
                            <th className="px-5 py-3 w-[100px]"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {jobs.map(job => (
                            <tr key={job.id} className="hover:bg-gray-50">
                              <td className="px-5 py-3 font-medium text-gray-900">{job.title}</td>
                              <td className="px-5 py-3">
                                <Badge variant="outline" className="bg-gray-50 text-gray-600 font-normal">
                                  {job.status}
                                </Badge>
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-gray-500">-</td>
                              <td className="px-5 py-3 text-gray-500">
                                {new Date(job.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/jobs/${job.id}`)}>
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="contracts" className="mt-0 outline-none">
                <Card className="border-gray-100 shadow-sm overflow-hidden">
                  {contracts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      Active and past contracts will appear here.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-5 py-3 font-medium">Role</th>
                            <th className="px-5 py-3 font-medium">Talent</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3 font-medium">Start Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {contracts.map(contract => (
                            <tr key={contract.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/admin/contracts')}>
                              <td className="px-5 py-3 font-medium text-gray-900">{contract.role_title}</td>
                              <td className="px-5 py-3 text-gray-600">
                                {contract.talents?.first_name} {contract.talents?.last_name}
                              </td>
                              <td className="px-5 py-3">
                                <Badge variant="outline" className={
                                  contract.status === 'active' ? 'bg-green-50 text-green-700 border-green-200 uppercase text-[10px] tracking-wider' :
                                  'bg-gray-50 text-gray-700 uppercase text-[10px] tracking-wider'
                                }>
                                  {contract.status}
                                </Badge>
                              </td>
                              <td className="px-5 py-3 text-gray-500">
                                {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : "Pending"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="invoices" className="mt-0 outline-none">
                <Card className="border-gray-100 shadow-sm overflow-hidden">
                  {invoices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      Invoices and payment history will appear here.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-5 py-3 font-medium">Invoice #</th>
                            <th className="px-5 py-3 font-medium font-mono text-right">Amount</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3 font-medium">Due Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {invoices.map(invoice => (
                            <tr key={invoice.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/admin/invoices')}>
                              <td className="px-5 py-3 font-medium text-gray-900 font-mono text-xs">{invoice.invoice_number}</td>
                              <td className="px-5 py-3 text-right font-mono text-gray-900">
                                ${invoice.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-5 py-3">
                                <Badge variant="outline" className={
                                  invoice.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200 uppercase text-[10px] tracking-wider' :
                                  invoice.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-200 uppercase text-[10px] tracking-wider' :
                                  'bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px] tracking-wider'
                                }>
                                  {invoice.status}
                                </Badge>
                              </td>
                              <td className="px-5 py-3 text-gray-500">
                                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="support" className="mt-0 outline-none">
                <Card className="border-gray-100 shadow-sm overflow-hidden">
                  {supportTickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      Support tickets filed by this client will appear here.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-5 py-3 font-medium">Subject</th>
                            <th className="px-5 py-3 font-medium text-center">Priority</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3 font-medium">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {supportTickets.map(ticket => (
                            <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/admin/support')}>
                              <td className="px-5 py-3 font-medium text-gray-900">{ticket.subject}</td>
                              <td className="px-5 py-3 text-center">
                                <Badge variant="outline" className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider font-normal">
                                  {ticket.priority}
                                </Badge>
                              </td>
                              <td className="px-5 py-3">
                                <Badge variant="outline" className={
                                  ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider' :
                                  'bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px] tracking-wider'
                                }>
                                  {ticket.status}
                                </Badge>
                              </td>
                              <td className="px-5 py-3 text-gray-500">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="members" className="mt-0 outline-none">
                <Card className="border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Workspace Members</h3>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      {members.filter(m => m.status === 'active').length + 1} Seats Used
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-5 py-3 font-medium">Name</th>
                          <th className="px-5 py-3 font-medium">Role</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                          <th className="px-5 py-3 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-gray-900">
                            <div className="font-medium">{client.primary_contact_name || "Owner"}</div>
                            <div className="text-xs text-gray-500">{client.primary_contact_email}</div>
                          </td>
                          <td className="px-5 py-3"><Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">Owner</Badge></td>
                          <td className="px-5 py-3"><Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Active</Badge></td>
                          <td className="px-5 py-3 text-gray-500">{new Date(client.created_at).toLocaleDateString()}</td>
                        </tr>
                        {members.map(member => (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3 text-gray-900">
                              <div className="font-medium">{member.profile?.first_name} {member.profile?.last_name}</div>
                              <div className="text-xs text-gray-500">{member.profile?.email}</div>
                            </td>
                            <td className="px-5 py-3 capitalize"><Badge variant="outline">{member.role}</Badge></td>
                            <td className="px-5 py-3 capitalize">
                              <Badge className={
                                member.status === 'active' ? "bg-green-100 text-green-800 border-green-200" :
                                member.status === 'invited' ? "bg-amber-100 text-amber-800 border-amber-200" :
                                "bg-red-100 text-red-800 border-red-200"
                              }>
                                {member.status}
                              </Badge>
                            </td>
                            <td className="px-5 py-3 text-gray-500">
                              {member.accepted_at ? new Date(member.accepted_at).toLocaleDateString() : 'Pending'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="subscription" className="mt-0 outline-none">
                <Card className="border-gray-100 shadow-sm">
                  <div className="p-6 max-w-2xl">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" /> Subscription Details
                    </h3>
                    
                    {subscription ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Current Plan</p>
                            <p className="text-xl font-bold capitalize text-gray-900">{subscription.plan}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Status</p>
                            <Badge className={
                              subscription.status === 'active' ? "bg-green-100 text-green-800" :
                              subscription.status === 'trialing' ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"
                            }>
                              {subscription.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Seat Limit</span>
                            <span className="font-medium">{subscription.max_team_members === -1 ? "Unlimited" : subscription.max_team_members}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Trial Ends At</span>
                            <span className="font-medium">{subscription.trial_ends_at ? new Date(subscription.trial_ends_at).toLocaleDateString() : "-"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Current Period End</span>
                            <span className="font-medium">{subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : "-"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Stripe Customer ID</span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{subscription.stripe_customer_id || "None"}</code>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Stripe Subscription ID</span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{subscription.stripe_subscription_id || "None"}</code>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 py-4">No subscription record found for this client.</div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
