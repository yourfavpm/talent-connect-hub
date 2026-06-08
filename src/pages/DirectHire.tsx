
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Zone, getZoneUrl } from "@/utils/subdomain";

const DirectHire = () => {
  return (
    <div className="bg-white font-inter">
      {/* HERO SECTION */}
      <section className="pt-24 md:pt-32 md:pb-24 md:pb-32 px-3 md:px-6 overflow-hidden">
        <div className="container max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-start text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-8 shadow-sm">
                Permanent Engagement
              </div>
              <h1 className="text-4xl md:text-7xl font-semibold text-slate-900 mb-8 tracking-tight leading-[1.1]">
                Build Long-Term Operational <br className="hidden md:block" /> Leadership with Confidence.
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-12 font-medium leading-relaxed max-w-2xl">
                OpslyHR connects you with rigorously vetted product and operations leaders for permanent internal placement — backed by structured screening and replacement guarantees.
              </p>
                           <div className="flex flex-col sm:flex-row items-start gap-8">
                <Link to="/book-consultation" className="w-full sm:w-auto">
                  <Button 
                      size="lg" 
                      className="h-16 px-12 text-lg rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold transition-all duration-300 shadow-xl shadow-blue-100 w-full" 
                  >
                    Discuss Direct Placement <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 w-full flex justify-end">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-md"
            >
              <div className="bg-white border border-slate-200 rounded-[24px] p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100/50 transition-colors duration-700"></div>
                
                <div className="relative space-y-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10">Managed Hiring Pipeline</div>
                  
                  {[
                    { label: "Role Definition", status: "aligned" },
                    { label: "Vetting", status: "rigorous" },
                    { label: "Interview", status: "structured" },
                    { label: "Offer", status: "secured" },
                    { label: "Hire", status: "transition" }
                  ].map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-6 pb-10 last:pb-0">
                      {/* Vertical Line */}
                      {idx !== 4 && (
                        <div className="absolute left-[7px] top-[24px] w-[1px] h-[calc(100%-14px)] bg-slate-100">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: "100%" }}
                            transition={{ duration: 1, delay: 0.5 + idx * 0.2 }}
                            className="w-full bg-blue-600/30"
                          />
                        </div>
                      )}
                      
                      {/* Step Indicator */}
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.4 + idx * 0.2 }}
                        className={`w-4 h-4 rounded-full border-2 bg-white shrink-0 mt-1.5 z-10 transition-colors duration-300 ${idx === 0 ? 'border-blue-600' : 'border-slate-200'}`}
                      />
                      
                      {/* Label and Status */}
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold tracking-tight transition-colors duration-300 ${idx === 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                          {step.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative background element */}
              <div className="absolute -z-10 -bottom-6 -left-6 w-24 h-24 bg-slate-50 rounded-2xl rotate-12"></div>
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
        <div className="container max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center -mx-4">
            <div className="w-full lg:w-1/2 px-4 mb-12 lg:mb-0">
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
            
            <div className="w-full lg:w-1/2 px-4">
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
        </div>
      </section>

      {/* SECTION 3 & 4 — USE CASES & RISK */}
      <section className="py-24 md:py-32 px-6 bg-[#0B0F19] text-white">
        <div className="container max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-24">
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
                  { t: "Manager oversight", d: "OpslyHR lead manages placement transition." },
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
            <Link to="/book-consultation">
              <Button 
                  size="lg" 
                  className="h-16 px-12 text-lg rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold transition-all duration-300 shadow-xl shadow-blue-100" 
              >
                Discuss Direct Placement <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default DirectHire;
