// Email Template Definitions
// This file contains all 39 email templates for easy management

export interface EmailTemplateData {
    key: string;
    name: string;
    subject: string;
    bodyHtml: string;
    bodyText: string;
    variables: string[];
}

export const emailTemplates: EmailTemplateData[] = [
    // TALENT PORTAL TEMPLATES (16)
    {
        key: 'talent_job_published',
        name: 'Talent Job Published Alert',
        subject: 'New Hiring Opportunity: {{job_title}}',
        bodyHtml: `
      <h1>New Hiring Opportunity!</h1>
      <p>A new hiring opportunity has been published: <strong>{{job_title}}</strong>.</p>
      <p><a href="{{job_link}}" style="background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">View Opportunity</a></p>
      <p>Best regards,<br>The OPSlyHR Team</p>
    `,
        bodyText: `New Hiring Opportunity!
        
A new hiring opportunity has been published: {{job_title}}.

View Opportunity: {{job_link}}

Best regards,
The OPSlyHR Team`,
        variables: ['job_title', 'job_link']
    },
    {
        key: 'talent_welcome',
        name: 'Talent Welcome Email',
        subject: 'Welcome to OPSlyHR - Your Talent ID: {{talent_id}}',
        bodyHtml: `
      <h1>Welcome to OPSlyHR, {{talent_name}}!</h1>
      <p>We're excited to have you join our platform of top-tier professionals.</p>
      <p><strong>Your Talent ID:</strong> {{talent_id}}</p>
      <h2>Next Steps:</h2>
      <ol>
        <li>Complete your profile</li>
        <li>Get vetted to access exclusive opportunities</li>
        <li>Browse available positions</li>
      </ol>
      <p><a href="{{login_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Login to Your Account</a></p>
      <p>Best regards,<br>The OPSlyHR Team</p>
    `,
        bodyText: `Welcome to OPSlyHR, {{talent_name}}!

We're excited to have you join our platform of top-tier professionals.

Your Talent ID: {{talent_id}}

Next Steps:
1. Complete your profile
2. Get vetted to access exclusive opportunities
3. Browse available positions

Login to Your Account: {{login_link}}

Best regards,
The OPSlyHR Team`,
        variables: ['talent_name', 'talent_id', 'login_link']
    },

    {
        key: 'talent_offer_received',
        name: 'Talent Offer Received',
        subject: 'New Contract Offer from {{client_name}}',
        bodyHtml: `
      <h1>Congratulations, {{talent_name}}!</h1>
      <p>You've received a contract offer for the position of <strong>{{job_title}}</strong> from {{client_name}}.</p>
      <h2>Offer Details:</h2>
      <ul>
        <li><strong>Position:</strong> {{job_title}}</li>
        <li><strong>Client:</strong> {{client_name}}</li>
        <li><strong>Rate:</strong> {{rate}}</li>
        <li><strong>Start Date:</strong> {{start_date}}</li>
      </ul>
      <p><a href="{{offer_link}}" style="background:#28a745;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">View Offer</a></p>
      <p>Best regards,<br>The OPSlyHR Team</p>
    `,
        bodyText: `Congratulations, {{talent_name}}!

You've received a contract offer for the position of {{job_title}} from {{client_name}}.

Offer Details:
- Position: {{job_title}}
- Client: {{client_name}}
- Rate: {{rate}}
- Start Date: {{start_date}}

View Offer: {{offer_link}}

Best regards,
The OPSlyHR Team`,
        variables: ['talent_name', 'job_title', 'client_name', 'rate', 'start_date', 'offer_link']
    },

    {
        key: 'talent_contract_signed',
        name: 'Talent Contract Signed Confirmation',
        subject: 'Contract Signed Successfully - {{contract_id}}',
        bodyHtml: `
      <h1>Contract Signed, {{talent_name}}!</h1>
      <p>Your contract has been signed successfully.</p>
      <p><strong>Contract ID:</strong> {{contract_id}}<br>
      <strong>Start Date:</strong> {{start_date}}</p>
      <p>We'll notify you once the client signs as well. You can view your contract anytime in your dashboard.</p>
      <p><a href="{{contract_link}}">View Contract</a></p>
      <p>Best regards,<br>The OPSlyHR Team</p>
    `,
        bodyText: `Contract Signed, {{talent_name}}!

Your contract has been signed successfully.

Contract ID: {{contract_id}}
Start Date: {{start_date}}

We'll notify you once the client signs as well. You can view your contract anytime in your dashboard.

View Contract: {{contract_link}}

Best regards,
The OPSlyHR Team`,
        variables: ['talent_name', 'contract_id', 'start_date', 'contract_link']
    },

    // CLIENT PORTAL TEMPLATES (13)
    {
        key: 'client_welcome',
        name: 'Client Welcome Email',
        subject: 'Welcome to OPSlyHR - Let\'s Find Your Perfect Talent',
        bodyHtml: `
      <h1>Welcome to OPSlyHR, {{client_name}}!</h1>
      <p>Thank you for choosing OPSlyHR to build your team with top-tier professionals.</p>
      <p><strong>Company:</strong> {{company_name}}</p>
      <h2>Get Started:</h2>
      <ol>
        <li>Post your first job or hire request</li>
        <li>Review vetted talent profiles</li>
        <li>Schedule interviews with candidates</li>
      </ol>
      <p><a href="{{login_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Access Your Dashboard</a></p>
      <p>Best regards,<br>The OPSlyHR Team</p>
    `,
        bodyText: `Welcome to OPSlyHR, {{client_name}}!

Thank you for choosing OPSlyHR to build your team with top-tier professionals.

Company: {{company_name}}

Get Started:
1. Post your first job or hire request
2. Review vetted talent profiles
3. Schedule interviews with candidates

Access Your Dashboard: {{login_link}}

Best regards,
The OPSlyHR Team`,
        variables: ['client_name', 'company_name', 'login_link']
    },

    {
        key: 'client_contract_ready',
        name: 'Client Contract Ready for Review',
        subject: 'Contract Ready for Review - {{talent_name}}',
        bodyHtml: `
      <h1>Hi {{client_name}},</h1>
      <p>Your contract with {{talent_name}} is ready for review and signature.</p>
      <p><strong>Position:</strong> {{job_title}}</p>
      <p>Please review the contract details and sign to proceed.</p>
      <p><a href="{{contract_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Review & Sign Contract</a></p>
      <p>Best regards,<br>The OPSlyHR Team</p>
    `,
        bodyText: `Hi {{client_name}},

Your contract with {{talent_name}} is ready for review and signature.

Position: {{job_title}}

Please review the contract details and sign to proceed.

Review & Sign Contract: {{contract_link}}

Best regards,
The OPSlyHR Team`,
        variables: ['client_name', 'talent_name', 'job_title', 'contract_link']
    },

    {
        key: 'client_invoice_generated',
        name: 'Client Invoice Generated',
        subject: 'New Invoice #{{invoice_id}} - Due {{due_date}}',
        bodyHtml: `
      <h1>New Invoice, {{client_name}}</h1>
      <p>A new invoice has been generated for your account.</p>
      <p><strong>Invoice ID:</strong> {{invoice_id}}<br>
      <strong>Amount:</strong> {{amount}}<br>
      <strong>Due Date:</strong> {{due_date}}</p>
      <p><a href="{{invoice_link}}" style="background:#0066cc;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">View Invoice</a></p>
      <p>Best regards,<br>The OPSlyHR Team</p>
    `,
        bodyText: `New Invoice, {{client_name}}

A new invoice has been generated for your account.

Invoice ID: {{invoice_id}}
Amount: {{amount}}
Due Date: {{due_date}}

View Invoice: {{invoice_link}}

Best regards,
The OPSlyHR Team`,
        variables: ['client_name', 'invoice_id', 'amount', 'due_date', 'invoice_link']
    },

    // ADMIN PORTAL TEMPLATES (10)
    {
        key: 'admin_contract_fully_signed',
        name: 'Admin Contract Fully Signed Notification',
        subject: 'Contract Fully Signed - {{contract_id}}',
        bodyHtml: `
      <h1>Contract Fully Signed</h1>
      <p>Both parties have signed the contract.</p>
      <p><strong>Contract ID:</strong> {{contract_id}}<br>
      <strong>Client:</strong> {{client_name}}<br>
      <strong>Talent:</strong> {{talent_name}}</p>
      <p><a href="{{contract_link}}">View Contract</a></p>
    `,
        bodyText: `Contract Fully Signed

Both parties have signed the contract.

Contract ID: {{contract_id}}
Client: {{client_name}}
Talent: {{talent_name}}

View Contract: {{contract_link}}`,
        variables: ['contract_id', 'client_name', 'talent_name', 'contract_link']
    },

    {
        key: 'admin_invoice_overdue',
        name: 'Admin Invoice Overdue Alert',
        subject: 'ALERT: Invoice Overdue - {{invoice_id}}',
        bodyHtml: `
      <h1 style="color:#dc3545;">Invoice Overdue Alert</h1>
      <p>The following invoice is now overdue:</p>
      <p><strong>Invoice ID:</strong> {{invoice_id}}<br>
      <strong>Client:</strong> {{client_name}}<br>
      <strong>Amount:</strong> {{amount}}<br>
      <strong>Days Overdue:</strong> {{days_overdue}}</p>
      <p>Please follow up with the client.</p>
      <p><a href="{{invoice_link}}">View Invoice</a></p>
    `,
        bodyText: `INVOICE OVERDUE ALERT

The following invoice is now overdue:

Invoice ID: {{invoice_id}}
Client: {{client_name}}
Amount: {{amount}}
Days Overdue: {{days_overdue}}

Please follow up with the client.

View Invoice: {{invoice_link}}`,
        variables: ['invoice_id', 'client_name', 'amount', 'days_overdue', 'invoice_link']
    },
];
