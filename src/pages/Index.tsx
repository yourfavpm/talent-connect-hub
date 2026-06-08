import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Clock, Globe, Shield, ShieldCheck, Users, Zap, Briefcase, Layout, CreditCard, Search, UserCheck, ChevronRight, TrendingUp, Loader2, MessageSquare } from "lucide-react";
import CommunityCTA from "@/components/website/CommunityCTA";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

import { Zone, getZoneUrl } from "@/utils/subdomain";

interface VettedTalent {
  name: string;
  role: string;
  image: string;
  tags: string[];
  tz: string;
  exp: string;
  level: number;
}

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-indigo-600', 'bg-cyan-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const Index = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [vettedTalent, setVettedTalent] = useState<VettedTalent[]>([
    {
      name: "Omo Izuafa",
      role: "Operations Manager",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80",
      tags: ["Strategy", "Process", "Scaling"],
      tz: "GMT-4",
      exp: "3 Yrs",
      level: 5
    },
    {
      name: "SYLVIA ENYONAM AGALA",
      role: "Customer Support Specialist",
      image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80",
      tags: ["Email Marketing", "Data Analysis", "Support"],
      tz: "GMT",
      exp: "3 Yrs",
      level: 5
    },
    {
      name: "Kate Ogbuka",
      role: "HR Business Partner",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80",
      tags: ["HR Strategy", "Culture", "Talent"],
      tz: "GMT+1",
      exp: "8 Yrs",
      level: 5
    },
    {
      name: "Oluwatosin Adelaja",
      role: "Virtual Assistant",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80",
      tags: ["React", "Node.js", "JS"],
      tz: "GMT+1",
      exp: "5 Yrs",
      level: 4
    },
    {
      name: "Jane Ajao",
      role: "Virtual Assistant",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80",
      tags: ["Problem Solving", "Organization", "Support"],
      tz: "GMT",
      exp: "7 Yrs",
      level: 5
    },
    {
      name: "Amen Adamu",
      role: "Administrative Assistant",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80",
      tags: ["Office Admin", "Communication", "MS Office"],
      tz: "GMT+3",
      exp: "1 Yr",
      level: 4
    }
  ]);
  const [loadingTalent, setLoadingTalent] = useState(false);

  useEffect(() => {
    // Keeping the effect hook empty for now as we are hardcoding
    // but we can restore it later once RLS/data issues are resolved
  }, []);

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
    <div className="bg-white min-h-screen text-foreground overflow-x-hidden selection:bg-primary selection:text-white font-sans">

      {/* 2. ENTERPRISE HERO SECTION (REDESIGNED) */}
      <section className="relative pt-44 pb-16 md:pt-52 md:pb-32 overflow-hidden bg-slate-950 font-inter">
        {/* World Map Background */}
        <div 
          className="absolute inset-0 w-full h-full opacity-[0.15] pointer-events-none mix-blend-screen"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'invert(1) grayscale(100%) contrast(2)',
            WebkitMaskImage: 'radial-gradient(circle at 70% 50%, black 20%, transparent 80%)',
            maskImage: 'radial-gradient(circle at 70% 50%, black 20%, transparent 80%)'
          }}
        />
        
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

        <div className="w-full px-6 md:px-12 lg:px-24 2xl:px-32 mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-center relative z-10">
          {/* Left Side: Content & Trust Indicators */}
          <div className="animate-slide-up flex flex-col items-start text-left flex-1 min-w-0">
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-semibold tracking-tight mb-6 md:mb-8 leading-[1.1] md:leading-[1.05] text-white">
              Build Reliable Operational Teams Without the Hiring Complexity.
            </h1>

            <p className="text-base md:text-xl text-slate-300 mb-8 md:mb-10 max-w-xl leading-relaxed font-medium mx-auto lg:mx-0">
              Opsly HR helps growing businesses hire, manage, and scale operational talent through structured workforce solutions and ongoing support.
            </p>

            <div className="flex flex-col sm:flex-row justify-start gap-4 mb-14 w-full">
              <Link to="/book-consultation" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 px-10 text-base bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all font-semibold w-full">
                  Book a Consultation
                </Button>
              </Link>
              <a href={getZoneUrl(Zone.AUTH, "/auth/signup/client")} className="w-full sm:w-auto">
                <Button variant="ghost" size="lg" className="h-14 px-8 text-base text-slate-300 hover:bg-white/10 hover:text-white rounded-full font-semibold flex items-center justify-center lg:justify-start gap-2 w-full transition-colors">
                  Build Your Team <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
            
            {/* MOBILE ONLY: FEATURED CAPACITY CARD */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:hidden w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl shadow-slate-200/60 border border-slate-100 mb-12"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white bg-blue-600 shadow-sm`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Customer Support</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Fully Managed Team</p>
                </div>
                <div className="ml-auto flex flex-col items-end">
                  <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded tracking-tighter">OPERATIONAL</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Metric</span>
                  <span className="text-xs font-bold text-slate-700">98% CSAT</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Coverage</span>
                  <span className="text-xs font-bold text-slate-700">24/7 Global</span>
                </div>
              </div>
            </motion.div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-start gap-x-8 gap-y-4 pt-8 border-t border-slate-800">
              {[
                "48h Average Shortlist",
                "98% Placement Rate",
                "EMEA Coverage"
              ].map((indicator, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{indicator}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Layered Profile Cards */}
          <div className="relative animate-fade-in hidden lg:flex h-[540px] flex-1 items-center justify-center min-w-0">
            {[
              {
                title: "Administrative Workflows",
                status: "Executed",
                icon: Briefcase,
                tags: ["Inbox Zero", "CRM Management", "Scheduling"],
                metrics: "Zero Backlog",
                time: "Asynchronous",
                offset: "translate-y-12 z-10 opacity-70 scale-95"
              },
              {
                title: "Customer Support Teams",
                status: "Fully Managed",
                icon: MessageSquare,
                tags: ["24/7 Coverage", "SLA Adherence", "Omnichannel"],
                metrics: "98% CSAT",
                time: "GMT Alignment",
                offset: "translate-x-12 -translate-y-2 z-20 opacity-90 scale-[0.98]"
              },
              {
                title: "Team Leadership & HR",
                status: "Handled",
                icon: ShieldCheck,
                tags: ["Payroll", "Compliance", "Performance"],
                metrics: "100% Retained",
                time: "Centralized",
                offset: "-translate-x-4 translate-y-32 z-30 shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`absolute top-0 right-0 w-[360px] aspect-square bg-white rounded-2xl p-8 shadow-2xl shadow-slate-950/5 border border-slate-100 transition-all duration-500 flex flex-col justify-center ${feature.offset}`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white bg-blue-600 border border-slate-50 shadow-sm">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="font-bold text-slate-900 text-lg">{feature.title}</div>
                      <div className="w-2 h-2 rounded-full bg-green-500" title="Active" />
                    </div>
                    <div className="text-slate-500 text-sm font-semibold">{feature.status}</div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    <span>Operational Reliability</span>
                    <span className="text-blue-600">Level 5/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <div key={star} className={`h-1 flex-grow rounded-full bg-blue-600`} />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap mb-6">
                  {feature.tags.map(tag => (
                    <span key={tag} className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-100">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</span>
                    <span className="text-xs font-bold text-slate-700">{feature.time}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metrics</span>
                    <span className="text-xs font-bold text-slate-700">{feature.metrics}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TRUST & CREDIBILITY (REPOSITIONED) */}
      <section className="py-12 md:py-16 border-b border-slate-200 bg-white">
        <div className="w-full px-6 md:px-12 lg:px-24 2xl:px-32 mx-auto text-left md:text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Trusted by Global Teams and Growing Enterprises</p>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto md:mx-auto">Streamlining hiring and operations across industries</p>

          <div className="relative w-full overflow-hidden">
            <div className="flex animate-marquee gap-16 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Actual Companies - Duplicated for infinite scroll */}
              {[
                "Kemuko", "Xanotech", "Spectrum Microfinance", "Squared Space", "Skeduley", "Meerge", "Megadel",
                "Kemuko", "Xanotech", "Spectrum Microfinance", "Squared Space", "Skeduley", "Meerge", "Megadel",
                "Kemuko", "Xanotech", "Spectrum Microfinance", "Squared Space", "Skeduley", "Meerge", "Megadel"
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

      {/* ── IMPACT STATISTICS SECTION (REDESIGNED: TYPOGRAPHIC FLOW) ────────────────────────────────── */}
      <section className="py-24 px-2 sm:px-6 bg-white overflow-hidden font-inter border-b border-slate-100 relative">
        {/* Subtle Background Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px]"></div>

        <div className="w-full px-6 md:px-12 lg:px-24 2xl:px-32 mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-16 lg:gap-24">
            {[
              {
                value: "15+",
                metric: "Countries",
                color: "text-violet-600",
                pulse: "bg-violet-600/5",
                icon: Globe
              },
              {
                value: "3,500+",
                metric: "Vetted Talents",
                color: "text-blue-600",
                pulse: "bg-blue-600/5",
                icon: Users
              },
              {
                value: "15+",
                metric: "Partner Companies",
                color: "text-emerald-600",
                pulse: "bg-emerald-600/5",
                icon: Briefcase
              },
              {
                value: "48h",
                metric: "Avg Shortlist",
                color: "text-amber-600",
                pulse: "bg-amber-600/5",
                icon: Clock
              }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                className="relative group flex-1"
              >
                {/* Large Background Pulse */}
                <div className={`absolute -left-8 -top-8 w-32 h-32 rounded-full ${stat.pulse} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000`} />
                
                <div className="relative space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-px ${stat.color.replace('text-', 'bg-')} opacity-40`} />
                    <stat.icon className={`w-4 h-4 ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  
                  <div className="flex flex-col">
                    <motion.span 
                      className="text-5xl lg:text-7xl font-semibold text-slate-900 tracking-tighter block mb-2"
                      initial={{ scale: 0.95 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: i * 0.2 }}
                    >
                      {stat.value}
                    </motion.span>
                    <span className={`text-[11px] font-extrabold uppercase tracking-[0.25em] ${stat.color}`}>
                      {stat.metric}
                    </span>
                  </div>

                  {/* Dynamic Vertical Pulse Line (Desktop Only) */}
                  <div className={`hidden md:block absolute -right-12 top-1/2 -translate-y-1/2 w-px h-12 bg-gradient-to-b from-transparent via-slate-200 to-transparent ${i === 3 ? 'hidden' : ''}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW TRUST-BUILDING SECTION (STRATEGIC POSITIONING) */}
      <section className="py-24 px-2 sm:px-6 bg-slate-50 font-inter border-b border-slate-200">
        <div className="w-full px-6 md:px-12 lg:px-24 2xl:px-32 mx-auto">
          {/* Header */}
          <div className="mb-16 md:mb-20 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4 leading-tight tracking-tight">
              Growth Uncovers Operational Cracks.
            </h2>
            <p className="text-base md:text-lg text-slate-500 font-light max-w-2xl">
              Businesses don't struggle from a lack of ambition—they struggle because operations become increasingly difficult to manage as they grow.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            {/* Left Side: Structured Benefit Blocks (60%) */}
            <div className="lg:col-span-7 relative pl-6 sm:pl-8">
              {/* Vertical Dotted Line */}
              <div className="absolute left-0 top-2 bottom-2 w-px border-l border-dotted border-slate-300"></div>

              <div className="space-y-10 md:space-y-12">
                {[
                  {
                    title: "Founder Overload",
                    desc: "Leadership gets pulled into day-to-day administrative firefighting instead of strategic growth."
                  },
                  {
                    title: "Inconsistent Customer Support",
                    desc: "Response times drop, service quality varies, and customer satisfaction suffers."
                  },
                  {
                    title: "Administrative Bottlenecks",
                    desc: "Back-office tasks pile up, leading to slow processing and disorganized operations."
                  },
                  {
                    title: "Fragmented Processes",
                    desc: "No clear systems or accountability, resulting in inconsistent task completion."
                  },
                  {
                    title: "Hiring Complexity",
                    desc: "Finding, vetting, and managing reliable support staff is slow and expensive."
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
            <div className="lg:col-span-5 w-full">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10 sticky top-32">
                <h4 className="text-base font-semibold text-slate-900 mb-8 uppercase tracking-wider">
                  The Opsly HR Solution
                </h4>
                
                <div className="space-y-6">
                  {[
                    "Targeted Talent Acquisition",
                    "End-to-end Workforce Management",
                    "Dedicated Team Building",
                    "Operational Support Systems"
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
                      We don't just provide people. <br />We deliver operational capacity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OPSly Academy Section (NEW) ────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-slate-50 relative overflow-hidden font-inter border-t border-slate-200 px-2 sm:px-6">
        <div className="w-full px-6 md:px-12 lg:px-24 2xl:px-32 mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 text-blue-600 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase shadow-sm">
                Skill Validation & Training
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.15]">
                Opsly Academy: Bridging the <br />
                <span className="text-slate-400">Operational Skill Gap.</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
                We don't just place talent; we build them. Our academy provides structured training and certification to ensure our professionals stay at the forefront of global operational standards.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                {[
                  { title: "Functional Training", desc: "Scenario-based operational learning." },
                  { title: "Tool Certification", desc: "Proficiency in global enterprise tools." },
                  { title: "Performance Coaching", desc: "Ongoing development for placed talent." },
                  { title: "Global Standards", desc: "Alignment with international best practices." }
                ].map((feature, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      {feature.title}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <Button size="lg" className="h-14 px-10 text-sm bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-xl shadow-slate-900/10">
                  Explore Academy Programs <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full"
            >
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-white aspect-video lg:min-h-[440px]">
                {/* BLENDING EFFECT: Image fades into the background */}
                <div 
                  className="w-full h-full transition-transform duration-700 hover:scale-[1.02]"
                  style={{
                    backgroundImage: 'url("/images/academy-dashboard-v2.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'top left',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%), linear-gradient(to right, black 95%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%), linear-gradient(to right, black 95%, transparent 100%)'
                  }}
                />
                
                {/* Subtle Overlay Decoration */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/20 to-transparent pointer-events-none" />
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white border border-slate-100 p-6 rounded-3xl shadow-xl animate-bounce-subtle z-20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Talent Growth</p>
                    <p className="text-base font-bold text-slate-900">+45% Efficiency Increase</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* VETTING ENGINE SECTION (ENTERPRISE GRADE) */}
      <section className="py-24 px-2 sm:px-6 bg-white font-inter border-b border-slate-200 overflow-hidden">
        <div className="w-full px-6 md:px-12 lg:px-24 2xl:px-32 mx-auto">
          {/* Header */}
          <div className="mb-16 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4 tracking-tight">
              The OpslyHR Vetting Engine
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
      <section className="py-24 px-2 sm:px-6 bg-white font-inter">
        <div className="w-full px-6 md:px-12 lg:px-24 2xl:px-32 mx-auto">
          {/* Header */}
          <div className="text-left md:text-center max-w-2xl mx-auto mb-20 animate-slide-up">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Service Models</div>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-6 leading-tight tracking-tight">
              Choose the Right Engagement Model
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Each model is structured around operational control, cost clarity, and flexibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Direct Hire",
                desc: "One-Time Fee. The client hires the talent permanently. OpslyHR handles sourcing, screening, and placement.",
                traits: [
                  "15–20% of annual salary",
                  "3 shortlisted profiles in 5–7 days",
                  "90-day replacement guarantee",
                  "Best for C-level & internal HR teams"
                ],
                recommended: false,
                accent: "border-t-slate-400"
              },
              {
                title: "Trial-to-Hire",
                desc: "Low Risk Entry. Engage talent for 30–90 days. If it works out, convert to permanent or ongoing managed contract.",
                traits: [
                  "$800–$2,500/mo + conversion fee",
                  "30-day minimum trial",
                  "OpslyHR employs talent during trial",
                  "No obligation if not converted"
                ],
                recommended: true,
                accent: "border-t-blue-600"
              },
              {
                title: "Managed Teams",
                desc: "Highest Lifetime Value. We build, manage, and support a dedicated operational team. We handle HR and performance.",
                traits: [
                  "$1,200–$6,000 per member/mo",
                  "Dedicated team members assigned exclusively",
                  "Monthly performance reporting & KPIs",
                  "Quarterly business reviews for large teams"
                ],
                recommended: false,
                accent: "border-t-emerald-500"
              },
              {
                title: "Offshore Hiring Support",
                desc: "Employer of Record. For clients who want to hire African talent directly but need compliant employment infrastructure.",
                traits: [
                  "$200–$600 per employee/mo (EOR fee)",
                  "Locally compliant employment contracts",
                  "Monthly payroll, tax & pension processing",
                  "IP and data protection clauses"
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
                className={`relative bg-white rounded-[12px] border-l border-r border-b border-slate-200 border-t-2 ${model.accent} p-6 lg:p-8 flex flex-col h-full hover:shadow-md transition-shadow duration-300`}
              >
                {model.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Recommended
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-lg lg:text-xl font-bold text-slate-900 mb-3">{model.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {model.desc}
                  </p>
                </div>

                <div className="space-y-4 mb-8 flex-grow">
                  {model.traits.map((trait, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <div className="w-1 h-1 rounded-full bg-slate-300 mt-2 flex-shrink-0" />
                      <span className="text-xs lg:text-sm text-slate-600 font-medium">{trait}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <Link 
                    to="/book-consultation"
                    className="group inline-flex items-center gap-2 text-sm font-bold text-slate-950 hover:text-blue-600 transition-colors"
                  >
                    Learn more
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.5. OPERATIONAL PERFORMANCE — REDESIGNED DATA-DRIVEN SECTION */}
      <section className="py-24 px-2 sm:px-6 bg-white font-inter">
        <div className="w-full px-6 md:px-12 lg:px-24 2xl:px-32 mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Column: Metrics Grid */}
            <div className="animate-slide-up">
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-6 leading-tight tracking-tight">
                Operational Performance, Measured.
              </h2>
              <p className="text-base text-slate-600 mb-12 leading-relaxed max-w-lg">
                OpslyHR replaces guesswork with structured vetting, automated contracts, and transparent billing.
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
                {/* Dashboard Image */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <img 
                    src="/images/operations_dashboard.png" 
                    alt="Operations Dashboard" 
                    className="w-full h-auto object-cover rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-800"
                  />
                </div>                {/* Floating Labels */}
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
      <section className="py-24 px-2 sm:px-6 bg-slate-50 font-inter">
        <div className="w-full px-6 md:px-12 lg:px-24 2xl:px-32 mx-auto">
          {/* Header */}
          <div className="max-w-3xl mb-24 animate-slide-up text-left">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">How It Works</div>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-6 leading-tight tracking-tight">
              Structured Hiring, Step by Step
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              From role definition to payment processing, OpslyHR manages the entire talent lifecycle.
            </p>
          </div>

          <div className="relative pl-8 sm:pl-20">
            {/* Vertical Dotted Line */}
            <div className="absolute left-2 sm:left-6 top-0 bottom-0 w-px border-l-[1.5px] border-dotted border-slate-300"></div>

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
                  <div className="absolute -left-[29px] sm:-left-[59px] top-6 w-3 h-3 rounded-full bg-slate-300 border-2 border-slate-50 z-10 group-hover:bg-primary transition-colors duration-300"></div>
                  
                  {/* Content Card */}
                  <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-default w-full">
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
      <section className="py-24 px-2 sm:px-6 bg-blue-50/50 font-inter overflow-hidden">
        <div className="w-full px-6 md:px-12 lg:px-24 2xl:px-32 mx-auto">
          {false && (
            <>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-left md:text-center mb-16"
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
              {loadingTalent ? (
                <div className="flex items-center justify-center w-full py-20">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              ) : vettedTalent.length > 0 ? (
                // Combine original and many duplicates for seamless loop
                Array(20).fill(vettedTalent).flat().map((talent, i) => {
                  const initials = talent.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  
                  const bgColors = [
                    'bg-blue-100 text-blue-700',
                    'bg-indigo-100 text-indigo-700',
                    'bg-emerald-100 text-emerald-700',
                    'bg-slate-100 text-slate-700',
                    'bg-amber-100 text-amber-700'
                  ];
                  const bgColor = bgColors[i % bgColors.length];

                  return (
                    <div key={i} className="flex-shrink-0 w-[300px] bg-white rounded-2xl p-6 border border-slate-200 shadow-md">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border border-white shadow-sm ${bgColor}`}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm truncate w-32">{talent.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium truncate w-32">{talent.role}</div>
                        </div>
                      </div>
                      <div className="flex gap-1 mb-4">
                        {talent.tags.map(tag => (
                          <span key={tag} className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[8px] font-bold border border-slate-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider">Timezone</span>
                          <span className="text-[10px] font-bold text-slate-600">{talent.tz}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider">Experience</span>
                          <span className="text-[10px] font-bold text-slate-600">{talent.exp}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Fallback to placeholders if no data
                [1,2,3,4,5,6].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[300px] bg-white rounded-2xl p-6 border border-slate-100 shadow-sm opacity-50">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                        <div className="h-2 w-24 bg-slate-100 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </div>
            </>
          )}

          {/* Hire CTA Button */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mt-16"
          >
            <a href={getZoneUrl(Zone.AUTH, "/auth/signup/talent")}>
              <Button size="lg" className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-200 transition-all font-bold text-base flex items-center gap-3">
                Apply as Talent <ArrowRight className="w-5 h-5" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>



      {/* 9. CLIENT RESULTS — REDESIGNED TESTIMONIAL SECTION */}
      <section className="py-24 px-2 sm:px-6 bg-white font-inter">
        <div className="w-full px-6 md:px-12 lg:px-24 2xl:px-32 mx-auto">
          {/* Header */}
          <div className="text-left md:text-center max-w-2xl mx-auto mb-20 animate-slide-up">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Client Results</div>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-6 leading-tight tracking-tight">
              Trusted by Growth-Focused Teams
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Companies across SaaS and fintech rely on OpslyHR for structured talent engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "“OpslyHR completely transformed our hiring process. We scaled operations seamlessly with the exact right fit, avoiding the usual recruitment headaches.”",
                badge: "Operations Scaling",
                name: "Daniel Aniakor",
                role: "Founder",
                company: "Skeduley (Ontario Canada)"
              },
              {
                quote: "“The quality of talent we got through OpslyHR was exceptional. They didn't just understand the brief; they brought an operational rigor that elevated our internal processes.”",
                badge: "Top-Tier Talent Quality",
                name: "Nelson",
                role: "Operations Lead",
                company: "Meerge (Africa)"
              },
              {
                quote: "“Partnering with OpslyHR felt like an extension of our own team. They handled the heavy lifting of sourcing and vetting, delivering candidates who hit the ground running from day one.”",
                badge: "Frictionless Integration",
                name: "Ushingio",
                role: "Leadership",
                company: "Megadel (Nigeria)"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all duration-300 flex flex-col h-full w-full"
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

      <CommunityCTA />
    </div>
  );
};


export default Index;
