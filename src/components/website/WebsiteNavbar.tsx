
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const WebsiteNavbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const NavLinks = [
        { name: "For Companies", path: "/for-companies" },
        { name: "For Professionals", path: "/for-professionals" },
        { name: "Service Models", path: "/service-models" },
        { name: "Pricing", path: "/pricing" },
        { name: "Insights", path: "/insights" },
    ];

    return (
        <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
            <div className="container flex h-20 items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <img src="/wordmark.png" alt="Taskive" className="h-8" />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex md:items-center md:gap-8">
                    {NavLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-primary"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Desktop CTAs */}
                <div className="hidden md:flex md:items-center md:gap-4">
                    <Button variant="ghost" asChild className="hidden lg:inline-flex text-slate-600 hover:text-primary hover:bg-slate-100">
                        <Link to="/auth/signup">Apply as Talent</Link>
                    </Button>
                    <Button asChild className="bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
                        <Link to="/book-consultation">Book Consultation</Link>
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="flex items-center justify-center p-2 text-muted-foreground md:hidden"
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="container md:hidden py-4 pb-8 border-t border-border/40 bg-background animate-fade-in">
                    <div className="flex flex-col space-y-4">
                        {NavLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="text-base font-medium text-foreground py-2 border-b border-border/10"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="flex flex-col gap-3 mt-4">
                            <Button asChild className="w-full bg-primary text-primary-foreground">
                                <Link to="/book-consultation">Book Consultation</Link>
                            </Button>
                            <Button variant="outline" asChild className="w-full">
                                <Link to="/auth/signup?type=talent">Apply as Talent</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default WebsiteNavbar;
