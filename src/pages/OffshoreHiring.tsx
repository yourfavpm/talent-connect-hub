
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, ShieldCheck, Banknote, Clock, CheckCircle2, MapPin } from "lucide-react";

const OffshoreHiring = () => {
    return (
        <div className="bg-white font-inter">
            {/* HERO SECTION */}
            <section className="relative pt-32 md:pt-48 pb-24 md:pb-32 px-6 overflow-hidden">
                {/* Subtle Map Background */}
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
                    <Globe className="w-full h-full scale-[1.5] translate-x-1/4 -translate-y-1/4" />
                </div>

                <div className="container max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="max-w-4xl flex flex-col items-start text-left"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-8 shadow-sm">
                                Global Operations
                            </div>
                            <h1 className="text-4xl md:text-7xl font-semibold text-slate-900 mb-8 tracking-tight leading-[1.1]">
                                Build Distributed Teams <br className="hidden md:block" /> Without Operational Friction.
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 mb-12 font-medium leading-relaxed max-w-2xl">
                                Access vetted EMEA-based operators with centralized compliance, billing, and coordination. SCALE your workforce without international entity complexity.
                            </p>
                            
                            <Button 
                                size="lg" 
                                className="h-14 px-10 text-base rounded-xl bg-slate-900 text-white hover:bg-blue-700 font-bold transition-all duration-300 shadow-sm" 
                                asChild
                            >
                                <Link to="/auth/signup?portal=client">
                                    Explore Global Hiring <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </motion.div>

                        {/* Right Visual (Global Infrastructure) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="bg-white border border-slate-200 rounded-[24px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden aspect-square flex items-center justify-center">
                                {/* Network Visual */}
                                <div className="relative w-full h-full max-w-[300px] max-h-[300px]">
                                    {/* Central Node */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                                            <div className="w-8 h-8 border-2 border-white/20 rounded-lg flex items-center justify-center">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-900 uppercase tracking-widest text-center mt-3">Company Hub</div>
                                    </div>

                                    {/* Talent Nodes */}
                                    {[
                                        { top: "10%", left: "10%", label: "EMEA-1", status: "Active" },
                                        { top: "10%", left: "80%", label: "EMEA-2", status: "Active" },
                                        { top: "80%", left: "15%", label: "Ops Lead", status: "Vetted" },
                                        { top: "85%", left: "75%", label: "Product", status: "Matched" }
                                    ].map((node, idx) => (
                                        <div key={idx} className="absolute z-10" style={{ top: node.top, left: node.left }}>
                                            {/* Connection Line */}
                                            <svg className="absolute top-1/2 left-1/2 w-[150px] h-[150px] pointer-events-none -z-10" style={{ transform: `translate(-50%, -50%) rotate(${idx * 90 + 20}deg)` }}>
                                                <motion.line 
                                                    x1="0" y1="75" x2="100" y2="75"
                                                    stroke="#CBD5E1" 
                                                    strokeWidth="1" 
                                                    strokeDasharray="4 4"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 1.5, delay: 0.5 + idx * 0.2 }}
                                                />
                                            </svg>
                                            
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: 0.8 + idx * 0.2 }}
                                                className="bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-sm hover:border-blue-200 transition-colors group cursor-default"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[11px] font-bold text-slate-900">{node.label}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${idx < 2 ? 'bg-blue-600' : 'bg-slate-300'} group-hover:scale-125 transition-transform`} />
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{node.status}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Infrastructure Label */}
                            <div className="absolute -bottom-4 right-8 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm flex items-center gap-3">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Compliance Secured</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* SECTION 1 — COST EFFICIENCY */}
            <section className="py-24 md:py-32 px-6 bg-slate-50 border-t border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-8 tracking-tight">Cost Optimization <br /> Without Compromise</h2>
                            <div className="space-y-6 mb-12">
                                {[
                                    { t: "40–60% cost efficiency potential", icon: Banknote },
                                    { t: "Currency-neutral billing", icon: ShieldCheck },
                                    { t: "No international entity setup", icon: Globe }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                                            <item.icon className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <span className="text-lg text-slate-600 font-medium">{item.t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-white p-12 rounded-[24px] border border-slate-200 shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Efficiency Impact</div>
                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-bold text-slate-900">EMEA Talent Pool</span>
                                        <span className="text-2xl font-bold text-blue-600">60% Saving</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="w-[60%] h-full bg-blue-600"></div>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    Leverage high-grade talent in emerging markets to significantly reduce operational overhead while maintaining institutional quality standards.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 2 — INFRASTRUCTURE SUPPORT */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Compliance Handled Centrally</h2>
                        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
                            We act as your global infrastructure layer, removing the administrative and legal barriers to distributed hiring.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { t: "Payroll management", d: "Automated monthly disbursements across borders." },
                            { t: "Contract generation", d: "Localized legal agreements for EMEA compliance." },
                            { t: "Cross-border compliance", d: "Rigorously managed regulatory and tax handling." },
                            { t: "Tax handling", d: "Simplified consolidated reporting and withholdings." }
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="p-8 border border-slate-100 rounded-2xl hover:border-blue-200 transition-colors"
                            >
                                <CheckCircle2 className="h-6 w-6 text-blue-600 mb-6" />
                                <h3 className="text-lg font-bold text-slate-900 mb-3 tracking-tight">{item.t}</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    {item.d}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 3 — MULTI-TIMEZONE ADVANTAGE */}
            <section className="py-24 md:py-32 px-6 bg-[#0B0F19] text-white overflow-hidden relative">
                {/* World Map Overlay */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                    <Globe className="w-full h-full scale-150" />
                </div>

                <div className="container max-w-[1200px] mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-semibold mb-8 tracking-tight">Extended Operational Coverage</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                {[
                                    { l: "North America", t: "EST / PST Alignment" },
                                    { l: "Europe", t: "GMT / CET Coverage" },
                                    { l: "EMEA Markets", t: "Strategic Depth" }
                                ].map((zone, i) => (
                                    <div key={i}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">{zone.l}</span>
                                        </div>
                                        <div className="text-lg font-medium">{zone.t}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-12 rounded-[24px]">
                            <Clock className="h-8 w-8 text-blue-500 mb-8" />
                            <h4 className="text-2xl font-bold mb-4 tracking-tight">24/7 Continuity</h4>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                By distributing your operations across strategic timezones, you ensure continuous service delivery and faster response cycles without overnight shift premiums.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 4 — IDEAL FOR */}
            <section className="py-24 md:py-32 px-6 bg-white">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="max-w-3xl mb-16">
                        <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">Ideal For</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            "Scaling SaaS companies",
                            "Global product teams",
                            "Cost-conscious scaling",
                            "24/7 operational coverage"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-6 bg-slate-50 border border-slate-100 rounded-xl">
                                <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                <span className="text-lg font-bold text-slate-900">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-32 px-6 bg-white text-center border-t border-slate-100">
                <div className="container max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl md:text-6xl font-semibold text-slate-900 mb-12 tracking-tight">Scale Globally. <br /> Operate Seamlessly.</h2>
                        <Button 
                            size="lg" 
                            variant="outline"
                            className="h-16 px-12 text-lg rounded-xl border-[1.5px] border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all duration-300 shadow-none" 
                            asChild
                        >
                            <Link to="/auth/signup?portal=client">
                                Start Global Engagement <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default OffshoreHiring;
