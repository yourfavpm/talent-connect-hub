import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendTalentWelcomeEmail,
  sendClientWelcomeEmail,
  sendTalentOfferEmail,
  sendClientContractReadyEmail,
  sendTalentContractSignedEmail,
  sendClientContractSignedEmail,
  sendAdminContractFullySignedEmail,
  sendClientInvoiceGeneratedEmail,
} from '@/lib/email/triggers';

// Mock the email service
vi.mock('@/lib/email/emailService', () => ({
  queueEmail: vi.fn().mockResolvedValue(undefined),
}));

import { queueEmail } from '@/lib/email/emailService';

describe('Email Triggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendTalentWelcomeEmail', () => {
    it('should queue welcome email with correct talent data', async () => {
      const talent = {
        email: 'talent@example.com',
        firstName: 'John',
        talentId: 'talent-123',
      };

      await sendTalentWelcomeEmail(talent);

      expect(queueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'talent@example.com',
          toName: 'John',
          templateKey: 'talent_welcome',
          variables: expect.objectContaining({
            talent_name: 'John',
            talent_id: 'talent-123',
            login_link: expect.stringContaining('/login'),
          }),
        })
      );
    });
  });

  describe('sendClientWelcomeEmail', () => {
    it('should queue welcome email with correct client data', async () => {
      const client = {
        email: 'client@example.com',
        contactName: 'Jane',
        companyName: 'Tech Corp',
      };

      await sendClientWelcomeEmail(client);

      expect(queueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@example.com',
          toName: 'Jane',
          templateKey: 'client_welcome',
          variables: expect.objectContaining({
            client_name: 'Jane',
            company_name: 'Tech Corp',
            login_link: expect.stringContaining('/login'),
          }),
        })
      );
    });
  });

  describe('sendTalentOfferEmail', () => {
    it('should queue offer email with all required job details', async () => {
      const offer = {
        talentEmail: 'talent@example.com',
        talentName: 'John Doe',
        clientName: 'Tech Corp',
        jobTitle: 'Senior Developer',
        rate: '$85/hour',
        startDate: '2026-04-01',
        offerId: 'offer-123',
      };

      await sendTalentOfferEmail(offer);

      expect(queueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'talent@example.com',
          toName: 'John Doe',
          templateKey: 'talent_offer_received',
          variables: expect.objectContaining({
            job_title: 'Senior Developer',
            client_name: 'Tech Corp',
            rate: '$85/hour',
            start_date: '2026-04-01',
            offer_link: expect.stringContaining('/talent/offers/offer-123'),
          }),
        })
      );
    });
  });

  describe('sendClientContractReadyEmail', () => {
    it('should queue contract ready email with client information', async () => {
      const contract = {
        clientEmail: 'client@example.com',
        clientName: 'Jane Smith',
        talentName: 'John Doe',
        jobTitle: 'Senior Developer',
        contractId: 'contract-123',
      };

      await sendClientContractReadyEmail(contract);

      expect(queueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@example.com',
          toName: 'Jane Smith',
          templateKey: 'client_contract_ready',
          variables: expect.objectContaining({
            client_name: 'Jane Smith',
            talent_name: 'John Doe',
            job_title: 'Senior Developer',
            contract_link: expect.stringContaining('/client/contracts/contract-123'),
          }),
        })
      );
    });
  });

  describe('sendTalentContractSignedEmail', () => {
    it('should queue confirmation email when talent signs', async () => {
      const contract = {
        talentEmail: 'talent@example.com',
        talentName: 'John Doe',
        contractId: 'CONTRACT-001',
        startDate: '2026-04-01',
      };

      await sendTalentContractSignedEmail(contract);

      expect(queueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'talent@example.com',
          toName: 'John Doe',
          templateKey: 'talent_contract_signed',
          variables: expect.objectContaining({
            contract_id: 'CONTRACT-001',
            start_date: '2026-04-01',
            contract_link: expect.stringContaining('/talent/contracts/CONTRACT-001'),
          }),
        })
      );
    });
  });

  describe('sendClientContractSignedEmail', () => {
    it('should queue confirmation email when client signs', async () => {
      const contract = {
        clientEmail: 'client@example.com',
        clientName: 'Jane Smith',
        talentName: 'John Doe',
        contractId: 'CONTRACT-001',
      };

      await sendClientContractSignedEmail(contract);

      expect(queueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@example.com',
          toName: 'Jane Smith',
          templateKey: 'client_contract_signed',
          variables: expect.objectContaining({
            client_name: 'Jane Smith',
            talent_name: 'John Doe',
            contract_id: 'CONTRACT-001',
            contract_link: expect.stringContaining('/client/contracts/CONTRACT-001'),
          }),
        })
      );
    });
  });

  describe('sendAdminContractFullySignedEmail', () => {
    it('should queue admin notification when both parties sign', async () => {
      const contract = {
        adminEmail: 'admin@opslyhr.com',
        contractId: 'CONTRACT-001',
        clientName: 'Jane Smith',
        talentName: 'John Doe',
      };

      await sendAdminContractFullySignedEmail(contract);

      expect(queueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@opslyhr.com',
          templateKey: 'admin_contract_fully_signed',
          variables: expect.objectContaining({
            contract_id: 'CONTRACT-001',
            client_name: 'Jane Smith',
            talent_name: 'John Doe',
            contract_link: expect.stringContaining('/admin/contracts/CONTRACT-001'),
          }),
        })
      );
    });
  });

  describe('sendClientInvoiceGeneratedEmail', () => {
    it('should queue invoice notification with payment details', async () => {
      const invoice = {
        clientEmail: 'client@example.com',
        clientName: 'Jane Smith',
        invoiceId: 'INV-2026-001',
        amount: '$5,000.00',
        dueDate: '2026-05-01',
      };

      await sendClientInvoiceGeneratedEmail(invoice);

      expect(queueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@example.com',
          toName: 'Jane Smith',
          templateKey: 'client_invoice_generated',
          variables: expect.objectContaining({
            client_name: 'Jane Smith',
            invoice_id: 'INV-2026-001',
            amount: '$5,000.00',
            due_date: '2026-05-01',
            invoice_link: expect.stringContaining('/client/invoices/INV-2026-001'),
          }),
        })
      );
    });
  });

  describe('Email trigger integration', () => {
    it('should queue multiple emails in sequence without blocking', async () => {
      const talent = {
        email: 'talent@example.com',
        firstName: 'John',
        talentId: 'talent-123',
      };

      const client = {
        email: 'client@example.com',
        contactName: 'Jane',
        companyName: 'Tech Corp',
      };

      await Promise.all([
        sendTalentWelcomeEmail(talent),
        sendClientWelcomeEmail(client),
      ]);

      expect(queueEmail).toHaveBeenCalledTimes(2);
    });
  });
});
