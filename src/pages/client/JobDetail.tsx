
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, MapPin, Users, UserCheck, DollarSign, Clock, Calendar, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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

const ClientJobDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Job (Ensure ownership)
    const { data: job, isLoading: jobLoading } = useQuery({
        queryKey: ['client_job', id],
        queryFn: async () => {
            const { data: client } = await supabase.from('clients').select('id').eq('user_id', user?.id).maybeSingle();
            if (!client) throw new Error("Client not found");

            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', id)
                .eq('client_id', client.id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id && !!user?.id
    });

    // Fetch Applications (Candidates)
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
        enabled: !!id && !!user?.id
    });

    const requestInterviewMutation = useMutation({
        mutationFn: async (appId: string) => {
            const { error } = await supabase.from('job_applications').update({ status: 'interview_requested' }).eq('id', appId);
            if (error) throw error;

            // Notify Talent
            const app = applications?.find(a => a.id === appId);
            if (app?.talent?.user_id) {
                await supabase.from('notifications').insert({
                    user_id: app.talent.user_id,
                    title: "Interview Request",
                    message: `You have an interview request for ${job?.title}.`,
                    type: 'interview',
                    action_url: `/talent/messages`
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job_applications', id] });
            toast({ title: "Success", description: "Interview requested. Our team will coordinate." });
        }
    });

    const initiateOfferMutation = useMutation({
        mutationFn: async (appId: string) => {
            const app = applications?.find(a => a.id === appId);
            if (!app) throw new Error("Application not found");

            // 1. Update Application Status
            const { error: appError } = await supabase.from('job_applications').update({ status: 'offer_initiated' }).eq('id', appId);
            if (appError) throw appError;

            // 2. Create Offer Record for Admin to review
            // Using job details for initial offer draft
            const { error: offerError } = await supabase.from('offers').insert({
                client_id: job.client_id,
                talent_id: app.talent_id,
                role_title: job.title,
                hourly_rate: job.budget_max || 0, // Default to max budget
                weekly_hours: job.weekly_hours || 40,
                start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Default start in 2 weeks
                duration: job.duration || 'Ongoing',
                status: 'sent_to_admin',
                special_terms: `Generated from job: ${job.title}`,
                created_by: user?.id
            });

            if (offerError) {
                console.error("Error creating offer:", offerError);
                // We don't throw here to avoid rolling back the app status update if offer creation fails, 
                // but realistically we should use a transaction or handle getting out of sync.
                // For MVP, we log and proceed or throw. Let's throw to warn user.
                throw offerError;
            }

            // 3. Notify Talent
            if (app?.talent?.user_id) {
                await supabase.from('notifications').insert({
                    user_id: app.talent.user_id,
                    title: "Offer Process Started",
                    message: `A client has initiated an offer for ${job?.title}. Admin is preparing the contract.`,
                    type: 'offer',
                    action_url: `/talent/offers`
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job_applications', id] });
            toast({ title: "Success", description: "Offer request sent to Admin for contract generation." });
        }
    });

    const getCurrencySymbol = (code: string) => {
        return CURRENCIES.find(c => c.value === code)?.symbol || "$";
    };

    if (jobLoading || appsLoading) return <div className="p-8 text-center">Loading job details...</div>;
    if (!job) return <div className="p-8 text-center">Job not found</div>;

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/client/jobs"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">{job.title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Briefcase className="h-4 w-4" />
                        <span>{job.role_needed?.replace(/_/g, ' ')}</span>
                        <span className="mx-2">•</span>
                        <Badge variant={job.status === 'published' ? 'default' : 'secondary'}>{job.status?.replace(/_/g, ' ')}</Badge>
                    </div>
                </div>
            </div>

            {/* Single Hire Restriction Banner */}
            {applications?.some(app => ['offer_initiated', 'offer_sent', 'offer_accepted', 'contract_pending', 'contract_sent', 'waiting_for_talent', 'active', 'hired'].includes(app.status)) && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">Hiring in Progress:</span>
                    <span>You have an active offer or contract process with a candidate. You cannot hire another candidate until the current process is finalized or rejected.</span>
                </div>
            )}

            <Tabs defaultValue="candidates" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="candidates">Candidates ({applications?.length || 0})</TabsTrigger>
                    <TabsTrigger value="details">Job Details</TabsTrigger>
                </TabsList>

                <TabsContent value="candidates">
                    <Card>
                        <CardHeader><CardTitle>Applicants & Matches</CardTitle></CardHeader>
                        <CardContent>
                            <Tabs defaultValue="all" className="w-full">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="shortlist">Shortlisted</TabsTrigger>
                                    <TabsTrigger value="interview">Interviews</TabsTrigger>
                                    <TabsTrigger value="hired">Hired</TabsTrigger>
                                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                                </TabsList>

                                {["all", "shortlist", "interview", "hired", "rejected"].map((tab) => (
                                    <TabsContent key={tab} value={tab} className="mt-0">
                                        <div className="space-y-4">
                                            {applications?.filter((app: any) => {
                                                if (tab === 'all') return true;
                                                if (tab === 'shortlist') return ['shortlisted'].includes(app.status);
                                                if (tab === 'interview') return ['interview_scheduled', 'interview_requested'].includes(app.status);
                                                if (tab === 'hired') return ['hired', 'offer_accepted', 'offer_initiated'].includes(app.status); // Include offer_initiated in "Hired" or handle separately? 
                                                // User said "hired", usually offer_initiated leads to hired.
                                                if (tab === 'rejected') return ['rejected'].includes(app.status);
                                                return false;
                                            }).map((app: any) => (
                                                <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar>
                                                            <AvatarImage src={(app.talent as any)?.avatar_url} />
                                                            <AvatarFallback>{app.talent?.first_name?.[0]}{app.talent?.last_name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <h4 className="font-semibold text-lg">{app.talent?.first_name} {app.talent?.last_name}</h4>
                                                            <p className="text-sm text-muted-foreground">{app.talent?.primary_role?.replace(/_/g, ' ')}</p>
                                                            {app.talent?.country && (
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                                    <MapPin className="h-3 w-3" /> {app.talent.country}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant={
                                                            app.status === 'hired' ? 'default' :
                                                                app.status === 'offer_initiated' ? 'default' :
                                                                    'outline'
                                                        } className="capitalize px-3 py-1">
                                                            {app.status.replace(/_/g, ' ')}
                                                        </Badge>

                                                        {/* Action: Request Interview */}
                                                        {['applied', 'shortlisted'].includes(app.status) && (
                                                            <Button size="sm" variant="outline" onClick={() => requestInterviewMutation.mutate(app.id)}>
                                                                Request Interview
                                                            </Button>
                                                        )}

                                                        {/* Action: Hire / Initiate Offer */}
                                                        {['interview_scheduled', 'shortlisted', 'interview_requested'].includes(app.status) && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => initiateOfferMutation.mutate(app.id)}
                                                                disabled={applications?.some(a => ['offer_initiated', 'offer_sent', 'offer_accepted', 'contract_pending', 'contract_sent', 'waiting_for_talent', 'active', 'hired'].includes(a.status))}
                                                                className={applications?.some(a => ['offer_initiated', 'offer_sent', 'offer_accepted', 'contract_pending', 'contract_sent', 'waiting_for_talent', 'active', 'hired'].includes(a.status)) ? "opacity-50 cursor-not-allowed" : ""}
                                                            >
                                                                Hire Talent
                                                            </Button>
                                                        )}

                                                        {/* Show "Offer Sent" for initiated offers */}
                                                        {app.status === 'offer_initiated' && (
                                                            <Badge variant="default" className="bg-green-500 text-white px-3 py-1">
                                                                Offer Sent
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {// Empty state for this tab
                                                applications?.length > 0 && applications?.filter((app: any) => {
                                                    if (tab === 'all') return true;
                                                    if (tab === 'shortlist') return ['shortlisted'].includes(app.status);
                                                    if (tab === 'interview') return ['interview_scheduled', 'interview_requested'].includes(app.status);
                                                    if (tab === 'hired') return ['hired', 'offer_accepted', 'offer_initiated'].includes(app.status);
                                                    if (tab === 'rejected') return ['rejected'].includes(app.status);
                                                    return false;
                                                }).length === 0 && (
                                                    <div className="text-center py-12 text-muted-foreground">No candidates in this category.</div>
                                                )}
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="details">
                    <Card>
                        <CardHeader><CardTitle>Job Description</CardTitle></CardHeader>
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
            </Tabs>
        </div>
    );
};

export default ClientJobDetail;
