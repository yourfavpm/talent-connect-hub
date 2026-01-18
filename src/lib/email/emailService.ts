import sgMail from '@sendgrid/mail';
import { supabase } from '@/integrations/supabase/client';

// Initialize SendGrid
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
const FROM_EMAIL = import.meta.env.VITE_SENDGRID_FROM_EMAIL || 'noreply@taskive.com';
const FROM_NAME = import.meta.env.VITE_SENDGRID_FROM_NAME || 'Taskive';

if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailOptions {
    to: string;
    toName?: string;
    templateKey: string;
    variables: Record<string, any>;
    priority?: 'high' | 'normal';
}

interface QueueEmailOptions extends EmailOptions {
    sendAt?: Date;
}

/**
 * Render email template with variables
 */
const renderTemplate = (template: string, variables: Record<string, any>): string => {
    let rendered = template;

    // Replace all {{variable}} placeholders
    Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, String(variables[key] || ''));
    });

    return rendered;
};

/**
 * Get email template from database
 */
const getTemplate = async (templateKey: string) => {
    const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .eq('status', 'active')
        .single();

    if (error || !data) {
        throw new Error(`Email template not found: ${templateKey}`);
    }

    return data;
};

/**
 * Check user notification preferences
 */
const checkUserPreferences = async (userEmail: string): Promise<boolean> => {
    // Get user by email
    const { data: userData } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', userEmail)
        .single();

    if (!userData) return true; // Send if user not found (system emails)

    // Check preferences
    const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('email_enabled')
        .eq('user_id', userData.id)
        .single();

    return prefs?.email_enabled !== false; // Default to true
};

/**
 * Queue an email for sending
 */
export const queueEmail = async (options: QueueEmailOptions): Promise<string> => {
    try {
        // Check user preferences
        const canSend = await checkUserPreferences(options.to);
        if (!canSend) {
            console.log(`Email skipped due to user preferences: ${options.to}`);
            return '';
        }

        // Get template
        const template = await getTemplate(options.templateKey);

        // Render subject and body
        const subject = renderTemplate(template.subject, options.variables);
        const bodyHtml = renderTemplate(template.body_html, options.variables);
        const bodyText = renderTemplate(template.body_text, options.variables);

        // Add to queue
        const { data, error } = await supabase
            .from('email_queue')
            .insert({
                recipient_email: options.to,
                recipient_name: options.toName,
                template_key: options.templateKey,
                subject,
                body_html: bodyHtml,
                body_text: bodyText,
                variables: options.variables,
                status: 'queued',
            })
            .select()
            .single();

        if (error) throw error;

        console.log(`Email queued: ${options.templateKey} to ${options.to}`);
        return data.id;
    } catch (error) {
        console.error('Error queueing email:', error);
        throw error;
    }
};

/**
 * Send email immediately (bypass queue)
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    try {
        if (!SENDGRID_API_KEY) {
            console.warn('SendGrid API key not configured');
            return false;
        }

        // Check user preferences
        const canSend = await checkUserPreferences(options.to);
        if (!canSend) {
            console.log(`Email skipped due to user preferences: ${options.to}`);
            return false;
        }

        // Get template
        const template = await getTemplate(options.templateKey);

        // Render subject and body
        const subject = renderTemplate(template.subject, options.variables);
        const bodyHtml = renderTemplate(template.body_html, options.variables);
        const bodyText = renderTemplate(template.body_text, options.variables);

        // Send via SendGrid
        const msg = {
            to: {
                email: options.to,
                name: options.toName,
            },
            from: {
                email: FROM_EMAIL,
                name: FROM_NAME,
            },
            subject,
            text: bodyText,
            html: bodyHtml,
        };

        const response = await sgMail.send(msg);
        const messageId = response[0].headers['x-message-id'];

        // Log email
        await supabase.from('email_logs').insert({
            recipient_email: options.to,
            template_key: options.templateKey,
            subject,
            status: 'sent',
            provider_message_id: messageId,
        });

        console.log(`Email sent: ${options.templateKey} to ${options.to}`);
        return true;
    } catch (error: any) {
        console.error('Error sending email:', error);

        // Log failure
        await supabase.from('email_logs').insert({
            recipient_email: options.to,
            template_key: options.templateKey,
            subject: options.templateKey,
            status: 'failed',
            error_message: error.message,
        });

        return false;
    }
};

/**
 * Process email queue (call this from a cron job or background worker)
 */
