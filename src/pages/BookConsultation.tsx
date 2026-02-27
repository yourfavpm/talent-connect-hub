
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Star } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BookConsultation = () => {
    const { toast } = useToast();
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        objective: "",
        details: "",
        preferredDate: "",
        preferredTime: "",
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from("consultations").insert({
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                company: formData.company,
                objective: formData.objective,
                details: formData.details,
                preferred_date: formData.preferredDate || null,
                preferred_time: formData.preferredTime || null,
            });

            if (error) throw error;

            setSubmitted(true);
        } catch (error: unknown) {
            const err = error as { message?: string };
            console.error("Error submitting consultation:", err);
            toast({
                title: "Error",
                description: "Failed to submit request. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center px-4">
                <div className="bg-white p-12 rounded-3xl shadow-xl shadow-stone-200/50 max-w-md w-full text-center border border-stone-100">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-serif text-stone-900 mb-4">Request Received</h2>
                    <p className="text-stone-600 mb-10 leading-relaxed">
                        Thank you for trusting us. We'll be in touch within 24 hours to schedule a conversation that fits your time.
                    </p>
                    <Button asChild className="w-full h-14 text-lg rounded-full bg-stone-900 text-white hover:bg-stone-800">
                        <Link to="/">Return to Taskive</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white selection:bg-slate-100 selection:text-slate-900 font-inter relative">
            {/* Faint Dotted Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.02]" 
                 style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <div className="relative z-10 container max-w-7xl mx-auto py-12 md:py-20 px-6">
                {/* Top Nav / Breadcrumbs */}
                <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400 mb-8 md:mb-12">
                    <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-600">Request Talent</span>
                </div>

                <div className="grid lg:grid-cols-[45%_1fr] gap-16 lg:gap-32 items-start">
                    {/* LEFT COLUMN: Context Panel */}
                    <div className="lg:sticky lg:top-24 space-y-12">
                        <div>
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200 uppercase tracking-[0.15em] mb-6">
                                Consultation Request
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.15]">
                                Define the Role. <br className="hidden md:block" />
                                We Structure the Match.
                            </h1>
                            <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
                                Share your objectives and timeline. Our team will coordinate vetting, matching, and engagement setup.
                            </p>
                        </div>

                        {/* Feature Blocks */}
                        <div className="space-y-8 max-w-md">
                            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">
                                What Happens Next
                            </div>
                            
                            <div className="space-y-0">
                                {[
                                    "Role alignment call",
                                    "Curated shortlist within 48 hours",
                                    "Structured engagement proposal",
                                    "Centralized billing & compliance"
                                ].map((item, idx) => (
                                    <div key={idx} className={`py-5 flex items-center gap-4 ${idx !== 0 ? 'border-t border-slate-100' : ''}`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                                        <span className="text-sm font-semibold text-slate-700 tracking-tight">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Trust Indicator */}
                        <div className="pt-8 border-t border-slate-100">
                            <p className="text-[12px] font-medium text-slate-400 mb-6">
                                Trusted by growth-stage and enterprise teams globally.
                            </p>
                            <div className="flex flex-wrap items-center gap-8 opacity-40 grayscale">
                                {/* Muted logos placeholder - using stylized text for enterprise feel */}
                                <div className="text-lg font-bold tracking-tighter text-slate-900">FORTH</div>
                                <div className="text-lg font-bold tracking-tight text-slate-900 underline decoration-2">VELO</div>
                                <div className="text-lg font-bold tracking-widest text-slate-900 uppercase">Aspect</div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Form Panel */}
                    <div className="bg-white border border-slate-200 rounded-xl p-8 md:p-12 shadow-sm max-w-[600px] w-full">
                        <div className="mb-10">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Structured Matching</h2>
                            <p className="text-sm text-slate-500">All fields required unless marked optional.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">First Name</Label>
                                    <Input 
                                        id="firstName" 
                                        value={formData.firstName} 
                                        onChange={(e) => handleChange("firstName", e.target.value)} 
                                        placeholder="Jane" 
                                        className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-white text-slate-900" 
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Last Name</Label>
                                    <Input 
                                        id="lastName" 
                                        value={formData.lastName} 
                                        onChange={(e) => handleChange("lastName", e.target.value)} 
                                        placeholder="Doe" 
                                        className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-white text-slate-900" 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Work Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    value={formData.email} 
                                    onChange={(e) => handleChange("email", e.target.value)} 
                                    placeholder="jane@company.com" 
                                    className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-white text-slate-900" 
                                    required 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="company" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Company</Label>
                                <Input 
                                    id="company" 
                                    value={formData.company} 
                                    onChange={(e) => handleChange("company", e.target.value)} 
                                    placeholder="Acme Inc." 
                                    className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-white text-slate-900" 
                                    required 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="goal" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Primary Objective</Label>
                                <Select value={formData.objective} onValueChange={(val) => handleChange("objective", val)}>
                                    <SelectTrigger className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-white text-slate-900 text-sm">
                                        <SelectValue placeholder="What are you looking to solve?" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg shadow-xl border-slate-200">
                                        <SelectItem value="hire-full-time">Hire Full-Time Leadership</SelectItem>
                                        <SelectItem value="hire-contractor">Hire Specialized Contractor</SelectItem>
                                        <SelectItem value="project-support">One-Time Project Delivery</SelectItem>
                                        <SelectItem value="advisory">Advisory / Consultation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="preferredDate" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Preferred Date</Label>
                                    <Input
                                        id="preferredDate"
                                        type="date"
                                        value={formData.preferredDate}
                                        onChange={(e) => handleChange("preferredDate", e.target.value)}
                                        className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-white text-slate-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="preferredTime" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Preferred Time</Label>
                                    <Select value={formData.preferredTime} onValueChange={(val) => handleChange("preferredTime", val)}>
                                        <SelectTrigger className="h-12 border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-white text-slate-900 text-sm">
                                            <SelectValue placeholder="Select time" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg shadow-xl border-slate-200">
                                            <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                                            <SelectItem value="afternoon">Afternoon (12PM - 4PM)</SelectItem>
                                            <SelectItem value="evening">Evening (4PM - 6PM)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Details (Optional)</Label>
                                <Textarea
                                    id="message"
                                    value={formData.details}
                                    onChange={(e) => handleChange("details", e.target.value)}
                                    placeholder="Tell us a bit about the role or the challenge..."
                                    className="min-h-[120px] border-slate-200 rounded-lg focus:ring-blue-600/10 focus:border-blue-600 bg-white text-slate-900 resize-none p-4 leading-relaxed placeholder:text-slate-400"
                                />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" disabled={loading} className="w-full h-12 bg-slate-950 hover:bg-blue-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                                    {loading ? "Processing..." : "Request Consultation →"}
                                </Button>
                                <p className="text-[11px] text-slate-400 font-medium text-center mt-4">
                                    We’ll respond within one business day.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookConsultation;
