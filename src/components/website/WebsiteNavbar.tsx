import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ArrowRight, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zone, getZoneUrl } from "@/utils/subdomain";

const WebsiteNavbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isResourcesOpen, setIsResourcesOpen] = useState(false);
    const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
    
    // Mobile submenu states
    const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
    const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
    
    const location = useLocation();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Reset mobile submenus when opening
            setMobileSolutionsOpen(false);
            setMobileResourcesOpen(false);
        }
    };

    const NavLinks = [
        { name: "For Companies", path: "/for-companies" },
        { name: "For Professionals", path: "/for-professionals" },
        { name: "Service Models", path: "/service-models" },
    ];

    const SolutionLinks = [
        { name: "Direct Hire", path: "/direct-hire" },
        { name: "Trial-to-Hire", path: "/trial-to-hire" },
        { name: "Project Engagement", path: "/project-engagement" },
        { name: "Offshore Hiring", path: "/offshore-hiring" },
    ];

    const ResourceLinks = [
        { name: "Insights", path: "/insights" },
        { name: "FAQs", path: "/service-models" },
        { name: "Vetting Process", path: "/vetting-process" },
    ];

    // Close mobile menu on route change
    useEffect(() => {
        setIsOpen(false);
        setMobileSolutionsOpen(false);
        setMobileResourcesOpen(false);
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
                    <img src="/images/logoplain.png" alt="OPSlyHR" className="h-32 drop-shadow-xl shadow-lg" />
                </Link>

                {/* Center: Desktop Nav */}
                <div className="hidden lg:flex items-center gap-8">
                    {NavLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className="text-[13px] font-medium text-slate-600 transition-colors hover:text-slate-900 relative group py-2"
                        >
                            {link.name}
                            <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                        </Link>
                    ))}

                    {/* Solutions Dropdown */}
                    <div className="relative group/menu">
                        <button 
                            onMouseEnter={() => setIsSolutionsOpen(true)}
                            onMouseLeave={() => setIsSolutionsOpen(false)}
                            className="flex items-center gap-1 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors py-2"
                        >
                            Solutions <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSolutionsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                            {isSolutionsOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    onMouseEnter={() => setIsSolutionsOpen(true)}
                                    onMouseLeave={() => setIsSolutionsOpen(false)}
                                    className="absolute top-full left-0 w-52 bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-xl mt-1 py-3 z-50 overflow-hidden"
                                >
                                    {SolutionLinks.map((link) => (
                                        <Link
                                            key={link.name}
                                            to={link.path}
                                            className="block px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <Link
                        to="/pricing"
                        className="text-[13px] font-medium text-slate-600 transition-colors hover:text-slate-900 relative group py-2"
                    >
                        Pricing
                        <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                    </Link>
                    

                </div>

                {/* Right: CTAs */}
                <div className="hidden lg:flex items-center gap-6">
                    <a 
                        href={getZoneUrl(Zone.AUTH, "/auth/signup?portal=talent#form")}
                        className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        Apply as Talent
                    </a>
                    <a 
                        href={getZoneUrl(Zone.AUTH, "/auth/login?portal=client#form")}
                        className="px-5 py-2.5 border border-slate-200 text-slate-900 text-[13px] font-semibold rounded-lg hover:border-slate-900 transition-all font-inter"
                    >
                        Login
                    </a>
                    <a 
                        href="https://academy.opslyhr.com"
                        className="px-6 py-2.5 bg-slate-900 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm font-inter"
                    >
                        Join Academy
                    </a>
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
                                <img src="/images/logoplain.png" alt="OPSlyHR" className="h-24 drop-shadow-xl shadow-lg" />
                                <button onClick={toggleMenu} className="p-2 text-slate-500 hover:text-slate-900">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-grow overflow-y-auto px-6 py-8 custom-scrollbar">
                                <div className="space-y-10">
                                    {/* Primary Navigation */}
                                    <div>
                                    <div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Navigation</div>
                                        <div className="flex flex-col gap-1">
                                            {NavLinks.map((link) => (
                                                <Link
                                                    key={link.name}
                                                    to={link.path}
                                                    className="flex items-center justify-between py-2.5 text-[13px] font-medium text-slate-900 hover:text-blue-600 transition-colors"
                                                >
                                                    {link.name}
                                                </Link>
                                            ))}
                                            
                                            <Link
                                                to="/pricing"
                                                className="flex items-center justify-between py-2.5 text-[13px] font-medium text-slate-900 hover:text-blue-600 transition-colors"
                                            >
                                                Pricing
                                            </Link>
 
                                            <div className="py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">Solutions</div>
                                            {SolutionLinks.map((link) => (
                                                <Link
                                                    key={link.name}
                                                    to={link.path}
                                                    className="block py-2 text-[13px] font-medium text-slate-600 hover:text-blue-600 transition-colors"
                                                >
                                                    {link.name}
                                                </Link>
                                            ))}
 
                                        </div>
                                    </div>
                                    </div>

                                </div>
                            </div>

                            {/* Sticky Action Section */}
                            <div className="mt-auto px-6 py-8 border-t border-slate-100 bg-white">
                                <div className="space-y-4">
                                    <a 
                                        href="https://academy.opslyhr.com"
                                        className="flex items-center justify-between w-full py-2 border-b border-slate-900 text-slate-900 font-bold text-[12px] group"
                                    >
                                        <span>Join Academy</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                    <a 
                                        href={getZoneUrl(Zone.AUTH, "/auth/signup?portal=talent#form")}
                                        className="flex items-center justify-between w-full py-2 border-b border-slate-100 text-slate-500 font-medium text-[12px] group"
                                    >
                                        <span>Apply as Talent</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                    <a 
                                        href={getZoneUrl(Zone.AUTH, "/auth/login?portal=client#form")}
                                        className="flex items-center justify-between w-full py-2 border-b border-slate-50 text-slate-400 font-medium text-[12px] group"
                                    >
                                        <span>Login</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default WebsiteNavbar;
