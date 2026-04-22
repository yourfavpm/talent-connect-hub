import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    const { table, record, type } = payload

    // 1. Handle New Enrollment
    if (table === 'academy_enrollments' && type === 'INSERT') {
      const enrollment = record
      const { data: userData } = await supabase.auth.admin.getUserById(enrollment.user_id)
      const user = userData?.user

      if (user) {
        // Send Branded Enrollment Email
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            to: user.email,
            subject: `Welcome to ${enrollment.course_name}!`,
            htmlTemplate: \`
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                <div style="background: #0f2147; padding: 40px; text-align: center;">
                  <img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" style="width: 140px;" />
                </div>
                <div style="padding: 40px; background: #fff;">
                  <h1 style="color: #0f2147; font-size: 24px; margin-bottom: 20px;">Enrollment Successful!</h1>
                  <p style="color: #444; font-size: 16px; line-height: 1.6;">Hello \${enrollment.student_name || 'Student'},</p>
                  <p style="color: #444; font-size: 16px; line-height: 1.6;">Congratulations! You have successfully enrolled in <strong>\${enrollment.course_name}</strong>.</p>
                  <p style="color: #444; font-size: 16px; line-height: 1.6;">You can now access your learning materials, schedule, and mentors directly from your student dashboard.</p>
                  <div style="margin: 40px 0; text-align: center;">
                    <a href="https://academy.opslyhr.com/dashboard" style="background: #0f2147; color: #fff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Go to My Dashboard</a>
                  </div>
                  <p style="color: #888; font-size: 14px; margin-top: 40px;">If you have any questions, reply to this email or reach out to your program mentor.</p>
                </div>
                <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 12px;">&copy; 2026 OPSlyHR Academy. All rights reserved.</p>
                </div>
              </div>
            \`
          })
        })
      }
    }

    // 2. Handle New Announcement
    if (table === 'announcements' && type === 'INSERT') {
      const announcement = record
      
      // Fetch all students in the cohort
      const { data: enrollments } = await supabase
        .from('academy_enrollments')
        .select('student_email, student_name')
        .eq('cohort_id', announcement.cohort_id)
        .eq('enrollment_status', 'active')

      if (enrollments) {
        for (const enrollment of enrollments) {
          await fetch(\`\${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}\`
            },
            body: JSON.stringify({
              to: enrollment.student_email,
              subject: \`New Announcement: \${announcement.title}\`,
              htmlTemplate: \`
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                  <div style="background: #0f2147; padding: 40px; text-align: center;">
                    <img src="https://opslyhr.com/images/logocolored.png" alt="OPSlyHR" style="width: 140px;" />
                  </div>
                  <div style="padding: 40px; background: #fff;">
                    <h1 style="color: #0f2147; font-size: 24px; margin-bottom: 20px;">New Announcement</h1>
                    <h2 style="color: #333; font-size: 18px;">\${announcement.title}</h2>
                    <div style="color: #444; font-size: 16px; line-height: 1.6; margin-top: 20px; padding: 20px; background: #f9fafb; border-radius: 8px;">
                      \${announcement.content}
                    </div>
                    <div style="margin: 40px 0; text-align: center;">
                      <a href="https://academy.opslyhr.com/dashboard" style="background: #0f2147; color: #fff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">View in Dashboard</a>
                    </div>
                  </div>
                  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px;">&copy; 2026 OPSlyHR Academy. All rights reserved.</p>
                  </div>
                </div>
              \`
            })
          })
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
