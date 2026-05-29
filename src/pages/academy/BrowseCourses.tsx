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
    has_open_cohort?: boolean;
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
                let fetchedCourses: AcademyCourse[] = [];
                let attempts = 0;
                const maxAttempts = 3;
                
                while (attempts < maxAttempts) {
                    try {
                        const { data, error } = await supabase
                            .from("academy_courses")
                            .select("*")
                            .eq("is_live", true);
                        
                        if (error) throw error;
                        
                        fetchedCourses = (data as AcademyCourse[]) || [];
                        break; // Success, exit loop
                    } catch (err) {
                        attempts++;
                        console.error(`Attempt ${attempts} failed to fetch courses:`, err);
                        if (attempts >= maxAttempts) {
                            console.error("All attempts to fetch courses failed.");
                        } else {
                            // Wait before retrying (exponential backoff)
                            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
                        }
                    }
                }
                
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
                    // Open-cohort courses always first
                    const aOpen = a.has_open_cohort ? 1 : 0;
                    const bOpen = b.has_open_cohort ? 1 : 0;
                    if (aOpen !== bOpen) return bOpen - aOpen;
                    // Then flagship order
                    const aIndex = flagshipSlugs.indexOf(a.slug);
                    const bIndex = flagshipSlugs.indexOf(b.slug);
                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

                setCourses(fetchedCourses);
                
                // Fetch open cohorts and mark courses
                const { data: openCohorts } = await supabase
                    .from('cohorts')
                    .select('course_id')
                    .eq('status', 'open');
                const openCourseIds = new Set((openCohorts || []).map((c: any) => c.course_id));
                fetchedCourses = fetchedCourses.map(course => ({
                    ...course,
                    has_open_cohort: openCourseIds.has(course.id)
                }));
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
        <div className="bg-[#f8f9fc] min-h-screen font-inter pb-20">
            {/* Hero Section */}
            <section className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="max-w-2xl">
                            <motion.h1 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xl font-semibold text-slate-800 tracking-tight"
                            >
                                Browse Programs
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="text-xs text-slate-400 mt-1 font-normal leading-relaxed max-w-lg"
                            >
                                Expert-led programs designed to bridge the gap between academic theory and industry practice in the modern SaaS ecosystem.
                            </motion.p>
                        </div>

                        {/* Current Trend Card */}
                        {flagshipCourse && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white p-4 rounded-xl border border-slate-200/60 w-full md:w-auto md:min-w-[260px] shadow-sm relative overflow-hidden group"
                            >
                                <div className="relative z-10 flex flex-col">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50/60 border border-blue-100/40 px-2 py-0.5 rounded uppercase tracking-wider">Current Trend</span>
                                        <div className="text-sm font-semibold text-blue-600">+24%</div>
                                    </div>
                                    <h3 className="text-xs font-semibold text-slate-700 mt-2 truncate max-w-[200px]">{flagshipCourse.title}</h3>
                                </div>
                                <div className="absolute -bottom-2 -right-2 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <TrendingUp size={48} className="text-blue-600" />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </section>

            {/* Filter Bar */}
            <section className="px-4 sm:px-6 lg:px-8 mb-6">
                <div className="max-w-7xl mx-auto bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-1">
                        <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1.5 lg:pb-0 custom-scrollbar">
                            <div className="flex items-center gap-1 px-1 py-1 text-slate-400 font-semibold text-[10px] uppercase tracking-wider shrink-0">
                                <Filter size={12} /> Filters
                            </div>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={cn(
                                        "px-3.5 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0 whitespace-nowrap",
                                        categoryFilter === cat 
                                        ? "bg-blue-600 text-white shadow-sm" 
                                        : "text-slate-500 bg-slate-50 hover:bg-slate-100/80 border border-transparent"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full sm:w-44 pl-8 pr-3 py-1.5 bg-slate-50/50 text-xs font-medium rounded-lg border border-slate-200/60 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                />
                            </div>
                            
                            <div className="relative flex-1 sm:flex-none">
                                <select 
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                    className="w-full sm:w-auto pl-3 pr-7 py-1.5 bg-slate-50/50 text-slate-600 rounded-lg text-xs font-medium border border-slate-200/60 hover:bg-white transition-all outline-none appearance-none cursor-pointer"
                                >
                                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            <div className="relative flex-1 sm:flex-none">
                                <select 
                                    value={durationFilter}
                                    onChange={(e) => setDurationFilter(e.target.value)}
                                    className="w-full sm:w-auto pl-3 pr-7 py-1.5 bg-slate-50/50 text-slate-600 rounded-lg text-xs font-medium border border-slate-200/60 hover:bg-white transition-all outline-none appearance-none cursor-pointer"
                                >
                                    {durations.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            <button 
                                onClick={() => {setCategoryFilter("All Categories"); setSearchQuery(""); setLevelFilter("All Levels"); setDurationFilter("Any Duration");}}
                                className="text-[11px] font-semibold text-blue-600 hover:underline px-2 whitespace-nowrap w-full sm:w-auto text-center sm:text-left mt-1 sm:mt-0"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Course Grid */}
            <section className="px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {filteredCourses.map((course) => (
                                    <motion.div
                                        key={course.id || course.slug}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="w-full"
                                    >
                                        <CourseCard course={course} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-200/60 shadow-sm max-w-md mx-auto">
                            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <Search className="w-5 h-5 text-slate-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800 mb-1">No courses found</h3>
                            <p className="text-xs text-slate-400 font-normal max-w-xs mx-auto mb-4">Try adjusting your search or filters to find what you're looking for.</p>
                            <Button 
                                variant="outline" 
                                onClick={() => {setCategoryFilter("All Categories"); setSearchQuery(""); setLevelFilter("All Levels"); setDurationFilter("Any Duration");}}
                                className="h-8.5 px-4 rounded-lg font-medium border-slate-200 text-xs text-slate-600 hover:text-slate-800"
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
