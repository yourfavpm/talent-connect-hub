-- Email Notification System Infrastructure
-- Creates tables for email templates, queue, logs, and user preferences

-- 1. Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  language TEXT DEFAULT 'en',
  version INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Email Queue Table
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  template_key TEXT REFERENCES email_templates(template_key),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb,
  status TEXT CHECK (status IN ('queued', 'sending', 'sent', 'failed')) DEFAULT 'queued',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- 3. Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_id UUID REFERENCES email_queue(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  template_key TEXT,
  subject TEXT NOT NULL,
  status TEXT CHECK (status IN ('sent', 'delivered', 'bounced', 'opened', 'clicked', 'failed')) DEFAULT 'sent',
  provider_message_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- 4. User Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  notification_types JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_next_retry ON email_queue(next_retry_at) WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_queue_id ON email_logs(queue_id);

CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_status ON email_templates(status);

-- RLS Policies

-- Email Templates: Admins can manage, all authenticated users can read active templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates" ON email_templates
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'operations_admin')
  )
);

CREATE POLICY "Authenticated users can view active templates" ON email_templates
FOR SELECT
USING (status = 'active' AND auth.uid() IS NOT NULL);

-- Email Queue: Only admins can view
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email queue" ON email_queue
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'operations_admin')
  )
);

-- Email Logs: Admins can view all, users can view their own
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all email logs" ON email_logs
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'operations_admin')
  )
);

CREATE POLICY "Users can view their own email logs" ON email_logs
FOR SELECT
USING (
  recipient_email IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Notification Preferences: Users can manage their own
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences" ON notification_preferences
FOR ALL
USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE email_templates IS 'Stores email template definitions with HTML and text versions';
COMMENT ON TABLE email_queue IS 'Queue for pending and failed emails with retry logic';
COMMENT ON TABLE email_logs IS 'Audit trail of all sent emails with delivery tracking';
COMMENT ON TABLE notification_preferences IS 'User preferences for email notifications';

COMMENT ON COLUMN email_queue.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN email_queue.next_retry_at IS 'Timestamp for next retry attempt (exponential backoff)';
COMMENT ON COLUMN email_logs.provider_message_id IS 'SendGrid message ID for webhook tracking';
