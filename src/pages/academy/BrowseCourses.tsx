import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import CourseCard from "@/components/academy/CourseCard";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Search, Loader2, Bell, HelpCircle, ChevronDown, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface AcademyCourse {
    id: string;
    slug: string;
    title: string;
    description: string;
    level: string;
    duration: string;
    outcome?: string;
    image_url: string;
    price_usd: number;
    price_naira: number;
    category: string;
    is_flagship?: boolean;
    created_at: string;
}

const BrowseCourses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<AcademyCourse[]>([]);
    const [flagshipCourse, setFlagshipCourse] = useState<AcademyCourse | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [categoryFilter, setCategoryFilter] = useState("All Categories");
    const [levelFilter, setLevelFilter] = useState("All Levels");
    const [durationFilter, setDurationFilter] = useState("Any Duration");
    const [searchQuery, setSearchQuery] = useState("");
    
    const [categories, setCategories] = useState<string[]>(["All Categories"]);
    const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];
    const durations = ["Any Duration", "< 4 Weeks", "4-8 Weeks", "8+ Weeks"];

    const { search } = useLocation();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const { data, error } = await supabase
                    .from("academy_courses")
                    .select("*")
                    .eq("is_live", true);
                
                if (error) {
                    console.error("Failed to fetch courses:", error);
                }
                
                let fetchedCourses = (data as AcademyCourse[]) || [];
                
                // Set flagship for the "Current Trend" card
                const flagship = fetchedCourses.find(c => c.is_flagship) || fetchedCourses[0];
                setFlagshipCourse(flagship || null);

                // Prioritize the 4 flagship courses for the grid
                const flagshipSlugs = [
                    'ai-automation-for-operations',
                    'virtual-assistant-operations',
                    'social-media-management',
                    'client-acquisition-for-operators'
                ];
                
                fetchedCourses.sort((a, b) => {
                    const aIndex = flagshipSlugs.indexOf(a.slug);
                    const bIndex = flagshipSlugs.indexOf(b.slug);
                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

                setCourses(fetchedCourses);
                
                // Extract dynamic categories
                const extractedCategories = Array.from(new Set(fetchedCourses.map(c => c.category).filter(Boolean))) as string[];
                setCategories(["All Categories", ...extractedCategories]);

            } catch (err) {
                console.error("Failed to fetch courses from DB:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const filteredCourses = courses.filter(course => {
        const matchesCategory = categoryFilter === "All Categories" || (course.category && course.category.includes(categoryFilter));
        const title = course.title || "";
        const desc = course.description || "";
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              desc.toLowerCase().includes(searchQuery.toLowerCase());
                              
        const matchesLevel = levelFilter === "All Levels" || course.level === levelFilter;
        
        let matchesDuration = true;
        if (durationFilter !== "Any Duration" && course.duration) {
            const weeksMatch = course.duration.match(/(\d+)/);
            if (weeksMatch) {
                const weeks = parseInt(weeksMatch[1], 10);
                if (durationFilter === "< 4 Weeks") matchesDuration = weeks < 4;
                else if (durationFilter === "4-8 Weeks") matchesDuration = weeks >= 4 && weeks <= 8;
                else if (durationFilter === "8+ Weeks") matchesDuration = weeks > 8;
            }
        }

        return matchesCategory && matchesSearch && matchesLevel && matchesDuration;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    const userInitials = user?.user_metadata?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || "S";

    return (
        <div className="bg-white min-h-screen font-inter pb-20">
            {/* Hero Section */}
            <section className="py-12 md:py-20 px-6 overflow-hidden">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                        <div className="max-w-2xl space-y-6">
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight"
                            >
                                Browse Courses
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-base md:text-lg text-slate-500 font-medium leading-relaxed max-w-xl"
                            >
                                Expert-led programs designed to bridge the gap between academic theory and industry practice in the modern SaaS ecosystem.
                            </motion.p>
                        </div>

                        {/* Current Trend Card */}
                        {flagshipCourse && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-blue-50/50 p-5 md:p-6 rounded-[24px] md:rounded-[2rem] border border-blue-100/50 w-full md:w-auto md:min-w-[280px] mt-6 lg:mt-0 relative overflow-hidden group"
                            >
                                <div className="relative z-10">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-2">Current Trend</span>
                                    <h3 className="text-xl font-bold text-slate-800 mb-1">{flagshipCourse.title}</h3>
                                    <div className="text-2xl font-bold text-blue-600">+24%</div>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <TrendingUp size={64} className="text-blue-600" />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </section>

            {/* Filter Bar */}
            <section className="px-6 mb-12">
                <div className="max-w-[1400px] mx-auto bg-white p-2 md:p-3 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-4 p-1">
                        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 custom-scrollbar mask-edges">
                            <div className="flex items-center gap-1.5 px-2 py-2 text-slate-400 font-bold text-xs uppercase tracking-widest shrink-0">
                                <Filter size={14} /> Filters
                            </div>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={cn(
                                        "px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold transition-all active:scale-95 shrink-0 whitespace-nowrap",
                                        categoryFilter === cat 
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                                        : "text-slate-500 bg-slate-50/50 hover:bg-slate-100 border border-transparent"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
                            <div className="relative w-full sm:w-auto mb-2 sm:mb-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full sm:w-48 pl-9 pr-4 py-2.5 bg-slate-50 text-sm font-medium rounded-xl md:rounded-2xl border border-slate-100 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                />
                            </div>
                            
                            <div className="relative flex-1 sm:flex-none">
                                <select 
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                    className="w-full sm:w-auto pl-4 pr-8 py-2.5 bg-slate-50 text-slate-600 rounded-xl md:rounded-2xl text-xs font-bold border border-slate-100 hover:bg-white transition-all outline-none appearance-none cursor-pointer"
                                >
                                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            <div className="relative flex-1 sm:flex-none">
                                <select 
                                    value={durationFilter}
                                    onChange={(e) => setDurationFilter(e.target.value)}
                                    className="w-full sm:w-auto pl-4 pr-8 py-2.5 bg-slate-50 text-slate-600 rounded-xl md:rounded-2xl text-xs font-bold border border-slate-100 hover:bg-white transition-all outline-none appearance-none cursor-pointer"
                                >
                                    {durations.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            <button 
                                onClick={() => {setCategoryFilter("All Categories"); setSearchQuery(""); setLevelFilter("All Levels"); setDurationFilter("Any Duration");}}
                                className="text-[11px] md:text-xs font-bold text-blue-600 hover:underline px-2 md:px-4 whitespace-nowrap mt-2 sm:mt-0 w-full sm:w-auto text-center sm:text-left"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Course Grid */}
            <section className="px-6">
                <div className="max-w-[1400px] mx-auto">
                    {filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
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
                                        <CourseCard course={course} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="py-32 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                                <Search className="w-6 h-6 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No courses found</h3>
                            <p className="text-slate-500 font-normal max-w-xs mx-auto mb-8 text-sm">Try adjusting your search or filters to find what you're looking for.</p>
                            <Button 
                                variant="outline" 
                                onClick={() => {setCategoryFilter("All Categories"); setSearchQuery("");}}
                                className="h-11 px-6 rounded-xl font-bold border-slate-200 text-xs"
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

// Simple TrendingUp icon since it wasn't in original imports
const TrendingUp = ({ size, className }: { size: number; className: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export default BrowseCourses;
