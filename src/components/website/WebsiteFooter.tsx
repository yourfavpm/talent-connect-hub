import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Mail, MapPin } from "lucide-react";

const WebsiteFooter = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-24 pb-12 font-inter">
      <div className="container px-6 mx-auto max-w-[1200px]">
        <div className="grid lg:grid-cols-12 gap-16 mb-20">
          
          {/* Brand & Mission Block */}
          <div className="lg:col-span-4 space-y-8">
            <Link to="/" className="inline-block">
              <img src="/images/logoplain.png" alt="OPSlyHR" className="h-24 w-auto" />
            </Link>
            <p className="text-base text-slate-500 leading-relaxed font-medium max-w-sm">
              OPSlyHR connects vetted product and operations professionals across EMEA with growth-focused companies globally.
            </p>
            <div className="flex gap-4">
              {[
                { icon: Twitter, href: "#" },
                { icon: Linkedin, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Facebook, href: "#" }
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* For Companies */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-bold text-slate-950 uppercase tracking-widest">For Companies</h4>
              <ul className="space-y-3">
                {[
                  { label: "Direct Hire", to: "/direct-hire" },
                  { label: "Trial-to-Hire", to: "/trial-to-hire" },
                  { label: "One-Time Projects", to: "/project-engagement" },
                  { label: "Offshore Hiring", to: "/offshore-hiring" },
                  { label: "Book Consultation", to: "/book-consultation" }
                ].map((link, i) => (
                  <li key={i}>
                    <Link to={link.to} className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Professionals */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-bold text-slate-950 uppercase tracking-widest">For Professionals</h4>
              <ul className="space-y-3">
                {[
                  { label: "Apply as Talent", to: "/auth/signup?portal=talent" },
                  { label: "Vetting Process", to: "/vetting-process" },
                  { label: "Talent Dashboard", to: "/auth/login?portal=talent" },
                  { label: "Opportunities", to: "/auth/signup?portal=talent" },
                  { label: "Support", to: "/contact" }
                ].map((link, i) => (
                  <li key={i}>
                    <Link to={link.to} className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-bold text-slate-950 uppercase tracking-widest">Company</h4>
              <ul className="space-y-3">
                {[
                  { label: "About", to: "/about" },
                  { label: "Careers", to: "/careers" },
                  { label: "Partners", to: "/partners" },
                  { label: "Insights", to: "/insights" },
                  { label: "Case Studies", to: "/case-studies" }
                ].map((link, i) => (
                  <li key={i}>
                    <Link to={link.to} className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-bold text-slate-950 uppercase tracking-widest">Legal</h4>
              <ul className="space-y-3">
                {[
                  { label: "Terms", to: "/terms" },
                  { label: "Privacy", to: "/privacy" },
                  { label: "Cookie Policy", to: "/cookies" },
                  { label: "Compliance", to: "/compliance" }
                ].map((link, i) => (
                  <li key={i}>
                    <Link to={link.to} className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="pt-12 border-t border-slate-200 grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">hire@opslyhr.com</span>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-slate-500 leading-relaxed">
              167 Lombard Ave, Winnipeg, MB R3B 0V3, Canada
            </span>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-slate-500 leading-relaxed">
              44, Commercial Avenue, Yaba, Lagos, Nigeria
            </span>
          </div>
        </div>

        {/* Copyright & Status */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-100">
          <p className="text-[13px] text-slate-400 font-medium">
            © {new Date().getFullYear()} OPSlyHR HR Solutions. All rights reserved.
          </p>
          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default WebsiteFooter;
