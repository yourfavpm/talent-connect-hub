
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, MapPin, DollarSign, Clock, CheckCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

const TalentJobDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [applyDialogOpen, setApplyDialogOpen] = useState(false);

    // 1. Fetch Job
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

    // 2. Check if already applied
    const { data: existingApplication, isLoading: appCheckLoading } = useQuery({
        queryKey: ['my_application', id, user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            // Get talent ID first
            const { data: talent } = await supabase.from('talents').select('id').eq('user_id', user.id).single();
            if (!talent) return null;

            const { data } = await supabase
                .from('job_applications')
                .select('id, status, created_at')
                .eq('job_id', id)
                .eq('talent_id', talent.id)
                .maybeSingle();
            return data;
        },
        enabled: !!id && !!user?.id
    });

    const applyMutation = useMutation({
        mutationFn: async () => {
            const { data: talent } = await supabase.from('talents').select('id').eq('user_id', user?.id).single();
            if (!talent) throw new Error("Talent profile not found");

            const { error } = await supabase.from('job_applications').insert({
                job_id: id,
                talent_id: talent.id,
                status: 'pending'
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my_application', id] });
            setApplyDialogOpen(false);
            toast({ title: "Applied!", description: "Your application has been submitted successfully." });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    if (jobLoading || appCheckLoading) return <div className="p-8 text-center">Loading job details...</div>;
    if (!job) return <div className="p-8 text-center">Job not found</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6 animate-fade-in">
            <Button variant="ghost" size="sm" asChild className="mb-4">
                <Link to="/talent/jobs"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Jobs</Link>
            </Button>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-slate-500 mt-3">
                        <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.role_needed?.replace('_', ' ') || 'Role'}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location || job.location}</span>
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {job.service_model?.replace('_', ' ')}</span>
                        <Badge variant={job.status === 'published' ? 'default' : 'secondary'}>{job.status}</Badge>
                    </div>
                </div>

                <div className="flex-shrink-0">
                    {existingApplication ? (
                        <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 px-3 py-1">
                                <CheckCircle className="h-3 w-3 mr-1" /> Applied on {new Date(existingApplication.created_at).toLocaleDateString()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Status: {existingApplication.status}</span>
                        </div>
                    ) : (
                        <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="lg" className="bg-slate-900 hover:bg-slate-800">Apply Now</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Apply for {job.title}</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to apply for this position? Your profile will be shared with the client.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}>
                                        {applyMutation.isPending ? "Submitting..." : "Confirm Application"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-600">
                                {job.responsibilities}
                            </div>
                            {job.special_notes && (
                                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Additional Notes</h4>
                                    <p className="text-sm text-slate-600 whitespace-pre-line">{job.special_notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {job.required_skills && job.required_skills.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Required Skills</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {job.required_skills.map((skill: string) => (
                                        <Badge key={skill} variant="secondary">{skill}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Salary Range</span>
                                <span className="font-medium">
                                    {job.budget_min && job.budget_max ? `$${job.budget_min} - $${job.budget_max}` : 'Negotiable'}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Duration</span>
                                <span className="font-medium">{job.duration || 'Ongoing'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Experience</span>
                                <span className="font-medium">{job.experience_required ? `${job.experience_required} years` : 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">Posted</span>
                                <span className="font-medium">{new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TalentJobDetail;
