import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  ArrowRight, 
  ChevronRight, 
  User, 
  Search, 
  Filter, 
  Plus,
  Layout,
  Trophy,
  CheckCircle2,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const MyCohorts = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total_study_hours: 0, avg_performance: 94, pending_tasks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch Profile Stats
        const { data: profileData } = await supabase
          .from("profiles")
          .select("total_study_hours, streak_count")
          .eq("id", user.id)
          .single();
        
        if (profileData) {
          setStats(prev => ({ ...prev, total_study_hours: profileData.total_study_hours }));
        }

        // Fetch Enrollments
        const { data: enrollData } = await supabase
          .from("academy_enrollments")
          .select("*, cohorts(*)")
          .eq("user_id", user.id)
          .eq("enrollment_status", "active");
        
        setEnrollments(enrollData || []);

        // Fetch Pending Tasks (Assignments not submitted)
        const cohortIds = enrollData?.map(e => e.cohort_id) || [];
        if (cohortIds.length > 0) {
           const { count: pendingCount } = await supabase
             .from("assignments")
             .select("*", { count: 'exact', head: true })
             .in("cohort_id", cohortIds);
           
           // Subtract submitted ones
           const { count: submittedCount } = await supabase
             .from("submissions")
             .select("*", { count: 'exact', head: true })
             .eq("student_id", user.id);
           
           setStats(prev => ({ ...prev, pending_tasks: Math.max(0, (pendingCount || 0) - (submittedCount || 0)) }));
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-12 animate-fade-in max-w-[1400px]">
      
      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight mb-1">My Cohorts</h1>
          <p className="text-xs md:text-sm text-slate-500 font-normal max-w-xl">Track your progress across different programs.</p>
        </div>
        
        <div className="flex items-center gap-2">
           <Button variant="outline" className="rounded-xl border-slate-200 h-9 px-4 text-xs font-semibold gap-2">
             <Filter size={14} /> Filter
           </Button>
           <Link to="/dashboard/courses">
             <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-xs font-semibold gap-2">
               <Plus size={16} /> Join New
             </Button>
           </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <Layout size={20} />
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
            <p className="text-lg font-bold text-slate-800 tracking-tight">{enrollments.length.toString().padStart(2, '0')}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Time</p>
            <p className="text-lg font-bold text-slate-800 tracking-tight">{stats.total_study_hours || 0}h</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Score</p>
            <p className="text-lg font-bold text-slate-800 tracking-tight">94%</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tasks</p>
            <p className="text-lg font-bold text-slate-800 tracking-tight">{stats.pending_tasks || 0}</p>
          </div>
        </div>
      </div>

      {/* Cohort Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {enrollments.map((enroll) => (
          <div key={enroll.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500">
            <div className="h-44 md:h-56 bg-slate-100 relative overflow-hidden shrink-0">
               <img 
                 src={enroll.course_slug === 'product-ops' 
                   ? "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop" 
                   : "https://images.unsplash.com/photo-1551288049-bbdac8a28a80?q=80&w=800&auto=format&fit=crop"} 
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                 alt="Program" 
               />
               <div className="absolute top-4 right-4">
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-bold rounded uppercase tracking-wider shadow-lg">Active</span>
               </div>
            </div>
            
            <div className="p-6 md:p-10 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-1">
                 <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mb-2">
                   {enroll.course_name.toLowerCase().includes('data') ? 'Data Science Professional' : 'Cloud Architecture Elite'}
                 </p>
                 <button className="text-slate-300 hover:text-slate-600 transition-colors">...</button>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-slate-800 mb-4 md:mb-6 leading-tight group-hover:text-blue-600 transition-colors">
                {enroll.course_name} {enroll.cohorts?.name}
              </h3>
              
              <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">
                <div className="flex items-center justify-between text-[10px] font-semibold">
                   <span className="text-slate-400 uppercase tracking-widest text-[8px]">Overall Progress</span>
                   <span className="text-slate-800">{enroll.progress_percent || 0}%</span>
                </div>
                <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-600 rounded-full shadow-sm shadow-blue-500/20" style={{ width: `${enroll.progress_percent || 0}%` }} />
                </div>
              </div>

              <div className="space-y-4 md:space-y-6">
                 <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} className="text-slate-400" />
                    <span>Next: <span className="text-slate-800 font-bold">Oct 24, 10:00 AM</span></span>
                 </div>
                 
                 <Link to={`/dashboard/cohorts/${enroll.id}`}>
                   <Button variant="ghost" className="w-full text-blue-600 font-bold text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-700 rounded-xl h-10 flex items-center justify-center gap-2 transition-all border border-blue-50">
                      View Dashboard <ArrowRight size={12} />
                   </Button>
                 </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Explore More Card */}
        <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-8 md:p-10 flex flex-col items-center justify-center text-center space-y-4 md:space-y-6">
           <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600">
              <Plus size={24} strokeWidth={1.5} />
           </div>
           <div>
              <h4 className="text-lg font-semibold text-slate-800 mb-1">Explore Courses</h4>
              <p className="text-[10px] text-slate-500 font-normal max-w-[200px] leading-relaxed">
                 Discover new cohort-based programs starting next month.
              </p>
           </div>
           <Link to="/dashboard/courses">
             <Button variant="outline" className="border-slate-200 bg-white rounded-xl font-bold text-[10px] px-6 h-9 hover:bg-white/80 shadow-sm">
                Catalog
             </Button>
           </Link>
        </div>
      </div>

      {/* Completed Cohorts Section */}
      <div className="pt-12">
        <h2 className="text-2xl font-semibold text-slate-800 mb-8">Completed Programs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 flex flex-col group opacity-80">
              <div className="h-56 bg-slate-50 rounded-[28px] overflow-hidden mb-8">
                <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover grayscale opacity-50" alt="Completed" />
              </div>
              <div className="flex items-center justify-between mb-2">
                 <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">Completed</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-6">Agile Fundamentals C4</h3>
              <div className="flex items-center justify-between mt-auto">
                 <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-semibold">Certificate Issued</span>
                 </div>
                 <Button variant="outline" className="border-slate-200 rounded-xl font-semibold text-xs h-10 gap-2">
                    <BookOpen size={14} /> Download Certificate
                 </Button>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
};

export default MyCohorts;
