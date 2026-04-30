import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
    CheckCircle2, 
    CreditCard, 
    ShieldCheck, 
    ArrowLeft, 
    Loader2,
    Lock,
    Mail,
    EyeOff,
    Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { PaystackService } from "@/lib/paystack";
import { redirectToZone, Zone } from "@/utils/subdomain";

interface AcademyCourse {
    id?: string;
    slug: string;
    title: string;
    price_naira: number;
    price_usd: number;
    level?: string;
    image_url?: string;
}

type CheckoutStep = 'cohort-selection' | 'email' | 'auth' | 'payment';

const Checkout = () => {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    // Core State
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [course, setCourse] = useState<AcademyCourse | null>(null);
    const [availableCohorts, setAvailableCohorts] = useState<any[]>([]);
    const [selectedCohortId, setSelectedCohortId] = useState<string>("");
    const [success, setSuccess] = useState(false);

    // Frictionless Flow State
    const [step, setStep] = useState<CheckoutStep>('cohort-selection');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isExistingUser, setIsExistingUser] = useState(false);
    
    useEffect(() => {
        const fetchCourseAndSession = async () => {
            if (!slug) return;
            try {
                // Fetch course details
                const { data, error } = await supabase
                    .from("academy_courses")
                    .select("*")
                    .eq("slug", slug)
                    .single();

                if (!error && data) {
                    setCourse(data as any);
                    
                    // Fetch open cohorts for this course
                    const { data: cohortsData } = await supabase
                         .from("cohorts")
                         .select("*")
                         .eq("course_id", data.id)
                         .eq("status", "open")
                         .order("created_at", { ascending: false });
                    
                    if (cohortsData && cohortsData.length > 0) {
                        setAvailableCohorts(cohortsData);
                        // START WITH COHORT SELECTION - DON'T AUTO-SELECT
                        setStep('cohort-selection');
                    } else {
                        // No cohorts available - show enrollment closed
                        setStep('cohort-selection');
                    }
                }

                // If user is already authenticated, still require cohort selection
                const { data: { session } } = await supabase.auth.getSession();
                if (session && session.user) {
                    setEmail(session.user.email || "");
                    setIsExistingUser(true);
                    // Don't skip - still need to select cohort
                }

            } catch (err) {
                console.error("Failed to format course:", err);
            }
            setLoading(false);
        };
        fetchCourseAndSession();
    }, [slug]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
            return;
        }

        setProcessing(true);
        try {
            // Check if user exists using the secure RPC
            const { data: exists, error } = await supabase.rpc('check_user_exists', { p_email: email.trim().toLowerCase() });
            
            if (error) throw error;

            setIsExistingUser(Boolean(exists));
            
            if (exists) {
                // Check if already logged in as this user
                const { data: { session } } = await supabase.auth.getSession();
                if (session && session.user.email?.toLowerCase() === email.trim().toLowerCase()) {
                    setStep('payment');
                } else {
                    // User exists but not logged in (or logged in as someone else)
                    // We need them to authenticate to link the enrollment
                    setStep('auth');
                }
            } else {
                // New users must create a password to secure their account
                setStep('auth');
            }
        } catch (err: any) {
            console.error("Failed to check user:", err);
            toast({ title: "Error", description: "Could not verify email. Please try again.", variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    const handleCohortSelection = (cohortId: string) => {
        if (!cohortId) {
            toast({ title: "Select a Cohort", description: "Please select a cohort to proceed.", variant: "destructive" });
            return;
        }
        setSelectedCohortId(cohortId);
        setStep('email');
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) {
            toast({ title: "Weak Password", description: "Password must be at least 8 characters long.", variant: "destructive" });
            return;
        }
        if (!isExistingUser && password !== confirmPassword) {
            toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
            return;
        }

        // Proceed to payment. We hold the password securely in state
        setStep('payment');
    };

    const handlePayment = async () => {
        if (!email || !course) {
            toast({ title: "Error", description: "Missing course or user data.", variant: "destructive" });
            return;
        }

        // ENFORCE: cohort_id is REQUIRED - cannot be null
        if (!selectedCohortId) {
            toast({ title: "Cohort Required", description: "Please select a cohort before proceeding to payment.", variant: "destructive" });
            return;
        }

        setProcessing(true);
        
        try {
            // Create Checkout Session reference
            const { data: sessionData, error: sessionError } = await supabase
                .from("checkout_sessions")
                .insert({
                    email: email.trim().toLowerCase(),
                    course_id: course.slug,
                    cohort_id: selectedCohortId, // NEVER null
                    user_exists: isExistingUser,
                    status: 'pending'
                })
                .select("id")
                .single();

            if (sessionError) throw sessionError;

            const sessionId = sessionData.id;
            
            const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
            
            if (!paystackPublicKey || paystackPublicKey === "") {
                console.warn("Paystack key missing or empty, using simulated flow. Key found:", paystackPublicKey);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return processPostPaymentSuccess("simulated_ref_" + Date.now(), sessionId);
            }

            const paystack = new PaystackService({ publicKey: paystackPublicKey });
            const amountKobo = Math.round((course.price_naira || 0) * 100);
            
            // Unique reference format
            const reference = `ENR_FRIC_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            await paystack.initializePayment({
                amount: amountKobo,
                email: email.trim().toLowerCase(),
                reference: reference,
                metadata: {
                    checkout_session_id: sessionId,
                    email: email.trim().toLowerCase(),
                    course_id: course.slug,
                    cohort_id: selectedCohortId, // NEVER null
                    type: 'academy_enrollment_frictionless'
                },
                onSuccess: (response) => {
                    console.log("Payment confirmed by Paystack:", response.reference);
                    setProcessing(false);
                    setSuccess(true);
                    processPostPaymentSuccess(response.reference, sessionId);
                },
                onClose: () => {
                    toast({ title: "Cancelled", description: "Payment was cancelled." });
                    setProcessing(false);
                }
            });
        } catch (err: unknown) {
            console.error("Payment initialization error:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to initialize payment";
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
            setProcessing(false);
        }
    };

    const processPostPaymentSuccess = async (reference: string, sessionId: string) => {
        try {
            console.log("Processing post-payment for session:", sessionId);
            let isUserLoggedIn = false;
            let activeUserId: string | null = null;
            
            // STEP 1: Authenticate the user
            try {
                if (!isExistingUser && password) {
                    const { data: authData, error: signUpError } = await supabase.auth.signUp({
                        email: email.trim().toLowerCase(),
                        password: password
                    });
                    
                    if (!signUpError && authData.user) {
                        isUserLoggedIn = true;
                        activeUserId = authData.user.id;
                        console.log("New user signed up successfully:", activeUserId);
                    } else if (signUpError) {
                        console.log("Signup error, trying sign-in:", signUpError.message);
                        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                            email: email.trim().toLowerCase(),
                            password: password
                        });
                        if (!signInError && signInData.user) {
                            isUserLoggedIn = true;
                            activeUserId = signInData.user.id;
                            console.log("Signed in successfully:", activeUserId);
                        }
                    }
                } else if (isExistingUser) {
                    const { data: { session } } = await supabase.auth.getSession();
                    isUserLoggedIn = !!session;
                    activeUserId = session?.user?.id || null;
                    console.log("Existing user login state:", isUserLoggedIn, activeUserId);
                }
            } catch (authErr) {
                console.error("Auth processing error:", authErr);
            }

            // STEP 2: Always create enrollment client-side (webhook is backup)
            if (activeUserId && course) {
                // Check if enrollment already exists for THIS SPECIFIC COHORT (not just course)
                const { data: existingEnrollment } = await supabase
                    .from("academy_enrollments")
                    .select("id")
                    .eq("user_id", activeUserId)
                    .eq("cohort_id", selectedCohortId)
                    .maybeSingle();

                if (!existingEnrollment) {
                    const { data: enrollData, error: enrollErr } = await supabase.from("academy_enrollments").insert({
                        user_id: activeUserId,
                        course_id: course.slug,
                        cohort_id: selectedCohortId, // ENFORCED: Never null
                        course_name: course.title,
                        student_email: email.trim().toLowerCase(),
                        student_name: email.split('@')[0],
                        enrollment_status: "active",
                        price_naira: course.price_naira,
                        price_usd: course.price_usd,
                        enrollment_date: new Date().toISOString(),
                        access_granted_at: new Date().toISOString()
                    }).select("id").single();

                    const enrollmentId = enrollData?.id;
                    if (enrollErr) {
                        console.error("Enrollment insert error:", enrollErr);
                        toast({
                            title: "Enrollment Failed",
                            description: "Payment succeeded, but we couldn't save your enrollment. Please contact support. Error: " + enrollErr.message,
                            variant: "destructive"
                        });
                        setProcessing(false);
                        return; // Stop the flow
                    } else {
                        console.log("Enrollment record created successfully");
                        
                        // Increment cohort slots in real-time for immediate admin visibility
                        // Use a more robust increment logic
                        try {
                            const { data: cohortData, error: cohortFetchErr } = await supabase
                                .from("cohorts")
                                .select("current_slots")
                                .eq("id", selectedCohortId)
                                .single();
                                
                            if (!cohortFetchErr && cohortData) {
                                const newCount = (cohortData.current_slots || 0) + 1;
                                const { error: countErr } = await supabase
                                    .from("cohorts")
                                    .update({ current_slots: newCount })
                                    .eq("id", selectedCohortId);
                                
                                if (countErr) console.error("Failed to update cohort slots:", countErr);
                                else console.log("Cohort slots updated to:", newCount);
                            }
                        } catch (countErr) {
                            console.error("Critical error updating slots:", countErr);
                        }

                        // Trigger Branded Enrollment Email via specialized function
                        try {
                            await supabase.functions.invoke('send-enrollment-email', {
                                body: {
                                    enrollmentId: enrollmentId || "",
                                    studentEmail: email.trim().toLowerCase(),
                                    studentName: email.split('@')[0],
                                    courseName: course.title,
                                    duration: course.duration || "4 Weeks",
                                    level: course.level || "Beginner",
                                    amountNaira: course.price_naira || 0,
                                    reference: reference || "academy_checkout"
                                }
                            });
                            console.log("Enrollment email sent successfully via edge function");
                        } catch (emailErr) {
                            console.error("Failed to send enrollment email:", emailErr);
                            // Don't block the UI if email fails
                        }
                    }
                } else {
                    console.log("Enrollment already exists:", existingEnrollment.id);
                }
            } else {
                toast({
                    title: "Authentication Error",
                    description: "Payment succeeded, but we couldn't log you in. Please log in manually.",
                    variant: "destructive"
                });
                setProcessing(false);
                setTimeout(() => navigate("/login?redirect=/dashboard"), 3000);
                return;
            }

            setSuccess(true);
            setProcessing(false);
            
            toast({
                title: "Enrollment Successful! 🎉",
                description: `Welcome to ${course?.title}. We're preparing your hub.`,
            });

            // Delay redirect to show success state
            setTimeout(() => {
                if (isUserLoggedIn) {
                    navigate("/dashboard");
                } else {
                    navigate("/login?redirect=/dashboard");
                }
            }, 3000);

        } catch (err: any) {
            console.error("Post-payment sync error:", err);
            toast({
                title: "Warning",
                description: "Payment successful, but we had trouble logging you in automatically. Please log in manually.",
            });
            setTimeout(() => {
                navigate("/login?redirect=/dashboard");
            }, 3000);
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
                    <Button onClick={() => navigate("/browse")}>Return to Catalog</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-32 pb-24 px-6 lg:px-12 font-inter">
            <div className="w-full max-w-none">
                <AnimatePresence mode="wait">
                    {availableCohorts.length === 0 ? (
                        <motion.div 
                            key="nocohorts"
                            className="bg-white rounded-3xl p-10 shadow border border-slate-100 flex flex-col items-center justify-center text-center mx-4 max-w-2xl mt-12 mb-12 lg:col-span-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                                <Lock className="w-8 h-8 text-slate-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-3">Enrolment Closed</h2>
                            <p className="text-slate-500 mb-8 max-w-md">There are currently no active cohorts enrolling for this course. Please join the waitlist or check back soon.</p>
                            <Button className="h-12 px-6 rounded-xl font-bold bg-slate-900 text-white" onClick={() => searchParams.get("from") === "dashboard" ? navigate("/dashboard") : navigate(-1)}>
                                Go Back
                            </Button>
                        </motion.div>
                    ) : !success ? (
                        <motion.div 
                            key="checkout"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="grid grid-cols-1 lg:grid-cols-4 gap-10 w-full"
                        >
                            <div className="lg:col-span-2 space-y-8 lg:col-start-2">
                                <button 
                                    onClick={() => searchParams.get("from") === "dashboard" ? navigate("/dashboard") : navigate(-1)}
                                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors mb-4"
                                >
                                    <ArrowLeft className="w-4 h-4" /> {searchParams.get("from") === "dashboard" ? "Back to Dashboard" : "Back to Program"}
                                </button>
                                
                                <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row gap-6 items-center">
                                    <div className="w-full md:w-40 aspect-video rounded-lg overflow-hidden shrink-0 shadow-sm">
                                        <img 
                                            src={course.image_url || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"} 
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-2">{course.title}</h2>
                                        <p className="text-sm font-bold text-blue-600 mb-1">Total: ₦{course.price_naira.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10">
                                    {step === 'cohort-selection' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Choose Your Cohort</h1>
                                                <p className="text-slate-500 font-medium">Select the batch you want to join. Each cohort has its own schedule and community.</p>
                                            </div>
                                            
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {availableCohorts.length > 0 ? (
                                                    availableCohorts.map((cohort) => {
                                                        const isSelected = selectedCohortId === cohort.id;
                                                        const enrollmentDeadline = new Date(cohort.enrollment_end_date);
                                                        const daysLeft = Math.ceil((enrollmentDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                                        const slotsAvailable = (cohort.max_slots || 25) - (cohort.current_slots || 0);
                                                        
                                                        return (
                                                            <button
                                                                key={cohort.id}
                                                                onClick={() => handleCohortSelection(cohort.id)}
                                                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                                                    isSelected 
                                                                        ? 'border-blue-600 bg-blue-50' 
                                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1">
                                                                        <h3 className="font-bold text-slate-900 mb-1">{cohort.name}</h3>
                                                                        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 mb-2">
                                                                            <div>📅 Starts: {new Date(cohort.start_date).toLocaleDateString()}</div>
                                                                            <div>⏳ Ends: {new Date(cohort.end_date).toLocaleDateString()}</div>
                                                                            <div>🎯 {slotsAvailable} slots available</div>
                                                                            <div>⏰ {daysLeft} days to enroll</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                                                        isSelected 
                                                                            ? 'border-blue-600 bg-blue-600' 
                                                                            : 'border-slate-300'
                                                                    }`}>
                                                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                                        <p className="text-slate-500 font-medium">No active cohorts available</p>
                                                    </div>
                                                )}
                                            </div>

                                            <Button 
                                                onClick={() => {
                                                    if (!selectedCohortId) {
                                                        toast({ title: "Select a Cohort", description: "Please select a cohort to proceed.", variant: "destructive" });
                                                        return;
                                                    }
                                                    setStep('email');
                                                }}
                                                disabled={!selectedCohortId || availableCohorts.length === 0}
                                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-lg shadow-sm"
                                            >
                                                Continue to Enrollment
                                            </Button>
                                        </div>
                                    )}

                                    {step === 'email' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Let's get started</h1>
                                                <p className="text-slate-500 font-medium">Enter your email to verify your identity.</p>
                                            </div>
                                            <form onSubmit={handleEmailSubmit} className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Email Address</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                        <input 
                                                            type="email" 
                                                            required
                                                            placeholder="name@example.com"
                                                            className="w-full h-14 pl-12 pr-6 bg-slate-50 rounded-2xl border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button 
                                                        type="button"
                                                        onClick={() => setStep('cohort-selection')}
                                                        className="flex-1 h-14 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl font-bold text-lg"
                                                    >
                                                        Back
                                                    </Button>
                                                    <Button 
                                                        type="submit" 
                                                        disabled={processing}
                                                        className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-sm"
                                                    >
                                                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {step === 'auth' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
                                                    {isExistingUser ? "Welcome back!" : "Create your account"}
                                                </h1>
                                                <p className="text-slate-500 font-medium">
                                                    {isExistingUser 
                                                        ? "Sign in to your account to continue with the enrollment."
                                                        : "Set a password to access your student dashboard after payment."}
                                                </p>
                                            </div>
                                            <div className="px-4 py-3 bg-blue-50 text-blue-800 rounded-lg text-sm font-medium border border-blue-100 flex items-center gap-3">
                                                 <Mail className="w-4 h-4 text-blue-500" /> {email}
                                            </div>
                                            <form onSubmit={handleAuthSubmit} className="space-y-6">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                                                            {isExistingUser ? "Your Password" : "Create Password"}
                                                        </label>
                                                        <div className="relative">
                                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                            <input 
                                                                type={showPassword ? "text" : "password"} 
                                                                required
                                                                placeholder={isExistingUser ? "Enter your password" : "Min. 8 characters"}
                                                                className="w-full h-14 pl-12 pr-14 bg-slate-50 rounded-2xl border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                                                value={password}
                                                                onChange={(e) => setPassword(e.target.value)}
                                                            />
                                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
                                                                {showPassword ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-slate-400" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {!isExistingUser && (
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Confirm Password</label>
                                                            <div className="relative">
                                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                                <input 
                                                                    type={showPassword ? "text" : "password"} 
                                                                    required
                                                                    placeholder="Confirm password"
                                                                    className="w-full h-14 pl-12 pr-14 bg-slate-50 rounded-2xl border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                                                    value={confirmPassword}
                                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button 
                                                        type="button"
                                                        onClick={() => setStep('email')}
                                                        className="flex-1 h-14 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl font-bold text-lg"
                                                    >
                                                        Back
                                                    </Button>
                                                    <Button 
                                                        type="submit" 
                                                        className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-sm"
                                                    >
                                                        Continue to Payment
                                                    </Button>
                                                </div>
                                            </form>
                                            <button onClick={() => setStep('cohort-selection')} className="text-sm font-bold text-slate-500 hover:text-slate-900">
                                                Change cohort
                                            </button>
                                        </div>
                                    )}

                                    {step === 'payment' && (
                                        <div className="space-y-8">
                                            <div>
                                                <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Complete Enrollment</h1>
                                                {isExistingUser ? (
                                                     <p className="text-slate-500 font-medium">Welcome back, <span className="font-bold text-slate-900">{email}</span>. Please complete your payment.</p>
                                                ) : (
                                                     <p className="text-slate-500 font-medium">Your account is ready. Complete your payment to get instant access.</p>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Payment Method</h3>
                                                <div className="border-2 border-blue-600 bg-blue-50/50 p-6 rounded-xl relative flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <CreditCard className="w-6 h-6 text-blue-600" />
                                                        <div>
                                                            <div className="font-bold text-slate-900">Card Payment (Paystack)</div>
                                                            <div className="text-xs text-slate-500 font-medium">Visa, Mastercard, Verve</div>
                                                        </div>
                                                    </div>
                                                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                                </div>
                                            </div>

                                            <Button 
                                                onClick={handlePayment}
                                                disabled={processing}
                                                className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-sm gap-3 transition-colors"
                                            >
                                                {processing ? (
                                                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                                                ) : (
                                                    <><Lock className="w-5 h-5" /> Pay ₦{course.price_naira.toLocaleString()} Securely</>
                                                )}
                                            </Button>
                                            
                                            <div className="flex items-center gap-3 justify-center pt-4 opacity-60">
                                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                <span className="text-xs font-bold text-slate-500">Encrypted and Secure Transaction</span>
                                            </div>
                                        </div>
                                    )}
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
                            <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">You're Enrolled! 🎉</h2>
                            <p className="text-lg text-slate-500 font-medium mb-12">
                                We've successfully processed your enrollment for <span className="text-blue-600 font-bold">{course?.title}</span>. 
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
