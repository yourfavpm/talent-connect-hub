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
                title="Transparent Pricing for African Operations Talent"
                description="Explore flexible engagement models for hiring vetted African operations professionals. Transparent pricing for direct hire, structured trials, and project-based support."
                keywords="African Operations Talent Pricing, Remote Hiring Costs, Vetted Talent Fees, EMEA Operations Hiring, Hire African Experts Cost"
            />

            {/* 1. HERO SECTION */}
            <section className="pt-40 pb-24 px-6 relative overflow-hidden">
                <div className="container max-w-[1200px] mx-auto relative z-10 flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col items-start text-left"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8 shadow-sm">
                                Pricing Structure
                            </div>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold mb-8 tracking-tight leading-[1.1] text-slate-900">
                                Transparent Engagement Pricing. <br className="hidden md:block" />
                                <span className="text-slate-400">Built for Scale.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed max-w-xl mb-12">
                                Our pricing aligns with your engagement model — whether you’re building long-term leadership capacity, testing talent before committing, or executing high-impact projects.
                            </p>
                            
                            <div className="flex flex-col items-start gap-6 w-full">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                    No hidden fees. No subscription traps. Just structured costs.
                                </p>
                                <div className="flex flex-col sm:flex-row items-start gap-8 w-full">
                                    <Link 
                                        to="/book-consultation"
                                        className="px-8 py-4 border-1.5 border-slate-900 text-slate-900 font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all duration-300 flex items-center gap-2"
                                    >
                                        Discuss Your Needs <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <Link 
                                        to="/service-models"
                                        className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors py-4 sm:py-0"
                                    >
                                        Explore Engagement Models →
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    <div className="flex-1 w-full flex justify-end">
                        {/* Visual placeholder or balanced whitespace */}
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
                                        { label: "Talent Matching", status: "vetted" },
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
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-slate-100"></div>
            </section>

            {/* 2. PRICING PHILOSOPHY SECTION */}
            <section className="py-24 px-6 bg-white">
                <div className="container max-w-7xl mx-auto">
                    <div className="flex flex-wrap items-center -mx-4">
                        <div className="w-full lg:w-1/2 px-4 mb-12 lg:mb-0">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Our Approach</div>
                            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-6 tracking-tight">Pricing Aligned to Risk, <br /> Commitment, and Impact</h2>
                            <p className="text-base text-slate-600 font-medium leading-relaxed max-w-xl">
                                Pricing varies based on long-term commitment, risk allocation, engagement structure, and operational involvement. We ensure that value is delivered before costs are realized.
                            </p>
                        </div>
                        
                        <div className="w-full lg:w-1/2 px-4">
                        <div className="relative pt-12 pb-8 px-4 md:px-0">
                            {/* Horizontal visual spectrum */}
                            <div className="relative">
                                <div className="h-[1px] w-full bg-slate-100 absolute top-1/2 -translate-y-1/2"></div>
                                <div className="flex justify-between relative z-10">
                                    {[
                                        { label: "Project", sub: "Low Commitment" },
                                        { label: "Trial", sub: "Medium" },
                                        { label: "Direct Hire", sub: "High" }
                                    ].map((point, i) => (
                                        <div key={i} className="flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300 ring-4 ring-white mb-4"></div>
                                            <span className="text-sm font-bold text-slate-900 mb-1">{point.label}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{point.sub}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. CORE ENGAGEMENT PRICING (3 COLUMN STRUCTURED GRID) */}
            <section className="py-24 px-6 bg-slate-50/50 border-y border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-center mb-20">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Engagement Models</div>
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Choose the Right Model for Your Stage</h2>
                    </div>

                    <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 border border-slate-200 bg-white rounded-2xl overflow-hidden">
                        {/* COLUMN 1 */}
                        <div className="p-8 md:p-12 flex flex-col items-start hover:bg-slate-50/50 transition-colors group">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">Permanent</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Direct Hire</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-10">
                                Build long-term internal leadership capacity.
                            </p>
                            
                            <div className="w-full space-y-6 mb-12">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pricing Structure</div>
                                <ul className="space-y-4">
                                    {["One-time placement fee", "Percentage of annual compensation", "4-month replacement guarantee"].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                                            <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-auto pt-8 border-t border-slate-100 w-full mb-10">
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Typical Range</div>
                                <div className="text-3xl font-bold text-slate-900 tracking-tight">15%–20%</div>
                                <div className="text-xs font-medium text-slate-500 mt-1">of annual base salary</div>
                            </div>

                            <p className="text-sm text-slate-500 font-medium mb-10 italic">
                                Best For: Companies building core teams or executive leadership.
                            </p>

                            <Link 
                                to="/book-consultation"
                                className="w-full py-4 border-1.5 border-slate-900 text-slate-900 font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all text-center group-hover:scale-[1.02]"
                            >
                                Discuss Direct Hire →
                            </Link>
                        </div>

                        {/* COLUMN 2 */}
                        <div className="p-8 md:p-12 flex flex-col items-start hover:bg-slate-50/50 transition-colors group">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">Flexible</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Structured Trial</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-10">
                                Evaluate expertise before committing long-term.
                            </p>
                            
                            <div className="w-full space-y-6 mb-12">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pricing Structure</div>
                                <ul className="space-y-4">
                                    {["Monthly managed engagement fee", "Option to convert to full-time", "Centralized compliance & payroll"].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                                            <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-auto pt-8 border-t border-slate-100 w-full mb-10">
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Typical Range</div>
                                <div className="text-3xl font-bold text-slate-900 tracking-tight">20%–30%</div>
                                <div className="text-xs font-medium text-slate-500 mt-1">platform margin on monthly rate</div>
                            </div>

                            <p className="text-sm text-slate-500 font-medium mb-10 italic">
                                Best For: High-growth companies reducing hiring risk.
                            </p>

                            <Link 
                                to="/service-models"
                                className="w-full py-4 border-1.5 border-slate-900 text-slate-900 font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all text-center group-hover:scale-[1.02]"
                            >
                                Explore Trial Model →
                            </Link>
                        </div>

                        {/* COLUMN 3 */}
                        <div className="p-8 md:p-12 flex flex-col items-start hover:bg-slate-50/50 transition-colors group">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">On-Demand</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Project Support</h3>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-10">
                                Specialized execution without long-term hiring.
                            </p>
                            
                            <div className="w-full space-y-6 mb-12">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pricing Structure</div>
                                <ul className="space-y-4">
                                    {["Milestone-based pricing", "Dedicated execution team", "Centralized coordination"].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                                            <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-auto pt-8 border-t border-slate-100 w-full mb-10">
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Typical Range</div>
                                <div className="text-3xl font-bold text-slate-900 tracking-tight">Defined per Scope</div>
                                <div className="text-xs font-medium text-slate-500 mt-1">based on complexity</div>
                            </div>

                            <p className="text-sm text-slate-500 font-medium mb-10 italic">
                                Best For: Companies needing immediate operational execution.
                            </p>

                            <Link 
                                to="/book-consultation"
                                className="w-full py-4 border-1.5 border-slate-900 text-slate-900 font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all text-center group-hover:scale-[1.02]"
                            >
                                Request Project Scope →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. WHAT’S INCLUDED ACROSS ALL MODELS */}
            <section className="py-24 px-6 bg-white">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-center mb-20">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">What You Get</div>
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Enterprise Infrastructure, Not Just Talent</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-x-20 gap-y-12">
                        <div className="space-y-8">
                            {[
                                "Pre-vetted professionals",
                                "Structured engagement contracts",
                                "Centralized billing",
                                "Dedicated coordination"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 pb-6 border-b border-slate-100 last:border-0">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span className="text-lg font-bold text-slate-900 tracking-tight">{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-8">
                            {[
                                "Compliance & payroll handling",
                                "Replacement guarantees (where applicable)",
                                "Performance tracking",
                                "Multi-timezone support"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 pb-6 border-b border-slate-100 last:border-0">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span className="text-lg font-bold text-slate-900 tracking-tight">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. COST COMPARISON SECTION */}
            <section className="py-24 px-6 bg-slate-50/50 border-y border-slate-100">
                <div className="container max-w-[1000px] mx-auto">
                    <div className="text-center mb-20">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Cost Efficiency</div>
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Why Structured Engagement <br /> Reduces Long-Term Cost</h2>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="grid grid-cols-2 md:grid-cols-3 bg-slate-50 border-b border-slate-200">
                            <div className="p-6 text-sm font-bold uppercase tracking-widest text-slate-400">Metric</div>
                            <div className="p-6 text-sm font-bold uppercase tracking-widest text-slate-900">Traditional Hiring</div>
                            <div className="hidden md:block p-6 text-sm font-bold uppercase tracking-widest text-blue-600">OpslyHR Managed</div>
                        </div>
                        {[
                            { m: "Time-to-hire", t: "45–60 Days", v: "5–10 Days" },
                            { m: "Recruitment overhead", t: "High internal effort", v: "Zero operational noise" },
                            { m: "Compliance management", t: "Local desk only", v: "Global multi-currency" },
                            { m: "Replacement risk", t: "Sunk costs", v: "100% Guaranteed" },
                            { m: "Operational coordination", t: "Client managed", v: "OpslyHR facilitated" }
                        ].map((row, i) => (
                            <div key={i} className="grid grid-cols-2 md:grid-cols-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <div className="p-6 text-sm font-bold text-slate-900 border-r border-slate-100">{row.m}</div>
                                <div className="p-6 text-sm text-slate-500 font-medium border-r border-slate-100">{row.t}</div>
                                <div className="p-6 text-sm text-slate-900 font-bold bg-blue-50/20 md:bg-transparent">{row.v}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. ENTERPRISE CUSTOM PRICING */}
            <section className="py-24 px-6 bg-white">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Enterprise</div>
                            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Custom Engagement <br /> Structures for Large Teams</h2>
                            <p className="text-base text-slate-600 font-medium leading-relaxed max-w-xl mb-10">
                                For companies scaling 10+ roles or outsourcing operational units, pricing is customized to your specific throughput and infrastructure needs.
                            </p>
                            <Link 
                                to="/book-consultation"
                                className="inline-flex items-center px-8 py-4 border-1.5 border-slate-900 text-slate-900 font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all duration-300"
                            >
                                Speak With Our Enterprise Team →
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8">
                            {[
                                { t: "Volume discounts", d: "Reduced margins for scale" },
                                { t: "Account management", d: "Dedicated lead professional" },
                                { t: "SLA-backed support", d: "Guaranteed uptime & response" },
                                { t: "Hybrid structures", d: "Blended staffing models" }
                            ].map((item, i) => (
                                <div key={i} className="p-6 border border-slate-100 rounded-xl bg-slate-50/30">
                                    <h4 className="font-bold text-slate-900 mb-2">{item.t}</h4>
                                    <p className="text-xs text-slate-500 font-medium">{item.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. GLOBAL OUTSOURCING PRICING CLARITY */}
            <section className="py-24 px-6 bg-[#0B0F19] text-white overflow-hidden relative">
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

            {/* 8. DECISION SUPPORT SECTION */}
            <section className="py-24 px-6 bg-white border-b border-slate-100">
                <div className="container max-w-[800px] mx-auto text-left">
                    <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-6 tracking-tight">Not Sure Which Model Fits?</h2>
                    <p className="text-base text-slate-600 font-medium leading-relaxed mb-10">
                        Every organization has unique operational requirements. Speak with our engagement experts to determine the most cost-effective and risk-aligned model for your team.
                    </p>
                    <Link 
                        to="/book-consultation"
                        className="inline-flex items-center px-10 py-5 border-1.5 border-slate-900 text-slate-900 font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all duration-300"
                    >
                        Book a Structured Consultation →
                    </Link>
                </div>
            </section>

            {/* 9. FAQ SECTION */}
            <section className="py-24 px-6 bg-white">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-center mb-20">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Decision Clarity</div>
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Common Pricing & Engagement Questions</h2>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 relative">
                        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-slate-100 hidden lg:block -translate-x-1/2"></div>
                        
                        <div className="space-y-4">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">Engagement & Hiring</div>
                            {[
                                { q: "Are there any upfront activation fees?", answer: "No. OpslyHR does not charge setup or search fees. You only pay for talent once an engagement begins or a hire is finalized." },
                                { q: "Do you require exclusivity?", answer: "Exclusivity is not required for contingent direct hire placements. However, for managed trials and projects, we focus on dedicated delivery." },
                                { q: "What is your replacement guarantee?", answer: "Full-time placements include a 120-day replacement guarantee. Managed trials can be terminated or changed at any point with 30 days notice." }
                            ].map((faq, i) => (
                                <AccordionItem key={i} question={faq.q} answer={faq.answer} />
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">Compliance & Billing</div>
                            {[
                                { q: "How is global payroll managed?", answer: "OpslyHR acts as the Employer of Record for offshore talent, handling all local taxes, benefits, and labor laws. You pay one invoice." },
                                { q: "Can we convert a trial professional to full-time?", answer: "Yes. Our Trial-to-Hire model includes a pre-defined conversion schedule based on the duration of the trial period." },
                                { q: "Which currencies do you support for billing?", answer: "We primarily bill in USD, EUR, and GBP, but we can accommodate local currency billing for qualified enterprise accounts." }
                            ].map((faq, i) => (
                                <AccordionItem key={i} question={faq.q} answer={faq.answer} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Pricing;
