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

        // Verify caller is a super_admin
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
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        const { data: roles, error: roleError } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()

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

        // Use Service Role for privileged operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, password, role: targetRole, firstName, lastName, company_name } = await req.json()

        if (!email || !password || !targetRole) {
            throw new Error('Missing required fields: email, password, role')
        }

        // ── Step 1: Create or recover the auth user ──────────────────────────
        let targetUser = null;

        const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { first_name: firstName, last_name: lastName }
        });

        if (createError) {
            console.warn("Auth user creation failed, attempting to recover existing user. Error:", createError.message);
            // User might already exist — look them up by email
            const { data: existingUserData, error: lookupError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
            if (lookupError || !existingUserData?.user) {
                throw createError; // Can't recover — re-throw original error
            }
            targetUser = existingUserData.user;
        } else {
            targetUser = newUserData?.user ?? null;
        }

        if (!targetUser?.id) {
            throw new Error("Failed to resolve a valid user ID during creation or recovery");
        }

        // ── Step 2: Assign role ───────────────────────────────────────────────
        const { error: assignRoleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({ user_id: targetUser.id, role: targetRole }, { onConflict: 'user_id,role' });

        if (assignRoleError) {
            console.error("Assign role error:", assignRoleError);
            throw assignRoleError;
        }

        // ── Step 3: Ensure profile exists (upsert with Service Role) ──────────
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                user_id: targetUser.id,
                first_name: firstName || 'Client',
                last_name: lastName || 'Representative',
                email: email,
            }, { onConflict: 'user_id' });

        if (profileError) {
            // Profile creation failed. Log the full error and throw so the caller knows.
            console.error("Profile upsert error:", profileError);
            throw new Error(`Profile creation failed: ${profileError.message} (code: ${profileError.code})`);
        }

        // ── Step 4: Optionally create client record ───────────────────────────
        // Done here with Service Role so the FK constraint is satisfied immediately.
        let clientRecord = null;

        if (company_name && targetRole === 'client') {
            // Check whether a client record already exists for this user
            const { data: existingClient } = await supabaseAdmin
                .from('clients')
                .select('id, user_id, company_name')
                .eq('user_id', targetUser.id)
                .maybeSingle();

            if (existingClient) {
                console.log("Client record already exists for user, reusing:", existingClient.id);
                clientRecord = existingClient;
            } else {
                const { data: insertedClient, error: clientInsertError } = await supabaseAdmin
                    .from('clients')
                    .insert({
                        user_id: targetUser.id,
                        client_id: `CLI-${Date.now()}`,
                        company_name: company_name,
                        primary_contact_name: `${firstName || ''} ${lastName || ''}`.trim() || company_name,
                        primary_contact_email: email,
                        status: 'approved',
                    })
                    .select('id, user_id, company_name')
                    .single();

                if (clientInsertError) {
                    console.error("Client insert error:", clientInsertError);
                    throw new Error(`Client record creation failed: ${clientInsertError.message}`);
                }
                clientRecord = insertedClient;
            }
        }

        // ── Step 5: Return resolved user + optional client ────────────────────
        return new Response(
            JSON.stringify({
                user: targetUser,
                client: clientRecord,
                message: 'User configured successfully',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error("create-user edge function error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
