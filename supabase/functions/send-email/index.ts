import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('EMAIL_FROM') || 'hire@opslyhr.com'
const FROM_NAME = Deno.env.get('EMAIL_FROM_NAME') || 'OPSlyHR'

/**
 * Render email template — replaces {{variable}} placeholders with actual values
 */
function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    rendered = rendered.replace(regex, String(value || ''))
  }
  return rendered
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Authenticate the caller ──────────────────────────────────
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 2. Parse the request body ───────────────────────────────────
    const { templateKey, to, toName, variables, priority } = await req.json()

    if (!templateKey || !to) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: templateKey, to' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 3. Fetch the template from DB using service role ────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: template, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('status', 'active')
      .single()

    if (templateError || !template) {
      console.error(`Template not found: ${templateKey}`, templateError)
      return new Response(
        JSON.stringify({ error: `Email template not found: ${templateKey}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 4. Render the template ──────────────────────────────────────
    let finalVariables = { ...(variables || {}) }

    // Logic for generating password reset links if needed
    if ((templateKey === 'talent-password-reset' || templateKey === 'client-password-reset') && variables?.redirectTo && !variables?.resetLink) {
      console.log(`Generating recovery link for ${to} redirecting to ${variables.redirectTo}`)
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: to,
        options: { redirectTo: variables.redirectTo }
      })

      if (linkError) {
        console.error('Error generating reset link:', linkError)
      } else if (linkData?.properties?.action_link) {
        finalVariables.resetLink = linkData.properties.action_link
        console.log('Reset link generated successfully')
      }
    }

    const subject = renderTemplate(template.subject, finalVariables)
    const bodyHtml = renderTemplate(template.body_html, finalVariables)
    const bodyText = renderTemplate(template.body_text, finalVariables)

    // ── 5. Send via Resend API ──────────────────────────────────────
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendPayload = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html: bodyHtml,
      text: bodyText,
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)

      // Log failure
      await supabaseAdmin.from('email_logs').insert({
        recipient_email: to,
        template_key: templateKey,
        subject,
        status: 'failed',
        error_message: resendData?.message || JSON.stringify(resendData),
      })

      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: resendData }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 6. Log success ──────────────────────────────────────────────
    await supabaseAdmin.from('email_logs').insert({
      recipient_email: to,
      template_key: templateKey,
      subject,
      status: 'sent',
      provider_message_id: resendData?.id,
    })

    console.log(`Email sent: ${templateKey} → ${to} (${resendData?.id})`)

    return new Response(
      JSON.stringify({ success: true, messageId: resendData?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
