import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Plus, Minus } from "lucide-react";
import SEO from "@/components/SEO";

const AccordionItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-slate-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left group transition-all"
            >
                <span className="text-base font-bold text-slate-900 pr-8 group-hover:text-blue-600 transition-colors">
                    {question}
                </span>
                <div className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 transition-all duration-300 ${isOpen ? 'bg-blue-50 border-blue-200' : ''}`}>
                    {isOpen ? (
                        <Minus className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                        <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    )}
                </div>
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
            >
                <div className="pb-6 text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                    {answer}
                </div>
            </motion.div>
        </div>
    );
};

const Pricing = () => {
    return (
        <div className="bg-white min-h-screen text-slate-900 font-inter selection:bg-slate-900 selection:text-white pb-0">
            <SEO 
                title="Structured Pricing & Engagement Models"
                description="OpslyHR offers four structured workforce models to help growing businesses hire, test, and manage operational talent."
                keywords="Workforce Solutions Pricing, Operational Capacity Costs, Managed Teams Fees, Operations Hiring, Hire Operational Experts Cost"
            />

            {/* 1. HERO SECTION */}
            <section className="pt-32 md:pt-48 pb-24 px-6 relative overflow-hidden">
                <div className="container max-w-[1200px] mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
                        {/* Left Content */}
                        <div className="flex-1 w-full text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold mb-8 tracking-tight leading-[1.1] text-slate-900">
                                    Build Operational Capacity, <br className="hidden md:block" />
                                    <span className="text-blue-600">Your Way.</span>
                                </h1>
                                <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed mb-6">
                                    OpslyHR helps growing businesses hire, test, and manage operational talent through structured workforce solutions.
                                </p>
                                <p className="text-base text-slate-500 mb-12">
                                    Whether you need a single hire, a tested trial period, a fully managed team, or offshore operational capacity — Opsly gives you flexible ways to build reliable execution.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <Link to="/book-consultation" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all w-full sm:w-auto text-center">
                                        Build Your Team
                                    </Link>
                                    <Link to="/book-consultation" className="px-8 py-4 border-2 border-slate-200 text-slate-700 font-bold rounded-lg hover:border-slate-900 hover:text-slate-900 transition-all w-full sm:w-auto text-center hover:bg-slate-50">
                                        Speak to Opsly
                                    </Link>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Content - The Illustration */}
                        <div className="flex-1 w-full flex justify-end">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative w-full max-w-md"
                            >
                                <div className="bg-white border border-slate-200 rounded-[24px] p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100/50 transition-colors duration-700"></div>
                                    
                                    <div className="relative space-y-0">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10">Operational Cost Architecture</div>
                                        
                                        {[
                                            { label: "Capacity Matching", status: "vetted" },
                                            { label: "Platform Compliance", status: "centralized" },
                                            { label: "Managed Success", status: "active" },
                                            { label: "Scalable Growth", status: "unlimited" }
                                        ].map((step, idx) => (
                                            <div key={idx} className="relative flex items-start gap-6 pb-12 last:pb-0">
                                                {/* Vertical Line */}
                                                {idx !== 3 && (
                                                    <div className="absolute left-[7px] top-[24px] w-[1px] h-[calc(100%-14px)] bg-slate-100">
                                                        <motion.div 
                                                            initial={{ height: 0 }}
                                                            animate={{ height: "100%" }}
                                                            transition={{ duration: 1, delay: 0.5 + idx * 0.2 }}
                                                            className="w-full bg-blue-600/30"
                                                        />
                                                    </div>
                                                )}
                                                
                                                {/* Step Indicator */}
                                                <motion.div 
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ duration: 0.4, delay: 0.4 + idx * 0.2 }}
                                                    className={`w-4 h-4 rounded-full border-2 bg-white shrink-0 mt-1.5 z-10 transition-colors duration-300 ${idx === 1 ? 'border-blue-600' : 'border-slate-200'}`}
                                                />
                                                
                                                {/* Label and Status */}
                                                <div className="flex flex-col">
                                                    <span className={`text-base font-bold tracking-tight transition-colors duration-300 ${idx === 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                                                        {step.label}
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 ${idx === 1 ? 'text-blue-600 opacity-100' : 'text-slate-400'}`}>
                                                        {step.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Decorative background element */}
                                <div className="absolute -z-10 -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-2xl rotate-12"></div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. WHY OUR PRICING MODEL EXISTS */}
            <section className="py-24 px-6 bg-slate-50 border-y border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                        {/* Left Content */}
                        <div className="w-full lg:w-1/2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">The Problem</div>
                            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-12 tracking-tight">Hiring breaks down when businesses start scaling.</h2>
                            
                            <div className="space-y-6 text-lg text-slate-600 font-medium">
                                <p>Not because talent is unavailable.</p>
                                <p>But because execution becomes inconsistent, hiring becomes risky, and teams become difficult to manage.</p>
                                <p className="text-blue-600 font-bold">OpslyHR solves this by giving businesses structured ways to build operational capacity, depending on their stage, risk tolerance, and scale.</p>
                                <p className="pt-8 text-2xl font-bold text-slate-900">You don’t just hire through Opsly.<br className="md:hidden" /> You choose how you want to build.</p>
                            </div>
                        </div>

                        {/* Right Content - Illustration Diagram */}
                        <div className="w-full lg:w-1/2 px-4">
                            <div className="relative pt-12 pb-8 px-4 md:px-0">
                                {/* Horizontal visual spectrum */}
                                <div className="relative">
                                    <div className="h-[1px] w-full bg-slate-200 absolute top-1/2 -translate-y-1/2"></div>
                                    <div className="flex justify-between relative z-10">
                                        {[
                                            { label: "Project", sub: "Low Commitment" },
                                            { label: "Trial", sub: "Medium" },
                                            { label: "Full Time Hire", sub: "High" }
                                        ].map((point, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <div className="w-3 h-3 rounded-full bg-white border-2 border-blue-600 ring-4 ring-slate-50 mb-4 transition-transform hover:scale-125 duration-300 cursor-pointer"></div>
                                                <span className="text-sm font-bold text-slate-900 mb-1">{point.label}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{point.sub}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. HOW OPSLY PRICING WORKS (4 Models) */}
            <section className="py-24 px-6 bg-white">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-center mb-20">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">How It Works</div>
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Four Structured Workforce Models</h2>
                        <p className="text-lg text-slate-600 font-medium">OpslyHR offers four structured workforce models:</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Full Time Hire */}
                        <div className="p-8 md:p-10 border border-slate-200 rounded-2xl hover:shadow-lg transition-all flex flex-col bg-white group">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">1. Full Time Hire</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">Build your team with permanent operational talent</h3>
                            <p className="text-slate-600 mb-8 leading-relaxed">Full Time Hire is for companies that want to hire full-time operational staff quickly and reliably.</p>
                            
                            <h4 className="font-bold text-slate-900 mb-4">We handle:</h4>
                            <ul className="space-y-3 mb-8">
                                {["Talent sourcing", "Screening and vetting", "Role alignment", "Interview coordination", "Final candidate selection"].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                        <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm font-medium text-slate-500 mb-8 italic px-4 border-l-2 border-slate-200">Once hired, the talent becomes part of your internal team.</p>
                            
                            <div className="mt-auto">
                                <h4 className="font-bold text-slate-900 mb-3">Best for:</h4>
                                <ul className="list-disc pl-5 space-y-1 mb-8 text-sm text-slate-600 font-medium">
                                    <li>Companies ready for long-term hires</li>
                                    <li>Teams with defined operational needs</li>
                                    <li>Businesses building internal structure</li>
                                </ul>
                                <div className="pt-6 border-t border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pricing</div>
                                    <p className="font-bold text-slate-900">One-time placement fee per hire</p>
                                    <p className="text-xs text-slate-500 mt-1">(Varies by role level and complexity)</p>
                                </div>
                            </div>
                        </div>

                        {/* Trial-to-Hire */}
                        <div className="p-8 md:p-10 border border-slate-200 rounded-2xl hover:shadow-lg transition-all flex flex-col bg-white group">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">2. Trial-to-Hire</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">Test talent before making a permanent decision</h3>
                            <p className="text-slate-600 mb-8 leading-relaxed">Trial-to-Hire allows you to work with candidates before committing long-term.</p>
                            
                            <h4 className="font-bold text-slate-900 mb-4">We manage:</h4>
                            <ul className="space-y-3 mb-8">
                                {["Shortlisted candidate selection", "Paid trial period setup", "Performance monitoring during trial", "Evaluation reports", "Final hire recommendation"].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                        <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm font-medium text-slate-500 mb-8 italic px-4 border-l-2 border-slate-200">This reduces hiring risk and improves long-term fit.</p>

                            <div className="mt-auto">
                                <h4 className="font-bold text-slate-900 mb-3">Best for:</h4>
                                <ul className="list-disc pl-5 space-y-1 mb-8 text-sm text-slate-600 font-medium">
                                    <li>Companies unsure about role requirements</li>
                                    <li>High-risk or critical hires</li>
                                    <li>Teams prioritizing performance validation</li>
                                </ul>
                                <div className="pt-6 border-t border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pricing</div>
                                    <p className="font-bold text-slate-900">Trial setup fee + placement fee upon conversion</p>
                                    <p className="font-bold text-slate-900 mt-1">Monthly trial management fee (if applicable)</p>
                                </div>
                            </div>
                        </div>

                        {/* Managed Team */}
                        <div className="p-8 md:p-10 border-2 border-blue-600 rounded-2xl shadow-xl relative flex flex-col bg-blue-50/10 md:col-span-2 lg:col-span-1">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-bl-2xl rounded-tr-[14px]">Core Opsly Model</div>
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">3. Managed Team</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Build and run operational teams without internal hiring burden</h3>
                            <p className="text-slate-600 mb-8 leading-relaxed">This is Opsly’s core offering. We don’t just help you hire. We build and manage your operational workforce.</p>
                            
                            <h4 className="font-bold text-slate-900 mb-4">We handle:</h4>
                            <ul className="space-y-3 mb-8">
                                {["Talent sourcing and onboarding", "Role structuring and alignment", "Performance tracking and accountability", "Workforce coordination", "Reporting and oversight", "Replacement and continuity support"].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                        <Check className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm font-bold text-blue-700 mb-8 italic px-4 border-l-2 border-blue-200">You get a functioning operational team without managing every detail internally.</p>

                            <div className="mt-auto">
                                <h4 className="font-bold text-slate-900 mb-3">Best for:</h4>
                                <ul className="list-disc pl-5 space-y-1 mb-8 text-sm text-slate-600 font-medium">
                                    <li>Growing businesses</li>
                                    <li>Founders overloaded with operations</li>
                                    <li>Companies scaling execution teams</li>
                                    <li>Agencies and service businesses</li>
                                </ul>
                                <div className="pt-6 border-t border-slate-200">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pricing</div>
                                    <p className="font-bold text-slate-900">Setup fee per hire or team build</p>
                                    <p className="font-bold text-slate-900 mt-1">Monthly management fee per staff member or bundled team plan</p>
                                </div>
                            </div>
                        </div>

                        {/* Offshore Hiring */}
                        <div className="p-8 md:p-10 border border-slate-200 rounded-2xl hover:shadow-lg transition-all flex flex-col bg-white group md:col-span-2 lg:col-span-1">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">4. Offshore Hiring</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">Build cost-efficient operational teams across global talent markets</h3>
                            <p className="text-slate-600 mb-8 leading-relaxed">Opsly enables companies to hire operational talent from offshore markets while maintaining structure, oversight, and reliability.</p>
                            
                            <h4 className="font-bold text-slate-900 mb-4">We manage:</h4>
                            <ul className="space-y-3 mb-8">
                                {["Offshore talent sourcing", "Vetting and compliance alignment", "Time zone and workflow structuring", "Communication setup", "Performance oversight (optional depending on plan)"].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                        <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm font-medium text-slate-500 mb-8 italic px-4 border-l-2 border-slate-200">This allows companies to scale teams efficiently without sacrificing quality or structure.</p>

                            <div className="mt-auto">
                                <h4 className="font-bold text-slate-900 mb-3">Best for:</h4>
                                <ul className="list-disc pl-5 space-y-1 mb-8 text-sm text-slate-600 font-medium">
                                    <li>Companies optimizing operational costs</li>
                                    <li>Remote-first organizations</li>
                                    <li>Startups scaling globally</li>
                                    <li>Businesses building distributed teams</li>
                                </ul>
                                <div className="pt-6 border-t border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pricing</div>
                                    <p className="font-bold text-slate-900">Placement fee per hire</p>
                                    <p className="font-bold text-slate-900 mt-1">Optional monthly management fee for oversight</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. WHICH MODEL SHOULD YOU CHOOSE? */}
            <section className="py-24 px-6 bg-slate-50 border-y border-slate-100">
                <div className="container max-w-[1000px] mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Which Model Should You Choose?</h2>
                        <p className="text-lg text-slate-600 font-medium">Choose based on your need:</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        {[
                            { title: "Full Time Hire", desc: "You want fast permanent hires" },
                            { title: "Trial-to-Hire", desc: "You want reduced hiring risk" },
                            { title: "Managed Team", desc: "You want Opsly to run execution with you" },
                            { title: "Offshore Hiring", desc: "You want scalable global talent access" }
                        ].map((model, i) => (
                            <div key={i} className="flex items-center p-6 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-blue-600 hover:shadow-md transition-all group">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 mr-4 shrink-0 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">{model.title}</h4>
                                    <p className="text-sm text-slate-600 font-medium">{model.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. WHAT MAKES OPSLY DIFFERENT */}
            <section className="py-24 px-6 bg-[#0B0F19] text-white">
                <div className="container max-w-[1000px] mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-semibold mb-8 tracking-tight">What Makes Opsly Different</h2>
                    <p className="text-xl text-slate-400 font-medium mb-16 leading-relaxed">
                        Most hiring platforms stop at placement. <br className="hidden md:block" />
                        <span className="text-white">Opsly continues through execution.</span>
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 text-left grid md:grid-cols-2 gap-10 mb-16">
                        <div>
                            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-6">We provide:</div>
                            <ul className="space-y-5">
                                {["Structured hiring processes", "Role-specific talent matching", "Trial validation options"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-4 text-lg font-medium text-slate-200">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                            <Check className="w-3.5 h-3.5 text-blue-400" /> 
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-6 md:invisible">More:</div>
                            <ul className="space-y-5">
                                {["Managed workforce systems", "Offshore scaling capability", "Ongoing support and replacement coverage"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-4 text-lg font-medium text-slate-200">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                            <Check className="w-3.5 h-3.5 text-blue-400" /> 
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    <h3 className="text-2xl md:text-4xl font-bold tracking-tight text-blue-400 leading-tight">
                        We don’t just help you hire people.<br/>
                        <span className="text-white">We help you build teams that function.</span>
                    </h3>
                </div>
            </section>

            {/* 6. GLOBAL OUTSOURCING PRICING CLARITY (Retained from original) */}
            <section className="py-24 px-6 bg-[#0B0F19] text-white overflow-hidden relative border-t border-white/10">
                <div className="container max-w-[1200px] mx-auto relative z-10">
                    <div className="max-w-3xl">
                        <h2 className="text-3xl md:text-5xl font-semibold mb-8 tracking-tight">Global Talent. Local Compliance.</h2>
                        <p className="text-lg text-slate-400 font-medium leading-relaxed mb-12">
                            Tap into offshore cost efficiency without the operational burden of setting up international entities or managing foreign labor laws.
                        </p>
                        
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { t: "40–60% Savings", d: "Compared to local hiring" },
                                { t: "Zero Legal Prep", d: "We handle local entities" },
                                { t: "Single Currency", d: "Consolidated billing" }
                            ].map((item, i) => (
                                <div key={i} className="pl-6 border-l border-white/10">
                                    <h4 className="text-xl font-bold mb-2">{item.t}</h4>
                                    <p className="text-sm text-slate-500 font-medium">{item.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80')] bg-cover bg-center grayscale invert"></div>
            </section>

            {/* 7. FAQ SECTION (Retained from original) */}
            <section className="py-24 px-6 bg-slate-50">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-center mb-20">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Decision Clarity</div>
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Common Pricing & Engagement Questions</h2>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 relative">
                        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-slate-200 hidden lg:block -translate-x-1/2"></div>
                        
                        <div className="space-y-4">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">Engagement & Hiring</div>
                            {[
                                { q: "Are there any upfront activation fees?", answer: "No. OpslyHR does not charge setup or search fees. You only pay for capacity once an engagement begins or a hire is finalized." },
                                { q: "Do you require exclusivity?", answer: "Exclusivity is not required for contingent full time hire placements. However, for managed trials and projects, we focus on dedicated delivery." },
                                { q: "What is your replacement guarantee?", answer: "Full-time placements include a 120-day replacement guarantee. Managed trials can be terminated or changed at any point with 30 days notice." }
                            ].map((faq, i) => (
                                <AccordionItem key={i} question={faq.q} answer={faq.answer} />
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">Compliance & Billing</div>
                            {[
                                { q: "How is global payroll managed?", answer: "OpslyHR acts as the Employer of Record for offshore professionals, handling all local taxes, benefits, and labor laws. You pay one invoice." },
                                { q: "Can we convert a trial professional to full-time?", answer: "Yes. Our Trial-to-Hire model includes a pre-defined conversion schedule based on the duration of the trial period." },
                                { q: "Which currencies do you support for billing?", answer: "We primarily bill in USD, EUR, and GBP, but we can accommodate local currency billing for qualified enterprise accounts." }
                            ].map((faq, i) => (
                                <AccordionItem key={i} question={faq.q} answer={faq.answer} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. EXECUTION SECTION */}
            <section className="py-24 px-6 bg-white border-t border-slate-100 overflow-hidden relative">
                <div className="container max-w-[1200px] mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
                        {/* Left Content */}
                        <div className="flex-1 w-full text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                            >
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-8 tracking-tight leading-[1.1] text-slate-900">
                                    OpslyHR is built for businesses that are <br className="hidden lg:block" /> serious about <span className="text-blue-600">execution.</span>
                                </h2>
                                <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed mb-10 max-w-2xl">
                                    Whether you are hiring one person or building an entire operational function — we give you structured ways to scale.
                                </p>
                                <div className="flex flex-col gap-5 text-sm font-bold uppercase tracking-widest text-slate-400">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                            <Check className="w-4 h-4 text-slate-300" />
                                        </div>
                                        <span>Not guesswork.</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                            <Check className="w-4 h-4 text-slate-300" />
                                        </div>
                                        <span>Not random hiring.</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                            <Check className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-blue-600">Structured workforce building.</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Content - Illustration */}
                        <div className="flex-1 w-full flex justify-end">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative w-full max-w-md"
                            >
                                <div className="bg-white border border-slate-200 rounded-[24px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100/50 transition-colors duration-700"></div>
                                    
                                    <div className="relative space-y-5 z-10">
                                        {[
                                            { title: "Define Requirements", complete: true },
                                            { title: "Source & Vet Talent", complete: true },
                                            { title: "Onboard & Structure", complete: true },
                                            { title: "Manage Execution", complete: true }
                                        ].map((step, i) => (
                                            <div key={i} className="h-16 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center px-4 gap-4 transition-transform hover:-translate-y-1 duration-300">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                                    <span className="text-slate-400 font-bold text-xs">0{i + 1}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-slate-700">{step.title}</div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                                    <Check className="w-3.5 h-3.5 text-blue-500" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Decorative background element */}
                                <div className="absolute -z-10 -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-2xl rotate-12"></div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 9. PREFOOTER (Not sure which model fits) */}
            <section className="py-24 px-6 bg-slate-50 border-t border-slate-100">
                <div className="container max-w-[800px] mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-6 tracking-tight">Not Sure Which Model Fits?</h2>
                    <p className="text-base text-slate-600 font-medium leading-relaxed mb-10 max-w-2xl mx-auto">
                        Every organization has unique operational requirements. Speak with our engagement experts to determine the most cost-effective and risk-aligned model for your team.
                    </p>
                    <div className="flex justify-center">
                        <Link 
                            to="/book-consultation"
                            className="inline-flex items-center justify-center px-10 py-5 border-2 border-slate-900 text-slate-900 font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all duration-300 sm:w-auto w-full"
                        >
                            Book a Structured Consultation →
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Pricing;
