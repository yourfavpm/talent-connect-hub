import { Link, useLocation } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search, Home, LayoutDashboard, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NotFound = () => {
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-white font-inter text-slate-900 flex flex-col relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
            </div>

            <main className="flex-grow flex items-center justify-center px-6 py-20 relative z-10">
                <div className="container max-w-[800px] mx-auto text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-start"
                    >
                        {/* Visual Element: Minimal Network Diagram */}
                        <div className="mb-12 flex justify-start">
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="relative w-32 h-32"
                            >
                                <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="64" cy="64" r="8" className="fill-slate-900" />
                                    <circle cx="20" cy="30" r="6" className="fill-slate-200" />
                                    <circle cx="108" cy="30" r="6" className="fill-slate-200" />
                                    <circle cx="20" cy="98" r="6" className="fill-slate-200" />
                                    <circle cx="108" cy="98" r="6" className="fill-slate-900" />
                                    
                                    <path d="M64 56L20 36" className="stroke-slate-100" strokeWidth="1.5" strokeDasharray="4 4" />
                                    <path d="M64 56L108 36" className="stroke-slate-100" strokeWidth="1.5" strokeDasharray="4 4" />
                                    <path d="M64 72L20 92" className="stroke-slate-100" strokeWidth="1.5" strokeDasharray="4 4" />
                                    <path d="M64 72L108 92" className="stroke-slate-900" strokeWidth="1.5" />
                                    
                                    <rect x="52" y="52" width="24" height="24" rx="4" stroke="#0F172A" strokeWidth="1.5" className="fill-white" />
                                    <text x="64" y="68" textAnchor="middle" className="text-[10px] font-bold fill-slate-900">404</text>
                                </svg>
                            </motion.div>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">
                            404 — This Page Drifted Off Course.
                        </h1>
                        <p className="text-lg text-slate-600 mb-12 font-medium leading-relaxed max-w-lg">
                            Even well-structured systems have dead ends. Let’s get you back on track.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-start gap-4 mb-16">
                            <Button 
                                className="h-12 px-8 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-bold transition-all shadow-none w-full sm:w-auto"
                                asChild
                            >
                                <Link to={getInternalPath("/")}>
                                   <LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard
                                </Link>
                            </Button>
                            <Button 
                                variant="outline"
                                className="h-12 px-8 text-sm rounded-lg border-[1.5px] border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all shadow-none w-full sm:w-auto"
                                asChild
                            >
                                <Link to="/">
                                    <Home className="mr-2 h-4 w-4" /> Return Home
                                </Link>
                            </Button>
                        </div>

                        <div className="inline-block mb-16 px-4 py-2 border-b border-slate-100">
                            <Link to="/service-models" className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors inline-flex items-center group">
                                Browse Engagement Models <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {/* Smart Touch: Minimal Search */}
                        <div className="max-w-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Looking for something specific?</p>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                <Input 
                                    type="text"
                                    placeholder="Try searching or contact support..."
                                    className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-slate-900 focus-visible:ring-offset-0 transition-all text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Minimal Footer */}
            <footer className="py-12 px-8 border-t border-slate-100 relative z-10">
                <div className="container max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="text-xl font-bold tracking-tight text-slate-900">OPSlyHR</Link>
                        <span className="text-[13px] text-slate-400 font-medium">
                            © {new Date().getFullYear()} OPSlyHR HR Solutions.
                        </span>
                    </div>
                    <Link to="/support" className="text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-2 transition-colors group">
                        <Mail className="h-4 w-4" /> Contact Support
                    </Link>
                </div>
            </footer>
        </div>
    );
};

export default NotFound;
