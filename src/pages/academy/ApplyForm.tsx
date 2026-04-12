import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    CheckCircle2, 
    ArrowRight, 
    ArrowLeft, 
    Zap, 
    Globe, 
    Award,
    ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ACADEMY_COURSES } from "@/data/academy-courses";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";

const ApplyForm = () => {
    const [step, setStep] = useState(1);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        country: "",
        currentRole: "",
        course: "",
        goal: "",
        experience: "",
        availability: "",
        reason: ""
    });

    const totalSteps = 3;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here we would normally send to Supabase/API
        console.log("Form Submitted:", formData);
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white rounded-[32px] p-12 text-center shadow-xl border border-slate-100"
                >
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Received!</h2>
                    <p className="text-slate-500 font-medium leading-relaxed mb-10">
                        Thank you for applying to OPSly Academy. Our admissions team will review your profile and get back to you within 48 hours.
                    </p>
                    <div className="space-y-4">
                        <Button 
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl"
                            onClick={() => window.location.href = "/"}
                        >
                            Return to Homepage
                        </Button>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">A confirmation email has been sent</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-12 pb-24 px-6 font-inter">
            <div className="container max-w-[1000px] mx-auto">
                
                <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-24 items-start">
                    
                    {/* Left: Info & Stepper - Hidden on mobile, shown with order-last on lg */}
                    <div className="hidden lg:block lg:w-1/3 shrink-0">
                        <div className="sticky top-32">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-8">Admission Process</div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 lg:mb-6 tracking-tight">Begin Your <br />Academy Journey</h1>
                            <p className="text-xs lg:text-sm text-slate-500 font-medium leading-relaxed mb-8 lg:mb-12">
                                We are selective not to be exclusive, but to ensure every student has the commitment and background to succeed and get placed globally.
                            </p>

                            <div className="space-y-6 lg:space-y-8 relative">
                                {/* Vertical line */}
                                <div className="absolute left-6 top-6 bottom-6 w-px bg-slate-200" />
                                
                                {[
                                    { step: 1, title: "Personal Details", sub: "Basic info and contact" },
                                    { step: 2, title: "Professional Background", sub: "Current role and target path" },
                                    { step: 3, title: "Goals & Intent", sub: "Why you want to join us" }
                                ].map((item) => (
                                    <div key={item.step} className="flex items-center gap-4 lg:gap-6 relative z-10">
                                        <div className={`w-10 lg:w-12 h-10 lg:h-12 rounded-full flex items-center justify-center font-bold text-xs lg:text-sm transition-all shadow-sm ${
                                            step >= item.step 
                                            ? "bg-blue-600 text-white shadow-blue-200" 
                                            : "bg-white text-slate-400 border border-slate-200"
                                        }`}>
                                            {step > item.step ? <CheckCircle2 className="w-4 lg:w-5 h-4 lg:h-5" /> : item.step}
                                        </div>
                                        <div>
                                            <h4 className={`text-xs lg:text-sm font-bold ${step >= item.step ? "text-slate-900" : "text-slate-400"}`}>{item.title}</h4>
                                            <p className="text-[9px] lg:text-[11px] font-medium text-slate-500">{item.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 lg:mt-20 p-6 lg:p-8 bg-slate-900 rounded-2xl lg:rounded-[32px] text-white">
                                <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
                                    <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-lg lg:rounded-xl bg-blue-600 flex items-center justify-center">
                                        <Award className="w-4 lg:w-5 h-4 lg:h-5 text-white" />
                                    </div>
                                    <div className="text-[10px] lg:text-xs font-bold leading-tight">Fast-track to <br />Placement</div>
                                </div>
                                <p className="text-[9px] lg:text-xs text-slate-400 leading-relaxed font-medium">
                                    Graduates are prioritized for the OPSly HR global talent marketplace.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form - Shown first on mobile */}
                    <div className="flex-grow w-full">
                        <div className="bg-white rounded-2xl lg:rounded-[40px] p-6 md:p-8 lg:p-12 shadow-lg lg:shadow-xl border border-slate-100 relative overflow-hidden">
                            
                            <form onSubmit={handleSubmit}>
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Full Name</Label>
                                                    <Input 
                                                        name="fullName"
                                                        value={formData.fullName}
                                                        onChange={handleChange}
                                                        placeholder="e.g. Ama Mensah" 
                                                        className="h-14 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium" 
                                                        required 
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email Address</Label>
                                                    <Input 
                                                        type="email" 
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="ama@example.com" 
                                                        className="h-14 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium" 
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</Label>
                                                    <Input 
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        placeholder="+233 24 000 0000" 
                                                        className="h-14 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium" 
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Country of Residence</Label>
                                                    <Input 
                                                        name="country"
                                                        value={formData.country}
                                                        onChange={handleChange}
                                                        placeholder="e.g. Ghana" 
                                                        className="h-14 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium" 
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-8 flex justify-end">
                                                <Button type="button" onClick={nextStep} size="lg" className="h-14 px-10 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-2xl transition-all flex items-center gap-2">
                                                    Professional Path <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </div>
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
                                            <div className="space-y-2">
                                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Target Course / Program</Label>
                                                <Select value={formData.course} onValueChange={(val) => handleSelectChange("course", val)}>
                                                    <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium">
                                                        <SelectValue placeholder="Identify your learning path" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white rounded-xl border-slate-100 shadow-xl">
                                                        {ACADEMY_COURSES.map(course => (
                                                            <SelectItem key={course.slug} value={course.slug} className="py-3 font-medium">
                                                                {course.title}
                                                            </SelectItem>
                                                        ))}
                                                        <SelectItem value="not-sure" className="py-3 font-medium">Not Sure - Need Guidance</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Current Role</Label>
                                                    <Input 
                                                        name="currentRole"
                                                        value={formData.currentRole}
                                                        onChange={handleChange}
                                                        placeholder="e.g. Admin Assistant" 
                                                        className="h-14 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium" 
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Years of Experience</Label>
                                                    <Select value={formData.experience} onValueChange={(val) => handleSelectChange("experience", val)}>
                                                        <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium">
                                                            <SelectValue placeholder="Select years" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white rounded-xl border-slate-100 shadow-xl font-medium">
                                                            <SelectItem value="0-1">0 - 1 years</SelectItem>
                                                            <SelectItem value="1-3">1 - 3 years</SelectItem>
                                                            <SelectItem value="3-5">3 - 5 years</SelectItem>
                                                            <SelectItem value="5+">5+ years</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Weekly Availability</Label>
                                                <Select value={formData.availability} onValueChange={(val) => handleSelectChange("availability", val)}>
                                                    <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium">
                                                        <SelectValue placeholder="How much time can you commit?" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white rounded-xl border-slate-100 shadow-xl font-medium">
                                                        <SelectItem value="5-10">5 - 10 hours/week</SelectItem>
                                                        <SelectItem value="10-20">10 - 20 hours/week (Recommended)</SelectItem>
                                                        <SelectItem value="20+">20+ hours/week</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="pt-8 flex justify-between">
                                                <Button type="button" onClick={prevStep} variant="ghost" className="h-14 px-8 text-slate-500 font-bold rounded-2xl transition-all flex items-center gap-2">
                                                    <ArrowLeft className="w-5 h-5" /> Back
                                                </Button>
                                                <Button type="button" onClick={nextStep} size="lg" className="h-14 px-10 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-2xl transition-all flex items-center gap-2">
                                                    Goals & Intent <ChevronRight className="w-5 h-5" />
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
                                            <div className="space-y-2">
                                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Primary Career Goal</Label>
                                                <Input 
                                                    name="goal"
                                                    value={formData.goal}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Break into global remote work as an AI operator" 
                                                    className="h-14 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium" 
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Why OPSly Academy?</Label>
                                                <Textarea 
                                                    name="reason"
                                                    value={formData.reason}
                                                    onChange={handleChange}
                                                    placeholder="Tell us what excites you about this path and why you're a good fit." 
                                                    className="min-h-[160px] rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium py-4" 
                                                    required
                                                />
                                            </div>

                                            <div className="pt-8 flex justify-between">
                                                <Button type="button" onClick={prevStep} variant="ghost" className="h-14 px-8 text-slate-500 font-bold rounded-2xl transition-all flex items-center gap-2">
                                                    <ArrowLeft className="w-5 h-5" /> Back
                                                </Button>
                                                <Button type="submit" size="lg" className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-200">
                                                    Submit Application
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplyForm;
