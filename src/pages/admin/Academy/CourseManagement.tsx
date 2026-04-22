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
    MoreVertical,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getInternalPath } from "@/utils/subdomain";
import CreateCourseModal from "@/components/admin/Academy/CreateCourseModal";
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
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);

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
        <div className="p-6 lg:p-10 bg-white min-h-screen font-inter">
            <div className="w-full max-w-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Academy Course Hub</h1>
                        <p className="text-slate-500 font-medium">Manage your dynamic course catalog and learning content.</p>
                    </div>
                    <Button 
                        onClick={() => {
                            setSelectedCourse(null);
                            setIsModalOpen(true);
                        }}
                        className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Create New Course
                    </Button>
                </div>

                {/* Search & Filters */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-10 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-grow w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search courses by title..." 
                            className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button variant="outline" className="h-11 px-6 rounded-lg border-slate-200 font-bold gap-2 text-slate-600">
                            <Filter className="w-4 h-4" /> Categories
                        </Button>
                    </div>
                </div>

                {/* Courses List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {filteredCourses.map((course) => (
                            <div key={course.id} className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden hover:border-blue-400 transition-all group flex flex-col md:flex-row">
                                <div className="md:w-72 h-64 md:h-auto bg-slate-50 flex items-center justify-center p-12 shrink-0 border-r border-slate-100">
                                    <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-blue-200 group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-12 h-12" />
                                    </div>
                                </div>
                                <div className="p-10 flex flex-col justify-between flex-grow">
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex gap-2">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none font-bold uppercase text-[9px] px-3 py-1 tracking-widest">
                                                    {course.level || 'Program'}
                                                </Badge>
                                                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-none font-bold uppercase text-[9px] px-3 py-1 tracking-widest">
                                                    {course.category || "Operations"}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => {
                                                        setSelectedCourse(course);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="h-10 w-10 p-0 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleDelete(course.id)}
                                                    className="h-10 w-10 p-0 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">{course.title}</h3>
                                        <div className="flex items-center gap-6 mb-8 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                            <span className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${course.is_live ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                {course.is_live ? 'Live Training' : 'Self-Paced'}
                                            </span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span>₦{course.price_naira.toLocaleString()}</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span>${course.price_usd}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                                        <a href={getZoneUrl(Zone.ACADEMY, `/courses/${course.slug}`)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 font-bold text-xs flex items-center gap-2 transition-colors uppercase tracking-widest text-[10px]">
                                            <ExternalLink className="w-4 h-4" /> Preview Program
                                        </a>
                                        <Link 
                                            to={getInternalPath(`/admin/academy/courses/${course.slug}/cohorts`)} 
                                            className="h-12 px-8 bg-slate-900 text-white rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                                        >
                                            Manage Sessions <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Card */}
                        <div 
                            onClick={() => {
                                setSelectedCourse(null);
                                setIsModalOpen(true);
                            }}
                            className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-blue-300 transition-all"
                        >
                            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Plus className="w-8 h-8 text-slate-300 group-hover:text-blue-500" />
                            </div>
                            <h4 className="text-slate-400 font-bold">New Course Offering</h4>
                            <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1">Ready to scale up?</p>
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
        </div>
    );
};

export default CourseManagement;
