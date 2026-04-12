import { useParams, Link, Navigate } from "react-router-dom";
import { getCourseBySlug } from "@/data/academy-courses";
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
    ArrowLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CurriculumAccordion from "@/components/academy/CurriculumAccordion";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TestimonialCard from "@/components/academy/TestimonialCard";

const CourseDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const course = slug ? getCourseBySlug(slug) : undefined;
    const [isStickyVisible, setIsStickyVisible] = useState(false);

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

    if (!course) {
        return <Navigate to="/courses" replace />;
    }

    return (
        <div className="bg-white min-h-screen">
            
            {/* STICKY CTA */}
            <AnimatePresence>
                {isStickyVisible && (
                    <motion.div 
                        initial={{ y: -100 }}
                        animate={{ y: 0 }}
                        exit={{ y: -100 }}
                        className="fixed top-[72px] left-0 right-0 z-[60] bg-white border-b border-slate-100 shadow-md py-4 px-6 hidden md:block"
                    >
                        <div className="container max-w-[1200px] mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 leading-none">{course.title}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Next Cohort: {course.nextCohort}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-slate-500">{course.slotsTotal - course.slotsFilled} slots left</span>
                                <Link to="/apply">
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold px-8">
                                        Enroll Now
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HERO */}
            <section className="pt-12 pb-24 md:pt-20 md:pb-32 px-3 md:px-6 bg-slate-50 border-b border-slate-100 relative overflow-x-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none" />
                
                <div className="container max-w-[1200px] mx-auto relative z-10">
                    <Link to="/courses" className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-12 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Catalog
                    </Link>

                    <div className="flex flex-col lg:flex-row gap-6 md:gap-16 lg:gap-32 items-start">
                        <div className="flex-grow max-w-xl">
                            <div className="flex flex-wrap gap-4 mb-8">
                                <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-bold px-3 py-1">
                                    <Clock className="w-3.5 h-3.5 mr-2 text-blue-600" />
                                    {course.duration}
                                </Badge>
                                <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-bold px-3 py-1">
                                    <Signal className="w-3.5 h-3.5 mr-2 text-blue-600" />
                                    {course.level}
                                </Badge>
                            </div>

                            <h1 className="text-2xl sm:text-3xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-4 md:mb-8 leading-[1.1] tracking-tight">
                                {course.tagline}
                            </h1>
                            <p className="text-xs sm:text-sm md:text-lg lg:text-xl text-slate-600 mb-6 md:mb-12 leading-relaxed font-medium">
                                {course.description}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-16">
                                <Link to="/apply" className="w-full sm:w-auto">
                                    <Button size="lg" className="h-16 px-12 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all font-bold w-full shadow-xl shadow-blue-200">
                                        Enroll Now
                                    </Button>
                                </Link>
                                <div className="flex flex-col justify-center">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Next Cohort</div>
                                    <div className="flex items-center gap-2 px-6 h-12 rounded-full border border-slate-200 text-slate-600 font-bold text-sm bg-white">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        {course.nextCohort}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pb-8 md:pb-12 border-b border-slate-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs md:text-sm text-slate-600 font-medium">Price (Nigeria)</span>
                                    <span className="text-base md:text-lg font-bold text-slate-900">₦{course.priceNaira.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs md:text-sm text-slate-600 font-medium">Price (USD)</span>
                                    <span className="text-base md:text-lg font-bold text-slate-900">${course.priceUSD}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-8 pt-8 md:pt-12 border-t border-slate-200">
                                {[
                                    { label: "Outcome", val: course.outcome, icon: Award },
                                    { label: "Certification", val: "Vetted L1-L3", icon: Shield },
                                    { label: "Community", val: "Vetted Access", icon: Users },
                                    { label: "Ecosystem", val: "Placement Desk", icon: Globe }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col">
                                        <span className="text-[8px] md:text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 md:mb-4">{item.label}</span>
                                        <div className="flex items-center gap-2">
                                            <item.icon className="w-4 md:w-5 h-4 md:h-5 text-blue-600 shrink-0" />
                                            <span className="text-xs md:text-sm font-bold text-slate-900 leading-tight">{item.val}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* INFO CARD */}
                        <div className="w-full lg:w-[550px] shrink-0">
                            <div className="sticky top-32 space-y-3 md:space-y-4">
                                {/* Main CTA Card */}
                                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl md:rounded-3xl overflow-hidden text-white shadow-lg md:shadow-2xl">
                                    <div className="p-4 md:p-8">
                                        <div className="inline-flex items-center gap-2 bg-white/20 backdropblur-sm px-3 py-1 rounded-full mb-4 md:mb-6 border border-white/20">
                                            <Calendar className="w-3 h-3" />
                                            <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">Next Cohort</span>
                                        </div>
                                        
                                        <h3 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 leading-tight">{course.nextCohort}</h3>
                                        <p className="text-blue-100 text-xs md:text-sm font-medium mb-6 md:mb-8">Start your transformation in</p>
                                        
                                        <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                                            {[
                                                { label: "Duration", val: course.duration, icon: Clock },
                                                { label: "Spots Left", val: `${course.slotsTotal - course.slotsFilled}/${course.slotsTotal}`, icon: Users }
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center justify-between bg-white/10 backdrop-blur-sm px-3 md:px-4 py-2 md:py-3 rounded-lg border border-white/10">
                                                    <div className="flex items-center gap-2">
                                                        <item.icon className="w-3 md:w-4 h-3 md:h-4 text-blue-200" />
                                                        <span className="text-[9px] md:text-xs font-semibold text-blue-100 uppercase tracking-wider">{item.label}</span>
                                                    </div>
                                                    <span className="text-xs md:text-sm font-bold text-white">{item.val}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <Link to="/apply">
                                            <Button className="w-full h-10 md:h-12 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-lg md:rounded-xl transition-all text-sm md:text-base">
                                                Enroll Now
                                            </Button>
                                        </Link>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className="px-4 md:px-8 pb-4 md:pb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[8px] md:text-[10px] font-bold text-blue-100 uppercase tracking-widest">Enrollment Progress</span>
                                            <span className="text-[8px] md:text-[10px] font-bold text-blue-100">{Math.round((course.slotsFilled / course.slotsTotal) * 100)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-white" 
                                                style={{ width: `${(course.slotsFilled / course.slotsTotal) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Features Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3">
                                    {[
                                        { label: "Live Workshops", icon: Zap, color: "from-amber-50 to-orange-50" },
                                        { label: "Project Reviews", icon: CheckCircle, color: "from-emerald-50 to-teal-50" },
                                        { label: "Placement Support", icon: Globe, color: "from-purple-50 to-pink-50" }
                                    ].map((item, i) => (
                                        <div key={i} className={`bg-gradient-to-br ${item.color} rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200 hover:border-blue-300 transition-colors`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                                                    <item.icon className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHAT YOU WILL LEARN */}
            <section className="py-16 md:py-24 px-3 md:px-6 border-b border-slate-100 overflow-x-hidden">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="grid lg:grid-cols-12 gap-8 md:gap-16 lg:gap-24">
                        <div className="lg:col-span-5">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-xs font-bold tracking-[0.2em] uppercase mb-6 md:mb-8">Outcome Focused</div>
                            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 md:mb-8 tracking-tight">Go from Theory to <span className="text-blue-600">Operational Excellence.</span></h2>
                            <p className="text-base md:text-lg lg:text-xl text-slate-600 leading-relaxed font-medium mb-8 md:mb-12">
                                This is not a lecture series. It is a build-and-learn intensive where you develop real-world outcomes that clients pay for.
                            </p>
                            <div className="p-6 md:p-8 bg-blue-50/50 rounded-2xl md:rounded-3xl border border-blue-100/50">
                                <h4 className="font-bold text-blue-900 mb-4">Core Skills Gained:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {course.tools.map(tool => (
                                        <span key={tool} className="px-4 py-2 bg-white border border-blue-100 text-blue-600 text-xs font-bold rounded-xl shadow-sm">
                                            {tool}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-7 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-x-12 md:gap-y-10">
                                {course.whatYoullLearn.map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1">
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                            </div>
                                        </div>
                                        <p className="text-base font-bold text-slate-700 leading-relaxed">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CURRICULUM */}
            <section className="py-16 md:py-24 px-3 md:px-6 bg-slate-50 border-b border-slate-100 overflow-x-hidden">
                <div className="container max-w-[800px] mx-auto px-0">
                    <div className="text-center mb-12 md:mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-bold tracking-[0.2em] uppercase mb-4 md:mb-6">Course Path</div>
                        <h2 className="text-2xl md:text-4xl lg:text-6xl font-black text-slate-900 mb-4 md:mb-6 tracking-tight">How we get <span className="text-blue-600">Results</span></h2>
                        <p className="text-base md:text-lg lg:text-xl text-slate-500 font-medium tracking-tight">A structured {course.duration} journey from day one to placement.</p>
                    </div>

                    <CurriculumAccordion weeks={course.curriculum} />
                </div>
            </section>

            {/* WHO IT''S FOR */}
            <section className="py-16 md:py-24 px-3 md:px-6 border-b border-slate-100 overflow-x-hidden">
                <div className="container max-w-[1200px] mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-12 md:mb-16 tracking-tight">Is this for <span className="text-blue-600">You?</span></h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {course.whoIsItFor.map((item, i) => (
                            <div key={i} className="bg-white p-4 md:p-10 rounded-2xl md:rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-10 md:w-14 h-10 md:h-14 rounded-lg md:rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 md:mb-8">
                                    <Users className="w-7 h-7 text-slate-400" />
                                </div>
                                <p className="text-sm md:text-base font-bold text-slate-800 leading-relaxed">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* MACBOOK BONUS (Flagship Only) */}
            <section className="py-12 md:py-24 px-3 md:px-6 bg-slate-900 text-white overflow-x-hidden relative">
                <div className="absolute inset-0 bg-blue-600/10 blur-[150px] pointer-events-none" />
                
                <div className="container max-w-[1100px] mx-auto relative z-10">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl md:rounded-3xl lg:rounded-[40px] p-4 md:p-12 lg:p-20 overflow-hidden relative">
                        <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-8 lg:gap-24">
                            <div className="lg:w-3/5 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-full text-[9px] md:text-[11px] font-bold tracking-[0.2em] uppercase mb-4 md:mb-8">Special Incentive</div>
                                <h2 className="text-xl md:text-3xl lg:text-5xl font-bold mb-4 md:mb-8 leading-tight tracking-tight">
                                    The <span className="text-blue-400">OPSly Excellence</span> Reward.
                                </h2>
                                <p className="text-xs md:text-base lg:text-xl text-slate-400 mb-0 leading-relaxed font-medium">
                                    {course.bonusDescription}
                                </p>
                            </div>
                            <div className="lg:w-2/5 shrink-0 hidden md:flex items-center justify-center">
                                <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl bg-slate-800">
                                    <img 
                                        src="https://images.unsplash.com/photo-1517336714202-a83bb0270b6f?auto=format&fit=crop&q=80" 
                                        alt="MacBook Air" 
                                        loading="lazy"
                                        className="w-full h-full object-cover object-center"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
                                        <div className="text-5xl md:text-6xl font-bold mb-2">M2</div>
                                        <div className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">MacBook Air</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* OUTCOMES */}
            <section className="py-16 md:py-24 px-3 md:px-6 bg-slate-50 border-b border-slate-100 overflow-x-hidden">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-center mb-12 md:mb-20 animate-slide-up">
                        <h2 className="text-2xl md:text-4xl lg:text-6xl font-black text-slate-900 mb-4 md:mb-8 leading-tight tracking-tight">
                            Your Graduation <span className="text-blue-600">Transformation</span>
                        </h2>
                        <p className="text-xs md:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
                            Once you finish, you don''t just have a certificate. You have a new career trajectory.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                        {course.outcomes.map((outcome, i) => (
                            <div key={i} className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl border border-slate-100 flex items-start gap-4 md:gap-6 group hover:border-blue-200 transition-colors">
                                <div className="w-8 md:w-12 h-8 md:h-12 rounded-lg md:rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                    <TrendingUp className="w-4 md:w-6 h-4 md:h-6 border" />
                                </div>
                                <div>
                                    <p className="text-sm md:text-lg font-bold text-slate-900 leading-tight mb-1 md:mb-2">{outcome}</p>
                                    <div className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Outcome</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-16 md:py-24 px-3 md:px-6 bg-white overflow-x-hidden">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-center mb-12 md:mb-20 animate-slide-up">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 md:mb-6 leading-tight tracking-tight">
                            Meet our <span className="text-blue-600">Alumni</span>
                        </h2>
                        <p className="text-xs md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            Meet the professionals who have already completed this path and are now working globally.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                        {course.testimonials.map((testimonial, i) => (
                            <TestimonialCard key={i} testimonial={testimonial} />
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-16 md:py-24 px-3 md:px-6 bg-slate-900 text-white text-center overflow-x-hidden">
                <div className="container max-w-[800px] mx-auto">
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-8 tracking-tight">Start Your <span className="text-blue-400">Career Transformation</span></h2>
                    <p className="text-base md:text-lg lg:text-xl text-slate-400 mb-8 md:mb-12 leading-relaxed font-medium">
                        Applications for the May 2026 cohort are currently open. Secure your slot and start building high-income operational skills.
                    </p>
                    <Link to="/apply">
                        <Button size="lg" className="h-12 md:h-16 px-8 md:px-16 text-base md:text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all font-bold shadow-xl md:shadow-2xl shadow-blue-900/40">
                            Apply to {course.title}
                        </Button>
                    </Link>
                    <p className="mt-6 md:mt-8 text-xs md:text-sm font-semibold text-slate-500 tracking-wide">ONLY {course.slotsTotal - course.slotsFilled} SLOTS AVAILABLE FOR THIS COHORT</p>
                </div>
            </section>

        </div>
    );
};

export default CourseDetail;
