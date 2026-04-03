import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

const Careers = () => {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    const rolesAvailable = false;

    return (
        <div className="bg-white font-inter text-slate-900">
            <SEO 
                title="Careers | Join the Future of Global Operations"
                description="Help us build the infrastructure for the next generation of operations teams. Explore career opportunities at OPSlyHR and help connect world-class African operations talent with global companies."
                keywords="Operations Careers, Remote Work Infrastructure, Join OPSlyHR, African Operations Jobs, Build Global Teams"
            />
            <section className="pt-32 md:pt-48 pb-24 md:pb-32 px-6">
                <div className="container max-w-7xl mx-auto">
                    <div className="flex flex-wrap items-center -mx-4">
                        <div className="w-full lg:w-1/2 px-4 mb-12 lg:mb-0">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="flex flex-col items-start text-left"
                            >
                                <div className="inline-flex items-center px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-8 shadow-sm">
                                    CAREERS AT OPSLYHR
                                </div>
                                <h1 className="text-4xl md:text-7xl font-semibold text-slate-900 mb-8 tracking-tight leading-[1.1]">
                                    Help Build the Infrastructure Behind Modern Operations Teams.
                                </h1>
                                <p className="text-lg md:text-xl text-slate-600 mb-12 font-medium leading-relaxed max-w-xl">
                                    OPSlyHR is building structured systems for how companies hire and manage product and operations talent globally. We're looking for thoughtful, high-ownership individuals to help us scale that vision.
                                </p>
                                <div className="flex flex-col sm:flex-row items-start justify-start gap-6">
                                    <Button 
                                        variant="outline"
                                        className="h-14 px-8 text-base rounded-xl border-[1.5px] border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all duration-300 shadow-none shrink-0"
                                        asChild
                                    >
                                        <a href="#open-roles">
                                            View Open Roles <ArrowRight className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Link to="/vetting-process" className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors inline-flex items-center group mt-4 sm:mt-0">
                                        Learn About Our Vetting Standard <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                        <div className="w-full lg:w-1/2 px-4 flex justify-end">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="w-full max-w-md aspect-video bg-slate-50 border border-slate-100 hidden lg:flex items-center justify-center relative overflow-hidden rounded-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-bl from-blue-50/20 to-transparent"></div>
                                <div className="relative z-10 flex flex-col items-center gap-3">
                                    <div className="w-24 h-1 bg-slate-200 rounded-full"></div>
                                    <div className="w-16 h-1 bg-slate-100 rounded-full"></div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. WHO WE ARE BUILDING */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100 bg-slate-50/30">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="max-w-4xl">
                        <motion.div {...fadeIn}>
                            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-12 tracking-tight">We Hire for Ownership and Execution.</h2>
                            <div className="space-y-8">
                                <p className="text-lg md:text-xl text-slate-600 font-medium leading-[1.8]">
                                    OPSlyHR is not built on hype. It is built on structure, clarity, and operational excellence. We hire people who think in systems, execute with discipline, and prioritize measurable outcomes over noise.
                                </p>
                                <ul className="space-y-4 pt-4">
                                    {[
                                        "Systems thinkers",
                                        "Clear communicators",
                                        "High-accountability operators",
                                        "Process-driven builders",
                                        "Ethical decision-makers"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-4 text-slate-900 font-bold">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. HOW WE OPERATE */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <motion.div {...fadeIn} className="mb-20">
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Our Operating Principles</h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
                        {[
                            { t: "Clarity", d: "Defined responsibilities and measurable outcomes." },
                            { t: "Structure", d: "Documented processes over improvisation." },
                            { t: "Accountability", d: "Performance ownership across functions." },
                            { t: "Transparency", d: "Clear pricing, clear expectations, clear communication." },
                            { t: "Global Perspective", d: "Distributed collaboration across time zones." },
                            { t: "Long-Term Thinking", d: "We optimize for sustainability, not speed alone." }
                        ].map((item, i) => (
                            <motion.div 
                                key={i} 
                                {...fadeIn}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                className="space-y-3"
                            >
                                <h4 className="text-xl font-bold text-slate-900">{item.t}</h4>
                                <p className="text-base text-slate-500 font-medium leading-relaxed">{item.d}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. WHAT WE OFFER */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100 bg-slate-50/30">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="max-w-4xl">
                        <motion.div {...fadeIn}>
                            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-8 tracking-tight">Why Join OPSlyHR</h2>
                            <p className="text-lg md:text-xl text-slate-600 font-medium leading-[1.8] mb-12">
                                We are building long-term infrastructure. That requires long-term thinking — in how we hire, grow, and support our team.
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    "Remote-first environment",
                                    "Structured growth paths",
                                    "Outcome-based performance evaluation",
                                    "Cross-functional collaboration",
                                    "Opportunity to shape global hiring infrastructure"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 text-slate-900 font-bold">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 5. CURRENT OPEN ROLES */}
            <section id="open-roles" className="py-24 md:py-32 px-6 border-t border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    {rolesAvailable ? (
                        <>
                            <motion.div {...fadeIn} className="mb-16">
                                <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 tracking-tight">Open Positions</h2>
                            </motion.div>
                            <div className="divide-y divide-slate-100">
                                {/* Placeholder for roles if they were available */}
                            </div>
                        </>
                    ) : (
                        <div className="max-w-3xl">
                            <motion.div {...fadeIn}>
                                <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">We’re Not Actively Hiring — But We’re Always Listening.</h2>
                                <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
                                    If you believe you can contribute meaningfully to OPSlyHR's mission, reach out.
                                </p>
                                <Button 
                                    variant="outline"
                                    className="h-14 px-8 text-base rounded-xl border-[1.5px] border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all duration-300 shadow-none"
                                    asChild
                                >
                                    <Link to="/contact">Submit Your Profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </motion.div>
                        </div>
                    )}
                </div>
            </section>

            {/* 6. OUR HIRING PROCESS */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100 bg-slate-50/30">
                <div className="container max-w-[1200px] mx-auto">
                    <motion.div {...fadeIn} className="mb-20 text-center">
                        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 tracking-tight">A Structured Evaluation Process</h2>
                    </motion.div>

                    <div className="max-w-2xl mx-auto">
                        {[
                            { step: "01", t: "Application Review", d: "Assessment of experience and execution history." },
                            { step: "02", t: "Structured Interview", d: "Evaluation of communication and systems thinking." },
                            { step: "03", t: "Practical Assessment (if applicable)", d: "Role-specific execution task." },
                            { step: "04", t: "Final Alignment Conversation", d: "Culture, expectations, and long-term fit." }
                        ].map((item, i, arr) => (
                            <div key={i} className="relative flex gap-8 pb-12 last:pb-0">
                                {i !== arr.length - 1 && (
                                    <div className="absolute left-[15px] top-[40px] bottom-0 w-px border-l-[1.5px] border-dashed border-slate-200" />
                                )}
                                <div className="z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center text-[11px] font-bold text-slate-900">
                                    {item.step}
                                </div>
                                <motion.div 
                                    {...fadeIn} 
                                    transition={{ duration: 0.6, delay: i * 0.1 }}
                                    className="space-y-2"
                                >
                                    <h4 className="text-xl font-bold text-slate-900">{item.t}</h4>
                                    <p className="text-base text-slate-500 font-medium leading-relaxed">{item.d}</p>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. DIVERSITY & PROFESSIONAL STANDARDS */}
            <section className="py-24 md:py-32 px-6 border-t border-slate-100">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="max-w-3xl">
                        <motion.div {...fadeIn}>
                            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-8 tracking-tight">Built on Professionalism and Integrity</h2>
                            <p className="text-lg text-slate-600 font-medium leading-relaxed">
                                We value diverse perspectives and maintain strict professional standards. OPSlyHR is committed to ethical hiring, equal opportunity, and a respectful work environment.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Careers;
