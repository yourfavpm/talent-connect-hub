-- Create enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'operations_admin', 'vetting_admin', 'finance_admin', 'support_admin', 'client', 'talent');
CREATE TYPE public.vetting_status AS ENUM ('pending', 'approved', 'rejected', 'needs_clarification');
CREATE TYPE public.talent_status AS ENUM ('unvetted', 'partially_vetted', 'fully_vetted');
CREATE TYPE public.job_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'published', 'filled', 'closed');
CREATE TYPE public.contract_status AS ENUM ('pending', 'active', 'paused', 'completed', 'terminated');
CREATE TYPE public.offer_status AS ENUM ('pending', 'sent_to_admin', 'contract_generated', 'sent_to_client', 'signed', 'rejected');
CREATE TYPE public.timesheet_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
CREATE TYPE public.invoice_status AS ENUM ('pending', 'sent', 'paid', 'overdue');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.ticket_category AS ENUM ('payment', 'job', 'technical', 'talent_issue', 'billing', 'other');
CREATE TYPE public.education_level AS ENUM ('secondary_school', 'diploma', 'bachelors', 'masters', 'doctorate', 'other');
CREATE TYPE public.availability_type AS ENUM ('full_time', 'part_time');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper function to check if user is any admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'operations_admin', 'vetting_admin', 'finance_admin', 'support_admin')
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Talents table
CREATE TABLE public.talents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    talent_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    timezone TEXT,
    preferred_working_hours TEXT,
    primary_role TEXT,
    secondary_skills TEXT[],
    years_of_experience INTEGER,
    tools_familiar_with TEXT[],
    languages_spoken TEXT[],
    availability availability_type,
    cv_url TEXT,
    government_id_url TEXT,
    proof_of_address_url TEXT,
    nda_agreed BOOLEAN DEFAULT FALSE,
    terms_agreed BOOLEAN DEFAULT FALSE,
    bank_details JSONB,
    vetting_status talent_status DEFAULT 'unvetted',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Talent work history
CREATE TABLE public.talent_work_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    role_description TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Talent education
CREATE TABLE public.talent_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    education_level education_level NOT NULL,
    institution_name TEXT NOT NULL,
    field_of_study TEXT,
    start_year INTEGER,
    end_year INTEGER,
    is_current BOOLEAN DEFAULT FALSE,
    certificate_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Talent certifications
CREATE TABLE public.talent_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    certification_name TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    year_obtained INTEGER,
    expiry_date DATE,
    credential_url TEXT,
    certificate_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Talent references
CREATE TABLE public.talent_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    reference_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    relationship TEXT,
    verification_status vetting_status DEFAULT 'pending',
    admin_notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Talent vetting (5 levels - TCF)
CREATE TABLE public.talent_vetting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
    level_name TEXT NOT NULL,
    status vetting_status DEFAULT 'pending',
    admin_id UUID REFERENCES auth.users(id),
    admin_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (talent_id, level)
);

-- Clients table
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    client_id TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    industry TEXT,
    company_size TEXT,
    website TEXT,
    country TEXT,
    timezone TEXT,
    primary_contact_name TEXT NOT NULL,
    primary_contact_email TEXT NOT NULL,
    primary_contact_phone TEXT,
    primary_contact_role TEXT,
    billing_address TEXT,
    preferred_currency TEXT DEFAULT 'USD',
    terms_agreed BOOLEAN DEFAULT FALSE,
    status vetting_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    role_needed TEXT NOT NULL,
    responsibilities TEXT,
    required_skills TEXT[],
    weekly_hours INTEGER,
    engagement_type availability_type,
    duration TEXT,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    start_date DATE,
    special_notes TEXT,
    status job_status DEFAULT 'draft',
    vetting_level_required INTEGER DEFAULT 5,
    admin_notes TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job applications
CREATE TABLE public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    cover_letter TEXT,
    status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'rejected', 'hired', 'withdrawn')),
    shortlisted_by_admin UUID REFERENCES auth.users(id),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (job_id, talent_id)
);

-- Offers
CREATE TABLE public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    role_title TEXT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    weekly_hours INTEGER NOT NULL,
    start_date DATE NOT NULL,
    duration TEXT,
    special_terms TEXT,
    status offer_status DEFAULT 'pending',
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contracts
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    contract_number TEXT UNIQUE NOT NULL,
    role_title TEXT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    talent_rate DECIMAL(10,2) NOT NULL,
    taskive_margin DECIMAL(5,2) NOT NULL,
    weekly_hours INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    contract_terms TEXT,
    billing_details JSONB,
    status contract_status DEFAULT 'pending',
    client_signed_at TIMESTAMP WITH TIME ZONE,
    talent_signed_at TIMESTAMP WITH TIME ZONE,
    admin_sent_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timesheets
