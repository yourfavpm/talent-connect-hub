import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Loader2, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { getZoneUrl, Zone } from "@/utils/subdomain";
import Logo from "@/components/Logo";

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const status = searchParams.get("status");
    const portal = (searchParams.get("portal") || "client") as "client" | "talent" | "admin";
    const [loading, setLoading] = useState(true);

    const handleContinue = () => {
        const loginUrl = getZoneUrl(Zone.AUTH, `/auth/login?portal=${portal}`);
        window.location.href = loginUrl;
    };

    useEffect(() => {
        if (status) {
            setLoading(false);
        } else {
            const timer = setTimeout(() => {
                setLoading(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const renderContent = () => {
        switch (status) {
            case "success":
                return (
                    <div className="text-center">
                        <div className="flex justify-center mb-8">
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center border border-emerald-100/50 shadow-sm"
                            >
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </motion.div>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-4 tracking-tight">Email Verified!</h1>
                        <p className="text-slate-500 text-base mb-10 max-w-sm mx-auto font-medium leading-relaxed">
                            Thank you for verifying your identity. Your professional account is now fully activated and ready for use.
                        </p>
                        <Button 
                            onClick={handleContinue} 
                            className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-[54px] w-full max-w-xs rounded-xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 font-semibold"
                        >
                            Continue to Login <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                );
            case "expired":
                return (
                    <div className="text-center">
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center border border-amber-100/50">
                                <Clock className="w-10 h-10 text-amber-500" />
                            </div>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-4 tracking-tight">Link Expired</h1>
                        <p className="text-slate-500 text-base mb-10 max-w-sm mx-auto leading-relaxed">
                            For your security, verification links expire after 24 hours. Please request a new verification email from the login page.
                        </p>
                        <Button 
                            onClick={handleContinue} 
                            className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-[54px] w-full max-w-xs rounded-xl transition-all font-semibold"
                        >
                            Back to Login
                        </Button>
                    </div>
                );
            case "already-verified":
                return (
                    <div className="text-center">
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center border border-blue-100/50">
                                <CheckCircle2 className="w-10 h-10 text-blue-400" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-semibold text-slate-900 mb-4 tracking-tight">Already Verified</h1>
                        <p className="text-slate-500 text-base mb-10 max-w-sm mx-auto leading-relaxed">
                            This email has already been verified. You can proceed directly to your secure dashboard.
                        </p>
                        <Button 
                            onClick={handleContinue} 
                            className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-[54px] w-full max-w-xs rounded-xl transition-all font-semibold"
                        >
                            Go to Login
                        </Button>
                    </div>
                );
            case "invalid":
            default:
                return (
                    <div className="text-center">
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center border border-red-100/50">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-semibold text-slate-900 mb-4 tracking-tight">Invalid Link</h1>
                        <p className="text-slate-500 text-base mb-10 max-w-sm mx-auto leading-relaxed">
                            We couldn't verify your email with this link. It may be broken or previously used.
                        </p>
                        <Button 
                            onClick={handleContinue} 
                            className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-[54px] w-full max-w-xs rounded-xl transition-all font-semibold"
                        >
                            Return to Login
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex flex-col-reverse lg:flex-row bg-white font-inter overflow-x-hidden">
            {/* BRAND SIDE PANEL */}
            <div className="lg:w-[45%] relative border-r border-slate-100 flex flex-col justify-between overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src={portal === "talent" ? "/images/auth/talent-side.jpg" : "/images/auth/client-side.jpg"}
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]" />
                </div>

                <div className="relative z-10 p-8 lg:p-16 flex flex-col justify-between h-full">
                    <div>
                        <Link to="/" className="inline-block mb-16 lg:mb-24">
                            <Logo showText={false} imgHeight="h-20" variant="light" />
                        </Link>
                        <div className="max-w-md">
                            <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-4 tracking-tight">
                                Secure Activation.
                            </h2>
                            <p className="text-slate-200 text-lg font-medium leading-relaxed mb-10 opacity-90">
                                Finalizing your access to the OpslyHR ecosystem. We're setting up your professional profile and secure workspace.
                            </p>
                            <div className="flex items-center gap-3 py-6 border-t border-white/10 transition-all duration-500">
                                <Shield className="w-5 h-5 text-blue-400/60" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform Activation</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                            Enterprise Ready Infrastructure
                        </p>
                    </div>
                </div>
            </div>

            {/* CONTENT SIDE */}
            <div className="lg:w-[55%] flex flex-col justify-center px-6 lg:px-20 xl:px-32 py-12 bg-white relative">
                <div className="max-w-[440px] w-full mx-auto">
                    <div className="bg-white border border-slate-100 rounded-2xl p-8 md:p-10 shadow-sm shadow-slate-200/40 relative">
                        {loading ? (
                            <div className="flex flex-col items-center py-12 gap-6">
                                <div className="relative">
                                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                                    </div>
                                </div>
                                <div className="space-y-2 text-center">
                                    <p className="text-slate-900 font-bold tracking-widest uppercase text-[11px]">Syncing Credentials</p>
                                    <p className="text-slate-400 text-sm animate-pulse font-medium">Initializing your secure workspace...</p>
                                </div>
                            </div>
                        ) : (
                            renderContent()
                        )}
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em]">
                            &copy; {new Date().getFullYear()} OpslyHR &bull; Strategic Human Resources
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
