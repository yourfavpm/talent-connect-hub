
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Clock, Globe, Shield, Users, Zap, Briefcase, Layout, CreditCard, Search, UserCheck, ChevronRight, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const [activeStep, setActiveStep] = useState(1);

  const vettingSteps = [
    {
      id: 1,
      number: "01",
      label: "Skill Testing",
      headline: "Structured Capability Validation",
      description: "Every professional undergoes role-specific evaluation to validate operational depth and execution ability.",
      bullets: [
        "Functional scenario testing",
        "Real-world case assessments",
        "Tool proficiency validation",
        "Process documentation review"
      ]
    },
    {
      id: 2,
      number: "02",
      label: "Reference Checks",
      headline: "Professional Background Verification",
      description: "We validate work history and performance reliability through structured reference checks.",
      bullets: [
        "Previous employer confirmation",
        "Performance feedback",
        "Role scope validation",
        "Professional conduct review"
      ]
    },
    {
      id: 3,
      number: "03",
      label: "Performance Review",
      headline: "Operational Track Record Review",
      description: "We assess prior measurable outcomes to ensure execution capability.",
      bullets: [
        "KPI impact evaluation",
        "Process optimization examples",
        "Delivery consistency analysis",
        "Remote collaboration history"
      ]
    },
    {
      id: 4,
      number: "04",
      label: "Soft Skills & Communication",
      headline: "Communication & Alignment Screening",
      description: "Professionals are screened for clarity, fluency, and collaborative ability.",
      bullets: [
        "English fluency assessment",
        "Timezone compatibility",
        "Communication clarity review",
        "Professional demeanor evaluation"
      ]
    },
    {
      id: 5,
      number: "05",
      label: "Ongoing Monitoring",
      headline: "Continuous Quality Oversight",
      description: "Vetting does not stop at placement.",
      bullets: [
        "Performance check-ins",
        "Client feedback loops",
        "Talent manager oversight",
        "Replacement guarantee if needed"
      ]
    }
  ];

  return (
    <div className="bg-background min-h-screen text-foreground overflow-x-hidden selection:bg-primary selection:text-white font-sans">

      {/* 2. ENTERPRISE HERO SECTION (REDESIGNED) */}
      <section className="relative pt-44 pb-16 md:pt-52 md:pb-32 px-6 overflow-hidden bg-slate-50 font-inter">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/50 to-transparent pointer-events-none"></div>
        
        <div className="container max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-center relative z-10">
          {/* Left Side: Content & Trust Indicators */}
          <div className="animate-slide-up flex flex-col items-center text-center lg:items-start lg:text-left flex-1 min-w-0">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 md:mb-8 leading-[1.2] md:leading-[1.15] text-slate-900">
              Hire Vetted Remote Operations Experts — Built for Global Teams
            </h1>

            <p className="text-base md:text-lg text-slate-600 mb-8 md:mb-10 max-w-lg leading-relaxed font-medium mx-auto lg:mx-0">
              We match you with pre-screened professionals ready to handle operations, support, project work, and team management — no recruitment burden.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-14 w-full">
              <Link to="/auth/login" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 px-10 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md shadow-blue-900/10 transition-all font-semibold w-full">
                  Get Matched With Talent
                </Button>
              </Link>
              <Link to="/book-consultation" className="w-full sm:w-auto">
                <Button variant="ghost" size="lg" className="h-14 px-8 text-base text-slate-700 hover:bg-slate-100/80 rounded-full font-semibold flex items-center justify-center lg:justify-start gap-2 w-full">
                  Book a Strategy Call <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            
            {/* MOBILE ONLY: FEATURED TALENT CARD */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:hidden w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl shadow-slate-200/60 border border-slate-100 mb-12"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80" alt="Featured Talent" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Michael T.</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Dir. of Operations</p>
                </div>
                <div className="ml-auto flex flex-col items-end">
                  <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded tracking-tighter">VETTED L5</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Relavent EXP</span>
                  <span className="text-xs font-bold text-slate-700">14 Years</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Region</span>
                  <span className="text-xs font-bold text-slate-700">EMEA / GMT+2</span>
                </div>
              </div>
            </motion.div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 pt-8 border-t border-slate-200">
              {[
                "48h Average Shortlist",
                "98% Placement Rate",
                "EMEA Coverage"
              ].map((indicator, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{indicator}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Layered Profile Cards */}
          <div className="relative animate-fade-in hidden lg:flex h-[540px] flex-1 items-center justify-center min-w-0">
            {[
              {
                name: "Sarah J.",
                role: "Head of Product",
                level: 5,
                image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80",
                tags: ["Growth", "Fintech", "B2B SaaS"],
                tz: "GMT+1",
                exp: "12 Yrs",
                offset: "rotate-[-4deg] translate-y-12 z-10"
              },
              {
                name: "Michael T.",
                role: "Dir. of Operations",
                level: 5,
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80",
                tags: ["Logistics", "Scaleup", "EOR"],
                tz: "GMT+2",
                exp: "14 Yrs",
                offset: "rotate-[2deg] translate-x-12 -translate-y-2 z-20"
              },
              {
                name: "David K.",
                role: "Senior Engineering PM",
                level: 4,
                image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80",
                tags: ["Python", "Infrastructure", "AI"],
                tz: "GMT+1",
                exp: "9 Yrs",
                offset: "rotate-[-2deg] -translate-x-4 translate-y-32 z-30 shadow-xl"
              }
            ].map((talent, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -8, rotate: 0, scale: 1.02 }}
                className={`absolute top-0 right-0 w-[360px] bg-white rounded-[16px] p-6 shadow-2xl shadow-slate-950/5 border border-slate-100 transition-all duration-500 ${talent.offset}`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border border-slate-50">
                    <img src={talent.image} alt={talent.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="font-bold text-slate-900 text-lg">{talent.name}</div>
                      <div className="w-2 h-2 rounded-full bg-green-500" title="Available" />
                    </div>
                    <div className="text-slate-500 text-sm font-semibold">{talent.role}</div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    <span>Vetted Skill Level</span>
                    <span className="text-blue-600">Level {talent.level}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <div key={star} className={`h-1 flex-grow rounded-full ${star <= talent.level ? 'bg-blue-600' : 'bg-slate-100'}`} />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap mb-6">
                  {talent.tags.map(tag => (
                    <span key={tag} className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-100">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timezone</span>
                    <span className="text-xs font-bold text-slate-700">{talent.tz}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience</span>
                    <span className="text-xs font-bold text-slate-700">{talent.exp}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TRUST & CREDIBILITY (REPOSITIONED) */}
      <section className="py-12 md:py-16 border-b border-slate-200 bg-white">
        <div className="container max-w-7xl mx-auto text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Trusted by Global Teams and Growing Enterprises</p>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">Streamlining hiring and operations across industries</p>

          <div className="relative w-full overflow-hidden">
            <div className="flex animate-marquee gap-16 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Actual Companies - Duplicated for infinite scroll */}
              {[
                "Kemuko", "Xanotech", "Spectrum Microfinance", "Squared Space",
                "Kemuko", "Xanotech", "Spectrum Microfinance", "Squared Space",
                "Kemuko", "Xanotech", "Spectrum Microfinance", "Squared Space"
              ].map((name, i) => (
                <div key={i} className="flex-shrink-0 flex items-center justify-center">
                  <span className="text-xl md:text-2xl font-bold font-display text-slate-400 whitespace-nowrap">{name}</span>
                </div>
              ))}
            </div>
            {/* Gradient masks for smooth fade edges */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10"></div>
          </div>
        </div>
      </section>

      {/* NEW TRUST-BUILDING SECTION (STRATEGIC POSITIONING) */}
      <section className="py-24 px-6 bg-slate-50 font-inter border-b border-slate-200">
        <div className="container max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-16 md:mb-20 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4 leading-tight tracking-tight">
              No Search. No Guesswork. No Hiring Headaches.
            </h2>
            <p className="text-base md:text-lg text-slate-500 font-light max-w-2xl">
              We handle sourcing, vetting, compliance, and ongoing support — so you don’t have to.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            {/* Left Side: Structured Benefit Blocks (60%) */}
            <div className="lg:col-span-7 relative pl-8">
              {/* Vertical Dotted Line */}
              <div className="absolute left-0 top-2 bottom-2 w-px border-l border-dotted border-slate-300"></div>

              <div className="space-y-10 md:space-y-12">
                {[
                  {
                    title: "Verified Skills & Performance Testing",
                    desc: "Every professional goes through structured vetting and capability validation."
                  },
                  {
                    title: "Replacement Guarantee",
                    desc: "If a match isn’t right, we replace at no additional cost."
                  },
                  {
                    title: "Managed HR & Compliance Included",
                    desc: "Contracts, payments, and engagement compliance handled for you."
                  },
                  {
                    title: "English Fluency & Timezone Matching",
                    desc: "Professionals aligned to your communication and working hours."
                  },
                  {
                    title: "Flexible Engagement Models",
                    desc: "Direct hire, trial-to-hire, and project-based engagements."
                  }
                ].map((benefit, i) => (
                  <div key={i} className="relative">
                    {/* Circular Dot */}
                    <div className="absolute -left-[36px] top-1.5 w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]"></div>
                    
                    <h3 className="text-lg md:text-xl font-medium text-slate-900 mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-sm md:text-base text-slate-500 font-light">
                      {benefit.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Trust Visualization (40%) */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 md:p-10 sticky top-32">
                <h4 className="text-base font-semibold text-slate-900 mb-8 uppercase tracking-wider">
                  Enterprise-Level Operational Support
                </h4>
                
                <div className="space-y-6">
                  {[
                    "Dedicated talent manager",
                    "Structured onboarding",
                    "Ongoing performance oversight",
                    "Transparent billing"
                  ].map((item, i) => (
                    <div key={i} className={`pb-6 ${i !== 3 ? 'border-b border-slate-100' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        <span className="text-base text-slate-600 font-medium">{item}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                          <img 
                            src={`https://images.unsplash.com/photo-${1500000000000 + i * 100000}?auto=format&fit=crop&q=80&w=100&h=100`} 
                            alt="Support Team" 
                            className="w-full h-full object-cover grayscale opacity-80"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 font-medium leading-tight">
                      Standard in every <br />engagement model.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VETTING ENGINE SECTION (ENTERPRISE GRADE) */}
      <section className="py-24 px-6 bg-white font-inter border-b border-slate-200 overflow-hidden">
        <div className="container max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-16 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4 tracking-tight">
              The OPSlyHR Vetting Engine
            </h2>
            <p className="text-base md:text-lg text-slate-500 font-light max-w-2xl">
              A structured multi-layer quality system designed to ensure every professional meets global operational standards.
            </p>
          </div>

          {/* Interactive Step Navigation */}
          <div className="relative mb-16">
            <div className="flex overflow-x-auto pb-4 md:pb-0 md:flex-row md:justify-between border-b border-slate-100 no-scrollbar items-center">
              {vettingSteps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex flex-col items-start min-w-[160px] md:min-w-0 md:flex-1 py-6 px-4 transition-all relative group text-left ${
                    activeStep === step.id ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      activeStep === step.id 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200' 
                      : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'
                    }`}>
                      {step.number}
                    </span>
                    <span className={`text-sm font-semibold transition-colors ${
                      activeStep === step.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {activeStep === step.id && (
                    <motion.div 
                      layoutId="activeStep"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="min-h-[400px] md:min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid md:grid-cols-12 gap-12 items-start"
              >
                <div className="md:col-span-7">
                  <h3 className="text-2xl md:text-3xl font-medium text-slate-900 mb-6">
                    {vettingSteps[activeStep - 1].headline}
                  </h3>
                  <p className="text-base md:text-lg text-slate-500 font-light leading-relaxed mb-8">
                    {vettingSteps[activeStep - 1].description}
                  </p>
                </div>
                <div className="md:col-span-5">
                  <div className="bg-slate-50/50 rounded-2xl p-8 border border-slate-100">
                    <div className="space-y-4">
                      {vettingSteps[activeStep - 1].bullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600/30"></div>
                          <span className="text-base text-slate-600 font-medium">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* 4. SERVICE MODELS — REDESIGNED COMPARISON SECTION */}
      <section className="py-24 px-6 bg-white font-inter">
        <div className="container max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-20 animate-slide-up">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Service Models</div>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-6 leading-tight tracking-tight">
              Choose the Right Engagement Model
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Each model is structured around operational control, cost clarity, and flexibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Direct Hire",
                desc: "Permanent placement with a one-time 15% annual salary buyout.",
                traits: [
                  "Direct employment relationship",
                  "No ongoing platform margin",
                  "Structured contract transfer",
                  "Best for long-term hires"
                ],
                recommended: false,
                accent: "border-t-slate-400"
              },
              {
                title: "Trial-to-Hire",
                desc: "Start managed, convert anytime. The most flexible path to permanent scale.",
                traits: [
                  "20% platform margin",
                  "Payroll managed by OPSlyHR",
                  "Monthly or hourly billing",
                  "Conversion flexibility"
                ],
                recommended: true,
                accent: "border-t-blue-600"
              },
              {
                title: "One-Time Project",
                desc: "Defined scope, fast deployment. Surgical strikes for specific needs.",
                traits: [
                  "30% margin built into project pricing",
                  "No long-term commitment",
                  "Clear deliverables",
                  "Rapid start"
                ],
                recommended: false,
                accent: "border-t-amber-400"
              }
            ].map((model, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white rounded-[12px] border-l border-r border-b border-slate-200 border-t-2 ${model.accent} p-8 flex flex-col h-full hover:shadow-md transition-shadow duration-300`}
              >
                {model.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Recommended
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{model.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {model.desc}
                  </p>
                </div>

                <div className="space-y-4 mb-10 flex-grow">
                  {model.traits.map((trait, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <div className="w-1 h-1 rounded-full bg-slate-300 mt-2 flex-shrink-0" />
                      <span className="text-sm text-slate-600 font-medium">{trait}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <Link 
                    to="/book-consultation"
                    className="group inline-flex items-center gap-2 text-sm font-bold text-slate-950 hover:text-blue-600 transition-colors"
                  >
                    Learn more and get started
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.5. OPERATIONAL PERFORMANCE — REDESIGNED DATA-DRIVEN SECTION */}
      <section className="py-24 px-6 bg-white font-inter">
        <div className="container max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Column: Metrics Grid */}
            <div className="animate-slide-up">
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-6 leading-tight tracking-tight">
                Operational Performance, Measured.
              </h2>
              <p className="text-base text-slate-600 mb-12 leading-relaxed max-w-lg">
                OPSlyHR replaces guesswork with structured vetting, automated contracts, and transparent billing.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { 
                    val: "48 Hours", 
                    label: "Average Time to Shortlist", 
                    sub: "From approved job to curated candidates." 
                  },
                  { 
                    val: "98%", 
                    label: "Successful Placement Rate", 
                    sub: "Trial-to-hire conversion success." 
                  },
                  { 
                    val: "3.5x Faster", 
                    label: "Efficiency Multiplier", 
                    sub: "Compared to internal hiring cycles." 
                  },
                  { 
                    val: "EMEA Coverage", 
                    label: "20+ countries represented", 
                    sub: "Dedicated regional expertise." 
                  },
                  { 
                    val: "15–30% Margin", 
                    label: "Margin Control", 
                    sub: "Transparent structured pricing." 
                  },
                  { 
                    val: "Automated", 
                    label: "Agreement Generation", 
                    sub: "Service-type driven contract automation." 
                  }
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -2 }}
                    className="p-5 bg-slate-50/50 rounded-[12px] border border-slate-200 border-l-2 border-l-blue-600/20 hover:border-l-blue-600 transition-all duration-300"
                  >
                    <div className="text-lg font-bold text-slate-950 mb-1">{stat.val}</div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{stat.label}</div>
                    <p className="text-[12px] text-slate-500 leading-snug font-medium">{stat.sub}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Column: Enterprise Dashboard Visual */}
            <div className="relative">
              <div className="aspect-[4/3] relative">
                {/* Layered Content Cards */}
                <div className="absolute inset-0 bg-slate-50/50 rounded-[24px] border border-slate-100 flex items-center justify-center">
                  <div className="w-4/5 h-3/5 bg-white rounded-[16px] shadow-sm border border-slate-200 p-6 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                        <div className="w-8 h-2.5 rounded-full bg-slate-100" />
                      </div>
                      <div className="w-10 h-4 rounded-full bg-blue-50 border border-blue-100" />
                    </div>
                    <div className="space-y-4">
                      <div className="h-3 w-3/4 bg-slate-50 rounded-full" />
                      <div className="h-3 w-1/2 bg-slate-50 rounded-full" />
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-lg" />)}
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600/0 via-blue-600/40 to-blue-600/0" />
                  </div>
                </div>

                {/* Floating Labels */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="absolute top-10 right-4 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[11px] font-bold text-slate-700 tracking-tight">Role Filled</span>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute bottom-20 left-4 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-[11px] font-bold text-slate-700 tracking-tight">Candidate Verified</span>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="absolute top-1/2 -translate-y-1/2 -right-10 bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200 flex flex-col items-start gap-1"
                >
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Compliance</span>
                  <span className="text-[11px] font-bold text-slate-900">Contract Generated</span>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-5 right-10 bg-white px-4 py-3 rounded-xl shadow-sm border border-emerald-100 flex flex-col items-start gap-1"
                >
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Billing</span>
                  <span className="text-[11px] font-bold text-slate-900">Invoice Issued</span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS — REDESIGNED VERTICAL TIMELINE */}
      <section className="py-24 px-6 bg-slate-50 font-inter">
        <div className="container max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="max-w-3xl mb-24 animate-slide-up">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">How It Works</div>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-6 leading-tight tracking-tight">
              Structured Hiring, Step by Step
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              From role definition to payment processing, OPSlyHR manages the entire talent lifecycle.
            </p>
          </div>

          <div className="relative pl-12 md:pl-20">
            {/* Vertical Dotted Line */}
            <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px border-l-[1.5px] border-dotted border-slate-300"></div>

            <div className="space-y-16">
              {[
                { 
                  num: "01", 
                  title: "Define Your Hiring Model", 
                  desc: "Choose Direct Hire, Trial-to-Hire, or One-Time Project.", 
                  note: "Service-level transparency ensured."
                },
                { 
                  num: "02", 
                  title: "Access Pre-Vetted Talent", 
                  desc: "Browse skill-assessed professionals categorized by role and level.", 
                  note: "EMEA-specialized vetting framework."
                },
                { 
                  num: "03", 
                  title: "Interview & Select", 
                  desc: "Schedule and track interviews directly in your dashboard.", 
                  note: "Integrated scheduling & feedback."
                },
                { 
                  num: "04", 
                  title: "Contracts Generated Automatically", 
                  desc: "Agreements selected and populated based on service type.", 
                  note: "Compliance-first documentation."
                },
                { 
                  num: "05", 
                  title: "Manage Work & Approvals", 
                  desc: "Track assignments and approve timesheets where applicable.", 
                  note: "Real-time engagement visibility."
                },
                { 
                  num: "06", 
                  title: "Billing & Payout", 
                  desc: "Invoices generated, margin breakdown visible, payouts processed seamlessly.", 
                  note: "Secure global payment infrastructure."
                }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group"
                >
                  {/* Dot Marker */}
                  <div className="absolute -left-[37px] md:-left-[59px] top-6 w-3 h-3 rounded-full bg-slate-300 border-2 border-slate-50 z-10 group-hover:bg-primary transition-colors duration-300"></div>
                  
                  {/* Content Card */}
                  <div className="bg-white p-6 md:p-8 rounded-[12px] border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-default">
                    <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                      <div className="text-xl font-semibold text-slate-300 group-hover:text-primary transition-colors duration-300 font-display">
                        {step.num}
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium mb-4">{step.desc}</p>
                        <div className="inline-flex py-1 px-3 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {step.note}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* 7. OPERATIONS PROFESSIONALS SHOWCASE */}
      <section className="py-24 px-6 bg-white font-inter overflow-hidden">
        <div className="container max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-[40px] font-semibold text-slate-900 mb-4 leading-tight">
              Meet Operations Leaders in Our Pipeline
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Vetted professionals across product ops, revenue ops, business ops, and specialized domains
            </p>
          </motion.div>

          {/* Scrolling Profile Cards */}
          <div className="relative">
            <motion.div 
              animate={{ x: [0, -2500] }}
              transition={{ 
                duration: 40, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="flex gap-6 whitespace-nowrap"
            >
              {[
                { 
                  name: "Sarah Chen", 
                  role: "Product Ops Lead", 
                  image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80",
                  tags: ["Product Strategy", "SaaS", "Scaling"],
                  tz: "GMT+8",
                  exp: "11 Yrs",
                  level: 5
                },
                { 
                  name: "Amara Okonkwo", 
                  role: "Revenue Ops Manager", 
                  image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80",
                  tags: ["Salesforce", "Lead Gen", "Strategy"],
                  tz: "GMT+1",
                  exp: "8 Yrs",
                  level: 5
                },
                { 
                  name: "Marcus Rodriguez", 
                  role: "Business Ops Director", 
                  image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80",
                  tags: ["OPS Strategy", "M&A", "Global"],
                  tz: "GMT-5",
                  exp: "15 Yrs",
                  level: 5
                },
                { 
                  name: "Zara Patel", 
                  role: "Finance Ops Specialist", 
                  image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80",
                  tags: ["Payments", "Compliance", "FP&A"],
                  tz: "GMT+5:30",
                  exp: "7 Yrs",
                  level: 4
                },
                { 
                  name: "James O'Brien", 
                  role: "Data Ops Engineer", 
                  image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80",
                  tags: ["Analytics", "SQL", "Pipelines"],
                  tz: "GMT",
                  exp: "9 Yrs",
                  level: 5
                },
                { 
                  name: "Naomi Adeyemi", 
                  role: "People Ops Manager", 
                  image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80",
                  tags: ["Talent", "HRIS", "Culture"],
                  tz: "GMT+1",
                  exp: "10 Yrs",
                  level: 5
                },
                { 
                  name: "David Kim", 
                  role: "Infrastructure Ops", 
                  image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80",
                  tags: ["Reliability", "AWS", "Security"],
                  tz: "GMT-8",
                  exp: "12 Yrs",
                  level: 5
                },
                { 
                  name: "Elena Morales", 
                  role: "Operations Manager", 
                  image: "https://images.unsplash.com/photo-1567532939604-b6c5b0ad2ea6?auto=format&fit=crop&q=80",
                  tags: ["Optimization", "PMO", "Agile"],
                  tz: "GMT+1",
                  exp: "9 Yrs",
                  level: 4
                },
                // Duplicates for seamless loop
                { 
                  name: "Sarah Chen", 
                  role: "Product Ops Lead", 
                  image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80",
                  tags: ["Product Strategy", "SaaS", "Scaling"],
                  tz: "GMT+8",
                  exp: "11 Yrs",
                  level: 5
                },
                { 
                  name: "Amara Okonkwo", 
                  role: "Revenue Ops Manager", 
                  image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80",
                  tags: ["Salesforce", "Lead Gen", "Strategy"],
                  tz: "GMT+1",
                  exp: "8 Yrs",
                  level: 5
                },
                { 
                  name: "Marcus Rodriguez", 
                  role: "Business Ops Director", 
                  image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80",
                  tags: ["OPS Strategy", "M&A", "Global"],
                  tz: "GMT-5",
                  exp: "15 Yrs",
                  level: 5
                },
                { 
                  name: "Zara Patel", 
                  role: "Finance Ops Specialist", 
                  image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80",
                  tags: ["Payments", "Compliance", "FP&A"],
                  tz: "GMT+5:30",
                  exp: "7 Yrs",
                  level: 4
                }
              ].map((person, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -8 }}
                  className="flex-shrink-0 w-[320px] bg-white rounded-[24px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-100">
                      <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-slate-900 text-base">{person.name}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{person.role}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg py-2 px-3 flex items-center justify-center gap-2 mb-5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">100% Vetted Talent</span>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between items-center text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                      <span>Vetted skill level</span>
                      <span className="text-blue-600">Level {person.level}/5</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <div key={star} className={`h-1 flex-grow rounded-full ${star <= person.level ? 'bg-blue-600' : 'bg-slate-100'}`} />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {person.tags.map(tag => (
                      <span key={tag} className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-bold border border-slate-100">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Timezone</span>
                      <span className="text-xs font-bold text-slate-700">{person.tz}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Experience</span>
                      <span className="text-xs font-bold text-slate-700">{person.exp}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>



      {/* 9. CLIENT RESULTS — REDESIGNED TESTIMONIAL SECTION */}
      <section className="py-24 px-6 bg-white font-inter">
        <div className="container max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-20 animate-slide-up">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Client Results</div>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-6 leading-tight tracking-tight">
              Trusted by Growth-Focused Teams
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Companies across SaaS and fintech rely on OPSlyHR for structured talent engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "“We reduced hiring cycles by 60% and onboarded two senior operators within three weeks.”",
                badge: "48h Shortlist Average",
                name: "Jason R.",
                role: "Director of Ops",
                company: "Scaleup Inc."
              },
              {
                quote: "“The trial-to-hire model gave us flexibility without long-term risk. Exceptional talent quality.”",
                badge: "98% Conversion Rate",
                name: "Elena M.",
                role: "VP Product",
                company: "Fintech Grid"
              },
              {
                quote: "“Contracts and payroll were handled seamlessly — no compliance headaches. A true partner.”",
                badge: "20+ EMEA Markets",
                name: "Marcus L.",
                role: "Head of Talent",
                company: "NexGen Labs"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white p-10 rounded-[16px] border border-slate-200 shadow-sm hover:border-blue-200 transition-all duration-300 flex flex-col h-full"
              >
                <div className="mb-10 flex-grow">
                  <p className="text-lg text-slate-700 leading-relaxed font-medium italic">
                    {item.quote}
                  </p>
                </div>
                
                <div className="space-y-6 pt-8 border-t border-slate-50">
                  <div className="inline-flex py-1 px-3 bg-blue-50 text-[10px] font-bold text-blue-600 uppercase tracking-wider rounded-md">
                    {item.badge}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-950">{item.name}</div>
                    <div className="text-[12px] text-slate-500 font-medium">
                      {item.role}, {item.company}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};


export default Index;
