import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APP_URL = Deno.env.get('APP_URL') || 'https://app.opslyhr.com'

/**
 * Hash a internal token with SHA-256 for secure storage
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const array = new Uint32Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('')
}

interface VerificationRequest {
  userId: string;
  email: string;
  firstName: string;
  portal?: 'talent' | 'client';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.pathname.split('/').pop() // request or verify

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // --- Action: Request (Generate and Send) ---
    if (req.method === 'POST' && action === 'request') {
      const body = await req.json() as VerificationRequest;
      const { userId, email, firstName, portal = 'talent' } = body;

      if (!userId || !email) {
        throw new Error('Missing required user information')
      }

      // Determine template key based on portal
      const templateKey = portal === 'client' 
        ? 'client_auth_verify_required' 
        : 'talent_auth_verify_required'

      // 1. Generate token
      const rawToken = generateToken()
      const hashedToken = await hashToken(rawToken)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24h expiry

      // 2. Invalidate existing tokens
      await supabaseAdmin
        .from('email_verification_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('used_at', null)

      // 3. Save new token
      const { error: dbError } = await supabaseAdmin
        .from('email_verification_tokens')
        .insert({
          user_id: userId,
          token_hash: hashedToken,
          expires_at: expiresAt.toISOString(),
        })

      if (dbError) throw dbError

      // 4. Trigger Email via internal send-email function
      const verificationLink = `${APP_URL}/auth/verify-email?token=${rawToken}`
      
      const { error: emailError } = await supabaseAdmin.functions.invoke('send-email', {
        body: {
          to: email,
          toName: firstName,
          templateKey: templateKey, 
          variables: {
            first_name: firstName,
            verification_link: verificationLink,
          },
        },
      })

      if (emailError) {
        console.error('Failed to trigger email notification:', emailError)
        // We still return success since the token is stored, but log the error
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- Action: Verify (Validate and Update) ---
    if (req.method === 'GET' && action === 'verify') {
      const rawToken = url.searchParams.get('token')
      if (!rawToken) throw new Error('Missing token')

      // 1. Hash incoming token
      const incomingHash = await hashToken(rawToken)

      // 2. Lookup record
      const { data: record, error: lookupError } = await supabaseAdmin
        .from('email_verification_tokens')
        .select('*')
        .eq('token_hash', incomingHash)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (lookupError || !record) {
        // Find if it was used or expired for better error message
        const { data: stale } = await supabaseAdmin
          .from('email_verification_tokens')
          .select('used_at, expires_at')
          .eq('token_hash', incomingHash)
          .single()

        let redirectUrl = `${APP_URL}/auth/verify-email?status=invalid`
        if (stale) {
          if (stale.used_at) redirectUrl = `${APP_URL}/auth/verify-email?status=already-verified`
          else if (new Date(stale.expires_at) < new Date()) redirectUrl = `${APP_URL}/auth/verify-email?status=expired`
        }

        return Response.redirect(redirectUrl, 303)
      }

      // 3. Mark as used
      await supabaseAdmin
        .from('email_verification_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', record.id)

      // 4. Fetch Profile & Role for notifications
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, email, email_verified_sent')
        .eq('user_id', record.user_id)
        .single()

      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', record.user_id)
        .limit(1)
        .maybeSingle()

      const role = roleData?.role || 'talent'
      const firstName = profile?.first_name || 'User'
      const email = profile?.email || '' // Assume email is in profiles based on type def

      // 5. Update Profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          email_verified_at: new Date().toISOString(),
          email_verified_sent: true 
        })
        .eq('user_id', record.user_id)

      if (profileError) throw profileError

      // 6. Send Notifications (Success & Welcome)
      if (profile && !profile.email_verified_sent && email) {
        const isTalent = role === 'talent'
        
        // Notification 1: Verification Success
        await supabaseAdmin.functions.invoke('send-email', {
          body: {
            to: email,
            toName: firstName,
            templateKey: isTalent ? 'talent_auth_verified_success' : 'client_auth_verified_success',
            variables: {
              first_name: firstName,
              dashboard_link: isTalent ? 'https://talent.opslyhr.com/dashboard' : 'https://client.opslyhr.com/dashboard',
            },
          },
        })

        // Notification 2: Welcome to the Network
        await supabaseAdmin.functions.invoke('send-email', {
          body: {
            to: email, 
            toName: firstName,
            templateKey: isTalent ? 'talent_onboarding_welcome' : 'client_onboarding_welcome',
            variables: {
              first_name: firstName,
              profile_link: isTalent ? 'https://talent.opslyhr.com/onboarding' : 'https://client.opslyhr.com/dashboard',
              dashboard_link: 'https://client.opslyhr.com/dashboard', // for client welcome
              company_name: 'Your Company', // Fallback for client welcome
            },
          },
        })
      }

      // 7. Success Redirect
      return Response.redirect(`${APP_URL}/auth/verify-email?status=success`, 303)
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Verification Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
