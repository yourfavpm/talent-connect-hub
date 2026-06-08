/**
 * Email Template Usage Examples
 * 
 * This file demonstrates how to use the new branded HTML email templates
 * with the existing email service and triggers.
 */

import { queueEmail } from './emailService';
import {
  EmailTemplate,
  getTalentOnboardingTemplate,
  getTalentJobOfferTemplate,
  getTalentContractReviewTemplate,
  getClientOnboardingTemplate,
  getClientContractSignedTemplate,
  getClientInvoiceTemplate,
  getPasswordResetTemplate,
  getEmailVerificationTemplate,
  loadAndRender,
  TalentOnboardingVariables,
  TalentJobOfferVariables,
} from './templateUtil';

/**
 * Example 1: Send talent onboarding email with new template
 * 
 * Replace this in src/lib/email/triggers.ts:
 * export async function sendTalentWelcomeEmail(...)
 */
export async function sendTalentWelcomeEmailExample(
  email: string,
  talentId: string,
  firstName: string,
  lastNameInitial: string
): Promise<void> {
  const dashboardLink = `https://app.opslyhr.com/onboarding?token=${talentId}`;

  const html = getTalentOnboardingTemplate({
    FIRST_NAME: firstName,
    DASHBOARD_LINK: dashboardLink,
  });

  await queueEmail({
    to: email,
    subject: `Welcome to OpslyHR, ${firstName}!`,
    htmlTemplate: html,
    templateName: 'talent_onboarding_welcome',
    templateVariables: {
      talent_name: `${firstName} ${lastNameInitial}.`,
      dashboard_link: dashboardLink,
    },
    metadata: {
      type: 'welcome',
      recipient_type: 'talent',
      talent_id: talentId,
    },
  });
}

/**
 * Example 2: Send job offer email with new template
 */
export async function sendTalentJobOfferEmailExample(
  email: string,
  talentId: string,
  clientName: string,
  jobTitle: string,
  rate: string,
  location: string,
  contractType: string,
  duration: string,
  expirationDate: string,
  jobId: string
): Promise<void> {
  const applyLink = `https://app.opslyhr.com/opportunities/${jobId}?action=apply`;

  const html = getTalentJobOfferTemplate({
    CLIENT_NAME: clientName,
    JOB_TITLE: jobTitle,
    CONTRACT_TYPE: contractType,
    RATE: rate,
    LOCATION: location,
    DURATION: duration,
    EXPIRATION_DATE: expirationDate,
    APPLY_LINK: applyLink,
  });

  await queueEmail({
    to: email,
    subject: `New Opportunity: ${jobTitle} at ${clientName}`,
    htmlTemplate: html,
    templateName: 'talent_job_offer',
    templateVariables: {
      client_name: clientName,
      job_title: jobTitle,
      rate: rate,
      location: location,
      duration: duration,
      expiration_date: expirationDate,
      apply_link: applyLink,
    },
    metadata: {
      type: 'job_offer',
      recipient_type: 'talent',
      talent_id: talentId,
      job_id: jobId,
    },
  });
}

/**
 * Example 3: Send contract review email with new template
 */
export async function sendTalentContractReviewEmailExample(
  email: string,
  talentId: string,
  firstName: string,
  clientName: string,
  jobTitle: string,
  contractId: string,
  startDate: string
): Promise<void> {
  const contractLink = `https://app.opslyhr.com/contracts/${contractId}`;

  const html = getTalentContractReviewTemplate({
    FIRST_NAME: firstName,
    CLIENT_NAME: clientName,
    JOB_TITLE: jobTitle,
    CONTRACT_ID: contractId,
    START_DATE: startDate,
    CONTRACT_LINK: contractLink,
  });

  await queueEmail({
    to: email,
    subject: `Contract Ready for Review: ${jobTitle}`,
    htmlTemplate: html,
    templateName: 'talent_contract_signed',
    templateVariables: {
      talent_name: firstName,
      client_name: clientName,
      job_title: jobTitle,
      contract_id: contractId,
      start_date: startDate,
      contract_link: contractLink,
    },
    metadata: {
      type: 'contract_review',
      recipient_type: 'talent',
      talent_id: talentId,
      contract_id: contractId,
    },
  });
}

/**
 * Example 4: Send client onboarding email with new template
 */
export async function sendClientWelcomeEmailExample(
  email: string,
  clientId: string,
  companyName: string
): Promise<void> {
  const dashboardLink = `https://app.opslyhr.com/dashboard?token=${clientId}`;

  const html = getClientOnboardingTemplate({
    COMPANY_NAME: companyName,
    DASHBOARD_LINK: dashboardLink,
  });

  await queueEmail({
    to: email,
    subject: `Welcome to OpslyHR, ${companyName}!`,
    htmlTemplate: html,
    templateName: 'client_onboarding_welcome',
    templateVariables: {
      client_name: companyName,
      dashboard_link: dashboardLink,
    },
    metadata: {
      type: 'welcome',
      recipient_type: 'client',
      client_id: clientId,
    },
  });
}

/**
 * Example 5: Send contract signed email to client
 */
