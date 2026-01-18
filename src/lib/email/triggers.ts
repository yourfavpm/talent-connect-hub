// Email Trigger Helper Functions
// Centralized functions to trigger emails for various events

import { queueEmail } from './emailService';

const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.taskive.com';

/**
 * Send welcome email to new talent
 */
export const sendTalentWelcomeEmail = async (talent: {
    email: string;
    firstName: string;
    talentId: string;
}) => {
    await queueEmail({
        to: talent.email,
        toName: talent.firstName,
        templateKey: 'talent_welcome',
        variables: {
            talent_name: talent.firstName,
            talent_id: talent.talentId,
            login_link: `${APP_URL}/login`,
        },
    });
};

/**
 * Send welcome email to new client
 */
export const sendClientWelcomeEmail = async (client: {
    email: string;
    contactName: string;
    companyName: string;
}) => {
    await queueEmail({
        to: client.email,
        toName: client.contactName,
        templateKey: 'client_welcome',
        variables: {
            client_name: client.contactName,
            company_name: client.companyName,
            login_link: `${APP_URL}/login`,
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
 * Send contract offer to talent
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
        templateKey: 'talent_offer_received',
        variables: {
            talent_name: offer.talentName,
            job_title: offer.jobTitle,
            client_name: offer.clientName,
            rate: offer.rate,
            start_date: offer.startDate,
            offer_link: `${APP_URL}/talent/offers/${offer.offerId}`,
        },
    });
};

/**
 * Send contract ready email to client
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
            contract_link: `${APP_URL}/client/contracts/${contract.contractId}`,
        },
    });
};

/**
 * Send contract signed confirmation to talent
 */
export const sendTalentContractSignedEmail = async (contract: {
    talentEmail: string;
    talentName: string;
    contractId: string;
    startDate: string;
}) => {
    await queueEmail({
        to: contract.talentEmail,
        toName: contract.talentName,
        templateKey: 'talent_contract_signed',
        variables: {
            talent_name: contract.talentName,
            contract_id: contract.contractId,
            start_date: contract.startDate,
            contract_link: `${APP_URL}/talent/contracts/${contract.contractId}`,
        },
    });
};

/**
 * Send contract signed confirmation to client
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
            contract_link: `${APP_URL}/client/contracts/${contract.contractId}`,
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

/**
 * Send invoice overdue alert to admin
 */
export const sendAdminInvoiceOverdueEmail = async (invoice: {
    adminEmail: string;
    invoiceId: string;
    clientName: string;
    amount: string;
    daysOverdue: number;
}) => {
    await queueEmail({
        to: invoice.adminEmail,
        templateKey: 'admin_invoice_overdue',
        variables: {
            invoice_id: invoice.invoiceId,
            client_name: invoice.clientName,
            amount: invoice.amount,
            days_overdue: invoice.daysOverdue.toString(),
            invoice_link: `${APP_URL}/admin/invoices/${invoice.invoiceId}`,
        },
    });
};

/**
 * Send payment received confirmation to client
 */
export const sendClientPaymentReceivedEmail = async (payment: {
    clientEmail: string;
    clientName: string;
    amount: string;
    invoiceId: string;
}) => {
    await queueEmail({
        to: payment.clientEmail,
        toName: payment.clientName,
        templateKey: 'client_payment_received',
        variables: {
            client_name: payment.clientName,
            amount: payment.amount,
            invoice_id: payment.invoiceId,
        },
    });
};

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
