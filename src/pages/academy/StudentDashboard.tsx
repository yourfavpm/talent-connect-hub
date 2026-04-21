import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
  CheckCircle2,
  Bell,
  User,
  ExternalLink,
  ChevronRight,
  Loader2,
  Filter,
  Grid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CourseCard from "@/components/academy/CourseCard";
import StudentOnboardingModal from "@/components/academy/StudentOnboardingModal";
import CourseDetail from "./CourseDetail";

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

  const [dbCourses, setDbCourses] = useState<Record<string, unknown>[]>([]);
  const [activeTab, setActiveTab] = useState("learning");
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth/login?portal=student");
        return;
      }

      setUserName(user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || "Student");

      // Check for onboarding completion
      if (!user.user_metadata?.onboarding_completed) {
        setShowOnboarding(true);
      }

      const enrollRequest = supabase
        .from("academy_enrollments")
        .select("*, cohorts!cohort_id(*)")
        .eq("user_id", user.id)
        .eq("enrollment_status", "active");
        
      const { data: enrollmentsData, error: enrollError } = await enrollRequest;

      if (enrollError) {
        console.error("Error fetching enrollments:", enrollError);
      } else {
        const typedEnrollments = enrollmentsData as Enrollment[];
        setEnrollments(typedEnrollments || []);

        if (typedEnrollments.length > 0) {
          // 2. Fetch course metadata for these enrollments
          const slugs = typedEnrollments.map(e => e.course_id);
          
          const metaMap: Record<string, CourseMetadata> = {};
          
          // Fetch course metadata from DB
          const { data: dbMetaData } = await supabase
            .from("academy_courses")
            .select("id, slug, title, image_url")
            .in("slug", slugs);

          if (dbMetaData) {
            dbMetaData.forEach((curr: Record<string, unknown>) => {
              metaMap[curr.slug as string] = curr as unknown as CourseMetadata;
            });
          }
          
          setCoursesMetadata(metaMap);

          // 3. Fetch the next upcoming live session (Only works for DB cohorts)
          const cohortIds = typedEnrollments.map(e => e.cohort_id).filter(Boolean);
          if (cohortIds.length > 0) {
            const now = new Date().toISOString();
            const sessionRequest = supabase
              .from("sessions")
              .select("*")
              .in("cohort_id", cohortIds)
              .gte("session_date", now.split('T')[0])
              .eq("status", "scheduled")
              .order("session_date", { ascending: true })
              .order("start_time", { ascending: true })
              .limit(1)
              .single();
              
            const { data: sessionData, error: sessionError } = await sessionRequest;

            if (!sessionError && sessionData) {
              setNextSession(sessionData as Session);
            }
          }
        }
      }

      // Fetch all courses for the catalog tab
      const { data: allCourses } = await supabase
        .from("academy_courses")
        .select("*")
        .eq("is_live", true)
        .order("created_at", { ascending: false });
      
      if (allCourses) {
        setDbCourses(allCourses);
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

  interface Course {
    slug: string;
    title: string;
    description: string;
    level: string;
    duration: string;
    outcome?: string;
    image_url?: string;
    is_live?: boolean;
  }

  const hybridCourses: Course[] = (dbCourses as any[]).map(c => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      level: c.level,
      duration: c.duration,
      outcome: c.outcome,
      image_url: c.image_url,
      is_live: c.is_live
  }));

  const filteredCourses = hybridCourses.filter(course => {
    const matchesFilter = courseFilter === "All" || course.level === courseFilter;
    const title = course.title || "";
    const desc = course.description || "";
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const tabs = [
    { id: "learning", label: "My Learning", icon: BookOpen },
    { id: "catalog", label: "Browse Programs", icon: Grid },
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pt-32 pb-24 px-3 md:px-6 font-inter">
      <div className="container max-w-[1600px] mx-auto">
        
        {/* Hub Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4">
              Student Hub
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'learning' ? `Welcome, ${userName}` : 
               activeTab === 'catalog' ? 'Academy Catalog' :
               activeTab === 'profile' ? 'Your Profile' : 'Notifications'}
            </h1>
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar whitespace-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? "bg-slate-900 text-white shadow-lg" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selectedCourseSlug && activeTab === "learning" && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {hasActiveEnrollments ? (
                <>
                  {/* Next Session Alert */}
                  {nextSession && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
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

                  {/* Active Programs */}
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
                            </div>
                            
                            <div className="p-8 flex flex-col flex-grow">
                              <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1 tracking-tight">
                                {enrollment.course_name}
                              </h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">
                                {enrollment.cohorts?.name || "Live Cohort"}
                              </p>
                              
                              <Link 
                                to={`/courses/${enrollment.course_id}/learn`}
                                className="mt-auto w-full h-14 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
                              >
                                Access Hub <ArrowRight className="w-4 h-4" />
                              </Link>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200 text-center px-8">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-8">
                    <Layout className="w-12 h-12 text-blue-500" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to start your journey?</h2>
                  <p className="text-slate-500 font-medium max-w-2xl mb-12">
                    You haven't enrolled in any active cohorts yet. Browse our professional career tracks to start mastering high-demand operations and product skills.
                  </p>
                  <Button 
                    size="lg" 
                    className="h-16 px-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20"
                    onClick={() => setActiveTab("catalog")}
                  >
                    Explore Course Catalog
                  </Button>
                </div>
              )}
              
              {/* Marketplace Banner */}
              <div className="bg-slate-900 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                  <div className="flex-grow">
                    <h2 className="text-3xl font-bold mb-4 tracking-tight">Global Talent Marketplace</h2>
                    <p className="text-white/60 font-medium max-w-2xl mb-10">
                      As an OPSly student, you have priority access to the OPSly Global Talent Marketplace. Complete your profile to get noticed.
                    </p>
                    <Button className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold gap-2">
                      Complete Talent Profile <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="w-full lg:w-1/3 grid grid-cols-2 gap-4">
                    {[
                      "Vetted Profile", "Priority Link"
                    ].map((benefit) => (
                      <div key={benefit} className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                        <CheckCircle2 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <span className="text-xs font-bold text-white/80">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!selectedCourseSlug && activeTab === "catalog" && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              {/* Internal Catalog Filters */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-12">
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar pb-2">
                  {["All", "Beginner", "Intermediate"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setCourseFilter(lvl)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                        courseFilter === lvl 
                          ? "bg-slate-900 text-white shadow-md" 
                          : "bg-white text-slate-500 border border-slate-100 hover:border-slate-300"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Course Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredCourses.map((course) => (
                  <CourseCard 
                    key={course.slug} 
                    course={course} 
                    onViewDetails={(slug) => setSelectedCourseSlug(slug)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {!selectedCourseSlug && activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12 border-b border-slate-50 pb-12">
                  <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center text-white text-4xl font-bold">
                    {userName[0]}
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">{userName}</h2>
                    <p className="text-slate-500 font-medium">Verified Academy Student</p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Active Account
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Account Details</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between py-3 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Primary Email</span>
                        <span className="text-slate-900 font-bold">Authenticated</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Student ID</span>
                        <span className="text-slate-900 font-bold font-mono">#{userName.slice(0,3).toUpperCase()}-2026</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-3xl p-8">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Learning Analytics</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Enrolled Programs</span>
                        <span className="text-blue-600 font-bold">{enrollments.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Courses Completed</span>
                        <span className="text-slate-900 font-bold">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!selectedCourseSlug && activeTab === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-8">
                <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-50">
                  <h3 className="text-xl font-bold text-slate-900">Recent Alerts</h3>
                  <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[10px] font-bold">0 NEW</span>
                </div>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="w-12 h-12 text-slate-200 mb-4" />
                  <p className="text-slate-500 font-medium italic">You're all caught up! No new notifications.</p>
                </div>
              </div>
            </motion.div>
          )}

          {selectedCourseSlug && (
            <motion.div
              key="coursedetail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <CourseDetail 
                inlineSlug={selectedCourseSlug} 
                onBack={() => setSelectedCourseSlug(null)}
                onEnroll={(slug) => navigate(`/checkout/${slug}?from=dashboard`)}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <StudentOnboardingModal 
        isOpen={showOnboarding} 
        onComplete={() => setShowOnboarding(false)} 
      />
    </div>
  );
};

export default StudentDashboard;
