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

        let targetUser = null;
        let createdNew = false;

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { first_name: firstName, last_name: lastName }
        });

        if (createError) {
            console.warn("Auth user creation failed or user already exists. Attempting recovery. Error:", createError.message);
            // Try to lookup user by email
            const { data: getByEmailData, error: getByEmailError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
            if (getByEmailError || !getByEmailData || !getByEmailData.user) {
                // If lookup fails too, throw the original creation error
                throw createError;
            }
            targetUser = getByEmailData.user;
        } else {
            targetUser = newUser?.user;
            createdNew = true;
        }

        if (!targetUser) {
            throw new Error("Failed to resolve user ID during creation or recovery");
        }

        // Assign Role (upsert or insert on conflict do nothing)
        const { error: assignRoleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({ user_id: targetUser.id, role }, { onConflict: 'user_id,role' });

        if (assignRoleError) {
            console.error("Assign role error:", assignRoleError);
            throw assignRoleError;
        }

        // Create or repair Profile (idempotent upsert, removing the invalid 'role' field)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                user_id: targetUser.id,
                first_name: firstName || 'Client',
                last_name: lastName || 'Representative',
                email: email
            }, {
                onConflict: 'user_id'
            });

        if (profileError) {
            console.error("Profile creation/upsert error:", profileError);
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
