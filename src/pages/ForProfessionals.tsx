
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, DollarSign, ShieldCheck, Briefcase, Zap, Globe, Lock, ArrowRight, UserCheck, Star } from "lucide-react";

const ForProfessionals = () => {
    return (
        <div className="bg-white min-h-screen text-slate-900 selection:bg-black selection:text-white font-serif">

            {/* Header / Hero - Soft Editorial Style */}
            <section className="relative min-h-[90vh] flex flex-col justify-center px-6 bg-[#FDFCF8] overflow-hidden">
                <div className="container max-w-6xl mx-auto relative z-20 grid md:grid-cols-2 gap-16 items-center">
                    <div className="order-2 md:order-1">
                        <div className="inline-block px-3 py-1 mb-8 border-l-2 border-stone-900 pl-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Talent Network</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-serif font-medium mb-8 text-stone-900 leading-[0.95] tracking-tight">
                            Your next <br />
                            <span className="italic text-stone-400">chapter.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-stone-600 mb-12 font-sans font-light leading-relaxed max-w-lg">
                            Access a curated network of high-impact roles at ambitious companies. No noise. Just great work.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6">
                            <Button size="lg" className="h-16 px-10 text-lg bg-stone-900 text-white hover:bg-stone-800 rounded-full shadow-xl shadow-stone-200 font-medium" asChild>
                                <Link to="/auth/signup?type=talent">Apply as Talent</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Soft Visual */}
                    <div className="order-1 md:order-2 relative h-[600px] w-full">
                        <div className="absolute top-10 right-10 w-full h-full bg-stone-100 rounded-t-[10rem] rounded-b-[2rem] -z-10"></div>
                        <div className="w-full h-full rounded-t-[10rem] rounded-b-[2rem] overflow-hidden shadow-2xl shadow-stone-200">
                            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Professional Woman" />
                        </div>
                    </div>
                </div>
            </section>

            {/* THE DEAL: Minimalist Grid */}
            <section className="py-32 px-6">
                <div className="container max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-12 lg:gap-20">
                        <div className="border-t border-black pt-6">
                            <div className="font-sans text-xs font-bold uppercase tracking-widest mb-4 text-slate-400">01 — The Work</div>
                            <h3 className="text-3xl font-medium mb-4">Build, Don't Maintain.</h3>
                            <p className="font-sans text-slate-600 leading-relaxed">
                                We partner with companies in transformation. You're here to launch, fix, or scale. High impact roles only.
                            </p>
                        </div>
                        <div className="border-t border-black pt-6">
                            <div className="font-sans text-xs font-bold uppercase tracking-widest mb-4 text-slate-400">02 — The Pay</div>
                            <h3 className="text-3xl font-medium mb-4">Top of Market.</h3>
                            <p className="font-sans text-slate-600 leading-relaxed">
                                Transparent, weekly payouts. We handle invoicing and collections so you can focus on the craft.
                            </p>
                        </div>
                        <div className="border-t border-black pt-6">
                            <div className="font-sans text-xs font-bold uppercase tracking-widest mb-4 text-slate-400">03 — The Life</div>
                            <h3 className="text-3xl font-medium mb-4">Total Freedom.</h3>
                            <p className="font-sans text-slate-600 leading-relaxed">
                                Remote-first. Asynchronous. You define how you work best. We just handle the compliance.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURED ROLES: Magazine Layout */}
            <section className="py-24 bg-slate-50 border-y border-black/5">
                <div className="container max-w-6xl mx-auto flex flex-col md:flex-row gap-16 items-start">
                    <div className="md:w-1/3 sticky top-32">
                        <h2 className="text-5xl md:text-6xl font-medium mb-6 leading-none">Recent<br />Placements.</h2>
                        <p className="font-sans text-slate-500 mb-8">
                            A curated look at where our talent is making an impact.
                        </p>
                        <Button variant="link" className="font-sans p-0 text-black underline underline-offset-4 hover:opacity-70" asChild>
                            <Link to="/auth/signup?type=talent">View Open Roles &rarr;</Link>
                        </Button>
                    </div>

                    <div className="md:w-2/3 grid gap-0 border border-slate-200 bg-white">
                        {[
                            { role: "Fractional CPO", company: "Fintech Scaleup", rate: "$3,500/week", icon: Briefcase },
                            { role: "Chief of Staff", company: "AI Research Lab", rate: "$180k + Equity", icon: Zap },
                            { role: "Head of Growth", company: "SaaS Platform", rate: "$220k Base", icon: Briefcase },
                            { role: "Ops Architect", company: "Logistics Unicorn", rate: "$250/hour", icon: Globe }
                        ].map((job, i) => (
                            <div key={i} className="p-8 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group flex items-center justify-between font-sans">
                                <div>
                                    <h4 className="text-xl font-bold mb-1 group-hover:text-blue-600 transition-colors">{job.role}</h4>
                                    <div className="text-slate-500 text-sm">{job.company}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-sm bg-slate-100 px-3 py-1 rounded-full">{job.rate}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* VETTING PROCESS: Step by Step */}
            <section className="py-32 px-6 bg-black text-white">
                <div className="container max-w-4xl mx-auto">
                    <div className="text-center mb-20">
                        <div className="inline-block border border-white/20 px-4 py-1 rounded-full text-xs font-sans tracking-widest mb-6">THE STANDARD</div>
                        <h2 className="text-4xl md:text-6xl font-medium">Quality over quantity.</h2>
                    </div>

                    <div className="space-y-12">
                        {[
                            { step: "01", title: "Apply as Talent", desc: "Submit your profile and portfolio of work." },
                            { step: "02", title: "Skill Verification", desc: "We review your expertise and past impact." },
                            { step: "03", title: "Join the Network", desc: "Get matched with top-tier opportunities." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-8 group">
                                <div className="font-mono text-3xl text-slate-700 group-hover:text-white transition-colors">{item.step}</div>
                                <div className="border-b border-white/10 pb-12 w-full group-last:border-0">
                                    <h3 className="text-3xl font-medium mb-3">{item.title}</h3>
                                    <p className="font-sans text-slate-400 text-lg">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FOOTER CTA (REDESIGNED) */}
            <section className="py-32 px-6 text-center bg-slate-50 border-t border-slate-200">
                <div className="container max-w-3xl mx-auto">
                    <h2 className="text-5xl md:text-6xl font-bold mb-8 text-slate-900 font-display">Ready for your next challenge?</h2>
                    <p className="font-sans text-xl text-slate-600 mb-12 max-w-xl mx-auto">
                        Join the network of top product and operations professionals.
                    </p>
                    <Button size="lg" className="h-16 px-12 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all text-lg font-bold shadow-xl" asChild>
                        <Link to="/auth/signup?type=talent">Apply as Talent</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default ForProfessionals;
