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
    // ── 2. Parse the request body ───────────────────────────────────
    const { templateKey, htmlTemplate, subject, to, toName, variables, priority } = await req.json()

    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: to' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 1. Authenticate the caller ──────────────────────────────────
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    // Determine if we should bypass auth for signup/system emails
    // We allow anonymous calls for predefined welcome/verification flows
    const isAnonAllowedTemplate = templateKey && [
      'talent_auth_account_created', 
      'talent_auth_verify_required', 
      'talent_onboarding_welcome', 
      'client_onboarding_welcome',
      'client_auth_verify_required'
    ].includes(templateKey);
    
    // Also loosely allow custom HTML templates if they are welcome/verification emails
    const isHtmlAuthSystemEmail = htmlTemplate && 
      (subject?.toLowerCase().includes('welcome') || 
       subject?.toLowerCase().includes('verify') || 
       subject?.toLowerCase().includes('invited') ||
       subject?.toLowerCase().includes('account'));

    const isAnonymousBypass = isAnonAllowedTemplate || isHtmlAuthSystemEmail;

    if ((authError || !user) && !isAnonymousBypass) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. You must be logged in to send this type of email.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 3. Determine template source (branded HTML or database) ──────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let finalSubject: string
    let bodyHtml: string
    let bodyText: string
    let finalVariables = { ...(variables || {}) }

    if (htmlTemplate && subject) {
      // ── New path: Use provided branded HTML template ────────────
      finalSubject = subject
      bodyHtml = htmlTemplate
      bodyText = ''  // HTML emails don't need separate text version
      
      console.log(`Sending branded HTML email: ${subject} → ${to}`)
    } else if (templateKey) {
      // ── Legacy path: Fetch from database ────────────────────────
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

      finalSubject = renderTemplate(template.subject, finalVariables)
      bodyHtml = renderTemplate(template.body_html, finalVariables)
      bodyText = renderTemplate(template.body_text, finalVariables)

      console.log(`Sending database template email: ${templateKey} → ${to}`)
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: either htmlTemplate+subject or templateKey' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 4. Send via Resend API ──────────────────────────────────────
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
      subject: finalSubject,
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
        template_key: templateKey || 'html_template',
        subject: finalSubject,
        status: 'failed',
        error_message: resendData?.message || JSON.stringify(resendData),
      })

      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: resendData }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 5. Log success ──────────────────────────────────────────────
    await supabaseAdmin.from('email_logs').insert({
      recipient_email: to,
      template_key: templateKey || 'html_template',
      subject: finalSubject,
      status: 'sent',
      provider_message_id: resendData?.id,
    })

    console.log(`Email sent: ${templateKey || 'HTML'} → ${to} (${resendData?.id})`)

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
