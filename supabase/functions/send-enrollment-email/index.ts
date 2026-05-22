import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const resendApiKey = Deno.env.get("VITE_RESEND_API_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceRole);

interface EnrollmentInput {
  enrollmentId: string;
  studentEmail: string;
  studentName: string;
  // Fallbacks if DB fetch fails
  courseName?: string;
  duration?: string;
  level?: string;
  amountNaira?: number;
  reference?: string;
}

async function sendEnrollmentEmail(input: EnrollmentInput) {
  // 1. Fetch live "mapped" data from DB to ensure accuracy
  const { data: dbData, error: dbError } = await supabase
    .from('academy_enrollments')
    .select(`
      *,
      cohorts (
        name,
        mentors,
        start_date,
        zoom_link
      ),
      academy_courses!inner (
        title,
        duration,
        level,
        description
      )
    `)
    .eq('id', input.enrollmentId)
    .single();

  if (dbError) {
    console.error("Error fetching enrollment details for email:", dbError);
  }

  // Merge DB data with input fallbacks
  const courseName = dbData?.academy_courses?.title || input.courseName || "Your Course";
  const duration = dbData?.academy_courses?.duration || input.duration || "Self-paced";
  const level = dbData?.academy_courses?.level || input.level || "Beginner";
  const cohortName = dbData?.cohorts?.name || "Upcoming Cohort";
  const mentors = dbData?.cohorts?.mentors as any[] || [];
  const primaryMentor = mentors.length > 0 ? mentors[0] : null;
  const amount = dbData?.price_naira || input.amountNaira || 0;
  const ref = dbData?.reference || input.reference || input.enrollmentId.substring(0, 8);

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Opsly Academy</title>
        <style>
            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #1a1a1a; 
                margin: 0; 
                padding: 0; 
                background-color: #f8fafc; 
            }
            .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: #ffffff; 
                border-radius: 24px; 
                overflow: hidden; 
                box-shadow: 0 10px 25px rgba(0,0,0,0.05); 
            }
            .header { 
                background: #0f2147; 
                padding: 48px 40px; 
                text-align: center; 
            }
            .logo { width: 140px; }
            .content { padding: 48px 40px; }
            .welcome-tag { 
                display: inline-block; 
                padding: 6px 12px; 
                background: #f0fdf4; 
                color: #166534; 
                font-size: 10px; 
                font-weight: 800; 
                text-transform: uppercase; 
                letter-spacing: 0.1em; 
                border-radius: 6px; 
                margin-bottom: 24px; 
            }
            h1 { 
                font-size: 28px; 
                font-weight: 800; 
                color: #0f2147; 
                margin: 0 0 16px 0; 
                letter-spacing: -0.02em; 
            }
            p { font-size: 16px; color: #475569; margin: 0 0 24px 0; }
            .course-card { 
                background: #f8fafc; 
                border: 1px solid #e2e8f0; 
                border-radius: 20px; 
                padding: 32px; 
                margin: 32px 0; 
            }
            .course-title { 
                font-size: 20px; 
                font-weight: 700; 
                color: #0f2147; 
                margin-bottom: 20px; 
                display: block; 
            }
            .detail-row { 
                display: flex; 
                margin-bottom: 12px; 
                font-size: 14px; 
            }
            .detail-label { 
                color: #94a3b8; 
                font-weight: 600; 
                text-transform: uppercase; 
                letter-spacing: 0.05em; 
                width: 100px; 
                flex-shrink: 0; 
            }
            .detail-value { color: #334155; font-weight: 600; }
            .mentor-badge {
                display: flex;
                align-items: center;
                gap: 12px;
                background: #ffffff;
                padding: 12px 16px;
                border-radius: 12px;
                border: 1px solid #f1f5f9;
                margin-top: 16px;
            }
            .mentor-avatar {
                width: 32px;
                height: 32px;
                background: #0f2147;
                color: white;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 12px;
            }
            .button { 
                display: block; 
                background: #0f2147; 
                color: #ffffff !important; 
                padding: 18px 32px; 
                text-decoration: none; 
                border-radius: 14px; 
                font-weight: 700; 
                font-size: 16px; 
                text-align: center; 
                margin: 32px 0; 
            }
            .next-steps { 
                border-top: 1px solid #f1f5f9; 
                padding-top: 32px; 
                margin-top: 32px; 
            }
            .step-item { margin-bottom: 20px; }
            .step-number { 
                font-weight: 800; 
                color: #0f2147; 
                margin-right: 8px; 
            }
            .marketplace-banner { 
                background: linear-gradient(135deg, #0f2147 0%, #1e293b 100%); 
                padding: 32px; 
                border-radius: 20px; 
                color: #ffffff; 
                margin-top: 40px; 
            }
            .marketplace-title { 
                font-size: 18px; 
                font-weight: 700; 
                margin-bottom: 8px; 
                display: block; 
            }
            .marketplace-text { 
                font-size: 14px; 
                color: #cbd5e1; 
                margin-bottom: 16px; 
                display: block; 
            }
            .marketplace-link { 
                color: #38bdf8; 
                font-weight: 700; 
                text-decoration: none; 
                font-size: 14px; 
            }
            .footer { 
                padding: 40px; 
                text-align: center; 
                font-size: 12px; 
                color: #94a3b8; 
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <img src="https://opslyhr.com/images/logocolored.svg" alt="Opsly" class="logo" />
                </div>
                <div class="content">
                    <div class="welcome-tag">Enrollment Confirmed</div>
                    <h1>Your journey starts here.</h1>
                    <p>Hi ${input.studentName},</p>
                    <p>Welcome to the Opsly Academy! We're thrilled to have you join our community. Your enrollment in <strong>${courseName}</strong> (${cohortName}) is now active.</p>
                    
                    <div class="course-card">
                        <span class="course-title">${courseName}</span>
                        <div class="detail-row">
                            <span class="detail-label">Cohort</span>
                            <span class="detail-value">${cohortName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Duration</span>
                            <span class="detail-value">${duration}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Level</span>
                            <span class="detail-value">${level}</span>
                        </div>
                        
                        ${primaryMentor ? `
                        <div class="mentor-badge">
                            <div class="mentor-avatar">${primaryMentor.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'M'}</div>
                            <div>
                                <div style="font-size: 12px; font-weight: 800; color: #0f2147;">${primaryMentor.name}</div>
                                <div style="font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Primary Mentor</div>
                            </div>
                        </div>
                        ` : ''}

                        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                            <div class="detail-row">
                                <span class="detail-label">Reference</span>
                                <span class="detail-value">${ref}</span>
                            </div>
                        </div>
                    </div>

                    <a href="https://academy.opslyhr.com/dashboard" class="button">Go to Student Dashboard</a>

                    <div class="next-steps">
                        <h3 style="color: #0f2147; margin-bottom: 16px;">What to expect next:</h3>
                        <div class="step-item">
                            <span class="step-number">01.</span>
                            <span style="color: #475569; font-size: 14px;"><strong>Complete Your Profile:</strong> Head to the dashboard and finish setting up your student profile to unlock all features.</span>
                        </div>
                        <div class="step-item">
                            <span class="step-number">02.</span>
                            <span style="color: #475569; font-size: 14px;"><strong>Join the Community:</strong> Keep an eye out for a Slack invitation where you'll meet your mentors and fellow students.</span>
                        </div>
                        <div class="step-item">
                            <span class="step-number">03.</span>
                            <span style="color: #475569; font-size: 14px;"><strong>Review the Roadmap:</strong> Check the "Course Hub" in your dashboard to see your upcoming session schedule.</span>
                        </div>
                    </div>

                    <div class="marketplace-banner">
                        <span class="marketplace-title">Ready for global roles?</span>
                        <span class="marketplace-text">As an Opsly Academy student, you're on the fast track to joining our vetted Talent Marketplace.</span>
                        <a href="https://opslyhr.com/marketplace" class="marketplace-link">Join the Waitlist &rarr;</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; 2026 OpslyHR. All rights reserved.</p>
                    <p>Need help? Contact us at <a href="mailto:support@opslyhr.com" style="color: #64748b; text-decoration: underline;">support@opslyhr.com</a></p>
                </div>
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
        to: input.studentEmail,
        subject: `Welcome to OPSly Academy - Access Your Course: ${courseName}`,
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

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = (await req.json()) as any;
    const { enrollmentId, studentEmail, studentName } = body;

    // Validate required fields
    if (!enrollmentId || !studentEmail || !studentName) {
      return new Response("Missing required fields (enrollmentId, studentEmail, studentName)", { status: 400 });
    }

    // Send email (now with internal DB fetching)
    await sendEnrollmentEmail(body);

    return new Response(
      JSON.stringify({ success: true, message: "Enrollment email sent with live mapping" }),
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
