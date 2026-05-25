import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const koraSecretKey = Deno.env.get("KORA_SECRET_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceRole);

/**
 * Verify Kora webhook signature
 * Kora HQ uses HMAC-SHA256 or SHA512 for webhook verification
 * Signature header: x-kora-signature or x-kora-sign
 */
async function verifyKoraSignature(body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(body + koraSecretKey);

  // Try SHA256 first (common for Kora HQ)
  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    if (hashHex === signature) return true;
  } catch (e) {
    console.warn("SHA256 verification failed:", e);
  }

  // Fallback to SHA512 if SHA256 fails
  try {
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    if (hashHex === signature) return true;
  } catch (e) {
    console.warn("SHA512 verification failed:", e);
  }

  console.warn("Signature mismatch - no algorithm matched");
  return false;
}

/**
 * Trigger Enrollment Email using the centralized send-email function
 * Reused from Paystack webhook
 */
async function triggerEnrollmentEmail(
  email: string,
  name: string,
  courseName: string,
  cohortName: string,
  duration: string,
  level: string,
  amount: number,
  reference: string
) {
  try {
    const { data: funcData, error: funcError } = await supabase.functions.invoke("send-email", {
      body: {
        templateKey: "academy_enrollment_success",
        to: email,
        variables: {
          studentName: name,
          courseName,
          cohortName,
          duration,
          level,
          amountNaira: String(amount),
          reference,
        },
      },
    });
    if (funcError) console.error("Email function error:", funcError);
    return funcData;
  } catch (err) {
    console.error("Failed to trigger email:", err);
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.text();
    // Kora may use different header names; try multiple
    const signature =
      req.headers.get("x-kora-signature") ||
      req.headers.get("x-kora-sign") ||
      req.headers.get("signature");

    // Verify webhook authenticity
    if (!signature || !(await verifyKoraSignature(body, signature))) {
      console.error("Invalid Kora signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Kora event:", event.event || event.type);

    // Handle successful charge
    // Kora events might be named differently, so we check for both
    if (event.event === "charge.success" || event.type === "payment.success") {
      const eventData = event.data || event;
      const {
        reference,
        customer,
        amount,
        authorization,
        metadata,
        tx_ref,
      } = eventData;

      const koraRef = reference || tx_ref;

      // 1. Check if this is a new frictionless checkout using metadata
      const checkoutSessionId = metadata?.checkout_session_id;
      const courseSlug = metadata?.course_id || metadata?.course_slug;
      const cohortId = metadata?.cohort_id;

      // ENFORCE: cohort_id is REQUIRED for all academy enrollments
      if (!cohortId) {
        console.error("Payment received but cohort_id is missing in metadata");
        return new Response(JSON.stringify({ error: "cohort_id required" }), { status: 400 });
      }

      let finalUserId = metadata?.user_id;

      if (checkoutSessionId) {
        // Frictionless flow: Webhook ensures user exists
        const email = customer?.email || metadata?.email;

        // Find existing user ID securely using our RPC
        const { data: existingUserId, error: rpcError } = await supabase.rpc(
          "get_user_id_by_email",
          { p_email: email }
        );

        if (existingUserId) {
          finalUserId = existingUserId;
        } else {
          // User doesn't exist, webhook creates them fallback
          const randomSuffix = Math.random().toString(36).slice(-8);
          const generatedPassword = `Opsly${randomSuffix}!`;

          const { data: authData, error: createError } =
            await supabase.auth.admin.createUser({
              email: email,
              password: generatedPassword,
              email_confirm: true,
            });

          if (createError || !authData.user) {
            console.error("Failed to create backup user:", createError);
            return new Response("Backup user creation failed", { status: 500 });
          }

          finalUserId = authData.user.id;

          // Assign student role
          await supabase.from("user_roles").insert([
            {
              user_id: finalUserId,
              role: "student",
            },
          ]);
        }

        // We have the finalUserId and cohortId. Let's create the COHORT-BASED enrollment
        const enrolledAt = new Date().toISOString();
        let enrollmentId = null;

        // ENFORCE: Check if user is already enrolled in THIS SPECIFIC COHORT
        const { data: existingEnrollment, error: checkError } = await supabase
          .from("academy_enrollments")
          .select("id")
          .eq("user_id", finalUserId)
          .eq("cohort_id", cohortId)
          .maybeSingle();

        if (checkError && checkError.code !== "PGRST116") {
          console.error("Error checking existing enrollment:", checkError);
          throw checkError;
        }

        if (existingEnrollment) {
          // Already enrolled in this cohort - likely a duplicate payment
          console.log("User already enrolled in this cohort:", existingEnrollment.id);
          enrollmentId = existingEnrollment.id;
        } else {
          // First check cohort exists and isn't full
          const { data: cohortData, error: cohortError } = await supabase
            .from("cohorts")
            .select("id, current_slots, max_slots, name, status")
            .eq("id", cohortId)
            .single();

          if (cohortError || !cohortData) {
            console.error("Cohort not found:", cohortId, cohortError);
            return new Response(
              JSON.stringify({ error: "cohort not found" }),
              { status: 404 }
            );
          }

          if (cohortData.status === "closed") {
            console.error("Cohort is closed:", cohortId);
            return new Response(JSON.stringify({ error: "cohort closed" }), { status: 400 });
          }

          if ((cohortData.current_slots || 0) >= (cohortData.max_slots || 25)) {
            console.error("Cohort is full:", cohortId);
            return new Response(JSON.stringify({ error: "cohort full" }), { status: 400 });
          }

          // Get course data for metadata
          const { data: courseData } = await supabase
            .from("academy_courses")
            .select("*")
            .eq("slug", courseSlug)
            .single();

          if (courseData) {
            // Create enrollment for this COHORT
            const { data: newEnroll, error: enrollError } = await supabase
              .from("academy_enrollments")
              .insert({
                user_id: finalUserId,
                course_id: courseSlug,
                cohort_id: cohortId,
                course_name: courseData.title,
                student_email: email,
                student_name: metadata?.student_name || email.split("@")[0],
                enrollment_status: "active",
                price_naira: courseData.price_naira || 0,
                price_usd: courseData.price_usd || 0,
                enrollment_date: enrolledAt,
                access_granted_at: enrolledAt,
              })
              .select("id")
              .single();

            if (enrollError) {
              console.error("Enrollment insert error:", enrollError);
              throw enrollError;
            }

            if (newEnroll) {
              enrollmentId = newEnroll.id;

              // Trigger Branded Enrollment Email
              await triggerEnrollmentEmail(
                email,
                metadata?.student_name || email.split("@")[0],
                courseData.title,
                cohortData.name,
                courseData.duration || "4 Weeks",
                courseData.level || "Beginner",
                courseData.price_naira || 0,
                koraRef
              );
            }

            // Increment slots filled in cohort
            await supabase.from("cohorts").update({
              current_slots: (cohortData.current_slots || 0) + 1,
            }).eq("id", cohortId);
          }
        }

        // Insert transaction if it doesn't exist
        if (enrollmentId) {
          const { data: existingTx } = await supabase
            .from("course_transactions")
            .select("id")
            .eq("kora_reference", koraRef)
            .maybeSingle();

          if (!existingTx) {
            await supabase.from("course_transactions").insert({
              enrollment_id: enrollmentId,
              user_id: finalUserId,
              kora_reference: koraRef,
              amount_naira: amount / 100, // Assuming amount is in kobo
              amount_usd: 0,
              currency: "NGN",
              status: "success",
              payment_method: "kora",
              paid_at: enrolledAt,
              customer_code: customer?.customer_code,
            });
          }
        }

        // Mark checkout session as completed
        if (checkoutSessionId) {
          await supabase.from("checkout_sessions").update({ status: "completed" }).eq("id", checkoutSessionId);
        }

        console.log("✓ Frictionless payment successful for user:", finalUserId);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 2. Legacy Flow Processing
      const { data: transaction, error: txError } = await supabase
        .from("course_transactions")
        .select("id, enrollment_id, user_id")
        .eq("kora_reference", koraRef)
        .maybeSingle();

      if (txError && txError.code !== "PGRST116") {
        console.error("Transaction lookup error:", txError);
        return new Response("Transaction lookup failed", { status: 500 });
      }

      if (!transaction) {
        console.error("Transaction not found for Kora reference:", koraRef);
        return new Response("Transaction not found", { status: 404 });
      }

      // Update transaction to success
      const { error: updateTxError } = await supabase
        .from("course_transactions")
        .update({
          status: "success",
          paid_at: new Date().toISOString(),
          customer_code: customer?.customer_code,
          receipt_url: customer?.receipt_url,
        })
        .eq("id", transaction.id);

      if (updateTxError) {
        console.error("Failed to update transaction:", updateTxError);
        return new Response("Failed to update transaction", { status: 500 });
      }

      // Grant enrollment access
      const { error: enrollmentError } = await supabase
        .from("academy_enrollments")
        .update({
          enrollment_status: "active",
          access_granted_at: new Date().toISOString(),
        })
        .eq("id", transaction.enrollment_id);

      if (enrollmentError) {
        console.error("Failed to update enrollment:", enrollmentError);
        return new Response("Failed to update enrollment", { status: 500 });
      }

      console.log("✓ Legacy Payment successful for enrollment:", transaction.enrollment_id);

      // Fetch data for email
      const { data: enrollData } = await supabase
        .from("academy_enrollments")
        .select("*, cohorts(name)")
        .eq("id", transaction.enrollment_id)
        .single();

      if (enrollData) {
        await triggerEnrollmentEmail(
          enrollData.student_email,
          enrollData.student_name,
          enrollData.course_name,
          enrollData.cohorts?.name || "Upcoming Cohort",
          "4 Weeks",
          "Beginner",
          amount / 100,
          koraRef
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle failed charge
    if (
      event.event === "charge.failed" ||
      event.type === "payment.failed"
    ) {
      const eventData = event.data || event;
      const { reference, reason, tx_ref } = eventData;
      const koraRef = reference || tx_ref;

      const { error: updateError } = await supabase
        .from("course_transactions")
        .update({
          status: "failed",
          failed_at: new Date().toISOString(),
          failure_reason: reason || "Payment failed",
        })
        .eq("kora_reference", koraRef);

      if (updateError) {
        console.error("Failed to update failed transaction:", updateError);
      }

      console.log("✗ Kora payment failed for reference:", koraRef, "Reason:", reason);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Acknowledge all other events
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal server error", { status: 500 });
  }
});