CREATE TABLE public.timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_hours DECIMAL(5,2) DEFAULT 0,
    status timesheet_status DEFAULT 'draft',
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (talent_id, contract_id, week_start)
);

-- Timesheet entries
CREATE TABLE public.timesheet_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timesheet_id UUID REFERENCES public.timesheets(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(4,2) NOT NULL,
    description TEXT,
    task_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    total_hours DECIMAL(6,2) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    status invoice_status DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Talent invoices (what talent sees - after margin deduction)
CREATE TABLE public.talent_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    talent_id UUID REFERENCES public.talents(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status invoice_status DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category ticket_category NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    attachment_url TEXT,
    status ticket_status DEFAULT 'open',
    assigned_to UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_work_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_vetting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));

-- Talents
CREATE POLICY "Talents can view own data" ON public.talents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Talents can update own data" ON public.talents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Talents can insert own data" ON public.talents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all talents" ON public.talents FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update talents" ON public.talents FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Clients can view vetted talents" ON public.talents FOR SELECT USING (
    public.has_role(auth.uid(), 'client') AND vetting_status = 'fully_vetted'
);

-- Talent work history
CREATE POLICY "Talents can manage own work history" ON public.talent_work_history FOR ALL USING (
    EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_work_history.talent_id AND talents.user_id = auth.uid())
);
CREATE POLICY "Admins can view work history" ON public.talent_work_history FOR SELECT USING (public.is_admin(auth.uid()));

-- Talent education
CREATE POLICY "Talents can manage own education" ON public.talent_education FOR ALL USING (
    EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_education.talent_id AND talents.user_id = auth.uid())
);
CREATE POLICY "Admins can view education" ON public.talent_education FOR SELECT USING (public.is_admin(auth.uid()));

-- Talent certifications
CREATE POLICY "Talents can manage own certifications" ON public.talent_certifications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_certifications.talent_id AND talents.user_id = auth.uid())
);
CREATE POLICY "Admins can view certifications" ON public.talent_certifications FOR SELECT USING (public.is_admin(auth.uid()));

-- Talent references
CREATE POLICY "Talents can manage own references" ON public.talent_references FOR ALL USING (
    EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_references.talent_id AND talents.user_id = auth.uid())
);
CREATE POLICY "Admins can manage references" ON public.talent_references FOR ALL USING (public.is_admin(auth.uid()));

-- Talent vetting
CREATE POLICY "Talents can view own vetting" ON public.talent_vetting FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_vetting.talent_id AND talents.user_id = auth.uid())
);
CREATE POLICY "Admins can manage vetting" ON public.talent_vetting FOR ALL USING (public.is_admin(auth.uid()));

-- Clients
CREATE POLICY "Clients can view own data" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Clients can update own data" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Clients can insert own data" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all clients" ON public.clients FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update clients" ON public.clients FOR UPDATE USING (public.is_admin(auth.uid()));

-- Jobs
CREATE POLICY "Clients can view own jobs" ON public.jobs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = jobs.client_id AND clients.user_id = auth.uid())
);
CREATE POLICY "Clients can create jobs" ON public.jobs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = jobs.client_id AND clients.user_id = auth.uid())
);
CREATE POLICY "Clients can update own jobs" ON public.jobs FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = jobs.client_id AND clients.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all jobs" ON public.jobs FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Talents can view published jobs" ON public.jobs FOR SELECT USING (
    public.has_role(auth.uid(), 'talent') AND status = 'published'
);

-- Job applications
CREATE POLICY "Talents can manage own applications" ON public.job_applications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.talents WHERE talents.id = job_applications.talent_id AND talents.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all applications" ON public.job_applications FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Clients can view applications for their jobs" ON public.job_applications FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.jobs j
        JOIN public.clients c ON j.client_id = c.id
        WHERE j.id = job_applications.job_id AND c.user_id = auth.uid()
    )
);

-- Offers
CREATE POLICY "Clients can view own offers" ON public.offers FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = offers.client_id AND clients.user_id = auth.uid())
);
CREATE POLICY "Clients can create offers" ON public.offers FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = offers.client_id AND clients.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all offers" ON public.offers FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Talents can view offers for them" ON public.offers FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talents WHERE talents.id = offers.talent_id AND talents.user_id = auth.uid())
);

-- Contracts
CREATE POLICY "Clients can view own contracts" ON public.contracts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = contracts.client_id AND clients.user_id = auth.uid())
);
CREATE POLICY "Clients can update own contracts" ON public.contracts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = contracts.client_id AND clients.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all contracts" ON public.contracts FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Talents can view own contracts" ON public.contracts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talents WHERE talents.id = contracts.talent_id AND talents.user_id = auth.uid())
);

