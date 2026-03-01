
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, Target, Users, Zap, Search, FileText, MessageSquare, Award, Clock } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const VettingProcess = () => {
    return (
        <div className="bg-white font-inter">
            {/* HERO SECTION */}
            <section className="pt-32 md:pt-48 pb-24 md:pb-32 px-6 overflow-hidden">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="max-w-4xl"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-8 shadow-sm">
                                Vetting Standard
                            </div>
                            <h1 className="text-4xl md:text-7xl font-semibold text-slate-900 mb-8 tracking-tight leading-[1.1]">
                                A Structured Evaluation <br className="hidden md:block" /> Framework for Operators.
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 mb-12 font-medium leading-relaxed max-w-2xl">
                                Every professional admitted into the Taskive network undergoes a multi-stage assessment designed to evaluate execution depth, operational judgment, and long-term impact.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-8">
                                <Button 
                                    size="lg" 
                                    variant="outline"
                                    className="h-14 px-10 text-base rounded-xl border-[1.5px] border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all duration-300 shadow-none" 
                                    asChild
                                >
                                    <Link to="/auth/signup?portal=talent">
                                        Apply to the Network <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                
                                <Link 
                                    to="/service-models"
                                    className="text-slate-900 font-bold hover:text-blue-600 transition-colors"
                                >
                                    Explore Engagement Models →
                                </Link>
                            </div>
                        </motion.div>

                        {/* Right Visual (Layered Assurance) */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative lg:h-[500px] flex items-center justify-center"
                        >
                            <div className="relative w-full max-w-[400px]">
                                {[
                                    { title: "Institutional Baseline", desc: "Compliance & Identity Verification", icon: ShieldCheck, color: "bg-slate-50" },
                                    { title: "Functional Integrity", desc: "Domain-Specific Skill Mapping", icon: Target, color: "bg-white" },
                                    { title: "Execution Proof", desc: "Outcome-Based Case Review", icon: Award, color: "bg-white" },
                                    { title: "Outcome Verification", desc: "Continuous Performance Scoring", icon: Zap, color: "bg-blue-50/50", active: true }
                                ].map((card, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
                                        style={{ 
                                            zIndex: 4 - idx,
                                            marginTop: idx === 0 ? 0 : "-40px",
                                            marginLeft: `${idx * 16}px`,
                                            rotate: `${(idx - 1.5) * 1}deg`
                                        }}
                                        className={`group relative border border-slate-200 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgb(0,0,0,0.06)] transition-all duration-500 ${card.color} ${card.active ? 'border-blue-200 ring-1 ring-blue-100' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${card.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                                                <card.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className={`text-sm font-bold tracking-tight transition-colors duration-300 ${card.active ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'}`}>
                                                        {card.title}
                                                    </h4>
                                                    <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${card.active ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                                                        {card.active ? 'Active Standard' : 'Verified'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 font-medium mt-1 leading-tight">{card.desc}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Decorative Dots */}
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
                                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-slate-50 rounded-full blur-3xl opacity-50"></div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* SECTION 2 — OUR SELECTION PHILOSOPHY */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100 bg-slate-50/50">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-8 tracking-tight">We Vet for Execution, <br /> Not Just Experience.</h2>
                            <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
                                Taskive evaluates documented outcomes, execution maturity, and functional depth — not resumes alone. We look for operators who can translate complexity into measurable progress.
                            </p>
                        </div>
                        <div className="space-y-6">
                            {[
                                "Measurable impact history",
                                "Decision-making depth",
                                "Systems thinking",
                                "Cross-functional collaboration",
                                "Communication clarity"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-200 last:border-0">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                    <span className="text-lg font-bold text-slate-900">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 3 — THE 5-STAGE VETTING FRAMEWORK */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="max-w-3xl mb-20">
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Multi-Stage Evaluation Process</h2>
                        <p className="text-slate-500 font-medium">A rigorous, multi-layered filtration system ensuring only high-impact professionals enter the network.</p>
                    </div>

                    <div className="relative space-y-0">
                        {/* Dotted Line */}
                        <div className="absolute left-[19px] top-6 bottom-6 w-[2px] border-l-2 border-dotted border-slate-200 hidden md:block" />

                        {[
                            { step: "01", title: "Application Review", desc: "Assessment of documented impact and scope of responsibility.", icon: Search },
                            { step: "02", title: "Functional Skill Evaluation", desc: "Deep review of domain expertise (Product Ops, Rev Ops, Biz Ops, etc.).", icon: FileText },
                            { step: "03", title: "Execution Case Review", desc: "Evaluation of real-world projects, metrics, and decision tradeoffs.", icon: Award },
                            { step: "04", title: "Structured Interview", desc: "Assessment of communication, systems thinking, and leadership maturity.", icon: MessageSquare },
                            { step: "05", title: "Final Panel Approval", desc: "Internal review before admission to the curated network.", icon: ShieldCheck }
                        ].map((item, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="relative pl-12 md:pl-20 pb-16 last:pb-0"
                            >
                                <div className="absolute left-0 top-0 w-10 h-10 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center z-10 shadow-sm">
                                    <span className="text-xs font-bold text-blue-600">{item.step}</span>
                                </div>
                                <div className="max-w-2xl">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">{item.title}</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 4 — SKILL LEVEL TIERING SYSTEM */}
            <section className="py-24 md:py-32 px-6 bg-slate-900 text-white">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-semibold mb-6 tracking-tight">Operator Skill-Level Classification</h2>
                        <p className="text-slate-400 font-medium max-w-2xl mx-auto">Professionals are categorized by execution complexity and strategic scope.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {[
                            { level: "Level 1", title: "Associate Operator", desc: "Execution-focused, task-driven contributors." },
                            { level: "Level 2", title: "Mid-Level Operator", desc: "Independent execution with process ownership." },
                            { level: "Level 3", title: "Senior Operator", desc: "Cross-functional leadership and system optimization." },
                            { level: "Level 4", title: "Lead / Head", desc: "Strategic execution oversight." },
                            { level: "Level 5", title: "Executive", desc: "Org-wide operational design and leadership." }
                        ].map((tier, i) => (
                            <div key={i} className="p-8 border border-white/10 rounded-xl bg-white/5">
                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">{tier.level}</div>
                                <h4 className="text-lg font-bold mb-3">{tier.title}</h4>
                                <p className="text-sm text-slate-400 font-sm leading-relaxed">{tier.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 5 — ACCEPTANCE RATE & QUALITY CONTROL */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-8 tracking-tight">Selective Admission <br /> Criteria</h2>
                            <div className="space-y-6">
                                {[
                                    { t: " एडमिशन Rate Benchmark", d: "Strict selective threshold for network admission." },
                                    { t: "Continuous monitoring", d: "Real-time performance tracking against project KPIs." },
                                    { t: "Engagement feedback loops", d: "Direct client reporting integrated into operator scoring." },
                                    { t: "Removal for underperformance", d: "Zero-tolerance for failure to meet institutional standards." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-slate-900">{item.t}</h4>
                                            <p className="text-sm text-slate-500 font-medium">{item.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-12 rounded-[24px] border border-slate-200">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Performance Commitment</div>
                            <div className="text-5xl font-semibold text-slate-900 mb-4 tracking-tighter">98%</div>
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Engagement Success Rate</div>
                            <p className="text-slate-500 font-medium italic">"Quality is maintained through a combination of upfront selectivity and ongoing performance feedback."</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 7 — WHY THIS MATTERS */}
            <section className="py-24 md:py-32 px-6 bg-white border-t border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="max-w-3xl mx-auto text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Why Structured Vetting Reduces Risk</h2>
                        <p className="text-slate-500 font-medium">Hiring without vetting is a variable cost. Hiring with Taskive is a managed investment.</p>
                    </div>

                    <div className="max-w-4xl mx-auto overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-widest">Dimension</th>
                                    <th className="px-8 py-6 text-sm font-bold text-slate-900 uppercase tracking-widest">Unvetted Market</th>
                                    <th className="px-8 py-6 text-sm font-bold text-blue-600 uppercase tracking-widest bg-blue-50/30">Taskive Network</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[
                                    { dim: "Screening Time", trad: "Weeks of manual review", task: "Instant shortlist access" },
                                    { dim: "Placement Success", trad: "Highly Variable", task: "Institutional Benchmark (98%)" },
                                    { dim: "Replacement Risk", trad: "Full legal/hiring restart", task: "Managed Guarantees" },
                                    { dim: "Standards", trad: "Self-Reported", task: "Externally Validated" }
                                ].map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6 text-sm font-bold text-slate-900">{row.dim}</td>
                                        <td className="px-8 py-6 text-sm text-slate-400 font-medium">{row.trad}</td>
                                        <td className="px-8 py-6 text-sm text-slate-900 font-bold bg-blue-50/10">{row.task}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* SECTION 9 — FAQ SECTION */}
            <section className="py-24 md:py-32 px-6 bg-slate-50/50 border-t border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="mb-16">
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">Vetting Clarity</div>
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 tracking-tight">Common Questions</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-200 pb-4">Application & Review</h3>
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                {[
                                    { q: "What is the primary criteria for admission?", a: "We focus on documented operational outcomes and execution depth rather than just tenure or brand names on a resume." },
                                    { q: "How long does the vetting process take?", a: "Typically 7-14 days from initial application to final panel review." },
                                    { q: "Is admission permanent?", a: "No. Admission is contingent on maintaining performance scores across client engagements." }
                                ].map((item, i) => (
                                    <AccordionItem key={i} value={`item-${i}`} className="border-b border-slate-200">
                                        <AccordionTrigger className="text-left font-bold text-slate-900 hover:no-underline py-4">
                                            {item.q}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-slate-500 font-medium pb-6 leading-relaxed">
                                            {item.a}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-200 pb-4">Evaluation & Approval</h3>
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                {[
                                    { q: "What professional tiers do you offer?", a: "Operators are classified into 5 functional tiers, from Associate to Executive level." },
                                    { q: "How is performance monitored?", a: "Internal feedback loops, client reviews, and delivery metric tracking during engagements." },
                                    { q: "Can operators be reclassified?", a: "Yes. Tiering is reviewed annually or after significant milestone achievements." }
                                ].map((item, i) => (
                                    <AccordionItem key={i} value={`item-eval-${i}`} className="border-b border-slate-200">
                                        <AccordionTrigger className="text-left font-bold text-slate-900 hover:no-underline py-4">
                                            {item.q}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-slate-500 font-medium pb-6 leading-relaxed">
                                            {item.a}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
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
                        <h2 className="text-4xl md:text-6xl font-semibold text-slate-900 mb-12 tracking-tight">Ready to Join a Curated <br /> Network of Operators?</h2>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                            <Button 
                                size="lg" 
                                variant="outline"
                                className="h-16 px-12 text-lg rounded-xl border-[1.5px] border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all duration-300 shadow-none shrink-0" 
                                asChild
                            >
                                <Link to="/auth/signup?portal=talent">
                                    Apply for Vetting <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Link to="/auth/signup?portal=client" className="text-slate-900 font-bold hover:text-blue-600 transition-colors">
                                Speak with Our Team →
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default VettingProcess;
