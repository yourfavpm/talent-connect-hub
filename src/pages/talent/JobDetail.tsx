
import { useParams, Link, useNavigate } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, MapPin, DollarSign, Clock, CheckCircle, Calendar, Globe, UserCheck } from "lucide-react";
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


interface Job {
    id: string;
    title: string;
    role_needed: string;
    location: string;
    service_model: string;
    status: string;
    work_mode: string;
    preferred_currency: string;
    budget_min: number;
    budget_max: number;
    salary_type: string;
    duration: string;
    weekly_hours: number;
    experience_required: number;
    responsibilities: string;
    required_skills: string[];
    special_notes: string;
}

interface JobApplication {
    id: string;
    status: string;
    created_at: string;
}

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
            const { data, error } = await (supabase
                .from('jobs')
                .select('*, client:clients(company_name)')
                .eq('id', id)
                .single() as any);
            if (error) throw error;
            return data as Job;
        },
        enabled: !!id
    });

    // 2. Check if already applied
    const { data: existingApplication, isLoading: appCheckLoading } = useQuery({
        queryKey: ['my_application', id, user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            // Get talent ID first
            const { data: talent } = await (supabase.from('talents').select('id').eq('user_id', user.id).single() as any);
            if (!talent) return null;

            const { data } = await (supabase
                .from('job_applications')
                .select('id, status, created_at')
                .eq('job_id', id)
                .eq('talent_id', talent.id)
                .maybeSingle() as any);
            return data as JobApplication;
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

    const getCurrencySymbol = (code: string) => {
        return CURRENCIES.find(c => c.value === code)?.symbol || "$";
    };

    if (jobLoading || appCheckLoading) return <div className="p-8 text-center">Loading job details...</div>;
    if (!job) return <div className="p-8 text-center">Job not found</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-6 animate-fade-in">
            <Button variant="ghost" size="sm" asChild className="mb-4">
                <Link to={getInternalPath("/talent/jobs")}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Jobs</Link>
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

            <Card>
                <CardHeader>
                    <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Key Stats Grid - Matching Client Portal */}
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

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Job Description</h3>
                        <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-600">
                            {job.responsibilities}
                        </div>
                    </div>

                    {job.required_skills && job.required_skills.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Required Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {job.required_skills.map((skill: string) => (
                                    <Badge key={skill} variant="secondary">{skill}</Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {job.special_notes && (
                        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">Additional Notes</h4>
                            <p className="text-sm text-slate-600 whitespace-pre-line">{job.special_notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TalentJobDetail;
