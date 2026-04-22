                                                                                                                                                                                                                     import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceRole);

// Verify Paystack webhook signature
async function verifyPaystackSignature(body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(body + paystackSecretKey);
  
  // Paystack uses SHA512 HMAC
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex === signature;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook authenticity
    if (!signature || !(await verifyPaystackSignature(body, signature))) {
      console.error("Invalid Paystack signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Paystack event:", event.event);

    // Handle successful charge
    if (event.event === "charge.success") {
      const { reference, customer, amount, authorization, metadata } = event.data;

      // 1. Check if this is a new frictionless checkout using metadata
      const checkoutSessionId = metadata?.checkout_session_id;
      const courseSlug = metadata?.course_id || metadata?.course_slug;
      const cohortId = metadata?.cohort_id || null;
      
      let finalUserId = metadata?.user_id;

      if (checkoutSessionId) {
        // Frictionless flow: Webhook ensures user exists
        const email = customer?.email || metadata?.email;
        
        // Find existing user ID securely using our RPC
        const { data: existingUserId, error: rpcError } = await supabase.rpc('get_user_id_by_email', { p_email: email });
        
        if (existingUserId) {
          finalUserId = existingUserId;
        } else {
          // User doesn't exist, webhook creates them fallback
          // (Client should have created them, but this acts as a robust backup)
          const randomSuffix = Math.random().toString(36).slice(-8);
          const generatedPassword = `Opsly${randomSuffix}!`; 

          const { data: authData, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: generatedPassword,
            email_confirm: true // Send welcome email
          });

          if (createError || !authData.user) {
            console.error("Failed to create backup user:", createError);
            return new Response("Backup user creation failed", { status: 500 });
          }

          finalUserId = authData.user.id;

          // Assign student role
          await supabase.from("user_roles").insert([{ 
            user_id: finalUserId, 
            role: "student" 
          }]);
        }

        // We have the finalUserId. Let's create the enrollment if it doesn't exist
        const enrolledAt = new Date().toISOString();
        let enrollmentId = null;

        const { data: existingEnrollment } = await supabase
          .from("academy_enrollments")
          .select("id")
          .eq("user_id", finalUserId)
          .eq("course_id", courseSlug)
          .single();

        if (existingEnrollment) {
           enrollmentId = existingEnrollment.id;
        } else {
           const { data: courseData } = await supabase.from("academy_courses").select("*").eq("slug", courseSlug).single();
           if (courseData) {
             const { data: newEnroll } = await supabase.from("academy_enrollments").insert({
                 user_id: finalUserId,
                 course_id: courseSlug,
                 cohort_id: cohortId,
                 course_name: courseData.title,
                 student_email: email,
                 student_name: email.split('@')[0],
                 enrollment_status: "active",
                 price_naira: courseData.price_naira || 0,
                 price_usd: courseData.price_usd || 0,
                 enrollment_date: enrolledAt,
                 access_granted_at: enrolledAt
             }).select("id").single();
             if (newEnroll) enrollmentId = newEnroll.id;
             
             // Increment slots filled
             await supabase.from("academy_courses").update({
                 slots_filled: (courseData.slots_filled || 0) + 1
             }).eq("slug", courseSlug);
           }
        }

        // Insert transaction if it doesn't exist
        if (enrollmentId) {
          const { data: existingTx } = await supabase.from("course_transactions").select("id").eq("paystack_reference", reference).single();
          if (!existingTx) {
             await supabase.from("course_transactions").insert({
                enrollment_id: enrollmentId,
                user_id: finalUserId,
                paystack_reference: reference,
                amount_naira: amount / 100, // Amount is in kobo
                amount_usd: 0,
                currency: "NGN",
                status: "success",
                payment_method: "paystack",
                paid_at: enrolledAt,
                customer_code: customer.customer_code
             });
          }
        }

        // Mark checkout session as completed
        await supabase.from("checkout_sessions").update({ status: "completed" }).eq("id", checkoutSessionId);

        console.log("✓ Frictionless payment successful for user:", finalUserId);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 2. Legacy Flow Processing
      // Update transaction status
      const { data: transaction, error: txError } = await supabase
        .from("course_transactions")
        .select("id, enrollment_id, user_id")
        .eq("paystack_reference", reference)
        .single();

      if (txError) {
        console.error("Transaction not found:", txError);
        return new Response("Transaction not found", { status: 404 });
      }

      // Update transaction to success
      const { error: updateTxError } = await supabase
        .from("course_transactions")
        .update({
          status: "success",
          paid_at: new Date().toISOString(),
          customer_code: customer.customer_code,
          receipt_url: customer.receipts_notifications?.[0]?.link,
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
      
      // Trigger email notification (could call another function here)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle failed charge
    if (event.event === "charge.failed") {
      const { reference, reason } = event.data;

      const { error: updateError } = await supabase
        .from("course_transactions")
        .update({
          status: "failed",
          failed_at: new Date().toISOString(),
          failure_reason: reason,
        })
        .eq("paystack_reference", reference);

      if (updateError) {
        console.error("Failed to update failed transaction:", updateError);
      }

      console.log("✗ Payment failed for reference:", reference, "Reason:", reason);
      
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
