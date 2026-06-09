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

interface EmailRequest {
  templateKey?: string;
  htmlTemplate?: string;
  subject?: string;
  to: string;
  toName?: string;
  variables?: Record<string, any>;
  priority?: string;
  attachments?: any[];
  generateRecoveryLink?: boolean;
  redirectTo?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 2. Parse the request body ───────────────────────────────────
    const body = await req.json() as EmailRequest;
    const { templateKey, htmlTemplate, subject, to, variables, generateRecoveryLink, redirectTo } = body;

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
      'client_auth_verify_required',
      'academy_enrollment_success',
      'payment_receipt_received',
      'scholarship_application_received'
    ].includes(templateKey);
    
    // Also loosely allow custom HTML templates if they are welcome/verification emails
    const isHtmlAuthSystemEmail = htmlTemplate && 
      (subject?.toLowerCase().includes('welcome') || 
       subject?.toLowerCase().includes('verify') || 
       subject?.toLowerCase().includes('invited') ||
       subject?.toLowerCase().includes('account'));

    const normalizedSubject = subject?.toLowerCase() || '';
    const isAdminNotificationEmail = htmlTemplate &&
      to.toLowerCase() === 'info@opslyhr.com' &&
      (
        normalizedSubject.startsWith('new consultation') ||
        normalizedSubject.startsWith('new support ticket') ||
        normalizedSubject.startsWith('new hire request') ||
        normalizedSubject.startsWith('new reply on support ticket')
      );

    const isAnonymousBypass = isAnonAllowedTemplate || isHtmlAuthSystemEmail || isAdminNotificationEmail;

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
    
    // Inject standard branding defaults
    const BRAND_DEFAULTS = {
      brand_color: '#0f2147', // Deep OPSly Blue
      brand_logo: 'https://opslyhr.com/images/logocolored.svg',
      brand_name: 'OPSlyHR',
      brand_website: 'https://opslyhr.com',
      social_linkedin: 'https://www.linkedin.com/company/opslyhr/',
      social_tiktok: 'https://www.tiktok.com/@opslyhr?_r=1&_t=ZS-972oUQjwnw2',
      social_instagram: 'https://www.instagram.com/opslyhr?igsh=MTJhOXhzdXY3eTczMA==',
      social_twitter: 'https://x.com/opslyhr?s=21',
      social_facebook: 'https://www.facebook.com/share/1GNFHGMqB2/?mibextid=wwXIfr',
    };

    let finalVariables: Record<string, any> = { ...BRAND_DEFAULTS, ...(variables || {}) }

    if (htmlTemplate && subject) {
      // ── New path: Use provided branded HTML template ────────────
      
      if (generateRecoveryLink && redirectTo) {
        console.log(`Generating recovery link for ${to} redirecting to ${redirectTo}`)
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: to,
          options: { redirectTo }
        })
        if (linkError) {
          console.error('Error generating reset link:', linkError)
        } else if (linkData?.properties?.action_link) {
          finalVariables.resetLink = linkData.properties.action_link
          console.log('Reset link generated successfully')
        }
      }

      finalSubject = renderTemplate(subject, finalVariables)
      bodyHtml = renderTemplate(htmlTemplate, finalVariables)
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

    // ── Global Footer Injection ──────────────────────────────────────
    const footerHtml = `
      <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0; font-family: 'Helvetica Neue', Arial, sans-serif;">
        <p style="color: #64748b; font-size: 14px; margin-bottom: 16px; font-weight: 500;">Follow us on social media</p>
        <div style="margin-bottom: 24px;">
          <a href="${BRAND_DEFAULTS.social_linkedin}" style="display: inline-block; margin: 0 12px; text-decoration: none; color: ${BRAND_DEFAULTS.brand_color}; font-weight: 700; font-size: 14px;">LinkedIn</a>
          <a href="${BRAND_DEFAULTS.social_instagram}" style="display: inline-block; margin: 0 12px; text-decoration: none; color: ${BRAND_DEFAULTS.brand_color}; font-weight: 700; font-size: 14px;">Instagram</a>
          <a href="${BRAND_DEFAULTS.social_tiktok}" style="display: inline-block; margin: 0 12px; text-decoration: none; color: ${BRAND_DEFAULTS.brand_color}; font-weight: 700; font-size: 14px;">TikTok</a>
          <a href="${BRAND_DEFAULTS.social_facebook}" style="display: inline-block; margin: 0 12px; text-decoration: none; color: ${BRAND_DEFAULTS.brand_color}; font-weight: 700; font-size: 14px;">Facebook</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.6;">
          &copy; ${new Date().getFullYear()} ${BRAND_DEFAULTS.brand_name}. All rights reserved.<br/>
          <span style="display: block; margin-top: 4px; margin-bottom: 4px;">167 Lombard Ave, Winnipeg, Canada</span>
          <a href="${BRAND_DEFAULTS.brand_website}" style="color: #94a3b8; text-decoration: none;">${BRAND_DEFAULTS.brand_website}</a>
        </p>
      </div>
    `;

    if (bodyHtml) {
      if (bodyHtml.includes('</body>')) {
        bodyHtml = bodyHtml.replace('</body>', `${footerHtml}\n</body>`);
      } else {
        bodyHtml += footerHtml;
      }
    }

    // ── 4. Send via Resend API ──────────────────────────────────────
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendPayload: any = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: finalSubject,
      html: bodyHtml,
      text: bodyText,
    }

    if (body.attachments && Array.isArray(body.attachments)) {
      try {
        resendPayload.attachments = await Promise.all(body.attachments.map(async (att) => {
          if (att.path && att.path.startsWith('http')) {
            console.log(`Downloading attachment from: ${att.path}`);
            const resp = await fetch(att.path);
            if (resp.ok) {
              const arrayBuffer = await resp.arrayBuffer();
              // Create a Uint8Array and convert to base64
              const bytes = new Uint8Array(arrayBuffer);
              let binary = '';
              // Process in chunks to avoid max call stack size issues with large files
              const chunkSize = 8192;
              for (let i = 0; i < bytes.length; i += chunkSize) {
                binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
              }
              const base64 = btoa(binary);
              return { filename: att.filename, content: base64 };
            } else {
              console.warn(`Failed to fetch attachment from ${att.path}, status: ${resp.status}`);
            }
          }
          return att;
        }));
      } catch (err) {
        console.error('Error processing attachments:', err);
      }
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    })

    const resendData = (await resendResponse.json()) as any

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
