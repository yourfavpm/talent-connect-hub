import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, DollarSign, ShieldCheck, Briefcase, Zap, Globe, Lock, ArrowRight, UserCheck, Star, TrendingUp, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";

const ForProfessionals = () => {
    return (
        <div className="bg-white min-h-screen text-slate-900 selection:bg-blue-600 selection:text-white font-inter">

            {/* Header / Hero - Enterprise SaaS Style */}
            <section className="relative pt-40 pb-12 md:pt-40 md:pb-16 flex flex-col justify-center px-6 bg-slate-50/50 overflow-hidden">
                <div className="container max-w-7xl mx-auto relative z-20 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <div className="flex flex-col items-start text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8 shadow-sm">
                            For Operations Professionals
                        </div>
                        <h1 className="text-3xl md:text-7xl font-semibold mb-6 md:mb-8 text-slate-900 leading-[1.2] md:leading-[1.1] tracking-tight">
                            Join a Curated <br className="hidden md:block" />
                            Network of <span className="text-blue-600">High-Impact</span> Operators
                        </h1>
                        <p className="text-base md:text-xl text-slate-600 mb-10 md:mb-12 leading-relaxed max-w-xl font-medium">
                            Work with ambitious companies through structured, vetted engagements — with contracts, compliance, and payments handled centrally.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-start gap-8 w-full sm:w-auto">
                            <Button 
                                size="lg" 
                                variant="outline"
                                className="h-16 px-12 text-lg rounded-xl border-[1.5px] border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold transition-all duration-300 shadow-none w-full sm:w-auto" 
                                asChild
                            >
                                <Link to="/auth/signup?portal=talent">Apply as Talent</Link>
                            </Button>
                            
                            <Link 
                                to="#"
                                className="inline-flex items-center text-slate-900 font-semibold hover:text-blue-600 transition-colors justify-start"
                            >
                                View Open Roles <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Visual Panel - Redesigned Dashboard Style */}
                    <div className="relative hidden lg:block">
                        <div className="relative z-10 bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 overflow-hidden min-h-[380px] md:min-h-[480px] flex flex-col">
                            {/* Profile Header */}
                            <div className="flex items-center gap-6 mb-8 pb-6 border-b border-slate-100">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden">
                                    <img 
                                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80" 
                                        className="w-full h-full object-cover" 
                                        alt="Professional Operator" 
                                    />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="text-xl font-bold text-slate-900 tracking-tight">Vetted Operator</div>
                                        <div className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-md border border-green-100 flex items-center gap-1">
                                            <Check className="w-2.5 h-2.5" />
                                            ACTIVE
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium">Product Operations Manager</div>
                                </div>
                            </div>

                            {/* Skills & Metrics */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Focus Area</div>
                                    <div className="text-sm font-bold text-slate-800">Fintech Scaleups</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Experience</div>
                                    <div className="text-sm font-bold text-slate-800">8+ Years</div>
                                </div>
                            </div>

                            {/* Execution Timeline Mockup */}
                            <div className="mt-auto space-y-4">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Engagement Progress</div>
                                <div className="space-y-3">
                                    {[
                                        { label: "Requirements Definition", status: "completed" },
                                        { label: "Technical Vetting", status: "completed" },
                                        { label: "Matching & Interview", status: "active" },
                                        { label: "Managed Activation", status: "pending" }
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${step.status === 'completed' ? 'bg-blue-600' : step.status === 'active' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-200'}`} />
                                            <div className={`text-xs font-semibold ${step.status === 'pending' ? 'text-slate-400' : 'text-slate-700'}`}>{step.label}</div>
                                            {step.status === 'completed' && <Check className="w-3 h-3 text-blue-600 ml-auto" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Floating Metadata Tag */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 }}
                                className="absolute top-8 right-8 bg-blue-600 text-white rounded-xl shadow-xl p-4 flex flex-col items-center gap-1 border border-blue-500/20"
                            >
                                <Users className="h-5 w-5 mb-1" />
                                <span className="text-[10px] font-bold">TOP 1%</span>
                            </motion.div>
                        </div>
                        
                        {/* Decorative background element */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -z-10 opacity-40"></div>
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-slate-200/50 rounded-full blur-3xl -z-10 opacity-40"></div>
                    </div>
                </div>
            </section>

            {/* THE DEAL: Minimalist Grid */}
            <section className="py-16 md:py-24 px-6">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
                        <div className="pt-8 border-t border-slate-200">
                            <div className="text-[10px] font-bold uppercase tracking-widest mb-6 text-slate-400">01 — The Work</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Build, Don't Maintain.</h3>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                We partner with companies in transformation. You're here to launch, fix, or scale. High impact roles only.
                            </p>
                        </div>
                        <div className="pt-8 border-t border-slate-200">
                            <div className="text-[10px] font-bold uppercase tracking-widest mb-6 text-slate-400">02 — The Pay</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Top of Market.</h3>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                Transparent, weekly payouts. We handle invoicing and collections so you can focus on the craft.
                            </p>
                        </div>
                        <div className="pt-8 border-t border-slate-200">
                            <div className="text-[10px] font-bold uppercase tracking-widest mb-6 text-slate-400">03 — The Life</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Total Freedom.</h3>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                Remote-first. Asynchronous. You define how you work best. We just handle the compliance.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* RECENT OPERATOR DEPLOYMENTS: Board Layout */}
            <section className="py-24 px-6 bg-slate-50 border-y border-slate-100 font-inter">
                <div className="container max-w-[1200px] mx-auto grid lg:grid-cols-[1fr_2fr] gap-20 items-start">
                    <div className="animate-slide-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8 shadow-sm">Recent Operator Deployments</div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-slate-900 leading-tight tracking-tight">Where Our Talent Is Making Impact</h2>
                        <p className="text-lg text-slate-600 mb-10 font-medium leading-relaxed max-w-md">
                            A snapshot of recent engagements across product and operations — from logistics unicorns to AI research labs.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {[
                            { 
                                role: "Fractional CPO", 
                                industry: "Fintech Scaleup", 
                                type: "Fractional Trial", 
                                comp: "$3,500 / week", 
                                status: "Active" 
                            },
                            { 
                                role: "Chief of Staff", 
                                industry: "AI Research Lab", 
                                type: "Direct Hire", 
                                comp: "$180k + Equity", 
                                status: "Converted" 
                            },
                            { 
                                role: "Head of Growth", 
                                industry: "SaaS Platform", 
                                type: "Direct Hire", 
                                comp: "$220k Base", 
                                status: "Ongoing" 
                            },
                            { 
                                role: "Ops Architect", 
                                industry: "Logistics Unicorn", 
                                type: "Project", 
                                comp: "$250 / hour", 
                                status: "Active" 
                            }
                        ].map((item, i) => (
                            <div key={i} className="px-8 py-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="text-lg font-bold text-slate-900">{item.role}</div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                        <span>{item.industry}</span>
                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span className="text-slate-400">Engagement: {item.type}</span>
                                    </div>
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                                    <div className="text-sm font-bold text-slate-900">{item.comp}</div>
                                    <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                                        item.status === 'Active' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                        item.status === 'Converted' ? 'bg-green-50 text-green-600 border-green-100' :
                                        'bg-slate-50 text-slate-600 border-slate-100'
                                    }`}>
                                        {item.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* OUR VETTING STANDARD: Process Flow */}
            <section className="py-16 md:py-24 px-6 bg-white font-inter">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-center mb-16 md:mb-24">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8 shadow-sm">Our Vetting Standard</div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">A Structured Path Into the Network</h2>
                        <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto mb-4">
                            We curate operators based on documented execution — not keywords.
                        </p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Selective admission. Outcome-driven evaluation.
                        </p>
                    </div>

                    <div className="relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="absolute top-[32px] left-[15%] right-[15%] h-[1px] border-t border-dashed border-slate-200 hidden md:block" />
                        
                        <div className="grid md:grid-cols-3 gap-16 relative z-10">
                            {[
                                { 
                                    step: "01", 
                                    title: "Apply as Talent", 
                                    desc: "Submit your profile, documented outcomes, and operational track record.",
                                    icon: UserCheck
                                },
                                { 
                                    step: "02", 
                                    title: "Skill & Impact Review", 
                                    desc: "Our team evaluates execution history, decision-making depth, and functional expertise.",
                                    icon: Shield
                                },
                                { 
                                    step: "03", 
                                    title: "Structured Matching", 
                                    desc: "Qualified operators are matched with curated engagements aligned to their strengths.",
                                    icon: Briefcase
                                }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center text-center group">
                                    <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-8 shadow-sm group-hover:border-blue-600 group-hover:text-blue-600 transition-all duration-300 relative">
                                        <div className="text-sm font-bold">{item.step}</div>
                                    </div>
                                    <div className="mb-6">
                                        <item.icon className="h-6 w-6 text-slate-400 mx-auto" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">{item.title}</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed text-sm max-w-[280px]">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default ForProfessionals;
