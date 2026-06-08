import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Building2, Globe, Clock, Shield, Users, Zap, Briefcase, Layout, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Zone, getZoneUrl } from "@/utils/subdomain";
import SEO from "@/components/SEO";

const AccordionItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-slate-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left group transition-all"
            >
                <span className="text-base md:text-lg font-bold text-slate-900 pr-8 group-hover:text-blue-600 transition-colors">
                    {question}
                </span>
                <div className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 transition-all duration-300 ${isOpen ? 'bg-blue-50 border-blue-200' : ''}`}>
                    {isOpen ? (
                        <div className="w-2.5 h-[1.5px] bg-blue-600 rounded-full" />
                    ) : (
                        <div className="relative w-2.5 h-2.5 flex items-center justify-center">
                            <div className="absolute w-2.5 h-[1.5px] bg-slate-400 rounded-full group-hover:bg-slate-600" />
                            <div className="absolute h-2.5 w-[1.5px] bg-slate-400 rounded-full group-hover:bg-slate-600" />
                        </div>
                    )}
                </div>
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
            >
                <div className="pb-6 text-sm md:text-base text-slate-500 font-medium leading-relaxed max-w-2xl">
                    {answer}
                </div>
            </motion.div>
        </div>
    );
};

const ServiceModels = () => {
    return (
        <div className="bg-background min-h-screen text-foreground selection:bg-primary selection:text-white pb-0">
            <SEO 
                title="Service Models | Flexible Engagement for Workforce Solutions"
                description="Choose the engagement model that fits your growth. From Direct Hire to Managed Teams and Project-Based execution, explore how to scale with operational capacity."
                keywords="Service Models, Workforce Solutions, Remote Operations Engagement, Directed Placement, Project Based Capacity"
            />

            <section className="relative pt-32 md:pt-40 pb-12 md:pb-24 px-2 sm:px-6 bg-white border-b border-slate-100 font-inter overflow-hidden">
                {/* Subtle World Map background overlay */}
                <div 
                    className="absolute inset-0 w-full h-full opacity-[0.1] pointer-events-none mix-blend-multiply"
                    style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        filter: 'grayscale(100%) contrast(1.5) brightness(1.1)',
                        WebkitMaskImage: 'radial-gradient(circle at 70% 50%, black 10%, transparent 80%)',
                        maskImage: 'radial-gradient(circle at 70% 50%, black 10%, transparent 80%)'
                    }}
                />
                <div className="container max-w-[1200px] mx-auto relative z-10 flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                    <div className="flex-1">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col items-start text-left"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8 shadow-sm">
                                Engagement Structure
                            </div>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold mb-6 md:mb-8 text-slate-900 leading-[1.2] md:leading-[1.1] tracking-tight">
                                Four Distinct <br className="hidden md:block" />
                                Engagement Models. <span className="text-slate-900/40">Clear Tradeoffs.</span>
                            </h1>
                            <p className="text-base md:text-lg text-slate-600 mb-10 md:mb-12 leading-relaxed font-medium">
                                From permanent direct hires to managed teams and offshore payroll — each model solves a different operational need with transparent economics.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-start justify-start gap-8 mb-12 w-full sm:w-auto">
                                <Link 
                                    to="/book-consultation"
                                    className="inline-flex items-center text-slate-900 font-semibold hover:text-blue-600 transition-colors py-4 sm:py-0 border-b-2 border-blue-600 pb-1"
                                >
                                    Book a Consultation <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </div>
    
                            {/* Financial Clarity Row */}
                            <div className="flex flex-col sm:flex-row flex-wrap items-start justify-start gap-x-8 gap-y-4 pt-8 border-t border-slate-100 w-full">
                                {[
                                    { label: "Direct Hire", value: "15-20%" },
                                    { label: "Trial", value: "$800+" },
                                    { label: "Managed Teams", value: "$1.2k+" },
                                    { label: "Offshore", value: "$200+" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">{item.label} — {item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    <div className="flex-1 w-full relative hidden lg:block animate-fade-in">
                        <div className="space-y-4">
                            {[
                                { 
                                    title: "Direct Hire", 
                                    desc: "One-time placement fee. Client owns relationship.", 
                                    icon: Building2, 
                                    color: "bg-slate-50 text-slate-600 border-slate-200" 
                                },
                                { 
                                    title: "Trial-to-Hire", 
                                    desc: "Managed engagement with conversion flexibility.", 
                                    icon: Clock, 
                                    color: "bg-blue-50 text-blue-600 border-blue-100" 
                                },
                                { 
                                    title: "Managed Teams", 
                                    desc: "Dedicated operations team built and managed by us.", 
                                    icon: Users, 
                                    color: "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                },
                                { 
                                    title: "Offshore Hiring", 
                                    desc: "Compliant EOR and payroll for direct hires.", 
                                    icon: Globe, 
                                    color: "bg-amber-50 text-amber-600 border-amber-100" 
                                }
                            ].map((model, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * (i + 1) }}
                                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-5 hover:border-blue-200 hover:shadow-md transition-all duration-300"
                                >
                                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border ${model.color}`}>
                                        <model.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">{model.title}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed font-medium">{model.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        
                        {/* Decorative elements */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 opacity-60"></div>
                        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-slate-100 rounded-full blur-3xl -z-10 opacity-60"></div>
                    </div>
                </div>
            </section>

            {/* 2. TRUST LOGOS */}
            <section className="py-12 px-2 sm:px-6 border-b border-slate-100 bg-slate-50/50">
                <div className="container max-w-6xl mx-auto">
                    <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by Companies Across Industries</p>
                    <div className="relative w-full overflow-hidden">
                        <div className="flex animate-marquee gap-16 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Actual Companies - Duplicated for infinite scroll */}
                            {[
                                "Kemuko", "Xanotech", "Spectrum Microfinance", "Squared Space",
                                "Kemuko", "Xanotech", "Spectrum Microfinance", "Squared Space",
                                "Kemuko", "Xanotech", "Spectrum Microfinance", "Squared Space"
                            ].map((name, i) => (
                                <div key={i} className="flex-shrink-0 flex items-center justify-center">
                                    <span className="text-xl md:text-2xl font-bold font-display text-slate-400 whitespace-nowrap">{name}</span>
                                </div>
                            ))}
                        </div>
                        {/* Gradient masks */}
                        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10"></div>
                        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10"></div>
                    </div>
                </div>
            </section>

            {/* 3. ENGAGEMENT FRAMEWORK (REDESIGNED) */}
            <section className="py-24 px-2 sm:px-6 bg-white font-inter" id="engagement-models">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-left md:text-center mb-20 animate-slide-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8 shadow-sm">
                            Engagement Framework
                        </div>
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Four Structured Ways to Work With OpslyHR</h2>
                        <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
                            Each model is designed around risk allocation, speed, and long-term value.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 border-y border-slate-100 divide-y md:divide-y-0 lg:divide-x divide-slate-100">
                        {/* Column 1: Direct Hire */}
                        <div className="py-12 lg:px-8 flex flex-col items-start bg-white hover:bg-slate-50/30 transition-colors group">
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-4">Permanent</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Direct Hire</h3>
                            <p className="text-sm text-slate-500 mb-12 font-medium leading-relaxed">
                                Client hires the talent permanently from day one.
                            </p>

                            <div className="space-y-10 w-full mb-16">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Structure</div>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed">We source, screen, and place. Client owns the talent relationship. Includes 90-day replacement guarantee.</p>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Best For</div>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed">C-level operations roles and companies with internal HR who need sourcing support.</p>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Cost Model</div>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed">One-time placement fee of 15–20% of annual salary. No ongoing platform margin.</p>
                                </div>
                            </div>

                            <a href={getZoneUrl(Zone.AUTH, "/auth/signup/client")} className="mt-auto inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-all group-hover:translate-x-1">
                                Get Started <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                        </div>

                        {/* Column 2: Trial-to-Hire */}
                        <div className="py-12 lg:px-8 flex flex-col items-start bg-white lg:bg-slate-50/10 hover:bg-slate-50/50 transition-colors group relative md:border-l border-slate-100">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-blue-600 animate-pulse" />
                                Low Risk Entry
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Trial-to-Hire</h3>
                            <p className="text-sm text-slate-500 mb-12 font-medium leading-relaxed">
                                Client engages talent for 30–90 days on a managed contract.
                            </p>

                            <div className="space-y-10 w-full mb-16">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Structure</div>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed">We employ talent during the trial. If it works, convert to permanent. If not, walk away with no penalty.</p>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Best For</div>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed">New clients, startups with budget uncertainty, and roles where cultural fit matters most.</p>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Cost Model</div>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed">$800–$2,500/month during trial + flat conversion fee if hired permanently.</p>
                                </div>
                            </div>

                            <a href={getZoneUrl(Zone.AUTH, "/auth/signup/client")} className="mt-auto inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-all group-hover:translate-x-1">
                                Get Started <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                        </div>

                        {/* Column 3: Managed Teams */}
                        <div className="py-12 lg:px-8 flex flex-col items-start bg-white hover:bg-slate-50/30 transition-colors group border-t md:border-t-0 lg:border-t-0 md:border-l lg:border-l border-slate-100">
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-4">Highest Value</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Managed Teams</h3>
                            <p className="text-sm text-slate-500 mb-12 font-medium leading-relaxed">
                                We build, manage, and support a dedicated operations team.
                            </p>

                            <div className="space-y-10 w-full mb-16">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Structure</div>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed">Dedicated members assigned exclusively to you. We handle HR, reporting, KPIs, and replacements.</p>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Best For</div>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed">Customer support, EAs, VAs, and back-office roles where you want the output without HR overhead.</p>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Cost Model</div>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed">$1,200–$6,000 per team member / month. Predictable scaling costs.</p>
                                </div>
                            </div>

                            <a href={getZoneUrl(Zone.AUTH, "/auth/signup/client")} className="mt-auto inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-all group-hover:translate-x-1">
                                Get Started <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                        </div>
                        
                        {/* Column 4: Offshore Hiring Support */}
                        <div className="py-12 lg:px-8 flex flex-col items-start bg-white hover:bg-slate-50/30 transition-colors group border-t md:border-t-0 lg:border-t-0 md:border-l border-slate-100">
                            <div className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em] mb-4">Employer of Record</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Offshore Hiring</h3>
                            <p className="text-sm text-slate-500 mb-12 font-medium leading-relaxed">
                                For clients hiring directly who need compliant infrastructure.
                            </p>

                            <div className="space-y-10 w-full mb-16">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Structure</div>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed">Locally compliant contracts, payroll, tax withholding, and HR admin across African jurisdictions.</p>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Best For</div>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed">Tech companies scaling beyond 10 members who found talent locally but can't hire directly.</p>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Cost Model</div>
                                    <p className="text-sm text-slate-800 font-medium leading-relaxed">$200–$600 EOR fee per employee per month, plus the employee's salary.</p>
                                </div>
                            </div>

                            <a href={getZoneUrl(Zone.AUTH, "/auth/signup/client")} className="mt-auto inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-all group-hover:translate-x-1">
                                Get Started <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Risk Scale Indicator */}
                    <div className="mt-20 pt-12 border-t border-slate-100 hidden md:block">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                            <span>Strategic Alignment</span>
                            <span>Operational Speed</span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full relative overflow-hidden">
                            <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-slate-400 via-blue-500 to-amber-400 opacity-20"></div>
                            {/* Marker dots */}
                            <div className="absolute top-0 left-[0%] w-1 h-full bg-slate-400"></div>
                            <div className="absolute top-0 left-[33%] w-1 h-full bg-blue-500"></div>
                            <div className="absolute top-0 left-[66%] w-1 h-full bg-emerald-500"></div>
                            <div className="absolute top-0 left-[100%] ml-[-4px] w-1 h-full bg-amber-400"></div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 uppercase tracking-widest mt-6">
                            <span>Direct Ownership</span>
                            <span>Trial Evaluation</span>
                            <span>Managed Output</span>
                            <span>Compliance Support</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. GLOBAL OPERATIONS (REDESIGNED) */}
            <section className="py-24 px-2 sm:px-6 bg-[#0B0F19] text-white font-inter relative overflow-hidden">
                {/* Subtle World Map background overlay */}
                <div className="absolute inset-0 opacity-[0.3] pointer-events-none bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80')] bg-cover bg-center grayscale invert brightness-[1.2]" style={{ WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 95%)', maskImage: 'radial-gradient(circle at center, black 30%, transparent 95%)' }}></div>
                
                <div className="container max-w-[1200px] mx-auto relative z-10">
                    <div className="flex flex-wrap items-center -mx-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="w-full lg:w-1/2 px-4 mb-12 lg:mb-0"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-slate-400 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-8 shadow-sm">
                                Global Operations
                            </div>
                            <h2 className="text-3xl md:text-5xl font-semibold mb-6 tracking-tight leading-[1.15]">
                                Build Distributed Teams Without <br />
                                <span className="text-white/40">Operational Friction.</span>
                            </h2>
                            <p className="text-base md:text-lg text-slate-400 mb-10 leading-relaxed max-w-xl font-medium">
                                Access vetted global talent, multi-timezone coverage, and fully managed compliance — without building the infrastructure yourself.
                            </p>

                            <ul className="space-y-4 mb-12">
                                {[
                                    "International hiring & compliance handled",
                                    "Multi-timezone operational coverage",
                                    "Centralized billing & contracts",
                                    "Dedicated coordination layer"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <Link 
                                to="/book-consultation"
                                className="inline-flex items-center text-sm font-bold text-white hover:text-blue-400 transition-colors group"
                            >
                                Explore Global Model <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="w-full lg:w-1/2 px-4 space-y-12"
                        >
                            {[
                                {
                                    id: "01",
                                    title: "Cost Optimization",
                                    desc: "Tap into competitive labor markets while maintaining strict quality control and operational standards across all functions."
                                },
                                {
                                    id: "02",
                                    title: "24/7 Operational Continuity",
                                    desc: "Leverage global time zones to ensure support, monitoring, and execution never stop, regardless of your headquarters' location."
                                },
                                {
                                    id: "03",
                                    title: "Global Talent Access",
                                    desc: "Reach specialized skills and high-performing operators from diverse talent corridors previously restricted by regional hiring boundaries."
                                }
                            ].map((cap, i) => (
                                <div key={i} className="relative pl-8 border-l border-white/10 group">
                                    <div className="absolute top-0 left-[-1px] w-[1px] h-0 bg-blue-500 group-hover:h-full transition-all duration-500" />
                                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">{cap.id} — Capability</div>
                                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{cap.title}</h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md">
                                        {cap.desc}
                                    </p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 5. PROCESS (REDESIGNED) */}
            <section className="py-24 px-2 sm:px-6 bg-white border-y border-slate-100 font-inter">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-left md:text-center mb-24 animate-slide-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8 shadow-sm">
                            Process
                        </div>
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">From Request to Execution</h2>
                        <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
                            A structured, managed engagement lifecycle designed for operational clarity.
                        </p>
                    </div>

                    <div className="relative">
                        {/* Horizontal Connecting Line (Desktop) */}
                        <div className="absolute top-10 left-0 w-full h-[1px] bg-slate-100 hidden md:block"></div>
                        
                        <div className="grid md:grid-cols-4 gap-12 md:gap-8 relative z-10">
                            {[
                                {
                                    id: "01",
                                    title: "Define",
                                    desc: "Clarify scope, engagement model, and timeline with our team."
                                },
                                {
                                    id: "02",
                                    title: "Match",
                                    desc: "Receive curated, pre-vetted professionals aligned to your needs."
                                },
                                {
                                    id: "03",
                                    title: "Engage",
                                    desc: "Launch under structured contracts and centralized coordination."
                                },
                                {
                                    id: "04",
                                    title: "Operate",
                                    desc: "Track performance, manage billing, and scale seamlessly."
                                }
                            ].map((step, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex flex-col items-center md:items-start text-center md:text-left group"
                                >
                                    <div className="w-20 h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-900 font-bold text-lg mb-8 shadow-sm group-hover:border-blue-500 group-hover:text-blue-600 transition-all duration-300">
                                        {step.id}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{step.title}</h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[240px] md:max-w-none">
                                        {step.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. DECISION CLARITY (FAQ REDESIGNED) */}
            <section className="py-24 px-2 sm:px-6 bg-white font-inter">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-left md:text-center mb-20 animate-slide-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8 shadow-sm">
                            Decision Clarity
                        </div>
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Common Questions Before You Engage</h2>
                        <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
                            Everything you need to understand our engagement structure, compliance handling, and operational model.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 relative">
                        {/* Optional subtle vertical separator */}
                        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-slate-100 hidden lg:block -translate-x-1/2"></div>
                        
                        {/* Left Column: Engagement & Hiring */}
                        <div className="space-y-4">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">Engagement & Hiring</div>
                            {[
                                { 
                                    q: "What makes OpslyHR different?", 
                                    a: "Unlike generic marketplaces, OpslyHR focus on structured, managed engagements. We handle the vetting, compliance, and ongoing coordination, allowing you to focus purely on execution and outcomes." 
                                },
                                { 
                                    q: "Can I try a professional before hiring full-time?", 
                                    a: "Yes. Our Trial-to-Hire model is specifically designed for this. You engage for 90 days with conversion flexibility at any point during or after the trial period." 
                                },
                                { 
                                    q: "Do you support short-term engagements?", 
                                    a: "Absolutely. Our Project & Operational Support model covers milestone-based delivery, audits, and technical implementations without long-term headcount commitments." 
                                },
                                { 
                                    q: "How soon can I get started?", 
                                    a: "Engagement typically begins within 5-10 business days of your final request, depending on the complexity of the requirements and the chosen engagement model." 
                                }
                            ].map((faq, i) => (
                                <AccordionItem key={i} question={faq.q} answer={faq.a} />
                            ))}
                        </div>

                        {/* Right Column: Operations & Infrastructure */}
                        <div className="space-y-4">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">Operations & Infrastructure</div>
                            {[
                                { 
                                    q: "Does OpslyHR handle compliance and payroll?", 
                                    a: "Yes. OpslyHR manages all international compliance, contractor administration, and multi-currency payroll, providing you with a single, consolidated monthly bill." 
                                },
                                { 
                                    q: "How do you ensure operational continuity?", 
                                    a: "We leverage global talent corridors to provide multi-timezone coverage. Our dedicated coordination layer ensures that knowledge and execution remain consistent across shifts." 
                                },
                                { 
                                    q: "What if I already have an in-house team?", 
                                    a: "OpslyHR is designed to complement existing teams. We provide specialized skills or additional capacity that integrates directly into your existing project management and communication tools." 
                                },
                                { 
                                    q: "Is there a dedicated account manager?", 
                                    a: "All engagements include access to an Account Lead who handles administrative coordination, performance tracking, and any scaling requirements as your team grows." 
                                }
                            ].map((faq, i) => (
                                <AccordionItem key={i} question={faq.q} answer={faq.a} />
                            ))}
                        </div>
                    </div>

                    <div className="mt-20 pt-12 border-t border-slate-100 text-center">
                        <p className="text-slate-500 font-medium mb-4">Still have questions?</p>
                        <Link 
                            to="/book-consultation"
                            className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-all"
                        >
                            Speak directly with our team <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default ServiceModels;
