import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceRole);

// Verify Paystack webhook signature
function verifyPaystackSignature(body: string, signature: string): boolean {
  const hash = new TextEncoder().encode(
    body + paystackSecretKey
  );
  
  // Paystack uses SHA512 HMAC
  return crypto.subtle
    .digestSync("SHA-512", hash)
    .hex() === signature;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook authenticity
    if (!signature || !verifyPaystackSignature(body, signature)) {
      console.error("Invalid Paystack signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Paystack event:", event.event);

    // Handle successful charge
    if (event.event === "charge.success") {
      const { reference, customer, amount, authorization } = event.data;

      // Update transaction status
      const { data: transaction, error: txError } = await supabase
        .from("course_transactions")
        .select("enrollment_id, user_id")
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

      console.log("✓ Payment successful for enrollment:", transaction.enrollment_id);
      
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
