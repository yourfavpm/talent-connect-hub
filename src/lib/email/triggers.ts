// Email Trigger Helper Functions
// Centralized functions to trigger emails for various events

import { queueEmail, requestVerificationEmail } from './emailService';

const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.opslyhr.com';

// --- AUTH & ACCOUNT TRIGGERS ---

/**
 * Send talent verification required email (Secure Custom Flow)
 */
export const requestTalentVerification = async (userId: string, email: string, firstName: string) => {
    return await requestVerificationEmail(userId, email, firstName);
};

/**
 * Send client verification required email (Secure Custom Flow)
 */
export const requestClientVerification = async (userId: string, email: string, contactName: string) => {
    return await requestVerificationEmail(userId, email, contactName);
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
            dashboard_link: `${APP_URL}/talent/dashboard`,
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
            reset_link: redirectTo || `${APP_URL}/auth/update-password?portal=talent`,
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
            reset_link: redirectTo || `${APP_URL}/auth/update-password?portal=client`,
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
            dashboard_link: `${APP_URL}/client/dashboard`,
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
            profile_link: `${APP_URL}/talent/onboarding`,
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
            dashboard_link: `${APP_URL}/client/dashboard`,
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
            vetting_link: `${APP_URL}/talent/vetting`,
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
            jobs_link: `${APP_URL}/talent/jobs`,
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
            resubmit_link: `${APP_URL}/talent/vetting`,
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
            job_link: `${APP_URL}/talent/jobs/${talent.jobId}`,
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
            job_link: `${APP_URL}/talent/jobs/${invitation.jobId}`,
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
            job_link: `${APP_URL}/talent/jobs/${talent.jobId}`,
        },
    });
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
            job_link: `${APP_URL}/client/jobs/${client.jobId}`,
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
        templateKey: 'talent_application_shortlisted',
        variables: {
            job_title: application.jobTitle,
        },
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
            contract_link: `${APP_URL}/talent/contracts/${contract.contractId}`,
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
            submit_link: `${APP_URL}/talent/timesheets`,
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
}) => {
    await queueEmail({
        to: ticket.email,
        templateKey: ticket.isTalent ? 'talent_support_created' : 'client_support_created',
        variables: {
            ticket_id: ticket.ticketId,
        },
    });
};

/**
 * Send support team reply notification
 */
export const sendSupportRepliedEmail = async (ticket: {
    email: string;
    ticketId: string;
    isTalent: boolean;
}) => {
    await queueEmail({
        to: ticket.email,
        templateKey: ticket.isTalent ? 'talent_support_replied' : 'client_support_replied',
        variables: {
            ticket_id: ticket.ticketId,
            ticket_link: `${APP_URL}/${ticket.isTalent ? 'talent' : 'client'}/support/${ticket.ticketId}`,
        },
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
            review_link: `${APP_URL}/admin/vetting/${vetting.vettingId}`,
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
            contract_link: `${APP_URL}/admin/contracts/${contract.contractId}`,
        },
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
            offer_link: `${APP_URL}/talent/offers/${offer.offerId}`,
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
            contract_link: `${APP_URL}/client/contracts`,
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
            invoice_link: `${APP_URL}/client/invoices/${invoice.invoiceId}`,
        },
    });
};