export async function sendClientContractSignedEmailExample(
  email: string,
  clientId: string,
  companyName: string,
  professionalName: string,
  startDate: string,
  jobTitle: string,
  rate: string,
  firstPaymentDate: string,
  contractId: string
): Promise<void> {
  const employeeLink = `https://app.opslyhr.com/employees/${contractId}`;

  const html = getClientContractSignedTemplate({
    COMPANY_NAME: companyName,
    PROFESSIONAL_NAME: professionalName,
    START_DATE: startDate,
    JOB_TITLE: jobTitle,
    RATE: rate,
    FIRST_PAYMENT_DATE: firstPaymentDate,
    EMPLOYEE_LINK: employeeLink,
  });

  await queueEmail({
    to: email,
    subject: `Contract Signed: ${professionalName} - ${jobTitle}`,
    htmlTemplate: html,
    templateName: 'client_contract_signed',
    templateVariables: {
      client_name: companyName,
      professional_name: professionalName,
      start_date: startDate,
      job_title: jobTitle,
      rate: rate,
      first_payment_date: firstPaymentDate,
      employee_link: employeeLink,
    },
    metadata: {
      type: 'contract_signed',
      recipient_type: 'client',
      client_id: clientId,
      contract_id: contractId,
    },
  });
}

/**
 * Example 6: Send invoice email to client
 */
export async function sendClientInvoiceGeneratedEmailExample(
  email: string,
  clientId: string,
  professionalName: string,
  invoicePeriod: string,
  invoiceId: string,
  hours: string,
  amount: string,
  paymentStatus: string,
  contractId: string
): Promise<void> {
  const invoiceLink = `https://app.opslyhr.com/invoices/${invoiceId}`;

  const html = getClientInvoiceTemplate({
    PROFESSIONAL_NAME: professionalName,
    PERIOD: invoicePeriod,
    INVOICE_ID: invoiceId,
    HOURS: hours,
    AMOUNT: amount,
    PAYMENT_STATUS: paymentStatus,
    INVOICE_LINK: invoiceLink,
  });

  await queueEmail({
    to: email,
    subject: `Invoice Generated: ${invoiceId} - ${invoicePeriod}`,
    htmlTemplate: html,
    templateName: 'client_invoice_generated',
    templateVariables: {
      professional_name: professionalName,
      period: invoicePeriod,
      invoice_id: invoiceId,
      hours: hours,
      amount: amount,
      payment_status: paymentStatus,
      invoice_link: invoiceLink,
    },
    metadata: {
      type: 'invoice',
      recipient_type: 'client',
      client_id: clientId,
      invoice_id: invoiceId,
    },
  });
}

/**
 * Example 7: Send password reset email
 */
export async function sendPasswordResetEmailExample(
  email: string,
  userId: string,
  resetToken: string
): Promise<void> {
  const resetLink = `https://app.opslyhr.com/reset-password?token=${resetToken}`;

  const html = getPasswordResetTemplate({
    RESET_LINK: resetLink,
  });

  await queueEmail({
    to: email,
    subject: 'Reset Your OpslyHR Password',
    htmlTemplate: html,
    templateName: 'password_reset',
    templateVariables: {
      reset_link: resetLink,
    },
    metadata: {
      type: 'password_reset',
      user_id: userId,
    },
  });
}

/**
 * Example 8: Send email verification email
 */
export async function sendEmailVerificationEmailExample(
  email: string,
  userId: string,
  verificationToken: string
): Promise<void> {
  const verificationLink = `https://app.opslyhr.com/verify-email?token=${verificationToken}`;

  const html = getEmailVerificationTemplate({
    VERIFICATION_LINK: verificationLink,
  });

  await queueEmail({
    to: email,
    subject: 'Verify Your Email Address',
    htmlTemplate: html,
    templateName: 'email_verification',
    templateVariables: {
      verification_link: verificationLink,
    },
    metadata: {
      type: 'email_verification',
      user_id: userId,
    },
  });
}

/**
 * Example 9: Manual template loading (raw method)
 * Use this if you need more control over the process
 */
export async function sendCustomEmailExample(
  email: string,
  templateName: EmailTemplate,
  variables: Record<string, string | number | boolean>,
  subject: string
): Promise<void> {
  const html = loadAndRender(templateName, variables);

  await queueEmail({
    to: email,
    subject: subject,
    htmlTemplate: html,
    templateName: templateName.replace('.html', ''),
    templateVariables: variables as Record<string, string>,
    metadata: {
      type: 'custom',
    },
  });
}

/**
 * Migration Guide: Updating triggers.ts
 * 
 * Current implementation uses plain text templates:
 * 
 *   export async function sendTalentWelcomeEmail(email: string, ...) {
 *     await queueEmail({
 *       to: email,
 *       subject: 'Welcome!',
 *       templateName: 'talent_onboarding_welcome',
 *       templateVariables: { talent_name: name },
 *     });
 *   }
 * 
 * New implementation uses branded HTML templates:
 * 
 *   export async function sendTalentWelcomeEmail(email: string, ...) {
 *     const html = getTalentOnboardingTemplate({
 *       FIRST_NAME: firstName,
 *       DASHBOARD_LINK: dashboardLink,
 *     });
 *
 *     await queueEmail({
 *       to: email,
 *       subject: 'Welcome!',
 *       htmlTemplate: html,  // Pass rendered HTML
 *       templateName: 'talent_onboarding_welcome',
 *       templateVariables: { talent_name: name },
 *     });
 *   }
 * 
 * Benefits:
 * ✓ Professional branded emails
 * ✓ Responsive design (mobile-friendly)
 * ✓ Type-safe template variables
 * ✓ Easy variable validation
 * ✓ Gradual migration (old template system still works)
 * ✓ IDE autocomplete for variables
 */
