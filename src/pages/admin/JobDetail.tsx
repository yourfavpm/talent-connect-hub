import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, Calendar, MapPin, DollarSign, Users, CheckCircle, XCircle, Timer, FileText, Globe, Clock, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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

    // Sheet State
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [actionType, setActionType] = useState<'interview' | 'offer' | 'details' | null>(null);

    // Form State
    const [interviewDate, setInterviewDate] = useState("");
    const [interviewLink, setInterviewLink] = useState("");
    const [offerRate, setOfferRate] = useState("");
    const [offerHours, setOfferHours] = useState("");
    const [offerStartDate, setOfferStartDate] = useState("");

    // Fetch Job
    const { data: job, isLoading: jobLoading } = useQuery({
        queryKey: ['job', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('jobs')
                .select('*, client:clients(*)')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!id
    });

    // Fetch Applications
    const { data: applications, isLoading: appsLoading } = useQuery({
        queryKey: ['job_applications', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('job_applications')
                .select('*, talent:talents(*)')
                .eq('job_id', id);
            if (error) throw error;
            return data;
        },
        enabled: !!id
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ appId, status }: { appId: string, status: string }) => {
            const { error } = await supabase
                .from('job_applications')
                .update({ status })
                .eq('id', appId);
            if (error) throw error;

            // Notify Talent
            await supabase.from('notifications').insert({
                user_id: applications?.find(a => a.id === appId)?.talent?.user_id,
                title: "Application Update",
                message: `Your application status has been updated to ${status.replace('_', ' ')}.`,
                type: 'job_application',
                action_url: `/talent/jobs/${id}`
            });

            // Notify Client if Shortlisted
            if (status === 'shortlisted' && job?.client?.user_id) {
                await supabase.from('notifications').insert({
                    user_id: job.client.user_id,
                    title: "Candidate Shortlisted",
                    message: `A candidate has been shortlisted for your job "${job.title}".`,
                    type: 'job_update',
                    action_url: `/client/jobs/${id}`
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job_applications', id] });
            toast({ title: "Updated", description: "Application status updated" });
            setSelectedApp(null);
            setActionType(null);
        }
    });

    const createOfferMutation = useMutation({
        mutationFn: async () => {
            if (!selectedApp || !job || !user) return;

            // 1. Create Offer
            const { error: offerError } = await supabase.from('offers').insert({
                job_id: job.id,
                client_id: job.client_id,
                talent_id: selectedApp.talent_id,
                role_title: job.title,
                hourly_rate: parseFloat(offerRate),
                weekly_hours: parseFloat(offerHours),
                start_date: offerStartDate,
                status: 'pending',
                created_by: user.id
            });
            if (offerError) throw offerError;

            // 2. Update Application
            const { error: appError } = await supabase
                .from('job_applications')
                .update({ status: 'offer_sent' })
                .eq('id', selectedApp.id);
            if (appError) throw appError;

            // 3. Notify Talent
            await supabase.from('notifications').insert({
                user_id: selectedApp.talent.user_id,
                title: "Offer Received",
                message: `You have received an offer for ${job.title}!`,
                type: 'offer',
                action_url: `/talent/offers`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job_applications', id] });
            toast({ title: "Offer Created", description: "Offer sent to talent successfully." });
            setSelectedApp(null);
            setActionType(null);
        },
        onError: (e: any) => {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    });

    const scheduleInterviewMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('job_applications')
                .update({ status: 'interview_scheduled' })
                .eq('id', selectedApp.id);
            if (error) throw error;

            // Notify Talent
            await supabase.from('notifications').insert({
                user_id: selectedApp.talent.user_id,
                title: "Interview Scheduled",
                message: `Interview scheduled for ${new Date(interviewDate).toLocaleString()} via ${interviewLink}`,
                type: 'interview',
                action_url: `/talent/messages`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job_applications', id] });
            toast({ title: "Scheduled", description: "Interview scheduled & notified." });
            setSelectedApp(null);
            setActionType(null);
        }
    });

    if (jobLoading || appsLoading) return <div className="p-8 text-center">Loading job details...</div>;
    if (!job) return <div className="p-8 text-center">Job not found</div>;

    const openAction = (app: any, type: 'interview' | 'offer' | 'details') => {
        setSelectedApp(app);
        setActionType(type);
        setInterviewDate("");
        setInterviewLink("");
        setOfferRate(job.budget_max?.toString() || "");
        setOfferHours(job.weekly_hours?.toString() || "40");
        setOfferStartDate(job.start_date || "");
    };

    const getCurrencySymbol = (code: string) => {
        return CURRENCIES.find(c => c.value === code)?.symbol || "$";
    };

    // Split applications
    const shortlistedApps = applications?.filter((a: any) => ['shortlisted', 'interview_requested', 'interview_scheduled', 'offer_initiated', 'offer_sent', 'hired'].includes(a.status));
    const pendingApps = applications?.filter((a: any) => !['shortlisted', 'interview_requested', 'interview_scheduled', 'offer_initiated', 'offer_sent', 'hired', 'rejected'].includes(a.status));
    // Note: Rejected are separate or included? I'll exclude rejected from strict "Applications" if they are done. 
    // Or maybe "pending" = applied. 
    // User said "applications is for when a talent applies".
    // I will include 'pending', 'applied' (if applicable), 'rejected' (maybe not). 
    // Let's just include "NOT shortlisted or beyond" for Applications tab.

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/admin/jobs"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">{job.title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Briefcase className="h-4 w-4" />
                        <span>{job.client?.company_name || 'Client'}</span>
                        <span className="mx-2">•</span>
                        <Badge variant={job.status === 'published' ? 'default' : 'secondary'}>{job.status}</Badge>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="applications">Applications ({pendingApps?.length || 0})</TabsTrigger>
                    <TabsTrigger value="shortlist">Shortlist ({shortlistedApps?.length || 0})</TabsTrigger>
                    <TabsTrigger value="sourcing">Sourcing</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview">
                    <Card>
                        <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
                        <CardContent className="space-y-8">
                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-muted/20 rounded-lg">
                                <div>
                                    <span className="text-muted-foreground text-sm flex items-center gap-1 mb-1">
                                        <Briefcase className="h-3 w-3" /> Service Model
                                    </span>
                                    <span className="font-medium block">
                                        {SERVICE_MODELS.find(m => m.value === job.service_model)?.label || job.service_model}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-sm flex items-center gap-1 mb-1">
                                        <Globe className="h-3 w-3" /> Work Mode
                                    </span>
                                    <span className="font-medium block capitalize">{job.work_mode}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-sm flex items-center gap-1 mb-1">
                                        <DollarSign className="h-3 w-3" /> Budget
                                    </span>
                                    <span className="font-medium block">
                                        {getCurrencySymbol(job.preferred_currency)}{job.budget_min} - {getCurrencySymbol(job.preferred_currency)}{job.budget_max}
                                        <span className="text-muted-foreground text-xs ml-1">/{job.salary_type}</span>
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-sm flex items-center gap-1 mb-1">
                                        <Calendar className="h-3 w-3" /> Duration
                                    </span>
                                    <span className="font-medium block">{job.duration || "Ongoing"}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-sm flex items-center gap-1 mb-1">
                                        <Clock className="h-3 w-3" /> Weekly Hours
                                    </span>
                                    <span className="font-medium block">{job.weekly_hours || 40}h</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-sm flex items-center gap-1 mb-1">
                                        <MapPin className="h-3 w-3" /> Location
                                    </span>
                                    <span className="font-medium block">{job.location || "Remote"}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-sm flex items-center gap-1 mb-1">
                                        <UserCheck className="h-3 w-3" /> Experience
                                    </span>
                                    <span className="font-medium block">{job.experience_required}+ Years</span>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div>
                                <h3 className="font-semibold mb-2">Responsibilities</h3>
                                <div className="prose max-w-none whitespace-pre-line text-sm text-foreground/80">
                                    {job.responsibilities}
                                </div>
                            </div>

                            {/* Skills */}
                            {job.required_skills && job.required_skills.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2">Required Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {job.required_skills.map((skill: string) => (
                                            <Badge key={skill} variant="secondary">{skill}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Special Notes */}
                            {job.special_notes && (
                                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                                    <h3 className="font-semibold mb-1 text-primary">Special Notes</h3>
                                    <p className="text-sm text-muted-foreground">{job.special_notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* APPLICATIONS TAB */}
                <TabsContent value="applications">
                    <Card>
                        <CardHeader><CardTitle>Direct Applications</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pendingApps?.map((app: any) => (
                                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src={app.talent?.avatar_url} />
                                                <AvatarFallback>{app.talent?.first_name?.[0]}{app.talent?.last_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-lg">{app.talent?.first_name} {app.talent?.last_name}</h4>
                                                    <Link to={`/admin/talents/${app.talent?.id}`} className="text-xs text-primary hover:underline">View Profile</Link>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{app.talent?.primary_role}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">Applied: {new Date(app.created_at).toLocaleDateString()}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">{app.status.replace(/_/g, ' ')}</Badge>
                                            {/* Shortlist Action */}
                                            <Button size="sm" variant="outline" className="text-green-600" onClick={() => updateStatusMutation.mutate({ appId: app.id, status: 'shortlisted' })}>
                                                Shortlist
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => updateStatusMutation.mutate({ appId: app.id, status: 'rejected' })}>
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {pendingApps?.length === 0 && <div className="text-center py-8 text-muted-foreground">No pending applications.</div>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SHORTLIST TAB */}
                <TabsContent value="shortlist">
                    <Card>
                        <CardHeader><CardTitle>Shortlisted Candidates</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {shortlistedApps?.map((app: any) => (
                                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src={app.talent?.avatar_url} />
                                                <AvatarFallback>{app.talent?.first_name?.[0]}{app.talent?.last_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-lg">{app.talent?.first_name} {app.talent?.last_name}</h4>
                                                    <Link to={`/admin/talents/${app.talent?.id}`} className="text-xs text-primary hover:underline">View Profile</Link>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{app.talent?.primary_role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={app.status.includes('hired') ? 'default' : 'secondary'}>
                                                {app.status.replace(/_/g, ' ')}
                                            </Badge>

                                            {app.status === 'shortlisted' && (
                                                <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ appId: app.id, status: 'interview_requested' })}>
                                                    Request Interview
                                                </Button>
                                            )}

                                            {app.status === 'interview_requested' && (
                                                <Button size="sm" onClick={() => openAction(app, 'interview')}>
                                                    Schedule Interview
                                                </Button>
                                            )}

                                            {(app.status === 'interview_scheduled' || app.status === 'offer_initiated') && (
                                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => openAction(app, 'offer')}>
                                                    Create Offer
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {shortlistedApps?.length === 0 && <div className="text-center py-8 text-muted-foreground">No shortlisted candidates yet.</div>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sourcing" className="space-y-4">
                    <BrowseTalentsList jobId={id!} jobStatus={job.status} />
                </TabsContent>
            </Tabs>

            {/* ACTION SHEET */}
            <Sheet open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
                <SheetContent className="sm:max-w-xl">
                    <SheetHeader>
                        <SheetTitle>
                            {actionType === 'interview' && "Schedule Interview"}
                            {actionType === 'offer' && "Create Offer"}
                        </SheetTitle>
                        <SheetDescription>
                            {actionType === 'interview' && `Schedule an interview for ${selectedApp?.talent?.first_name}.`}
                            {actionType === 'offer' && `Draft a contract offer for ${selectedApp?.talent?.first_name}.`}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="py-6 space-y-6">
                        {/* INTERVIEW FORM */}
                        {actionType === 'interview' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Date & Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={interviewDate}
                                        onChange={(e) => setInterviewDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Meeting Link</Label>
                                    <Input
                                        placeholder="Zoom / Google Meet URL"
                                        value={interviewLink}
                                        onChange={(e) => setInterviewLink(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* OFFER FORM */}
                        {actionType === 'offer' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Hourly Rate ($)</Label>
                                        <Input
                                            type="number"
                                            value={offerRate}
                                            onChange={(e) => setOfferRate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Weekly Hours</Label>
                                        <Input
                                            type="number"
                                            value={offerHours}
                                            onChange={(e) => setOfferHours(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={offerStartDate}
                                        onChange={(e) => setOfferStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
                                    This will generate a contract offer and notify the talent.
                                </div>
                            </div>
                        )}
                    </div>

                    <SheetFooter>
                        <Button variant="outline" onClick={() => setSelectedApp(null)}>Cancel</Button>
                        {actionType === 'interview' && (
                            <Button onClick={() => scheduleInterviewMutation.mutate()} disabled={scheduleInterviewMutation.isPending}>
                                {scheduleInterviewMutation.isPending ? "Scheduling..." : "Send Invitation"}
                            </Button>
                        )}
                        {actionType === 'offer' && (
                            <Button onClick={() => createOfferMutation.mutate()} disabled={createOfferMutation.isPending}>
                                {createOfferMutation.isPending ? "Creating..." : "Send Offer"}
                            </Button>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default AdminJobDetail;
