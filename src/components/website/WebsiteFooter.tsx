import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Mail, MapPin } from "lucide-react";
import { Zone, getZoneUrl } from "@/utils/subdomain";
import Logo from "@/components/Logo";

const WebsiteFooter = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8 font-inter">
      <div className="container px-6 mx-auto max-w-[1200px]">
        <div className="grid lg:grid-cols-12 gap-12 mb-16">
          
          {/* Brand & Mission Block */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="inline-block">
              <Logo showText={false} imgHeight="h-7" />
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed font-medium max-w-sm">
              OpslyHR connects vetted product and operations professionals across EMEA with growth-focused companies globally.
            </p>
            <div className="flex gap-4">
                {[
                  { icon: Linkedin, href: "https://www.linkedin.com/company/opslyhr/" },
                  { icon: Twitter, href: "https://x.com/opslyhr?s=21" },
                  { icon: Instagram, href: "https://www.instagram.com/opslyhr?igsh=MTJhOXhzdXY3eTczMA==" },
                ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-xs transition-all"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
 
          {/* Navigation Links Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-12 gap-y-12">
            {/* For Companies */}
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-slate-950 uppercase tracking-widest">For Companies</h4>
              <ul className="space-y-3">
                {[
                  { label: "Hire Talent", href: getZoneUrl(Zone.AUTH, "/auth/signup/client") },
                  { label: "Direct Hire", to: "/direct-hire" },
                  { label: "Trial-to-Hire", to: "/trial-to-hire" },
                  { label: "One-Time Projects", to: "/project-engagement" },
                  { label: "Book Consultation", to: "/book-consultation" }
                ].map((link, i) => (
                  <li key={i}>
                    {link.href ? (
                      <a href={link.href} className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to!} className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
 
            {/* For Professionals */}
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-slate-950 uppercase tracking-widest">For Professionals</h4>
              <ul className="space-y-3">
                {[
                  { label: "Apply as Talent", href: getZoneUrl(Zone.AUTH, "/auth/signup/talent") },
                  { label: "Opsly Academy", href: getZoneUrl(Zone.ACADEMY, "/") },
                  { label: "Vetting Process", to: "/vetting-process" },
                  { label: "Talent Dashboard", href: getZoneUrl(Zone.AUTH, "/auth/login?portal=talent") },
                  { label: "Opportunities", href: getZoneUrl(Zone.AUTH, "/auth/signup/talent") }
                ].map((link, i) => (
                  <li key={i}>
                    {link.href ? (
                      <a href={link.href} className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to!} className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Roles */}
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-slate-950 uppercase tracking-widest">Roles</h4>
              <ul className="space-y-3">
                {[
                  "Product Operations",
                  "Revenue Operations",
                  "Business Operations",
                  "Sales Operations",
                  "Marketing Operations",
                  "Customer Success Ops"
                ].map((role, i) => (
                  <li key={i} className="text-sm text-slate-400 font-medium">
                    {role}
                  </li>
                ))}
              </ul>
            </div>

            {/* Programs */}
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-slate-950 uppercase tracking-widest">Programs</h4>
              <ul className="space-y-3">
                {[
                  { label: "Operations Bootcamp", href: getZoneUrl(Zone.ACADEMY, "/browse") },
                  { label: "Leadership Accelerator", href: getZoneUrl(Zone.ACADEMY, "/browse") },
                  { label: "Vetted Talent Program", to: "/vetting-process" },
                  { label: "Specialized Projects", to: "/project-engagement" }
                ].map((link, i) => (
                  <li key={i}>
                    {link.href ? (
                      <a href={link.href} className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to!} className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
 
            {/* Company */}
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-slate-950 uppercase tracking-widest">Company</h4>
              <ul className="space-y-3">
                {[
                  { label: "About", to: "/about" },
                  { label: "Careers", to: "/careers" },
                  { label: "Insights", to: "/insights" }
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
        <div className="pt-8 border-t border-slate-200 grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-semibold text-slate-700">hire@opslyhr.com</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-3 w-3 text-blue-600 shrink-0 mt-0.5" />
            <span className="text-[10px] font-semibold text-slate-500 leading-relaxed">
              167 Lombard Ave, Winnipeg, Canada
            </span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-3 w-3 text-blue-600 shrink-0 mt-0.5" />
            <span className="text-[10px] font-semibold text-slate-500 leading-relaxed">
              44, Commercial Avenue, Yaba, Lagos
            </span>
          </div>
        </div>
 
        {/* Copyright & Status */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">
            © {new Date().getFullYear()} OpslyHR. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white border border-slate-100 rounded-full shadow-xs">
            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
 
export default WebsiteFooter;
