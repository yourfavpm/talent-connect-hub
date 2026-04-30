import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  Play, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Layout, 
  CheckCircle2, 
  ChevronRight,
  BookOpen,
  Award,
  Bell,
  Search,
  ExternalLink,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const Overview = () => {
  const [userName, setUserName] = useState("");
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ streak_count: 0, global_rank: null, total_study_hours: 0, certificates_count: 0, courses_completed: 0 });
  const [avgGrade, setAvgGrade] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [nextSessions, setNextSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.rpc('get_student_dashboard_data', { p_user_id: user.id });
        
        if (!error && data) {
          setUserName(data.profile.full_name?.split(' ')[0] || "Student");
          setStats({
            ...data.profile,
            certificates_count: 0, // Fallback as RPC doesn't count certs yet
            courses_completed: 0,
            total_study_hours: 0,
            global_rank: null
          });
          setEnrollments(data.enrollments || []);
          setNextSessions(data.sessions || []);
          setAnnouncements(data.announcements || []);
          setPendingAssignments(data.assignments || []);
          setAvgGrade(data.avg_grade);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-12 animate-fade-in max-w-[1400px]">
      
      {/* Welcome & Streak Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight mb-1">Welcome back, {userName}!</h1>
          <p className="text-xs md:text-sm text-slate-500 font-normal">You're on a {stats.streak_count || 0}-day learning streak. Keep up the momentum!</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="rounded-xl border-slate-200 h-9 px-4 font-semibold text-xs gap-2">
             <Calendar className="w-3.5 h-3.5" /> View Schedule
           </Button>
           <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 font-semibold text-xs gap-2">
             <Play className="w-3.5 h-3.5 fill-current" /> Resume
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Progress & Active Cohorts */}
        <div className="lg:col-span-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Global Progress Circle */}
            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
               <div className="relative w-32 h-32 mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-50" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={352} strokeDashoffset={352 * (1 - 0.75)} className="text-blue-600 rounded-full" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-800 tracking-tight">{avgGrade ? `${avgGrade}%` : "N/A"}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                  </div>
               </div>
               <h3 className="text-base font-semibold text-slate-800 mb-1">Almost there!</h3>
               <p className="text-[10px] text-slate-400 leading-relaxed px-2">Complete your tasks this week to reach your goal.</p>
            </div>

            {/* Active Cohorts List */}
            <div className="md:col-span-3 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-semibold text-slate-800">Active Cohorts</h2>
                <Link to="/dashboard/cohorts" className="text-xs font-semibold text-blue-600 hover:underline">See all</Link>
              </div>
              <div className="space-y-3">
                {enrollments.map((enroll) => (
                  <div key={enroll.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-100 transition-all">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                      <Layout size={20} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-sm font-semibold text-slate-800 truncate mb-1">{enroll.course_name}</h4>
                      <div className="flex items-center gap-3">
                         <div className="flex-grow h-1 bg-slate-50 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-600" style={{ width: `${enroll.progress_percent || 0}%` }} />
                         </div>
                         <span className="text-[9px] font-bold text-slate-400">{enroll.progress_percent || 0}%</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                ))}
                {enrollments.length === 0 && (
                  <div className="h-40 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[28px] text-slate-400 text-sm italic">
                    No active cohorts
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Sessions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-semibold text-slate-800">Upcoming Sessions</h2>
              <button className="text-slate-400 hover:text-slate-600">...</button>
            </div>
            <div className="space-y-3">
              {nextSessions.map((session, idx) => {
                const sessionDate = new Date(session.session_date);
                const day = sessionDate.toLocaleDateString('default', { day: 'numeric' });
                const month = sessionDate.toLocaleDateString('default', { month: 'short' });
                const isJoinable = session.meeting_url && session.status !== 'locked';

                return (
                  <div key={session.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 shrink-0">
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{month}</span>
                         <span className="text-base font-bold text-slate-800 leading-tight">{day}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 mb-0.5">{session.title}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                          <Clock size={10} /> {session.start_time || "TBA"} • {session.cohorts?.name}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant={isJoinable ? 'outline' : 'ghost'} 
                      disabled={!isJoinable}
                      onClick={() => session.meeting_url && window.open(session.meeting_url, '_blank')}
                      className={cn(
                        "rounded-lg font-bold text-[8px] uppercase tracking-wider px-4 h-8",
                        isJoinable ? "border-blue-600 text-blue-600" : "bg-slate-50 text-slate-300"
                      )}
                    >
                      {isJoinable ? 'Join' : 'Locked'}
                    </Button>
                  </div>
                );
              })}
              {nextSessions.length === 0 && (
                <div className="bg-slate-50/50 p-8 rounded-3xl border border-dashed border-slate-100 text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">No upcoming classes</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Assignments & Announcements */}
        <div className="lg:col-span-4 space-y-10">
          
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 px-1">Pending Assignments</h2>
            <div className="space-y-3">
              {pendingAssignments.map((asgn) => {
                const isLate = new Date(asgn.deadline_at) < new Date();
                return (
                  <div key={asgn.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", isLate ? "bg-red-500 animate-pulse" : "bg-blue-500")} />
                          <span className="text-[9px] font-bold text-slate-800 uppercase tracking-widest truncate max-w-[150px]">{asgn.title}</span>
                       </div>
                       {isLate && <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[7px] font-bold rounded uppercase tracking-wider">Late</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 mb-4 font-medium">
                      {new Date(asgn.deadline_at).toLocaleDateString()} • {asgn.cohorts?.name}
                    </p>
                    <Link to={`/dashboard/assignments/${asgn.id}`}>
                      <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[8px] uppercase tracking-widest h-8">
                        Submit
                      </Button>
                    </Link>
                  </div>
                );
              })}
              {pendingAssignments.length === 0 && (
                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-dashed border-emerald-100 text-center">
                  <p className="text-[10px] font-semibold text-emerald-600">All caught up!</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 px-1">Announcements</h2>
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group cursor-pointer">
                <div className="flex">
                  <div className="w-20 bg-slate-100 relative overflow-hidden shrink-0">
                    <img 
                      src={ann.image_url || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop"} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      alt="Ann" 
                    />
                  </div>
                  <div className="p-4 flex-grow min-w-0">
                    <h4 className="text-xs font-semibold text-slate-800 mb-1 leading-tight truncate">{ann.title}</h4>
                    <p className="text-[9px] text-slate-400 font-medium mb-3 line-clamp-2 leading-relaxed">
                      {ann.content}
                    </p>
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      Read <ArrowRight size={8} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center text-[10px] text-slate-400">
                No updates
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-t border-slate-100 mt-12">
         <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completed Courses</span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">{stats.courses_completed || 0}</span>
         </div>
        <div className="flex flex-col items-center text-center">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Certificates Earned</span>
           <span className="text-2xl font-bold text-slate-800 tracking-tight">{stats.certificates_count || 0}</span>
        </div>
        <div className="flex flex-col items-center text-center">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Study Hours</span>
           <span className="text-2xl font-bold text-slate-800 tracking-tight">{stats.total_study_hours || 0}h</span>
        </div>
        <div className="flex flex-col items-center text-center">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global Rank</span>
           <span className="text-2xl font-bold text-blue-600 tracking-tight">#{stats.global_rank || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default Overview;
