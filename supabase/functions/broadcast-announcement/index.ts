import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { cohortId, title, content, imageUrl } = await req.json();

    if (!cohortId || !title || !content) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 1. Get all active students in the cohort
    const { data: students, error: studentsError } = await supabaseClient
      .from('academy_enrollments')
      .select('student_email')
      .eq('cohort_id', cohortId)
      .eq('enrollment_status', 'active');

    if (studentsError) throw studentsError;

    const emails = students.map(s => s.student_email).filter(Boolean);

    if (emails.length === 0) {
      return new Response(JSON.stringify({ message: 'No active students to notify' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Broadcast emails (In a real production system, you'd use a bulk email provider like SendGrid or AWS SES)
    // Here we loop through and call the send-email function or handle directly.
    // To avoid hitting our own edge function timeouts, we'll send them in small batches or use a single "bulk" call if supported.
    
    console.log(`Broadcasting to ${emails.length} students...`);

    const results = await Promise.allSettled(emails.map(async (email) => {
      return await supabaseClient.functions.invoke('send-email', {
        body: {
          to: email,
          subject: `New Announcement: ${title}`,
          htmlTemplate: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                <div style="background: #0f2147; padding: 40px; text-align: center;">
                    <img src="https://opslyhr.com/images/logocolored.svg" alt="OPSlyHR" style="width: 140px;" />
                </div>
                <div style="padding: 40px; background: #fff;">
                    <h1 style="color: #0f2147; font-size: 24px; margin-bottom: 20px;">New Announcement</h1>
                    <h2 style="color: #333; font-size: 18px; margin-bottom: 20px;">${title}</h2>
                    ${imageUrl ? `<img src="${imageUrl}" style="width: 100%; border-radius: 8px; margin-bottom: 20px;" />` : ''}
                    <div style="color: #444; font-size: 16px; line-height: 1.6; background: #f9fafb; padding: 20px; border-radius: 8px;">
                        ${content}
                    </div>
                    <div style="margin: 40px 0; text-align: center;">
                        <a href="https://academy.opslyhr.com/dashboard" style="background: #0f2147; color: #fff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">View in Dashboard</a>
                    </div>
                </div>
                <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} OPSlyHR Academy. All rights reserved.</p>
                </div>
            </div>
          `
        }
      });
    }));

    const successCount = results.filter(r => r.status === 'fulfilled').length;

    return new Response(JSON.stringify({ message: `Successfully broadcasted to ${successCount} students`, total: emails.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Broadcast error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
