import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Search, Filter, Grid as GridIcon, List as ListIcon } from "lucide-react";
import CourseCard from "@/components/academy/CourseCard";
import { useNavigate } from "react-router-dom";

const BrowsePrograms = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase
        .from("academy_courses")
        .select("*")
        .eq("is_live", true)
        .order("created_at", { ascending: false });
      setCourses(data || []);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800 tracking-tight mb-2">Academy Catalog</h1>
          <p className="text-slate-500 font-normal">Upskill with our professional cohort-based programs.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search programs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-10 pr-4 bg-white border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 transition-all outline-none w-full md:w-64"
              />
           </div>
           <button className="h-11 px-4 bg-white border border-slate-100 rounded-xl text-slate-600 flex items-center gap-2 text-sm font-semibold hover:bg-slate-50 transition-all">
             <Filter size={16} /> Filters
           </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.slug} 
              course={course} 
              onViewDetails={(slug) => navigate(`/courses/${slug}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowsePrograms;
