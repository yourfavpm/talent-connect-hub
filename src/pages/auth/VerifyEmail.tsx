import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getZoneUrl, Zone } from "@/utils/subdomain";

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const status = searchParams.get("status");
    const portal = (searchParams.get("portal") || "client") as "client" | "talent" | "admin";
    const [loading, setLoading] = useState(true);
    const [logoError, setLogoError] = useState(false);

    const handleContinue = () => {
        // Always redirect through the Auth Hub for login
        const loginUrl = getZoneUrl(Zone.AUTH, `/auth/login?portal=${portal}`);
        window.location.href = loginUrl;
    };

    useEffect(() => {
        console.log("VerifyEmail: Status =", status, "Portal =", portal);
        // If there's no status, it might be an automated redirect from a legacy system
        // but our new flow redirects to Edge Function first which then redirects here with a status.
        if (status) {
            setLoading(false);
        } else {
            // Wait a bit just in case — sometimes redirects are fast
            const timer = setTimeout(() => {
                console.log("VerifyEmail: No status after timeout, showing default.");
                setLoading(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [status, portal]);

    const renderContent = () => {
        switch (status) {
            case "success":
                return (
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <CheckCircle2 className="w-20 h-20 text-emerald-500" />
                            </motion.div>
                        </div>
                        <h1 className="text-3xl font-semibold text-slate-900 mb-4">Email Verified!</h1>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto font-medium">
                            Thank you for verifying your email address. Your account is now fully activated and ready for use.
                        </p>
                        <Button 
                            onClick={handleContinue} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 h-auto text-lg rounded-xl shadow-lg shadow-emerald-100 transition-all hover:scale-105 active:scale-95"
                        >
                            Continue to Login
                        </Button>
                    </div>
                );
            case "expired":
                return (
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <Clock className="w-20 h-20 text-amber-500" />
                        </div>
                        <h1 className="text-3xl font-semibold text-slate-900 mb-4">Link Expired</h1>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            For your security, verification links expire after 24 hours. Please request a new verification email from the login page.
                        </p>
                        <Button 
                            onClick={handleContinue} 
                            variant="outline"
                            className="px-8 py-6 h-auto rounded-xl border-2 hover:bg-slate-50 transition-all font-bold uppercase tracking-widest text-[13px]"
                        >
                            Back to Login
                        </Button>
                    </div>
                );
            case "already-verified":
                return (
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <CheckCircle2 className="w-20 h-20 text-emerald-500/50" />
                        </div>
                        <h1 className="text-2xl font-semibold text-slate-900 mb-4">Already Verified</h1>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            This email has already been verified. You can proceed to the dashboard.
                        </p>
                        <Button 
                            onClick={handleContinue} 
                            className="bg-brand-primary hover:bg-brand-secondary text-white px-8 py-6 h-auto text-lg rounded-xl transition-all"
                        >
                            Go to Login
                        </Button>
                    </div>
                );
            case "invalid":
            default:
                return (
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <XCircle className="w-20 h-20 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-semibold text-slate-900 mb-4">Invalid Link</h1>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            We couldn't verify your email with this link. It may be broken or previously used.
                        </p>
                        <Button 
                            onClick={handleContinue} 
                            variant="outline"
                            className="px-8 py-6 h-auto rounded-xl border-2 transition-all font-bold uppercase tracking-widest text-[13px]"
                        >
                            Return to Login
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 sm:p-24">
            <div className="w-full max-w-lg">
                <div className="bg-white rounded-[48px] p-8 sm:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center">
                    <div className="mb-12">
                        {!logoError ? (
                            <img 
                                src="/images/logocolored.png" 
                                alt="OPSlyHR" 
                                className="h-16 object-contain"
                                onError={() => setLogoError(true)}
                            />
                        ) : (
                            <div className="text-brand-primary font-black text-3xl tracking-tighter">
                                OPSly<span className="text-slate-900">HR</span>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center py-12 gap-6">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 text-brand-primary animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-ping" />
                                </div>
                            </div>
                            <div className="space-y-2 text-center">
                                <p className="text-slate-900 font-bold tracking-widest uppercase text-[11px]">Syncing Credentials</p>
                                <p className="text-slate-400 text-sm animate-pulse">Initializing your secure workspace...</p>
                            </div>
                        </div>
                    ) : (
                        renderContent()
                    )}
                </div>
                
                <p className="mt-12 text-center text-slate-300 text-[11px] font-bold uppercase tracking-[0.2em]">
                    &copy; {new Date().getFullYear()} OPSlyHR &bull; Strategic Human Resources
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;
