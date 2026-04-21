import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
    Globe, 
    ArrowRight, 
    CheckCircle, 
    Shield, 
    Briefcase, 
    Zap, 
    TrendingUp,
    CheckCircle2,
    Users
} from "lucide-react";
import { motion } from "framer-motion";
import { Zone, getZoneUrl } from "@/utils/subdomain";
import TestimonialCard from "@/components/academy/TestimonialCard";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CourseTestimonial } from "@/components/academy/TestimonialCard";

const TalentMarketplace = () => {
    const [testimonials, setTestimonials] = useState<CourseTestimonial[]>([]);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase
                .from("academy_courses")
                .select("testimonials")
                .eq("is_live", true)
                .not("testimonials", "is", null)
                .limit(1)
                .single();
            if (data?.testimonials) {
                setTestimonials(data.testimonials as CourseTestimonial[]);
            }
        };
        fetch();
    }, []);
    return (
        <div className="bg-white min-h-screen font-inter">
            
            {/* HERO */}
            <section className="pt-20 md:pt-24 pb-16 md:pb-32 px-3 md:px-6 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="container max-w-[1200px] mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase mb-6 md:mb-10">Ecosystem Bridge</div>
                    <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-8 leading-[1.1] tracking-tight">
                        You Mastered the Skills. <br />
                        <span className="text-blue-400">Now Get Placed globally.</span>
                    </h1>
                    <p className="text-base md:text-lg lg:text-xl text-slate-400 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                        The OPSly HR talent marketplace is where world-class companies come to hire pre-screened operations professionals. As an academy graduate, you are fast-tracked into the pipeline.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a href={getZoneUrl(Zone.AUTH, "/auth/signup?portal=talent")}>
                            <Button size="lg" className="h-16 px-12 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all font-bold shadow-2xl shadow-blue-900/40">
                                Join Talent Marketplace
                            </Button>
                        </a>
                        <Link to="/courses">
                            <Button variant="outline" size="lg" className="h-16 px-10 text-lg border-white/20 text-white hover:bg-white/5 rounded-full font-bold">
                                Browse Skills
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* BENEFITS PANEL */}
            <section className="py-16 md:py-24 px-3 md:px-6 border-b border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                        {[
                            {
                                title: "Global Client Access",
                                desc: "Work with SaaS startups, agencies, and enterprises in the US, UK, and Europe from anywhere in Africa.",
                                icon: Globe,
                                color: "bg-blue-50 text-blue-600"
                            },
                            {
                                title: "Real Project Matching",
                                desc: "No more endless job hunting. We match your vetted skills directly to active projects and roles.",
                                icon: Briefcase,
                                color: "bg-emerald-50 text-emerald-600"
                            },
                            {
                                title: "Multi-Currency Income",
                                desc: "Get paid fairly in USD, EUR, or GBP. We manage the contracts, billing, and global payout for you.",
                                icon: TrendingUp,
                                color: "bg-amber-50 text-amber-600"
                            }
                        ].map((item, i) => (
                            <div key={i} className="p-4 md:p-10 rounded-2xl md:rounded-[32px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className={`w-10 md:w-14 h-10 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center mb-4 md:mb-8 ${item.color}`}>
                                    <item.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 md:mb-4">{item.title}</h3>
                                <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-24 px-6 bg-slate-50 border-b border-slate-100">
                <div className="container max-w-[1000px] mx-auto">
                    <div className="text-center mb-20 animate-slide-up">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">The Bridge to Global Work</h2>
                        <p className="text-lg text-slate-500 font-medium">Our placement system is designed to remove the friction between learning and earning.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { 
                                title: "Complete Your Advanced Specialization", 
                                desc: "Graduate from any OPSly Academy program with a passing grade on your capstone project.",
                                step: 1
                            },
                            { 
                                title: "Vetted Profile Certification", 
                                desc: "Your academy performance fast-tracks you through our vetting system. Get certified as an L1-L3 professional.",
                                step: 2
                            },
                            { 
                                title: "Client Matching & Placement", 
                                desc: "Our placement team matches your profile with global companies looking for your specific operational expertise.",
                                step: 3
                            }
                        ].map((step, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 flex items-start gap-8">
                                <span className="text-4xl font-bold text-slate-100 font-display shrink-0 mt-2">0{step.step}</span>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h4>
                                    <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                                </div>
                                <div className="ml-auto flex items-center justify-center pt-2">
                                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

             {/* TESTIMONIAL STRIP */}
             <section className="py-24 px-6 bg-white overflow-hidden">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Joined by Vetted Leaders</h2>
                        <p className="text-lg text-slate-500 font-medium">Professionals across Africa are already working globally through the OPSly marketplace.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, i) => (
                            <TestimonialCard key={i} testimonial={testimonial} />
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-32 px-6 bg-slate-900 text-white overflow-hidden text-center relative">
                <div className="absolute inset-0 bg-blue-600/5 blur-[100px] pointer-events-none" />
                
                <div className="container max-w-[800px] mx-auto relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Ready to Work with <br /><span className="text-blue-400">Global Teams?</span></h2>
                    <p className="text-xl text-slate-400 mb-12 leading-relaxed font-medium">
                        Join the OPSly HR talent marketplace today. Even if you haven''t started a course yet, we''ll help you identify the right learning path for your career goals.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a href={getZoneUrl(Zone.AUTH, "/auth/signup?portal=talent")}>
                            <Button size="lg" className="h-16 px-12 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all font-bold shadow-2xl shadow-blue-900/40">
                                Sign Up to OPSlyHR
                            </Button>
                        </a>
                        <Link to="/courses">
                            <Button variant="outline" size="lg" className="h-16 px-10 text-lg border-white/20 text-white hover:bg-white/5 rounded-full font-bold">
                                View Academy Courses
                            </Button>
                        </Link>
                    </div>
                    <div className="mt-12 flex items-center justify-center gap-6 opacity-40">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-white" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Global Compliance</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-white" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Rapid Matching</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-white" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Vetted Network</span>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default TalentMarketplace;
