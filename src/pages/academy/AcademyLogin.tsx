import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const AcademyLogin = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectPath = searchParams.get("redirect") || "/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Role Check: Admin or Client are not allowed in Academy
            if (user) {
                const { data: rolesData } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("user_id", user.id);
                
                const userRoles = rolesData?.map(r => r.role) || [];
                const isBlocked = userRoles.includes('super_admin') || userRoles.includes('operations_admin') || userRoles.includes('client');
                const isAllowed = userRoles.includes('student') || userRoles.includes('talent');

                if (isBlocked || !isAllowed) {
                    await supabase.auth.signOut();
                    throw new Error("This portal is only for Students and Talents. Please use your respective portal.");
                }
            }

            toast({
                title: "Welcome back!",
                description: "Redirecting to your student dashboard...",
            });

            const isLocal = window.location.hostname === "localhost" || window.location.hostname.endsWith(".localhost");
            if (isLocal && !redirectPath.includes("zone=")) {
                const connector = redirectPath.includes("?") ? "&" : "?";
                navigate(`${redirectPath}${connector}zone=ACADEMY`);
            } else {
                navigate(redirectPath);
            }
        } catch (err) {
            const error = err as Error;
            toast({
                title: "Login failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col lg:flex-row font-inter">
            {/* Left: Branding & Visual */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center p-20 overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="relative z-10 max-w-lg">
                    <img src="/images/logocolored.svg" alt="OPSly Academy" className="h-24 mb-12" />
                    <h1 className="text-5xl font-bold text-white tracking-tight leading-[1.1] mb-8">
                        The Future of <br />
                        <span className="text-blue-400">Operations Mastery.</span>
                    </h1>
                    <p className="text-xl text-slate-400 font-medium leading-relaxed">
                        Log in to access your professional learning journey, live cohorts, and global matching opportunities.
                    </p>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-20 lg:px-32 py-20 bg-white">
                <div className="max-w-md w-full mx-auto">
                    <div className="lg:hidden mb-12">
                         <img src="/images/logocolored.svg" alt="OPSly Academy" className="h-16" />
                    </div>

                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Student Access</h2>
                        <p className="text-slate-500 font-medium">Please enter your credentials to continue your journey.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="name@example.com"
                                    className="w-full h-14 pl-12 pr-6 bg-slate-50 rounded-2xl border border-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium text-base"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Password</label>
                                <Link to="/auth/reset-password" title="Standard Auth Subdomain Reset" className="text-xs font-bold text-blue-600 hover:text-blue-700">Forgot?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required
                                    placeholder="••••••••"
                                    className="w-full h-14 pl-12 pr-14 bg-slate-50 rounded-2xl border border-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium text-base"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base transition-all shadow-sm"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Sign In to Academy"}
                        </Button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-slate-100">
                        <p className="text-slate-500 font-medium">
                            First time here?{" "}
                            <Link to="/signup" className="text-blue-600 font-bold hover:text-blue-700 inline-flex items-center gap-1 group">
                                Create a student account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademyLogin;
