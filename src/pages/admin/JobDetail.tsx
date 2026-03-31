import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, Calendar, MapPin, DollarSign, Users, CheckCircle, XCircle, FileText, Globe, Clock, UserCheck, Search, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { sendTalentApplicationShortlistedEmail, sendTalentInterviewRequestedEmail } from "@/lib/email/triggers";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrowseTalentsList } from "@/components/admin/BrowseTalentsList";

const SERVICE_MODELS = [
    { value: "full_time", label: "Full-Time Hire" },
    { value: "trial_to_hire", label: "Trial-to-Hire" },
    { value: "one_time_project", label: "One-Time Project" },
];

const CURRENCIES = [
    { value: "USD", label: "USD ($)", symbol: "$" },
    { value: "EUR", label: "EUR (€)", symbol: "€" },
    { value: "GBP", label: "GBP (£)", symbol: "£" },
    { value: "NGN", label: "NGN (₦)", symbol: "₦" },
    { value: "KES", label: "KES (KSh)", symbol: "KSh" },
    { value: "ZAR", label: "ZAR (R)", symbol: "R" },
];

const AdminJobDetail = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Sheet State (Right Panel Drawers)
    const [selectedApp, setSelectedApp] = useState<Record<string, unknown> | null>(null);
    const [actionType, setActionType] = useState<'interview' | 'offer' | 'sourcing' | null>(null);

    // Form State
    const [interviewDate, setInterviewDate] = useState("");
    const [interviewLink, setInterviewLink] = useState("");
    const [offerRate, setOfferRate] = useState("");
    const [offerHours, setOfferHours] = useState("");
    const [offerStartDate, setOfferStartDate] = useState("");
    
    // Admin Notes
    const [adminNotes, setAdminNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);

    // Fetch Job Data
    const { data: job, isLoading: jobLoading } = useQuery({
        queryKey: ['job', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('jobs')
                .select('*, client:clients(*, profiles(email))')
                .eq('id', id)
                .single();
            if (error) throw error;
            setAdminNotes((data as any).admin_notes || "");
            return data as any;
        },
        enabled: !!id
    });

    // Fetch Applications & Contracts
    const { data: applications, isLoading: appsLoading } = useQuery({
        queryKey: ['job_applications', id],
        queryFn: async () => {
            const { data, error } = await (supabase
                .from('job_applications') as any)
                .select('*, talent:talents(*, profiles(email))')
                .eq('job_id', id);
            if (error) throw error;
            return data as any[];
        },
        enabled: !!id
    });
    
    const { data: contracts, isLoading: contractsLoading } = useQuery({
        queryKey: ['job_contracts', id],
        queryFn: async () => {
            const response = await (supabase
                .from('contracts') as any)
                .select('*, talent:talents(first_name, last_name)')
                .eq('job_id', id);
            const data = response.data;
            const error = response.error;
            
            if (error && error.code !== 'PGRST116') {
               console.error("Contracts fetch error", error);
               return [];
            }
            return (data || []) as any[];
        },
        enabled: !!id
    });

    const updateJobStatusMutation = useMutation({
        mutationFn: async (status: 'published' | 'closed' | 'submitted' | 'draft' | 'under_review' | 'filled' | 'approved') => {
            const { error } = await (supabase.from('jobs') as any).update({ status }).eq('id', id);
            if (error) throw error;
            
            // Notify client if published or closed
            if (status === 'published' || status === 'closed') {
                await (supabase.from('notifications') as any).insert({
                    user_id: job?.client?.user_id,
                    title: `Job ${status === 'published' ? 'Published' : 'Closed'}`,
                    message: `Your job "${job.title}" has been ${status}.`,
                    type: 'job_update',
                    action_url: `/client/jobs/${id}`
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job', id] });
            toast({ title: "Job Updated" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const saveAdminNotes = async () => {
        setSavingNotes(true);
        try {
            await (supabase.from('jobs') as any).update({ admin_notes: adminNotes }).eq('id', id);
            toast({ title: "Notes Saved" });
            queryClient.invalidateQueries({ queryKey: ['job', id] });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSavingNotes(false);
        }
    };

    const updateAppStatusMutation = useMutation({
        mutationFn: async ({ appId, status }: { appId: string, status: string }) => {
            const { error } = await (supabase
                .from('job_applications') as any)
                .update({ status })
                .eq('id', appId);
            if (error) throw error;

            // Trigger Email if Shortlisted
            if (status === 'shortlisted') {
                try {
                    const app = applications?.find((a: any) => a.id === appId);
                    if (app?.talent?.profiles?.email) {
                        await sendTalentApplicationShortlistedEmail({
                            email: app.talent.profiles.email,
                            firstName: app.talent.first_name,
                            jobTitle: job.title
                        });
                    }
                } catch (emailErr) {
                    console.error('Failed to send shortlist email:', emailErr);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job_applications', id] });
            toast({ title: "Status Updated" });
        }
    });

    const createOfferMutation = useMutation({
        mutationFn: async () => {
            if (!selectedApp || !job || !user) return;
            const talent = (selectedApp as any).talent;
            const { error: offerError } = await (supabase.from('offers') as any).insert({
                job_id: job.id,
                client_id: job.client_id,
                talent_id: (selectedApp as any).talent_id,
                role_title: job.title,
                hourly_rate: parseFloat(offerRate),
                weekly_hours: parseFloat(offerHours),
                start_date: offerStartDate,
                status: 'pending',
                created_by: user.id
            });
            if (offerError) throw offerError;

            const { error: appError } = await (supabase
                .from('job_applications') as any)
                .update({ status: 'offer_extended' })
                .eq('id', (selectedApp as any).id);
            if (appError) throw appError;

            await (supabase.from('notifications') as any).insert({
                user_id: talent.user_id,
                title: "Offer Received",
                message: `You have received an offer for ${job.title}!`,
                type: 'offer',
                action_url: `/talent/offers`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job_applications', id] });
            toast({ title: "Offer Extended" });
            setActionType(null);
        }
    });

    const scheduleInterviewMutation = useMutation({
        mutationFn: async () => {
            const appId = (selectedApp as any).id;
            const talent = (selectedApp as any).talent;
            const { error } = await (supabase
                .from('job_applications') as any)
                .update({ status: 'interview_scheduled' }) 
                .eq('id', appId);
            if (error) throw error;
            
            // Trigger Email
            try {
                if (talent?.profiles?.email) {
                    await sendTalentInterviewRequestedEmail({
                        email: talent.profiles.email,
                        firstName: talent.first_name,
                        jobTitle: job.title,
                        clientName: job.client?.company_name || 'Client'
                    });
                }
            } catch (emailErr) {
                console.error('Failed to send interview requested email:', emailErr);
            }

            await (supabase.from('notifications') as any).insert({
                user_id: talent.user_id,
                title: "Interview Scheduled",
                message: `An interview has been scheduled for ${new Date(interviewDate).toLocaleString()} via: ${interviewLink}`,
                type: 'interview',
                action_url: `/talent/interviews`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job_applications', id] });
            toast({ title: "Interview Scheduled" });
            setActionType(null);
        }
    });

    if (jobLoading || appsLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div></div>;
    if (!job) return <div className="p-8 text-center text-gray-500">Job not found.</div>;

    const openAction = (type: 'interview' | 'offer' | 'sourcing', app?: Record<string, unknown>) => {
        setActionType(type);
        if (app) setSelectedApp(app);
        
        if (type === 'interview') {
            setInterviewDate("");
            setInterviewLink("");
        } else if (type === 'offer') {
            setOfferRate(job.budget_max?.toString() || "");
            setOfferHours(job.weekly_hours?.toString() || "40");
            setOfferStartDate(job.start_date || "");
        }
    };

    const getCurrencySymbol = (code: string) => CURRENCIES.find(c => c.value === code)?.symbol || "$";

    // Application derived arrays
    const rawApps = applications || [];
    const directApps = rawApps.filter(a => ['applied', 'submitted'].includes(a.status));
    const shortlist = rawApps.filter(a => ['shortlisted', 'interview_requested'].includes(a.status));
    const interviews = rawApps.filter(a => ['interview_scheduled', 'interview_completed'].includes(a.status));
    const offers = rawApps.filter(a => ['offer_extended', 'offer_accepted', 'offer_rejected'].includes(a.status));

    const styles: Record<string, string> = {
        draft: "bg-gray-100 text-gray-700",
        submitted: "bg-amber-50 text-amber-700",
        published: "bg-green-50 text-green-700",
        filled: "bg-blue-50 text-blue-700",
        closed: "bg-red-50 text-red-700",
    };

    return (
        <div className="max-w-7xl mx-auto pb-12 animate-fade-in space-y-6">
            
            {/* Top Navigation */}
            <div className="flex items-center text-sm text-gray-500 hover:text-gray-900 cursor-pointer w-fit transition-colors" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
            </div>

            {/* Split Layout Workspace */}
            <div className="grid lg:grid-cols-4 gap-8 items-start">
                
                {/* Left Panel: Job Summary & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-gray-200 shadow-sm sticky top-6">
                        <CardContent className="p-6">
                            <h1 className="text-xl font-semibold text-gray-900 leading-tight mb-2">{job.title}</h1>
                            <p className="text-sm font-medium text-gray-600 mb-4">{job.client?.company_name}</p>
                            
                            <Badge variant="outline" className={`${styles[job.status] || "bg-gray-100"} uppercase text-[10px] tracking-wider mb-6 border-transparent`}>
                                {job.status.replace("_", " ")}
                            </Badge>
                            
                            <div className="space-y-3 pt-6 border-t border-gray-100">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Actions</h3>
                                
                                {job.status === 'submitted' && (
                                    <Button className="w-full justify-start bg-green-600 hover:bg-green-700 text-white" onClick={() => updateJobStatusMutation.mutate('published')}>
                                        <CheckCircle className="h-4 w-4 mr-2" /> Approve & Publish
                                    </Button>
                                )}
                                
                                {['published', 'submitted'].includes(job.status) && (
                                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => updateJobStatusMutation.mutate('closed')}>
                                        <XCircle className="h-4 w-4 mr-2" /> Pause / Close Job
                                    </Button>
                                )}
                                
                                <Button variant="secondary" className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={() => openAction('sourcing')}>
                                    <Search className="h-4 w-4 mr-2" /> Talent Sourcing Match
                                </Button>
                            </div>

                            <div className="space-y-3 pt-6 mt-6 border-t border-gray-100">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                    Admin Notes
                                    {savingNotes && <span className="text-[10px] text-gray-400">Saving...</span>}
                                </h3>
                                <Textarea 
                                    className="text-sm min-h-[120px] bg-amber-50/30 border-amber-100 placeholder:text-amber-900/40 resize-none focus-visible:ring-amber-200" 
                                    placeholder="Internal notes, context, or hiring mandates..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    onBlur={saveAdminNotes}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Center Panel: Tabs */}
                <div className="lg:col-span-3">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start h-auto p-0 rounded-none mb-6 gap-2">
                            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium">Overview</TabsTrigger>
                            <TabsTrigger value="applicants" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium">Applicants <Badge variant="secondary" className="ml-2 bg-gray-100">{directApps.length}</Badge></TabsTrigger>
                            <TabsTrigger value="shortlist" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium">Shortlist <Badge variant="secondary" className="ml-2 bg-gray-100">{shortlist.length}</Badge></TabsTrigger>
                            <TabsTrigger value="interviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium">Interviews <Badge variant="secondary" className="ml-2 bg-gray-100">{interviews.length}</Badge></TabsTrigger>
                            <TabsTrigger value="offers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium">Offers <Badge variant="secondary" className="ml-2 bg-gray-100">{offers.length}</Badge></TabsTrigger>
                            <TabsTrigger value="contracts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium">Contracts</TabsTrigger>
                        </TabsList>

                        {/* Overview content */}
                        <TabsContent value="overview" className="space-y-6 outline-none mt-0">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="border-gray-200 shadow-sm bg-gray-50/50">
                                    <CardContent className="p-4 space-y-1">
                                        <div className="text-gray-500 mb-2"><Briefcase className="h-4 w-4" /></div>
                                        <p className="text-[10px] uppercase font-semibold text-gray-400">Model</p>
                                        <p className="text-sm font-medium text-gray-900">{SERVICE_MODELS.find(m => m.value === job.service_model)?.label || job.service_model}</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-gray-200 shadow-sm bg-gray-50/50">
                                    <CardContent className="p-4 space-y-1">
                                        <div className="text-gray-500 mb-2"><DollarSign className="h-4 w-4" /></div>
                                        <p className="text-[10px] uppercase font-semibold text-gray-400">Budget Range</p>
                                        <p className="text-sm font-medium text-gray-900">{getCurrencySymbol(job.preferred_currency)}{job.budget_min} - {getCurrencySymbol(job.preferred_currency)}{job.budget_max} <span className="text-gray-400 font-normal">/{job.salary_type}</span></p>
                                    </CardContent>
                                </Card>
                                <Card className="border-gray-200 shadow-sm bg-gray-50/50">
                                    <CardContent className="p-4 space-y-1">
                                        <div className="text-gray-500 mb-2"><Globe className="h-4 w-4" /></div>
                                        <p className="text-[10px] uppercase font-semibold text-gray-400">Location</p>
                                        <p className="text-sm font-medium text-gray-900 capitalize">{job.work_mode} {job.location && `• ${job.location}`}</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-gray-200 shadow-sm bg-gray-50/50">
                                    <CardContent className="p-4 space-y-1">
                                        <div className="text-gray-500 mb-2"><UserCheck className="h-4 w-4" /></div>
                                        <p className="text-[10px] uppercase font-semibold text-gray-400">Experience</p>
                                        <p className="text-sm font-medium text-gray-900">{job.experience_required ? `${job.experience_required}+ Years` : "Any"}</p>
                                    </CardContent>
                                </Card>
                            </div>
                            
                            <Card className="border-gray-200 shadow-sm">
                                <CardContent className="p-6">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Description & Responsibilities</h3>
                                    <div className="prose max-w-none text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                                        {job.responsibilities || "No specific details provided."}
                                    </div>
                                    
                                    {job.required_skills?.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-gray-100">
                                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Required Skills</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {job.required_skills.map((skill: string) => (
                                                    <Badge key={skill} variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {job.special_notes && (
                                        <div className="mt-8 pt-6 border-t border-gray-100">
                                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                                <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                                    <Info className="h-4 w-4" />
                                                    Client Special Notes
                                                </h3>
                                                <p className="text-sm text-blue-800">{job.special_notes}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Applicants Tab */}
                        <TabsContent value="applicants" className="outline-none mt-0">
                            <Card className="border-gray-200 shadow-sm overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {directApps.length === 0 ? (
                                        <div className="p-12 text-center text-gray-500 text-sm">No new applicants.</div>
                                    ) : directApps.map((app: any) => (
                                        <div key={app.id as string} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border border-gray-200 shadow-sm">
                                                    <AvatarImage src={app.talent?.avatar_url} />
                                                    <AvatarFallback className="bg-brand-primary/10 text-brand-primary font-medium">{app.talent?.first_name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <Link to={`/admin/talents/${app.talent?.id}`} className="font-medium text-sm text-gray-900 hover:text-brand-primary transition-colors">
                                                        {app.talent?.first_name} {app.talent?.last_name}
                                                    </Link>
                                                    <p className="text-xs text-gray-500 mt-0.5">{app.talent?.primary_role}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline" className="h-8 text-xs bg-white text-gray-600 hover:text-red-600 border-gray-200 hover:bg-red-50" onClick={() => updateAppStatusMutation.mutate({ appId: app.id, status: 'rejected' })}>
                                                    Pass
                                                </Button>
                                                <Button size="sm" className="h-8 text-xs bg-white text-blue-700 border border-blue-200 hover:bg-blue-50" onClick={() => updateAppStatusMutation.mutate({ appId: app.id, status: 'shortlisted' })}>
                                                    Move to Shortlist
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Shortlist Tab */}
                        <TabsContent value="shortlist" className="outline-none mt-0">
                            <Card className="border-gray-200 shadow-sm overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {shortlist.length === 0 ? (
                                        <div className="p-12 text-center text-gray-500 text-sm">No candidates shortlisted yet.</div>
                                    ) : shortlist.map((app: any) => (
                                        <div key={app.id as string} className="p-5 flex justify-between items-center hover:bg-gray-50">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border border-gray-200 shadow-sm">
                                                    <AvatarImage src={app.talent?.avatar_url} />
                                                    <AvatarFallback className="bg-brand-primary/10 text-brand-primary font-medium">{app.talent?.first_name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <Link to={`/admin/talents/${app.talent?.id}`} className="font-medium text-sm text-gray-900 hover:text-brand-primary transition-colors">
                                                        {app.talent?.first_name} {app.talent?.last_name}
                                                    </Link>
                                                    <p className="text-xs text-gray-500 mt-0.5">{app.talent?.primary_role}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-medium">Shortlisted</Badge>
                                                <Button size="sm" className="h-8 text-xs bg-purple-600 hover:bg-purple-700" onClick={() => openAction('interview', app)}>
                                                    Request Interview
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Interviews Tab */}
                        <TabsContent value="interviews" className="outline-none mt-0">
                            <Card className="border-gray-200 shadow-sm overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {interviews.length === 0 ? (
                                        <div className="p-12 text-center text-gray-500 text-sm">No interviews scheduled.</div>
                                    ) : interviews.map((app: any) => (
                                        <div key={app.id as string} className="p-5 flex justify-between items-center hover:bg-gray-50">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border border-gray-200 shadow-sm">
                                                    <AvatarImage src={app.talent?.avatar_url} />
                                                    <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">{app.talent?.first_name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <Link to={`/admin/talents/${app.talent?.id}`} className="font-medium text-sm text-gray-900 hover:text-brand-primary transition-colors">
                                                        {app.talent?.first_name} {app.talent?.last_name}
                                                    </Link>
                                                    <Badge variant="outline" className="ml-2 text-[10px] bg-purple-50 text-purple-700 border-purple-200">Interviewing</Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => updateAppStatusMutation.mutate({ appId: app.id, status: 'rejected' })}>
                                                    Reject
                                                </Button>
                                                <Button size="sm" className="h-8 text-xs bg-brand-primary hover:opacity-90" onClick={() => openAction('offer', app)}>
                                                    Draft Offer
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Offers Tab */}
                        <TabsContent value="offers" className="outline-none mt-0">
                            <Card className="border-gray-200 shadow-sm overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {offers.length === 0 ? (
                                        <div className="p-12 text-center text-gray-500 text-sm">No offers extended yet.</div>
                                    ) : offers.map((app: any) => (
                                        <div key={app.id as string} className="p-5 flex justify-between items-center hover:bg-gray-50">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border border-gray-200 shadow-sm">
                                                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">{app.talent?.first_name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">
                                                        {app.talent?.first_name} {app.talent?.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Offer {app.status.replace('offer_', '')}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50 shadow-none uppercase text-[10px] tracking-wider font-semibold">
                                                    {app.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </TabsContent>

                        {/* Contracts Tab */}
                        <TabsContent value="contracts" className="outline-none mt-0">
                            <Card className="border-gray-200 shadow-sm overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {!contracts || contracts.length === 0 ? (
                                        <div className="p-12 text-center text-gray-500 text-sm">No contracts generated for this job yet.</div>
                                    ) : contracts.map((c: any) => (
                                        <div key={c.id as string} className="p-5 flex justify-between items-center hover:bg-gray-50">
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">Contract #{c.id.slice(0, 8)}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{c.talent?.first_name} {c.talent?.last_name}</p>
                                            </div>
                                            <Badge variant="outline" className="uppercase text-[10px] tracking-wider">{c.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Context Actions via Sheet */}
            <Sheet open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
                <SheetContent className="sm:max-w-xl p-0 flex flex-col h-full bg-white border-none shadow-2xl">
                    <SheetHeader className="p-6 border-b border-gray-100 shrink-0">
                        <SheetTitle className="text-xl text-gray-900">
                            {actionType === 'sourcing' && "Talent Sourcing Match"}
                            {actionType === 'interview' && "Schedule Interview"}
                            {actionType === 'offer' && "Draft Contract Offer"}
                        </SheetTitle>
                        <SheetDescription className="text-gray-500 mt-1">
                            {actionType === 'sourcing' && "Find and match vetted talent to this job requirement."}
                            {actionType === 'interview' && `Request availability or lock-in a time for ${(selectedApp as any)?.talent?.first_name}.`}
                            {actionType === 'offer' && `Configure standard offer terms to send to ${(selectedApp as any)?.talent?.first_name}.`}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Sourcing State */}
                        {actionType === 'sourcing' && (
                            <BrowseTalentsList jobId={id!} jobStatus={job.status} />
                        )}

                        {/* Interview Flow */}
                        {actionType === 'interview' && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-gray-700">Interview Date & Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={interviewDate}
                                        onChange={(e) => setInterviewDate(e.target.value)}
                                        className="bg-white border-gray-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-gray-700">Meeting Link (Zoom / Meet)</Label>
                                    <Input
                                        placeholder="https://zoom.us/j/..."
                                        value={interviewLink}
                                        onChange={(e) => setInterviewLink(e.target.value)}
                                        className="bg-white border-gray-200"
                                    />
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg text-sm text-purple-800 border border-purple-100">
                                    <p>Upon sending, an automated message with the calendar invite and meeting link will be dispatched to the candidate's inbox.</p>
                                </div>
                            </div>
                        )}

                        {/* Offer Flow */}
                        {actionType === 'offer' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-gray-700">Hourly Rate ($)</Label>
                                        <Input
                                            type="number"
                                            value={offerRate}
                                            onChange={(e) => setOfferRate(e.target.value)}
                                            className="bg-white border-gray-200 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-gray-700">Committed Hours / Week</Label>
                                        <Input
                                            type="number"
                                            value={offerHours}
                                            onChange={(e) => setOfferHours(e.target.value)}
                                            className="bg-white border-gray-200 font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-gray-700">Anticipated Start Date</Label>
                                    <Input
                                        type="date"
                                        value={offerStartDate}
                                        onChange={(e) => setOfferStartDate(e.target.value)}
                                        className="bg-white border-gray-200"
                                    />
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-lg text-sm text-indigo-800 border border-indigo-100">
                                    <p>The candidate will receive this offer to review. If accepted, the system will automatically draft the binding Master Service Agreement (MSA).</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <SheetFooter className="p-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
                        <Button variant="outline" className="bg-white" onClick={() => setActionType(null)}>Cancel</Button>
                        
                        {actionType === 'interview' && (
                            <Button onClick={() => scheduleInterviewMutation.mutate()} disabled={scheduleInterviewMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                                {scheduleInterviewMutation.isPending ? "Scheduling..." : "Send Invitation"}
                            </Button>
                        )}
                        
                        {actionType === 'offer' && (
                            <Button onClick={() => createOfferMutation.mutate()} disabled={createOfferMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                                {createOfferMutation.isPending ? "Processing..." : "Generate Offer"}
                            </Button>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default AdminJobDetail;