export const processEmailQueue = async (batchSize: number = 10): Promise<number> => {
    try {
        // Get queued emails
        const { data: emails, error } = await supabase
            .from('email_queue')
            .select('*')
            .eq('status', 'queued')
            .order('created_at', { ascending: true })
            .limit(batchSize);

        if (error || !emails || emails.length === 0) {
            return 0;
        }

        let processed = 0;

        for (const email of emails) {
            try {
                // Update status to sending
                await supabase
                    .from('email_queue')
                    .update({ status: 'sending' })
                    .eq('id', email.id);

                // Send email
                const msg = {
                    to: {
                        email: email.recipient_email,
                        name: email.recipient_name,
                    },
                    from: {
                        email: FROM_EMAIL,
                        name: FROM_NAME,
                    },
                    subject: email.subject,
                    text: email.body_text,
                    html: email.body_html,
                };

                const response = await sgMail.send(msg);
                const messageId = response[0].headers['x-message-id'];

                // Update queue status
                await supabase
                    .from('email_queue')
                    .update({
                        status: 'sent',
                        sent_at: new Date().toISOString(),
                    })
                    .eq('id', email.id);

                // Log email
                await supabase.from('email_logs').insert({
                    queue_id: email.id,
                    recipient_email: email.recipient_email,
                    template_key: email.template_key,
                    subject: email.subject,
                    status: 'sent',
                    provider_message_id: messageId,
                });

                processed++;
            } catch (error: any) {
                console.error(`Error sending queued email ${email.id}:`, error);

                // Calculate next retry time with exponential backoff
                const retryCount = email.retry_count + 1;
                const delays = [5 * 60, 30 * 60, 2 * 60 * 60]; // 5 min, 30 min, 2 hours (in seconds)
                const delaySeconds = delays[Math.min(retryCount - 1, delays.length - 1)];
                const nextRetryAt = new Date(Date.now() + delaySeconds * 1000);

                // Update queue with failure
                await supabase
                    .from('email_queue')
                    .update({
                        status: retryCount >= email.max_retries ? 'failed' : 'queued',
                        retry_count: retryCount,
                        next_retry_at: retryCount >= email.max_retries ? null : nextRetryAt.toISOString(),
                        error_message: error.message,
                    })
                    .eq('id', email.id);

                // Log failure
                await supabase.from('email_logs').insert({
                    queue_id: email.id,
                    recipient_email: email.recipient_email,
                    template_key: email.template_key,
                    subject: email.subject,
                    status: 'failed',
                    error_message: error.message,
                });
            }
        }

        return processed;
    } catch (error) {
        console.error('Error processing email queue:', error);
        return 0;
    }
};

/**
 * Retry failed emails that are ready for retry
 */
export const retryFailedEmails = async (): Promise<number> => {
    try {
        const now = new Date().toISOString();

        // Get failed emails ready for retry
        const { data: emails, error } = await supabase
            .from('email_queue')
            .select('*')
            .eq('status', 'queued')
            .not('next_retry_at', 'is', null)
            .lte('next_retry_at', now)
            .limit(10);

        if (error || !emails || emails.length === 0) {
            return 0;
        }

        // Reset to queued for processing
        const emailIds = emails.map(e => e.id);
        await supabase
            .from('email_queue')
            .update({ next_retry_at: null })
            .in('id', emailIds);

        // Process them
        return await processEmailQueue(emails.length);
    } catch (error) {
        console.error('Error retrying failed emails:', error);
        return 0;
    }
};

/**
 * Update email status from webhook
 */
export const updateEmailStatus = async (
    messageId: string,
    status: 'delivered' | 'bounced' | 'opened' | 'clicked',
    timestamp?: Date
): Promise<void> => {
    try {
        const updates: any = { status };

        if (timestamp) {
            if (status === 'delivered') updates.delivered_at = timestamp.toISOString();
            if (status === 'opened') updates.opened_at = timestamp.toISOString();
            if (status === 'clicked') updates.clicked_at = timestamp.toISOString();
        }

        await supabase
            .from('email_logs')
            .update(updates)
            .eq('provider_message_id', messageId);

        console.log(`Email status updated: ${messageId} -> ${status}`);
    } catch (error) {
        console.error('Error updating email status:', error);
    }
};
