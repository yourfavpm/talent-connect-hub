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
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        
        const supabaseClient = createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY,
            { 
                global: { 
                    headers: { 
                        Authorization: req.headers.get('Authorization')!,
                        apikey: SUPABASE_ANON_KEY
                    } 
                } 
            }
        )

        // Verify user is super_admin
        const {
            data: { user },
            error: authError
        } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            console.error("Auth verification failed:", authError);
            return new Response(
                JSON.stringify({ 
                    error: 'Unauthorized: Invalid JWT', 
                    details: authError?.message || 'No user session found',
                    debug: { hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_ANON_KEY }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        const { data: roles, error: roleError } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        // Accept both new ('Super Admin') and legacy ('super_admin') role names
        const userHasRequiredRole = roles?.role === 'Super Admin' || roles?.role === 'super_admin';

        if (roleError || !roles || !userHasRequiredRole) {
            console.error("Role check failed for user:", user.id, "Role found:", roles?.role || 'none');
            return new Response(
                JSON.stringify({ 
                    error: 'Unauthorized: Super Admin access required', 
                    message: `Required: Super Admin. Found: ${roles?.role || 'None'}.`,
                    details: roleError?.message 
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
            )
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
        const { error: assignRoleError } = await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: newUser.user.id, role })

        if (assignRoleError) throw assignRoleError

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
