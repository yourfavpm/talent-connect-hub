import { useParams, useNavigate } from "react-router-dom";
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
    CheckCircle2,
    Calendar,
    UserCheck,
    Zap,
    ShieldCheck,
    Building2,
    FileText,
    Send,
    Timer,
    Globe,
    Loader2,
    ExternalLink,
    Share2,
} from "lucide-react";
import { getZoneUrl, Zone } from "@/utils/subdomain";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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

    const handleShare = async () => {
        if (!id) return;
        const url = getZoneUrl(Zone.MARKETING, `/jobs/${id}`);
        try {
            await navigator.clipboard.writeText(url);
            toast({
                title: "Link Copied! 🔗",
                description: "Public job link copied to clipboard.",
            });
        } catch (err) {
            console.error("Failed to copy link:", err);
            toast({
                title: "Copy Failed",
                description: "Could not copy link to clipboard.",
                variant: "destructive",
            });
        }
    };

    const { data: job, isLoading: jobLoading } = useQuery({
        queryKey: ["talent_job_detail", id],
        queryFn: async () => {
            const { data: v2Job } = await supabase
                .from("hr_v2_hire_requests")
                .select("*")
                .eq("id", id)
                .single();
            if (v2Job) return { ...v2Job, isV2: true, company_name: "Verified OPSly Partner" };

            const { data: legacyJob } = await supabase
                .from("jobs")
                .select("*, client:clients(company_name)")
                .eq("id", id)
                .single();
            if (legacyJob) return { ...legacyJob, isV2: false, company_name: legacyJob.client?.company_name || "Enterprise Partner" };

            throw new Error("Job not found.");
        },
        enabled: !!id,
    });

    const { data: application, isLoading: appCheckLoading } = useQuery({
        queryKey: ["job_application_status", id, user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data: talent } = await supabase.from("talents").select("id").eq("user_id", user.id).maybeSingle();
            if (talent) {
                const { data: legacyApp } = await supabase
                    .from("job_applications")
                    .select("id, status, created_at")
                    .eq("job_id", id)
                    .eq("talent_id", talent.id)
                    .maybeSingle();
                if (legacyApp) return { ...legacyApp, isV2: false };
            }
            const { data: v2App } = await supabase
                .from("hr_v2_applications")
                .select("id, status, created_at")
                .eq("hire_request_id", id)
                .eq("talent_user_id", user.id)
                .maybeSingle();
            if (v2App) return { ...v2App, isV2: true };
            return null;
        },
        enabled: !!id && !!user?.id,
    });

    const handleApplyAction = () => {
        if (job?.job_type === "external" && job?.external_url) {
            window.open(job.external_url, "_blank", "noopener,noreferrer");
            return;
        }
        setApplyDialogOpen(true);
    };

    const applyMutation = useMutation({
        mutationFn: async () => {
            if (!job || !user) throw new Error("Missing context");
            if (job.isV2) {
                const { error } = await supabase.from("hr_v2_applications").insert({
                    hire_request_id: id,
                    talent_user_id: user.id,
                    status: "applied",
                    application_note: coverLetter,
                });
                if (error) throw error;
            } else {
                const { data: talent } = await supabase.from("talents").select("id").eq("user_id", user.id).single();
                if (!talent) throw new Error("Talent profile not found");
                const { error } = await supabase.from("job_applications").insert({
                    job_id: id,
                    talent_id: talent.id,
                    status: "pending",
                    cover_letter: coverLetter,
                });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job_application_status", id] });
            setApplyDialogOpen(false);
            setCoverLetter("");
            toast({ title: "Application Submitted! 🎉", description: "You've successfully applied for this role." });
        },
        onError: (error: any) => {
            toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
        },
    });

    const getCurrencySymbol = (code: string) => CURRENCIES.find((c) => c.value === code)?.symbol || "$";

    const getApplicationStatusLabel = (status: string) => {
        if (!status || status === "pending" || status === "applied") return "Applied";
        if (status === "shortlisted") return "Shortlisted";
        if (status === "interview_requested" || status === "interview_scheduled") return "Interview Invited";
        if (status === "hired") return "Hired 🎉";
        return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const normalizeToArray = (val: any): string[] => {
        if (!val) return [];
        if (Array.isArray(val)) return val as string[];
        if (typeof val === "string") return val.split(/\r?\n|,|;/).map((s) => s.trim()).filter(Boolean);
        return [];
    };

    const requirementsArray = normalizeToArray(job?.required_skills ?? job?.skills ?? job?.requirements);

    const budgetDisplay = () => {
        const sym = getCurrencySymbol(job?.preferred_currency || "USD");
        const freq = job?.salary_type === "monthly" ? "/mo" : (job?.salary_type === "hourly" ? "/hr" : "");
        if (job?.budget_type === "fixed") return job?.fixed_budget ? `${sym}${job.fixed_budget.toLocaleString()}${freq}` : "TBD";
        if (job?.budget_min && job?.budget_max) return `${sym}${job.budget_min.toLocaleString()} – ${sym}${job.budget_max.toLocaleString()}${freq}`;
        if (job?.budget_min) return `From ${sym}${job.budget_min.toLocaleString()}${freq}`;
        return "TBD";
    };

    const metaItems = [
        { icon: Clock, label: job?.service_model?.replace(/_/g, " ") || job?.engagement_type?.replace(/_/g, " ") || "—" },
        { icon: MapPin, label: job?.location_preference || job?.location || "Remote" },
        { icon: Timer, label: `${job?.hours_per_week || job?.weekly_hours || "40"}h / week` },
        { icon: DollarSign, label: budgetDisplay() },
    ];

    if (jobLoading || appCheckLoading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
                <Skeleton className="h-8 w-28 rounded-xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <Skeleton className="h-64 w-full rounded-2xl" />
                    </div>
                    <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <div className="h-14 w-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <Briefcase className="h-7 w-7 text-slate-300" />
                    </div>
                    <h1 className="text-lg font-semibold text-slate-800">Job Not Found</h1>
                    <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl h-9 text-sm">Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fc] font-inter">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm font-medium mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Jobs
                </button>

                {/* Closed banner */}
                {job.status === "closed" && job.close_reason && (
                    <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-rose-700 text-sm font-medium flex items-center gap-2">
                        <span className="font-semibold">Closed:</span> {job.close_reason}
                    </div>
                )}

                {/* ── Hero Header Card ── */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 sm:p-7 mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-5 justify-between">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug">{job.title}</h1>
                                <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-0.5">
                                    <Building2 className="w-3.5 h-3.5" />
                                    <span>{job.company_name}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                            <Button
                                variant="outline"
                                onClick={handleShare}
                                className="h-10 px-3.5 border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all flex items-center gap-1.5"
                            >
                                <Share2 className="w-4 h-4" />
                                <span className="text-xs font-semibold">Share Job Link</span>
                            </Button>

                            {application && (
                                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span className="text-sm font-medium text-emerald-700">{getApplicationStatusLabel(application.status)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Meta pills */}
                    <div className="mt-5 flex flex-wrap gap-2">
                        {metaItems.map((item, i) => (
                            <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 font-medium">
                                <item.icon className="w-3.5 h-3.5 text-slate-400" />
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Two-column layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Description card */}
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-slate-500" />
                                </div>
                                <h2 className="text-sm font-semibold text-slate-700">Role Information</h2>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {job.description || job.role_summary || job.responsibilities || "No detailed description provided."}
                                    </p>
                                </div>

                                {job.responsibilities && (job.description || job.role_summary) && (
                                    <div className="pt-5 border-t border-slate-100">
                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Responsibilities</p>
                                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                            {Array.isArray(job.responsibilities) ? job.responsibilities.join("\n") : job.responsibilities}
                                        </p>
                                    </div>
                                )}

                                {requirementsArray.length > 0 && (
                                    <div className="pt-5 border-t border-slate-100">
                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Requirements & Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {requirementsArray.map((skill: string) => (
                                                <Badge key={skill} variant="secondary" className="bg-slate-50 text-slate-600 font-medium px-3 py-1 border border-slate-100 text-xs">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Action Panel */}
                    <div className="space-y-4">
                        <div className="sticky top-6 space-y-4">

                            {/* Engagement details */}
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                                    <Zap className="w-3 h-3 text-blue-500" /> Engagement Details
                                </p>
                                <div className="space-y-3">
                                    {[
                                        { icon: DollarSign, label: "Budget", value: budgetDisplay() },
                                        { icon: Calendar, label: "Duration", value: job.duration || "Ongoing" },
                                        { icon: UserCheck, label: "Experience", value: (job.years_of_experience || job.experience_required) ? `${job.years_of_experience || job.experience_required}y+ Required` : "Any" },
                                        { icon: Globe, label: "Location", value: job?.location_preference || job?.location || "Remote" },
                                    ].map(({ icon: Icon, label, value }) => (
                                        <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Icon className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-xs font-medium">{label}</span>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-800 text-right max-w-[140px] truncate capitalize">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA */}
                                <div className="mt-5 pt-4 border-t border-slate-100">
                                    {!application ? (
                                        job.job_type === "external" ? (
                                            <Button
                                                onClick={handleApplyAction}
                                                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm shadow-sm gap-2"
                                            >
                                                Apply on Site <ExternalLink className="w-3.5 h-3.5" />
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => setApplyDialogOpen(true)}
                                                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm shadow-sm gap-2"
                                            >
                                                <Send className="w-3.5 h-3.5" /> Apply for Role
                                            </Button>
                                        )
                                    ) : (
                                        <div className="flex items-center gap-2.5 justify-center py-2.5 px-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <span className="text-sm font-medium text-emerald-700">Application {getApplicationStatusLabel(application.status)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Trust card */}
                            <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-5">
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="w-7 h-7 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">Verified Platform</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    This role has been vetted for payment security and professional engagement standards.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Apply Dialog ── */}
            <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl bg-white gap-0">
                    {/* Header */}
                    <DialogHeader className="px-6 pt-6 pb-5 border-b border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <Send className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold text-slate-900 leading-snug">Submit Your Application</DialogTitle>
                                <p className="text-xs text-slate-400 mt-0.5">Your profile will be shared with the hiring team</p>
                            </div>
                        </div>
                        {/* Role preview pill */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs font-medium text-slate-700 truncate">{job.title}</span>
                            <span className="ml-auto text-[10px] text-slate-400 shrink-0">{job.company_name}</span>
                        </div>
                    </DialogHeader>

                    {/* Body */}
                    <div className="px-6 py-5 space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                                Cover Note <span className="normal-case font-normal text-slate-400">(optional)</span>
                            </label>
                            <Textarea
                                placeholder="Tell the hiring team why you're a great fit for this role..."
                                className="min-h-[130px] rounded-xl border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition-all leading-relaxed"
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                            />
                            <p className="text-[11px] text-slate-400 mt-1.5">{coverLetter.length}/1000 characters</p>
                        </div>

                        {/* Checklist */}
                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">What gets shared</p>
                            {["Your professional profile & skills", "Your cover note (if provided)", "Your availability status"].map((item) => (
                                <div key={item} className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span className="text-xs text-slate-600">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setApplyDialogOpen(false)}
                            className="flex-1 h-10 rounded-xl border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => applyMutation.mutate()}
                            disabled={applyMutation.isPending}
                            className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm gap-2"
                        >
                            {applyMutation.isPending ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                            ) : (
                                <><Send className="w-3.5 h-3.5" /> Submit Application</>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TalentJobDetail;
