import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Mail, 
    Building, 
    Calendar, 
    Clock, 
    MessageSquare, 
    Phone, 
    User, 
    ArrowLeft, 
    CheckCircle2, 
    XCircle, 
    UserPlus, 
    History,
    Save,
    Loader2,
    Briefcase,
    Zap,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdminConsultationDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lead, setLead] = useState<any>(null);
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    
    // Conversion Drawer State
    const [isConverting, setIsConverting] = useState(false);
    const [clientForm, setClientForm] = useState({
        company_name: "",
        contact_name: "",
        contact_email: "",
        create_job: false
    });

    useEffect(() => {
        if (id) fetchLeadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchLeadData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from("consultations" as any)
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            setLead(data as any);
            setNotes((data as any).internal_notes || "");
            setClientForm({
                company_name: (data as any).company || "",
                contact_name: `${(data as any).first_name} ${(data as any).last_name}`,
                contact_email: (data as any).email,
                create_job: false
            });
        } catch (error: any) {
            toast.error("Error fetching lead: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            setSaving(true);
            const { error } = await supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from("consultations" as any)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .update({ lead_status: newStatus } as any)
                .eq("id", id);

            if (error) throw error;
            toast.success(`Lead marked as ${newStatus}`);
            fetchLeadData();
        } catch (error: any) {
            toast.error("Status update failed: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotes = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from("consultations" as any)
                .update({ internal_notes: notes } as any)
                .eq("id", id);

            if (error) throw error;
            toast.success("Notes saved");
        } catch (error: any) {
            toast.error("Failed to save notes");
        } finally {
            setSaving(false);
        }
    };

    const handleConvertLead = async () => {
        try {
            setIsConverting(true);
            
            // 1. Create Client
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: client, error: clientErr } = await (supabase.from('clients' as any).insert({
                company_name: clientForm.company_name,
                primary_contact_name: clientForm.contact_name,
                primary_contact_email: clientForm.contact_email,
                status: 'active'
            } as any).select().single() as any);

            if (clientErr) throw clientErr;

            // 2. Update Consultation
            await supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from('consultations' as any)
                .update({ 
                    lead_status: 'converted',
                    converted_client_id: client.id 
                } as any)
                .eq('id', id);

            toast.success("Lead converted to client!");
            
            if (clientForm.create_job) {
                navigate(`/admin/clients/${(client as any).id}?action=create_job`);
            } else {
                navigate(`/admin/clients/${(client as any).id}`);
            }

        } catch (error: any) {
            toast.error("Conversion failed: " + error.message);
        } finally {
            setIsConverting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const base = "shadow-none border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider";
        switch (status) {
            case "new": return <Badge className={cn(base, "bg-blue-50 text-blue-700")}>New Lead</Badge>;
            case "contacted": return <Badge className={cn(base, "bg-amber-50 text-amber-700")}>Contacted</Badge>;
            case "converted": return <Badge className={cn(base, "bg-emerald-50 text-emerald-700")}>Converted</Badge>;
            case "closed": return <Badge className={cn(base, "bg-gray-100 text-gray-600")}>Closed</Badge>;
            default: return <Badge variant="outline" className={base}>{status}</Badge>;
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-gray-300">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest italic">Hydrating Lead Intelligence...</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in bg-white p-6 -m-6 rounded-lg min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/admin/consultations")} className="h-8 w-8 text-gray-400">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold tracking-tight text-gray-900">{lead.first_name} {lead.last_name}</h1>
                            {getStatusBadge(lead.lead_status)}
                        </div>
                        <p className="text-[12px] text-gray-500 font-medium mt-0.5">{lead.email} • {lead.company || "Individual"}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {lead.lead_status !== 'closed' && lead.lead_status !== 'converted' && (
                        <>
                            {lead.lead_status === 'new' && (
                                <Button size="sm" variant="outline" className="h-9 border-gray-200 text-gray-600 font-bold" onClick={() => handleUpdateStatus('contacted')}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Contacted
                                </Button>
                            )}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-0 shadow-sm">
                                        <Zap className="h-4 w-4 mr-2" /> Convert to Client
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="sm:max-w-md p-0 flex flex-col h-full border-l border-gray-100">
                                    <SheetHeader className="p-6 border-b border-gray-50 bg-gray-50/50 text-gray-900">
                                        <SheetTitle className="text-xl font-bold">Convert to Client</SheetTitle>
                                        <SheetDescription className="text-sm">Establish a production client account from this lead.</SheetDescription>
                                    </SheetHeader>
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-900">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Company Account Name</Label>
                                            <Input 
                                                value={clientForm.company_name} 
                                                onChange={(e) => setClientForm({...clientForm, company_name: e.target.value})}
                                                className="border-gray-200"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Primary Contact</Label>
                                            <Input 
                                                value={clientForm.contact_name} 
                                                onChange={(e) => setClientForm({...clientForm, contact_name: e.target.value})}
                                                className="border-gray-200"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Billing Email</Label>
                                            <Input 
                                                value={clientForm.contact_email} 
                                                onChange={(e) => setClientForm({...clientForm, contact_email: e.target.value})}
                                                className="border-gray-200"
                                            />
                                        </div>
                                        <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-[13px] font-bold text-blue-900">Quick Job Setup</p>
                                                <p className="text-[11px] text-blue-700 font-medium">Redirect to create a job immediately after conversion.</p>
                                            </div>
                                            <Button 
                                                variant={clientForm.create_job ? "default" : "outline"}
                                                size="sm"
                                                className={cn("h-8 px-3 font-bold text-xs uppercase transition-all", clientForm.create_job ? "bg-blue-600 border-0" : "border-blue-200 text-blue-600")}
                                                onClick={() => setClientForm({...clientForm, create_job: !clientForm.create_job})}
                                            >
                                                {clientForm.create_job ? "Enabled" : "Off"}
                                            </Button>
                                        </div>
                                    </div>
                                    <SheetFooter className="p-6 border-t border-gray-100 bg-gray-50/50">
                                        <Button 
                                            className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-bold border-0" 
                                            onClick={handleConvertLead}
                                            disabled={isConverting}
                                        >
                                            {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Complete Conversion
                                        </Button>
                                    </SheetFooter>
                                </SheetContent>
                            </Sheet>
                            <Button size="sm" variant="outline" className="h-9 border-gray-200 text-red-600 font-bold hover:bg-red-50 hover:text-red-700" onClick={() => handleUpdateStatus('closed')}>
                                <XCircle className="h-4 w-4 mr-2" /> Close Lead
                            </Button>
                        </>
                    )}
                    {lead.lead_status === 'converted' && lead.converted_client_id && (
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-9 bg-emerald-50 text-emerald-700 font-bold border-emerald-100"
                            onClick={() => navigate(`/admin/clients/${lead.converted_client_id}`)}
                        >
                            View Client <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel - Lead Context */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Contact Profile */}
                    <Card className="shadow-none border-gray-100 overflow-hidden">
                        <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Information</span>
                            <User className="h-3.5 w-3.5 text-gray-300" />
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                    <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Full Name</Label>
                                    <p className="text-sm font-bold text-gray-900">{lead.first_name} {lead.last_name}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Email Address</Label>
                                    <p className="text-sm font-medium text-gray-600 flex items-center gap-2 group cursor-pointer hover:text-gray-900 transition-colors">
                                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                                        {lead.email}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                    <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Company</Label>
                                    <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Building className="h-3.5 w-3.5 text-gray-400" />
                                        {lead.company || "Not Provided"}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Phone Number</Label>
                                    <p className="text-sm font-medium text-gray-500 italic">Not Provided</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Request intelligence */}
                    <Card className="shadow-none border-gray-100 overflow-hidden">
                        <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex items-center justify-between text-gray-900">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Consultation Request Details</span>
                            <Briefcase className="h-3.5 w-3.5 text-gray-300" />
                        </div>
                        <CardContent className="p-6 space-y-6 text-gray-900">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Core Objective</p>
                                    <p className="text-sm font-bold capitalize">{lead.objective || 'General Inquiry'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Preferred Date</p>
                                    <div className="flex items-center gap-2 text-sm font-bold">
                                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                        {lead.preferred_date ? format(new Date(lead.preferred_date), "MMM d, yyyy") : 'Flexible'}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Preferred Time</p>
                                    <div className="flex items-center gap-2 text-sm font-bold">
                                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                                        {lead.preferred_time || 'Any Time'}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50/30 rounded-xl p-5 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Submission Details</p>
                                <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap italic">
                                    {lead.details || "No project details provided."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Timeline */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <History className="h-4 w-4 text-gray-400" />
                            <h3 className="text-sm font-bold text-gray-900">Lead Activity Timeline</h3>
                        </div>
                        <div className="space-y-4 pl-3">
                            <div className="relative border-l-2 border-emerald-100 pl-6 pb-2">
                                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                                <div className="flex flex-col">
                                    <span className="text-[12px] font-bold text-gray-900">Initial Request Submitted</span>
                                    <span className="text-[10px] text-gray-500 font-mono uppercase leading-none mt-1">
                                        {format(new Date(lead.created_at), "MMM d, yyyy HH:mm")}
                                    </span>
                                </div>
                            </div>
                            {lead.lead_status !== 'new' && (
                                <div className="relative border-l-2 border-blue-100 pl-6 pb-2 last:border-0">
                                    <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-bold text-gray-900">Lead Transition: {lead.lead_status}</span>
                                        <span className="text-[10px] text-gray-500 font-mono italic mt-1">Last activity recorded today</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Sticky Admin Actions */}
                <div className="space-y-6">
                    <div className="sticky top-6">
                        <Card className="shadow-sm border-gray-200 overflow-hidden">
                            <div className="bg-gray-900 text-white px-5 py-3 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Admin Intelligence</span>
                                <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                            <CardContent className="p-5 space-y-6 text-gray-900">
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Status Lifecycle</Label>
                                    <Select value={lead.lead_status} onValueChange={handleUpdateStatus}>
                                        <SelectTrigger className="h-10 border-gray-200 font-bold text-gray-900">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">New Lead</SelectItem>
                                            <SelectItem value="contacted">Contacted</SelectItem>
                                            <SelectItem value="converted">Converted</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Internal Notes</Label>
                                        {saving && <span className="text-[10px] text-gray-400 italic">Syncing...</span>}
                                    </div>
                                    <Textarea 
                                        className="min-h-[200px] text-sm bg-gray-50 border-gray-100 resize-none font-medium text-gray-800 placeholder:text-gray-400 focus-visible:ring-gray-200"
                                        placeholder="Add qualification notes, call summaries, or follow-up plans..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                    <Button 
                                        disabled={saving || notes === lead.internal_notes}
                                        onClick={handleSaveNotes}
                                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold h-10 border-0"
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        Save Observations
                                    </Button>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex flex-col gap-2">
                                        <p className="text-[11px] font-bold text-orange-900 uppercase tracking-tighter">Conversion Readiness</p>
                                        <p className="text-[12px] text-orange-700 font-medium leading-snug">
                                            Ensure lead has been qualified via call or email before converting to production client.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminConsultationDetail;
