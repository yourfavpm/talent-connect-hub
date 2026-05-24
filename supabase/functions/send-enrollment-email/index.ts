import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") || Deno.env.get("VITE_RESEND_API_KEY") || "";
const fromEmail = Deno.env.get("EMAIL_FROM") || "hire@opslyhr.com";
const fromName = Deno.env.get("EMAIL_FROM_NAME") || "OPSlyHR Academy";

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

  const templateVariables = {
    studentName: input.studentName,
    courseName: courseName,
    cohortName: cohortName,
    duration: duration,
    level: level,
    amountNaira: String(amount),
    reference: ref,
    studentEmail: input.studentEmail
  };

  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', 'academy_enrollment_success')
    .eq('status', 'active')
    .single();

  if (templateError || !template) {
    console.error("Error fetching email template:", templateError);
    throw new Error("Email template not found in database.");
  }

  // Render email template variables
  function renderTemplate(templateStr: string, variables: Record<string, string>): string {
    let rendered = templateStr;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    }
    return rendered;
  }

  const finalSubject = renderTemplate(template.subject, templateVariables);
  const emailHtml = renderTemplate(template.body_html, templateVariables);
  const emailText = renderTemplate(template.body_text || "", templateVariables);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: input.studentEmail,
        subject: finalSubject,
        html: emailHtml,
        text: emailText,
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
