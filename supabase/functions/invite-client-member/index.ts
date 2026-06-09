import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('EMAIL_FROM') || 'hire@opslyhr.com'
const FROM_NAME = Deno.env.get('EMAIL_FROM_NAME') || 'OpslyHR'
const APP_URL = Deno.env.get('PUBLIC_APP_URL') || 'https://admin.opslyhr.com'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role } = await req.json()

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing email or role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Authenticate caller
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

    // Admin client for DB writes
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Resolve the caller's client_id via get_my_client_id()
    const { data: clientIdData, error: clientIdError } = await supabaseAdmin.rpc('get_my_client_id')
    if (clientIdError || !clientIdData) {
      return new Response(
        JSON.stringify({ error: 'You do not belong to a client workspace.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const clientId = clientIdData as string

    // Verify caller is owner or admin of this workspace
    const { data: callerMembership } = await supabaseAdmin
      .from('client_members')
      .select('role')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    const { data: clientRecord } = await supabaseAdmin
      .from('clients')
      .select('id, company_name, user_id')
      .eq('id', clientId)
      .single()

    const isOwner = clientRecord?.user_id === user.id
    const isAdmin = callerMembership?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only workspace owners or admins can invite members.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check subscription seat limit
    const { data: subscription } = await supabaseAdmin
      .from('client_subscriptions')
      .select('max_team_members, status')
      .eq('client_id', clientId)
      .single()

    if (subscription && subscription.status === 'canceled') {
      return new Response(
        JSON.stringify({ error: 'Your subscription has been canceled. Please reactivate to invite members.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { count: currentMemberCount } = await supabaseAdmin
      .from('client_members')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'active')

    const ownerCount = 1 // the original owner always counts
    const totalMembers = (currentMemberCount || 0) + ownerCount
    const maxMembers = subscription?.max_team_members || 3

    if (totalMembers >= maxMembers) {
      return new Response(
        JSON.stringify({ error: `Seat limit reached (${maxMembers} on your current plan). Please upgrade to invite more members.` }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for existing pending invite to this email
    const { data: existingInvite } = await supabaseAdmin
      .from('client_invites')
      .select('id')
      .eq('client_id', clientId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: 'An invite has already been sent to this email address.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create invite record
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('client_invites')
      .insert({
        client_id: clientId,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
      })
      .select()
      .single()

    if (inviteError || !invite) {
      console.error('Failed to create invite:', inviteError)
      return new Response(
        JSON.stringify({ error: 'Failed to create invite.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const joinUrl = `${APP_URL}/auth/join?token=${invite.token}`
    const companyName = clientRecord?.company_name || 'your team'
    const inviterName = user.user_metadata?.full_name || user.email || 'A team member'
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

    // Build branded invitation email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to join ${companyName} on OpslyHR</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,33,71,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2147 0%,#1e3a6e 100%);padding:40px 48px;text-align:center;">
              <img src="https://opslyhr.com/images/logocolored.svg" alt="OpslyHR" height="36" style="display:block;margin:0 auto 16px;" />
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:-0.5px;">You're Invited!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Hi there,</p>
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
                <strong>${inviterName}</strong> has invited you to join the <strong>${companyName}</strong> workspace on OpslyHR as a <strong>${roleLabel}</strong>.
              </p>
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 32px;">
                As a ${roleLabel}, you'll be able to manage your team, review timesheets, track performance, and communicate with your talent — all in one place.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:0 0 40px;">
                <a href="${joinUrl}" style="display:inline-block;background:linear-gradient(135deg,#0f2147,#1e3a6e);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:-0.3px;">
                  Accept Invitation →
                </a>
              </div>

              <!-- Info box -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin-bottom:32px;">
                <p style="color:#6b7280;font-size:13px;margin:0 0 8px;"><strong>Workspace:</strong> ${companyName}</p>
                <p style="color:#6b7280;font-size:13px;margin:0 0 8px;"><strong>Your role:</strong> ${roleLabel}</p>
                <p style="color:#6b7280;font-size:13px;margin:0;"><strong>Invite expires:</strong> 7 days from now</p>
              </div>

              <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0;">
                If you weren't expecting this invitation, you can safely ignore this email. If you have questions, contact us at <a href="mailto:support@opslyhr.com" style="color:#0f2147;">support@opslyhr.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} OpslyHR. All rights reserved.</p>
              <p style="color:#9ca3af;font-size:12px;margin:4px 0 0;">167 Lombard Ave, Winnipeg, Canada</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email.toLowerCase()],
        subject: `You've been invited to join ${companyName} on OpslyHR`,
        html: emailHtml,
      }),
    })

    const resendData = await resendResponse.json() as any
    if (!resendResponse.ok) {
      console.error('Resend error:', resendData)
      // Don't fail the whole operation — the invite record is created
      // Log but return success so the UI doesn't break
    } else {
      console.log(`Invite email sent to ${email}: ${resendData.id}`)
    }

    return new Response(
      JSON.stringify({ success: true, inviteId: invite.id }),
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
