export const generateClientContractTerms = (
    serviceModel: string,
    offer: any,
    clientRate: number,
    margin: number,
    billingFreq: string,
    billingCycle: string,
    billingDay: string,
    projectType: string
) => {
    const date = new Date().toLocaleDateString();
    const clientName = offer.clients?.company_name || "Client";
    const talentName = `${offer.talents?.first_name} ${offer.talents?.last_name}`;
    const role = offer.role_title;
    const startDate = new Date(offer.start_date).toLocaleDateString();

    let text = `MASTER SERVICES AGREEMENT\n\n`;
    text += `This Master Services Agreement ("Agreement") is made and entered into as of ${date} (the "Effective Date") by and between:\n\n`;
    text += `OPSlyHR Technologies Inc. ("Company"), a Delaware Corporation, and\n`;
    text += `${clientName} ("Client").\n\n`;
    text += `1. ENGAGEMENT OF SERVICES\n`;
    text += `   1.1 Scope. Client hereby engages Company to provide the professional services of ${talentName} ("Talent") as a ${serviceModel.replace(/_/g, " ")} in the role of ${role}.\n`;
    text += `   1.2 Start Date. The engagement shall commence on ${startDate}.\n\n`;

    text += `2. COMPENSATION AND PAYMENT\n`;
    if (serviceModel === "direct_hire") {
        const salary = clientRate;
        const fee = (salary * (margin / 100)).toFixed(2);
        text += `   2.1 Placement Fee. Client agrees to pay a one-time placement fee of $${fee}, representing ${margin}% of the Talent's first-year annual base salary of $${salary}.\n`;
        text += `   2.2 Payment Terms. The Placement Fee is due net fifteen (15) days from the Talent's Start Date.\n`;
        text += `   2.3 Guarantee. If the Talent is terminated for cause or resigns within ninety (90) days of the Start Date, Company will provide a replacement candidate at no additional cost. No refunds shall be issued.\n`;
    } else if (serviceModel === "trial_to_hire") {
        text += `   2.1 Rate. Client shall pay Company a rate of $${clientRate} per hour for all hours worked by the Talent.\n`;
        text += `   2.2 Billing Cycle. Invoices will be issued ${billingFreq} based on ${billingCycle}.\n`;
        text += `   2.3 Payment Terms. Invoices are due net seven (7) days from the invoice date.\n`;
        text += `   2.4 Conversion. Client may hire Talent directly after 1,000 billed hours with no conversion fee. Early conversion requires a buyout fee equal to 20% of the remaining projected billing for the 1,000-hour period.\n`;
    } else if (serviceModel === "monthly_retainer") {
        text += `   2.1 Retainer Fee. Client shall pay a fixed monthly retainer of $${clientRate}.\n`;
        text += `   2.2 Billing. Invoices are generated on the ${billingDay} of each month for the upcoming period.\n`;
        text += `   2.3 Payment Terms. Net 7 days from invoice date.\n`;
    } else {
        // One-time or Hourly
        text += `   2.1 Rate. Client shall pay $${clientRate} (${projectType === 'fixed' ? 'Total Project Fee' : 'Per Hour'}).\n`;
        text += `   2.2 Billing. ${billingFreq}.\n`;
    }
    text += `\n`;

    text += `3. RELATIONSHIP OF PARTIES\n`;
    text += `   Company is an independent contractor. Talent is an employee or subcontractor of Company, not Client. Client shall not be liable for Talent's payroll taxes or benefits.\n\n`;

    text += `4. CONFIDENTIALITY AND INTELLECTUAL PROPERTY\n`;
    text += `   4.1 Confidentiality. Company and Talent agree to hold Client's proprietary information in strict confidence.\n`;
    text += `   4.2 Intellectual Property. All work product created by Talent during this engagement shall be "work made for hire" and clearly owned by Client upon full payment of fees.\n\n`;

    text += `5. NON-SOLICITATION\n`;
    text += `   During the term of this Agreement and for twelve (12) months thereafter, Client agrees not to directly hire, solicit, or contract with the Talent outside of this Agreement, except as provided in the Conversion clause above.\n\n`;

    text += `6. TERMINATION\n`;
    text += `   6.1 Notice. Either party may terminate this Agreement for convenience upon fourteen (14) days prior written notice.\n`;
    text += `   6.2 Payment upon Termination. Client remains responsible for all fees incurred up to the effective date of termination.\n\n`;

    text += `7. GENERAL\n`;
    text += `   7.1 Governing Law. State of Delaware.\n`;
    text += `   7.2 Entire Agreement. This Agreement constitutes the entire understanding between the parties.\n\n`;

    text += `IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.\n\n`;
    text += `CLIENT: ${clientName}\n`;
    text += `By: ___________________________\nTitle: ________________________\n\n`;
    text += `OPSLYHR TECHNOLOGIES INC.\n`;
    text += `By: ___________________________\nTitle: Authorized Representative`;

    return text;
};


