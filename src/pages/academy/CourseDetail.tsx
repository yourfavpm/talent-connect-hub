import { useParams, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
    Globe,
    TrendingUp,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Monitor,
    Smile,
    Quote as QuoteIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CurriculumAccordion from "@/components/academy/CurriculumAccordion";
import type { CurriculumWeek } from "@/components/academy/CurriculumAccordion";
import TestimonialCard from "@/components/academy/TestimonialCard";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CourseDetailProps {
    inlineSlug?: string;
    onBack?: () => void;
    onEnroll?: (slug: string) => void;
}

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
    curriculum: CurriculumWeek[];
    who_is_it_for: string[];
    bonus_description?: string;
    slots_total: number;
    slots_filled: number;
    next_cohort_date: string;
    marketplace_readiness?: string[];
    final_project?: {
        title: string;
        requirements: string[];
    };
    testimonials?: any[];
}

const CourseDetail = ({ inlineSlug, onBack, onEnroll }: CourseDetailProps) => {
    const params = useParams<{ slug: string }>();
    const { search, pathname } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const slug = inlineSlug || params.slug;
    
    const [course, setCourse] = useState<Course | null>(null);
    const [openCohorts, setOpenCohorts] = useState<any[]>([]);
    const [userEnrollment, setUserEnrollment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isStickyVisible, setIsStickyVisible] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            if (!slug) return;
            
            try {
                const { data, error } = await supabase
                    .from("academy_courses")
                    .select("*")
                    .eq("slug", slug)
                    .single();
                
                if (!error && data) {
                    setCourse(data as any);
                    
                    // Admin cohort status is the source of truth for public enrollment availability.
                    const { data: cohortsData } = await supabase
                         .from("cohorts")
                         .select("*")
                         .or(`course_id.eq.${data.id},course_id.eq.${data.slug},course_uuid.eq.${data.id}`)
                         .eq("status", "open")
                         .order("start_date", { ascending: true });
                         
                    if (cohortsData) {
                        const availableCohorts = cohortsData.filter(c => (c.current_slots || 0) < (c.max_slots || 25));
                        setOpenCohorts(availableCohorts);
                    }

                    // Check if user is already enrolled (cohort-based)
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: enrollData } = await supabase
                            .from("academy_enrollments")
                            .select("*")
                            .eq("student_id", user.id)
                            .eq("course_id", data.slug)
                            .eq("enrollment_status", "active")
                            .not("cohort_id", "is", null)
                            .maybeSingle();
                        
                        if (enrollData) setUserEnrollment(enrollData);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch course:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [slug]);

    const isEnrolling = openCohorts.length > 0;
    const isEnrolled = !!userEnrollment;
    const buttonText = isEnrolled ? "Go to Program Hub" : isEnrolling ? "Enroll Now" : "Enrollment Closed";

    const handleEnroll = (e: React.MouseEvent) => {
        e.preventDefault();
        
        if (isEnrolled) {
            navigate(`/courses/${course?.slug}/learn`);
            return;
        }

        if (!isEnrolling) return;
        
        if (onEnroll && slug) {
            onEnroll(slug);
            return;
        }

        // Direct to checkout. 
        navigate(`/checkout/${course?.slug}`);
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
        return <Navigate to="/browse" replace />;
    }

    const nextCohortData = openCohorts[0];
    const spotsTotal = nextCohortData?.max_slots || course.slots_total || 25;
    const spotsFilled = nextCohortData?.current_slots || course.slots_filled || 0;
    const spotsLeft = spotsTotal - spotsFilled;
    const nextCohort = nextCohortData 
        ? new Date(nextCohortData.start_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
        : "TBD";
    const durationWeeks = nextCohortData?.duration_weeks || course.duration || "4 Weeks";

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
                                <Button 
                                    onClick={handleEnroll} 
                                    disabled={!isEnrolling}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6 h-11 shadow-sm disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500"
                                >
                                    {buttonText}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HERO */}
            <section className="pt-24 pb-20 md:pt-32 md:pb-24 px-4 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
                <div className="container max-w-[1600px] mx-auto relative z-10">
                    {onBack ? (
                        <button onClick={onBack} className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 hover:text-blue-600 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                        </button>
                    ) : (
                        <Link to="/browse" className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 hover:text-blue-600 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
                        </Link>
                    )}

                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
                        <div className="flex-grow max-w-[900px]">
                            <div className="flex flex-wrap gap-3 mb-6">
                                <Badge variant="outline" className="bg-white border-slate-100 text-slate-500 font-bold px-3 py-1 rounded-lg text-[10px]">
                                    <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                                    {durationWeeks} {typeof durationWeeks === 'number' ? 'Weeks' : ''}
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
                                    disabled={!isEnrolling}
                                    className="h-14 px-10 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold w-full sm:w-auto shadow-lg shadow-blue-500/10 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500"
                                    onClick={handleEnroll}
                                >
                                    {buttonText}
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
                                    { label: "USD", val: `$${course.price_usd}`, icon: Globe }
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
                                <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm group hover:border-slate-300 transition-all duration-300">
                                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-blue-50/60 text-blue-600 border border-blue-100/40 rounded text-[9px] font-bold uppercase tracking-wider mb-4">Enrollment Status</div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-5 tracking-tight leading-tight">Accepting Applicants for 2026</h3>
                                    
                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl">
                                            <div className="flex items-center gap-2.5 text-slate-500">
                                                <Users className="w-4 h-4 text-slate-400" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Cohort Size</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-800">{spotsTotal} seats</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl">
                                            <div className="flex items-center gap-2.5 text-slate-500">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Availability</span>
                                            </div>
                                            <span className="text-xs font-bold text-blue-600">{spotsLeft} slots left</span>
                                        </div>
                                    </div>

                                    <Button 
                                        disabled={!isEnrolling}
                                        className="w-full h-12 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500"
                                        onClick={handleEnroll}
                                    >
                                        {buttonText}
                                    </Button>
                                    
                                    <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 gap-3.5">
                                        {[
                                            { label: "Live Workshops", icon: Zap },
                                            { label: "Placement Desk", icon: Globe }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
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
                        <p className="text-base md:text-lg text-slate-500 font-normal max-w-2xl mx-auto">An intensive {durationWeeks} {typeof durationWeeks === 'number' ? 'weeks' : ''} curriculum focused on high-demand operational skills.</p>
                    </div>
                    <CurriculumAccordion weeks={course.curriculum || []} />
                </div>
            </section>

            {/* TOOLS MASTERED */}
            {course.tools && course.tools.length > 0 && (
                <section className="py-20 px-4 bg-white border-b border-slate-100">
                    <div className="container max-w-[1200px] mx-auto">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold tracking-widest uppercase mb-6">The Stack</div>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">Tools You'll <span className="text-emerald-500">Master.</span></h2>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            {(course.tools || []).map((tool, i) => (
                                <div key={i} className="px-5 py-3 bg-white rounded-xl border border-slate-200/60 flex items-center gap-2.5 group hover:border-emerald-500/20 hover:shadow-sm transition-all duration-300 shadow-xs">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/30">
                                        <Monitor className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-slate-700 text-sm">{tool}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* WHO IS THIS FOR */}
            {course.who_is_it_for && course.who_is_it_for.length > 0 && (
                <section className="py-20 px-4 bg-slate-50/30 border-b border-slate-100">
                    <div className="container max-w-[1200px] mx-auto">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="lg:w-1/2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold tracking-widest uppercase mb-6">Ideal Candidates</div>
                                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-8 tracking-tight">Who Is This <span className="text-blue-600">For?</span></h2>
                                <div className="space-y-3">
                                    {(course.who_is_it_for || []).map((item, i) => (
                                        <div key={i} className="flex items-start gap-3.5 p-4 bg-white rounded-xl border border-slate-200/60 shadow-xs">
                                            <div className="w-5.5 h-5.5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 border border-blue-100/30">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            </div>
                                            <p className="text-slate-600 font-medium text-sm leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:w-1/2 bg-blue-600 rounded-xl p-8 text-white relative overflow-hidden hidden lg:block shadow-md">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full" />
                                <div className="relative z-10">
                                    <Smile className="w-12 h-12 mb-6 text-blue-200" />
                                    <h3 className="text-2xl font-bold mb-4 tracking-tight">Built for Africa's Next-Gen Talent.</h3>
                                    <p className="text-blue-100 text-sm leading-relaxed">We design our programs specifically for ambitious professionals ready to compete in the global remote work economy.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* WHAT YOU WILL LEARN */}
            <section className="py-20 px-4 bg-slate-50/50 border-b border-slate-100">
                <div className="container max-w-[1600px] mx-auto">
                    <div className="grid lg:grid-cols-12 gap-16 items-start">
                        <div className="lg:col-span-8">
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-12">Practical <span className="text-blue-600">Outcomes.</span></h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(course.what_youll_learn || []).map((item, i) => (
                                    <div key={i} className="bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-xs flex items-start gap-3 hover:border-slate-300 transition-all duration-300">
                                        <div className="shrink-0 w-7.5 h-7.5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/30">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                        </div>
                                        <p className="text-[13px] font-semibold text-slate-600 leading-snug">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {course.final_project && (
                            <div className="lg:col-span-4">
                                <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden shadow-lg h-full border border-slate-800/80">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px]" />
                                    <div className="relative z-10">
                                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[9px] font-bold tracking-widest uppercase mb-5">Capstone Project</div>
                                        <h3 className="text-lg font-bold mb-3">{course.final_project.title}</h3>
                                        <p className="text-slate-400 text-xs mb-6 font-medium">To graduate and access the marketplace, you must complete and present this system.</p>
                                        
                                        <div className="space-y-3">
                                            {(course.final_project?.requirements || []).map((req, i) => (
                                                <div key={i} className="flex items-start gap-2.5">
                                                    <div className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    <span className="text-xs text-slate-300 font-medium">{req}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* MARKETPLACE READY */}
            {course.marketplace_readiness && (
                <section className="py-16 px-4 bg-white border-b border-slate-100">
                    <div className="container max-w-[1600px] mx-auto">
                        <div className="bg-blue-600 rounded-xl p-8 md:p-12 text-white relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent" />
                            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
                                <div className="flex-1">
                                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-white/20 border border-white/10 rounded text-[9px] font-bold tracking-widest uppercase mb-5">Marketplace Ready</div>
                                    <h2 className="text-2xl md:text-4xl font-bold mb-4 tracking-tight">Your bridge to <span className="text-blue-100">global work.</span></h2>
                                    <p className="text-sm text-blue-50 mb-8 max-w-xl">Every student exits with more than just skills. We prepare you to be an elite professional in the OPSly marketplace.</p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        {(course.marketplace_readiness || []).map((item, i) => (
                                            <div key={i} className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
                                                <CheckCircle className="w-4 h-4 text-blue-200 shrink-0" />
                                                <span className="text-xs font-bold">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-full lg:w-64 h-64 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
                                    <div className="text-center p-6">
                                        <Globe className="w-12 h-12 text-white/50 mx-auto mb-3" />
                                        <div className="text-xs font-bold opacity-80 uppercase tracking-widest">Global Placement</div>
                                        <div className="mt-2 text-[11px] font-medium opacity-60">Prioritized matching for program graduates</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* TRANSFORMATION */}
            <section className="py-24 px-4 bg-white border-b border-slate-100">
                <div className="container max-w-[1600px] mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">Professional <span className="text-blue-600">Growth</span></h2>
                        <p className="text-base md:text-lg text-slate-500 mt-4 max-w-2xl mx-auto font-normal">Our graduates achieve verifiable breakthroughs in their operational maturity.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(course.learning_outcomes || []).map((outcome, i) => (
                            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200/60 group hover:border-blue-500/20 transition-all duration-300 flex flex-col h-full shadow-xs">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-4 border border-blue-100/30">
                                    <TrendingUp className="w-5 h-5 text-blue-500" />
                                </div>
                                <p className="text-sm font-bold text-slate-800 leading-snug mb-2">{outcome}</p>
                                <div className="mt-auto text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-50">Program Outcome</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            {course.testimonials && course.testimonials.length > 0 && (
                <section className="py-24 px-4 bg-slate-50/50">
                    <div className="container max-w-[1600px] mx-auto">
                        <div className="text-center mb-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white text-blue-600 rounded-lg text-[10px] font-bold tracking-widest uppercase mb-6 shadow-sm">Success Stories</div>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">From Learning to <span className="text-blue-600">Earning.</span></h2>
                            <p className="text-base md:text-lg text-slate-500 font-normal max-w-2xl mx-auto">Hear from graduates who transformed their careers through this program.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(course.testimonials || []).map((t, i) => (
                                <TestimonialCard key={i} testimonial={t} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

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
                            disabled={!isEnrolling}
                            className="h-16 px-12 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500"
                            onClick={handleEnroll}
                        >
                            {buttonText} {isEnrolling && <ArrowRight className="w-5 h-5 ml-2" />}
                        </Button>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">ONLY {spotsLeft} SEATS REMAINING</p>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default CourseDetail;
