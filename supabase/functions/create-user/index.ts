import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Verify user is super_admin
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) throw new Error('Unauthorized')

        const { data: roles } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (!roles || roles.role !== 'super_admin') {
            throw new Error('Unauthorized: Super Admin access required')
        }

        // Now use Service Role to create user
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, password, role, firstName, lastName } = await req.json()

        if (!email || !password || !role) {
            throw new Error('Missing required fields')
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { first_name: firstName, last_name: lastName }
        })

        if (createError) throw createError

        // Assign Role
        const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: newUser.user.id, role })

        if (roleError) throw roleError

        // Create Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                user_id: newUser.user.id,
                first_name: firstName || 'Admin',
                last_name: lastName || 'User',
                email: email,
                role: 'admin' // Generic profile role
            })

        if (profileError) {
            console.error("Profile creation error", profileError)
            // Don't fail the request if profile fails, but log it
        }

        return new Response(
            JSON.stringify({ user: newUser.user, message: 'User created successfully' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
