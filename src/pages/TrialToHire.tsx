
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Users, BarChart3 } from "lucide-react";

const TrialToHire = () => {
    return (
        <div className="bg-white font-inter">
            {/* HERO SECTION */}
            <section className="pt-32 md:pt-48 pb-24 md:pb-32 px-6">
                <div className="container max-w-[1200px] mx-auto text-center lg:text-left">
                    <div className="max-w-4xl mx-auto lg:mx-0">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-8 shadow-sm">
                                Flexible Engagement
                            </div>
                            <h1 className="text-4xl md:text-7xl font-semibold text-slate-900 mb-8 tracking-tight leading-[1.1]">
                                Evaluate Before <br className="hidden md:block" /> You Commit.
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 mb-12 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Launch under a managed engagement structure. Convert to full-time when performance is proven.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8">
                                <Button 
                                    size="lg" 
                                    className="h-14 px-10 text-base rounded-xl bg-slate-900 text-white hover:bg-blue-700 font-bold transition-all duration-300 shadow-sm" 
                                    asChild
                                >
                                    <Link to="/auth/signup?portal=client">
                                        Start a Structured Trial <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                
                                <Link 
                                    to="/service-models"
                                    className="text-slate-900 font-bold hover:text-blue-600 transition-colors"
                                >
                                    Compare Engagement Models →
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* SECTION 1 — HOW TRIAL ENGAGEMENT WORKS */}
            <section className="py-24 md:py-32 px-6 bg-slate-50 border-t border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">A Managed 90-Day Evaluation Model</h2>
                        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
                            Our structured trial process ensures that every engagement is measured against objective performance criteria before a long-term commitment is made.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="absolute top-12 left-0 w-full h-[1px] bg-slate-200 hidden lg:block -z-0"></div>
                        
                        {[
                            { 
                                id: "01", 
                                title: "Structured Launch", 
                                desc: "Role defined with measurable outcomes. We align on specific deliverables for the trial period." 
                            },
                            { 
                                id: "02", 
                                title: "Managed Execution", 
                                desc: "Talent operates under Taskive oversight, ensuring operational continuity from day one." 
                            },
                            { 
                                id: "03", 
                                title: "Performance Evaluation", 
                                desc: "Track delivery against defined metrics. Regular check-ins to evaluate leadership and technical depth." 
                            },
                            { 
                                id: "04", 
                                title: "Conversion or Completion", 
                                desc: "Transition to permanent employment or conclude the engagement with no long-term strings." 
                            }
                        ].map((step, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="relative z-10 p-8 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold mb-6">
                                    {step.id}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{step.title}</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    {step.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 2 — PRICING STRUCTURE */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        <div className="order-2 lg:order-1">
                            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-8 tracking-tight">Managed Engagement Pricing</h2>
                            <div className="space-y-6">
                                {[
                                    { icon: BarChart3, t: "Monthly engagement model", d: "No massive upfront costs. Pay as you scale." },
                                    { icon: Zap, t: "20%–30% platform margin", d: "Transparent operational costs built-in." },
                                    { icon: ShieldCheck, t: "Centralized payroll & compliance", d: "We handle the administrative burden." },
                                    { icon: Users, t: "Seamless conversion option", d: "Clear path to full-time hiring." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1">
                                            <item.icon className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{item.t}</h4>
                                            <p className="text-sm text-slate-500 font-medium">{item.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="order-1 lg:order-2 bg-[#0B0F19] p-12 rounded-[16px] text-white">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Engagement Dynamics</h4>
                            <div className="space-y-8">
                                <div className="pb-8 border-b border-white/10">
                                    <div className="text-sm text-slate-400 mb-2">Platform Margin</div>
                                    <div className="text-4xl font-bold">20% – 30%</div>
                                </div>
                                <div className="pb-8 border-b border-white/10">
                                    <div className="text-sm text-slate-400 mb-2">Engagement Term</div>
                                    <div className="text-4xl font-bold">90 Days <span className="text-sm text-slate-500 font-medium">minimum</span></div>
                                </div>
                                <div>
                                    <div className="text-sm text-slate-400 mb-2">Billing Cycle</div>
                                    <div className="text-4xl font-bold">Monthly <span className="text-sm text-slate-500 font-medium">consolidated</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 3 & 4 — IDEAL FOR & WHAT'S INCLUDED */}
            <section className="py-24 md:py-32 px-6 bg-slate-900 text-white">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="grid md:grid-cols-2 gap-24">
                        {/* IDEAL FOR */}
                        <div>
                            <h2 className="text-3xl md:text-4xl font-semibold mb-10 tracking-tight">Ideal For</h2>
                            <div className="grid gap-4">
                                {[
                                    "High-growth startups",
                                    "Risk-conscious hiring",
                                    "Leadership evaluation",
                                    "Scaling product & ops teams"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <span className="text-lg font-medium text-slate-100">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* WHAT'S INCLUDED */}
                        <div>
                            <h2 className="text-3xl md:text-4xl font-semibold mb-10 tracking-tight">What’s Included</h2>
                            <div className="space-y-6">
                                {[
                                    { t: "Compliance management", d: "Legal and regulatory handling across EMEA." },
                                    { t: "Centralized billing", d: "One invoice for all trial professionals." },
                                    { t: "Performance tracking", d: "Documented evaluation metrics and reporting." },
                                    { t: "Conversion support", d: "Contractual and administrative ease when you're ready to hire." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <CheckCircle2 className="h-6 w-6 text-blue-500 shrink-0" />
                                        <div>
                                            <h4 className="text-lg font-bold text-white">{item.t}</h4>
                                            <p className="text-sm text-slate-400 font-medium">{item.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-32 px-6 bg-white text-center">
                <div className="container max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl md:text-6xl font-semibold text-slate-900 mb-12 tracking-tight">Reduce Hiring Risk Without <br /> Slowing Growth.</h2>
                        <Button 
                            size="lg" 
                            variant="outline"
                            className="h-16 px-12 text-lg rounded-xl border-[1.5px] border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all duration-300 shadow-none" 
                            asChild
                        >
                            <Link to="/auth/signup?portal=client">
                                Launch a Trial <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default TrialToHire;
