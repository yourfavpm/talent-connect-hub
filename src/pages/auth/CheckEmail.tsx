import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const CheckEmail = () => {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full"
            >
                <div className="flex justify-center mb-10">
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 border border-blue-100/50 shadow-sm">
                        <Mail className="w-10 h-10" />
                    </div>
                </div>

                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-3">
                    Verify your email
                </h1>
                
                <p className="text-slate-500 text-lg leading-relaxed mb-10 font-medium">
                    We've sent a verification link to your inbox. Please click the link to activate your account and start using OPSlyHR.
                </p>

                <div className="space-y-4">
                    <Link to="/auth/login" className="block">
                        <Button 
                            className="w-full h-[54px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-lg shadow-slate-200 transition-all active:scale-95"
                        >
                            Return to Login
                        </Button>
                    </Link>
                    
                    <p className="text-sm text-slate-400 font-medium pt-4">
                        Didn't receive an email? Check your spam folder or contact support.
                    </p>
                </div>
            </motion.div>

            <div className="mt-24">
                <img 
                    src="/images/logocolored.png" 
                    alt="OPSlyHR" 
                    className="h-14 opacity-30 grayscale mix-blend-multiply" 
                />
            </div>
        </div>
    );
};

export default CheckEmail;
