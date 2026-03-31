import { vi } from 'vitest';

// Mock Resend module
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = {
      send: vi.fn().mockResolvedValue({
        data: { id: 'mock-email-id' },
        error: null,
      }),
    };
  },
}));

// Mock Supabase module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { email: 'admin@opslyhr.com' } }),
    })),
  },
}));

// Set environment variables for tests
process.env.VITE_RESEND_API_KEY = 'test-api-key';
process.env.VITE_EMAIL_FROM = 'test@opslyhr.com';
process.env.VITE_EMAIL_FROM_NAME = 'OPSlyHR';
process.env.VITE_APP_URL = 'http://localhost:5173';
