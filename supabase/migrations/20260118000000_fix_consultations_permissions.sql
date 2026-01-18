-- Ensure consultations table exists
CREATE TABLE IF NOT EXISTS consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    objective TEXT,
    details TEXT,
    preferred_date DATE,
    preferred_time TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'closed')),
    admin_notes TEXT
);

-- Enable RLS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Grant permissions (safe to run multiple times)
GRANT INSERT ON consultations TO anon, authenticated;
GRANT SELECT ON consultations TO anon, authenticated;
GRANT UPDATE ON consultations TO authenticated;

-- Policies (Drop first to avoid errors on recreation)
DROP POLICY IF EXISTS "Allow public insert to consultations" ON consultations;
DROP POLICY IF EXISTS "Admins can view consultations" ON consultations;
DROP POLICY IF EXISTS "Admins can update consultations" ON consultations;

-- Recreate Policies
CREATE POLICY "Allow public insert to consultations" ON consultations
    FOR INSERT 
    TO public 
    WITH CHECK (true);

CREATE POLICY "Admins can view consultations" ON consultations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'super_admin'
        )
    );

CREATE POLICY "Admins can update consultations" ON consultations
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'super_admin'
        )
    );
