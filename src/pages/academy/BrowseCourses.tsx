import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ACADEMY_COURSES } from "@/data/academy-courses";
import CourseCard from "@/components/academy/CourseCard";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const BrowseCourses = () => {
    const [dbCourses, setDbCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const { search } = useLocation();

    const levels = ["All", "Beginner", "Intermediate"];

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const { data, error } = await supabase
                    .from("academy_courses")
                    .select("*")
                    .eq("is_live", true)
                    .order("created_at", { ascending: false });
                
                if (!error && data) {
                    setDbCourses(data);
                }
            } catch (err) {
                console.error("Failed to fetch courses from DB:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    // HYBRID MERGE LOGIC
    const hybridCourses = [
        ...dbCourses,
        ...ACADEMY_COURSES.filter(sc => !dbCourses.some(dc => dc.slug === sc.slug))
    ];

    const filteredCourses = hybridCourses.filter(course => {
        const matchesFilter = filter === "All" || course.level === filter;
        const title = course.title || "";
        const desc = course.description || "";
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              desc.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen font-inter">
            {/* Header */}
            <section className="pt-24 md:pt-32 pb-16 md:pb-24 bg-slate-50 border-b border-slate-100 px-3 md:px-6">
                <div className="container max-w-[1600px] mx-auto">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6">Course Catalog</div>
                        <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">The Modern Operations <span className="text-blue-600">Curriculum</span></h1>
                        <p className="text-base md:text-xl text-slate-500 font-normal leading-relaxed max-w-2xl">
                            Practical, tool-driven programs designed to turn you into a world-class remote operations professional.
                        </p>
                    </div>
                </div>
            </section>

            {/* Filter & Search Bar */}
            <section className="sticky top-[72px] z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 md:py-6 px-3 md:px-6">
                <div className="container max-w-[1600px] mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                        {/* Tabs */}
                        <div className="flex p-1 bg-slate-100/50 rounded-xl w-full md:w-auto">
                            {levels.map(level => (
                                <button
                                    key={level}
                                    onClick={() => setFilter(level)}
                                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                        filter === level 
                                        ? "bg-white text-blue-600 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-900"
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                type="text"
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-12 border-slate-100 rounded-xl focus:ring-blue-600 bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="py-12 md:py-20 px-3 md:px-6">
                <div className="container max-w-[1600px] mx-auto">
                    {filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            <AnimatePresence mode="popLayout">
                                {filteredCourses.map((course) => (
                                    <motion.div
                                        key={course.id || course.slug}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="w-full"
                                    >
                                        <Link to={{ pathname: `/courses/${course.slug}`, search }} className="block h-full w-full">
                                            <CourseCard course={course} />
                                        </Link>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="py-32 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                                <Search className="w-6 h-6 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No courses found</h3>
                            <p className="text-slate-500 font-normal max-w-xs mx-auto mb-8 text-sm">Try adjusting your search or filters to find what you're looking for.</p>
                            <Button 
                                variant="outline" 
                                onClick={() => {setFilter("All"); setSearchQuery("");}}
                                className="h-11 px-6 rounded-lg font-bold border-slate-200 text-xs"
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-20 px-3 md:px-6">
                <div className="container max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-16 text-center relative overflow-hidden group shadow-sm">
                        <div className="absolute top-0 left-0 w-full h-full bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">Not finding what you need?</h2>
                            <p className="text-sm md:text-lg text-slate-500 mb-10 leading-relaxed font-normal">
                                Our cohorts fill up fast. Sign up for the next announcement or request a specific learning path that fits your career goals.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link to={{ pathname: "/apply", search }}>
                                    <Button size="lg" className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold shadow-lg shadow-blue-500/10 text-sm">
                                        Apply for Next Cohort <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                                <a href="mailto:academy@opslyhr.com" className="h-14 px-10 flex items-center justify-center text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold transition-all text-sm">
                                    Contact Admissions
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default BrowseCourses;
