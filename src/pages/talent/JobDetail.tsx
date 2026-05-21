import { useParams, Link, useNavigate } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
    ArrowLeft, 
    Briefcase, 
    MapPin, 
    DollarSign, 
    Clock, 
    CheckCircle, 
    Calendar, 
    Globe, 
    UserCheck,
    Zap,
    ShieldCheck,
    Building2,
    FileText,
    MessageSquare
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const CURRENCIES = [
    { value: "USD", label: "USD ($)", symbol: "$" },
    { value: "EUR", label: "EUR (€)", symbol: "€" },
    { value: "GBP", label: "GBP (£)", symbol: "£" },
    { value: "NGN", label: "NGN (₦)", symbol: "₦" },
    { value: "KES", label: "KES (KSh)", symbol: "KSh" },
    { value: "ZAR", label: "ZAR (R)", symbol: "R" },
];

const TalentJobDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [applyDialogOpen, setApplyDialogOpen] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");

    // 1. Fetch Job (Handles both legacy and V2)
    const { data: job, isLoading: jobLoading } = useQuery({
        queryKey: ['talent_job_detail', id],
        queryFn: async () => {
            // First try looking in hr_v2_hire_requests (The new standard)
            const { data: v2Job, error: v2Error } = await supabase
                .from('hr_v2_hire_requests')
                .select('*')
                .eq('id', id)
                .single();
            
            if (v2Job) {
                return {
                    ...v2Job,
                    isV2: true,
                    company_name: "Verified OPSly Partner"
                };
            }

            // Fallback to legacy jobs table
            const { data: legacyJob, error: legacyError } = await supabase
                .from('jobs')
                .select('*, client:clients(company_name)')
                .eq('id', id)
                .single();
            
            if (legacyJob) {
                return {
                    ...legacyJob,
                    isV2: false,
                    company_name: legacyJob.client?.company_name || "Enterprise Partner"
                };
            }

            throw new Error("Job not discovered in any catalog.");
        },
        enabled: !!id
    });

    // 2. Check application status
    const { data: application, isLoading: appCheckLoading } = useQuery({
        queryKey: ['job_application_status', id, user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            
            // Check legacy applications
            const { data: talent } = await supabase.from('talents').select('id').eq('user_id', user.id).maybeSingle();
            if (talent) {
                const { data: legacyApp } = await supabase
                    .from('job_applications')
                    .select('id, status, created_at')
                    .eq('job_id', id)
                    .eq('talent_id', talent.id)
                    .maybeSingle();
                if (legacyApp) return { ...legacyApp, isV2: false };
            }

            // Check V2 applications
            const { data: v2App } = await supabase
                .from('hr_v2_applications')
                .select('id, status, created_at')
                .eq('hire_request_id', id)
                .eq('talent_user_id', user.id)
                .maybeSingle();
            
            if (v2App) return { ...v2App, isV2: true };

            return null;
        },
        enabled: !!id && !!user?.id
    });

    const handleApplyAction = () => {
        if (job?.job_type === 'external' && job?.external_url) {
            window.open(job.external_url, '_blank', 'noopener,noreferrer');
            return;
        }
        setApplyDialogOpen(true);
    };

    const applyMutation = useMutation({
        mutationFn: async () => {
            if (!job || !user) throw new Error("Missing context");

            if (job.isV2) {
                const { error } = await supabase.from('hr_v2_applications').insert({
                    hire_request_id: id,
                    talent_user_id: user.id,
                    status: 'applied',
                    application_note: coverLetter
                });
                if (error) throw error;
            } else {
                const { data: talent } = await supabase.from('talents').select('id').eq('user_id', user.id).single();
                if (!talent) throw new Error("Talent profile not found");
                
                const { error } = await supabase.from('job_applications').insert({
                    job_id: id,
                    talent_id: talent.id,
                    status: 'pending',
                    cover_letter: coverLetter
                });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job_application_status', id] });
            setApplyDialogOpen(false);
            setCoverLetter("");
            toast({ 
                title: "Application Seamlessly Sent", 
                description: "You've successfully taken the first step toward this opportunity.",
            });
        },
        onError: (error: any) => {
            toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
        }
    });

    const getCurrencySymbol = (code: string) => {
        return CURRENCIES.find(c => c.value === code)?.symbol || "$";
    };

    if (jobLoading || appCheckLoading) return (
        <div className="max-w-[1280px] mx-auto p-8 space-y-12">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-64 w-full rounded-[2.5rem]" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                   <Skeleton className="h-96 w-full rounded-3xl" />
                </div>
                <div className="lg:col-span-4">
                   <Skeleton className="h-96 w-full rounded-[2rem]" />
                </div>
            </div>
        </div>

    );

    if (!job) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Briefcase className="h-8 w-8 text-slate-300" />
                </div>
                <h1 className="text-xl font-black text-slate-900">Job Not Found</h1>
                <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl">Go Back</Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100 selection:text-blue-900 border-x border-slate-50 max-w-[1440px] mx-auto">
            <div className="max-w-[1280px] mx-auto px-6 py-12">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate(-1)}
                    className="mb-10 -ml-4 text-slate-400 hover:text-slate-900 group hover:bg-transparent"
                >
                    <ArrowLeft className="w-4 h-4 mr-3 group-hover:-translate-x-2 transition-transform duration-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Jobs</span>
                </Button>

                {job.status === 'closed' && job.close_reason && (
                    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-rose-700">
                        <strong>Closed:</strong> {job.close_reason}
                    </div>
                )}

                {/* Hero Header Card */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-10 transition-all duration-500 hover:shadow-md">
                    <div className="px-10 py-8">
                        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
                            <div className="space-y-4 flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="h-14 w-14 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-900">
                                        <Briefcase className="h-7 w-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{job.title}</h1>
                                        <div className="flex items-center gap-2 text-slate-400 font-semibold uppercase tracking-[0.2em] text-[11px]">
                                            <Building2 className="h-3.5 w-3.5" /> {job.company_name}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-4 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em]">
                                    <span className="inline-flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-slate-300" /> {job.location || job.location_preference || "Remote"}
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-slate-300" /> {job.work_mode || "Flexible"}
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-300" /> {job.weekly_hours || 40}h / Week
                                    </span>
                                </div>
                            </div>
                            
                            {application && (
                                <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Applied</p>
                                        <p className="text-xs font-semibold text-emerald-800/60">{application.status.toUpperCase()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Content (Left) */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Summary / Description */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-900">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Role Information</h2>
                            </div>
                            
                            <div className="prose prose-slate max-w-none">
                                <h3 className="text-xl font-bold text-slate-900 mb-6 underline decoration-blue-600 decoration-4 underline-offset-8">Description & Focus</h3>
                                <p className="text-lg text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                                    {job.description || job.role_summary || job.responsibilities || "No detailed description provided."}
                                </p>
                            </div>

                            {(job.responsibilities && (job.description || job.role_summary)) && (
                                <div className="pt-10 border-t border-slate-50">
                                    <h3 className="text-xl font-bold text-slate-900 mb-6">Key Responsibilities</h3>
                                    <p className="text-lg text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                                        {job.responsibilities}
                                    </p>
                                </div>
                            )}

                            {job.required_skills && job.required_skills.length > 0 && (
                                <div className="pt-10 border-t border-slate-50 space-y-6">
                                    <h3 className="text-xl font-bold text-slate-900">Required Competencies</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {job.required_skills.map((skill: string) => (
                                            <Badge key={skill} variant="secondary" className="bg-slate-50 text-slate-600 font-bold px-4 py-2 border border-slate-100 shadow-sm hover:scale-105 transition-all">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Panel (Right) */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="sticky top-12 space-y-8">
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-10">
                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Zap className="h-3 w-3 text-blue-600" /> Engagement Details
                                        </h3>
                                        
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                                                        <DollarSign className="h-5 w-5" />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Est. Budget</span>
                                                </div>
                                                <span className="text-base font-black text-slate-900">
                                                  {getCurrencySymbol(job.preferred_currency)}{job.budget_min} - {getCurrencySymbol(job.preferred_currency)}{job.budget_max}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                                                        <Calendar className="h-5 w-5" />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Duration</span>
                                                </div>
                                                <span className="text-base font-black text-slate-900">{job.duration || "Ongoing"}</span>
                                            </div>

                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                                                        <UserCheck className="h-5 w-5" />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Experience</span>
                                                </div>
                                                <span className="text-base font-black text-slate-900">{job.experience_required || 0}y+ Required</span>
                                            </div>
                                        </div>
                                    </div>

                                    {!application ? (
                                        job.job_type === 'external' ? (
                                            <Button 
                                                size="lg" 
                                                onClick={handleApplyAction}
                                                className="w-full h-14 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-bold uppercase tracking-[0.16em] text-[11px] shadow-lg shadow-blue-500/20 transition-all"
                                            >
                                                Apply on Site <ExternalLink className="h-4 w-4 ml-2" />
                                            </Button>
                                        ) : (
                                            <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button size="lg" className="w-full h-14 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-bold uppercase tracking-[0.16em] text-[11px] shadow-lg shadow-blue-500/20 transition-all">
                                                        Apply for Role <ArrowLeft className="h-4 w-4 ml-2 rotate-180 transition-transform" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-3xl p-0 overflow-hidden rounded-[2rem] border border-slate-100 shadow-2xl bg-white">
                                                    <DialogHeader className="px-10 py-10 bg-slate-900 text-white space-y-4">
                                                        <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg mb-2">
                                                            <Zap className="h-6 w-6" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <DialogTitle className="text-2xl font-bold tracking-tight">Submit Your Application</DialogTitle>
                                                            <DialogDescription className="text-slate-300 font-medium text-sm leading-relaxed">
                                                                Applying for <span className="text-white font-semibold">{job.title}</span>. Your credentials will be shared with the hiring team.
                                                            </DialogDescription>
                                                        </div>
                                                    </DialogHeader>
                                                    
                                                    <div className="px-10 pt-8 pb-12 space-y-8 bg-white">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                                                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Cover Note (Optional)</span>
                                                            </div>
                                                            <Textarea 
                                                                placeholder="Why are you the right fit for this position?" 
                                                                className="min-h-[150px] rounded-2xl border-slate-200 bg-slate-50 p-4 font-medium text-slate-700 focus:ring-2 focus:ring-blue-600 text-sm leading-relaxed transition-all"
                                                                value={coverLetter}
                                                                onChange={(e) => setCoverLetter(e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                                                            <Button 
                                                                variant="outline" 
                                                                onClick={() => setApplyDialogOpen(false)} 
                                                                className="w-full sm:w-auto rounded-2xl h-14 px-8 font-bold uppercase tracking-[0.16em] text-[11px] text-slate-500 hover:text-slate-900 transition-all"
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button 
                                                                onClick={() => applyMutation.mutate()} 
                                                                disabled={applyMutation.isPending}
                                                                className="w-full sm:flex-1 h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold uppercase tracking-[0.16em] text-[11px] shadow-lg shadow-blue-500/20 transition-all"
                                                            >
                                                                {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )
                                    ) : (
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            <p className="text-xs text-center font-bold text-slate-400 uppercase tracking-[0.2em]">Application recorded</p>
                                            <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 text-slate-500 font-bold uppercase tracking-[0.16em] text-[10px] cursor-not-allowed">
                                               View Application
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-50" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                                            <ShieldCheck className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Verified Platform</span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed font-bold">
                                        This role has been vetted for payment security and professional engagement standards.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TalentJobDetail;
