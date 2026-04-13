import { useParams, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getCourseBySlug } from "@/data/academy-courses"; // Legacy fallback
import { Button } from "@/components/ui/button";
import { 
    ArrowRight, 
    CheckCircle, 
    Clock, 
    Signal, 
    Calendar, 
    Users, 
    Award, 
    Zap,
    Laptop,
    Shield,
    Globe,
    TrendingUp,
    ChevronDown,
    ArrowLeft,
    Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CurriculumAccordion from "@/components/academy/CurriculumAccordion";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Course {
    id?: string;
    slug: string;
    title: string;
    tagline: string;
    description: string;
    level: string;
    duration: string;
    price_usd: number;
    price_naira: number;
    outcome: string;
    image_url: string;
    tools: string[];
    what_youll_learn: string[];
    learning_outcomes: string[];
    curriculum: any[];
    who_is_it_for: string[];
    bonus_description?: string;
    slots_total: number;
    slots_filled: number;
    next_cohort_date: string;
    // Legacy mapping support
    priceUSD?: number;
    priceNaira?: number;
    nextCohort?: string;
    whatYoullLearn?: string[];
    whoIsItFor?: string[];
    outcomes?: string[];
    bonusDescription?: string;
    slotsTotal?: number;
    slotsFilled?: number;
}

const CourseDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const { search, pathname } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [isStickyVisible, setIsStickyVisible] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            if (!slug) return;
            
            try {
                // 1. Try fetching from DB
                const { data, error } = await supabase
                    .from("academy_courses")
                    .select("*")
                    .eq("slug", slug)
                    .single();
                
                if (!error && data) {
                    setCourse(data as any);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.warn("DB Course not found, falling back to static:", slug);
            }

            // 2. Fallback to static data
            const staticCourse = getCourseBySlug(slug);
            if (staticCourse) {
                const mapped: Course = {
                    ...staticCourse,
                    price_usd: staticCourse.priceUSD,
                    price_naira: staticCourse.priceNaira,
                    next_cohort_date: staticCourse.nextCohort,
                    what_youll_learn: staticCourse.whatYoullLearn,
                    who_is_it_for: staticCourse.whoIsItFor,
                    learning_outcomes: staticCourse.outcomes,
                    slots_total: staticCourse.slotsTotal,
                    slots_filled: staticCourse.slotsFilled,
                    bonus_description: staticCourse.bonusDescription,
                    image_url: ""
                };
                setCourse(mapped);
            }
            setLoading(false);
        };
        fetchCourse();
    }, [slug]);

    const handleEnroll = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) {
            const returnTo = encodeURIComponent(`${pathname}${search}`);
            window.location.href = `/auth/login?portal=student&returnTo=${returnTo}`;
            return;
        }
        navigate({ pathname: "/apply", search });
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 600) {
                setIsStickyVisible(true);
            } else {
                setIsStickyVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!course) {
        return <Navigate to="/courses" replace />;
    }

    const spotsTotal = course.slots_total || course.slotsTotal || 25;
    const spotsFilled = course.slots_filled || course.slotsFilled || 0;
    const spotsLeft = spotsTotal - spotsFilled;
    const nextCohort = course.next_cohort_date || course.nextCohort || "TBD";

    return (
        <div className="bg-white min-h-screen font-inter">
            
            {/* STICKY CTA */}
            <AnimatePresence>
                {isStickyVisible && (
                    <motion.div 
                        initial={{ y: -100 }}
                        animate={{ y: 0 }}
                        exit={{ y: -100 }}
                        className="fixed top-[72px] left-0 right-0 z-[60] bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm py-4 px-4 hidden md:block"
                    >
                        <div className="container max-w-[1600px] mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 leading-none text-sm">{course.title}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Start: {nextCohort}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-xs font-bold text-slate-500">{spotsLeft} slots left</span>
                                <Button onClick={handleEnroll} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6 h-11 shadow-sm">
                                    Apply Now
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HERO */}
            <section className="pt-24 pb-20 md:pt-32 md:pb-24 px-4 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
                <div className="container max-w-[1600px] mx-auto relative z-10">
                    <Link to="/courses" className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
                    </Link>

                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
                        <div className="flex-grow max-w-[900px]">
                            <div className="flex flex-wrap gap-3 mb-6">
                                <Badge variant="outline" className="bg-white border-slate-100 text-slate-500 font-bold px-3 py-1 rounded-lg text-[10px]">
                                    <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                                    {course.duration}
                                </Badge>
                                <Badge variant="outline" className="bg-white border-slate-100 text-slate-500 font-bold px-3 py-1 rounded-lg text-[10px]">
                                    <Signal className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                                    {course.level}
                                </Badge>
                            </div>

                            <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                                {course.tagline || course.title}
                            </h1>
                            <p className="text-base md:text-xl text-slate-500 mb-10 leading-relaxed font-normal">
                                {course.description}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-12">
                                <Button 
                                    size="lg" 
                                    className="h-14 px-10 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold w-full sm:w-auto shadow-lg shadow-blue-500/10"
                                    onClick={handleEnroll}
                                >
                                    Apply Now
                                </Button>
                                <div className="flex items-center gap-3 px-6 h-14 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm bg-white shadow-sm">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    Next cohort: {nextCohort}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10 border-t border-slate-200">
                                {[
                                    { label: "Outcome", val: course.outcome, icon: Award },
                                    { label: "Level", val: course.level, icon: Signal },
                                    { label: "Network", val: "Verified", icon: Users },
                                    { label: "USD", val: `$${course.price_usd || course.priceUSD}`, icon: Globe }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">{item.label}</span>
                                        <div className="flex items-center gap-2">
                                            <item.icon className="w-4 h-4 text-blue-500 shrink-0" />
                                            <span className="text-xs font-bold text-slate-800 leading-tight">{item.val}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* INFO CARD */}
                        <div className="w-full lg:w-[420px] shrink-0">
                            <div className="sticky top-32">
                                <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm group hover:border-blue-100 transition-colors">
                                    <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider mb-6">Enrollment Status</div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">Accepting Applicants for 2026</h3>
                                    
                                    <div className="space-y-3 mb-8">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Users className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-widest">Cohort Size</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-900">{spotsTotal} seats</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-widest">Availability</span>
                                            </div>
                                            <span className="text-xs font-bold text-blue-600">{spotsLeft} slots left</span>
                                        </div>
                                    </div>

                                    <Button 
                                        className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-md"
                                        onClick={handleEnroll}
                                    >
                                        Apply Now
                                    </Button>
                                    
                                    <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-1 gap-4">
                                        {[
                                            { label: "Live Workshops", icon: Zap },
                                            { label: "Placement Desk", icon: Globe }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                                <item.icon className="w-4 h-4 text-blue-400" />
                                                <span>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CURRICULUM */}
            <section className="py-20 px-4 border-b border-slate-50">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold tracking-widest uppercase mb-6">Program Content</div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">Structured <span className="text-blue-600">Learning Path.</span></h2>
                        <p className="text-base md:text-lg text-slate-500 font-normal max-w-2xl mx-auto">An intensive {course.duration} curriculum focused on high-demand operational skills.</p>
                    </div>
                    <CurriculumAccordion weeks={course.curriculum || []} />
                </div>
            </section>

            {/* WHAT YOU WILL LEARN */}
            <section className="py-20 px-4 bg-slate-50/50 border-b border-slate-100">
                <div className="container max-w-[1600px] mx-auto">
                    <div className="grid lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-12 text-center mb-12">
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">Practical <span className="text-blue-600">Outcomes.</span></h2>
                        </div>
                        
                        <div className="lg:col-span-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(course.what_youll_learn || course.whatYoullLearn || []).map((item, i) => (
                                    <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4">
                                        <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700 leading-snug">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TRANSFORMATION */}
            <section className="py-24 px-4 bg-white border-b border-slate-100">
                <div className="container max-w-[1600px] mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">Professional <span className="text-blue-600">Growth</span></h2>
                        <p className="text-base md:text-lg text-slate-500 mt-4 max-w-2xl mx-auto font-normal">Our graduates achieve verifiable breakthroughs in their operational maturity.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {(course.learning_outcomes || course.outcomes || []).map((outcome, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all flex flex-col h-full">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-6">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <p className="text-base font-bold text-slate-900 leading-snug mb-2">{outcome}</p>
                                <div className="mt-auto text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-4">Program Outcome</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA - START TRANSFORMATION */}
            <section className="py-24 md:py-32 px-4 bg-slate-900 text-white text-center relative overflow-hidden">
                <div className="container max-w-3xl mx-auto relative z-10">
                    <h2 className="text-3xl md:text-6xl font-bold mb-6 tracking-tight">Start your <span className="text-blue-400">transformation.</span></h2>
                    <p className="text-base md:text-lg text-slate-400 mb-12 leading-relaxed font-normal">
                        Join the next cohort of high-performing operations professionals. Limited spots available for the session starting {nextCohort}.
                    </p>
                    <div className="flex flex-col items-center gap-6">
                        <Button 
                            size="lg" 
                            className="h-16 px-12 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold shadow-xl shadow-blue-500/20"
                            onClick={handleEnroll}
                        >
                            Apply Now <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">ONLY {spotsLeft} SEATS REMAINING</p>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default CourseDetail;
