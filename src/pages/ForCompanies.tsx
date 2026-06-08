import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Clock, Globe, Shield, Zap, Search, UserCheck, Layout, CreditCard, Award, TrendingUp, Users, ArrowRight, Star, Target, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Zone, getZoneUrl } from "@/utils/subdomain";
import SEO from "@/components/SEO";

const ForCompanies = () => {
    const [showComparison, setShowComparison] = useState(false);
    
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    const staggerContainer = {
        initial: { opacity: 0 },
        whileInView: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        },
        viewport: { once: true }
    };

    return (
        <div className="bg-white min-h-screen text-foreground selection:bg-primary selection:text-white pb-0 overflow-hidden">
            <SEO 
                title="Hire Vetted African Operations Professionals | Structured Scale"
                description="Access rigorously vetted African operations specialists — matched, contracted, and managed through a structured platform designed for scale. Build your distributed team with confidence."
                keywords="Hire African Operations, Vetted African Talent, Operational Leadership, Scale Operations, Remote Operations Professionals Africa"
            />
            {/* 1. PAGE HERO (REDESIGNED FOR OPERATIONS) */}
            <section className="relative pt-40 pb-16 md:pt-40 md:pb-16 px-2 sm:px-6 bg-[#F8F9FA] font-inter overflow-hidden">
                <div className="container max-w-[1200px] mx-auto relative z-10 flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                    <div className="flex-1">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col items-start text-left"
                        >
                                <h1 className="text-3xl md:text-5xl lg:text-[52px] font-semibold mb-6 md:mb-6 tracking-tight text-slate-900 leading-[1.2] md:leading-[1.1]">
                                    Build Reliable <span className="text-slate-900/40 block">Operational Capacity</span>
                                </h1>
                                <p className="text-base md:text-lg text-slate-600 mb-8 md:mb-10 max-w-lg leading-relaxed font-medium">
                                    We provide the people, systems, support, and management required to create functions that work. Designed for Startups, SMBs, Agencies, and Growth-stage companies.
                                </p>
                                <div className="flex flex-col sm:flex-row items-start justify-start gap-4 mb-12 w-full">
                                    <Button size="lg" className="h-14 px-8 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-none w-full sm:w-auto" asChild>
                                        <Link to="/book-consultation">Book Consultation</Link>
                                    </Button>
                                    <Button variant="ghost" size="lg" className="h-14 px-8 text-base text-slate-600 hover:text-slate-900 rounded-full font-bold flex items-center justify-start gap-2 w-full sm:w-auto" asChild>
                                        <Link to="/service-models">View Engagement Models <ArrowRight className="w-4 h-4" /></Link>
                                    </Button>
                                </div>
                                
                                {/* System Status Indicators */}
                                <div className="flex flex-wrap items-center justify-start gap-x-8 gap-y-4 pt-8 border-t border-slate-200/60 w-full">
                                    {[
                                        { label: "Vetting Completed", icon: UserCheck },
                                        { label: "Contract Model Selected", icon: Shield },
                                        { label: "Ops Manager Assigned", icon: Target }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2.5 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest sm:whitespace-nowrap">
                                            <item.icon className="h-4 w-4 text-blue-600 shrink-0" />
                                            <span>{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                        </motion.div>
                    </div>
                    <div className="flex-1 w-full lg:block">
                            <motion.div 
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative hidden lg:block"
                            >
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.06)] p-8">
                                    <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                                <Users className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-base">Active Shortlist</div>
                                                <div className="text-sm text-slate-500 font-medium">Operations Manager · 4 Candidates</div>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold tracking-widest rounded-full uppercase border border-amber-100">
                                            In Review
                                        </div>
                                    </div>
    
                                    <div className="space-y-4">
                                        {[
                                            { name: "Omo Izuafa", role: "Product Operations Manager", focus: "SaaS & Enterprise" },
                                            { name: "Kate Ogbuka", role: "Revenue Operations Lead", focus: "Fintech & Pay-ops" },
                                            { name: "Sylvia Agala", role: "Business Operations Manager", focus: "Growth & Marketplace" },
                                            { name: "Oluwatosin Adelaja", role: "Program Operations Lead", focus: "Scalable Infrastructure" }
                                        ].map((row, i) => (
                                            <motion.div 
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 + (i * 0.1) }}
                                                className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-400 font-bold text-xs">
                                                        {row.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{row.name}</div>
                                                        <div className="text-[12px] text-slate-500 font-medium">{row.role}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Focus</div>
                                                    <div className="text-[11px] font-semibold text-slate-700">{row.focus}</div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
    
                                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map((_, i) => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white" />
                                            ))}
                                            <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">
                                                +4
                                            </div>
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-blue-400" />
                                            Update: 2h ago
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
            </section>

            {/* 2. OPERATIONAL GAP SECTION (REDESIGNED) */}
            <section className="py-24 px-2 sm:px-6 relative bg-blue-50 border-y border-slate-100 font-inter">
                <div className="container max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-20 items-start lg:items-center">
                    <motion.div {...fadeIn} className="w-full lg:w-1/2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6">The Operational Gap</div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-8 text-slate-900 leading-[1.15] tracking-tight">Hiring Without Structure <br/>Slows Growth.</h2>
                        <p className="text-lg text-slate-600 leading-relaxed mb-6 max-w-lg">
                            When operations lack structure, founders get overloaded, customer support becomes inconsistent, and administrative bottlenecks pile up.
                        </p>
                        <p className="text-base text-slate-500 leading-relaxed max-w-lg">
                            Opsly HR provides the dedicated operational teams and infrastructure needed to break through growth ceilings.
                        </p>
                    </motion.div>

                    <div className="w-full lg:w-1/2 grid sm:grid-cols-2 gap-6">
                        {[
                            { 
                                title: "Leadership Time Diverted", 
                                desc: "Founders and ops leads spend weeks screening instead of building systems.", 
                                stat: "Average internal screening cycle: 3–5 weeks." 
                            },
                            { 
                                title: "Unpredictable Recruitment Costs", 
                                desc: "Agency retainers and internal hiring overhead compound quickly.", 
                                stat: "20–30% agency fees common." 
                            },
                            { 
                                title: "Cross-Border Payroll Complexity", 
                                desc: "Global hiring introduces legal and tax exposure.", 
                                stat: "Multiple regulatory layers per market." 
                            },
                            { 
                                title: "Disconnected Hiring Tools", 
                                desc: "ATS, payroll, contracts, onboarding rarely unified.", 
                                stat: "4+ systems typically required." 
                            }
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-8 bottom-8 w-[1px] bg-slate-200 group-hover:bg-blue-600 transition-colors" />
                                <h3 className="text-base font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">{item.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                    {item.desc}
                                </p>
                                <div className="mt-auto">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <TrendingUp className="w-3 h-3 text-slate-300" />
                                        Performance Hit
                                    </div>
                                    <div className="text-xs font-semibold text-slate-700">{item.stat}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. OUR OPERATIONAL MODEL (REDESIGNED) */}
            <section className="py-24 px-2 sm:px-6 bg-white font-inter relative overflow-hidden">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6">Our Operational Model</div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-900 mb-6 leading-[1.1] tracking-tight">
                                Workforce Solutions, <br/>Not Just Placements.
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                                We help businesses build, manage, and scale operational teams. We don't just connect you with talent—we deliver operational execution.
                            </p>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12 items-start">
                        {/* Left Column: Core Differentiators */}
                        <div className="lg:col-span-7 space-y-8">
                            {[
                                {
                                    number: "01",
                                    title: "Structured Matching",
                                    desc: "We match based on operational scope, execution depth, and team maturity — not just keywords.",
                                    note: "Skill-level tiering + manager oversight"
                                },
                                {
                                    number: "02",
                                    title: "Centralized Engagement Management",
                                    desc: "Contracts, compliance, coordination, and performance tracking handled within a unified system.",
                                    note: "No fragmented tools"
                                }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-10 bg-slate-50/50 rounded-2xl border border-slate-100 relative group hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all"
                                >
                                    <div className="text-4xl font-bold text-slate-200 mb-6 group-hover:text-blue-600/20 transition-colors">{item.number}</div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
                                    <p className="text-slate-600 text-lg leading-relaxed mb-6">{item.desc}</p>
                                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                        {item.note}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Right Column: Supporting Capabilities */}
                        <div className="lg:col-span-5 grid sm:grid-cols-2 lg:grid-cols-1 gap-6">
                            {[
                                { title: "Transparent Billing", desc: "Clear invoicing aligned to service model." },
                                { title: "Dedicated Ops Manager", desc: "Every engagement includes operational oversight." },
                                { title: "Service-Model Flexibility", desc: "Direct hire, trial-to-hire, or project-based." },
                                { title: "Automated Contracts", desc: "Service-type driven agreement generation." }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    className="p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
                                >
                                    <h4 className="text-base font-bold text-slate-900 mb-2">{item.title}</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>


            {/* 4. ENGAGEMENT STRUCTURE (REDESIGNED) */}
            <section className="py-24 px-2 sm:px-6 bg-slate-50/50 border-t border-slate-100 font-inter">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-left md:text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6">Engagement Structure</div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-900 mb-6 leading-[1.15] tracking-tight">
                            Three Structured Models. <br/>Clear Operational Tradeoffs.
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
                            Each model aligns risk, control, and cost with your team’s growth stage.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 mb-16 px-4">
                        {[
                            {
                                title: "Direct Hire",
                                desc: "Permanent placement with structured employment transfer.",
                                attributes: [
                                    "15% annual salary buyout",
                                    "Direct employment relationship",
                                    "One-time fee",
                                    "No ongoing platform margin"
                                ],
                                ideal: "Long-term leadership roles.",
                                cta: "Explore Direct Hire"
                            },
                            {
                                title: "Trial-to-Hire",
                                desc: "Start managed. Convert when ready.",
                                attributes: [
                                    "20% platform margin",
                                    "Talent paid via OpslyHR",
                                    "Monthly or hourly billing",
                                    "Conversion flexibility"
                                ],
                                ideal: "Reducing hiring risk.",
                                cta: "Start a Trial",
                                recommended: true
                            },
                            {
                                title: "One-Time Project",
                                desc: "Defined scope engagement.",
                                attributes: [
                                    "30% margin built into pricing",
                                    "Milestone-based billing",
                                    "No long-term obligation",
                                    "Rapid deployment"
                                ],
                                ideal: "High-impact defined initiatives.",
                                cta: "Launch a Project"
                            }
                        ].map((model, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`bg-white p-10 rounded-2xl border relative group flex flex-col items-start ${model.recommended ? 'border-blue-200 shadow-md ring-1 ring-blue-50' : 'border-slate-200 shadow-sm'}`}
                            >
                                {model.recommended && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.15em] px-4 py-1.5 rounded-full shadow-lg">
                                        Recommended
                                    </div>
                                )}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 rounded-t-[20px] overflow-hidden">
                                    <div className={`h-full w-20 transition-all group-hover:w-full duration-700 ${model.recommended ? 'bg-blue-600' : 'bg-slate-200'}`} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">{model.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium mb-8 min-h-[40px]">{model.desc}</p>
                                
                                <ul className="space-y-4 mb-8 w-full">
                                    {model.attributes.map((attr, j) => (
                                        <li key={j} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-600 transition-colors shrink-0" />
                                            {attr}
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-auto pt-8 border-t border-slate-50 w-full mb-8">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Ideal For</div>
                                    <div className="text-sm font-semibold text-slate-800">{model.ideal}</div>
                                </div>

                                <a href={getZoneUrl(Zone.AUTH, "/auth/signup/client")} className="w-full">
                                    <Button 
                                        className={`w-full py-6 rounded-full font-bold text-sm shadow-none border ${model.recommended ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                    >
                                        {model.cta}
                                    </Button>
                                </a>
                            </motion.div>
                        ))}
                    </div>

                    {/* Comparison Toggle Button */}
                    <div className="flex justify-center">
                        <button 
                            onClick={() => setShowComparison(!showComparison)}
                            className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors group px-6 py-4 rounded-full border border-slate-100 bg-white"
                        >
                            {showComparison ? 'Hide' : 'Full'} Comparison Table
                            {showComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />}
                        </button>
                    </div>

                    <AnimatePresence>
                        {showComparison && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.4 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-12 overflow-x-auto rounded-[16px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parameter</th>
                                                <th className="px-8 py-6 text-sm font-bold text-slate-900">Direct Hire</th>
                                                <th className="px-8 py-6 text-sm font-bold text-slate-900">Trial-to-Hire</th>
                                                <th className="px-8 py-6 text-sm font-bold text-slate-900">One-Time Project</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {[
                                                { p: "Margin", v1: "15% flat fee", v2: "20% platform margin", v3: "30% built-in" },
                                                { p: "Billing Type", v1: "Single payment", v2: "Monthly/Hourly", v3: "Milestone-based" },
                                                { p: "Timesheets", v1: "N/A", v2: "Required", v3: "N/A" },
                                                { p: "Conversion", v1: "Instant", v2: "Flexible", v3: "Project Based" },
                                                { p: "Commitment", v1: "Permanent", v2: "Rolling Monthly", v3: "Project Scope" }
                                            ].map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-8 py-5 text-sm font-bold text-slate-500">{row.p}</td>
                                                    <td className="px-8 py-5 text-sm text-slate-700 font-medium">{row.v1}</td>
                                                    <td className="px-8 py-5 text-sm text-slate-700 font-medium">{row.v2}</td>
                                                    <td className="px-8 py-5 text-sm text-slate-700 font-medium">{row.v3}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* 5. OUR PROCESS (REDESIGNED) */}
            <section className="py-24 px-2 sm:px-6 bg-white font-inter relative overflow-hidden">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-left md:text-center max-w-3xl mx-auto mb-24">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6">Our Process</div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-900 mb-6 leading-[1.15] tracking-tight">
                            A Structured Path from <br/>Need to Execution
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed font-medium">
                            Designed for speed, clarity, and operational control.
                        </p>
                    </div>

                    <div className="relative pt-12 pb-24">
                        {/* Horizontal Timeline Line */}
                        <div className="absolute top-[60px] left-0 right-0 h-[2px] border-t-2 border-dashed border-slate-100 hidden lg:block" />
                        
                        {/* Animated Progress Line */}
                        <motion.div 
                            className="absolute top-[60px] left-0 h-[2px] bg-blue-600 hidden lg:block"
                            initial={{ width: "0%" }}
                            whileInView={{ width: "100%" }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-12 lg:gap-4 relative z-10">
                            {[
                                {
                                    num: "01",
                                    title: "Define Requirements",
                                    desc: "Align on scope, outcomes, and success metrics.",
                                    expanded: "Work with our strategy team to map technical needs to operational goals before sourcing begins."
                                },
                                {
                                    num: "02",
                                    title: "Curated Matching",
                                    desc: "Receive 2–3 vetted operations professionals within 48 hours.",
                                    expanded: "Skip the generic marketplace. We present only the top 1% matched for your specific stack and scale."
                                },
                                {
                                    num: "03",
                                    title: "Interview & Select",
                                    desc: "Conduct structured interviews with platform guidance.",
                                    expanded: "Use our built-in scheduling and evaluation tools to ensure a consistent assessment across candidates."
                                },
                                {
                                    num: "04",
                                    title: "Engage & Activate",
                                    desc: "Contracts, compliance, and onboarding handled centrally.",
                                    expanded: "Automated EOR/Trial-to-Hire contracts generated instantly with secure digital signing."
                                },
                                {
                                    num: "05",
                                    title: "Optimize & Scale",
                                    desc: "Track performance, adjust scope, and scale confidently.",
                                    expanded: "Ongoing operational support and easy conversion or extension options as your needs evolve."
                                }
                            ].map((step, i) => (
                                <div key={i} className="flex flex-col items-center lg:items-start text-center lg:text-left group relative">
                                    {/* Step Marker */}
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="w-12 h-12 rounded-full border border-slate-200 bg-white shadow-sm mb-8 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-200 transition-all duration-300 relative z-20"
                                    >
                                        {step.num}
                                    </motion.div>

                                    {/* Content */}
                                    <div className="px-4 lg:px-0">
                                        <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                            {step.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[200px] lg:max-w-none">
                                            {step.desc}
                                        </p>
                                    </div>

                                    {/* Hover Reveal Card (Desktop Only) */}
                                    <div className="absolute top-24 left-1/2 -translate-x-1/2 w-64 p-6 bg-white rounded-xl border border-blue-100 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-2 transition-all duration-300 z-30 pointer-events-none hidden lg:block">
                                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Deep Dive</div>
                                        <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                                            {step.expanded}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. CLIENT RESULTS (REDESIGNED) */}
            <section className="py-24 px-2 sm:px-6 bg-white font-inter">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-left md:text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6">Client Results</div>
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 tracking-tight">
                            Trusted by Growing and <br/>Enterprise Teams
                        </h2>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12 items-center mb-20">
                        {/* Left Column: Testimonial */}
                        <div className="lg:col-span-7">
                            <div className="relative">
                                <span className="absolute -top-10 -left-6 text-[120px] text-slate-100 font-serif leading-none pointer-events-none">“</span>
                                <blockquote className="text-2xl md:text-3xl lg:text-4xl font-medium text-slate-900 leading-[1.3] relative z-10">
                                    OpslyHR transformed how we build our operations team. We moved from fragmented hiring to a <span className="text-blue-600">structured, world-class talent pipeline</span> in weeks.
                                </blockquote>
                                <div className="mt-12 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-900 border border-slate-200">
                                        O
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-slate-900">Ola Oluwadara</div>
                                        <div className="text-sm font-semibold text-slate-500">CEO, Kemuko Technologies</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Company Proof Panel */}
                        <div className="lg:col-span-5">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-slate-50/50 rounded-2xl border border-slate-200 p-8 shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Partner Organization</h4>
                                        <div className="text-xl font-bold text-slate-900 uppercase tracking-tight">Kemuko Technologies</div>
                                    </div>
                                    <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">
                                        Client since 2024
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Engagement Structure</div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                            Trial-to-Hire
                                            <ArrowRight className="h-4 w-4 text-blue-600" />
                                            Direct Conversion
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { label: "Shortlist Turnaround", value: "48-hour", icon: Clock },
                                            { label: "Faster Time-to-Hire", value: "40%", icon: TrendingUp },
                                            { label: "Successful Conversions", value: "2", icon: UserCheck }
                                        ].map((metric, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                    <metric.icon className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{metric.label}</div>
                                                    <div className="text-lg font-bold text-slate-900">{metric.value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Trust Metric Strip */}
                    <div className="border-t border-slate-100 pt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: "Placement Success", value: "98%" },
                            { label: "Shortlist Average", value: "48hr" },
                            { label: "Client Satisfaction", value: "94%" }
                        ].map((stat, i) => (
                            <div key={i} className="text-center md:text-left">
                                <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">{stat.value}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 8. WHY OPSLYHR (REDESIGNED) */}
            <section className="py-24 px-2 sm:px-6 bg-slate-50/50 font-inter">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-start">
                        {/* Left Column: Differentiators */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8">Why OpslyHR</div>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                                Execution Infrastructure, <br/>Not Resume Volume.
                            </h2>
                            <p className="text-lg text-slate-600 mb-12 leading-relaxed font-medium">
                                We replace fragmented recruitment workflows with structured, measurable hiring systems.
                            </p>

                            <div className="space-y-0">
                                {[
                                    {
                                        title: "Instant Curated Matches",
                                        desc: "Pre-vetted operations talent delivered within minutes — not weeks.",
                                        icon: Search
                                    },
                                    {
                                        title: "Compliance Built In",
                                        desc: "EOR, contracts, payroll, and legal structured from day one.",
                                        icon: Shield
                                    },
                                    {
                                        title: "Managed Execution",
                                        desc: "Dedicated ops oversight to ensure delivery, not just placement.",
                                        icon: Target
                                    },
                                    {
                                        title: "Performance Visibility",
                                        desc: "Track engagement health, timesheets, and output in one system.",
                                        icon: TrendingUp
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="py-8 border-b border-slate-200/60 flex gap-6 items-start group">
                                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                                            <item.icon className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h4>
                                            <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Dashboard Panel */}
                        <div className="lg:sticky lg:top-32">
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
                            >
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Enterprise Performance Metrics</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {[
                                        { label: "Time to Shortlist", value: "48", unit: "Hours", color: "text-blue-600" },
                                        { label: "Placement Success Rate", value: "98", unit: "%", color: "text-green-600" },
                                        { label: "Retention Improvement", value: "+40", unit: "%", color: "text-blue-600" },
                                        { label: "Client Satisfaction", value: "94", unit: "%", color: "text-slate-900" }
                                    ].map((stat, i) => (
                                        <div key={i} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                                                <div className="text-sm font-semibold text-slate-600">Operational Standard</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-4xl font-bold ${stat.color} tracking-tighter mb-1`}>
                                                    {stat.value}<span className="text-xl ml-0.5">{stat.unit}</span>
                                                </div>
                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-[10px] font-bold text-blue-600 rounded-md">
                                                    Verified
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default ForCompanies;
