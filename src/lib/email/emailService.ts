import { supabase } from '@/integrations/supabase/client';

interface EmailOptions {
    to: string;
    toName?: string;
    templateKey: string;
    variables: Record<string, string | number | boolean>;
    priority?: 'high' | 'normal';
}

interface QueueEmailOptions extends EmailOptions {
    sendAt?: Date;
}

/**
 * Send email via the Supabase Edge Function (server-side).
 * This replaces the old browser-side Resend SDK approach which was
 * blocked by CORS — Resend only accepts server-side API calls.
 */
export const queueEmail = async (options: QueueEmailOptions): Promise<string> => {
    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
                templateKey: options.templateKey,
                to: options.to,
                toName: options.toName,
                variables: options.variables,
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

        console.log(`Email queued: ${options.templateKey} to ${options.to}`);
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
