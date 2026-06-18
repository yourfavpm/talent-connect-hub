import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
    BookOpen, 
    Plus, 
    Edit, 
    Trash2, 
    ExternalLink, 
    Search,
    Filter,
    Loader2,
    ArrowRight,
    Ticket,
    Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getInternalPath } from "@/utils/subdomain";
import CreateCourseModal from "@/components/admin/Academy/CreateCourseModal";
import CourseCouponsModal from "@/components/admin/Academy/CourseCouponsModal";
import { getZoneUrl, Zone } from "@/utils/subdomain";

interface Course {
    id: string;
    title: string;
    slug: string;
    price_naira: number;
    price_usd: number;
    is_live: boolean;
    level: string;
    category: string;
    created_at: string;
}

const CourseManagement = () => {
    const { toast } = useToast();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Course create/edit modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);

    // Coupon modal state
    const [couponModalOpen, setCouponModalOpen] = useState(false);
    const [couponCourseSlug, setCouponCourseSlug] = useState<string | null>(null);
    const [couponCourseTitle, setCouponCourseTitle] = useState("");

    const openCouponModal = (slug: string | null, title: string) => {
        setCouponCourseSlug(slug);
        setCouponCourseTitle(title);
        setCouponModalOpen(true);
    };

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("academy_courses")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setCourses(data || []);
        } catch (err) {
            console.error("Error fetching courses:", err);
            toast({
                title: "Error",
                description: "Failed to load courses.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this course? This action is permanent.")) return;
        
        try {
            const { error } = await supabase
                .from("academy_courses")
                .delete()
                .eq("id", id);
            
            if (error) throw error;
            toast({ title: "Deleted", description: "Course removed successfully." });
            fetchCourses();
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete course.", variant: "destructive" });
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 lg:p-8 bg-[#f8f9fc] min-h-screen font-inter">
            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academy Course Hub</h1>
                        <p className="text-slate-500 font-medium text-xs mt-1">Manage your dynamic course catalog and learning content.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => openCouponModal(null, "All Courses")}
                            variant="outline"
                            className="h-10 px-4 rounded-xl font-bold text-xs gap-2 border-slate-200 text-violet-600 hover:bg-violet-50 hover:border-violet-200 transition-all"
                        >
                            <Globe className="w-4 h-4" /> Global Coupons
                        </Button>
                        <Button 
                            onClick={() => {
                                setSelectedCourse(null);
                                setIsModalOpen(true);
                            }}
                            className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs gap-2 shadow-xs transition-all"
                        >
                            <Plus className="w-4 h-4" /> Create New Course
                        </Button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm mb-8 flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-grow w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search courses by title..." 
                            className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 transition-all font-medium text-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2.5 w-full md:w-auto">
                        <Button variant="outline" className="h-10 px-4 rounded-lg border-slate-200 font-bold gap-2 text-slate-600 text-xs">
                            <Filter className="w-3.5 h-3.5" /> Categories
                        </Button>
                    </div>
                </div>

                {/* Courses List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredCourses.map((course) => (
                            <div key={course.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition-all duration-300 group hover:shadow-md">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 border border-blue-100/30 rounded-lg flex items-center justify-center shrink-0">
                                                <BookOpen className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    <Badge variant="outline" className="bg-blue-50/60 text-blue-600 border-none font-bold uppercase text-[8px] px-2.5 py-0.5 tracking-wider">
                                                        {course.level || 'Program'}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-slate-50/80 text-slate-500 border-none font-bold uppercase text-[8px] px-2.5 py-0.5 tracking-wider">
                                                        {course.category || "Operations"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => {
                                                    setSelectedCourse(course);
                                                    setIsModalOpen(true);
                                                }}
                                                className="h-8 w-8 p-0 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleDelete(course.id)}
                                                className="h-8 w-8 p-0 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <h3 className="text-[16px] font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors leading-snug">{course.title}</h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-6 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${course.is_live ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            {course.is_live ? 'Live Training' : 'Self-Paced'}
                                        </span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                        <span className="text-slate-700 font-bold">₦{course.price_naira.toLocaleString()}</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                        <span className="text-slate-700 font-bold">${course.price_usd}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <a href={getZoneUrl(Zone.ACADEMY, `/courses/${course.slug}`)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 font-bold text-[9px] flex items-center gap-1.5 transition-colors uppercase tracking-widest">
                                            <ExternalLink className="w-3.5 h-3.5" /> Preview
                                        </a>
                                        <button
                                            onClick={() => openCouponModal(course.slug, course.title)}
                                            className="text-violet-500 hover:text-violet-700 font-bold text-[9px] flex items-center gap-1.5 transition-colors uppercase tracking-widest"
                                        >
                                            <Ticket className="w-3.5 h-3.5" /> Coupons
                                        </button>
                                    </div>
                                    <Link 
                                        to={getInternalPath(`/admin/academy/courses/${course.slug}/cohorts`)} 
                                        className="h-9 px-4 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-blue-600 transition-all shadow-xs"
                                    >
                                        Manage Sessions <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {/* Add Card */}
                        <div 
                            onClick={() => {
                                setSelectedCourse(null);
                                setIsModalOpen(true);
                            }}
                            className="bg-slate-50/40 border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-blue-500/20 hover:bg-white transition-all duration-300 min-h-[180px]"
                        >
                            <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                            </div>
                            <h4 className="text-slate-500 font-bold text-sm">New Course Offering</h4>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Ready to scale up?</p>
                        </div>
                    </div>
                )}
            </div>

            <CreateCourseModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchCourses}
                editCourse={selectedCourse}
            />

            <CourseCouponsModal
                isOpen={couponModalOpen}
                onClose={() => setCouponModalOpen(false)}
                courseSlug={couponCourseSlug}
                courseTitle={couponCourseTitle}
            />
        </div>
    );
};

export default CourseManagement;
