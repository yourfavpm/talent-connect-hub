
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle, ArrowRight, Minus } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const Pricing = () => {
    return (
        <div className="bg-white min-h-screen text-slate-900 selection:bg-slate-900 selection:text-white pb-0">

            {/* 1. HEADER / STATEMENT */}
            <section className="pt-40 pb-20 px-6 border-b border-slate-200 bg-slate-50/50">
                <div className="container max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-bold mb-8 font-display tracking-tight text-slate-900 leading-[1.1]">
                        Simple terms. Zero ambiguity.
                    </h1>
                    <p className="text-xl text-slate-600 font-sans leading-relaxed max-w-2xl mx-auto">
                        We believe in radical transparency. No hidden retainers, no opaque margins. Just clear, value-based pricing aligned with your success.
                    </p>
                </div>
            </section>

            {/* 2. PRICING GRID (THE "MENU") */}
            <section className="py-24 px-6 bg-slate-50 border-b border-slate-200">
                <div className="container max-w-5xl mx-auto">

                    {/* SECTION A: PERMANENT PLACEMENT */}
                    <div className="mb-20">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-slate-900 pb-4">
                            <h2 className="text-3xl font-bold font-display">Permanent Placement</h2>
                            <span className="text-slate-500 font-sans">For full-time employee hires</span>
                        </div>

                        <div className="grid md:grid-cols-12 gap-8 items-start">
                            <div className="md:col-span-8">
                                <div className="bg-white p-8 md:p-12 border border-slate-200 rounded-lg shadow-sm">
                                    <div className="flex items-baseline gap-4 mb-2">
                                        <span className="text-6xl md:text-7xl font-bold text-slate-900 tracking-tighter">15%</span>
                                        <span className="text-xl text-slate-500">of first year salary</span>
                                    </div>
                                    <p className="text-slate-600 mb-8 max-w-lg">
                                        A one-time success fee payable only when you hire. Includes a 90-day replacement guarantee.
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                            <div className="w-1 h-1 bg-slate-900 rounded-full"></div> Contingent (No hire, no fee)
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                            <div className="w-1 h-1 bg-slate-900 rounded-full"></div> 90-Day Free Replacement
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                            <div className="w-1 h-1 bg-slate-900 rounded-full"></div> Salary Negotiation Support
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                            <div className="w-1 h-1 bg-slate-900 rounded-full"></div> Comprehensive Vetting
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-4 bg-white p-8 border border-slate-200 rounded-lg h-full flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-lg mb-4">Volume Hiring</h3>
                                    <p className="text-slate-600 text-sm mb-6">
                                        Planning to hire 3+ roles? We offer tiered discounts for volume commitments.
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white" asChild>
                                    <Link to="/book-consultation">Contact Sales</Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION B: FLEXIBLE STAFFING */}
                    <div>
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-slate-900 pb-4">
                            <h2 className="text-3xl font-bold font-display">Flexible Engagement</h2>
                            <span className="text-slate-500 font-sans">Contractors & Fractional Talent</span>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                            {/* Row 1 */}
                            <div className="grid md:grid-cols-12 gap-8 p-8 md:p-10 items-center">
                                <div className="md:col-span-4">
                                    <h3 className="text-xl font-bold mb-1">Trial-to-Hire</h3>
                                    <p className="text-sm text-slate-500">Evaluate fit before committing.</p>
                                </div>
                                <div className="md:col-span-5">
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        Standard hourly/monthly rate plus a reduced conversion fee if you decide to hire full-time after 90 days.
                                    </p>
                                </div>
                                <div className="md:col-span-3 md:text-right">
                                    <span className="block font-bold text-lg">Custom Rate</span>
                                    <span className="text-xs text-slate-400">based on role level</span>
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="grid md:grid-cols-12 gap-8 p-8 md:p-10 items-center">
                                <div className="md:col-span-4">
                                    <h3 className="text-xl font-bold mb-1">Project Based</h3>
                                    <p className="text-sm text-slate-500">Defined scope and deliverables.</p>
                                </div>
                                <div className="md:col-span-5">
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        Fixed price for specific deliverables (e.g., Audit, Setup, Migration) or milestone-based billing.
                                    </p>
                                </div>
                                <div className="md:col-span-3 md:text-right">
                                    <span className="block font-bold text-lg">Fixed Fee</span>
                                    <span className="text-xs text-slate-400">quoted upfront</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. FAQ */}
            <section className="py-24 px-6 bg-white">
                <div className="container max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 font-display text-slate-900">Common Questions</h2>
                    <Accordion type="single" collapsible className="w-full space-y-0 border-t border-slate-200">
                        {[
                            { q: "Do you require exclusivity?", a: "No. We believe our quality speaks for itself. You are free to work with other agencies, though most clients find it faster to centralize with us." },
                            { q: "What happens if a hire doesn't work out?", a: "For Full-Time placements, we offer a 90-day free replacement guarantee. If the candidate leaves or is terminated for cause, we replace them at no cost." },
                            { q: "Are there any setup fees?", a: "No. Onboarding, role scoping, and candidate matching are free. You only pay when you hire or when a contractor begins work." },
                            { q: "How do you handle international payments?", a: "For contractors (offshore), we handle all international payroll and compliance. You receive a single domestic invoice from Taskive." }
                        ].map((faq, i) => (
                            <AccordionItem key={i} value={`item-${i}`} className="border-b border-slate-200">
                                <AccordionTrigger className="text-left font-bold text-lg py-6 hover:text-blue-950 hover:no-underline">{faq.q}</AccordionTrigger>
                                <AccordionContent className="text-slate-600 text-base leading-relaxed pb-6">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            {/* 4. FINAL CTA */}
            <section className="py-32 px-6 bg-slate-900 text-white text-center">
                <div className="container max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 font-display">Ready to engage?</h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-xl mx-auto">
                        Book a consultation to discuss your hiring plan and get a custom proposal.
                    </p>
                    <Button size="lg" className="h-16 px-12 text-lg bg-white text-slate-900 hover:bg-slate-100 rounded-full font-bold" asChild>
                        <Link to="/book-consultation">Start Conversation</Link>
                    </Button>
                </div>
            </section>

        </div>
    );
};

export default Pricing;
