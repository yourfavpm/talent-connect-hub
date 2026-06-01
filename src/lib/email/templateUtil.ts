/**
 * Email Template Utilities
 *
 * Browser-safe helper functions for rendering email templates.
 * Template loading from the filesystem is handled server-side (Edge Functions only).
 * Do NOT import 'fs' or 'path' here — this file runs in the browser.
 */

/**
 * Available email template keys (for reference / type-safety)
 */
export enum EmailTemplate {
  // Talent emails
  TALENT_ONBOARDING_WELCOME = 'talent-onboarding-welcome.html',
  TALENT_JOB_OFFER = 'talent-job-offer.html',
  TALENT_CONTRACT_REVIEW = 'talent-contract-review.html',
  TALENT_JOB_PUBLISHED = 'talent-job-published.html',

  // Client emails
  CLIENT_ONBOARDING_WELCOME = 'client-onboarding-welcome.html',
  CLIENT_CONTRACT_SIGNED = 'client-contract-signed.html',
  CLIENT_INVOICE_GENERATED = 'client-invoice-generated.html',

  // Auth emails
  PASSWORD_RESET = 'password-reset.html',
  EMAIL_VERIFICATION = 'email-verification.html',
}

// ── Variable interfaces (kept for type-safety in triggers) ───────────────────

export interface TalentOnboardingVariables {
  FIRST_NAME: string;
  DASHBOARD_LINK: string;
}

export interface TalentJobOfferVariables {
  CLIENT_NAME: string;
  JOB_TITLE: string;
  CONTRACT_TYPE: string;
  RATE: string;
  LOCATION: string;
  DURATION: string;
  EXPIRATION_DATE: string;
  APPLY_LINK: string;
}

export interface TalentJobPublishedVariables {
  FIRST_NAME: string;
  ROLE_TITLE: string;
  BUDGET: string;
  EMPLOYMENT_TYPE: string;
  LOCATION: string;
  JOB_LINK: string;
}

export interface TalentContractReviewVariables {
  FIRST_NAME: string;
  CLIENT_NAME: string;
  JOB_TITLE: string;
  CONTRACT_ID: string;
  START_DATE: string;
  CONTRACT_LINK: string;
}

export interface ClientOnboardingVariables {
  COMPANY_NAME: string;
  DASHBOARD_LINK: string;
}

export interface ClientContractSignedVariables {
  COMPANY_NAME: string;
  PROFESSIONAL_NAME: string;
  START_DATE: string;
  JOB_TITLE: string;
  RATE: string;
  FIRST_PAYMENT_DATE: string;
  EMPLOYEE_LINK: string;
}

export interface ClientInvoiceVariables {
  PROFESSIONAL_NAME: string;
  PERIOD: string;
  INVOICE_ID: string;
  HOURS: string;
  AMOUNT: string;
  PAYMENT_STATUS: string;
  INVOICE_LINK: string;
}

export interface PasswordResetVariables {
  RESET_LINK: string;
}

export interface EmailVerificationVariables {
  VERIFICATION_LINK: string;
}

// ── Pure browser-safe utilities ──────────────────────────────────────────────

/**
 * Replace {{VARIABLE}} placeholders in an HTML string with actual values.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | boolean>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const stringValue = String(value ?? '');
    result = result.split(placeholder).join(stringValue);
  }
  return result;
}

/**
 * Validate that all required {{VARIABLE}} placeholders have been provided.
 */
export function validateTemplateVariables(
  template: string,
  providedVariables: string[]
): { valid: boolean; missing: string[] } {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const required = Array.from(template.matchAll(variableRegex), (m) => m[1]);
  const provided = new Set(providedVariables);
  const missing = required.filter((v) => !provided.has(v));
  return { valid: missing.length === 0, missing };
}

/**
 * Extract all {{VARIABLE}} names from a template string.
 */
export function extractVariables(template: string): string[] {
  const variableRegex = /\{\{(\w+)\}\}/g;
  return Array.from(template.matchAll(variableRegex), (m) => m[1]);
}

/**
 * Identity helper — useful for IDE autocomplete when constructing template data objects.
 */
export function createTemplateData<T extends Record<string, string>>(data: T): T {
  return data;
}
