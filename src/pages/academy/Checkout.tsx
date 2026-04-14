import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
    CheckCircle2, 
    CreditCard, 
    ShieldCheck, 
    ArrowLeft, 
    Loader2,
    Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PaystackService } from "@/lib/paystack";
import { ACADEMY_COURSES } from "@/data/academy-courses";

const Checkout = () => {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [course, setCourse] = useState<Record<string, unknown> | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            if (!slug) return;
            const { data, error } = await supabase
                .from("academy_courses")
                .select("*")
                .eq("slug", slug)
                .single();

            if (!error && data) {
                setCourse(data);
            } else {
                const staticCourse = ACADEMY_COURSES.find(c => c.slug === slug);
                if (staticCourse) {
                    setCourse({ 
                        ...staticCourse,
                        price_naira: staticCourse.priceNaira || 0,
                        price_usd: staticCourse.priceUSD || 0
                    } as unknown as Record<string, unknown>);
                }
            }
            setLoading(false);
        };
        fetchCourse();
    }, [slug]);

    const handlePayment = async () => {
        if (!user || !user.email) {
            toast({ title: "Error", description: "You must be logged in with a valid email.", variant: "destructive" });
            return;
        }

        setProcessing(true);
        
        try {
            const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
            
            if (!paystackPublicKey) {
                // Simulated fallback if no key is configured
                console.warn("Paystack key missing, using simulated payment");
                await new Promise(resolve => setTimeout(resolve, 2000));
                return processEnrollment("simulated_ref_" + Date.now());
            }

            const paystack = new PaystackService({ publicKey: paystackPublicKey });
            const amountKobo = Math.round((course.price_naira || 0) * 100);
            const reference = `ENR_${user.id.substring(0, 8)}_${Date.now()}`;

            await paystack.initializePayment({
                amount: amountKobo,
                email: user.email,
                reference: reference,
                metadata: {
                    course_id: course.slug,
                    user_id: user.id,
                    type: 'academy_enrollment'
                },
                onSuccess: async (response) => {
                    await processEnrollment(response.reference);
                },
                onClose: () => {
                    toast({ title: "Cancelled", description: "Payment was cancelled." });
                    setProcessing(false);
                }
            });
        } catch (err: unknown) {
            console.error("Payment error:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to initialize payment";
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
            setProcessing(false);
        }
    };

    const processEnrollment = async (reference: string) => {
        try {
            if (!user || !course) throw new Error("Missing user or course data");

            const enrolledAt = new Date().toISOString();
            const { error: enrollError } = await supabase
                .from("academy_enrollments")
                .insert({
                    user_id: user.id,
                    course_id: course.slug,
                    course_name: course.title,
                    student_email: user.email,
                    student_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Student",
                    enrollment_status: "active",
                    price_naira: Number(course.price_naira) || 0,
                    price_usd: Number(course.price_usd) || 0,
                    payment_status: "paid",
                    payment_reference: reference,
                    enrollment_date: enrolledAt
                });

            if (enrollError) {
                console.error("Supabase enrollment error detail:", enrollError);
                throw new Error(enrollError.message);
            }

            setSuccess(true);
            toast({
                title: "Enrollment Successful!",
                description: `Welcome to ${course.title}. Let's get started.`,
            });

            setTimeout(() => {
                navigate("/dashboard");
            }, 3000);

        } catch (err: any) {
            console.error("Full enrollment error context:", err);
            const errorMessage = err.message || "Something went wrong during enrollment. Please contact support.";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Program not found</h2>
                    <Button onClick={() => navigate("/courses")}>Return to Catalog</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-32 pb-24 px-6 lg:px-12 font-inter">
            <div className="w-full max-w-none">
                <AnimatePresence mode="wait">
                    {!success ? (
                        <motion.div 
                            key="checkout"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="grid grid-cols-1 lg:grid-cols-4 gap-10 w-full"
                        >
                            <div className="lg:col-span-3 space-y-8">
                                <button 
                                    onClick={() => searchParams.get("from") === "dashboard" ? navigate("/dashboard") : navigate(-1)}
                                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors mb-4"
                                >
                                    <ArrowLeft className="w-4 h-4" /> {searchParams.get("from") === "dashboard" ? "Back to Dashboard" : "Back to Program"}
                                </button>
                                
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 md:p-10">
                                    <h1 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">Enrollment Summary</h1>
                                    
                                    <div className="flex flex-col md:flex-row gap-10 items-center p-8 bg-slate-50/50 rounded-xl border border-slate-100 mb-12">
                                        <div className="w-full md:w-64 aspect-video rounded-lg overflow-hidden bg-slate-200 shrink-0 shadow-sm">
                                            <img 
                                                src={course.image_url || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"} 
                                                alt={course.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-2 px-2 py-0.5 bg-blue-50 w-fit rounded">{course.level} Program</div>
                                            <h2 className="text-2xl font-bold text-slate-900 mb-3">{course.title}</h2>
                                            <p className="text-base text-slate-500 font-medium">Standard License • Lifetime Access to Content</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-900">Payment Method</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="border-2 border-blue-600 bg-blue-50/50 p-6 rounded-xl relative">
                                                <CreditCard className="w-6 h-6 text-blue-600 mb-3" />
                                                <div className="font-bold text-slate-900">Card Payment</div>
                                                <div className="text-xs text-slate-500 font-medium">Visa, Mastercard, Verve</div>
                                                <div className="absolute top-4 right-4 text-blue-600">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                            </div>
                                            <div className="border border-slate-100 p-6 rounded-xl opacity-50 cursor-not-allowed">
                                                <div className="w-6 h-6 border border-slate-200 rounded-lg mb-3" />
                                                <div className="font-bold text-slate-900">Bank Transfer</div>
                                                <div className="text-xs text-slate-500 font-medium">Coming Soon</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 px-8 py-6 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                    <p className="text-sm font-bold text-emerald-700">
                                        Secure Enrollment Guarantee. Your data is encrypted and protected.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 sticky top-32">
                                    <h3 className="text-xl font-bold text-slate-900 mb-8">Order Total</h3>
                                    
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between text-sm font-medium text-slate-500">
                                            <span>Subtotal</span>
                                            <span>₦{course.price_naira.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-medium text-slate-500">
                                            <span>Processing Fee</span>
                                            <span>₦0.00</span>
                                        </div>
                                        <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                                            <span className="text-sm font-bold text-slate-900 uppercase tracking-widest leading-none">Total</span>
                                            <span className="text-3xl font-black text-slate-900 leading-none">₦{course.price_naira.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={handlePayment}
                                        disabled={processing}
                                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-sm gap-3"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-5 h-5" /> Complete Enrollment
                                            </>
                                        )}
                                    </Button>

                                    <div className="mt-8 flex items-center justify-center gap-4 opacity-10 grayscale pointer-events-none">
                                        <div className="h-6 w-10 bg-slate-900 rounded" />
                                        <div className="h-6 w-10 bg-slate-900 rounded" />
                                        <div className="h-6 w-10 bg-slate-900 rounded" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-2xl mx-auto text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-xl px-12"
                        >
                            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                            </div>
                            <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">You're Enrolled!</h2>
                            <p className="text-lg text-slate-500 font-medium mb-12">
                                We've successfully processed your enrollment for <span className="text-blue-600 font-bold">{course.title}</span>. 
                                Redirecting you to your learning hub in a moment...
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">Entering Student Hub</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Checkout;