-- Timesheets
CREATE POLICY "Talents can manage own timesheets" ON public.timesheets FOR ALL USING (
    EXISTS (SELECT 1 FROM public.talents WHERE talents.id = timesheets.talent_id AND talents.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all timesheets" ON public.timesheets FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Clients can view timesheets for their contracts" ON public.timesheets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.contracts ct
        JOIN public.clients c ON ct.client_id = c.id
        WHERE ct.id = timesheets.contract_id AND c.user_id = auth.uid()
    )
);

-- Timesheet entries
CREATE POLICY "Users can manage entries for their timesheets" ON public.timesheet_entries FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.timesheets ts
        JOIN public.talents t ON ts.talent_id = t.id
        WHERE ts.id = timesheet_entries.timesheet_id AND t.user_id = auth.uid()
    )
);
CREATE POLICY "Admins can manage all entries" ON public.timesheet_entries FOR ALL USING (public.is_admin(auth.uid()));

-- Invoices
CREATE POLICY "Clients can view own invoices" ON public.invoices FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = invoices.client_id AND clients.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all invoices" ON public.invoices FOR ALL USING (public.is_admin(auth.uid()));

-- Talent invoices
CREATE POLICY "Talents can view own invoices" ON public.talent_invoices FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talents WHERE talents.id = talent_invoices.talent_id AND talents.user_id = auth.uid())
);
CREATE POLICY "Admins can manage talent invoices" ON public.talent_invoices FOR ALL USING (public.is_admin(auth.uid()));

-- Messages
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (public.is_admin(auth.uid()));

-- Support tickets
CREATE POLICY "Users can manage own tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tickets" ON public.support_tickets FOR ALL USING (public.is_admin(auth.uid()));

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "System can create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Function to generate talent ID
CREATE OR REPLACE FUNCTION public.generate_talent_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_id TEXT;
    counter INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(talent_id FROM 8) AS INTEGER)), 1000) + 1
    INTO counter
    FROM public.talents;
    
    new_id := 'TAS-VA-' || counter::TEXT;
    RETURN new_id;
END;
$$;

-- Function to generate client ID
CREATE OR REPLACE FUNCTION public.generate_client_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_id TEXT;
    counter INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(client_id FROM 5) AS INTEGER)), 1000) + 1
    INTO counter
    FROM public.clients;
    
    new_id := 'CLI-' || counter::TEXT;
    RETURN new_id;
END;
$$;

-- Function to generate contract number
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_num TEXT;
    counter INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 5) AS INTEGER)), 10000) + 1
    INTO counter
    FROM public.contracts;
    
    new_num := 'CON-' || counter::TEXT;
    RETURN new_num;
END;
$$;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_num TEXT;
    counter INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 10000) + 1
    INTO counter
    FROM public.invoices;
    
    new_num := 'INV-' || counter::TEXT;
    RETURN new_num;
END;
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Initialize vetting levels when talent is created
CREATE OR REPLACE FUNCTION public.init_talent_vetting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.talent_vetting (talent_id, level, level_name) VALUES
        (NEW.id, 1, 'Identity Verification'),
        (NEW.id, 2, 'Work Experience Review'),
        (NEW.id, 3, 'Skill Verification'),
        (NEW.id, 4, 'Reference Check'),
        (NEW.id, 5, 'Education & Certifications');
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_talent_created
    AFTER INSERT ON public.talents
    FOR EACH ROW EXECUTE FUNCTION public.init_talent_vetting();

-- Update talent vetting status based on levels
CREATE OR REPLACE FUNCTION public.update_talent_vetting_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    approved_count INTEGER;
    rejected_count INTEGER;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE status = 'approved'),
        COUNT(*) FILTER (WHERE status = 'rejected')
    INTO approved_count, rejected_count
    FROM public.talent_vetting
    WHERE talent_vetting.talent_id = NEW.talent_id;
    
    IF rejected_count > 0 THEN
        UPDATE public.talents SET vetting_status = 'unvetted' WHERE talents.id = NEW.talent_id;
    ELSIF approved_count = 5 THEN
        UPDATE public.talents SET vetting_status = 'fully_vetted' WHERE talents.id = NEW.talent_id;
    ELSIF approved_count > 0 THEN
        UPDATE public.talents SET vetting_status = 'partially_vetted' WHERE talents.id = NEW.talent_id;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_vetting_updated
    AFTER UPDATE ON public.talent_vetting
    FOR EACH ROW EXECUTE FUNCTION public.update_talent_vetting_status();

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_talents_updated_at BEFORE UPDATE ON public.talents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON public.timesheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_talent_vetting_updated_at BEFORE UPDATE ON public.talent_vetting FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();