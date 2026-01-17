
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Building2, Globe, Clock, Shield, Users, Zap, Briefcase, Layout, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const ServiceModels = () => {
    return (
        <div className="bg-background min-h-screen text-foreground selection:bg-primary selection:text-white pb-0">

            {/* 1. HERO (PROFESSIONAL / CORPORATE) */}
            <section className="pt-40 pb-24 px-6 bg-white border-b border-slate-200">
                <div className="container max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-md text-slate-700 text-xs font-bold uppercase tracking-wide mb-6">

                            For Scaling Companies
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 font-display text-slate-900 leading-tight">
                            Flexible hiring models <br /> for every stage.
                        </h1>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
                            Whether you need a full-time leader, a 90-day trial, or a specialized project team, we provide the structure and support to make it successful.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" className="h-14 px-8 text-base bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm font-semibold" asChild>
                                <Link to="/book-consultation">Consult with an Expert</Link>
                            </Button>
                            <Button variant="outline" size="lg" className="h-14 px-8 text-base border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg" asChild>
                                <Link to="/pricing">View Pricing</Link>
                            </Button>
                        </div>
                    </div>
                    {/* Right Side Visual - Corporate/Clean */}
                    <div className="relative h-[500px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-xl lg:translate-x-8">
                        <div className="absolute inset-0 bg-slate-200/50"></div>
                        {/* Abstract UI representation of "Structure" using clean cards */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] space-y-4">
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600"><Briefcase className="w-5 h-5" /></div>
                                    <div>
                                        <div className="font-bold text-slate-900">Full-Time Hire</div>
                                        <div className="text-xs text-slate-500">Permanent Placement</div>
                                    </div>
                                </div>
                                <Check className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 flex items-center justify-between opacity-80 scale-95">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600"><Clock className="w-5 h-5" /></div>
                                    <div>
                                        <div className="font-bold text-slate-900">Trial Engagement</div>
                                        <div className="text-xs text-slate-500">90-Day Evaluation</div>
                                    </div>
                                </div>
                                <Check className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 flex items-center justify-between opacity-60 scale-90">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600"><Zap className="w-5 h-5" /></div>
                                    <div>
                                        <div className="font-bold text-slate-900">Project Support</div>
                                        <div className="text-xs text-slate-500">Milestone Based</div>
                                    </div>
                                </div>
                                <Check className="w-5 h-5 text-green-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. TRUST LOGOS */}
            <section className="py-12 px-6 border-b border-slate-100 bg-slate-50/50">
                <div className="container max-w-6xl mx-auto">
                    <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by Companies Across Industries</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholders for logos - replacing generic icons with text for 'Corporate' feel if no assets available, but using block divs for structure */}
                        {["TechGrow", "FinEase", "HealthPlus", "EduScale", "LogiChain"].map((name, i) => (
                            <div key={i} className="h-12 flex items-center justify-center font-display font-bold text-xl text-slate-400">{name}</div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. CORE ENGAGEMENT MODELS */}
            <section className="py-24 px-6 bg-white">
                <div className="container max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display text-primary">Our Core Engagement Models</h2>
                        <p className="text-slate-600 text-lg">Choose the model that best aligns with your hiring goals and business stage.</p>
                    </div>

                    <div className="space-y-24">
                        {/* 3.1 Full-Time Hire */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="order-2 md:order-1">
                                <div className="inline-block px-3 py-1 bg-slate-100 text-slate-900 text-xs font-bold rounded-full mb-4">PERMANENT</div>
                                <h3 className="text-3xl md:text-4xl font-bold mb-4 font-display text-primary">Full-Time Hire</h3>
                                <p className="text-xl text-slate-600 font-serif mb-6">Hire Top-Tier Product & Operations Professionals Permanently</p>

                                <div className="space-y-6 mb-8">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <h4 className="font-bold mb-3 flex items-center gap-2 text-primary"><Briefcase className="w-5 h-5 text-blue-600" /> What You Get</h4>
                                        <ul className="space-y-2 text-slate-600 text-sm">
                                            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Save time on recruitment and screening.</li>
                                            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Build lasting capacity with dedicated pros.</li>
                                            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Reduce HR and legal overhead.</li>
                                        </ul>
                                    </div>
                                    <div className="pl-2 border-l-2 border-blue-200">
                                        <h4 className="font-bold mb-2 text-sm uppercase tracking-wide text-slate-400">Key Benefits</h4>
                                        <ul className="text-slate-700 space-y-1">
                                            <li>• Pre-vetted candidates matched to exact needs</li>
                                            <li>• Free talent replacements (First 4 Months)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 md:order-2 bg-slate-100 rounded-3xl h-[400px] flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-200"></div>
                                <div className="relative z-10 bg-white p-8 rounded-2xl shadow-xl max-w-xs">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">JD</div>
                                        <div>
                                            <div className="font-bold text-primary">Jane Doe</div>
                                            <div className="text-xs text-slate-500">Senior Product Manager</div>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded mb-2"></div>
                                    <div className="h-2 w-2/3 bg-slate-100 rounded mb-4"></div>
                                    <div className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">HIRED</div>
                                </div>
                            </div>
                        </div>

                        {/* 3.2 Trial-to-Hire */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="bg-slate-900 rounded-3xl h-[400px] flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
                                <div className="relative z-10 text-center text-white p-8">
                                    <div className="text-5xl font-bold mb-2">90 Days</div>
                                    <div className="text-xl text-slate-300">To Decide with Confidence</div>
                                </div>
                            </div>
                            <div>
                                <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full mb-4">POPULAR</div>
                                <h3 className="text-3xl md:text-4xl font-bold mb-4 font-display text-primary">Trial-to-Hire</h3>
                                <p className="text-xl text-slate-600 font-serif mb-6">Evaluate Expertise Before Making a Full Commitment</p>

                                <div className="space-y-6 mb-8">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <h4 className="font-bold mb-3 flex items-center gap-2 text-primary"><Clock className="w-5 h-5 text-indigo-600" /> How It Works</h4>
                                        <ul className="space-y-2 text-slate-600 text-sm">
                                            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Engage professionals on a trial basis.</li>
                                            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Assess cultural fit and performance.</li>
                                            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Transition to full-time hire smoothly.</li>
                                        </ul>
                                    </div>
                                    <div className="pl-2 border-l-2 border-indigo-200">
                                        <h4 className="font-bold mb-2 text-sm uppercase tracking-wide text-slate-400">Key Benefits</h4>
                                        <ul className="text-slate-700 space-y-1">
                                            <li>• Lower hiring risk through testing</li>
                                            <li>• Fill urgent roles immediately</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3.3 Fully Managed Operations */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="order-2 md:order-1">
                                <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full mb-4">ENTERPRISE</div>
                                <h3 className="text-3xl md:text-4xl font-bold mb-4 font-display text-primary">Fully Managed Operations</h3>
                                <p className="text-xl text-slate-600 font-serif mb-6">Outsource Your Business or Technical Operations</p>

                                <div className="space-y-6 mb-8">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <h4 className="font-bold mb-3 flex items-center gap-2 text-primary"><Building2 className="w-5 h-5 text-purple-600" /> What's Included</h4>
                                        <ul className="space-y-2 text-slate-600 text-sm">
                                            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Dedicated account manager.</li>
                                            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Curated teams (Support, PMs, IT).</li>
                                            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Analytics & performance reporting.</li>
                                        </ul>
                                    </div>
                                    <div className="pl-2 border-l-2 border-purple-200">
                                        <h4 className="font-bold mb-2 text-sm uppercase tracking-wide text-slate-400">Key Benefits</h4>
                                        <ul className="text-slate-700 space-y-1">
                                            <li>• Only pay for productive hours</li>
                                            <li>• 50-60% cost savings vs in-house</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 md:order-2 bg-slate-100 rounded-3xl h-[400px] flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-slate-900"></div>
                                {/* Simple sleek dashboard abstract */}
                                <div className="relative z-10 w-3/4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-white font-bold">Team Performance</div>
                                        <div className="text-green-400 text-sm">+12.5%</div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-2 bg-white/20 rounded w-full"><div className="h-full bg-purple-500 w-[80%] rounded"></div></div>
                                        <div className="h-2 bg-white/20 rounded w-full"><div className="h-full bg-blue-500 w-[65%] rounded"></div></div>
                                        <div className="h-2 bg-white/20 rounded w-full"><div className="h-full bg-green-500 w-[90%] rounded"></div></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3.4 One-Time Tasks */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="bg-emerald-50 rounded-3xl h-[300px] flex flex-col items-center justify-center p-8 text-center border border-emerald-100">
                                <Zap className="w-16 h-16 text-emerald-500 mb-6" />
                                <h3 className="text-2xl font-bold text-emerald-900 mb-2">Need it done yesterday?</h3>
                                <p className="text-emerald-700">Rapid response teams for documentation, analysis, and automation.</p>
                            </div>
                            <div>
                                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-4">AD-HOC</div>
                                <h3 className="text-3xl md:text-4xl font-bold mb-4 font-display text-primary">One-Time Tasks & Projects</h3>
                                <p className="text-xl text-slate-600 font-serif mb-6">Ad-Hoc and Project-Based Professional Support</p>

                                <ul className="grid grid-cols-2 gap-4 mb-8">
                                    {["Process Documentation", "Data Analysis", "Workflow Automation", "Tool Integrations"].map(item => (
                                        <li key={item} className="bg-white border border-slate-200 p-3 rounded-lg text-sm font-medium text-slate-700 shadow-sm">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Button variant="outline" className="border-slate-300">View Project Catalog</Button>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 4. OFFSHORE & OUTSOURCING */}
            <section className="py-24 px-6 bg-slate-900 text-white">
                <div className="container max-w-6xl mx-auto text-center">
                    <Globe className="w-12 h-12 text-blue-400 mx-auto mb-6" />
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 font-display">Offshore & Outsourcing Solutions</h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto">
                        Tap into global expertise while reducing costs and operational complexity. We handle international compliance for you.
                    </p>
                    <div className="grid md:grid-cols-3 gap-8 text-left">
                        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
                            <h4 className="font-bold text-lg mb-2">Cost Efficiency</h4>
                            <p className="text-slate-400 text-sm">Reduce costs significantly without compromising on work quality.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
                            <h4 className="font-bold text-lg mb-2">24/7 Operations</h4>
                            <p className="text-slate-400 text-sm">Extend operational hours with multi-timezone support teams.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
                            <h4 className="font-bold text-lg mb-2">Global Talent</h4>
                            <p className="text-slate-400 text-sm">Leverage specialized skills from diverse global talent pools.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. HOW IT WORKS (BENEFITS) */}
            <section className="py-24 px-6 bg-slate-50 border-y border-slate-200">
                <div className="container max-w-5xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center font-display text-primary">How Taskive Works for You</h2>
                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { step: "Find", desc: "Browse or get matched with vetted professionals." },
                            { step: "Hire", desc: "Choose permanent, trial, or project engagements." },
                            { step: "Manage", desc: "Collaborate with tracking and reporting tools." },
                            { step: "Pay", desc: "Secure, transparent payments managed by Taskive." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 text-center relative shadow-sm">
                                <div className="text-5xl font-bold text-slate-100 absolute top-2 right-4 z-0">{i + 1}</div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-primary mb-2 border-b-2 border-blue-500 inline-block pb-1">{item.step}</h3>
                                    <p className="text-slate-600 text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. FAQ */}
            <section className="py-24 px-6 bg-white">
                <div className="container max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 text-center font-display text-primary">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        {[
                            { q: "What makes Taskive different?", a: "Unlike generic freelance sites, Taskive offers structured engagement models with the ability to transition talent into long-term roles and integrated operational support." },
                            { q: "Can I try a professional before hiring full-time?", a: "Yes. Our Trial-to-Hire model allows you to evaluate a professional before making a full-time commitment." },
                            { q: "Does Taskive handle compliance and payroll?", a: "Yes — the platform manages compliance, payroll, and contractor administration so you can focus on outcomes." },
                            { q: "Do you support short-term engagements?", a: "Yes. One-Time Tasks & Projects are designed for ad-hoc support and urgent business needs." },
                            { q: "How soon can I get started?", a: "Clients are typically matched with qualified professionals within a few business days." },
                            { q: "What if I already have an in-house team?", a: "Taskive can complement your team by providing specialized skills or additional capacity as needed." },
                        ].map((faq, i) => (
                            <div key={i} className="border-b border-slate-100 pb-6">
                                <h3 className="font-bold text-lg text-primary mb-2">{faq.q}</h3>
                                <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>



        </div>
    );
};

export default ServiceModels;
