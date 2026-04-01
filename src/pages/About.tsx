
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, ShieldCheck, Zap, Users, Shield, Target, CheckCircle2 } from "lucide-react";

const About = () => {
    return (
        <div className="bg-white font-inter">
            {/* HERO SECTION */}
            <section className="pt-32 md:pt-48 pb-24 md:pb-32 px-6">
                <div className="container max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-start"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-8 shadow-sm">
                            About OPSlyHR
                        </div>
                        <h1 className="text-4xl md:text-7xl font-semibold text-slate-900 mb-8 tracking-tight leading-[1.1] max-w-5xl">
                            Building the Infrastructure Behind <br className="hidden md:block" /> Modern Operations Teams.
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 mb-12 font-medium leading-relaxed max-w-3xl">
                            OPSlyHR connects vetted product and operations professionals with growth-focused companies — through structured, transparent, and managed engagement models.
                            <br /><span className="mt-4 block text-slate-900 font-bold">We are not a marketplace. We are operational infrastructure.</span>
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* SECTION 2 — OUR STORY */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100 bg-slate-50/50">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-12 tracking-tight">Why OPSlyHR Exists</h2>
                        <div className="space-y-8 text-lg text-slate-600 font-medium leading-[1.8]">
                            <p>
                                Hiring operational talent is fragmented. Companies lose critical time screening for functional depth, agencies charge opaque fees for single placements, and marketplaces lack the rigorous quality control required for high-stakes roles. Global hiring only adds layers of compliance and payroll complexity.
                            </p>
                            <p>
                                OPSlyHR was built to introduce structure where chaos exists. We replace fragmented recruitment workflows with curated vetting, transparent engagement models, and centralized operational management.
                            </p>
                            <p className="text-slate-900 font-bold">
                                We believe that building specialized teams should be predictable, measurable, and managed.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 3 — WHAT MAKES US DIFFERENT */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="mb-20">
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">We Don’t Operate Like a Marketplace.</h2>
                        <p className="text-slate-500 font-medium max-w-2xl">A fundamental shift from volume-driven discovery to managed execution infrastructure.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="bg-white p-12">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Traditional Marketplace</h4>
                            <ul className="space-y-6">
                                {[
                                    "Volume-driven / Low selectivity",
                                    "Minimal functional vetting",
                                    "Talent discovery burden on company",
                                    "Limited operational oversight"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 text-slate-400 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-slate-50/50 p-12">
                            <h4 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-8">OPSlyHR Model</h4>
                            <ul className="space-y-6">
                                {[
                                    "Curated professional network",
                                    "Structured evaluation framework",
                                    "Managed engagement models",
                                    "Ongoing performance monitoring"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 text-slate-900 font-bold">
                                        <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>


            {/* SECTION 5 & 6 — AUDIENCE SECTIONS */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 lg:gap-32">
                        <div>
                            <h2 className="text-3xl font-semibold text-slate-900 mb-8 tracking-tight">For Growth-Focused Companies</h2>
                            <p className="text-slate-600 font-medium leading-relaxed mb-8">
                                Companies need speed, risk control, and cost clarity. OPSlyHR provides the managed infrastructure to scale your operations without the administrative burden of traditional hiring or the uncertainty of marketplaces.
                            </p>
                            <ul className="space-y-4 mb-10">
                                {["Curated matching", "Managed trials", "Permanent placements", "Project-based support", "Global infrastructure"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-900">
                                        <div className="w-1 h-1 rounded-full bg-blue-600" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/service-models" className="text-slate-900 font-bold hover:text-blue-600 transition-colors inline-flex items-center group">
                                Explore Engagement Models <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div>
                            <h2 className="text-3xl font-semibold text-slate-900 mb-8 tracking-tight">For High-Impact Operators</h2>
                            <p className="text-slate-600 font-medium leading-relaxed mb-8">
                                OPSlyHR is not open enrollment. We curate for long-term partnerships with professionals who value documented execution and transparent engagements with high-growth companies.
                            </p>
                            <ul className="space-y-4 mb-10">
                                {["Structured engagements", "Transparent compensation", "Compliance handling", "Global opportunities"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-900">
                                        <div className="w-1 h-1 rounded-full bg-slate-900" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/auth/signup?portal=talent" className="text-slate-900 font-bold hover:text-blue-600 transition-colors inline-flex items-center group">
                                Apply to the Network <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 7 — OPERATING PRINCIPLES */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100 bg-slate-50/50">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="mb-20 text-center">
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">The Principles That Guide Us</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
                        {[
                            { t: "Clarity", d: "Transparent pricing and defined engagement structures." },
                            { t: "Structure", d: "Documented vetting and engagement frameworks." },
                            { t: "Accountability", d: "Performance tracking and replacement guarantees." },
                            { t: "Global Perspective", d: "Distributed talent with centralized coordination." },
                            { t: "Integrity", d: "Long-term partnerships over short-term volume." }
                        ].map((item, i) => (
                            <div key={i} className="space-y-4">
                                <h4 className="text-lg font-bold text-slate-900">{item.t}</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 8 — GLOBAL VISION */}
            <section className="relative py-24 md:py-32 px-6 border-t border-slate-100 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none">
                    <Globe className="w-full h-full scale-150" />
                </div>
                <div className="container max-w-[1200px] mx-auto relative z-10 text-center">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-8 tracking-tight">Designed for a Distributed Future</h2>
                        <p className="text-lg text-slate-600 font-medium leading-relaxed">
                            We are building the systems to enable remote-first teams at scale. By centralizing global operational coverage and cross-border compliance, we prioritize institutional infrastructure over simple intermediaries.
                        </p>
                    </div>
                </div>
            </section>

            {/* CLOSING SECTION */}
            <section className="py-32 px-6 bg-slate-50 text-center border-t border-slate-100">
                <div className="container max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl md:text-6xl font-semibold text-slate-900 mb-8 tracking-tight">Structured Teams. <br /> Measurable Impact.</h2>
                        <p className="text-lg text-slate-600 font-medium mb-12 max-w-2xl mx-auto">
                            OPSlyHR exists to reduce friction in operational hiring and create predictable outcomes for companies and professionals alike.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Button 
                                size="lg" 
                                variant="outline"
                                className="h-16 px-12 text-lg rounded-xl border-[1.5px] border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all duration-300 shadow-none shrink-0" 
                                asChild
                            >
                                <Link to="/auth/signup?portal=client">
                                    Request Talent <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button 
                                size="lg" 
                                variant="outline"
                                className="h-16 px-12 text-lg rounded-xl border-[1.5px] border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all duration-300 shadow-none shrink-0" 
                                asChild
                            >
                                <Link to="/auth/signup?portal=talent">
                                    Apply as Talent <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default About;
