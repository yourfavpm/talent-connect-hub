import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Mail, MapPin } from "lucide-react";
import { Zone, getZoneUrl, getInternalPath } from "@/utils/subdomain";
import Logo from "@/components/Logo";

const AcademyFooter = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 py-16 font-inter">
            <div className="container px-6 mx-auto max-w-[1200px]">
                <div className="grid lg:grid-cols-12 gap-12 mb-16">
                    
                    {/* Brand & Mission Block */}
                    <div className="lg:col-span-4 space-y-6">
                        <Link to="/" className="inline-block">
                            <Logo showText={false} imgHeight="h-7" className="brightness-0 invert" />
                        </Link>
                        <p className="text-xs text-slate-400 leading-relaxed font-light max-w-sm">
                            OPSly Academy is a career-accelerating learning ecosystem designed to equip African operations professionals with high-income skills and connect them to global remote opportunities.
                        </p>
                        <div className="flex gap-3">
                            {[
                                { icon: Linkedin, href: "https://www.linkedin.com/company/opslyhr/" },
                                { icon: Twitter, href: "https://x.com/opslyhr?s=21" },
                                { icon: Instagram, href: "https://www.instagram.com/opslyhr?igsh=MTJhOXhzdXY3eTczMA==" }
                            ].map((social, i) => (
                                <a 
                                    key={i} 
                                    href={social.href} 
                                    className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500 transition-all"
                                >
                                    <social.icon className="h-3.5 w-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>
         
                    {/* Navigation Links Grid */}
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                        {/* Academy */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Academy</h4>
                            <ul className="space-y-2">
                                {[
                                    { label: "Home", to: "/" },
                                    { label: "All Courses", to: "/courses" },
                                    { label: "Talent Marketplace", to: "/marketplace" },
                                    { label: "Apply Now", to: "/apply" },
                                ].map((link, i) => (
                                    <li key={i}>
                                        {link.to.startsWith("http") ? (
                                            <a href={link.to} className="text-xs text-slate-400 hover:text-blue-400 font-medium transition-colors">
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link to={link.to} className="text-xs text-slate-400 hover:text-blue-400 font-medium transition-colors">
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
         
                        {/* OPSly HR Ecosystem */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Ecosystem</h4>
                            <ul className="space-y-2">
                                {[
                                    { label: "Main Site", href: getZoneUrl(Zone.MARKETING) },
                                    { label: "Hire Talent", href: getZoneUrl(Zone.MARKETING, "/for-companies") },
                                    { label: "Talent Portal", href: getZoneUrl(Zone.TALENT) },
                                    { label: "Vetting Process", href: getZoneUrl(Zone.MARKETING, "/vetting-process") },
                                ].map((link, i) => (
                                    <li key={i}>
                                        <a href={link.href} className="text-xs text-slate-400 hover:text-blue-400 font-medium transition-colors">
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
         
                        {/* Legal & Support */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Support</h4>
                            <ul className="space-y-2">
                                {[
                                    { label: "FAQs", to: getInternalPath("/courses") },
                                    { label: "Contact Us", to: getInternalPath("/apply") },
                                    { label: "Privacy Policy", to: getZoneUrl(Zone.MARKETING, "/privacy") },
                                    { label: "Terms of Service", to: getZoneUrl(Zone.MARKETING, "/terms") }
                                ].map((link, i) => (
                                    <li key={i}>
                                        {link.to.startsWith("http") ? (
                                            <a href={link.to} className="text-xs text-slate-400 hover:text-blue-400 font-medium transition-colors">
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link to={link.to} className="text-xs text-slate-400 hover:text-blue-400 font-medium transition-colors">
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
         
                {/* Copyright & Info */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-800">
                    <p className="text-[11px] text-slate-500 font-medium">
                        © {new Date().getFullYear()} OPSly Academy. Powered by <a href={getZoneUrl(Zone.MARKETING)} className="text-slate-400 hover:text-white transition-colors">OpslyHR</a>.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-blue-500" />
                            <span className="text-[10px] font-semibold text-slate-500">academy@opslyhr.com</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-800 border border-slate-700 rounded-full">
                            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Global Network Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default AcademyFooter;
