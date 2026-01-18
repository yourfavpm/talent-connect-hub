-- Create consultations table
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

-- RLS Policies
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Allow public insertion (for website visitors)
CREATE POLICY "Allow public insert to consultations" ON consultations
    FOR INSERT WITH CHECK (true);

-- Allow admins to view and update (Assumes user_roles table or similar admin check exists, or just allow authenticated for now if admin role check is complex in SQL. Generally I'd use admin role check.)
-- Using a simple policy for authenticated users (admins) to view/update for now, assuming only admins access the dashboard part that calls this.
-- If we have a strict admin role, we should use it. I'll defer to allowing authenticated users to READ/UPDATE if they are admin.
-- Creating a policy for admins:
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
