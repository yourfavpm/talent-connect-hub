import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const status = searchParams.get("status");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If there's no status, it might be an automated redirect from a legacy system
        // but our new flow redirects to Edge Function first which then redirects here with a status.
        if (status) {
            setLoading(false);
        } else {
            // Wait a bit just in case
            const timer = setTimeout(() => setLoading(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [status]);

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
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            Thank you for verifying your email address. Your account is now fully activated and ready for use.
                        </p>
                        <Button 
                            onClick={() => navigate("/auth/login")} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 h-auto text-lg rounded-xl shadow-lg shadow-emerald-200 transition-all hover:scale-105"
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
                            For your security, verification links expire after 24 hours. Please request a new verification email.
                        </p>
                        <Button 
                            onClick={() => navigate("/auth/login")} 
                            variant="outline"
                            className="px-8 py-6 h-auto text-lg rounded-xl border-2 hover:bg-slate-50 transition-all"
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
                            onClick={() => navigate("/auth/login")} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 h-auto text-lg rounded-xl transition-all"
                        >
                            Go to Dashboard
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
                            onClick={() => navigate("/auth/login")} 
                            variant="outline"
                            className="px-8 py-6 h-auto text-lg rounded-xl border-2 transition-all"
                        >
                            Return Home
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-24">
            <div className="w-full max-w-lg">
                <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200 border border-slate-100 flex flex-col items-center">
                    <div className="mb-12">
                        <img 
                            src="/logo.png" 
                            alt="OPSlyHR" 
                            className="h-10 object-contain opacity-90"
                            onError={(e) => {
                                // Fallback if logo doesn't exist
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    const dev = document.createElement('div');
                                    dev.className = "text-emerald-600 font-bold text-3xl tracking-tight";
                                    dev.innerText = "OPSlyHR";
                                    parent.appendChild(dev);
                                }
                            }}
                        />
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center py-12">
                            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                            <p className="text-slate-500 animate-pulse">Processing your verification...</p>
                        </div>
                    ) : (
                        renderContent()
                    )}
                </div>
                
                <p className="mt-12 text-center text-slate-400 text-sm">
                    &copy; {new Date().getFullYear()} OPSlyHR. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;
