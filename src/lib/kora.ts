// Kora HQ payment integration utility
// Mirror architecture of Paystack but adapted for Kora HQ APIs
import { supabase } from "@/integrations/supabase/client";

interface KoraConfig {
  publicKey: string;
}

interface KoraResponse {
  reference: string;
  status: string;
  message: string;
  authorization_url?: string;
  access_code?: string;
}

interface InitializePaymentParams {
  email: string;
  amount: number; // amount in local currency (NGN for Nigeria)
  reference: string;
  metadata: Record<string, unknown>;
  onSuccess?: (response: KoraResponse) => void;
  onClose?: () => void;
}

export class KoraService {
  private publicKey: string;

  constructor(config: KoraConfig) {
    this.publicKey = config.publicKey;
    this.loadKoraScript();
  }

  private loadKoraScript() {
    // Load Kora HQ SDK dynamically
    if (document.getElementById("kora-script")) return;

    const script = document.createElement("script");
    script.id = "kora-script";
    script.src = "https://sdk.korahq.com/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
  }

  /**
   * Initialize payment using Kora HQ inline/modal checkout
   * Supports both SDK-based modal (if available) and fallback to hosted checkout
   */
  async initializePayment(params: InitializePaymentParams) {
    return new Promise((resolve, reject) => {
      const { email, amount, reference, metadata, onSuccess, onClose } = params;

      // Check if Kora SDK is loaded
      const checkKora = () => {
        if ((window as any).Kora) {
          // Use Kora SDK if available
          try {
            const handler = (window as any).Kora.setup({
              key: this.publicKey,
              email,
              amount, // amount in kobo/smallest unit (NGN)
              reference,
              metadata,
              onClose: () => {
                console.log("Kora payment window closed");
                if (onClose) onClose();
                reject(new Error("Payment cancelled"));
              },
              callback: (response: KoraResponse) => {
                console.log("Kora payment successful:", response);
                if (onSuccess) onSuccess(response);
                resolve(response);
              },
            });
            handler.openIframe?.() || handler.open?.();
          } catch (err) {
            console.warn("Kora SDK setup failed, falling back to hosted checkout:", err);
            // Fallback to hosted checkout URL
            this.openHostedCheckout(params, resolve, reject);
          }
        } else {
          setTimeout(checkKora, 100);
        }
      };

      checkKora();
    });
  }

  /**
   * Fallback: Open Kora hosted checkout page
   */
  private openHostedCheckout(
    params: InitializePaymentParams,
    resolve: Function,
    reject: Function
  ) {
    const { email, amount, reference, metadata, onSuccess, onClose } = params;

    // Construct hosted checkout URL
    const checkoutUrl = new URL("https://checkout.korahq.com");
    checkoutUrl.searchParams.append("public_key", this.publicKey);
    checkoutUrl.searchParams.append("tx_ref", reference);
    checkoutUrl.searchParams.append("amount", String(amount));
    checkoutUrl.searchParams.append("customer_email", email);
    checkoutUrl.searchParams.append("currency", "NGN");

    // Add metadata as custom fields
    if (metadata?.cohort_id) {
      checkoutUrl.searchParams.append("custom_cohort_id", String(metadata.cohort_id));
    }
    if (metadata?.course_id) {
      checkoutUrl.searchParams.append("custom_course_id", String(metadata.course_id));
    }
    if (metadata?.student_name) {
      checkoutUrl.searchParams.append("customer_name", String(metadata.student_name));
    }

    // Open in new window and poll for close
    const width = 500;
    const height = 700;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    const win = window.open(
      checkoutUrl.toString(),
      "koraCheckout",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!win) {
      reject(new Error("Failed to open Kora checkout window"));
      return;
    }

    // Poll for window close
    const pollInterval = setInterval(() => {
      if (win.closed) {
        clearInterval(pollInterval);
        if (onClose) onClose();
        reject(new Error("Payment window closed by user"));
      }
    }, 1000);

    // Listen for postMessage from checkout (some providers support this)
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://checkout.korahq.com") return;

      if (event.data?.status === "success") {
        clearInterval(pollInterval);
        window.removeEventListener("message", handleMessage);
        const response: KoraResponse = {
          reference: event.data.reference || reference,
          status: "success",
          message: "Payment successful",
        };
        if (onSuccess) onSuccess(response);
        resolve(response);
      } else if (event.data?.status === "cancelled") {
        clearInterval(pollInterval);
        window.removeEventListener("message", handleMessage);
        if (onClose) onClose();
        reject(new Error("Payment cancelled"));
      }
    };

    window.addEventListener("message", handleMessage);
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
 * Reused from Paystack integration - provider-agnostic
 */
export async function createPendingEnrollment(
  params: CreateEnrollmentParams
) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("User not authenticated");

  const reference = `KORA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

  if (enrollmentError || !enrollment)
    throw enrollmentError || new Error("Failed to create enrollment");

  // Create transaction record (with kora_reference instead of paystack_reference)
  const { data: transaction, error: transactionError } = await (supabase
    .from("course_transactions")
    .insert([
      {
        enrollment_id: (enrollment as any)?.id,
        user_id: user.id,
        kora_reference: reference,
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
 * Verify payment with Kora HQ
 * Calls Kora HQ API to verify transaction status
 */
export async function verifyKoraPayment(reference: string) {
  const KORA_SECRET_KEY = import.meta.env.VITE_KORA_SECRET_KEY;

  if (!KORA_SECRET_KEY) {
    throw new Error("Kora secret key not configured");
  }

  try {
    const response = await fetch(
      `https://api.korahq.com/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${KORA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Payment verification failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Kora payment verification error:", error);
    throw error;
  }
}

/**
 * Get enrollment by ID (provider-agnostic, reused utility)
 */
export async function getEnrollment(enrollmentId: string) {
  const { data, error } = await supabase
    .from("academy_enrollments")
    .select("*")
    .eq("id", enrollmentId)
    .single();

  if (error) throw error;
  return data;
}
