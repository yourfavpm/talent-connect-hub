import { useState, useEffect } from "react";
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
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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

    const fetchCourses = async () => {
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
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 lg:p-12 bg-slate-50/50 min-h-screen font-inter">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Academy Course Hub</h1>
                        <p className="text-slate-500 font-medium">Manage your dynamic course catalog and learning content.</p>
                    </div>
                    <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-2 shadow-lg shadow-blue-200 transition-all">
                        <Plus className="w-5 h-5" /> Create New Course
                    </Button>
                </div>

                {/* Search & Filters */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search courses by title..." 
                            className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-100 font-bold gap-2 text-slate-500 hover:bg-slate-50">
                            <Filter className="w-4 h-4" /> All Categories
                        </Button>
                    </div>
                </div>

                {/* Courses List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCourses.map((course) => (
                            <div key={course.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                            <BookOpen className="w-7 h-7" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="outline" className="bg-slate-50 text-slate-500 border-none font-bold uppercase text-[9px] tracking-widest px-2.5 py-1">
                                            {course.level}
                                        </Badge>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none font-bold uppercase text-[9px] tracking-widest px-2.5 py-1">
                                            {course.category || "Operations"}
                                        </Badge>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">{course.title}</h3>
                                    
                                    <div className="flex items-center gap-4 py-6 border-y border-slate-50 my-6">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fee (NGN)</div>
                                            <div className="text-lg font-bold text-slate-900 leading-none">₦{course.price_naira.toLocaleString()}</div>
                                        </div>
                                        <div className="w-px h-8 bg-slate-100 mx-2" />
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fee (USD)</div>
                                            <div className="text-lg font-bold text-slate-900 leading-none">${course.price_usd}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {course.is_live ? (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100/50">
                                                    <CheckCircle2 className="w-3 h-3" /> Live Learning
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-100">
                                                    <AlertCircle className="w-3 h-3" /> Auto-Paced
                                                </div>
                                            )}
                                        </div>
                                        <Link to={`/admin/academy/courses/${course.slug}`} className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1">
                                            View Details <ExternalLink className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Card */}
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-blue-300 transition-all">
                            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Plus className="w-8 h-8 text-slate-300 group-hover:text-blue-500" />
                            </div>
                            <h4 className="text-slate-400 font-bold">New Course Offering</h4>
                            <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1">Ready to scale up?</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseManagement;
