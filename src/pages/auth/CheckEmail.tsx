import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

const CheckEmail = () => {
    return (
        <div className="min-h-screen flex flex-col-reverse lg:flex-row bg-white font-inter overflow-x-hidden">
            {/* BRAND SIDE PANEL */}
            <div className="lg:w-[45%] relative border-r border-slate-100 flex flex-col justify-between overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/images/auth/client-side.jpg"
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
                                Identity Verified.
                            </h2>
                            <p className="text-slate-200 text-lg font-medium leading-relaxed mb-10 opacity-90">
                                We've sent a secure verification link to your inbox. This ensures only you can access your professional data.
                            </p>
                            <div className="flex items-center gap-3 py-6 border-t border-white/10 transition-all duration-500">
                                <Shield className="w-5 h-5 text-blue-400/60" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enterprise Security</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                            Data Privacy & Sovereignty
                        </p>
                    </div>
                </div>
            </div>

            {/* CONTENT SIDE */}
            <div className="lg:w-[55%] flex flex-col justify-center px-6 lg:px-20 xl:px-32 py-12 bg-white relative">
                <div className="max-w-[440px] w-full mx-auto text-center">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-slate-100 rounded-2xl p-8 md:p-10 shadow-sm shadow-slate-200/40 relative"
                    >
                        <div className="flex justify-center mb-10">
                            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 border border-blue-100/50 shadow-sm">
                                <Mail className="w-10 h-10" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-3">
                            Verify your email
                        </h1>
                        
                        <p className="text-slate-500 text-base leading-relaxed mb-10 font-medium">
                            We've sent a verification link to your inbox. Please click the link to activate your account and start using OPSlyHR.
                        </p>

                        <div className="space-y-4">
                            <Link to="/auth/login" className="block">
                                <Button 
                                    className="w-full h-[54px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Return to Login <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                            
                            <p className="text-xs text-slate-400 font-medium pt-4 bg-slate-50/50 py-3 rounded-lg border border-slate-100">
                                Didn't receive an email? Check your spam folder.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default CheckEmail;
