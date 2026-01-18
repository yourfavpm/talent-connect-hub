
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
            const { error } = await supabase.from("consultations" as any).insert({
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
        } catch (error: any) {
            console.error("Error submitting consultation:", error);
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
        <div className="min-h-screen bg-[#FDFCF8] selection:bg-stone-200 selection:text-stone-900 font-sans">
            <div className="w-full h-full absolute top-0 left-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-slate-100/50 rounded-full blur-[100px] opacity-60"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-stone-100/80 rounded-full blur-[100px] opacity-60"></div>
            </div>

            <div className="relative z-10 container max-w-6xl mx-auto py-12 md:py-20 px-6">
                <Link to="/" className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-stone-900 mb-12 transition-colors group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back
                </Link>

                <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
                    {/* LEFT: Context & "Alive" Elements */}
                    <div className="lg:sticky lg:top-24">
                        <h1 className="text-5xl md:text-6xl font-serif text-stone-900 mb-6 leading-[1.1]">
                            Let's find your <br /> <span className="italic text-stone-500">ideal match.</span>
                        </h1>
                        <p className="text-xl text-stone-600 mb-12 leading-relaxed max-w-md">
                            Tell us about the role, the culture, and the goals. We'll handle the vetting and the search.
                        </p>

                        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 relative">
                            <div className="absolute -top-4 -right-4 bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase">Trusted</div>
                            <div className="flex gap-1 text-yellow-500 mb-4">
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                            </div>
                            <p className="text-stone-800 text-lg mb-6 leading-relaxed font-serif italic">
                                "Taskive found us a Head of Ops in 4 days. The quality of talent was unlike anything we'd seen from traditional recruiters."
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-stone-200 rounded-full overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1554151228-14d9def656ec?auto=format&fit=crop&q=80" alt="Client" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-bold text-stone-900 text-sm">Sarah Jenks</div>
                                    <div className="text-stone-500 text-xs uppercase tracking-wide">Founder, Articulate</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Form */}
                    <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-2xl shadow-stone-200/40 border border-white">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="firstName" className="text-stone-600 text-xs font-bold uppercase tracking-widest pl-1">First Name</Label>
                                    <Input id="firstName" value={formData.firstName} onChange={(e) => handleChange("firstName", e.target.value)} placeholder="Jane" className="h-14 bg-stone-50 border-transparent focus:bg-white focus:border-stone-200 rounded-xl" required />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="lastName" className="text-stone-600 text-xs font-bold uppercase tracking-widest pl-1">Last Name</Label>
                                    <Input id="lastName" value={formData.lastName} onChange={(e) => handleChange("lastName", e.target.value)} placeholder="Doe" className="h-14 bg-stone-50 border-transparent focus:bg-white focus:border-stone-200 rounded-xl" required />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="email" className="text-stone-600 text-xs font-bold uppercase tracking-widest pl-1">Work Email</Label>
                                <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="jane@company.com" className="h-14 bg-stone-50 border-transparent focus:bg-white focus:border-stone-200 rounded-xl" required />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="company" className="text-stone-600 text-xs font-bold uppercase tracking-widest pl-1">Company</Label>
                                <Input id="company" value={formData.company} onChange={(e) => handleChange("company", e.target.value)} placeholder="Acme Inc." className="h-14 bg-stone-50 border-transparent focus:bg-white focus:border-stone-200 rounded-xl" required />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="goal" className="text-stone-600 text-xs font-bold uppercase tracking-widest pl-1">Primary Objective</Label>
                                <Select value={formData.objective} onValueChange={(val) => handleChange("objective", val)}>
                                    <SelectTrigger className="h-14 bg-stone-50 border-transparent focus:bg-white focus:border-stone-200 rounded-xl">
                                        <SelectValue placeholder="What are you looking to solve?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hire-full-time">Hire Full-Time Leadership</SelectItem>
                                        <SelectItem value="hire-contractor">Hire Specialized Contractor</SelectItem>
                                        <SelectItem value="project-support">One-Time Project Delivery</SelectItem>
                                        <SelectItem value="advisory">Advisory / Consultation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="preferredDate" className="text-stone-600 text-xs font-bold uppercase tracking-widest pl-1">Preferred Date</Label>
                                    <Input
                                        id="preferredDate"
                                        type="date"
                                        value={formData.preferredDate}
                                        onChange={(e) => handleChange("preferredDate", e.target.value)}
                                        className="h-14 bg-stone-50 border-transparent focus:bg-white focus:border-stone-200 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="preferredTime" className="text-stone-600 text-xs font-bold uppercase tracking-widest pl-1">Preferred Time</Label>
                                    <Select value={formData.preferredTime} onValueChange={(val) => handleChange("preferredTime", val)}>
                                        <SelectTrigger className="h-14 bg-stone-50 border-transparent focus:bg-white focus:border-stone-200 rounded-xl">
                                            <SelectValue placeholder="Select time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                                            <SelectItem value="afternoon">Afternoon (12PM - 4PM)</SelectItem>
                                            <SelectItem value="evening">Evening (4PM - 6PM)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="message" className="text-stone-600 text-xs font-bold uppercase tracking-widest pl-1">Details (Optional)</Label>
                                <Textarea
                                    id="message"
                                    value={formData.details}
                                    onChange={(e) => handleChange("details", e.target.value)}
                                    placeholder="Tell us a bit about the role or the challenge..."
                                    className="min-h-[140px] bg-stone-50 border-transparent focus:bg-white focus:border-stone-200 rounded-xl resize-none p-4 leading-relaxed"
                                />
                            </div>

                            <Button type="submit" size="lg" disabled={loading} className="w-full h-16 text-lg font-bold rounded-xl bg-stone-900 text-white hover:bg-stone-800 shadow-xl shadow-stone-900/10">
                                {loading ? "Submitting..." : "Request Consultation"}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookConsultation;
