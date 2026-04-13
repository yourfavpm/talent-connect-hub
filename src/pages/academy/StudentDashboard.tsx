import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ACADEMY_COURSES } from "@/data/academy-courses";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  BookOpen, 
  Calendar, 
  Award, 
  ArrowRight,
  Search,
  Layout,
  Clock,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  course_name: string;
  enrollment_status: string;
  cohort_id: string;
  cohorts?: {
    id: string;
    name: string;
    start_date: string;
    status: string;
  };
}

interface Session {
  id: string;
  cohort_id: string;
  title: string;
  session_date: string;
  start_time: string;
  meeting_url: string;
  status: string;
}

interface CourseMetadata {
  id?: string;
  slug: string;
  title: string;
  image_url: string;
}

const StudentDashboard = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [coursesMetadata, setCoursesMetadata] = useState<Record<string, CourseMetadata>>({});
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  const [nextSession, setNextSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth/login?portal=student");
        return;
      }

      setUserName(user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || "Student");

      // 1. Fetch enrollments with cohort details
      const { data: enrollmentsData, error: enrollError } = await (supabase
        .from("academy_enrollments")
        .select("*, cohorts(*)")
        .eq("user_id", user.id)
        .eq("enrollment_status", "active") as any);

      if (enrollError) {
        console.error("Error fetching enrollments:", enrollError);
      } else {
        const typedEnrollments = enrollmentsData as Enrollment[];
        setEnrollments(typedEnrollments || []);

        if (typedEnrollments.length > 0) {
          // 2. Fetch course metadata for these enrollments
          const slugs = typedEnrollments.map(e => e.course_id);
          
          // Hybrid Fetch: Check DB first
          const { data: dbMetaData } = await supabase
            .from("academy_courses")
            .select("id, slug, title, image_url")
            .in("slug", slugs);
          
          const metaMap: Record<string, CourseMetadata> = {};
          
          // Apply static fallsbacks first
          slugs.forEach(slug => {
            const staticCourse = ACADEMY_COURSES.find(c => c.slug === slug);
            if (staticCourse) {
              metaMap[slug] = {
                slug: staticCourse.slug,
                title: staticCourse.title,
                image_url: "" // static courses didn't have image_url in data usually, but we could add if needed
              };
            }
          });

          // Overwrite with DB metadata if available
          if (dbMetaData) {
            dbMetaData.forEach(curr => {
              metaMap[curr.slug] = curr;
            });
          }
          
          setCoursesMetadata(metaMap);

          // 3. Fetch the next upcoming live session (Only works for DB cohorts)
          const cohortIds = typedEnrollments.map(e => e.cohort_id).filter(Boolean);
          if (cohortIds.length > 0) {
            const now = new Date().toISOString();
            const { data: sessionData, error: sessionError } = await (supabase
              .from("sessions")
              .select("*")
              .in("cohort_id", cohortIds)
              .gte("session_date", now.split('T')[0])
              .eq("status", "scheduled")
              .order("session_date", { ascending: true })
              .order("start_time", { ascending: true })
              .limit(1)
              .single() as any);

            if (!sessionError && sessionData) {
              setNextSession(sessionData as Session);
            }
          }
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasActiveEnrollments = enrollments.length > 0;

  return (
    <div className="min-h-screen bg-slate-50/50 pt-32 pb-24 px-6 font-inter">
      <div className="container max-w-[1600px] mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4">
              Student Dashboard
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Hello, {userName}
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              {hasActiveEnrollments 
                ? "Ready to continue your learning journey?" 
                : "Explore our world-class courses and start your journey today."}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" className="h-12 px-6 rounded-xl font-bold gap-2">
              <Calendar className="w-4 h-4" /> Schedule
            </Button>
            <Button className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold gap-2" onClick={() => navigate("/courses")}>
              <Search className="w-4 h-4" /> Browse Courses
            </Button>
          </div>
        </div>

        {hasActiveEnrollments ? (
          <div className="space-y-12">
            {/* Next Session Alert */}
            {nextSession && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-[32px] shadow-xl shadow-blue-500/20"
              >
                <div className="bg-white rounded-[31px] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold uppercase tracking-wider mb-2">
                        Next Live Session
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{nextSession.title}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" /> {new Date(nextSession.session_date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> {nextSession.start_time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <Button 
                      onClick={() => window.open(nextSession.meeting_url, '_blank')}
                      className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold gap-2 flex-grow md:flex-grow-0"
                    >
                      <Play className="w-4 h-4 fill-current" /> Join Session
                    </Button>
                    <Link 
                      to={`/courses/${enrollments.find(e => e.cohort_id === nextSession.cohort_id)?.course_id}/learn`}
                      className="h-14 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      Program Hub
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* My Learning Section */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Active Programs</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {enrollments.map((enrollment) => {
                  const courseMeta = coursesMetadata[enrollment.course_id];
                  return (
                    <motion.div 
                      key={enrollment.id}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col group h-full"
                    >
                      <div className="aspect-[16/10] bg-slate-900 relative overflow-hidden">
                        <img 
                          src={courseMeta?.image_url || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"} 
                          alt={enrollment.course_name}
                          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-widest border border-white/10">
                            {enrollment.cohorts?.name || "Live Cohort"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-8 flex flex-col flex-grow">
                        <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1 tracking-tight">
                          {enrollment.course_name}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">
                          Cohort started: {enrollment.cohorts ? new Date(enrollment.cohorts.start_date).toLocaleDateString() : 'TBD'}
                        </p>
                        
                        <div className="space-y-4 mb-8">
                          <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <span>Weekly Live Classes</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                              <Award className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span>Certificate Project</span>
                          </div>
                        </div>

                        <Link 
                          to={`/courses/${enrollment.course_id}/learn`}
                          className="mt-auto w-full h-14 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/10"
                        >
                          Access Program Hub <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Recommended Content */}
            <div className="bg-slate-900 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-grow">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white/80 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6">
                    Placement Support
                  </div>
                  <h2 className="text-3xl font-bold mb-4 tracking-tight">Ready for your next career move?</h2>
                  <p className="text-white/60 font-medium max-w-2xl mb-10">
                    As an OPSly Academy student, you have priority access to the OPSly HR Global Talent Marketplace. Complete your profile and start getting noticed by global companies.
                  </p>
                  <Button className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold gap-2">
                    Complete Talent Profile <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
                <div className="w-full lg:w-1/3 grid grid-cols-2 gap-4">
                  {[
                    "Vetted Profile", "Global Reach", "Remote Roles", "Priority Link"
                  ].map((benefit) => (
                    <div key={benefit} className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                      <CheckCircle2 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <span className="text-xs font-bold text-white/80">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200 text-center px-8">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-8">
              <Layout className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">No active enrollments found</h2>
            <p className="text-slate-500 font-medium max-w-2xl mb-12">
              You haven't enrolled in any active cohorts yet. Browse our professional career tracks to start mastering high-demand operations and product skills.
            </p>
            <Button 
              size="lg" 
              className="h-16 px-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20"
              onClick={() => navigate("/courses")}
            >
              Explore Course Catalog
            </Button>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
              {[
                { title: "AI Operations", desc: "Master AI workflows and automation" },
                { title: "Product Ops", desc: "Build systems for product excellence" },
                { title: "Executive Assistant", desc: "Strategic support for global leaders" }
              ].map((item) => (
                <div key={item.title} className="p-6 bg-slate-50 rounded-[24px] text-left border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mb-4 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentDashboard;
