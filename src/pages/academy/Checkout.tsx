import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { KoraService } from "@/lib/kora";
import { PaystackService } from "@/lib/paystack";
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
    Eye,
    Upload,
    Copy,
    Building2,
    Clock,
    FileCheck,
    Tag,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// Bank transfer account details (offline payment mode)
const BANK_ACCOUNT = {
    bank: "Providus Bank",
    accountNumber: "9644785924",
    accountName: "Taskive Businesses",
};

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

type PaymentProvider = 'paystack' | 'kora';

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
    const [isOfflinePayment, setIsOfflinePayment] = useState(false);

    // Frictionless Flow State
    const [step, setStep] = useState<CheckoutStep>('cohort-selection');
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isExistingUser, setIsExistingUser] = useState(false);

    // Receipt upload state
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptUploading, setReceiptUploading] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('paystack');
    const [showBankTransfer, setShowBankTransfer] = useState(false);

    // Coupon state
    const [couponInput, setCouponInput] = useState("");
    const [couponApplying, setCouponApplying] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<{
        code: string;
        discountPct: number;
        couponId: string;
        message: string;
    } | null>(null);
    const [couponError, setCouponError] = useState("");

    // Payment plan state
    const [paymentPlan, setPaymentPlan] = useState<'full' | 'installment'>('full');
    
    // Proactively preload Kora Script on mount
    useEffect(() => {
        const koraPublicKey = import.meta.env.VITE_KORA_PUBLIC_KEY;
        if (koraPublicKey && koraPublicKey !== "") {
            try {
                new KoraService({ publicKey: koraPublicKey });
            } catch (e) {
                console.warn("Kora preloading was deferred:", e);
            }
        }
    }, []);

    // Handle Kora hosted checkout redirect callback
    useEffect(() => {
        const handleRedirectCallback = async () => {
            const paymentStatus = searchParams.get("payment_status");
            const reference = searchParams.get("reference");
            const sessionId = searchParams.get("session_id");

            if (paymentStatus === "success" && reference && sessionId) {
                setLoading(true);
                try {
                    // Try restoring session info from localStorage
                    const savedDataStr = localStorage.getItem('checkout_pending_data');
                    let pendingEmail = "";
                    let pendingName = "";
                    let pendingCohortId = "";

                    if (savedDataStr) {
                        const savedData = JSON.parse(savedDataStr);
                        pendingEmail = savedData.email || "";
                        pendingName = savedData.fullName || "";
                        pendingCohortId = savedData.selectedCohortId || "";
                    }

                    // Fallback to supabase checkout_sessions query if localStorage was cleared
                    if (!pendingEmail || !pendingCohortId) {
                        const { data: session, error } = await supabase
                            .from("checkout_sessions")
                            .select("email, cohort_id")
                            .eq("id", sessionId)
                            .maybeSingle();

                        if (!error && session) {
                            pendingEmail = session.email;
                            pendingCohortId = session.cohort_id;
                            pendingName = session.email.split('@')[0];
                        }
                    }

                    if (pendingEmail && pendingCohortId) {
                        setEmail(pendingEmail);
                        setFullName(pendingName);
                        setSelectedCohortId(pendingCohortId);
                        setIsOfflinePayment(false);
                        setSuccess(true);
                        
                        await processPostPaymentSuccess(reference, sessionId, pendingEmail, pendingName, pendingCohortId);
                    }
                } catch (err) {
                    console.error("Error processing Kora redirect callback:", err);
                } finally {
                    setLoading(false);
                }
            }
        };

        handleRedirectCallback();
    }, [searchParams]);

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
                         .eq("status", "open")
                         .order("start_date", { ascending: true });
                    
                    const cohortsWithCapacity = (cohortsData || []).filter((cohort: any) => (
                        (cohort.course_id === data.id || cohort.course_id === data.slug || cohort.course_uuid === data.id) &&
                        (cohort.current_slots || 0) < (cohort.max_slots || 25)
                    ));

                    if (cohortsWithCapacity.length > 0) {
                        setAvailableCohorts(cohortsWithCapacity);
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
        if (!fullName.trim()) {
            toast({ title: "Name Required", description: "Please enter your full name.", variant: "destructive" });
            return;
        }

        setProcessing(true);
        try {
            // Check if user exists using the secure RPC
            const { data: exists, error } = await supabase.rpc('check_user_exists', { p_email: email.trim().toLowerCase() });
            
            if (!error) {
                setIsExistingUser(Boolean(exists));
            }

            // We no longer require users to set passwords during checkout
            // Go directly to payment
            setStep('payment');
        } catch (err: any) {
            console.error("Failed to check user:", err);
            // Even if the check fails, we can proceed to payment
            setStep('payment');
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

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast({ title: "Copied!", description: `${field} copied to clipboard.` });
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            toast({ title: "Copy failed", description: "Please copy manually.", variant: "destructive" });
        }
    };

    // ── Coupon helpers ──────────────────────────────────────────
    const getDiscountedPrice = (originalNaira: number, originalUsd: number) => {
        if (!appliedCoupon) return { naira: originalNaira, usd: originalUsd };
        const factor = 1 - appliedCoupon.discountPct / 100;
        return {
            naira: Math.round(originalNaira * factor),
            usd: parseFloat((originalUsd * factor).toFixed(2)),
        };
    };

    // ── Installment plan calculator ──────────────────────────────
    // Returns installment breakdown applied AFTER coupon discount.
    // Installment total = discounted price × 1.05 (5% surcharge)
    // Installment 1 (due now)  = 60% of installment total
    // Installment 2 (due wk 2) = 40% of installment total
    const getInstallmentPlan = (discountedNaira: number) => {
        const total = Math.round(discountedNaira * 1.05);
        const inst1 = Math.round(total * 0.60);
        const inst2 = total - inst1;
        return { total, inst1, inst2 };
    };

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        if (!course) return;
        setCouponError("");
        setCouponApplying(true);
        try {
            const { data, error } = await supabase.rpc("validate_coupon", {
                p_course_slug: course.slug,
                p_code: couponInput.trim(),
            });

            if (error) throw error;

            if (data?.valid) {
                setAppliedCoupon({
                    code: couponInput.trim().toUpperCase(),
                    discountPct: data.discount_pct,
                    couponId: data.coupon_id,
                    message: data.message,
                });
                setCouponInput("");
                toast({ title: "Coupon applied! 🎉", description: data.message });
            } else {
                setCouponError(data?.message || "Invalid coupon code.");
            }
        } catch (err: any) {
            setCouponError(err.message || "Failed to validate coupon.");
        } finally {
            setCouponApplying(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponError("");
        setCouponInput("");
    };

    const handleReceiptSubmit = async () => {
        if (!receiptFile) {
            toast({ title: "Receipt Required", description: "Please upload your payment receipt before submitting.", variant: "destructive" });
            return;
        }
        if (!email || !course) {
            toast({ title: "Error", description: "Missing course or contact data.", variant: "destructive" });
            return;
        }
        if (!selectedCohortId) {
            toast({ title: "Cohort Required", description: "Please select a cohort first.", variant: "destructive" });
            return;
        }

        setReceiptUploading(true);
        try {
            // 1. Upload file to Supabase Storage
            const ext = receiptFile.name.split('.').pop() || 'jpg';
            const fileName = `receipts/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('payment-receipts')
                .upload(fileName, receiptFile, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            // Build a signed URL (valid 10 years) so admins can view it later
            const { data: signedData } = await supabase.storage
                .from('payment-receipts')
                .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10);

            const receiptUrl = signedData?.signedUrl || uploadData?.path || '';

            // 2. Record the submission
            const { error: insertError } = await supabase
                .from('payment_receipt_submissions')
                .insert({
                    email: email.trim().toLowerCase(),
                    student_name: fullName.trim() || email.split('@')[0],
                    course_id: course.slug,
                    cohort_id: selectedCohortId,
                    receipt_url: receiptUrl,
                    status: 'pending'
                });

            if (insertError) {
                console.error('Receipt insert error:', insertError);
                // Non-fatal — continue to send email
            }

            // 2.5 Record enrollment with 'pending_payment' status so it shows up in CohortDetail
            let studentId: string | null = null;
            try {
                const { data: { session } } = await supabase.auth.getSession();
                studentId = session?.user?.id || null;
            } catch (e) {
                console.log("Session fetch error:", e);
            }

            if (!studentId) {
                try {
                    const { data: existingUserId } = await supabase.rpc('get_user_id_by_email', { p_email: email.trim().toLowerCase() });
                    studentId = existingUserId || null;
                } catch (e) {
                    console.log("RPC get_user_id_by_email error:", e);
                }
            }

            const { error: enrollError } = await supabase
                .from('academy_enrollments')
                .insert({
                    student_id: studentId,
                    course_id: course.slug,
                    cohort_id: selectedCohortId,
                    course_name: course.title,
                    student_email: email.trim().toLowerCase(),
                    student_name: fullName.trim() || email.split('@')[0],
                    enrollment_status: 'pending_payment',
                    price_naira: course.price_naira || 0,
                    price_usd: course.price_usd || 0,
                    enrollment_date: new Date().toISOString()
                });

            if (enrollError) {
                console.error('Enrollment insert error:', enrollError);
            }

            // 3. Send receipt confirmation email
            try {
                const firstName = (fullName.trim() || email.split('@')[0]).split(' ')[0];
                await supabase.functions.invoke('send-email', {
                    body: {
                        templateKey: 'payment_receipt_received',
                        to: email.trim().toLowerCase(),
                        variables: {
                            firstName,
                            courseName: course.title,
                        }
                    }
                });
            } catch (emailErr) {
                console.error('Receipt email failed:', emailErr);
            }

            setIsOfflinePayment(true);
            setSuccess(true);
            toast({
                title: "Receipt Submitted! 📨",
                description: `We've received your receipt and will verify your payment shortly.`,
            });
        } catch (err: any) {
            console.error('Receipt upload error:', err);
            toast({ title: "Upload Failed", description: err.message || "Could not upload receipt. Please try again.", variant: "destructive" });
        } finally {
            setReceiptUploading(false);
        }
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

        // Compute discounted prices
        const { naira: discountedNaira, usd: discountedUsd } = getDiscountedPrice(
            course.price_naira,
            course.price_usd
        );

        // Compute installment amounts if applicable
        const installmentData = paymentPlan === 'installment'
            ? getInstallmentPlan(discountedNaira)
            : null;

        // The amount charged NOW
        const finalNaira = paymentPlan === 'installment' ? installmentData!.inst1 : discountedNaira;
        const finalUsd   = discountedUsd; // USD stored at discounted rate

        // Installment 2 due date = cohort start date + 14 days (2 weeks into program)
        let inst2DueDate: string | null = null;
        if (paymentPlan === 'installment') {
            const cohortStart = cohortInfo?.start_date
                ? new Date(cohortInfo.start_date)
                : new Date();
            cohortStart.setDate(cohortStart.getDate() + 14);
            inst2DueDate = cohortStart.toISOString();
        }
        
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
            
            // Determine which payment provider to use
            const amountKobo = Math.round(finalNaira * 100); // use discounted/installment price
            
            // Generate a shorter, completely unique transaction reference (16 chars max, no underscores)
            const reference = `ENR-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            // Save pending checkout state to localStorage to prevent data loss on page redirects
            localStorage.setItem('checkout_pending_data', JSON.stringify({
                email: email.trim().toLowerCase(),
                fullName: fullName.trim(),
                selectedCohortId: selectedCohortId,
            }));

            const paymentMetadata = {
                user_id: null,
                course_id: course.slug,
                cohort_id: selectedCohortId,
                type: "academy_enrollment",
                checkout_session_id: sessionId,
                student_name: fullName.trim() || email.split('@')[0],
            };

            if (paymentProvider === 'kora') {
                // Kora HQ Payment Flow
                const koraPublicKey = import.meta.env.VITE_KORA_PUBLIC_KEY;

                // Helpful dev-time logging
                if (import.meta.env.DEV) {
                    // eslint-disable-next-line no-console
                    console.debug("VITE_KORA_PUBLIC_KEY=", koraPublicKey);
                }

                if (!koraPublicKey || koraPublicKey === "") {
                    setProcessing(false);
                    toast({ title: "Kora key missing", description: "Kora public key not found. Restart dev server after updating .env or set VITE_KORA_PUBLIC_KEY.", variant: "destructive" });
                    return;
                }

                const kora = new KoraService({ publicKey: koraPublicKey });

                await kora.initializePayment({
                    amount: amountKobo,
                    email: email.trim().toLowerCase(),
                    reference: reference,
                    metadata: paymentMetadata,
                    onSuccess: (response) => {
                        console.log("Payment confirmed by Kora:", response.reference);
                        setIsOfflinePayment(false);
                        setSuccess(true);
                        processPostPaymentSuccess(response.reference, sessionId, undefined, undefined, undefined, finalNaira, finalUsd, paymentPlan, installmentData?.inst1, installmentData?.inst2, inst2DueDate);
                    },
                    onClose: () => {
                        toast({ title: "Cancelled", description: "Payment was cancelled." });
                        setProcessing(false);
                        localStorage.removeItem('checkout_pending_data');
                    }
                });
            } else {
                // Paystack Payment Flow (default)
                const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
                
                if (!paystackPublicKey || paystackPublicKey === "") {
                    console.warn("Paystack key missing or empty, using simulated flow. Key found:", paystackPublicKey);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    setIsOfflinePayment(false);
                    setSuccess(true);
                    return processPostPaymentSuccess("simulated_ref_" + Date.now(), sessionId, undefined, undefined, undefined, finalNaira, finalUsd, paymentPlan, installmentData?.inst1, installmentData?.inst2, inst2DueDate);
                }

                const paystack = new PaystackService({ publicKey: paystackPublicKey });

                await paystack.initializePayment({
                    amount: amountKobo,
                    email: email.trim().toLowerCase(),
                    reference: reference,
                    metadata: paymentMetadata,
                    onSuccess: (response) => {
                        console.log("Payment confirmed by Paystack:", response.reference);
                        setIsOfflinePayment(false);
                        setSuccess(true);
                        processPostPaymentSuccess(response.reference, sessionId, undefined, undefined, undefined, finalNaira, finalUsd, paymentPlan, installmentData?.inst1, installmentData?.inst2, inst2DueDate);
                    },
                    onClose: () => {
                        toast({ title: "Cancelled", description: "Payment was cancelled." });
                        setProcessing(false);
                        localStorage.removeItem('checkout_pending_data');
                    }
                });
            }
        } catch (err: unknown) {
            console.error("Payment initialization error:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to initialize payment";
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
            setProcessing(false);
            localStorage.removeItem('checkout_pending_data');
        }
    };

    const processPostPaymentSuccess = async (
        reference: string, 
        sessionId: string,
        customEmail?: string,
        customFullName?: string,
        customCohortId?: string,
        finalPriceNaira?: number,
        finalPriceUsd?: number,
        instPlan?: 'full' | 'installment',
        inst1Amount?: number,
        inst2Amount?: number,
        inst2DueDate?: string | null
    ) => {
        try {
            console.log("Processing post-payment for session:", sessionId);
            const targetEmail = (customEmail || email).trim().toLowerCase();
            const targetFullName = (customFullName || fullName).trim() || targetEmail.split('@')[0];
            const targetCohortId = customCohortId || selectedCohortId;
            const usedNaira = finalPriceNaira ?? course?.price_naira ?? 0;
            const usedUsd = finalPriceUsd ?? course?.price_usd ?? 0;

            // STEP 1: Determine active user if they happen to be logged in (optional for guest checkout)
            let activeUserId: string | null = null;
            try {
                const { data: { session } } = await supabase.auth.getSession();
                activeUserId = session?.user?.id || null;
            } catch (err) {
                console.log("Not logged in, proceeding as guest checkout.");
            }

            // STEP 2: Securely record enrollment and transaction via RPC
            // This works completely decoupled from auth.users (supports guest checkout)
            try {
                const { error: rpcError } = await supabase.rpc('finalize_academy_enrollment', {
                    p_email: targetEmail,
                    p_student_name: targetFullName,
                    p_course_slug: course?.slug || "",
                    p_cohort_id: targetCohortId,
                    p_course_title: course?.title || "",
                    p_price_naira: course?.price_naira || 0,
                    p_price_usd: course?.price_usd || 0,
                    p_paystack_reference: paymentProvider === 'paystack' ? reference : null,
                    p_user_id: activeUserId,
                    p_payment_method: paymentProvider,
                    p_kora_reference: paymentProvider === 'kora' ? reference : null,
                    // Coupon data
                    p_coupon_code: appliedCoupon?.code || null,
                    p_discount_pct: appliedCoupon?.discountPct || 0,
                    p_final_price_naira: usedNaira,
                    p_final_price_usd: usedUsd,
                    // Installment data
                    p_payment_plan: instPlan || 'full',
                    p_installment_1_amount: inst1Amount || null,
                    p_installment_2_amount: inst2Amount || null,
                    p_installment_2_due_date: inst2DueDate || null,
                });

                if (rpcError) {
                    console.error("Enrollment RPC error:", rpcError);
                    toast({
                        title: "Warning",
                        description: "Payment succeeded, but we had a slight issue saving your enrollment. Our team will manually sync it.",
                        variant: "destructive"
                    });
                } else {
                    console.log("Enrollment and transaction recorded successfully via RPC");
                }
            } catch (err) {
                console.error("RPC execution exception:", err);
            }

            // STEP 3: Send enrollment confirmation email directly (reliable path)
            // This fires whether or not the user was logged in — the send-email function
            // allows academy_enrollment_success without authentication.
            try {
                // Get cohort name for the email
                const { data: cohortInfo } = await supabase
                    .from("cohorts")
                    .select("name")
                    .eq("id", selectedCohortId)
                    .single();

                const { error: emailError } = await supabase.functions.invoke("send-email", {
                    body: {
                        templateKey: "academy_enrollment_success",
                        to: email.trim().toLowerCase(),
                        variables: {
                            studentName: fullName.trim() || email.split('@')[0],
                            courseName: course?.title || "Your Course",
                            cohortName: cohortInfo?.name || "Upcoming Cohort",
                            duration: "4 Weeks",
                            level: course?.level || "Beginner",
                            amountNaira: String(usedNaira),
                            reference: reference,
                        }
                    }
                });

                if (emailError) {
                    console.error("Failed to send enrollment email:", emailError);
                } else {
                    console.log("Enrollment confirmation email sent to:", targetEmail);
                }
            } catch (emailErr) {
                console.error("Email send exception:", emailErr);
                // Don't block the success flow if email fails
            }

            setIsOfflinePayment(false);
            setSuccess(true);
            setProcessing(false);
            
            toast({
                title: "Enrollment Successful! 🎉",
                description: `Check your email at ${targetEmail} for confirmation details.`,
            });

        } catch (err: any) {
            console.error("Post-payment sync error:", err);
            toast({
                title: "Warning",
                description: "Payment successful, but we had trouble logging you in. Check your email for access details.",
            });
            setIsOfflinePayment(false);
            setSuccess(true);
            setProcessing(false);
        } finally {
            setProcessing(false);
            // Clear pending checkout data from localStorage on completion
            localStorage.removeItem('checkout_pending_data');
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
        <div className="min-h-screen bg-[#f8f9fc] pt-24 pb-16 px-4 sm:px-6 lg:px-8 font-inter">
            <div className="max-w-3xl mx-auto">
                <AnimatePresence mode="wait">
                    {availableCohorts.length === 0 ? (
                        <motion.div 
                            key="nocohorts"
                            className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-5">
                                <Lock className="w-5 h-5 text-slate-300" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-800 mb-2">Enrolment Closed</h2>
                            <p className="text-sm text-slate-400 mb-7 max-w-sm">There are currently no active cohorts for this course. Check back soon.</p>
                            <Button className="h-10 px-6 rounded-lg font-medium bg-slate-900 text-white text-sm" onClick={() => searchParams.get("from") === "dashboard" ? navigate("/dashboard") : navigate(-1)}>
                                Go Back
                            </Button>
                        </motion.div>
                    ) : !success ? (
                        <motion.div 
                            key="checkout"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            className="space-y-4"
                        >
                            {/* Top Nav */}
                            <div className="flex items-center justify-between mb-2">
                                <button 
                                    onClick={() => searchParams.get("from") === "dashboard" ? navigate("/dashboard") : navigate(-1)}
                                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm transition-colors"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    {searchParams.get("from") === "dashboard" ? "Back to Dashboard" : "Back to Program"}
                                </button>
                            </div>

                            {/* Course Strip */}
                            <div className="bg-white rounded-xl border border-slate-100 px-5 py-3.5 flex items-center gap-4 shadow-sm">
                                <div className="w-14 h-10 rounded-md overflow-hidden shrink-0">
                                    <img 
                                        src={course.image_url || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400&auto=format&fit=crop"} 
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{course.title}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    {appliedCoupon ? (
                                        <>
                                            <p className="text-[11px] text-slate-400 line-through">₦{course.price_naira.toLocaleString()}</p>
                                            <p className="text-sm font-semibold text-emerald-600">
                                                ₦{getDiscountedPrice(course.price_naira, course.price_usd).naira.toLocaleString()}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm font-semibold text-blue-600">₦{course.price_naira.toLocaleString()}</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                    {step === 'cohort-selection' && (
                                        <div>
                                            <div className="px-6 py-5 border-b border-slate-100">
                                                <h1 className="text-base font-semibold text-slate-800">Choose Your Cohort</h1>
                                                <p className="text-xs text-slate-400 mt-0.5">Select the batch you want to join</p>
                                            </div>

                                            <div className="divide-y divide-slate-50">
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
                                                                className={`w-full px-6 py-4 flex items-center gap-4 text-left transition-colors ${
                                                                    isSelected 
                                                                        ? 'bg-blue-50/70' 
                                                                        : 'bg-white hover:bg-slate-50/60'
                                                                }`}
                                                            >
                                                                {/* Radio circle */}
                                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                                                    isSelected 
                                                                        ? 'border-blue-600 bg-blue-600' 
                                                                        : 'border-slate-300'
                                                                }`}>
                                                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                                </div>

                                                                {/* Main info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-sm font-medium truncate ${ isSelected ? 'text-blue-700' : 'text-slate-800' }`}>{cohort.name}</p>
                                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                                        {new Date(cohort.start_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                                                                        {' — '}
                                                                        {new Date(cohort.end_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                                                                    </p>
                                                                </div>

                                                                {/* Meta pills */}
                                                                <div className="hidden sm:flex items-center gap-2 shrink-0">
                                                                    <span className="text-[11px] text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">{slotsAvailable} slots</span>
                                                                    <span className="text-[11px] text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">{daysLeft}d left</span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-10">
                                                        <Lock className="w-8 h-8 text-slate-200 mb-2" />
                                                        <p className="text-sm text-slate-400">No active cohorts available</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="px-6 py-4 border-t border-slate-100">
                                                <Button 
                                                    onClick={() => {
                                                        if (!selectedCohortId) {
                                                            toast({ title: "Select a Cohort", description: "Please select a cohort to proceed.", variant: "destructive" });
                                                            return;
                                                        }
                                                        setStep('email');
                                                    }}
                                                    disabled={!selectedCohortId || availableCohorts.length === 0}
                                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-medium text-sm shadow-sm"
                                                >
                                                    Continue
                                                </Button>
                                            </div>
                                        </div>
                                     )}

                                     {step === 'email' && (
                                         <div>
                                             <div className="px-6 py-5 border-b border-slate-100">
                                                 <h1 className="text-base font-semibold text-slate-800">Personal Information</h1>
                                                 <p className="text-xs text-slate-400 mt-0.5">Let's get started on setting up your profile</p>
                                             </div>

                                             <form onSubmit={handleEmailSubmit} className="p-6 space-y-4">
                                                 <div className="space-y-4">
                                                     <div className="space-y-1.5">
                                                         <label className="text-xs font-semibold text-slate-500">Full Name</label>
                                                         <input 
                                                             type="text" 
                                                             required
                                                             placeholder="John Doe"
                                                             className="w-full h-10 px-3.5 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-sm text-slate-800 font-normal placeholder:text-slate-400 transition-all"
                                                             value={fullName}
                                                             onChange={(e) => setFullName(e.target.value)}
                                                         />
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <label className="text-xs font-semibold text-slate-500">Email Address</label>
                                                         <div className="relative">
                                                             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                             <input 
                                                                 type="email" 
                                                                 required
                                                                 placeholder="name@example.com"
                                                                 className="w-full h-10 pl-10 pr-3.5 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-sm text-slate-800 font-normal placeholder:text-slate-400 transition-all"
                                                                 value={email}
                                                                 onChange={(e) => setEmail(e.target.value)}
                                                             />
                                                         </div>
                                                     </div>
                                                 </div>
                                                 <div className="flex gap-3 pt-2">
                                                     <Button 
                                                         type="button"
                                                         onClick={() => setStep('cohort-selection')}
                                                         className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-all"
                                                     >
                                                         Back
                                                     </Button>
                                                     <Button 
                                                         type="submit" 
                                                         disabled={processing}
                                                         className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow-sm transition-all flex items-center justify-center gap-1.5"
                                                     >
                                                         {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
                                                     </Button>
                                                 </div>
                                             </form>
                                         </div>
                                     )}

                                     {step === 'auth' && (
                                         <div>
                                             <div className="px-6 py-5 border-b border-slate-100">
                                                 <h1 className="text-base font-semibold text-slate-800">
                                                     {isExistingUser ? "Welcome back!" : "Create your account"}
                                                 </h1>
                                                 <p className="text-xs text-slate-400 mt-0.5">
                                                     {isExistingUser 
                                                         ? "Sign in to your account to continue with the enrollment."
                                                         : "Set a password to access your account after payment."}
                                                 </p>
                                             </div>

                                             <div className="p-6 space-y-4">
                                                 <div className="px-4 py-3 bg-blue-50/60 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100/50 flex items-center gap-2">
                                                     <Mail className="w-3.5 h-3.5 text-blue-500" /> {email}
                                                 </div>

                                                 <form onSubmit={handleAuthSubmit} className="space-y-4">
                                                     <div className="space-y-4">
                                                         <div className="space-y-1.5">
                                                             <label className="text-xs font-semibold text-slate-500">
                                                                 {isExistingUser ? "Your Password" : "Create Password"}
                                                             </label>
                                                             <div className="relative">
                                                                 <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                                 <input 
                                                                     type={showPassword ? "text" : "password"} 
                                                                     required
                                                                     placeholder={isExistingUser ? "Enter your password" : "Min. 8 characters"}
                                                                     className="w-full h-10 pl-10 pr-10 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-sm text-slate-800 font-normal placeholder:text-slate-400 transition-all"
                                                                     value={password}
                                                                     onChange={(e) => setPassword(e.target.value)}
                                                                 />
                                                                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors">
                                                                     {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                 </button>
                                                             </div>
                                                         </div>
                                                         {!isExistingUser && (
                                                             <div className="space-y-1.5">
                                                                 <label className="text-xs font-semibold text-slate-500">Confirm Password</label>
                                                                 <div className="relative">
                                                                     <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                                     <input 
                                                                         type={showPassword ? "text" : "password"} 
                                                                         required
                                                                         placeholder="Confirm password"
                                                                         className="w-full h-10 pl-10 pr-4 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-sm text-slate-800 font-normal placeholder:text-slate-400 transition-all"
                                                                         value={confirmPassword}
                                                                         onChange={(e) => setConfirmPassword(e.target.value)}
                                                                     />
                                                                 </div>
                                                             </div>
                                                         )}
                                                     </div>
                                                     <div className="flex gap-3 pt-2">
                                                         <Button 
                                                             type="button"
                                                             onClick={() => setStep('email')}
                                                             className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-all"
                                                         >
                                                             Back
                                                         </Button>
                                                         <Button 
                                                             type="submit" 
                                                             className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow-sm transition-all"
                                                         >
                                                             Continue to Payment
                                                         </Button>
                                                     </div>
                                                 </form>

                                                 <div className="text-center pt-2">
                                                     <button onClick={() => setStep('cohort-selection')} className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors">
                                                         Change cohort
                                                     </button>
                                                 </div>
                                             </div>
                                         </div>
                                     )}

                                    {step === 'payment' && (
                                        <div>
                                            <div className="px-6 py-5 border-b border-slate-100 bg-[#fafbfc]">
                                                <h1 className="text-base font-semibold text-slate-800">Secure Enrollment Checkout</h1>
                                                <p className="text-xs text-slate-400 mt-0.5">Choose your preferred payment option to complete your registration.</p>
                                            </div>

                                            {/* ── Option 1: Live Online Kora Payment (Primary) ── */}
                                            <div className="px-6 py-5 bg-gradient-to-br from-blue-50/20 via-white to-white">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                                                <CreditCard className="w-5 h-5 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <h2 className="text-sm font-semibold text-slate-800">Online Checkout (Recommended)</h2>
                                                                <p className="text-xs text-slate-400">Pay securely with Cards, Bank Transfer, or USSD via Kora</p>
                                                            </div>
                                                        </div>
                                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 uppercase tracking-wide">
                                                            Instant
                                                        </span>
                                                    </div>

                                                    {/* ── Payment Plan Selector ── */}
                                                    <div className="border-t border-slate-100 pt-4 pb-1">
                                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">Payment Plan</label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <button 
                                                                onClick={() => setPaymentPlan('full')}
                                                                className={`p-3 rounded-xl border text-left transition-all ${
                                                                    paymentPlan === 'full' 
                                                                    ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500' 
                                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className={`text-xs font-bold ${paymentPlan === 'full' ? 'text-blue-700' : 'text-slate-700'}`}>Pay in Full</span>
                                                                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentPlan === 'full' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                                                                        {paymentPlan === 'full' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] text-slate-500">Standard pricing</span>
                                                            </button>

                                                            <button 
                                                                onClick={() => setPaymentPlan('installment')}
                                                                className={`p-3 rounded-xl border text-left transition-all ${
                                                                    paymentPlan === 'installment' 
                                                                    ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500' 
                                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className={`text-xs font-bold ${paymentPlan === 'installment' ? 'text-blue-700' : 'text-slate-700'}`}>2 Installments</span>
                                                                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentPlan === 'installment' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                                                                        {paymentPlan === 'installment' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] text-amber-600 font-medium">5% surcharge applies</span>
                                                            </button>
                                                        </div>
                                                        {paymentPlan === 'installment' && (
                                                            <div className="mt-3 p-3 bg-amber-50/50 rounded-lg border border-amber-100/50">
                                                                <p className="text-[11px] text-slate-600 mb-2 font-medium">
                                                                    Your total cost is split into two payments. The second payment must be completed on or before the second week of the program.
                                                                </p>
                                                                {(() => {
                                                                    const { naira: discountedNaira } = getDiscountedPrice(course.price_naira, course.price_usd);
                                                                    const instPlan = getInstallmentPlan(discountedNaira);
                                                                    return (
                                                                        <div className="space-y-1.5">
                                                                            <div className="flex items-center justify-between text-xs">
                                                                                <span className="text-slate-500">Due Today (60%)</span>
                                                                                <span className="font-bold text-slate-800">₦{instPlan.inst1.toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between text-xs">
                                                                                <span className="text-slate-500">Due Week 2 (40%)</span>
                                                                                <span className="font-semibold text-slate-700">₦{instPlan.inst2.toLocaleString()}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* ── Coupon Code Input ── */}
                                                    <div className="border-t border-slate-100 pt-4">
                                                        {appliedCoupon ? (
                                                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
                                                                <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-emerald-700 font-mono tracking-wider">{appliedCoupon.code}</p>
                                                                    <p className="text-[10px] text-emerald-600">{appliedCoupon.message}</p>
                                                                </div>
                                                                <button
                                                                    onClick={handleRemoveCoupon}
                                                                    className="w-6 h-6 flex items-center justify-center rounded-lg text-emerald-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                                    <Tag className="w-3 h-3" /> Have a coupon code?
                                                                </label>
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Enter code"
                                                                        value={couponInput}
                                                                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                                                        className="flex-1 h-9 px-3 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs font-mono text-slate-800 uppercase tracking-wider placeholder:normal-case placeholder:font-sans placeholder:text-slate-400"
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        onClick={handleApplyCoupon}
                                                                        disabled={couponApplying || !couponInput.trim()}
                                                                        className="h-9 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg text-xs font-semibold transition-all gap-1.5 shrink-0"
                                                                    >
                                                                        {couponApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                                                                    </Button>
                                                                </div>
                                                                {couponError && (
                                                                    <p className="text-[11px] text-red-500 font-medium">{couponError}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Button
                                                        onClick={handlePayment}
                                                        disabled={processing}
                                                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2"
                                                    >
                                                        {processing ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ShieldCheck className="w-4 h-4" />
                                                                Pay ₦{getDiscountedPrice(course.price_naira, course.price_usd).naira.toLocaleString()}
                                                            </>
                                                        )}
                                                    </Button>

                                                    <p className="text-[10px] text-center text-slate-400 font-normal">
                                                        Secure 256-bit SSL encrypted checkout. Powered by Kora.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* ── Option 2: Offline Bank Transfer (Disabled) ── */}
                                            {false && (
                                                <div className="px-6 py-4">
                                                    <button
                                                        onClick={() => setShowBankTransfer(!showBankTransfer)}
                                                        className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/50 flex items-center justify-between text-left transition-all duration-200 group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                                                                <Building2 className="w-4 h-4 text-slate-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-slate-700">Or Pay via Offline Bank Transfer</p>
                                                                <p className="text-[10px] text-slate-400 mt-0.5 font-normal">Transfer manually & upload receipt (takes 24 hours)</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 group-hover:border-slate-300 transition-all">
                                                            {showBankTransfer ? "Hide" : "Show Details"}
                                                        </span>
                                                    </button>

                                                    <AnimatePresence>
                                                        {showBankTransfer && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                                                className="overflow-hidden mt-4 space-y-4"
                                                            >
                                                                <div className="grid grid-cols-1 gap-2.5">
                                                                    {/* Amount row */}
                                                                    <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 rounded-lg border border-slate-100">
                                                                        <div>
                                                                            <p className="text-[9px] text-slate-400 mb-0.5">Amount</p>
                                                                            <p className="text-xs font-semibold text-slate-800">₦{course.price_naira.toLocaleString()}</p>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => copyToClipboard(String(course.price_naira), 'Amount')}
                                                                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-500 text-[10px] font-medium hover:bg-slate-50 transition-colors"
                                                                        >
                                                                            {copiedField === 'Amount' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                                            {copiedField === 'Amount' ? 'Copied' : 'Copy'}
                                                                        </button>
                                                                    </div>

                                                                    {/* Bank name row */}
                                                                    <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 rounded-lg border border-slate-100">
                                                                        <div>
                                                                            <p className="text-[9px] text-slate-400 mb-0.5">Bank</p>
                                                                            <p className="text-xs font-medium text-slate-700">{BANK_ACCOUNT.bank}</p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Account number row */}
                                                                    <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 rounded-lg border border-slate-100">
                                                                        <div>
                                                                            <p className="text-[9px] text-slate-400 mb-0.5">Account Number</p>
                                                                            <p className="text-xs font-medium text-slate-700 tracking-wider">{BANK_ACCOUNT.accountNumber}</p>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => copyToClipboard(BANK_ACCOUNT.accountNumber, 'Account number')}
                                                                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-500 text-[10px] font-medium hover:bg-slate-50 transition-colors"
                                                                        >
                                                                            {copiedField === 'Account number' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                                            {copiedField === 'Account number' ? 'Copied' : 'Copy'}
                                                                        </button>
                                                                    </div>

                                                                    {/* Account name row */}
                                                                    <div className="py-2.5 px-3.5 bg-slate-50 rounded-lg border border-slate-100">
                                                                        <p className="text-[9px] text-slate-400 mb-0.5">Account Name</p>
                                                                        <p className="text-xs font-medium text-slate-700">{BANK_ACCOUNT.accountName}</p>
                                                                    </div>
                                                                </div>

                                                                {/* ── Receipt Upload ── */}
                                                                <div className="space-y-2">
                                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Upload Receipt</p>

                                                                    <div
                                                                        onClick={() => fileInputRef.current?.click()}
                                                                        className={`w-full rounded-lg border border-dashed transition-all cursor-pointer px-4 py-3 flex items-center gap-3.5 ${
                                                                            receiptFile
                                                                                ? 'border-emerald-300 bg-emerald-50/30'
                                                                                : 'border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/10'
                                                                        }`}
                                                                    >
                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ receiptFile ? 'bg-emerald-100' : 'bg-slate-100' }`}>
                                                                            {receiptFile ? (
                                                                                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                                            ) : (
                                                                                <Upload className="w-3.5 h-3.5 text-slate-400" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            {receiptFile ? (
                                                                                <>
                                                                                    <p className="text-xs font-medium text-slate-800 truncate">{receiptFile.name}</p>
                                                                                    <p className="text-[10px] text-emerald-600">{(receiptFile.size / 1024).toFixed(0)} KB · Click to change</p>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <p className="text-xs font-medium text-slate-600">Click to upload receipt</p>
                                                                                    <p className="text-[10px] text-slate-400">JPG, PNG or PDF · Max 10MB</p>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <input
                                                                        ref={fileInputRef}
                                                                        type="file"
                                                                        accept="image/*,application/pdf"
                                                                        className="hidden"
                                                                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                                                    />
                                                                </div>

                                                                {/* ── Submit Offline ── */}
                                                                <Button
                                                                    onClick={handleReceiptSubmit}
                                                                    disabled={receiptUploading || !receiptFile}
                                                                    className="w-full h-10 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-medium text-xs shadow-sm gap-2 transition-all duration-200 flex items-center justify-center"
                                                                >
                                                                    {receiptUploading ? (
                                                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                                                                    ) : (
                                                                        <><Upload className="w-3.5 h-3.5" /> Submit Payment Receipt</>
                                                                    )}
                                                                </Button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
                        >
                            {isOfflinePayment ? (
                                <>
                                    {/* Offline/Manual Success: Keep the existing "Receipt Submitted 📨" template */}
                                    <div className="px-8 py-10 text-center border-b border-slate-100">
                                        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                                            <FileCheck className="w-7 h-7 text-blue-600" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-slate-800 mb-1">Receipt Submitted 📨</h2>
                                        <p className="text-sm text-slate-400">
                                            Your receipt for <span className="text-blue-600 font-medium">{course?.title}</span> has been received.
                                        </p>
                                    </div>

                                    <div className="px-6 py-5 space-y-3">
                                        <div className="flex items-start gap-3 py-3 px-4 bg-blue-50/60 rounded-lg border border-blue-100">
                                            <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-600">
                                                Confirmation sent to <span className="font-medium text-slate-800">{email}</span>. We'll send your enrollment email once payment is verified.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pt-1">What happens next</p>
                                            {[
                                                "Our team verifies your bank transfer receipt (usually within 24 hours).",
                                                "You'll receive your official admission & enrollment email with program access.",
                                                `If there's an issue, we'll contact you at ${email}.`
                                            ].map((text, i) => (
                                                <div key={i} className="flex items-start gap-3 py-2.5 px-4 bg-slate-50 rounded-lg">
                                                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-[10px] font-semibold shrink-0 mt-px">{i + 1}</span>
                                                    <p className="text-xs text-slate-500">{text}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2 justify-center pt-1 opacity-60">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-[11px] text-slate-400">Questions? Email academy@opslyhr.com</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Online Payment Success: Premium, vibrant design */}
                                    <div className="px-8 py-10 text-center border-b border-slate-100">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-800 mb-1">Admission Confirmed! 🎉</h2>
                                        <p className="text-sm text-slate-400">
                                            Welcome to the cohort! Your enrollment in <span className="text-blue-600 font-semibold">{course?.title}</span> is active.
                                        </p>
                                    </div>

                                    <div className="px-6 py-5 space-y-4">
                                        <div className="flex items-start gap-3 py-3 px-4 bg-emerald-50/60 rounded-lg border border-emerald-100">
                                            <Mail className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-700 leading-relaxed">
                                                We've sent a welcome email to <span className="font-semibold text-slate-900">{email}</span> containing your immediate learning portal credentials and onboarding instructions.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pt-1">What to do next</p>
                                            {[
                                                "Check your spam/promotions folder if you don't see the enrollment email in 5 minutes.",
                                                "Join our student community Hub with the link inside your welcome email.",
                                                "Prepare for your first live session by completing the pre-work module."
                                            ].map((text, i) => (
                                                <div key={i} className="flex items-start gap-3 py-2.5 px-4 bg-slate-50 rounded-lg border border-slate-100">
                                                    <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold shrink-0 mt-px">{i + 1}</span>
                                                    <p className="text-xs text-slate-600 leading-normal">{text}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2 justify-center pt-2 opacity-75">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-[11px] text-slate-500">Excited to start? Questions? Email academy@opslyhr.com</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="px-6 pb-6">
                                <Button 
                                    onClick={() => navigate("/browse")}
                                    className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm"
                                >
                                    Browse More Courses
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Checkout;
