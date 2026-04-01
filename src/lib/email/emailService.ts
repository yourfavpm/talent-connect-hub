import { supabase } from '@/integrations/supabase/client';

interface EmailOptions {
    to: string;
    toName?: string;
    templateKey?: string;
    variables?: Record<string, string | number | boolean>;
    htmlTemplate?: string;
    subject?: string;
    priority?: 'high' | 'normal';
}

interface QueueEmailOptions extends EmailOptions {
    sendAt?: Date;
}

/**
 * Send email via the Supabase Edge Function (server-side).
 * This replaces the old browser-side Resend SDK approach which was
 * blocked by CORS — Resend only accepts server-side API calls.
 * 
 * Now supports both:
 * - Old method: templateKey + variables (uses database templates)
 * - New method: htmlTemplate + subject (uses branded HTML templates)
 */
/**
 * Request a custom verification email for a user
 * This triggers the auth-verification edge function to generate
 * a secure token and send the branded email.
 */
export const requestVerificationEmail = async (
    userId: string,
    email: string,
    firstName: string,
    portal: 'talent' | 'client' = 'talent'
): Promise<boolean> => {
    try {
        const { error } = await supabase.functions.invoke('auth-verification/request', {
            body: { userId, email, firstName, portal },
        });

        if (error) {
            console.error('Error requesting verification email:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error requesting verification email:', error);
        return false;
    }
};

export const queueEmail = async (options: QueueEmailOptions): Promise<string> => {
    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
                templateKey: options.templateKey,
                htmlTemplate: options.htmlTemplate,
                subject: options.subject,
                to: options.to,
                toName: options.toName,
                variables: options.variables || {},
                priority: options.priority,
            },
        });

        if (error) {
            console.error('Edge function invocation error:', error);
            return '';
        }

        if (data?.error) {
            console.error('Email sending error:', data.error);
            return '';
        }

        console.log(`Email queued: ${options.htmlTemplate ? 'HTML template' : options.templateKey} to ${options.to}`);
        return data?.messageId || '';
    } catch (error: unknown) {
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
    console.log('processEmailQueue: Emails are now sent immediately via edge function');
    return 0;
};

/**
 * Retry failed emails - no longer needed as we send immediately
 * Kept for backward compatibility
 */
export const retryFailedEmails = async (): Promise<number> => {
    console.log('retryFailedEmails: Emails are now sent immediately via edge function');
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


        await supabase
            .from('email_logs')
            .update(updates)
            .eq('provider_message_id', messageId);

        console.log(`Email status updated: ${messageId} -> ${status}`);
    } catch (error) {
        console.error('Error updating email status:', error);
    }
};
