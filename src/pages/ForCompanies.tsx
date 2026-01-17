
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Clock, Globe, Shield, Zap, Search, UserCheck, Layout, CreditCard, Award, TrendingUp, Users, ArrowRight, Star } from "lucide-react";

const ForCompanies = () => {
    return (
        <div className="bg-background min-h-screen text-foreground selection:bg-primary selection:text-white pb-0">

            {/* 1. PAGE HERO (UNIQUE) */}
            <section className="relative pt-32 pb-20 px-6 border-b border-slate-200 bg-white overflow-hidden">
                <div className="container max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <div className="relative z-10 animate-slide-up">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display tracking-tight text-primary leading-[1.1]">
                            Hire Product & Operations Talent — <span className="text-blue-950">Without the Headache.</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 max-w-lg font-serif leading-relaxed">
                            Connect with vetted professionals matched to your needs and focus on growing your business while we handle talent engagement, compliance, and workflow.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg" asChild>
                                <Link to="/book-consultation">Book a Consultation</Link>
                            </Button>
                            <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-slate-300 text-slate-700 hover:text-primary rounded-full" asChild>
                                <Link to="/service-models">View Service Models</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Unique Hero Visual */}
                    <div className="relative h-[550px] hidden lg:block animate-fade-in">
                        <div className="absolute right-0 top-6 w-[95%] h-full bg-slate-50 rounded-tl-[3rem] rounded-bl-[2rem] overflow-hidden border border-slate-200 shadow-2xl">
                            <div className="p-8">
                                {/* Simplified UI Mockup */}
                                <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600"><Users className="h-5 w-5" /></div>
                                        <div>
                                            <div className="font-bold text-primary">Senior Product Manager</div>
                                            <div className="text-sm text-slate-500">Shortlist Ready • 3 Candidates</div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">ACTION REQUIRED</div>
                                </div>
                                <div className="space-y-4">
                                    {/* Candidate 1 */}
                                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors group cursor-pointer">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100">
                                            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Alex" />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="font-bold text-slate-900 group-hover:text-blue-950 transition-colors">Alex M.</div>
                                            <div className="text-sm text-slate-500">Ex-Spotify • 7 Yrs Exp</div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-blue-950 font-medium">View Profile</Button>
                                    </div>

                                    {/* Candidate 2 */}
                                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors group cursor-pointer">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100">
                                            <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Sarah" />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="font-bold text-slate-900 group-hover:text-blue-950 transition-colors">Sarah K.</div>
                                            <div className="text-sm text-slate-500">Ex-Uber • Product Ops</div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-blue-950 font-medium">View Profile</Button>
                                    </div>

                                    {/* Candidate 3 */}
                                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors group cursor-pointer">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100">
                                            <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="David" />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="font-bold text-slate-900 group-hover:text-blue-950 transition-colors">David L.</div>
                                            <div className="text-sm text-slate-500">Ex-Stripe • Growth Lead</div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-blue-950 font-medium">View Profile</Button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. BUSINESS PROBLEM (IMPACT STATEMENT) */}
            <section className="py-24 px-6 bg-slate-50 border-b border-slate-200">
                <div className="container max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 font-display text-primary">The Challenge of Hiring Skilled Professionals</h2>
                        <p className="text-lg text-slate-600 font-serif leading-relaxed mb-8">
                            Traditional hiring is slow, fragmented, and unpredictable. Taskive offers an integrated solution that matches talent quickly and manages the end-to-end engagement.
                        </p>
                    </div>
                    <div className="space-y-6">
                        {[
                            { icon: Clock, text: "Time lost on screening endless applications" },
                            { icon: TrendingUp, text: "High recruitment costs with low guarantee" },
                            { icon: Shield, text: "Compliance risk with international contractors" },
                            { icon: Layout, text: "Disjointed payroll and tracking systems" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <item.icon className="h-6 w-6 text-red-400 flex-shrink-0" />
                                <span className="text-slate-700 font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. HOW TASKIVE HELPS (CLEAR VALUE) */}
            <section className="py-24 px-6 bg-white">
                <div className="container max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display text-primary">What Taskive Does for Your Business</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "Match Fast", desc: "Taskive pairs you with professionals based on need and skill fit.", icon: Zap },
                            { title: "Managed Engagements", desc: "Contracts, compliance, and coordination handled centrally.", icon: Check },
                            { title: "Transparent Payments", desc: "Clear billing and payment terms that scale with your growth.", icon: CreditCard },
                            { title: "Ongoing Support", desc: "Account support to keep placements aligned with goals.", icon: Users }
                        ].map((card, i) => (
                            <div key={i} className="group p-8 bg-white border border-slate-200 rounded-3xl hover:shadow-xl hover:border-slate-300 transition-all duration-300">
                                <div className="w-14 h-14 bg-slate-50 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
                                    <card.icon className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-primary">{card.title}</h3>
                                <p className="text-slate-600 leading-relaxed text-sm">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. SERVICE MODELS (RE-DESIGNED) */}
            <section className="py-24 px-6 bg-slate-900 text-white">
                <div className="container max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display">Engagement Options</h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">Choose the model that aligns with your team’s tempo and budget.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-0 border border-slate-200 bg-white rounded-none">
                        {/* Simple Text-Based Models */}
                        {[
                            {
                                title: "Full-Time Hire",
                                desc: "Permanent placement with equity & benefits.",
                                details: ["Verified Employers", "Salary Negotiation Support", "Long-term Growth"]
                            },
                            {
                                title: "Trial-to-Hire",
                                desc: "3-month contract to prove fit before signing.",
                                details: ["Paid Trial Period", "Cultural Fit Check", "Seamless Conversion"]
                            },
                            {
                                title: "One-Time Project",
                                desc: "High-value consulting for defined scopes.",
                                details: ["Clear Milestones", "Guaranteed Payment", "Flexible Schedule"]
                            }
                        ].map((model, i) => (
                            <div key={i} className="p-12 border-b lg:border-b-0 lg:border-r last:border-0 border-slate-200 hover:bg-slate-50 transition-colors">
                                <h3 className="text-2xl font-bold mb-4 font-display text-slate-900">{model.title}</h3>
                                <p className="text-slate-700 mb-8 leading-relaxed h-16">{model.desc}</p>
                                <ul className="space-y-4">
                                    {model.details.map((d, j) => (
                                        <li key={j} className="flex items-center gap-3 text-sm font-bold text-primary">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div> {d}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. PROCESS (STEP-BY-STEP) */}
            <section className="py-24 px-6 bg-white">
                <div className="container max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display text-primary">How It Works</h2>
                    </div>

                    <div className="relative">
                        <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-slate-100"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            {[
                                { title: "Define Your Need", desc: "Share project or role details with our team.", icon: Search },
                                { title: "Get Matched", desc: "Receive curated talent recommendations.", icon: UserCheck },
                                { title: "Interview & Select", desc: "Choose with confidence from pre-vetted profiles.", icon: Check },
                                { title: "Engage & Manage", desc: "Work, track progress, and collaborate seamlessly.", icon: Layout },
                                { title: "Pay & Optimize", desc: "Simplified billing aligned with your chosen model.", icon: CreditCard }
                            ].map((step, i) => (
                                <div key={i} className="relative z-10 bg-white pt-4 text-center lg:text-left">
                                    <div className="w-16 h-16 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center mb-6 mx-auto lg:mx-0 text-primary font-bold shadow-sm">
                                        <step.icon className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-primary">{i + 1}. {step.title}</h3>
                                    <p className="text-slate-600 text-sm">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. FEATURE HIGHLIGHTS (RE-DESIGNED) */}
            <section className="py-24 px-6 bg-slate-50 border-y border-slate-200">
                <div className="container max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display text-primary">Built for Operational Simplicity</h2>
                        <p className="text-slate-600 font-serif">Everything you need to manage your distributed team, in one place.</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { title: "Invoice & Payment", desc: "Consolidated billing view.", icon: CreditCard },
                            { title: "Contract Management", desc: "Secure digital signatures.", icon: Shield },
                            { title: "Time Tracking", desc: "Hourly & project logs.", icon: Clock },
                            { title: "Dedicated Support", desc: "24/7 Ops assistance.", icon: Users }
                        ].map((feat, i) => (
                            <div key={i} className="text-center group p-6 rounded-xl hover:bg-white hover:shadow-md transition-all">
                                <div className="w-20 h-20 mx-auto bg-white border border-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:border-blue-200 transition-all">
                                    <feat.icon className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-primary">{feat.title}</h3>
                                <p className="text-slate-600 text-sm">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. SOCIAL PROOF */}
            <section className="py-24 px-6 bg-white">
                <div className="container max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 text-center text-primary font-display">What Our Clients Say</h2>
                    <div className="bg-slate-900 text-white p-12 rounded-3xl relative overflow-hidden">
                        <Star className="text-yellow-400 h-8 w-8 mb-6" />
                        <blockquote className="text-2xl md:text-3xl font-serif leading-relaxed mb-8 relative z-10">
                            “We hired 4 talents through Taskive and they remain exceptional. The team has worked closely with us to ensure ongoing effectiveness.”
                        </blockquote>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                            <div>
                                <div className="font-bold">Ola Oluwadara</div>
                                <div className="text-slate-400 text-sm">CEO, Kemuko Technologies</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. COMPARISON MATRIX */}
            <section className="py-24 px-6 bg-slate-50 border-t border-slate-200">
                <div className="container max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display text-primary">How Taskive Stands Apart</h2>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200">
                            <div className="p-6 text-center font-bold text-slate-500 uppercase tracking-widest text-sm">Traditional Hiring</div>
                            <div className="p-6 text-center font-bold text-slate-900 bg-slate-100 uppercase tracking-widest text-sm">Taskive Approach</div>
                        </div>
                        {[
                            { label: "Screening", trad: "DIY Screening (Hours)", task: "Pre-Vetted Matches (Minutes)" },
                            { label: "Tools", trad: "Multiple Fragmented Tools", task: "Unified Engagement Platform" },
                            { label: "Billing", trad: "Manual Invoicing & Chasing", task: "Consolidated, Clear Billing" },
                            { label: "Compliance", trad: "Headache & Legal Risk", task: "Centralized & EOR Handled" },
                        ].map((row, i) => (
                            <div key={i} className="grid grid-cols-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                <div className="p-6 text-center text-slate-600 border-r border-slate-100">{row.trad}</div>
                                <div className="p-6 text-center font-bold text-primary">{row.task}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 9. CTA BANNER (RE-DESIGNED) */}
            <section className="py-32 px-6 bg-slate-900 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80')] opacity-10 mix-blend-overlay bg-cover bg-center"></div>
                <div className="container max-w-3xl mx-auto relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold mb-6 font-display">Stop hiring the hard way.</h2>
                    <p className="text-xl text-slate-300 mb-10 max-w-xl mx-auto">
                        Join forward-thinking companies building faster with Taskive.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button size="lg" className="h-16 px-12 text-lg rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-xl" asChild>
                            <Link to="/book-consultation">Start Building Now</Link>
                        </Button>
                    </div>
                </div>
            </section>

        </div>
    );
};

// Needs Icon import import { Target } from "lucide-react";
import { Target } from "lucide-react";

export default ForCompanies;
