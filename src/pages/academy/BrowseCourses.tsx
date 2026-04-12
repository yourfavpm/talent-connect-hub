import { useState } from "react";
import { ACADEMY_COURSES } from "@/data/academy-courses";
import CourseCard from "@/components/academy/CourseCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const BrowseCourses = () => {
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const levels = ["All", "Beginner", "Intermediate"];

    const filteredCourses = ACADEMY_COURSES.filter(course => {
        const matchesFilter = filter === "All" || course.level === filter;
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              course.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="bg-white min-h-screen">
            {/* Header */}
            <section className="pt-16 md:pt-20 pb-12 md:pb-16 bg-slate-50 border-b border-slate-100 px-3 md:px-6">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-xs font-bold tracking-[0.2em] uppercase mb-8">Course Catalog</div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-slate-900 mb-4 md:mb-8 tracking-tight">The Modern Operations <span className="text-blue-600">Curriculum</span></h1>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 font-medium leading-relaxed">
                            Practical, tool-driven programs designed to turn you into a world-class remote operations professional.
                        </p>
                    </div>
                </div>
            </section>

            {/* Filter & Search Bar */}
            <section className="sticky top-[72px] z-40 bg-white border-b border-slate-100 py-3 md:py-4 px-3 md:px-6">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
                        {/* Tabs */}
                        <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto">
                            {levels.map(level => (
                                <button
                                    key={level}
                                    onClick={() => setFilter(level)}
                                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
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
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                type="text"
                                placeholder="Search skills or roles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 border-slate-200 rounded-xl focus:ring-blue-600"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="py-12 md:py-20 px-3 md:px-6">
                <div className="container max-w-[1200px] mx-auto">
                    {filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                            <AnimatePresence mode="popLayout">
                                {filteredCourses.map((course) => (
                                    <motion.div
                                        key={course.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <CourseCard course={course} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="py-24 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-6 h-6 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No courses found</h3>
                            <p className="text-slate-500 font-medium">Try adjusting your search or filters.</p>
                            <Button 
                                variant="link" 
                                onClick={() => {setFilter("All"); setSearchQuery("");}}
                                className="mt-4 text-blue-600 font-bold"
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-16 md:py-24 px-3 md:px-6 bg-slate-900 text-white text-center">
                <div className="container max-w-[800px] mx-auto">
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-8 tracking-tight">Not finding what you need?</h2>
                    <p className="text-base md:text-lg lg:text-xl text-slate-400 mb-6 md:mb-12 leading-relaxed font-medium">
                        Our cohorts fill up fast. Sign up for the next announcement or request a specific learning path.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                        <Link to="/apply">
                            <Button size="lg" className="h-12 md:h-14 px-6 md:px-10 text-sm md:text-base bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all font-semibold shadow-lg md:shadow-xl shadow-blue-900/40">
                                Apply for Next Cohort
                            </Button>
                        </Link>
                        <a href="mailto:academy@opslyhr.com" className="h-12 md:h-14 px-6 md:px-10 flex items-center justify-center text-white border border-white/20 hover:bg-white/5 rounded-full font-semibold transition-all text-sm md:text-base">
                            Contact Admissions
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default BrowseCourses;
