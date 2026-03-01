
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Target, Clock, Users, Shield, Zap, Layout, Terminal } from "lucide-react";

const ProjectEngagement = () => {
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
                Project Engagement
              </div>
              <h1 className="text-4xl md:text-7xl font-semibold text-slate-900 mb-8 tracking-tight leading-[1.1]">
                Specialized Execution Without <br className="hidden md:block" /> Long-Term Commitment.
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-12 font-medium leading-relaxed max-w-2xl">
                Deploy vetted operators for defined initiatives — milestone-based and outcome-driven. Infrastructure-grade execution for high-impact projects.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <Button 
                    size="lg" 
                    variant="outline"
                    className="h-14 px-10 text-base rounded-xl border-[1.5px] border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all duration-300 shadow-none" 
                    asChild
                >
                  <Link to="/auth/signup?portal=client">
                    Request Project Scope <ArrowRight className="ml-2 h-4 w-4" />
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

            {/* Right Visual (Enterprise Workflow) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white border border-slate-200 rounded-[24px] p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100/50 transition-colors duration-700"></div>
                
                <div className="relative space-y-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10">Project Lifecycle Tracking</div>
                  
                  {[
                    { label: "Project Scope", status: "defined", icon: Target },
                    { label: "Talent Match", status: "assembled", icon: Users },
                    { label: "Delivery Phase", status: "milestones", icon: Zap },
                    { label: "Closeout", status: "transition", icon: CheckCircle2 }
                  ].map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-6 pb-12 last:pb-0">
                      {/* Vertical Line */}
                      {idx !== 3 && (
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
                        className={`w-4 h-4 rounded-full border-2 bg-white shrink-0 mt-1.5 z-10 transition-colors duration-300 ${idx === 2 ? 'border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.2)]' : 'border-slate-200'}`}
                      />
                      
                      {/* Label and Status */}
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-base font-bold tracking-tight transition-colors duration-300 ${idx === 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                          <step.icon className={`h-4 w-4 transition-colors duration-300 ${idx <= 2 ? 'text-blue-500/50' : 'text-slate-200'}`} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors duration-300 ${idx === 2 ? 'text-blue-600' : 'text-slate-400'}`}>
                          {step.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Background accent */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-50/30 rounded-full blur-[100px]"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 1 — ENGAGEMENT STRUCTURE */}
      <section className="py-24 md:py-32 px-6 bg-slate-50 border-t border-slate-100">
        <div className="container max-w-[1200px] mx-auto">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Milestone-Based Operational Delivery</h2>
            <p className="text-slate-500 font-medium max-w-2xl">
              We replace open-ended consulting with structured project delivery focused on clear operational outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: Target, 
                title: "Defined Scope", 
                desc: "Every project starts with an airtight definition of deliverables and success metrics." 
              },
              { 
                icon: Clock, 
                title: "Structured Timeline", 
                desc: "Rigorous milestone tracking ensures projects remain on course and within budget." 
              },
              { 
                icon: Users, 
                title: "Dedicated Team", 
                desc: "Deploy a single specialist or a managed pod of operators aligned to your stack." 
              },
              { 
                icon: Shield, 
                title: "Centralized Coordination", 
                desc: "A Taskive Ops Lead manages the reporting and delivery layer for you." 
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white border border-slate-100 rounded-2xl shadow-sm"
              >
                <item.icon className="h-6 w-6 text-blue-600 mb-6" />
                <h3 className="text-lg font-bold text-slate-900 mb-3 tracking-tight">{item.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 — PRICING MODEL */}
      <section className="py-24 md:py-32 px-6 border-t border-slate-100">
        <div className="container max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-8 tracking-tight">Transparent Project Pricing</h2>
              <div className="space-y-8">
                {[
                  { t: "Milestone-based", d: "Payments triggered by validated project phases." },
                  { t: "Hourly or Fixed-scope", d: "Pricing models that align with project complexity." },
                  { t: "30% platform margin", d: "Covers vetting, sourcing, and operational oversight." },
                  { t: "Clear deliverables", d: "Zero ambiguity on what you are paying for." }
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
            
            <div className="bg-[#0B0F19] p-12 rounded-[24px] text-white">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-12">Cost Allocation</h4>
              <div className="space-y-10">
                <div className="flex justify-between items-baseline border-b border-white/10 pb-6">
                  <span className="text-sm text-slate-400">Execution Layer</span>
                  <span className="text-2xl font-bold">70%</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-white/10 pb-6">
                  <span className="text-sm text-slate-400">Platform & Oversight</span>
                  <span className="text-2xl font-bold">30%</span>
                </div>
                <div className="pt-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Result</div>
                  <div className="text-xl font-medium text-blue-400">Fixed-Cost Predictability</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — IDEAL PROJECT TYPES */}
      <section className="py-24 md:py-32 px-6 bg-slate-900 text-white">
        <div className="container max-w-[1200px] mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-3xl md:text-5xl font-semibold mb-6 tracking-tight">Ideal Project Types</h2>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto">
              Our project model is optimized for high-impact technical and operational initiatives requiring specialized depth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Layout, t: "Systems Implementation", d: "CRM, ERP, and operational tool deployments." },
              { icon: Zap, t: "Growth Infrastructure", d: "Go-to-market tooling and pipeline automation." },
              { icon: Terminal, t: "Automation & Tooling", d: "Custom internal tools and workflow integrations." },
              { icon: Users, t: "Interim Leadership", d: "Critical coverage during executive searches." }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-xl">
                <item.icon className="h-6 w-6 text-blue-500 mb-6" />
                <h4 className="text-lg font-bold mb-3">{item.t}</h4>
                <p className="text-sm text-slate-400 leading-relaxed font-sm">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHY NOT TRADITIONAL CONSULTING? */}
      <section className="py-24 md:py-32 px-6 border-t border-slate-100 bg-white">
        <div className="container max-w-[1200px] mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Not Just Consulting. Execution.</h2>
            <p className="text-slate-500 font-medium">
              We bridge the gap between expensive strategic consulting and unreliable freelance marketplaces.
            </p>
          </div>

          <div className="max-w-4xl mx-auto overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-widest">Dimension</th>
                  <th className="px-8 py-6 text-sm font-bold text-slate-900 uppercase tracking-widest">Traditional Model</th>
                  <th className="px-8 py-6 text-sm font-bold text-blue-600 uppercase tracking-widest bg-blue-50/30">Taskive Project</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { dim: "Overhead", trad: "High Partner Fees", task: "Lower Overhead" },
                  { dim: "Focus", trad: "Slide Decks & Strategy", task: "Execution-Focused" },
                  { dim: "Engagement", trad: "External Advisors", task: "Embedded Operators" },
                  { dim: "Pricing", trad: "Opaque Retainers", task: "Fixed Milestone Costs" }
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

      {/* FINAL CTA */}
      <section className="py-32 px-6 bg-slate-50 text-center">
        <div className="container max-w-4xl mx-auto">
          <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-semibold text-slate-900 mb-12 tracking-tight">Execute High-Impact <br /> Initiatives with Precision.</h2>
            <Button 
                size="lg" 
                variant="outline"
                className="h-16 px-12 text-lg rounded-xl border-[1.5px] border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold transition-all duration-300 shadow-none" 
                asChild
            >
              <Link to="/auth/signup?portal=client">
                Start a Project <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ProjectEngagement;
