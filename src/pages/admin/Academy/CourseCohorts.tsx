import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
    Users, 
    Calendar, 
    Plus, 
    ArrowLeft, 
    ChevronRight,
    Loader2,
    BookOpen,
    Clock,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getInternalPath } from "@/utils/subdomain";

interface Cohort {
    id: string;
    name: string;
    start_date: string;
    status: string;
    max_slots: number;
    current_slots: number;
    enrollment_start_date: string;
    enrollment_end_date: string;
}

const CourseCohorts = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [courseTitle, setCourseTitle] = useState("");
    const [cohorts, setCohorts] = useState<Cohort[]>([]);

    const fetchData = useCallback(async () => {
        if (!slug) return;
        setLoading(true);
        try {
            // 1. Fetch Course Info
            const { data: courseData, error: courseError } = await supabase
                .from("academy_courses")
                .select("id, title")
                .eq("slug", slug)
                .single();
            
            if (courseError) throw courseError;
            setCourseTitle(courseData.title);

            // 2. Fetch Cohorts
            const { data: cohortsData, error: cohortsError } = await supabase
                .from("cohorts")
                .select("*")
                .eq("course_id", courseData.id)
                .order("start_date", { ascending: false });

            if (cohortsError) throw cohortsError;
            setCohorts(cohortsData as Cohort[]);
        } catch (err) {
            console.error("Error fetching course cohorts:", err);
            toast({
                title: "Error",
                description: "Failed to load cohort data.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [slug, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                <Link to={getInternalPath("/admin/academy")} className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Academy
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold tracking-widest uppercase mb-4 w-fit">
                            Cohort Management
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{courseTitle}</h1>
                        <p className="text-slate-500 font-medium mt-2">Manage all active and past learning sessions for this program.</p>
                    </div>
                    <Button 
                        onClick={() => navigate(getInternalPath(`/admin/academy/courses/${slug}/cohorts/new`))}
                        className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Create New Cohort
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {cohorts.map((cohort) => (
                        <div key={cohort.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-blue-300 transition-all group p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-105 transition-transform">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-bold text-slate-900">{cohort.name}</h3>
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                cohort.status === 'open' 
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                : cohort.status === 'ongoing' 
                                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                : 'bg-slate-50 text-slate-400 border border-slate-100'
                                            }`}>
                                                {cohort.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Start: {new Date(cohort.start_date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {cohort.current_slots} / {cohort.max_slots} Enrolled</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-8 lg:border-l lg:border-slate-100 lg:pl-8">
                                    <div className="space-y-1">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Enrollment Period</div>
                                        <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                            {new Date(cohort.enrollment_start_date).toLocaleDateString()} — {new Date(cohort.enrollment_end_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => navigate(getInternalPath(`/admin/academy/cohorts/${cohort.id}`))}
                                        variant="ghost" 
                                        className="h-12 px-6 rounded-xl font-bold text-blue-600 hover:bg-blue-50 gap-2 ml-auto"
                                    >
                                        Manage Cohort <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {cohorts.length === 0 && (
                        <div className="py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                            <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-slate-900 font-bold mb-1">No cohorts created yet</h3>
                            <p className="text-slate-400 text-sm">Start by creating the first session for this course.</p>
                            <Button 
                                onClick={() => navigate(getInternalPath(`/admin/academy/courses/${slug}/cohorts/new`))}
                                variant="outline" 
                                className="mt-8 h-12 px-8 rounded-xl font-bold border-slate-200"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Create First Cohort
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseCohorts;
