import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zone, getZoneUrl } from "@/utils/subdomain";

const AcademyNavbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCoursesOpen, setIsCoursesOpen] = useState(false);
    
    const location = useLocation();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const NavLinks = [
        { name: "Home", path: "/" },
        { name: "Courses", path: "/courses" },
        { name: "Talent Marketplace", path: "/marketplace" },
    ];

    // Close mobile menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    return (
        <nav className="fixed top-0 z-[100] w-full bg-white border-b border-slate-100 font-inter">
            <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-[72px] flex items-center justify-between">
                
                {/* Left: Logo */}
                <Link to="/" className="flex items-center shrink-0 p-2 lg:p-0 transition-transform hover:scale-[1.02]">
                    <img src="/images/logoplain.png" alt="OPSly Academy" className="h-32 drop-shadow-xl shadow-lg" />
                    <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded tracking-tighter uppercase">Academy</span>
                </Link>

                {/* Center: Desktop Nav */}
                <div className="hidden lg:flex items-center gap-10">
                </div>

                {/* Right: CTAs */}
                <div className="hidden lg:flex items-center gap-6">
                    <Link
                        to="/apply"
                        className="px-8 py-3 bg-slate-900 text-white text-[15px] font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm font-inter"
                    >
                        Join as Talent
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="lg:hidden flex items-center justify-center p-2 text-slate-600"
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleMenu}
                            className="fixed inset-0 bg-black/15 z-[110] lg:hidden backdrop-blur-[1px]"
                        />

                        {/* Drawer */}
                        <motion.div 
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
                            className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white z-[120] lg:hidden shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="h-[72px] px-6 flex items-center justify-between border-b border-slate-100">
                                <Link to="/" className="flex items-center">
                                    <img src="/images/logoplain.png" alt="OPSly Academy" className="h-24 drop-shadow-xl shadow-lg" />
                                    <span className="ml-1 text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded tracking-tighter uppercase">Academy</span>
                                </Link>
                                <button onClick={toggleMenu} className="p-2 text-slate-500 hover:text-slate-900">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-grow overflow-y-auto px-6 py-8 custom-scrollbar">
                                <div className="space-y-10">
                                    <div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Navigation</div>
                                        <div className="flex flex-col gap-1">
                                            {NavLinks.map((link) => (
                                                <Link
                                                    key={link.name}
                                                    to={link.path}
                                                    className={`flex items-center justify-between py-2.5 text-[13px] font-medium transition-colors ${
                                                        location.pathname === link.path ? 'text-blue-600' : 'text-slate-900 hover:text-blue-600'
                                                    }`}
                                                >
                                                    {link.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto px-6 py-10 border-t border-slate-100 bg-white">
                                <Link 
                                    to="/apply"
                                    className="flex items-center justify-between w-full py-4 px-6 bg-slate-900 text-white font-bold text-base rounded-2xl group transition-all active:scale-95"
                                >
                                    <span>Join as Talent</span>
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default AcademyNavbar;
