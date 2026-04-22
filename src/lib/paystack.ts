// Paystack payment integration utility
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PaystackConfig {
  publicKey: string;
}

interface PaystackResponse {
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  message: string;
}

interface InitializePaymentParams {
  email: string;
  amount: number; // amount in Naira
  reference: string;
  metadata: Record<string, unknown>;
  onSuccess?: (response: PaystackResponse) => void;
  onClose?: () => void;
}

export class PaystackService {
  private publicKey: string;

  constructor(config: PaystackConfig) {
    this.publicKey = config.publicKey;
    this.loadPaystackScript();
  }

  private loadPaystackScript() {
    if (document.getElementById("paystack-script")) return;

    const script = document.createElement("script");
    script.id = "paystack-script";
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
  }

  async initializePayment(params: InitializePaymentParams) {
    return new Promise((resolve, reject) => {
      const { email, amount, reference, metadata, onSuccess, onClose } = params;

      // Check if Paystack is loaded
      const checkPaystack = () => {
        if ((window as any).PaystackPop) {
          const handler = (window as any).PaystackPop.setup({
            key: this.publicKey,
            email,
            amount, // amount in kobo (NGN)
            ref: reference,
            metadata,
            onClose: () => {
              console.log("Payment window closed");
              if (params.onClose) params.onClose();
              reject(new Error("Payment cancelled"));
            },
            callback: (response: PaystackResponse) => {
              console.log("Payment successful:", response);
              if (params.onSuccess) params.onSuccess(response);
              resolve(response);
            },
          });
          handler.openIframe();
        } else {
          setTimeout(checkPaystack, 100);
        }
      };

      checkPaystack();
    });
  }
}

interface CreateEnrollmentParams {
  courseId: string;
  cohortId?: string;
  courseName: string;
  priceUSD: number;
  priceNaira: number;
  studentEmail: string;
  studentName: string;
  studentPhone?: string;
  studentCountry?: string;
}

/**
 * Create a pending enrollment and transaction record
 */
export async function createPendingEnrollment(
  params: CreateEnrollmentParams
) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("User not authenticated");

  const reference = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create enrollment record
  const { data: enrollment, error: enrollmentError } = await (supabase
    .from("academy_enrollments")
    .insert([
      {
        user_id: user.id,
        course_id: params.courseId,
        cohort_id: params.cohortId,
        course_name: params.courseName,
        student_email: params.studentEmail,
        student_name: params.studentName,
        student_phone: params.studentPhone,
        student_country: params.studentCountry,
        price_usd: params.priceUSD,
        price_naira: params.priceNaira,
        currency: "USD",
        enrollment_status: "pending_payment",
      } as any,
    ] as any)
    .select()
    .single() as any);

  if (enrollmentError || !enrollment) throw enrollmentError || new Error("Failed to create enrollment");

  // Create transaction record
  const { data: transaction, error: transactionError } = await (supabase
    .from("course_transactions")
    .insert([
      {
        enrollment_id: (enrollment as any)?.id,
        user_id: user.id,
        paystack_reference: reference,
        amount_naira: params.priceNaira,
        amount_usd: params.priceUSD,
        currency: "NGN",
        status: "pending",
      } as any,
    ] as any)
    .select()
    .single() as any);

  if (transactionError) throw transactionError;

  return {
    enrollment,
    transaction,
    reference,
  };
}

/**
 * Verify payment with Paystack
 */
export async function verifyPayment(reference: string) {
  const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Payment verification failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Payment verification error:", error);
    throw error;
  }
}

/**
 * Get enrollment by ID
 */
export function useEnrollment(enrollmentId: string) {
  return useQuery({
    queryKey: ["enrollment", enrollmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_enrollments")
        .select("*")
        .eq("id", enrollmentId)
        .single();

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Get user's enrollments
 */
export function useUserEnrollments() {
  return useQuery({
    queryKey: ["user-enrollments"],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("academy_enrollments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Check if user has access to a course
 */
export async function hasEnrollmentAccess(courseId: string): Promise<boolean> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return false;

  const { data, error } = await supabase
    .from("academy_enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("enrollment_status", "active")
    .single();

  if (error) return false;
  return !!data;
}
