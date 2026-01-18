// SendGrid Webhook Handler
// Handles delivery status updates from SendGrid

import { updateEmailStatus } from '@/lib/email/emailService';

export async function POST(request: Request) {
    try {
        const events = await request.json();

        // SendGrid sends an array of events
        for (const event of events) {
            const { sg_message_id, event: eventType, timestamp } = event;

            // Map SendGrid events to our status types
            let status: 'delivered' | 'bounced' | 'opened' | 'clicked' | null = null;

            switch (eventType) {
                case 'delivered':
                    status = 'delivered';
                    break;
                case 'bounce':
                case 'dropped':
                    status = 'bounced';
                    break;
                case 'open':
                    status = 'opened';
                    break;
                case 'click':
                    status = 'clicked';
                    break;
                default:
                    console.log(`Unhandled event type: ${eventType}`);
                    continue;
            }

            if (status && sg_message_id) {
                await updateEmailStatus(
                    sg_message_id,
                    status,
                    timestamp ? new Date(timestamp * 1000) : undefined
                );
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
