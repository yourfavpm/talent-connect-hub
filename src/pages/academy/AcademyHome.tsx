import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Globe, Users, Zap, TrendingUp, Brain, FolderOpen, Award, Rocket, Loader2, Search, X, ChevronRight } from "lucide-react";
import CourseCard from "@/components/academy/CourseCard";
import TestimonialCard from "@/components/academy/TestimonialCard";
import type { CourseTestimonial } from "@/components/academy/TestimonialCard";
import { getInternalPath, getZoneUrl, Zone } from "@/utils/subdomain";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface DynamicCourse {
    id: string;
    slug: string;
    title: string;
    tagline?: string;
    description: string;
    duration: string;
    level: string;
    outcome?: string;
    image_url?: string;
    is_live?: boolean;
    is_flagship?: boolean;
    tools: string[];
    testimonials?: CourseTestimonial[];
}

const AcademyHome = () => {
    const [flagshipCourse, setFlagshipCourse] = useState<DynamicCourse | null>(null);
    const [courses, setCourses] = useState<DynamicCourse[]>([]);
    const [testimonials, setTestimonials] = useState<CourseTestimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<DynamicCourse[]>([]);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (searchQuery.trim().length > 1) {
            const filtered = courses.filter(c => 
                c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                c.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchResults(filtered);
            setShowResults(true);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    }, [searchQuery, courses]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                let allCourses: DynamicCourse[] = [];
                let attempts = 0;
                const maxAttempts = 3;

                while (attempts < maxAttempts) {
                    try {
                        const { data, error } = await supabase
                            .from("academy_courses")
                            .select("*")
                            .eq("is_live", true)
                            .order("created_at", { ascending: false });

                        if (error) throw error;

                        allCourses = (data || []) as DynamicCourse[];
                        break;
                    } catch (err) {
                        attempts++;
                        console.error(`Attempt ${attempts} failed to fetch courses:`, err);
                        if (attempts >= maxAttempts) {
                            console.error("All attempts to fetch courses failed.");
                            setLoading(false);
                            return;
                        } else {
                            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
                        }
                    }
                }

                setCourses(allCourses);

                // Find flagship course
                const flagship = allCourses.find(c => c.is_flagship) || allCourses[0];
                setFlagshipCourse(flagship || null);

                // Extract testimonials from flagship (or first course with testimonials)
                const courseWithTestimonials = allCourses.find(c => 
                    Array.isArray(c.testimonials) && c.testimonials.length > 0
                );
                if (courseWithTestimonials?.testimonials) {
                    setTestimonials(courseWithTestimonials.testimonials);
                }
            } catch (err) {
                console.error("Error fetching academy data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

  return (
    <div className="bg-white min-h-screen text-slate-900 font-inter">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-20 lg:pt-40 lg:pb-32 px-6 overflow-hidden min-h-[80vh] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/academy-hero.jpg" 
            alt="Graduation" 
            className="w-full h-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]" />
        </div>

        {/* Subtle Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none z-10" />
        
        <div className="container max-w-[1000px] mx-auto relative z-20 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-8 leading-[1.05] max-w-4xl">
              Advance Your Career with Industry-Relevant Programs
            </h1>

            {/* Subheadline */}
            <p className="text-base md:text-lg text-slate-300 mb-12 max-w-2xl leading-relaxed font-medium">
              Master the operational frameworks used by high-growth organizations. <br className="hidden md:block" />
              Taught by industry leaders from global tech hubs.
            </p>
            
            {/* Search Bar */}
            <div className="w-full max-w-2xl relative">
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Search size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="What do you want to learn today?" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length > 1 && setShowResults(true)}
                  className="w-full h-16 md:h-20 pl-16 pr-32 bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] text-base md:text-lg shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none text-slate-800 placeholder:text-slate-400"
                />
                <Button 
                  onClick={() => navigate("/courses")}
                  className="absolute right-3 top-3 bottom-3 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-[18px] md:rounded-[24px] font-bold text-sm md:text-base shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  Search
                </Button>
              </div>

              {/* Added Explore Courses Button per request */}
              <div className="mt-8">
                  <Button 
                    onClick={() => navigate("/courses")}
                    variant="outline"
                    className="px-8 py-6 rounded-full text-white border-white/20 hover:bg-white/10 font-bold transition-all shadow-sm"
                  >
                    Or Explore All Courses <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showResults && searchResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] shadow-2xl overflow-hidden z-50 p-2"
                  >
                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                       {searchResults.map((course) => (
                         <Link 
                           key={course.id} 
                           to={`/courses/${course.slug}`}
                           className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors rounded-2xl group"
                         >
                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                               <img src={course.image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                               <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{course.title}</h4>
                               <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{course.description}</p>
                            </div>
                            <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-blue-600" />
                         </Link>
                       ))}
                    </div>
                  </motion.div>
                )}
                {showResults && searchQuery.length > 1 && searchResults.length === 0 && (
                   <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] shadow-2xl z-50 p-10 text-center"
                   >
                     <p className="text-slate-400 text-sm font-medium">No programs found matching "{searchQuery}"</p>
                   </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Popular Tags */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-3 md:gap-4">
               <span className="text-sm font-semibold text-white/40 mr-2">Popular:</span>
               {["Operations", "HR Strategy", "Data Science", "Tech Ops"].map((tag) => (
                 <button 
                   key={tag}
                   onClick={() => setSearchQuery(tag)}
                   className="px-5 py-2 bg-white/5 text-white/70 rounded-full text-xs font-bold hover:bg-white/10 hover:text-white border border-white/10 transition-all active:scale-95"
                 >
                   {tag}
                 </button>
               ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. TRUST STRIP (TOOL MARQUEE) */}
      <section className="py-8 md:py-12 border-b border-slate-100 bg-white">
        <div className="container max-w-7xl mx-auto px-3 md:px-6 text-center">
          <p className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 md:mb-10">Master the Stack of the Global Economy</p>
          <div className="flex flex-wrap justify-center items-center gap-x-6 md:gap-x-12 gap-y-4 md:gap-y-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {["Zapier", "Notion", "Make.com", "Airtable", "GPT-4", "ClickUp"].map((tool) => (
              <span key={tool} className="text-base md:text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">{tool}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. OPPORTUNITY BRIDGE (ECOSYSTEM FLOW) */}
      <section className="py-16 md:py-24 px-3 md:px-6 bg-slate-50 border-b border-slate-100">
        <div className="container max-w-[1100px] mx-auto">
          <div className="text-center mb-12 md:mb-20 animate-slide-up">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 md:mb-6 leading-tight tracking-tight">
                Not Just a Course. A Career Pipeline.
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
                OPSly Academy is directly connected to the OPSly HR talent marketplace. We don''t just teach you — we place you.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-[60px] left-0 right-0 h-0.5 bg-slate-200 border-t border-dashed border-slate-300" />
            
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 relative z-10">
            {[
              { icon: Brain, title: "Skill Competency", desc: "Master high-income operational automation and management skills.", color: "from-purple-100 to-purple-50", iconColor: "text-purple-600" },
              { icon: FolderOpen, title: "Portfolio Project", desc: "Build real-world systems that demonstrate your technical ability.", color: "from-blue-100 to-blue-50", iconColor: "text-blue-600" },
              { icon: Award, title: "Case Study", desc: "Document your projects into professional results-driven case studies.", color: "from-emerald-100 to-emerald-50", iconColor: "text-emerald-600" },
              { icon: TrendingUp, title: "Acquisition System", desc: "Get the exact outreach and closing systems to win your own clients.", color: "from-orange-100 to-orange-50", iconColor: "text-orange-600" },
              { icon: Globe, title: "Marketplace Access", desc: "Get prioritized placement in the vetted OPSly talent marketplace.", color: "from-blue-100 to-blue-50", iconColor: "text-blue-600" },
              { icon: Rocket, title: "Interview Readiness", desc: "Master the communication and technical questions for global roles.", color: "from-emerald-100 to-emerald-50", iconColor: "text-emerald-600" }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-8 h-8 ${item.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED PROGRAM */}
      {flagshipCourse && (
      <section className="py-16 md:py-24 px-3 md:px-6 bg-white overflow-hidden">
        <div className="container max-w-[1200px] mx-auto">
          <div className="bg-slate-900 rounded-2xl md:rounded-[32px] overflow-hidden flex flex-col lg:flex-row relative">
            <div className="lg:w-1/2 p-4 md:p-12 lg:p-16 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[9px] md:text-[10px] font-bold tracking-widest uppercase mb-4 md:mb-6">Flagship Course</div>
                <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-8 leading-[1.1]">
                    {flagshipCourse.title}
                </h2>
                <p className="text-xs sm:text-sm md:text-lg lg:text-xl text-slate-300 mb-6 md:mb-12 leading-relaxed max-w-xl font-medium">
                    {flagshipCourse.description}
                </p>
                <div className="space-y-3 md:space-y-4 mb-6 md:mb-10">
                    {[
                        "4 Weeks Intensive",
                        "Live Workshops & Support",
                        "Fast-track to Marketplace",
                        "MacBook Reward for Top Grad"
                    ].map((bullet, i) => (
                        <div key={i} className="flex items-center gap-3 text-slate-300">
                            <CheckCircle className="w-4 md:w-5 h-4 md:h-5 text-emerald-500 shrink-0" />
                            <span className="text-xs md:text-base font-medium">{bullet}</span>
                        </div>
                    ))}
                </div>
                <Link to={`/courses/${flagshipCourse.slug}`}>
                    <Button size="lg" className="h-12 md:h-14 px-6 md:px-10 text-sm md:text-base bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all font-semibold w-full sm:w-auto">
                        View Program Details
                    </Button>
                </Link>
            </div>
            <div className="lg:w-1/2 relative bg-slate-800 hidden lg:block overflow-hidden">
                <img src={flagshipCourse.image_url || "https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80"} alt="Learning" className="w-full h-full object-cover grayscale opacity-40 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent" />
                
                {/* Floating Tool Badges */}
                <div className="absolute inset-0 flex items-center justify-center p-12">
                     <div className="flex flex-wrap gap-4 justify-center max-w-sm">
                        {(flagshipCourse.tools || []).map(tool => (
                            <div key={tool} className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-xl text-xs font-bold shadow-2xl">
                                {tool}
                            </div>
                        ))}
                     </div>
                </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* 5. COURSE CATALOG PREVIEW */}
      {courses.length > 0 && (
      <section className="py-24 px-6 bg-slate-50 border-y border-slate-100">
        <div className="container max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                <div className="max-w-xl">
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Our Learning Paths</h2>
                    <p className="text-base md:text-lg text-slate-500 leading-relaxed font-medium">Practical, outcome-driven programs designed to get you hired globally.</p>
                </div>
                <Link to={getInternalPath("/courses")}>
                    <Button variant="ghost" className="group text-blue-600 hover:text-blue-700 font-bold flex items-center gap-2">
                        View All Courses <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.slice(0, 3).map((course) => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </div>
      </section>
      )}

      {/* 6. TESTIMONIALS */}
      {testimonials.length > 0 && (
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="container max-w-[1200px] mx-auto">
          <div className="text-center mb-20 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                Real People. Real Placements.
            </h2>
            <p className="text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
                Meet the graduates who master high-income skills and transitioned into remote work with OPSly HR.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
                <TestimonialCard key={i} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>
      )}

      {/* 7. TALENT MARKETPLACE CTA */}
      <section className="py-24 px-6 bg-slate-900 font-inter text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/4 h-full bg-blue-600/50 blur-[200px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/4 h-full bg-emerald-600/20 blur-[200px] pointer-events-none" />
        
        <div className="container max-w-[1100px] mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-grow text-center lg:text-left">
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tight">
                    Graduate. Get Placed. <br /> Earn Globally.
                </h2>
                <p className="text-xl md:text-2xl text-slate-400 mb-12 leading-relaxed font-medium">
                    The end goal isn''t just a certificate. It''s a career transformation. Our graduates are prioritized for placement with global clients in the OPSly HR network.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 max-w-xl mx-auto lg:mx-0">
                    {[
                        "Vetted Profile Fast-track",
                        "Portfolio Review Assistance",
                        "Interview Performance Coaching",
                        "Direct Matching Priority"
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-slate-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-sm font-semibold">{item}</span>
                        </div>
                    ))}
                </div>
                <Link to={getInternalPath("/courses")}>
                    <Button size="lg" className="h-14 px-10 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all font-semibold w-full sm:w-auto shadow-xl shadow-blue-900/40">
                        Join Talent Marketplace
                    </Button>
                </Link>
            </div>
            
            <div className="w-full lg:w-96 shrink-0 relative">
                <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="text-sm font-bold">Global Matching</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Status: Active</div>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        {[
                            { name: "US SaaS Startup", role: "Ops Lead", pay: "$3,200/mo" },
                            { name: "UK Agency", role: "Automation Spec.", pay: "$2,800/mo" },
                            { name: "Canadian Fintech", role: "Dir. of Operations", pay: "$5,500/mo" }
                        ].map((job, i) => (
                            <div key={i} className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{job.name}</div>
                                    <div className="text-xs font-bold text-slate-200">{job.role}</div>
                                </div>
                                <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">{job.pay}</div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Marketplace Integration</div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="w-[85%] h-full bg-blue-600" />
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. BROWSE COURSES CTA BIG */}
      <section className="py-32 px-6 bg-white overflow-hidden text-center">
        <div className="container max-w-[800px] mx-auto">
            <h2 className="text-4xl md:text-6xl font-semibold mb-8 tracking-tight">Ready to Level Up?</h2>
            <p className="text-base md:text-lg text-slate-500 mb-12 leading-relaxed font-medium">
                Choose your learning path and start your journey towards high-income, global work opportunities today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <Link to={getInternalPath("/courses")}>
                   <Button size="lg" className="h-16 px-12 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all font-semibold shadow-xl shadow-blue-200/50">
                       Browse Course Catalog
                   </Button>
               </Link>
               <Link to={getInternalPath("/signup")} className="h-16 px-10 flex items-center justify-center text-slate-900 border border-slate-200 hover:border-slate-900 rounded-full font-semibold transition-all">
                   Become Targeted Talent
               </Link>
            </div>
            <p className="mt-8 text-sm font-semibold text-slate-400">Applications open for May 2026 Cohorts</p>
        </div>
      </section>

    </div>
  );
};

export default AcademyHome;
