import { Resend } from 'resend';
import { supabase } from '@/integrations/supabase/client';

// Initialize Resend
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const FROM_EMAIL = import.meta.env.VITE_EMAIL_FROM || 'noreply@taskive.com';
const FROM_NAME = import.meta.env.VITE_EMAIL_FROM_NAME || 'Taskive';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

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

interface EmailTemplate {
    id: string;
    template_key: string;
    subject: string;
    body_html: string;
    body_text: string;
    status: string;
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
const getTemplate = async (templateKey: string): Promise<EmailTemplate | null> => {
    try {
        // @ts-ignore - email_templates table may not be in generated types
        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('template_key', templateKey)
            .eq('status', 'active')
            .single();

        if (error || !data) {
            console.warn(`Email template not found: ${templateKey}`);
            return null;
        }

        return data as EmailTemplate;
    } catch (error) {
        console.warn(`Error fetching template ${templateKey}:`, error);
        return null;
    }
};

/**
 * Log email to database (fire and forget)
 */
const logEmail = async (data: {
    recipient_email: string;
    template_key: string;
    subject: string;
    status: 'sent' | 'failed';
    provider_message_id?: string;
    error_message?: string;
}) => {
    try {
        // @ts-ignore - email_logs table may not be in generated types
        await supabase.from('email_logs').insert(data);
    } catch (error) {
        console.error('Error logging email:', error);
    }
};

/**
 * Send email immediately via Resend
 */
export const queueEmail = async (options: QueueEmailOptions): Promise<string> => {
    try {
        if (!resend) {
            console.warn('Resend API key not configured, email not sent');
            return '';
        }

        // Get template from database
        const template = await getTemplate(options.templateKey);
        if (!template) {
            console.warn(`Template not found, skipping email: ${options.templateKey}`);
            return '';
        }

        // Render subject and body
        const subject = renderTemplate(template.subject, options.variables);
        const bodyHtml = renderTemplate(template.body_html, options.variables);
        const bodyText = renderTemplate(template.body_text, options.variables);

        // Send via Resend
        const { data, error } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [options.to],
            subject,
            html: bodyHtml,
            text: bodyText,
        });

        if (error) {
            console.error('Resend error:', error);
            await logEmail({
                recipient_email: options.to,
                template_key: options.templateKey,
                subject,
                status: 'failed',
                error_message: error.message,
            });
            return '';
        }

        // Log success
        await logEmail({
            recipient_email: options.to,
            template_key: options.templateKey,
            subject,
            status: 'sent',
            provider_message_id: data?.id,
        });

        console.log(`Email sent: ${options.templateKey} to ${options.to}`);
        return data?.id || '';
    } catch (error: any) {
        console.error('Error sending email:', error);
        return '';
    }
};

/**
 * Send email immediately (alias for queueEmail for backward compatibility)
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    const result = await queueEmail(options);
    return result !== '';
};

/**
 * Process email queue - no longer needed as we send immediately
 * Kept for backward compatibility
 */
export const processEmailQueue = async (_batchSize: number = 10): Promise<number> => {
    console.log('processEmailQueue: Emails are now sent immediately, queue processing not needed');
    return 0;
};

/**
 * Retry failed emails - no longer needed as we send immediately
 * Kept for backward compatibility
 */
export const retryFailedEmails = async (): Promise<number> => {
    console.log('retryFailedEmails: Emails are now sent immediately, retry processing not needed');
    return 0;
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
        const updates: Record<string, string> = { status };

        if (timestamp) {
            if (status === 'delivered') updates.delivered_at = timestamp.toISOString();
            if (status === 'opened') updates.opened_at = timestamp.toISOString();
            if (status === 'clicked') updates.clicked_at = timestamp.toISOString();
        }

        // @ts-ignore - email_logs table may not be in generated types
        await supabase
            .from('email_logs')
            .update(updates)
            .eq('provider_message_id', messageId);

        console.log(`Email status updated: ${messageId} -> ${status}`);
    } catch (error) {
        console.error('Error updating email status:', error);
    }
};
