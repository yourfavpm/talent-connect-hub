
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const DirectHire = () => {
  return (
    <div className="bg-white font-inter">
      {/* HERO SECTION */}
      <section className="pt-32 md:pt-48 pb-24 md:pb-32 px-6">
        <div className="container max-w-[1200px] mx-auto">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-8 shadow-sm">
                Permanent Engagement
              </div>
              <h1 className="text-4xl md:text-7xl font-semibold text-slate-900 mb-8 tracking-tight leading-[1.1]">
                Build Long-Term Operational <br className="hidden md:block" /> Leadership with Confidence.
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-12 font-medium leading-relaxed max-w-2xl">
                Taskive connects you with rigorously vetted product and operations leaders for permanent internal placement — backed by structured screening and replacement guarantees.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <Button 
                    size="lg" 
                    variant="outline"
                    className="h-14 px-10 text-base rounded-xl border-[1.5px] border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all duration-300 shadow-none" 
                    asChild
                >
                  <Link to="/auth/signup?portal=client">
                    Discuss Direct Placement <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                
                <Link 
                    to="/service-models"
                    className="text-slate-900 font-bold hover:text-blue-600 transition-colors"
                >
                    Compare Engagement Models →
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 1 — HOW DIRECT HIRE WORKS */}
      <section className="py-24 md:py-32 px-6 bg-slate-50/50 border-t border-slate-100">
        <div className="container max-w-[1200px] mx-auto">
          <div className="max-w-3xl mb-20">
            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">A Structured Path to Permanent Placement</h2>
          </div>

          <div className="space-y-0">
            {[
              { 
                id: "01", 
                title: "Define Role Scope", 
                desc: "Align on impact expectations and operational outcomes." 
              },
              { 
                id: "02", 
                title: "Curated Shortlist", 
                desc: "Receive 2–3 vetted candidates within 48 hours." 
              },
              { 
                id: "03", 
                title: "Structured Interviews", 
                desc: "Evaluate execution depth and leadership maturity." 
              },
              { 
                id: "04", 
                title: "Offer & Transfer", 
                desc: "Permanent employment transfer under agreed terms." 
              }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="grid md:grid-cols-12 py-12 md:py-16 border-b border-slate-100 last:border-0 items-baseline"
              >
                <div className="md:col-span-1 text-sm font-bold text-blue-600 uppercase tracking-widest mb-4 md:mb-0">
                  {step.id}
                </div>
                <div className="md:col-span-4">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{step.title}</h3>
                </div>
                <div className="md:col-span-7">
                  <p className="text-slate-500 font-medium leading-relaxed max-w-xl">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 — PRICING STRUCTURE */}
      <section className="py-24 md:py-32 px-6 border-t border-slate-100">
        <div className="container max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-8 tracking-tight">Transparent Placement Fee</h2>
              <div className="space-y-6 mb-12">
                {[
                  "One-time fee",
                  "Percentage of annual base compensation",
                  "4-month replacement guarantee"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <span className="text-slate-600 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="pt-12 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Typical Range</div>
                <div className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tighter">15%–20% <span className="text-xl text-slate-400 font-medium ml-2">of annual salary</span></div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-12 rounded-[16px] border border-slate-100">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Financial Clarity</h4>
              <p className="text-slate-600 font-medium leading-relaxed mb-8">
                Our pricing model is designed for simplicity and long-term alignment. We only succeed when you find the right leader for your organization.
              </p>
              <div className="p-6 bg-white border border-slate-100 rounded-xl space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Placement Fee</span>
                  <span className="font-bold text-slate-900">Standard Contingent</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Guarantee Period</span>
                  <span className="font-bold text-slate-900">120 Days</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Search Fee</span>
                  <span className="font-bold text-blue-600">$0 Upfront</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 & 4 — USE CASES & RISK */}
      <section className="py-24 md:py-32 px-6 bg-[#0B0F19] text-white">
        <div className="container max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-24">
            {/* USE CASES */}
            <div className="space-y-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-semibold mb-8 tracking-tight">When Direct Hire Is the <br />Right Choice</h2>
                <div className="space-y-6">
                  {[
                    "Building core leadership",
                    "Scaling internal product teams",
                    "Replacing key operational roles",
                    "Executive-level hiring"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-lg text-slate-300 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RISK MITIGATION */}
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold mb-8 tracking-tight">Structured Risk Protection</h2>
              <div className="space-y-8">
                {[
                  { t: "Replacement guarantee", d: "Security for your investment." },
                  { t: "Skill-tier vetting", d: "Ensuring technical and cultural alignment." },
                  { t: "Manager oversight", d: "Taskive lead manages placement transition." },
                  { t: "Evaluation criteria", d: "Documented scorecard for every candidate." }
                ].map((item, i) => (
                  <div key={i} className="pl-6 border-l border-white/10">
                    <h4 className="text-lg font-bold mb-1">{item.t}</h4>
                    <p className="text-sm text-slate-500 font-medium">{item.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6 bg-white text-center">
        <div className="container max-w-4xl mx-auto">
          <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-semibold text-slate-900 mb-12 tracking-tight">Build Your Core Team <br /> Structurally.</h2>
            <Button 
                size="lg" 
                variant="outline"
                className="h-16 px-12 text-lg rounded-xl border-[1.5px] border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all duration-300 shadow-none" 
                asChild
            >
              <Link to="/auth/signup?portal=client">
                Request Direct Placement <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default DirectHire;
