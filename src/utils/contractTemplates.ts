export const CONTRACT_TEMPLATES = {
    MSA: {
        title: "Master Service Agreement",
        content: `
      <h2>Master Service Agreement</h2>
      <p>This Master Service Agreement ("Agreement") is entered into between:</p>
      <ul>
        <li><strong>Taskive Technologies Ltd</strong> ("Taskive")</li>
        <li><strong>{{clientCompany}}</strong> ("Client")</li>
      </ul>
      <h3>Purpose</h3>
      <p>This Agreement governs all talent sourcing, engagement, and operational services provided by Taskive to the Client.</p>
      <h3>Key Clauses</h3>
      <ul>
        <li><strong>Scope of Services:</strong> Taskive provides sourcing, vetting, and administrative management of remote talent.</li>
        <li><strong>Confidentiality:</strong> Both parties agree to maintain confidentiality of proprietary information.</li>
        <li><strong>Intellectual Property:</strong> All work product created by Talent for Client belongs to Client.</li>
        <li><strong>Liability:</strong> Taskive's liability is limited to fees paid in the prior 3 months.</li>
      </ul>
      <p>This Agreement becomes effective upon signature and applies to all future Statements of Work and Talent Engagement Contracts.</p>
    `
    },
    CLIENT: {
        FULL_TIME: {
            title: "Talent Placement Agreement (Direct Hire)",
            content: `
        <h2>Talent Placement Agreement</h2>
        <p><strong>Talent:</strong> {{talentName}} (ID: {{talentId}})</p>
        <p><strong>Role:</strong> {{roleTitle}}</p>
        <p><strong>Engagement Type:</strong> Full-Time Direct Hire</p>
        
        <h3>Financial Terms</h3>
        <ul>
          <li>Annual Salary: {{annualSalary}}</li>
          <li>Placement Fee (15%): {{placementFee}}</li>
        </ul>
        
        <h3>Employment Relationship</h3>
        <p>Upon hire, the Talent becomes an employee of the Client. Taskive has no employment obligations post-placement.</p>
      `
        },
        TRIAL_TO_HIRE: {
            title: "Talent Engagement Agreement (Trial-to-Hire)",
            content: `
        <h2>Talent Engagement Agreement</h2>
        <p><strong>Talent:</strong> {{talentName}} (ID: {{talentId}})</p>
        <p><strong>Role:</strong> {{roleTitle}}</p>
        <p><strong>Service Type:</strong> Trial-to-Hire</p>
        
        <h3>Billing Terms</h3>
        <ul>
          <li>Rate: {{clientRate}} per {{rateUnit}}</li>
          <li>Billing Frequency: {{billingFrequency}}</li>
        </ul>
        
        <h3>Time Tracking</h3>
        <p>Time tracking applies. Billing is based on approved timesheets.</p>
        
        {{overtimeClause}}
      `
        },
        ONE_TIME: {
            title: "Project Engagement Agreement",
            content: `
        <h2>Project Engagement Agreement</h2>
        <p><strong>Talent:</strong> {{talentName}}</p>
        <p><strong>Project:</strong> {{roleTitle}}</p>
        <p><strong>Scope:</strong> {{projectScope}}</p>
        
        <h3>Financial Terms</h3>
        <ul>
          <li>Rate: {{clientRate}} ({{rateUnit}})</li>
          <li>Billing Frequency: {{billingFrequency}}</li>
        </ul>
      `
        }
    },
    TALENT: {
        TRIAL_TO_HIRE: {
            title: "Talent Engagement Agreement",
            content: `
        <h2>Talent Engagement Agreement</h2>
        <p><strong>Talent:</strong> {{talentName}}</p>
        <p><strong>Client:</strong> {{clientCompany}}</p>
        <p><strong>Role:</strong> {{roleTitle}}</p>
        
        <h3>Compensation</h3>
        <ul>
          <li>Rate: {{talentRate}} per {{rateUnit}} (Net Payout)</li>
          <li>Pay Frequency: {{billingFrequency}}</li>
        </ul>
        
        <h3>Time Tracking</h3>
        <p>Talent must submit accurate timesheets. Payment is based on approved timesheets.</p>
        
        {{overtimeClause}}
      `
        },
        ONE_TIME: {
            title: "Project-Based Talent Agreement",
            content: `
        <h2>Project-Based Talent Agreement</h2>
        <p><strong>Project:</strong> {{roleTitle}}</p>
        <p><strong>Scope:</strong> {{projectScope}}</p>
        
        <h3>Compensation</h3>
        <ul>
          <li>Payout: {{talentRate}} ({{rateUnit}})</li>
        </ul>
      `
        },
        FULL_TIME_NOTICE: {
            title: "Engagement Completion & Transition Notice",
            content: `
        <h2>Employment Transition Notice</h2>
        <p>This document confirms the conclusion of Taskive's engagement with {{talentName}} following successful placement with {{clientCompany}}.</p>
        <p>The Talent becomes a direct employee of the Client effective {{startDate}}.</p>
      `
        }
    }
};

export const generateContractContent = (template: string, variables: Record<string, string>) => {
    let content = template;
    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, variables[key] || '');
    });
    return content;
};
