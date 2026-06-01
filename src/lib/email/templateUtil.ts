/**
 * Email Template Utilities
 * 
 * Helper functions for loading, validating, and rendering email templates
 * from the email-templates directory.
 */

import fs from 'fs';
import path from 'path';

/**
 * Get the email templates directory path
 * Works in both development and production builds
 */
function getTemplatesDir(): string {
  // Try multiple possible paths for robustness
  const possiblePaths = [
    // For npm test and vite dev server
    path.join(process.cwd(), 'email-templates'),
    // For built app
    path.join(__dirname, '../../../../email-templates'),
    // Fallback
    path.join(__dirname, '../../..', 'email-templates'),
  ];

  for (const dir of possiblePaths) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  // If none found, return the most likely path
  return path.join(process.cwd(), 'email-templates');
}

const TEMPLATES_DIR = getTemplatesDir();

/**
 * Available email templates
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

/**
 * Talent onboarding email variables
 */
export interface TalentOnboardingVariables {
  FIRST_NAME: string;
  DASHBOARD_LINK: string;
}

/**
 * Talent job offer email variables
 */
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

/**
 * Talent job published email variables
 */
export interface TalentJobPublishedVariables {
  FIRST_NAME: string;
  ROLE_TITLE: string;
  BUDGET: string;
  EMPLOYMENT_TYPE: string;
  LOCATION: string;
  JOB_LINK: string;
}

/**
 * Talent contract review email variables
 */
export interface TalentContractReviewVariables {
  FIRST_NAME: string;
  CLIENT_NAME: string;
  JOB_TITLE: string;
  CONTRACT_ID: string;
  START_DATE: string;
  CONTRACT_LINK: string;
}

/**
 * Client onboarding email variables
 */
export interface ClientOnboardingVariables {
  COMPANY_NAME: string;
  DASHBOARD_LINK: string;
}

/**
 * Client contract signed email variables
 */
export interface ClientContractSignedVariables {
  COMPANY_NAME: string;
  PROFESSIONAL_NAME: string;
  START_DATE: string;
  JOB_TITLE: string;
  RATE: string;
  FIRST_PAYMENT_DATE: string;
  EMPLOYEE_LINK: string;
}

/**
 * Client invoice email variables
 */
export interface ClientInvoiceVariables {
  PROFESSIONAL_NAME: string;
  PERIOD: string;
  INVOICE_ID: string;
  HOURS: string;
  AMOUNT: string;
  PAYMENT_STATUS: string;
  INVOICE_LINK: string;
}

/**
 * Password reset email variables
 */
export interface PasswordResetVariables {
  RESET_LINK: string;
}

/**
 * Email verification email variables
 */
export interface EmailVerificationVariables {
  VERIFICATION_LINK: string;
}

/**
 * Load email template from file
 * @param template - Template name (enum)
 * @returns Template HTML content
 * @throws Error if template not found
 */
export function loadTemplate(template: EmailTemplate): string {
  try {
    const templatePath = path.join(TEMPLATES_DIR, template);
    return fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load template "${template}": ${error}`);
  }
}

/**
 * Replace template variables with actual values
 * @param template - Template HTML string
 * @param variables - Object with variable values
 * @returns Rendered HTML with variables substituted
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | boolean>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const stringValue = String(value || '');
    result = result.replaceAll(placeholder, stringValue);
  }
  
  return result;
}

/**
 * Validate that all required variables are provided
 * @param template - Template HTML string
 * @param providedVariables - Keys of provided variables
 * @returns Validation result with missing variables
 */
export function validateTemplateVariables(
  template: string,
  providedVariables: string[]
): { valid: boolean; missing: string[] } {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const required = Array.from(template.matchAll(variableRegex), m => m[1]);
  const provided = new Set(providedVariables);
  
  const missing = required.filter(v => !provided.has(v));
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Load and render template in one step
 * @param template - Template name (enum)
 * @param variables - Variable values
 * @returns Rendered HTML
 */
export function loadAndRender(
  template: EmailTemplate,
  variables: Record<string, string | number | boolean>
): string {
  const html = loadTemplate(template);
  const validation = validateTemplateVariables(html, Object.keys(variables));
  
  if (!validation.valid) {
    console.warn(`Missing template variables: ${validation.missing.join(', ')}`);
  }
  
  return renderTemplate(html, variables);
}

/**
 * Extract all variable names from a template
 * @param template - Template HTML string
 * @returns Array of variable names
 */
export function extractVariables(template: string): string[] {
  const variableRegex = /\{\{(\w+)\}\}/g;
  return Array.from(template.matchAll(variableRegex), m => m[1]);
}

/**
 * Get required variables for a specific template type
 * @param template - Template name (enum)
 * @returns Array of required variable names
 */
export function getRequiredVariables(template: EmailTemplate): string[] {
  const html = loadTemplate(template);
  return extractVariables(html);
}

/**
 * Create a template data object with all variables
 * Useful for IDE autocomplete
 */
export function createTemplateData<T extends Record<string, string>>(
  data: T
): T {
  return data;
}

// Type-safe helper for specific templates

export function getTalentOnboardingTemplate(
  variables: TalentOnboardingVariables
): string {
  return loadAndRender(EmailTemplate.TALENT_ONBOARDING_WELCOME, variables);
}

export function getTalentJobOfferTemplate(
  variables: TalentJobOfferVariables
): string {
  return loadAndRender(EmailTemplate.TALENT_JOB_OFFER, variables);
}

export function getTalentContractReviewTemplate(
  variables: TalentContractReviewVariables
): string {
  return loadAndRender(EmailTemplate.TALENT_CONTRACT_REVIEW, variables);
}

export function getTalentJobPublishedTemplate(
  variables: TalentJobPublishedVariables
): string {
  return loadAndRender(EmailTemplate.TALENT_JOB_PUBLISHED, variables);
}

export function getClientOnboardingTemplate(
  variables: ClientOnboardingVariables
): string {
  return loadAndRender(EmailTemplate.CLIENT_ONBOARDING_WELCOME, variables);
}

export function getClientContractSignedTemplate(
  variables: ClientContractSignedVariables
): string {
  return loadAndRender(EmailTemplate.CLIENT_CONTRACT_SIGNED, variables);
}

export function getClientInvoiceTemplate(
  variables: ClientInvoiceVariables
): string {
  return loadAndRender(EmailTemplate.CLIENT_INVOICE_GENERATED, variables);
}

export function getPasswordResetTemplate(
  variables: PasswordResetVariables
): string {
  return loadAndRender(EmailTemplate.PASSWORD_RESET, variables);
}

export function getEmailVerificationTemplate(
  variables: EmailVerificationVariables
): string {
  return loadAndRender(EmailTemplate.EMAIL_VERIFICATION, variables);
}
