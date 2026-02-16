// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('@/lib/common/env', () => ({
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  },
}));

vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ rpc: mockRpc }),
}));

// ── Helpers ──────────────────────────────────────────────────────────

const RESPONSE_ID = '00000000-0000-4000-8000-000000000001';

// ── Tests ────────────────────────────────────────────────────────────

describe('submitResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  // Minimal payload (responseId only) → success; rpc called with p_response_id.
  it('returns success when rpc succeeds with minimal payload', async () => {
    const { submitResponse } = await import('./submit-response');
    const result = await submitResponse({ responseId: RESPONSE_ID });

    expect(result).toEqual({ success: true });
    expect(mockRpc).toHaveBeenCalledWith(
      'submit_survey_response',
      expect.objectContaining({ p_response_id: RESPONSE_ID })
    );
  });

  // contactName and contactEmail passed as p_contact_name, p_contact_email.
  it('passes contactName and contactEmail when provided', async () => {
    const { submitResponse } = await import('./submit-response');
    await submitResponse({
      responseId: RESPONSE_ID,
      contactName: 'Jane',
      contactEmail: 'jane@example.com',
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'submit_survey_response',
      expect.objectContaining({
        p_response_id: RESPONSE_ID,
        p_contact_name: 'Jane',
        p_contact_email: 'jane@example.com',
      })
    );
  });

  // feedback passed as p_feedback.
  it('passes feedback when provided', async () => {
    const { submitResponse } = await import('./submit-response');
    await submitResponse({
      responseId: RESPONSE_ID,
      feedback: 'Great survey!',
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'submit_survey_response',
      expect.objectContaining({ p_feedback: 'Great survey!' })
    );
  });

  // RPC error → error string starting with respondent.
  it('returns error with respondent. prefix when rpc fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'some RPC error' } });

    const { submitResponse } = await import('./submit-response');
    const result = await submitResponse({ responseId: RESPONSE_ID });

    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toMatch(/^respondent\./);
  });
});
