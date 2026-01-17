
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, MapPin, Users, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ClientJobDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Job (Ensure ownership)
    const { data: job, isLoading: jobLoading } = useQuery({
        queryKey: ['client_job', id],
        queryFn: async () => {
            // First get client id
            const { data: client } = await supabase.from('clients').select('id').eq('user_id', user?.id).single();
            if (!client) throw new Error("Client not found");

            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', id)
                .eq('client_id', client.id) // Security check
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
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job_applications', id] });
            toast({ title: "Success", description: "Interview requested. Our team will coordinate." });
        }
    });

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
                        <span>{job.role_needed?.replace('_', ' ')}</span>
                        <span className="mx-2">•</span>
                        <Badge variant={job.status === 'published' ? 'default' : 'secondary'}>{job.status}</Badge>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="candidates" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="candidates">Candidates ({applications?.length || 0})</TabsTrigger>
                    <TabsTrigger value="details">Job Details</TabsTrigger>
                </TabsList>

                <TabsContent value="candidates">
                    <Card>
                        <CardHeader><CardTitle>Applicants & Matches</CardTitle></CardHeader>
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
                                                <h4 className="font-semibold">{app.talent?.first_name} {app.talent?.last_name}</h4>
                                                <p className="text-sm text-muted-foreground">{app.talent?.primary_role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{app.status.replace('_', ' ')}</Badge>
                                            {/* Action: Request Interview if status is valid (e.g. shortlisted or pending) */}
                                            {['pending', 'shortlisted'].includes(app.status) && (
                                                <Button size="sm" onClick={() => requestInterviewMutation.mutate(app.id)}>
                                                    Request Interview
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {applications?.length === 0 && (
                                    <div className="text-center py-12">
                                        <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                                        <p className="text-muted-foreground">No applications yet.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="details">
                    <Card>
                        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                        <CardContent>
                            <div className="prose max-w-none whitespace-pre-line mb-6">
                                {job.responsibilities}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">Location</span>
                                    <span className="font-medium">{job.location}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Budget</span>
                                    <span className="font-medium">${job.budget_min} - ${job.budget_max}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ClientJobDetail;
