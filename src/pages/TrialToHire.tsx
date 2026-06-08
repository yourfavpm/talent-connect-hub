import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Users, BarChart3 } from "lucide-react";
import { Zone, getZoneUrl } from "@/utils/subdomain";
import SEO from "@/components/SEO";

const TrialToHire = () => {
    return (
        <div className="bg-white font-inter">
            <SEO 
                title="Trial-to-Hire | Risk-Managed African Operations Talent"
                description="Evaluate top-tier African operations professionals before committing to a full-time hire. Our 90-day managed trial model ensures perfect cultural and operational fit for your growing team."
                keywords="Trial to Hire Operations, Remote Talent Evaluation, Hire African Ops Professionals Trial, Risk-Managed Remote Hiring, African Operations Talent Vetting"
            />
            <section className="pt-32 md:pt-48 pb-24 md:pb-32 px-6 overflow-hidden">
                <div className="container max-w-[1200px] mx-auto relative z-20">
                    <div className="flex flex-wrap items-center -mx-4">
                        <div className="w-full lg:w-1/2 px-4 mb-16 lg:mb-0">
                            {/* Left Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="flex flex-col items-start text-left max-w-xl"
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-8 shadow-sm">
                                    Flexible Engagement
                                </div>
                                <h1 className="text-4xl md:text-7xl font-semibold text-slate-900 mb-8 tracking-tight leading-[1.1]">
                                    Evaluate Before <br className="hidden md:block" /> You Commit.
                                </h1>
                                <p className="text-lg md:text-xl text-slate-600 mb-12 font-medium leading-relaxed max-w-2xl">
                                    Launch under a managed engagement structure. Convert to full-time when performance is proven.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row items-start justify-start gap-8">
                                    <Link to="/book-consultation" className="w-full sm:w-auto">
                                        <Button 
                                            size="lg" 
                                            className="h-16 px-12 text-lg rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold transition-all duration-300 shadow-xl shadow-blue-100 w-full" 
                                        >
                                            Start a Structured Trial <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
    
                        {/* Right Visual (Enterprise Workflow) */}
                        <div className="w-full lg:w-1/2 px-4 relative hidden lg:block">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative"
                            >
                                <div className="bg-white border border-slate-200 rounded-[24px] p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100/50 transition-colors duration-700"></div>
                                    
                                    <div className="relative space-y-0">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10">Trial Evaluation Model</div>
                                        
                                        {[
                                            { label: "Talent Match", status: "vetted" },
                                            { label: "Managed Trial", status: "active", highlight: true },
                                            { label: "Performance Review", status: "objective" },
                                            { label: "Full-Time Conversion", status: "seamless" }
                                        ].map((step, idx) => (
                                            <div key={idx} className="relative flex items-start gap-6 pb-12 last:pb-0">
                                                {/* Vertical Line */}
                                                {idx !== 3 && (
                                                    <div className="absolute left-[7px] top-[24px] w-[1px] h-[calc(100%-14px)] bg-slate-100">
                                                        <motion.div 
                                                            initial={{ height: 0 }}
                                                            animate={{ height: "100%" }}
                                                            transition={{ duration: 1, delay: 0.5 + idx * 0.2 }}
                                                            className={`w-full ${step.highlight ? 'bg-blue-600' : 'bg-blue-600/30'}`}
                                                        />
                                                    </div>
                                                )}
                                                
                                                {/* Step Indicator */}
                                                <motion.div 
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ duration: 0.4, delay: 0.4 + idx * 0.2 }}
                                                    className={`w-4 h-4 rounded-full border-2 bg-white shrink-0 mt-1.5 z-10 transition-all duration-300 ${step.highlight ? 'border-blue-600 scale-125' : 'border-slate-200'}`}
                                                />
                                                
                                                {/* Label and Status */}
                                                <div className="flex flex-col">
                                                    <span className={`text-base font-bold tracking-tight transition-colors duration-300 ${step.highlight ? 'text-slate-900' : 'text-slate-400'}`}>
                                                        {step.label}
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 transition-opacity duration-500 ${step.highlight ? 'text-blue-600 opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`}>
                                                        {step.status}
                                                    </span>
                                                </div>
    
                                                {step.highlight && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 1 }}
                                                        className="ml-auto bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider"
                                                    >
                                                        Managed Stage
                                                    </motion.div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
    
                                {/* Decorative background element */}
                                <div className="absolute -z-10 -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-2xl -rotate-6"></div>
                            </motion.div>
                        </div>
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
                                desc: "Talent operates under OpslyHR oversight, ensuring operational continuity from day one." 
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
                <div className="container max-w-7xl mx-auto">
                    <div className="flex flex-wrap items-center -mx-4">
                        <div className="w-full lg:w-1/2 px-4 mb-12 lg:mb-0">
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
                        <Link to="/book-consultation">
                            <Button 
                                size="lg" 
                                className="h-16 px-12 text-lg rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold transition-all duration-300 shadow-xl shadow-blue-100" 
                            >
                                Start a Structured Trial <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default TrialToHire;
