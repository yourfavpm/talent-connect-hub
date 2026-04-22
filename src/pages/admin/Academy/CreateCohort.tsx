import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
    Plus, 
    ArrowLeft, 
    Loader2,
    Calendar,
    Users,
    Clock,
    Zap,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInternalPath } from "@/utils/subdomain";

const CreateCohort = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [course, setCourse] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        enrollment_start_date: "",
        enrollment_end_date: "",
        start_date: "",
        end_date: "",
        max_slots: 25,
        duration_weeks: 4,
        zoom_link: ""
    });

    useEffect(() => {
        const fetchCourse = async () => {
            if (!slug) return;
            try {
                const { data, error } = await supabase
                    .from("academy_courses")
                    .select("*")
                    .eq("slug", slug)
                    .single();
                
                if (error) throw error;
                setCourse(data);
                setFormData(prev => ({
                    ...prev,
                    name: `${data.title} - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`
                }));
            } catch (err) {
                console.error("Error fetching course:", err);
                toast({ title: "Error", description: "Failed to load course details.", variant: "destructive" });
                navigate("/admin/academy/courses");
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [slug, toast, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slug || !course) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from("cohorts")
                .insert({
                    course_id: slug,
                    name: formData.name,
                    start_date: new Date(formData.start_date).toISOString(),
                    end_date: new Date(formData.end_date).toISOString(),
                    enrollment_start_date: new Date(formData.enrollment_start_date).toISOString(),
                    enrollment_end_date: new Date(formData.enrollment_end_date).toISOString(),
                    max_slots: Number(formData.max_slots),
                    duration_weeks: Number(formData.duration_weeks),
                    price_usd: course.price_usd,
                    price_naira: course.price_naira,
                    zoom_link: formData.zoom_link,
                    status: 'open'
                });

            if (error) throw error;

            toast({
                title: "Success",
                description: "New cohort created successfully.",
            });
            navigate(getInternalPath(`/admin/academy/courses/${slug}/cohorts`));
        } catch (err: any) {
            console.error("Error creating cohort:", err);
            toast({
                title: "Error",
                description: err.message || "Failed to create cohort.",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 bg-white min-h-screen font-inter">
            <div className="w-full max-w-none">
                <Link to={getInternalPath(`/admin/academy/courses/${slug}/cohorts`)} className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Cohorts
                </Link>

                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold tracking-widest uppercase mb-4">
                        New Session
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Create New Cohort</h1>
                    <p className="text-slate-500 font-medium mt-2">Set up a new learning session for <span className="text-blue-600 font-bold">{course.title}</span>.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* General Info */}
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Zap className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-lg font-bold text-slate-900">General Information</h3>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cohort Name</Label>
                                    <Input 
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="e.g. May 2026 Cohort"
                                        className="h-12 rounded-xl border-slate-200 focus:ring-blue-600 font-medium"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="max_slots" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Max Capacity</Label>
                                        <Input 
                                            id="max_slots"
                                            type="number"
                                            value={formData.max_slots}
                                            onChange={(e) => setFormData({...formData, max_slots: Number(e.target.value)})}
                                            className="h-12 rounded-xl border-slate-200 focus:ring-blue-600 font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="duration_weeks" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration (Weeks)</Label>
                                        <Input 
                                            id="duration_weeks"
                                            type="number"
                                            value={formData.duration_weeks}
                                            onChange={(e) => setFormData({...formData, duration_weeks: Number(e.target.value)})}
                                            className="h-12 rounded-xl border-slate-200 focus:ring-blue-600 font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Enrollment Timeline */}
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-lg font-bold text-slate-900">Enrollment Timeline</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="enroll_start" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enrollment Starts</Label>
                                        <Input 
                                            id="enroll_start"
                                            type="datetime-local"
                                            value={formData.enrollment_start_date}
                                            onChange={(e) => setFormData({...formData, enrollment_start_date: e.target.value})}
                                            className="h-12 rounded-xl border-slate-200 focus:ring-blue-600 font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="enroll_end" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enrollment Ends</Label>
                                        <Input 
                                            id="enroll_end"
                                            type="datetime-local"
                                            value={formData.enrollment_end_date}
                                            onChange={(e) => setFormData({...formData, enrollment_end_date: e.target.value})}
                                            className="h-12 rounded-xl border-slate-200 focus:ring-blue-600 font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Program Timeline */}
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-lg font-bold text-slate-900">Program Schedule</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="start_date" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cohort Starts</Label>
                                        <Input 
                                            id="start_date"
                                            type="datetime-local"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                            className="h-12 rounded-xl border-slate-200 focus:ring-blue-600 font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end_date" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cohort Ends</Label>
                                        <Input 
                                            id="end_date"
                                            type="datetime-local"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                            className="h-12 rounded-xl border-slate-200 focus:ring-blue-600 font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zoom" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meeting Link (Optional)</Label>
                                    <Input 
                                        id="zoom"
                                        value={formData.zoom_link}
                                        onChange={(e) => setFormData({...formData, zoom_link: e.target.value})}
                                        placeholder="e.g. Zoom or Google Meet Link"
                                        className="h-12 rounded-xl border-slate-200 focus:ring-blue-600 font-medium"
                                    />
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-xl transition-all"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Launch New Cohort"}
                            </Button>
                        </form>
                    </div>

                    <div className="lg:col-span-4">
                        <div className="sticky top-10 space-y-6">
                            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                    <CheckCircle2 className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Inherited Pricing</h3>
                                <p className="text-white/50 text-sm font-medium mb-8 leading-relaxed">
                                    This cohort will automatically use the standard pricing defined for {course.title}.
                                </p>
                                
                                <div className="space-y-4 border-t border-white/10 pt-8">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">USD Price</span>
                                        <span className="text-lg font-bold">${course.price_usd}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">NGN Price</span>
                                        <span className="text-lg font-bold">₦{course.price_naira?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8">
                                <h4 className="text-blue-600 font-bold text-sm mb-2">Visibility Note</h4>
                                <p className="text-blue-700/60 text-xs leading-relaxed font-medium">
                                    Once created, the cohort will appear on the course landing page during the enrollment window.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateCohort;
