-- Create academy_enrollments table
CREATE TABLE academy_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  course_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_phone TEXT,
  student_country TEXT,
  enrollment_status enum_enrollment_status DEFAULT 'active',
  price_usd DECIMAL(10, 2) NOT NULL,
  price_naira DECIMAL(15, 2),
  currency TEXT DEFAULT 'USD',
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_granted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enum for enrollment status
CREATE TYPE enum_enrollment_status AS ENUM (
  'pending_payment',
  'active',
  'completed',
  'cancelled',
  'suspended'
);

-- Add constraint to academy_enrollments
ALTER TABLE academy_enrollments 
  ADD CONSTRAINT academy_enrollments_status CHECK (enrollment_status IN ('pending_payment', 'active', 'completed', 'cancelled', 'suspended'));

-- Create course_transactions table for payment records
CREATE TABLE course_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES academy_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paystack_reference TEXT UNIQUE NOT NULL,
  amount_naira DECIMAL(15, 2) NOT NULL,
  amount_usd DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status enum_transaction_status DEFAULT 'pending',
  payment_method TEXT DEFAULT 'paystack',
  authorization_url TEXT,
  access_code TEXT,
  receipt_url TEXT,
  customer_code TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enum for transaction status
CREATE TYPE enum_transaction_status AS ENUM (
  'pending',
  'processing',
  'success',
  'failed',
  'cancelled'
);

-- Add constraint to course_transactions
ALTER TABLE course_transactions 
  ADD CONSTRAINT course_transactions_status CHECK (status IN ('pending', 'processing', 'success', 'failed', 'cancelled'));

-- Create indexes for performance
CREATE INDEX idx_academy_enrollments_user_id ON academy_enrollments(user_id);
CREATE INDEX idx_academy_enrollments_course_id ON academy_enrollments(course_id);
CREATE INDEX idx_academy_enrollments_status ON academy_enrollments(enrollment_status);
CREATE INDEX idx_course_transactions_user_id ON course_transactions(user_id);
CREATE INDEX idx_course_transactions_enrollment_id ON course_transactions(enrollment_id);
CREATE INDEX idx_course_transactions_reference ON course_transactions(paystack_reference);
CREATE INDEX idx_course_transactions_status ON course_transactions(status);

-- Enable RLS
ALTER TABLE academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academy_enrollments
CREATE POLICY "Users can view their own enrollments"
  ON academy_enrollments FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can insert their own enrollments"
  ON academy_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON academy_enrollments FOR UPDATE
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admin can view all enrollments"
  ON academy_enrollments FOR SELECT
  USING (is_admin());

-- RLS Policies for course_transactions
CREATE POLICY "Users can view their own transactions"
  ON course_transactions FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can insert their own transactions"
  ON course_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all transactions"
  ON course_transactions FOR SELECT
  USING (is_admin());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON academy_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON course_transactions TO authenticated;
GRANT ALL ON academy_enrollments TO service_role;
GRANT ALL ON course_transactions TO service_role;
