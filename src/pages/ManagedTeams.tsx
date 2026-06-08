import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Target, Clock, Users, Shield, Zap, Layout, Terminal } from "lucide-react";
import { Zone, getZoneUrl } from "@/utils/subdomain";
import SEO from "@/components/SEO";

const ManagedTeams = () => {
    return (
        <div className="bg-white font-inter">
            <SEO 
                title="Managed Teams | Fully Managed Operational Pods"
                description="Outsource entire operational functions with dedicated, fully-managed teams. We handle HR, payroll, and performance management so you can focus on growth."
                keywords="Managed Operations Teams, Outsource Support Team, African Data Entry Team, Fully Managed Operations"
            />
      <section className="pt-32 md:pt-48 pb-24 md:pb-32 px-6 overflow-hidden">
        <div className="container max-w-[1200px] mx-auto relative z-20 flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
            <div className="flex-1">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-start text-left"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-8 shadow-sm">
                  Managed Operations Teams
                </div>
                <h1 className="text-4xl md:text-7xl font-semibold text-slate-900 mb-8 tracking-tight leading-[1.1]">
                  Scale Functions Without <br className="hidden md:block" /> Scaling Management.
                </h1>
                <p className="text-lg md:text-xl text-slate-600 mb-12 font-medium leading-relaxed max-w-2xl">
                  Outsource entire operational functions. We build, manage, and scale a dedicated team for you — complete with team leadership, HR, and performance tracking.
                </p>
                
                <div className="flex flex-col sm:flex-row items-start justify-start gap-8">
                    <Link to="/book-consultation" className="w-full sm:w-auto">
                      <Button 
                          size="lg" 
                          className="h-16 px-12 text-lg rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold transition-all duration-300 shadow-xl shadow-blue-100 w-full" 
                      >
                        Discuss Managed Teams <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                </div>
              </motion.div>
            </div>
  
            {/* Right Visual (Enterprise Workflow) */}
            <div className="flex-1 w-full relative hidden lg:block">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="bg-white border border-slate-200 rounded-[24px] p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100/50 transition-colors duration-700"></div>
                  
                  <div className="relative space-y-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10">Team Deployment Lifecycle</div>
                    
                    {[
                      { label: "Functional Need", status: "defined", icon: Target },
                      { label: "Team Assembly", status: "recruited", icon: Users },
                      { label: "Managed Execution", status: "ongoing", icon: Zap },
                      { label: "Scale & Optimize", status: "continuous", icon: CheckCircle2 }
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
            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Fully Managed Functional Delivery</h2>
            <p className="text-slate-500 font-medium max-w-2xl">
              We replace management overhead with a fully integrated, dedicated operational team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: Target, 
                title: "Define the Function", 
                desc: "Client outlines the functional need (e.g., 'We need 24/7 customer support')." 
              },
              { 
                icon: Users, 
                title: "Dedicated Team & Lead", 
                desc: "OpslyHR recruits a dedicated team and assigns an operational Team Lead." 
              },
              { 
                icon: Shield, 
                title: "Total HR Management", 
                desc: "OpslyHR handles all HR, payroll, performance management, and replacements." 
              },
              { 
                icon: Clock, 
                title: "Flat Fee Scaling", 
                desc: "Client pays a predictable, flat monthly fee per team member as you scale." 
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
        <div className="container max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center -mx-4">
            <div className="w-full lg:w-1/2 px-4 mb-12 lg:mb-0">
              <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-8 tracking-tight">Managed Team Pricing</h2>
              <div className="space-y-8">
                {[
                  { t: "Flat monthly fee", d: "Starting at $1,200/month per team member." },
                  { t: "Team Lead included", d: "Operational oversight is built into the structure." },
                  { t: "All HR handled", d: "Zero payroll, benefits, or compliance headaches." },
                  { t: "Predictable scaling", d: "Costs scale linearly with headcount, no surprises." }
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
            
            <div className="w-full lg:w-1/2 px-4">
              <div className="bg-[#0B0F19] p-12 rounded-[24px] text-white w-full">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-12">Pricing Model</h4>
              <div className="space-y-10">
                <div className="flex justify-between items-baseline border-b border-white/10 pb-6">
                  <span className="text-sm text-slate-400">Monthly Retainer</span>
                  <span className="text-2xl font-bold">$1,200<span className="text-sm text-slate-500 font-medium">/mo starting</span></span>
                </div>
                <div className="flex justify-between items-baseline border-b border-white/10 pb-6">
                  <span className="text-sm text-slate-400">Team Lead Oversight</span>
                  <span className="text-2xl font-bold">Included</span>
                </div>
                <div className="pt-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cost Predictability</div>
                  <div className="text-xl font-medium text-blue-400">Flat Fee Per Member</div>
                </div>
              </div>
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
            <h2 className="text-3xl md:text-5xl font-semibold mb-6 tracking-tight">Ideal Functions to Manage</h2>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto">
              Our managed team model is optimized for functions requiring multiple people, reducing your management burden entirely.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Layout, t: "Customer Support", d: "24/7 coverage, high-volume ticket resolution." },
              { icon: Terminal, t: "Data Operations", d: "Data entry, enrichment, and CRM maintenance." },
              { icon: Users, t: "Back-Office Ops", d: "Document processing and administrative teams." },
              { icon: Zap, t: "Sales Development", d: "Lead generation, outreach, and appointment setting." }
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
                  <th className="px-8 py-6 text-sm font-bold text-blue-600 uppercase tracking-widest bg-blue-50/30">OpslyHR Project</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { dim: "Overhead", trad: "High Management Time", task: "Zero Client Management" },
                  { dim: "Focus", trad: "Individual Performers", task: "Functional Output" },
                  { dim: "Structure", trad: "Siloed Freelancers", task: "Cohesive Pod w/ Team Lead" },
                  { dim: "Pricing", trad: "Unpredictable Hourly", task: "Flat Monthly Fee" }
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
            <h2 className="text-4xl md:text-6xl font-semibold text-slate-900 mb-12 tracking-tight">Outsource the Function, <br /> Not Just the Task.</h2>
            <Link to="/book-consultation">
              <Button 
                  size="lg" 
                  className="h-16 px-12 text-lg rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold transition-all duration-300 shadow-xl shadow-blue-100" 
              >
                Discuss Managed Teams <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ManagedTeams;
