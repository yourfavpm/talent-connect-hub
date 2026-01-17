
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, Calendar, MapPin, DollarSign, Users, CheckCircle, XCircle } from "lucide-react";

interface Job {
    id: string;
    title: string;
    responsibilities: string;
    special_notes: string;
    status: string;
    budget_min: number;
    budget_max: number;
    location: string;
    created_at: string;
    client: {
        company_name: string;
    }
}

// ... imports remain the same ...

const AdminJobDetail = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Job
    const { data: job, isLoading: jobLoading } = useQuery({
        queryKey: ['job', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('jobs')
                .select('*, client:clients(company_name)')
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
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job_applications', id] });
            toast({ title: "Updated", description: "Application status updated" });
        }
    });

    if (jobLoading || appsLoading) return <div className="p-8 text-center">Loading job details...</div>;
    if (!job) return <div className="p-8 text-center">Job not found</div>;

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
                        <span>{job.client?.company_name || 'Tasksive Client'}</span>
                        <span className="mx-2">•</span>
                        <Badge variant={job.status === 'published' ? 'default' : 'secondary'}>{job.status}</Badge>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="applications">Applications ({applications?.length || 0})</TabsTrigger>
                    <TabsTrigger value="sourcing">Sourcing</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Job Responsibilities</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose max-w-none whitespace-pre-line">
                                        {job.responsibilities}
                                    </div>
                                    {job.special_notes && (
                                        <>
                                            <h3 className="font-semibold mt-6 mb-2">Special Notes</h3>
                                            <div className="text-muted-foreground whitespace-pre-line">
                                                {job.special_notes}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Budget</span>
                                        <span className="font-semibold">${job.budget_min?.toLocaleString()} - ${job.budget_max?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Location</span>
                                        <span>{job.location}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Posted</span>
                                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Applications and Sourcing Tabs remain unchanged */}
                <TabsContent value="applications">
                    <Card>
                        <CardHeader><CardTitle>Candidates</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {applications?.map((app: any) => (
                                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src="" />
                                                <AvatarFallback>{app.talent?.first_name?.[0]}{app.talent?.last_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <Link to={`/admin/talents/${app.talent?.id}`} className="font-semibold hover:underline">
                                                    {app.talent?.first_name} {app.talent?.last_name}
                                                </Link>
                                                <p className="text-sm text-muted-foreground">{app.talent?.primary_role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={app.status === 'shortlisted' ? 'default' : 'outline'}>{app.status}</Badge>
                                            {app.status === 'pending' && (
                                                <>
                                                    <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => updateStatusMutation.mutate({ appId: app.id, status: 'shortlisted' })}>
                                                        <CheckCircle className="h-4 w-4 mr-1" /> Shortlist
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => updateStatusMutation.mutate({ appId: app.id, status: 'rejected' })}>
                                                        <XCircle className="h-4 w-4 mr-1" /> Reject
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {applications?.length === 0 && <p className="text-center text-muted-foreground py-8">No applications yet.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sourcing">
                    <div className="p-8 text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Use the "Sourcing" feature to find and invite talents to this job.</p>
                        <Button variant="outline" className="mt-4" asChild>
                            <Link to="/admin/talents">Browse Talent Pool</Link>
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminJobDetail;
