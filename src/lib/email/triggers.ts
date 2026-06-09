// Email Trigger Helper Functions
// Centralized functions to trigger emails for various events

import { queueEmail, requestVerificationEmail } from './emailService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Build a branded HTML email for the "new job published" notification.
 * Runs entirely in the browser — no filesystem access.
 */
function buildJobPublishedEmail(vars: {
    firstName: string;
    roleTitle: string;
    budget: string;
    employmentType: string;
    location: string;
    jobLink: string;
}): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>New Opportunity: ${vars.roleTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
        style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:28px 40px;text-align:center;">
            <img src="https://app.opslyhr.com/images/logoplain.png" alt="OpslyHR" style="height:36px;" />
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 6px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">New Opportunity</p>
            <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.35;">Hi ${vars.firstName}, a new role just went live!</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">A new hiring opportunity has just been posted on OpslyHR and we think it might be a great fit for your skills and experience.</p>

            <!-- Job card -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
              style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
              <tr><td style="padding:22px 26px;">
                <h2 style="margin:0 0 18px;font-size:17px;font-weight:700;color:#0f172a;">${vars.roleTitle}</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                      <span style="display:block;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px;">Budget</span>
                      <span style="font-size:15px;font-weight:700;color:#0f172a;">${vars.budget}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                      <span style="display:block;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px;">Employment Type</span>
                      <span style="font-size:15px;font-weight:600;color:#334155;">${vars.employmentType}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <span style="display:block;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px;">Location</span>
                      <span style="font-size:15px;font-weight:600;color:#334155;">${vars.location}</span>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- Notice -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
              style="background:#fef9c3;border:1px solid #fde68a;border-radius:10px;margin-bottom:28px;">
              <tr><td style="padding:14px 18px;">
                <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">
                  <strong>Important Notice:</strong> To maintain the quality of our talent network, all applicants must complete the OpslyHR vetting process before they can be considered for client opportunities. If you have not yet completed your vetting, you will be prompted to do so when you apply.
                </p>
              </td></tr>
            </table>

            <!-- CTA -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="border-radius:10px;background:#0f172a;">
                  <a href="${vars.jobLink}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Apply for this Role &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:22px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0 0 10px;font-size:13px;color:#94a3b8;text-align:center;">Follow us</p>
            <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding:0 10px;"><a href="https://www.linkedin.com/company/opslyhr/" style="font-size:13px;color:#475569;text-decoration:none;font-weight:600;">LinkedIn</a></td>
                <td style="padding:0 10px;"><a href="https://x.com/opslyhr?s=21" style="font-size:13px;color:#475569;text-decoration:none;font-weight:600;">Twitter / X</a></td>
                <td style="padding:0 10px;"><a href="https://www.instagram.com/opslyhr?igsh=MTJhOXhzdXY3eTczMA==" style="font-size:13px;color:#475569;text-decoration:none;font-weight:600;">Instagram</a></td>
                <td style="padding:0 10px;"><a href="https://www.tiktok.com/@opslyhr?_r=1&_t=ZS-972oUQjwnw2" style="font-size:13px;color:#475569;text-decoration:none;font-weight:600;">TikTok</a></td>
              </tr>
            </table>
            <p style="margin:14px 0 0;font-size:12px;color:#cbd5e1;text-align:center;">
              &copy; 2025 OpslyHR &middot; <a href="mailto:hire@opslyhr.com" style="color:#94a3b8;">hire@opslyhr.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const AUTH_URL = import.meta.env.VITE_APP_URL || 'https://app.opslyhr.com';
const TALENT_URL = 'https://talent.opslyhr.com';
const CLIENT_URL = 'https://client.opslyhr.com';
const ADMIN_URL = 'https://admin.opslyhr.com';

// --- AUTH & ACCOUNT TRIGGERS ---

/**
 * Send talent verification required email (Secure Custom Flow)
 */
export const requestTalentVerification = async (userId: string, email: string, firstName: string) => {
    return await requestVerificationEmail(userId, email, firstName, 'talent');
};

/**
 * Send client verification required email (Secure Custom Flow)
 */
export const requestClientVerification = async (userId: string, email: string, contactName: string) => {
    return await requestVerificationEmail(userId, email, contactName, 'client');
};

/**
 * Legacy: Send talent verification required email
 */
export const sendTalentVerificationEmail = async (email: string, firstName: string, verificationLink: string) => {
    await queueEmail({
        to: email,
        toName: firstName,
        templateKey: 'talent_auth_verify_required',
        variables: {
            first_name: firstName,
            verification_link: verificationLink,
        },
    });
};

/**
 * Send talent account created email
 */
export const sendTalentAccountCreatedEmail = async (email: string, firstName: string, verificationLink: string) => {
    await queueEmail({
        to: email,
        toName: firstName,
        templateKey: 'talent_auth_account_created',
        variables: {
            first_name: firstName,
            verification_link: verificationLink,
        },
    });
};

/**
 * Send talent email verified success notification
 */
export const sendTalentEmailVerifiedEmail = async (email: string, firstName: string) => {
    await queueEmail({
        to: email,
        toName: firstName,
        templateKey: 'talent_auth_verified_success',
        variables: {
            first_name: firstName,
            dashboard_link: `${TALENT_URL}/dashboard`,
        },
    });
};

/**
 * Send talent password reset email
 */
export const sendTalentPasswordResetEmail = async (email: string, firstName: string, redirectTo?: string) => {
    await queueEmail({
        to: email,
        toName: firstName,
        templateKey: 'talent_auth_password_reset',
        variables: {
            first_name: firstName,
            reset_link: redirectTo || `${AUTH_URL}/auth/update-password?portal=talent`,
        },
    });
};

/**
 * Send talent password changed security alert
 */
export const sendTalentPasswordChangedEmail = async (email: string, firstName: string) => {
    await queueEmail({
        to: email,
        toName: firstName,
        templateKey: 'talent_auth_password_changed',
        variables: {
            first_name: firstName,
        },
    });
};

/**
 * Send client password reset email
 */
export const sendClientPasswordResetEmail = async (email: string, contactName: string, redirectTo?: string) => {
    await queueEmail({
        to: email,
        toName: contactName,
        templateKey: 'client_auth_password_reset',
        variables: {
            first_name: contactName,
            reset_link: redirectTo || `${AUTH_URL}/auth/update-password?portal=client`,
        },
    });
};

/**
 * Send client password changed security alert
 */
export const sendClientPasswordChangedEmail = async (email: string, contactName: string) => {
    await queueEmail({
        to: email,
        toName: contactName,
        templateKey: 'client_auth_password_changed',
        variables: {
            first_name: contactName,
        },
    });
};

/**
 * Send client email verified success notification
 */
export const sendClientEmailVerifiedEmail = async (email: string, contactName: string) => {
    await queueEmail({
        to: email,
        toName: contactName,
        templateKey: 'client_auth_verified_success',
        variables: {
            first_name: contactName,
            dashboard_link: `${CLIENT_URL}/dashboard`,
        },
    });
};

// --- ONBOARDING TRIGGERS ---

/**
 * Send welcome email to new talent after signup
 */
export const sendTalentWelcomeEmail = async (talent: {
    email: string;
    firstName: string;
}) => {
    await queueEmail({
        to: talent.email,
        toName: talent.firstName,
        templateKey: 'talent_onboarding_welcome',
        variables: {
            first_name: talent.firstName,
            profile_link: `${TALENT_URL}/onboarding`,
        },
    });
};

/**
 * Send welcome email to new client after signup
 */
export const sendClientWelcomeEmail = async (client: {
    email: string;
    contactName: string;
    companyName: string;
}) => {
    await queueEmail({
        to: client.email,
        toName: client.contactName,
        templateKey: 'client_onboarding_welcome',
        variables: {
            first_name: client.contactName,
            company_name: client.companyName,
            dashboard_link: `${CLIENT_URL}/dashboard`,
        },
    });
};

// --- VETTING TRIGGERS ---

/**
 * Send vetting request submitted confirmation to talent
 */
export const sendVettingSubmittedEmail = async (talent: {
    email: string;
    firstName: string;
}) => {
    await queueEmail({
        to: talent.email,
        toName: talent.firstName,
        templateKey: 'talent_vetting_submitted',
        variables: {
            first_name: talent.firstName,
        },
    });
};

/**
 * Send vetting changes requested email
 */
export const sendVettingChangesRequestedEmail = async (talent: {
    email: string;
    firstName: string;
    feedback: string;
}) => {
    await queueEmail({
        to: talent.email,
        toName: talent.firstName,
        templateKey: 'talent_vetting_changes_requested',
        variables: {
            first_name: talent.firstName,
            feedback: talent.feedback,
            vetting_link: `${TALENT_URL}/vetting`,
        },
    });
};

/**
 * Send vetting approved email
 */
export const sendVettingApprovedEmail = async (talent: {
    email: string;
    firstName: string;
}) => {
    await queueEmail({
        to: talent.email,
        toName: talent.firstName,
        templateKey: 'talent_vetting_approved',
        variables: {
            talent_name: talent.firstName,
            approval_date: new Date().toLocaleDateString(),
            jobs_link: `${TALENT_URL}/jobs`,
        },
    });
};

/**
 * Send vetting rejected email
 */
export const sendVettingRejectedEmail = async (talent: {
    email: string;
    firstName: string;
    rejectionReasons: string;
}) => {
    await queueEmail({
        to: talent.email,
        toName: talent.firstName,
        templateKey: 'talent_vetting_rejected',
        variables: {
            talent_name: talent.firstName,
            reasons: talent.rejectionReasons,
            resubmit_link: `${TALENT_URL}/vetting`,
        },
    });
};

/**
 * Send talent level assigned email
 */
export const sendLevelAssignedEmail = async (talent: {
    email: string;
    firstName: string;
    level: string;
}) => {
    await queueEmail({
        to: talent.email,
        toName: talent.firstName,
        templateKey: 'talent_vetting_level_assigned',
        variables: {
            first_name: talent.firstName,
            level: talent.level,
        },
    });
};

// --- JOBS & OPPORTUNITIES TRIGGERS ---

/**
 * Send job recommendation email to talent
 */
export const sendJobRecommendationEmail = async (talent: {
    email: string;
    firstName: string;
    jobTitle: string;
    clientName: string;
    jobId: string;
}) => {
    await queueEmail({
        to: talent.email,
        toName: talent.firstName,
        templateKey: 'talent_job_recommendation',
        variables: {
            job_title: talent.jobTitle,
            client_name: talent.clientName,
            job_link: `${TALENT_URL}/jobs/${talent.jobId}`,
        },
    });
};

/**
 * Send invitation to apply for a role
 */
export const sendInvitedToApplyEmail = async (invitation: {
    email: string;
    firstName: string;
    jobTitle: string;
    jobId: string;
}) => {
    await queueEmail({
        to: invitation.email,
        toName: invitation.firstName,
        templateKey: 'talent_job_invited_to_apply',
        variables: {
            job_title: invitation.jobTitle,
            job_link: `${TALENT_URL}/jobs/${invitation.jobId}`,
        },
    });
};

/**
 * Send notification to talent when a job they might like is published
 */
export const sendJobPublishedEmail = async (talent: {
    email: string;
    firstName: string;
    jobTitle: string;
    jobId: string;
}) => {
    await queueEmail({
        to: talent.email,
        templateKey: 'talent_job_published',
        variables: {
            job_title: talent.jobTitle,
            job_link: `${TALENT_URL}/jobs/${talent.jobId}`,
        },
    });
};

/**
 * Send job published notification to all talents
 */
export const triggerJobPublishedEmails = async (job: {
    id: string;
    title: string;
    preferred_currency?: string | null;
    salary_type?: string | null;
    budget_type?: string | null;
    fixed_budget?: number | null;
    budget_min?: number | null;
    budget_max?: number | null;
    engagement_type?: string | null;
    location_preference?: string | null;
}) => {
    try {
        console.log(`Triggering bulk job publication email notifications for job ID: ${job.id}`);
        // 1. Fetch all registered talents
        const { data: talents, error } = await (supabase as any)
            .from("talents")
            .select("first_name, email");

        if (error) {
            console.error("Error fetching talents for bulk email trigger:", error);
            return;
        }

        if (!talents || talents.length === 0) {
            console.log("No talents found to notify.");
            return;
        }

        // 2. Format job details
        const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", NGN: "₦", KES: "KSh ", ZAR: "R " };
        const sym = symbols[job.preferred_currency || "USD"] || "$";
        const freq = job.salary_type === "monthly" ? "/mo" : (job.salary_type === "hourly" ? "/hr" : "");
        let budget = "TBD";
        if (job.budget_type === "fixed" && job.fixed_budget) {
            budget = `${sym}${Number(job.fixed_budget).toLocaleString()}${freq}`;
        } else if (job.budget_min && job.budget_max) {
            budget = `${sym}${Number(job.budget_min).toLocaleString()} – ${sym}${Number(job.budget_max).toLocaleString()}${freq}`;
        } else if (job.budget_min) {
            budget = `From ${sym}${Number(job.budget_min).toLocaleString()}${freq}`;
        }

        const employmentType = job.engagement_type?.replace(/_/g, " ") || "—";
        const location = job.location_preference || "Any";
        
        // 3. For each talent, generate and send branded email
        const emailPromises = talents.map((t) => {
            if (!t.email) return Promise.resolve();

            // Build the HTML inline (no filesystem access required)
            const html = buildJobPublishedEmail({
                firstName: t.first_name || 'Talent',
                roleTitle: job.title,
                budget,
                employmentType,
                location,
                jobLink: `${TALENT_URL}/jobs/${job.id}`,
            });

            return queueEmail({
                to: t.email,
                toName: t.first_name,
                subject: `New Hiring Opportunity: ${job.title}`,
                htmlTemplate: html,
            });
        });

        await Promise.all(emailPromises);
        console.log(`Successfully queued job publishing notification emails for ${talents.length} talents.`);
    } catch (err) {
        console.error("Failed to trigger job published emails:", err);
    }
};

/**
 * Send notification to client when their job is approved and live
 */
export const sendClientJobLiveEmail = async (client: {
    email: string;
    contactName: string;
    jobTitle: string;
    jobId: string;
}) => {
    await queueEmail({
        to: client.email,
        templateKey: 'client_job_live',
        variables: {
            contact_name: client.contactName,
            job_title: client.jobTitle,
            job_link: `${CLIENT_URL}/jobs/${client.jobId}`,
        },
    });
};

// --- APPLICATIONS ---

/**
 * Send application shortlisted notification to talent
 */
export const sendTalentApplicationShortlistedEmail = async (application: {
    email: string;
    firstName: string;
    jobTitle: string;
}) => {
    await queueEmail({
        to: application.email,
        toName: application.firstName,
        templateKey: 'talent_application_shortlisted',
        variables: {
            talent_name: application.firstName || 'there',
            job_title: application.jobTitle,
            job_link: `${TALENT_URL}/jobs`,
        },
        priority: 'high',
    });
};

/**
 * Send interview requested notification to talent
 */
export const sendTalentInterviewRequestedEmail = async (talent: {
    email: string;
    firstName: string;
    jobTitle: string;
    clientName: string;
}) => {
    await queueEmail({
        to: talent.email,
        templateKey: 'talent_interview_requested',
        variables: {
            job_title: talent.jobTitle,
            client_name: talent.clientName,
        },
    });
};

// --- CONTRACT TRIGGERS ---

/**
 * Send contract received for review to talent
 */
export const sendTalentContractReceivedEmail = async (contract: {
    email: string;
    firstName: string;
    contractId: string;
}) => {
    await queueEmail({
        to: contract.email,
        toName: contract.firstName,
        templateKey: 'talent_contract_received',
        variables: {
            contract_id: contract.contractId,
            contract_link: `${TALENT_URL}/contracts/${contract.contractId}`,
        },
    });
};

/**
 * Send contract accepted notification to client
 */
export const sendClientContractAcceptedEmail = async (client: {
    email: string;
    contactName: string;
    talentName: string;
    contractId: string;
}) => {
    await queueEmail({
        to: client.email,
        templateKey: 'client_contract_accepted',
        variables: {
            talent_name: client.talentName,
            contract_id: client.contractId,
        },
    });
};

/**
 * Send contract fully signed notification to talent
 */
export const sendTalentContractSignedEmail = async (talent: {
    talentEmail: string;
    talentName: string;
    contractId: string;
    startDate?: string;
}) => {
    await queueEmail({
        to: talent.talentEmail,
        toName: talent.talentName,
        templateKey: 'talent_contract_signed',
        variables: {
            contract_id: talent.contractId,
            start_date: talent.startDate || '',
        },
    });
};

/**
 * Send contract terminated notification to talent
 */
export const sendTalentContractTerminatedEmail = async (contract: {
    email: string;
    firstName: string;
    contractId: string;
    effectiveDate: string;
}) => {
    await queueEmail({
        to: contract.email,
        templateKey: 'talent_contract_terminated',
        variables: {
            contract_id: contract.contractId,
            effective_date: contract.effectiveDate,
        },
    });
};

// --- TIMESHEET TRIGGERS ---

/**
 * Send timesheet reminder to talent
 */
export const sendTimesheetReminderEmail = async (talent: {
    email: string;
    firstName: string;
    periodEnd: string;
}) => {
    await queueEmail({
        to: talent.email,
        templateKey: 'talent_timesheet_reminder',
        variables: {
            period_end: talent.periodEnd,
            submit_link: `${TALENT_URL}/timesheets`,
        },
    });
};

/**
 * Send timesheet approved notification to talent
 */
export const sendTimesheetApprovedEmail = async (talent: {
    email: string;
    firstName: string;
    periodEnd: string;
}) => {
    await queueEmail({
        to: talent.email,
        templateKey: 'talent_timesheet_approved',
        variables: {
            period_end: talent.periodEnd,
        },
    });
};

/**
 * Send timesheet rejected notification to talent
 */
export const sendTimesheetRejectedEmail = async (talent: {
    email: string;
    firstName: string;
    periodEnd: string;
    reason: string;
}) => {
    await queueEmail({
        to: talent.email,
        templateKey: 'talent_timesheet_rejected',
        variables: {
            period_end: talent.periodEnd,
            reason: talent.reason,
        },
    });
};

// --- FINANCIAL TRIGGERS ---

/**
 * Send payment processed notification to talent
 */
export const sendPaymentProcessedEmail = async (payment: {
    email: string;
    amount: string;
    invoiceId: string;
}) => {
    await queueEmail({
        to: payment.email,
        templateKey: 'talent_payment_processed',
        variables: {
            amount: payment.amount,
            invoice_id: payment.invoiceId,
        },
    });
};

/**
 * Send payment receipt to client
 */
export const sendClientPaymentReceiptEmail = async (payment: {
    email: string;
    clientName: string;
    amount: number;
    invoiceNumber: string;
}) => {
    await queueEmail({
        to: payment.email,
        templateKey: 'client_payment_receipt',
        variables: {
            client_name: payment.clientName,
            amount: payment.amount.toString(),
            invoice_number: payment.invoiceNumber,
        },
    });
};

// --- SUPPORT & MESSAGING ---

/**
 * Send new message notification
 */
export const sendNewMessageEmail = async (message: {
    toEmail: string;
    toName: string;
    senderName: string;
    chatLink: string;
    isTalent: boolean;
}) => {
    await queueEmail({
        to: message.toEmail,
        toName: message.toName,
        templateKey: message.isTalent ? 'talent_messaging_new' : 'client_messaging_new',
        variables: {
            sender_name: message.senderName,
            chat_link: message.chatLink,
        },
    });
};

/**
 * Send support ticket created confirmation
 */
export const sendSupportTicketCreatedEmail = async (ticket: {
    email: string;
    ticketId: string;
    isTalent: boolean;
    subject?: string;
    description?: string;
}) => {
    // Notify User
    await queueEmail({
        to: ticket.email,
        templateKey: ticket.isTalent ? 'talent_support_created' : 'client_support_created',
        variables: {
            ticket_id: ticket.ticketId,
        },
    });

    // Notify Admin
    await queueEmail({
        to: 'info@opslyhr.com',
        toName: 'OpslyHR Admin',
        subject: `New Support Ticket: ${ticket.subject || ticket.ticketId}`,
        htmlTemplate: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #0f172a;">New Support Ticket</h2>
            <p>A new support ticket has been created by <strong>${ticket.email}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Ticket ID:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${ticket.ticketId}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Subject:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${ticket.subject || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; vertical-align: top;"><strong>Description:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${ticket.description || 'N/A'}</td></tr>
            </table>
            <div style="margin-top: 20px;">
              <a href="${ADMIN_URL}/support/${ticket.ticketId}" style="display: inline-block; padding: 10px 20px; background-color: #0f172a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">View Ticket</a>
            </div>
          </div>
        `
    });
};

/**
 * Send support team reply notification
 */
export const sendSupportRepliedEmail = async (ticket: {
    email: string;
    ticketId: string;
    isTalent: boolean;
    isAdminReply?: boolean;
    replyContent?: string;
}) => {
    if (ticket.isAdminReply) {
        // Admin replied, notify the user
        await queueEmail({
            to: ticket.email,
            templateKey: ticket.isTalent ? 'talent_support_replied' : 'client_support_replied',
            variables: {
                ticket_id: ticket.ticketId,
                ticket_link: `${ticket.isTalent ? TALENT_URL : CLIENT_URL}/support/${ticket.ticketId}`,
            },
        });
    } else {
        // User replied, notify admin
        await queueEmail({
            to: 'info@opslyhr.com',
            toName: 'OpslyHR Admin',
            subject: `New Reply on Support Ticket: ${ticket.ticketId}`,
            htmlTemplate: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #0f172a;">New Ticket Reply</h2>
                <p>A new reply has been added to ticket <strong>${ticket.ticketId}</strong> by <strong>${ticket.email}</strong>.</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
                   <p style="margin: 0; color: #334155; white-space: pre-wrap;">${ticket.replyContent || 'No content provided.'}</p>
                </div>
                <div style="margin-top: 20px;">
                  <a href="${ADMIN_URL}/support/${ticket.ticketId}" style="display: inline-block; padding: 10px 20px; background-color: #0f172a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">View Ticket</a>
                </div>
              </div>
            `
        });
    }
};

/**
 * Send consultation booked notification
 */
export const sendNewConsultationEmail = async (consultation: {
    name: string;
    email: string;
    company?: string;
    objective?: string;
    date?: string;
    message?: string;
}) => {
    await queueEmail({
        to: 'info@opslyhr.com',
        toName: 'OpslyHR Team',
        subject: `New Consultation Booked: ${consultation.name}`,
        htmlTemplate: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #0f172a;">New Consultation Request</h2>
            <p>A new consultation has been booked on the website.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${consultation.name}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${consultation.email}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Company:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${consultation.company || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Objective:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${consultation.objective || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Preferred Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${consultation.date || 'Flexible'}</td></tr>
            </table>
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
               <p style="margin: 0 0 5px; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Message</p>
               <p style="margin: 0; color: #334155; white-space: pre-wrap;">${consultation.message || 'No additional message.'}</p>
            </div>
            <div style="margin-top: 20px;">
              <a href="${ADMIN_URL}/consultations" style="display: inline-block; padding: 10px 20px; background-color: #0f172a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Admin Portal</a>
            </div>
          </div>
        `
    });
};

// --- ADMIN / UTILITY (Internal) ---

/**
 * Send new vetting submission alert to admin
 */
export const sendAdminVettingSubmissionEmail = async (vetting: {
    adminEmail: string;
    talentName: string;
    talentId: string;
    vettingId: string;
}) => {
    await queueEmail({
        to: vetting.adminEmail,
        templateKey: 'admin_vetting_submission',
        variables: {
            talent_name: vetting.talentName,
            talent_id: vetting.talentId,
            review_link: `${ADMIN_URL}/vetting/${vetting.vettingId}`,
        },
    });
};

/**
 * Send fully signed contract notification to admin
 */
export const sendAdminContractFullySignedEmail = async (contract: {
    adminEmail: string;
    contractId: string;
    clientName: string;
    talentName: string;
}) => {
    await queueEmail({
        to: contract.adminEmail,
        templateKey: 'admin_contract_fully_signed',
        variables: {
            contract_id: contract.contractId,
            client_name: contract.clientName,
            talent_name: contract.talentName,
            contract_link: `${ADMIN_URL}/contracts/${contract.contractId}`,
        },
    });
};

/**
 * Send interview action notification to admin
 */
export const sendAdminInterviewActionEmail = async (data: {
    adminEmail: string;
    talentName: string;
    action: string;
    jobTitle: string;
    details?: string;
    hireRequestId: string;
}) => {
    const htmlTemplate = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #0f172a;">Interview Update</h2>
        <p><strong>Talent:</strong> ${data.talentName}</p>
        <p><strong>Role:</strong> ${data.jobTitle}</p>
        <p><strong>Status:</strong> The talent has <strong>${data.action}</strong> the interview.</p>
        ${data.details ? `<div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-left: 4px solid #f59e0b; border-radius: 4px;"><p style="margin:0; font-size: 14px; color: #475569;"><strong>Details provided by talent:</strong><br/>${data.details.replace(/\n/g, '<br/>')}</p></div>` : ''}
        <p><a href="${ADMIN_URL}/hire-requests/${data.hireRequestId}" style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:white;text-decoration:none;border-radius:5px;margin-top:20px;font-weight:600;">View in Admin Dashboard</a></p>
      </div>
    `;

    await queueEmail({
        to: data.adminEmail,
        subject: `Interview Update: ${data.talentName} ${data.action}`,
        htmlTemplate,
    });
};
/**
 * Send talent offer email
 */
export const sendTalentOfferEmail = async (offer: {
    talentEmail: string;
    talentName: string;
    clientName: string;
    jobTitle: string;
    rate: string;
    startDate: string;
    offerId: string;
}) => {
    await queueEmail({
        to: offer.talentEmail,
        toName: offer.talentName,
        templateKey: 'talent_job_offer',
        variables: {
            talent_name: offer.talentName,
            client_name: offer.clientName,
            job_title: offer.jobTitle,
            rate: offer.rate,
            start_date: offer.startDate,
            offer_link: `${TALENT_URL}/offers/${offer.offerId}`,
        },
    });
};

/**
 * Send client contract ready email
 */
export const sendClientContractReadyEmail = async (contract: {
    clientEmail: string;
    clientName: string;
    talentName: string;
    jobTitle: string;
    contractId: string;
}) => {
    await queueEmail({
        to: contract.clientEmail,
        toName: contract.clientName,
        templateKey: 'client_contract_ready',
        variables: {
            client_name: contract.clientName,
            talent_name: contract.talentName,
            job_title: contract.jobTitle,
            contract_link: `${CLIENT_URL}/contracts`,
        },
    });
};

/**
 * Send client contract signed notification
 */
export const sendClientContractSignedEmail = async (contract: {
    clientEmail: string;
    clientName: string;
    talentName: string;
    contractId: string;
}) => {
    await queueEmail({
        to: contract.clientEmail,
        toName: contract.clientName,
        templateKey: 'client_contract_signed',
        variables: {
            client_name: contract.clientName,
            talent_name: contract.talentName,
            contract_id: contract.contractId,
        },
    });
};

/**
 * Send invoice generated email to client
 */
export const sendClientInvoiceGeneratedEmail = async (invoice: {
    clientEmail: string;
    clientName: string;
    invoiceId: string;
    amount: string;
    dueDate: string;
}) => {
    await queueEmail({
        to: invoice.clientEmail,
        toName: invoice.clientName,
        templateKey: 'client_invoice_generated',
        variables: {
            client_name: invoice.clientName,
            invoice_id: invoice.invoiceId,
            amount: invoice.amount,
            due_date: invoice.dueDate,
            invoice_link: `${CLIENT_URL}/invoices/${invoice.invoiceId}`,
        },
    });
};

export async function sendTalentInterviewInvitationEmail(params: {
  talentUserId: string;
  hireRequestId: string;
  interviewId: string;
  meetingLink: string;
  scheduledTime: string;
  notes?: string;
}) {
  try {
    const { data: talentUser, error: talentError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('user_id', params.talentUserId)
      .single();

    if (talentError || !talentUser || !talentUser.email) {
      console.error('Error fetching talent profile for interview email:', talentError);
      return;
    }

    const { data: request, error: reqError } = await supabase
      .from('hr_v2_hire_requests')
      .select('title, client_org_id, client_user_id')
      .eq('id', params.hireRequestId)
      .single();

    if (reqError || !request) {
      console.error('Error fetching request for interview email:', reqError);
      return;
    }

    // Attempt to get company name
    let companyName = "A Partner Company";
    if (request.client_org_id) {
        const { data: org } = await supabase.from('client_organizations').select('name').eq('id', request.client_org_id).single();
        if (org && org.name) companyName = org.name;
    } else {
        const { data: client } = await supabase.from('clients').select('company_name').eq('user_id', request.client_user_id).single();
        if (client && client.company_name) companyName = client.company_name;
    }

    const loginLink = "https://app.opslyhr.com/talent/interviews?tab=pending";
    
    // Construct HTML template inline just like the others
    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Interview Scheduled: ${request.title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
        style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0f172a;padding:28px 40px;text-align:center;">
            <img src="https://app.opslyhr.com/images/logoplain.png" alt="OpslyHR" style="height:36px;" />
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 28px;">
            <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#0f172a;">Hi ${talentUser.first_name}, an interview has been scheduled!</h1>
            <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">
              <strong>${companyName}</strong> has scheduled an interview with you for the <strong>${request.title}</strong> role.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#0f172a;font-weight:600;background:#f8fafc;padding:12px 16px;border-left:4px solid #2563eb;border-radius:4px;">
              Important: You must log in to your dashboard and navigate to the <strong style="color:#2563eb;">Requests</strong> tab on the Interviews page to formally Accept this interview invitation.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
              <tr><td style="padding:22px 26px;">
                <p style="margin:0 0 10px;"><strong>Date & Time:</strong> ${new Date(params.scheduledTime).toLocaleString()}</p>
                <p style="margin:0 0 10px;"><strong>Meeting Link:</strong> <a href="${params.meetingLink}" style="color:#2563eb;">${params.meetingLink}</a></p>
                ${params.notes ? `<p style="margin:0;"><strong>Notes:</strong><br/>${params.notes.replace(/\\n/g, '<br/>')}</p>` : ''}
              </td></tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="border-radius:10px;background:#0f172a;">
                  <a href="${loginLink}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Go to Requests Tab</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await queueEmail({
      to: talentUser.email,
      subject: `Interview Scheduled: ${request.title}`,
      htmlTemplate: htmlBody
    });
  } catch (err) {
    console.error("Error triggering interview invitation email:", err);
  }
}
