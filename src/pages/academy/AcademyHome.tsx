import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Shield, Globe, Users, Zap, Briefcase, TrendingUp, Brain, FolderOpen, Award, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { ACADEMY_COURSES } from "@/data/academy-courses";
import CourseCard from "@/components/academy/CourseCard";
import TestimonialCard from "@/components/academy/TestimonialCard";
import { Zone, getZoneUrl } from "@/utils/subdomain";

const AcademyHome = () => {
  const flagshipCourse = ACADEMY_COURSES.find(c => c.isFlagship) || ACADEMY_COURSES[0];

  return (
    <div className="bg-white min-h-screen text-slate-900 font-inter">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-16 md:pt-24 md:pb-20 lg:pt-32 lg:pb-32 px-3 md:px-6 overflow-hidden bg-slate-900 text-white">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container max-w-[1200px] mx-auto relative z-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="flex-1 animate-slide-up">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 md:mb-6 lg:mb-8 leading-[1.1]">
                Build AI-Powered Operational Skills. <br />
                <span className="text-blue-400">Access Global Work.</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 mb-6 md:mb-8 lg:mb-12 max-w-2xl leading-relaxed font-medium">
                OPSly Academy transforms African professionals into world-class operations experts. Master the tools of the future and get placed in the global OPSly talent marketplace.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-10 md:mb-12">
                <Link to="/courses" className="w-full sm:w-auto">
                  <Button size="lg" className="h-12 md:h-14 px-6 md:px-10 text-sm md:text-base bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all font-semibold w-full">
                    Browse Courses
                  </Button>
                </Link>
                <Link to="/marketplace" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="h-12 md:h-14 px-6 md:px-8 text-sm md:text-base border-white/20 text-white hover:bg-white/5 rounded-full font-semibold flex items-center justify-center gap-2 w-full">
                    Join Talent Marketplace <ArrowRight className="w-3 md:w-4 h-3 md:h-4" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 md:gap-x-8 gap-y-3 md:gap-y-4 pt-6 md:pt-8 border-t border-white/5">
                {[
                  { label: "Placement Rate", val: "98%" },
                  { label: "Avg. Income Increase", val: "3.5x" },
                  { label: "Vetted Network", val: "500+" }
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-lg md:text-xl font-bold text-white">{stat.val}</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600/5 blur-[100px] rounded-full" />
                <div className="relative bg-slate-800 rounded-3xl border border-white/10 p-4 shadow-2xl">
                  {/* Visual mockup of learning experience */}
                  <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video border border-white/5 flex items-center justify-center">
                    <div className="text-center p-8">
                        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <Zap className="w-8 h-8 text-blue-500" />
                        </div>
                        <h4 className="text-white font-bold mb-2">Weekly Live Workshop</h4>
                        <p className="text-slate-500 text-sm">Building AI Automation Systems for SaaS Teams</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex-grow">
                            <div className="h-2 w-24 bg-white/20 rounded-full mb-1.5" />
                            <div className="h-1.5 w-16 bg-white/10 rounded-full" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 opacity-60">
                         <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-grow">
                            <div className="h-2 w-32 bg-white/20 rounded-full mb-1.5" />
                            <div className="h-1.5 w-20 bg-white/10 rounded-full" />
                        </div>
                    </div>
                  </div>
                </div>
                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-xl text-slate-900 animate-bounce cursor-default">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">New Opportunity</div>
                    <div className="text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Operations Manager, Remote
                    </div>
                </div>
              </div>
            </div>
          </div>
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
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 relative z-10">
              {[
                { step: "01", icon: Brain, title: "Learn AI Ops", desc: "Master high-income operational automation skills in intensive programs.", color: "from-purple-100 to-purple-50" },
                { step: "02", icon: FolderOpen, title: "Build Portfolio", desc: "Build real-world systems for simulated and real client scenarios.", color: "from-blue-100 to-blue-50" },
                { step: "03", icon: Award, title: "Get Vetted", desc: "Pass the gold-standard OPSly vetting process to verify your skills.", color: "from-emerald-100 to-emerald-50" },
                { step: "04", icon: Rocket, title: "Get Placed", desc: "Access global companies and earn in multiple currencies remotely.", color: "from-orange-100 to-orange-50" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className={`w-16 md:w-24 h-16 md:h-24 rounded-full bg-gradient-to-br ${item.color} border-2 border-white shadow-lg flex items-center justify-center mb-3 md:mb-6 relative group hover:shadow-2xl transition-all duration-300`}>
                    {(() => {
                      switch(i) {
                        case 0: return <item.icon className="w-6 md:w-10 h-6 md:h-10 text-purple-600" />;
                        case 1: return <item.icon className="w-6 md:w-10 h-6 md:h-10 text-blue-600" />;
                        case 2: return <item.icon className="w-6 md:w-10 h-6 md:h-10 text-emerald-600" />;
                        case 3: return <item.icon className="w-6 md:w-10 h-6 md:h-10 text-orange-600" />;
                        default: return <item.icon className="w-6 md:w-10 h-6 md:h-10 text-blue-600" />;
                      }
                    })()}
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shadow-lg border-2 border-white">
                        {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 md:mb-3">{item.title}</h3>
                  <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED PROGRAM */}
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
                <img src="https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80" alt="Learning" className="w-full h-full object-cover grayscale opacity-40 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent" />
                
                {/* Floating Tool Badges */}
                <div className="absolute inset-0 flex items-center justify-center p-12">
                     <div className="flex flex-wrap gap-4 justify-center max-w-sm">
                        {flagshipCourse.tools.map(tool => (
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

      {/* 5. COURSE CATALOG PREVIEW */}
      <section className="py-24 px-6 bg-slate-50 border-y border-slate-100">
        <div className="container max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                <div className="max-w-xl">
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Our Learning Paths</h2>
                    <p className="text-base md:text-lg text-slate-500 leading-relaxed font-medium">Practical, outcome-driven programs designed to get you hired globally.</p>
                </div>
                <Link to="/courses">
                    <Button variant="ghost" className="group text-blue-600 hover:text-blue-700 font-bold flex items-center gap-2">
                        View All Courses <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ACADEMY_COURSES.slice(0, 3).map((course) => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
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
            {ACADEMY_COURSES[0].testimonials.map((testimonial, i) => (
                <TestimonialCard key={i} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

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
                <Link to="/marketplace">
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
               <Link to="/courses">
                   <Button size="lg" className="h-16 px-12 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all font-semibold shadow-xl shadow-blue-200/50">
                       Browse Course Catalog
                   </Button>
               </Link>
               <a href={getZoneUrl(Zone.AUTH, "/auth/signup?portal=talent")} className="h-16 px-10 flex items-center justify-center text-slate-900 border border-slate-200 hover:border-slate-900 rounded-full font-semibold transition-all">
                   Become Targeted Talent
               </a>
            </div>
            <p className="mt-8 text-sm font-semibold text-slate-400">Applications open for May 2026 Cohorts</p>
        </div>
      </section>

    </div>
  );
};

export default AcademyHome;
