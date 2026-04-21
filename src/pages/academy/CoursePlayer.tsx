import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Lock, 
  CheckCircle2,
  FileText,
  Video,
  Menu,
  X,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const CoursePlayer = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [course, setCourse] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate(`/auth/login?portal=student&returnTo=/courses/${slug}/learn`);
        return;
      }

      const { data, error } = await supabase
        .from("academy_enrollments")
        .select("id, academy_courses!inner(slug)")
        .eq("user_id", user.id)
        .eq("academy_courses.slug", slug)
        .eq("enrollment_status", "active")
        .maybeSingle();

      if (error || !data) {
        setAccess(false);
        navigate("/dashboard");
      } else {
        setAccess(true);
        // Fetch course details from DB
        const { data: courseData } = await supabase
          .from("academy_courses")
          .select("*")
          .eq("slug", slug)
          .single();
        setCourse(courseData);
      }
      setLoading(false);
    };

    checkAccess();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-inter overflow-hidden">
      {/* Player Header */}
      <header className="h-16 border-b border-white/10 bg-slate-950 px-6 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block" />
          <h1 className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-md">
            {course.title}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 mr-6 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-blue-500" />
            </div>
            <span>33% Complete</span>
          </div>
          <Button 
            variant="outline" 
            className="border-white/10 text-white hover:bg-white/5 h-10 rounded-lg text-xs font-bold"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="hidden sm:inline ml-2">{isSidebarOpen ? "Close Sidebar" : "Course Content"}</span>
          </Button>
        </div>
      </header>

      <div className="flex-grow flex relative overflow-hidden">
        {/* Main Content Area */}
        <main className={`flex-grow h-full overflow-y-auto transition-all duration-300 ${isSidebarOpen ? "mr-0 lg:mr-[380px]" : ""}`}>
          <div className="max-w-5xl mx-auto p-6 lg:p-12">
            {/* Video Placeholder */}
            <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative mb-12">
              <div className="absolute inset-0 flex items-center justify-center flex-col text-white cursor-pointer group">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 fill-current" />
                </div>
                <p className="text-xl font-bold">Introduction to {course.title}</p>
                <p className="text-white/40 font-medium mt-1">12:45 • Module 1</p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <h2 className="text-3xl font-bold text-white mb-6">Course Introduction</h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                Welcome to the {course.title} program. In this lesson, we will cover the fundamental concepts and lay the groundwork for your professional growth. 
                Focus on the core outcomes we discussed during enrollment—this track is designed specifically to bridge the gap between theoretical knowledge and global workplace execution.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
                  <FileText className="w-8 h-8 text-blue-500 mb-4" />
                  <h4 className="text-white font-bold mb-2">Lesson Resources</h4>
                  <p className="text-white/40 text-sm mb-6">Download the frameworks and worksheets mentioned in the video.</p>
                  <Button className="w-full bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-xl font-bold">
                    Download PDF
                  </Button>
                </div>
                <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-4" />
                  <h4 className="text-white font-bold mb-2">Learning Outcomes</h4>
                  <ul className="text-white/40 text-sm space-y-2">
                    <li>• Mastery of core workflows</li>
                    <li>• Practical implementation skills</li>
                    <li>• Industry-standard certification</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Navigation Bottom */}
            <div className="flex justify-between items-center mt-20 pt-12 border-t border-white/10">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 font-bold flex items-center gap-2">
                <ChevronLeft className="w-5 h-5" /> Previous Lesson
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-600/20">
                Next: Core Frameworks <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-16 right-0 bottom-0 w-full md:w-[380px] bg-slate-900 border-l border-white/10 z-40 flex flex-col"
            >
              <div className="p-6 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">Course Curriculum</h3>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">12 Modules • 48 Lessons</p>
              </div>
              
              <div className="flex-grow overflow-y-auto custom-scrollbar">
                {[
                  { title: "Module 1: Foundations", lessons: 4 },
                  { title: "Module 2: Strategic Execution", lessons: 6 },
                  { title: "Module 3: Advanced Workflows", lessons: 5 },
                  { title: "Module 4: Real-world Applications", lessons: 8 },
                ].map((mod, i) => (
                  <div key={i} className="border-b border-white/5">
                    <button className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Section {i + 1}</span>
                        <h4 className="text-sm font-bold text-white mt-1">{mod.title}</h4>
                      </div>
                      <span className="text-white/30 text-xs font-medium">{mod.lessons} Lessons</span>
                    </button>
                    
                    {i === 0 && (
                      <div className="bg-black/20">
                        {Array.from({ length: mod.lessons }).map((_, j) => (
                          <button 
                            key={j}
                            className={`w-full px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-all group ${j === 0 ? "border-l-4 border-blue-600 bg-blue-600/10" : "border-l-4 border-transparent"}`}
                          >
                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${j === 0 ? "bg-blue-600 text-white" : "bg-white/5 text-white/40"}`}>
                              <Video className="w-4 h-4" />
                            </div>
                            <div className="text-left flex-grow">
                              <h5 className={`text-xs font-bold ${j === 0 ? "text-white" : "text-white/60"}`}>
                                {j === 0 ? "Introduction Video" : `Core Concept ${j}`}
                              </h5>
                              <span className="text-[10px] text-white/30 font-medium">12:45</span>
                            </div>
                            {j === 0 ? (
                              <CheckCircle2 className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Lock className="w-4 h-4 text-white/10" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CoursePlayer;
