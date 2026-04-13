import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const resendApiKey = Deno.env.get("VITE_RESEND_API_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceRole);

interface AcademyEvent {
  event_type: 'enrollment' | 'session' | 'announcement' | 'assignment' | 'grading';
  payload: any;
}

const EMAIL_TEMPLATES = {
  enrollment: (data: any) => ({
    subject: `🎓 Welcome to OPSly Academy: ${data.course_name}`,
    html: `<h1>Welcome, ${data.name}!</h1><p>You are now enrolled in <strong>${data.course_name}</strong>.</p><p>Cohort: ${data.cohort_name}</p><p>Start Date: ${data.start_date}</p><a href="https://academy.opslyhr.com/dashboard">Access Dashboard</a>`
  }),
  session: (data: any) => ({
    subject: `🎥 New Class Scheduled: ${data.title}`,
    html: `<h1>Class Reminder</h1><p>A new live session has been scheduled for <strong>${data.cohort_name}</strong>.</p><p><strong>Topic:</strong> ${data.title}</p><p><strong>Time:</strong> ${data.date} at ${data.time}</p><a href="${data.url}">Join Meeting Room</a>`
  }),
  announcement: (data: any) => ({
    subject: `📣 Update for ${data.cohort_name}`,
    html: `<h1>Academy Announcement</h1><h2>${data.title}</h2><p>${data.content}</p><a href="https://academy.opslyhr.com/dashboard">View in Hub</a>`
  }),
  assignment: (data: any) => ({
    subject: `📝 New Assignment: ${data.title}`,
    html: `<h1>New Task Posted</h1><p>A new assignment has been posted for your cohort.</p><p><strong>Title:</strong> ${data.title}</p><p><strong>Deadline:</strong> ${data.deadline}</p><a href="https://academy.opslyhr.com/dashboard">Submit Your Work</a>`
  }),
  grading: (data: any) => ({
    subject: `✅ Your work has been reviewed!`,
    html: `<h1>Review Complete</h1><p>Your submission for <strong>${data.assignment_title}</strong> has been reviewed by your instructor.</p><p>Status: ${data.status}</p><a href="https://academy.opslyhr.com/dashboard">View Feedback</a>`
  })
};

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const { event_type, payload } = (await req.json()) as AcademyEvent;
    
    // 1. Resolve recipients
    let recipients: string[] = [];
    if (payload.student_email) {
      recipients = [payload.student_email];
    } else if (payload.cohort_id) {
      const { data: enrollments } = await supabase
        .from("academy_enrollments")
        .select("student_email")
        .eq("cohort_id", payload.cohort_id)
        .eq("enrollment_status", "active");
      
      recipients = enrollments?.map(e => e.student_email) || [];
    }

    if (recipients.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "No recipients found" }), { status: 200 });
    }

    // 2. Prepare Email
    const template = EMAIL_TEMPLATES[event_type];
    if (!template) throw new Error(`Invalid event type: ${event_type}`);
    const { subject, html } = template(payload);

    // 3. Dispatch Emails via Resend (Parallel)
    const emailPromises = recipients.map(async (email) => {
      return fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "OPSly Academy <academy@opslyhr.com>",
          to: email,
          subject,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
              <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; text-align: center;">
                <h1 style="margin: 0; color: #1e293b;">OPSly Academy</h1>
              </div>
              ${html}
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
                &copy; 2026 OPSly Limited. All rights reserved.
              </div>
            </div>
          `,
        }),
      });
    });

    await Promise.all(emailPromises);

    return new Response(JSON.stringify({ success: true, count: recipients.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Academy Event Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
});