export const generateTalentContractTerms = (
    contract: any,
    talentRate: number
) => {
    const date = new Date().toLocaleDateString();
    const talentName = `${contract.talents?.first_name} ${contract.talents?.last_name}`;

    let text = `INDEPENDENT CONTRACTOR AGREEMENT\n\n`;
    text += `This Independent Contractor Agreement ("Agreement") is made on ${date} between:\n\n`;
    text += `OPSlyHR Technologies Inc. ("Company") and\n`;
    text += `${talentName} ("Contractor").\n\n`;

    text += `1. SERVICES\n`;
    text += `   Contractor agrees to perform services as ${contract.role_title} for the client: ${contract.clients?.company_name}.\n`;
    text += `   Start Date: ${new Date(contract.start_date).toLocaleDateString()}\n\n`;

    text += `2. COMPENSATION\n`;
    if (contract.service_model === "monthly_retainer") {
        text += `   2.1 Fee. Company shall pay Contractor $${talentRate} per month.\n`;
        text += `   2.2 Payment Schedule. Monthly, paid on the 5th business day of the subsequent month.\n`;
    } else {
        text += `   2.1 Rate. Company shall pay Contractor $${talentRate} per hour.\n`;
        text += `   2.2 Payment Schedule. Bi-weekly, based on approved timesheets submitted by Monday 10:00 AM EST.\n`;
    }
    text += `\n`;

    text += `3. INDEPENDENT CONTRACTOR RELATIONSHIP\n`;
    text += `   Contractor is an independent contractor, not an employee. Contractor is responsible for all self-employment taxes and benefits.\n\n`;

    text += `4. CONFIDENTIALITY AND IP\n`;
    text += `   4.1 Confidentiality. Contractor shall keep all Client and Company information strictly confidential.\n`;
    text += `   4.2 IP Assignment. Contractor hereby assigns all rights, title, and interest in any work product created for the Client to the Company (for further assignment to Client).\n\n`;

    text += `5. PERFORMANCE STANDARDS\n`;
    text += `   Contractor agrees to perform services in a professional manner, consistent with industry standards. Contractor shall obtain approval for any time off in advance.\n\n`;

    text += `6. TERMINATION\n`;
    text += `   Either party may terminate this Agreement with 14 days written notice. Company may terminate immediately for cause (e.g., breach of confidentiality, failure to perform).\n\n`;

    text += `7. NON-CIRCUMVENTION\n`;
    text += `   Contractor agrees not to solicit or accept direct engagements with the Client for a period of 12 months following the termination of this Agreement.\n\n`;

    text += `ACCEPTED AND AGREED:\n\n`;
    text += `CONTRACTOR: ${talentName}\n`;
    text += `Signature: ______________________\n\n`;
    text += `OPSLYHR TECHNOLOGIES INC.\n`;
    text += `Signature: ______________________`;

    return text;
};


