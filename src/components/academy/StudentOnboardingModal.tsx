import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
    User, 
    Briefcase, 
    Target, 
    ArrowRight, 
    Rocket,
    Globe,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: (data: any) => void;
}

const StudentOnboardingModal = ({ isOpen, onComplete }: OnboardingModalProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        occupation: "",
        experience_level: "Beginner",
        learning_goal: "",
        bio: "",
        availability: "Part-time (10-20 hrs/week)"
    });

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    ...formData,
                    onboarding_completed: true,
                    student_profile_completed: true
                }
            });

            if (error) throw error;

            toast({
                title: "Profile Updated!",
                description: "Welcome to OPSly Academy properly.",
            });
            
            onComplete(formData);
        } catch (err) {
            console.error("Onboarding update error:", err);
            toast({
                title: "Error",
                description: "Failed to update your profile. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
                <div className="h-2 bg-slate-100 w-full">
                    <motion.div 
                        className="h-full bg-blue-600"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="p-8 md:p-12">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                                        <Rocket className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome to the Academy</h2>
                                    <p className="text-slate-500 font-medium mt-2">Let's personalize your learning experience.</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">Current Occupation</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input 
                                            type="text"
                                            placeholder="e.g. Operations Coordinator, Student..."
                                            className="w-full h-14 pl-12 pr-6 bg-slate-50 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                            value={formData.occupation}
                                            onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">Experience Level</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {["Beginner", "Intermediate", "Expert"].map(lvl => (
                                            <button
                                                key={lvl}
                                                onClick={() => setFormData({ ...formData, experience_level: lvl })}
                                                className={`h-12 rounded-xl font-bold text-sm transition-all border ${
                                                    formData.experience_level === lvl 
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200" 
                                                        : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                                                }`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleNext}
                                    disabled={!formData.occupation}
                                    className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-bold text-base gap-2"
                                >
                                    Get Started <ArrowRight className="w-4 h-4" />
                                </Button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Your Career Goals</h2>
                                    <p className="text-slate-500 font-medium mt-2">What do you hope to achieve at OPSly Academy?</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">Primary Learning Goal</label>
                                    <textarea 
                                        placeholder="e.g. Master AI automation to scale my agency productivity..."
                                        className="w-full h-32 p-6 bg-slate-50 rounded-3xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium resize-none"
                                        value={formData.learning_goal}
                                        onChange={e => setFormData({ ...formData, learning_goal: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">Weekly Availability</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            "Part-time (10-20 hrs/week)",
                                            "Full-time immersion (40+ hrs/week)",
                                            "Weekend Warrior (5-10 hrs/week)"
                                        ].map(avail => (
                                            <button
                                                key={avail}
                                                onClick={() => setFormData({ ...formData, availability: avail })}
                                                className={`flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-sm transition-all border ${
                                                    formData.availability === avail 
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm" 
                                                        : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                                                }`}
                                            >
                                                {avail}
                                                {formData.availability === avail && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button variant="ghost" onClick={handleBack} className="h-14 px-8 rounded-2xl font-bold text-slate-400">Back</Button>
                                    <Button 
                                        onClick={handleNext}
                                        disabled={!formData.learning_goal}
                                        className="flex-grow h-14 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-bold text-base"
                                    >
                                        Next Step
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Final Touch</h2>
                                    <p className="text-slate-500 font-medium mt-2">Write a brief bio for your student profile.</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">Public Bio</label>
                                    <textarea 
                                        placeholder="Tell us about yourself..."
                                        className="w-full h-32 p-6 bg-slate-50 rounded-3xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium resize-none"
                                        value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Minimal 20 characters recommended</p>
                                </div>

                                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-blue-800 leading-snug">
                                        Your profile will be automatically linked to the Global Talent Marketplace upon program completion.
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <Button variant="ghost" onClick={handleBack} className="h-14 px-8 rounded-2xl font-bold text-slate-400">Back</Button>
                                    <Button 
                                        onClick={handleSubmit}
                                        disabled={loading || formData.bio.length < 5}
                                        className="flex-grow h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base shadow-xl shadow-blue-500/20"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Complete Profile Entrance"}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default StudentOnboardingModal;
