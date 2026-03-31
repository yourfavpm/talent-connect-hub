import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queueEmail, updateEmailStatus } from '@/lib/email/emailService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('emailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('queueEmail', () => {
    it('should queue an email successfully via edge function', async () => {
      const emailData = {
        to: 'test@example.com',
        toName: 'Test User',
        templateKey: 'talent_welcome',
        variables: {
          talent_name: 'John Doe',
          talent_id: '12345',
          login_link: 'http://localhost:5173/login',
        },
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { messageId: 'mock-message-id' },
        error: null,
      } as any);

      const result = await queueEmail(emailData);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: emailData,
      });
      expect(result).toBe('mock-message-id');
    });

    it('should handle edge function error gracefully', async () => {
      const emailData = {
        to: 'test@example.com',
        toName: 'Test User',
        templateKey: 'talent_welcome',
        variables: {},
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      } as any);

      const result = await queueEmail(emailData);
      expect(result).toBe('');
    });

    it('should handle API error gracefully', async () => {
      const emailData = {
        to: 'test@example.com',
        toName: 'Test User',
        templateKey: 'non_existent_template',
        variables: {},
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { error: 'Template not found' },
        error: null,
      } as any);

      const result = await queueEmail(emailData);
      expect(result).toBe('');
    });
  });

  describe('updateEmailStatus', () => {
    it('should update email status correctly', async () => {
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({});

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      await updateEmailStatus('msg-123', 'delivered');

      expect(supabase.from).toHaveBeenCalledWith('email_logs');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'delivered' }));
      expect(mockEq).toHaveBeenCalledWith('provider_message_id', 'msg-123');
    });
  });
});
