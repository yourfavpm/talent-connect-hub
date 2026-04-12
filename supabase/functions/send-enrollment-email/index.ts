import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = Deno.env.get("VITE_RESEND_API_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceRole);

interface EnrollmentData {
  enrollmentId: string;
  studentEmail: string;
  studentName: string;
  courseName: string;
  duration: string;
  level: string;
  amountNaira: number;
  reference: string;
}

async function sendEnrollmentEmail(data: EnrollmentData) {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                background-color: #f9fafb;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 8px;
            }
            .header {
                text-align: center;
                padding-bottom: 20px;
                border-bottom: 2px solid #3b82f6;
                margin-bottom: 30px;
            }
            .course-summary {
                background-color: #eff6ff;
                border-left: 4px solid #3b82f6;
                padding: 20px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .button {
                display: inline-block;
                background-color: #3b82f6;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎓 Welcome to OPSly Academy!</h1>
                <p>Your enrollment has been confirmed</p>
            </div>

            <div class="content">
                <p>Hi <strong>${data.studentName}</strong>,</p>
                
                <p>Congratulations on enrolling in OPSly Academy! Your payment has been successfully processed and your course access is now active.</p>

                <div class="course-summary">
                    <h2>📚 Course Details</h2>
                    <h3>${data.courseName}</h3>
                    <p><strong>Duration:</strong> ${data.duration}</p>
                    <p><strong>Level:</strong> ${data.level}</p>
                    <p><strong>Amount Paid:</strong> ₦${data.amountNaira.toLocaleString()}</p>
                    <p><strong>Reference:</strong> ${data.reference}</p>
                </div>

                <p>
                    <a href="https://academy.opslyhr.com/dashboard" class="button">Access Your Dashboard</a>
                </p>

                <p>For support, contact us at <a href="mailto:support@opslyhr.com">support@opslyhr.com</a></p>

                <p>Best regards,<br><strong>The OPSly Academy Team</strong></p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "OPSly Academy <academy@opslyhr.com>",
        to: data.studentEmail,
        subject: `Welcome to OPSly Academy - Access Your Course: ${data.courseName}`,
        html: emailHtml,
      }),
    });

    const emailData = await response.json();
    console.log("Email sent:", emailData);
    return emailData;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { enrollmentId, studentEmail, studentName, courseName, duration, level, amountNaira, reference } = body;

    // Validate required fields
    if (!enrollmentId || !studentEmail || !studentName || !courseName) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Send email
    await sendEnrollmentEmail({
      enrollmentId,
      studentEmail,
      studentName,
      courseName,
      duration,
      level,
      amountNaira,
      reference,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Enrollment email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
