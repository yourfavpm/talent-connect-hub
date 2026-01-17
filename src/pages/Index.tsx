
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Clock, Globe, Shield, Users, Zap, Briefcase, Layout, CreditCard, Search, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";

const Index = () => {
  return (
    <div className="bg-background min-h-screen text-foreground overflow-x-hidden selection:bg-primary selection:text-white font-sans">

      {/* 2. HERO SECTION */}
      <section className="relative py-20 lg:py-32 px-6 overflow-hidden bg-white border-b border-blue-100">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-white pointer-events-none"></div>
        <div className="container max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left-aligned headline and subtext */}
          <div className="text-left animate-slide-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1] font-display text-blue-950">
              Power Your Growth with <span className="text-blue-950">Expert Product & Operations</span> Talent
            </h1>

            <p className="text-xl text-blue-900/70 mb-10 max-w-lg font-serif leading-relaxed">
              Match with rigorously vetted professionals — then collaborate, contract, and scale with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/book-consultation">
                <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-200 transition-all">
                  Book a Consultation
                </Button>
              </Link>
              <Link to="/auth/signup?type=talent">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-slate-200 text-slate-700 hover:text-white hover:bg-blue-950 rounded-full bg-white">
                  Apply as Talent
                </Button>
              </Link>
            </div>
          </div>

          {/* Right-aligned Talent Profile Cards */}
          <div className="relative animate-fade-in hidden lg:block h-[500px]">
            {/* Card 1: Product Leader */}
            <div className="absolute top-10 right-10 z-20 w-[340px] bg-white rounded-2xl p-5 shadow-2xl shadow-blue-900/10 border border-blue-50 rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-4 mb-4 border-b border-blue-50 pb-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80" alt="Sarah" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-blue-950 text-lg">Sarah J.</div>
                  <div className="text-slate-500 text-sm font-medium">Head of Product</div>
                </div>
                <div className="ml-auto">
                  <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">Available</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-semibold">Fintech</span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-semibold">Growth</span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-semibold">B2B SaaS</span>
                </div>
              </div>
            </div>

            {/* Card 2: Operations Expert (Behind) */}
            <div className="absolute top-48 right-40 z-10 w-[340px] bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-xl shadow-blue-900/5 border border-blue-50 rotate-[4deg]">
              <div className="flex items-center gap-4 mb-4 border-b border-blue-50 pb-4 opacity-50">
                <div className="w-14 h-14 rounded-full bg-blue-100 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80" alt="Michael" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-blue-950 text-lg">Michael T.</div>
                  <div className="text-slate-500 text-sm font-medium">Dir. of Operations</div>
                </div>
              </div>
              <div className="space-y-2 opacity-50">
                <div className="h-2 w-full bg-blue-100 rounded"></div>
                <div className="h-2 w-2/3 bg-blue-100 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUST & CREDIBILITY */}
      <section className="py-12 border-b border-slate-200 bg-white">
        <div className="container max-w-7xl mx-auto text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Trusted by Global Teams and Growing Enterprises</p>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">Streamlining hiring and operations across industries</p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Logos Placeholders */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 flex items-center justify-center">
                <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHAT WE OFFER — SERVICE MODEL PREVIEW */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display text-primary">Tailored Engagement Models</h2>
            <p className="text-slate-600 font-serif max-w-2xl mx-auto">Flexible structures designed for speed, compliance, and mutual success.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* 1. Trial-to-Hire */}
            <div className="bg-white border border-slate-200 p-8 rounded-3xl flex flex-col hover:border-blue-950 hover:shadow-xl transition-all group h-full">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-950 transition-colors">
                <Clock className="h-7 w-7 text-slate-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary">Trial-to-Hire</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed flex-grow">
                Evaluate candidates with a 3-month contract before converting to full-time. Reduce risk, ensure fit.
              </p>
              <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-blue-950 hover:text-white" asChild>
                <Link to="/service-models">Start Trial</Link>
              </Button>
            </div>

            {/* 2. Full-Time Hire */}
            <div className="bg-white border border-slate-200 p-8 rounded-3xl flex flex-col hover:border-blue-950 hover:shadow-xl transition-all group h-full">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-950 transition-colors">
                <Users className="h-7 w-7 text-slate-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary">Direct Placement</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed flex-grow">
                Traditional executive search for core leadership roles. Includes 1-year guarantee and replacement.
              </p>
              <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-blue-950 hover:text-white" asChild>
                <Link to="/service-models">Find Leaders</Link>
              </Button>
            </div>

            {/* 3. Managed Teams */}
            <div className="bg-white border border-slate-200 p-8 rounded-3xl flex flex-col hover:border-blue-950 hover:shadow-xl transition-all group h-full">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-950 transition-colors">
                <Shield className="h-7 w-7 text-slate-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary">Managed Teams</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed flex-grow">
                We act as the Employer of Record (EOR). Payroll, compliance, and benefits handled globally.
              </p>
              <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-blue-950 hover:text-white" asChild>
                <Link to="/service-models">Learn More</Link>
              </Button>
            </div>

            {/* 4. One-Time Gigs */}
            <div className="bg-white border border-slate-200 p-8 rounded-3xl flex flex-col hover:border-blue-950 hover:shadow-xl transition-all group h-full">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-950 transition-colors">
                <Zap className="h-7 w-7 text-slate-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary">Project Gigs</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed flex-grow">
                Surgical strikes. Audits, migrations, or launches that need deep expertise delivered now.
              </p>
              <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-blue-950 hover:text-white" asChild>
                <Link to="/service-models">Find Experts</Link>
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* 4.5. IMPACT SECTION - Clean, High Performance, No "AI" look */}
      <section className="py-24 px-6 border-y border-slate-200">
        <div className="container max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 leading-tight text-primary">
                Precision hiring.<br />
                <span className="text-blue-600">Quantifiable results.</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8 max-w-md">
                We replace guesswork with rigor. Our vetted network allows you to skip the noise and focus on building.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-1">48h</div>
                    <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Average Time to Shortlist</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-1">98%</div>
                    <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Successful Placement Rate</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Abstract Visual - Clean Geometry, No Blurs */}
              <div className="aspect-square relative md:w-[500px] mx-auto">
                <div className="absolute inset-0 bg-slate-50 rounded-full"></div>
                <div className="absolute inset-4 border border-slate-100 rounded-full animate-[spin_60s_linear_infinite]"></div>
                <div className="absolute inset-1/4 bg-white shadow-xl rounded-2xl flex items-center justify-center p-8 border border-slate-100">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary mb-2">3.5x</div>
                    <div className="text-slate-500 text-sm">Faster than internal hiring</div>
                  </div>
                </div>
                {/* Floating Cards */}
                <div className="absolute top-10 -right-4 bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 animate-bounce-slow">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div className="text-sm font-bold text-slate-700">Role Filled</div>
                </div>
                <div className="absolute bottom-20 -left-4 bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 animate-bounce-slow delay-700">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div className="text-sm font-bold text-slate-700">Candidate Verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS — PROCESS BREAKDOWN */}
      <section className="py-24 px-6 bg-white border-y border-slate-200">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display text-primary">How Taskive Works for You</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-slate-100 -z-10"></div>

            {[
              { title: "Tell Us Your Needs", desc: "Share your objectives and requirements.", icon: Briefcase },
              { title: "Match with Vetted Experts", desc: "Get paired with pre-screened professionals.", icon: UserCheck },
              { title: "Collaborate & Contract", desc: "Flexible engagement models tailored to your goals.", icon: Layout },
              { title: "Focus on Growth", desc: "We handle compliance, payments, and support.", icon: TrendingUp }
            ].map((step, i) => (
              <div key={i} className="text-center bg-white p-4">
                <div className="w-24 h-24 mx-auto bg-white border border-slate-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <step.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-primary">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. WHY CHOOSE TASKIVE */}
      <section className="py-24 px-6 bg-slate-900 text-white">
        <div className="container max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 font-display">Built for Business,<br />Backed by Results</h2>
            <div className="space-y-8 mt-12">
              {[
                { title: "Pre-Vetted Talent Pool", desc: "Access specialists in product and operations." },
                { title: "Speed & Reliability", desc: "Average placement time faster than traditional hiring." },
                { title: "Operational Support", desc: "Dedicated process and platform support." },
                { title: "Global Reach, Local Expertise", desc: "Connect with talent locally and globally." }
              ].map((feat, i) => (
                <div key={i} className="flex gap-4">
                  <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-bold mb-1">{feat.title}</h4>
                    <p className="text-slate-400">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[500px] bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 group">
            <div className="absolute inset-0 bg-blue-950/20 z-0"></div>
            <img
              src="/images/talent-pipeline.png"
              alt="Taskive Talent Pipeline"
              className="w-full h-full object-cover object-top hover:scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-900 to-transparent">
              <div className="text-white font-bold text-lg">Intelligent Matching Engine</div>
              <div className="text-slate-300 text-sm">Real-time candidate tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. VALUE PROPOSITION BLOCK / PRODUCT FEATURES */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="container max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-16 font-display text-primary">Empower Your Team From Hire to Success</h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: "Find", desc: "Access a curated pool of qualified professionals.", icon: Search },
              { title: "Hire", desc: "Select with confidence; we support contracts and compliance.", icon: UserCheck },
              { title: "Manage", desc: "Track engagement progress and collaboration seamlessly.", icon: Layout },
              { title: "Pay", desc: "Secure and transparent payment workflows.", icon: CreditCard }
            ].map((item, i) => (
              <div key={i} className="group relative p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-primary">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PORTAL PROMOTIONS */}
      <section className="py-24 px-6 bg-slate-50 border-t border-slate-200">
        <div className="container max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Talent Portal */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-start text-left hover:border-blue-950 transition-colors overflow-hidden group">
              <div className="p-12 pb-0 relative z-10">
                <div className="px-4 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full mb-6 inline-block">TALENT PORTAL</div>
                <h3 className="text-3xl font-bold mb-4 text-primary">Do your work, hassle-free</h3>
                <p className="text-slate-600 mb-8 max-w-md text-lg">Connect with companies that value your expertise. Manage work and opportunities with ease.</p>
                <Button variant="outline" size="lg" className="border-slate-200 text-slate-700 hover:text-white hover:bg-blue-950 mb-12" asChild>
                  <Link to="/auth/signup?type=talent">Apply as Talent</Link>
                </Button>
              </div>
              <div className="mt-auto w-full px-12 pb-12">
                <div className="rounded-t-xl overflow-hidden shadow-2xl border border-slate-200 translate-y-6 group-hover:translate-y-2 transition-transform duration-500">
                  <img src="/images/talent-dashboard.png" alt="Talent Dashboard" className="w-full h-auto object-cover" />
                </div>
              </div>
            </div>

            {/* Client Portal */}
            <div className="bg-blue-950 text-white rounded-3xl shadow-xl flex flex-col items-start text-left relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full"></div>
              <div className="p-12 pb-0 relative z-10 w-full flex flex-col items-start">
                <div className="px-4 py-1 bg-white/10 text-white text-xs font-bold rounded-full mb-6 inline-block">CLIENT PORTAL</div>
                <h3 className="text-3xl font-bold mb-4">Build your team, simplified</h3>
                <p className="text-blue-100 mb-8 max-w-md text-lg">Find, manage, and collaborate with elite talent — all in one place.</p>
                <Button size="lg" className="bg-white text-blue-950 hover:bg-slate-100 border-none mb-12" asChild>
                  <Link to="/book-consultation">Book Consultation</Link>
                </Button>
              </div>
              <div className="mt-auto w-full px-12 pb-12 relative z-10">
                <div className="rounded-t-xl overflow-hidden shadow-2xl border border-blue-800/50 translate-y-6 group-hover:translate-y-2 transition-transform duration-500">
                  <img src="/images/client-dashboard.png" alt="Client Dashboard" className="w-full h-auto object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. TESTIMONIALS */}
      <section className="py-24 px-6 bg-white">
        <div className="container max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-primary font-display">What Our Clients Say</h2>
          <div className="relative bg-slate-50 p-12 rounded-3xl border border-slate-100">
            <div className="text-6xl text-blue-200 font-serif absolute top-8 left-8">"</div>
            <p className="text-2xl md:text-3xl font-serif text-slate-700 leading-relaxed mb-8 relative z-10">
              We hired multiple professionals through Taskive — exceptional talent and continued support every step of the way.
            </p>
            <div>
              <div className="font-bold text-primary">CEO</div>
              <div className="text-slate-500 text-sm">Kemuko Technologies</div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. NEWSLETTER */}
      <section className="py-24 px-6 bg-slate-900 text-white text-center">
        <div className="container max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display">Join Our Talent Network</h2>
          <p className="text-slate-400 mb-10 text-xl">Be the first to access exclusive opportunities and insights.</p>

          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <Input
              type="email"
              placeholder="Enter your email"
              className="h-14 bg-white/10 border-white/10 text-white placeholder:text-slate-500 rounded-full px-6 focus:ring-blue-500"
            />
            <Button size="lg" className="h-14 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white">
              Subscribe
            </Button>
          </div>
          <Link to="/auth/signup?type=talent" className="text-slate-400 hover:text-white underline underline-offset-4 text-sm">
            Or apply directly as talent &rarr;
          </Link>
        </div>
      </section>

    </div>
  );
};

// Icon imports need to be added to top
import { TrendingUp } from "lucide-react";

export default Index;
