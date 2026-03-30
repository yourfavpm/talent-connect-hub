-- Seed the new admin user info@opslyhrtech.tech
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'info@opslyhrtech.tech') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
        ) VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000',
            'info@opslyhrtech.tech',
            crypt('OPSlyHRAdmin2026!', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"role":"super_admin"}',
            false,
            'authenticated'
        );
        
        -- Upsert into public.profiles
        INSERT INTO public.profiles (user_id, email, first_name, last_name)
        VALUES (new_user_id, 'info@opslyhrtech.tech', 'OPSlyHR', 'Admin')
        ON CONFLICT (user_id) DO UPDATE 
        SET email = EXCLUDED.email, 
            first_name = EXCLUDED.first_name, 
            last_name = EXCLUDED.last_name;

        -- Insert into public.user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new_user_id, 'super_admin');
    ELSE
        SELECT id INTO new_user_id FROM auth.users WHERE email = 'info@opslyhrtech.tech';
        
        -- Update password just in case
        UPDATE auth.users 
        SET encrypted_password = crypt('OPSlyHRAdmin2026!', gen_salt('bf'))
        WHERE id = new_user_id;
        
        -- Ensure role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new_user_id, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
