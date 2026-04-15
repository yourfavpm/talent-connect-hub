import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Loader2, Award, Zap, Shield, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const AcademySignup = () => {
    const { toast } = useToast();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Auth Signup
            const { data, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        portal: "student"
                    }
                }
            });

            if (authError) throw authError;

            // 2. Assign Student Role (via user_roles table)
            if (data.user) {
                const { error: roleError } = await supabase
                    .from("user_roles")
                    .insert([{ 
                        user_id: data.user.id, 
                        role: "student" 
                    }]);
                
                if (roleError) console.warn("Auto-role assignment failed:", roleError);
            }

            toast({
                title: "Account created!",
                description: "Check your email for a verification link.",
            });

            // Redirect to check-email (we'll assume the /auth/check-email path exists or just go to success)
            // Redirect to login with zone preservation for localhost
            const isLocal = window.location.hostname === "localhost" || window.location.hostname.endsWith(".localhost");
            if (isLocal) {
                navigate("/login?zone=ACADEMY");
            } else {
                navigate("/login");
            }
        } catch (err) {
            const error = err as Error;
            toast({
                title: "Signup failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-inter">
            {/* Left: Benefits Panel */}
            <div className="hidden lg:flex w-[40%] bg-blue-600 relative items-center justify-center p-16 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')] opacity-10 mix-blend-overlay grayscale" />
                
                <div className="relative z-10 space-y-12">
                    <img src="/images/logocolored.png" alt="OPSly Academy" className="h-24 brightness-0 invert" />
                    
                    <div className="space-y-8">
                        <h2 className="text-4xl font-bold text-white tracking-tight leading-tight">
                            Start Your Transformation <br />
                            Today.
                        </h2>
                        
                        <div className="space-y-6">
                            {[
                                { icon: Award, title: "Global Accreditation", desc: "Gain certifications recognized by world-class operations teams." },
                                { icon: Zap, title: "AI-First Curriculum", desc: "Master the automation tools that are reshaping global business." },
                                { icon: Shield, title: "Verified Placement", desc: "Get priority matching in the OPSly Global Talent network." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                        <item.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-1">{item.title}</h4>
                                        <p className="text-blue-100 text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Signup Form */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-20 lg:px-32 py-20 bg-white">
                <div className="max-w-md w-full mx-auto">
                    <div className="mb-12">
                        <Link to="/" className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
                            Academy Hub
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Join the Academy</h1>
                        <p className="text-slate-500 font-medium">Create your professional profile to start learning.</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    required
                                    placeholder="John Doe"
                                    className="w-full h-14 pl-12 pr-6 bg-slate-50 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="name@example.com"
                                    className="w-full h-14 pl-12 pr-6 bg-slate-50 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Create Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required
                                    placeholder="Min. 8 characters"
                                    className="w-full h-14 pl-12 pr-14 bg-slate-50 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:text-blue-600 text-slate-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base transition-all shadow-xl shadow-blue-200"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Verify Identity & Join"}
                        </Button>

                        <p className="text-[10px] text-slate-400 font-medium text-center leading-relaxed">
                            By joining, you agree to the OPSly Academy Terms of Service and Privacy Policy regarding talent assessment and global placement.
                        </p>
                    </form>

                    <div className="mt-10 pt-10 border-t border-slate-100 text-center">
                        <p className="text-slate-500 font-medium">
                            Already a student?{" "}
                            <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700">
                                Log in to Dashboard
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademySignup;
