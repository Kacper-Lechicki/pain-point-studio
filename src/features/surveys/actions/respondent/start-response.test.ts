// @vitest-environment node
/** Tests for starting a new survey response via the startResponse RPC action. */
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

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
}));

const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ rpc: mockRpc }),
}));

// ── Helpers ──────────────────────────────────────────────────────────

const SURVEY_ID = crypto.randomUUID();
const RESPONSE_ID = crypto.randomUUID();

// ── Tests ────────────────────────────────────────────────────────────

describe('startResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should start response successfully and return responseId', async () => {
    mockRpc.mockResolvedValue({ data: RESPONSE_ID, error: null });

    const { startResponse } = await import('./start-response');
    const result = await startResponse({ surveyId: SURVEY_ID });

    expect(result).toEqual({ success: true, data: { responseId: RESPONSE_ID } });

    expect(mockRpc).toHaveBeenCalledWith('start_survey_response', {
      p_survey_id: SURVEY_ID,
    });
  });

  it('should pass deviceType to RPC when provided', async () => {
    mockRpc.mockResolvedValue({ data: RESPONSE_ID, error: null });

    const { startResponse } = await import('./start-response');

    await startResponse({ surveyId: SURVEY_ID, deviceType: 'mobile' });

    expect(mockRpc).toHaveBeenCalledWith('start_survey_response', {
      p_survey_id: SURVEY_ID,
      p_device_type: 'mobile',
    });
  });

  it('should not pass p_device_type when deviceType is omitted', async () => {
    mockRpc.mockResolvedValue({ data: RESPONSE_ID, error: null });

    const { startResponse } = await import('./start-response');

    await startResponse({ surveyId: SURVEY_ID });

    const firstCall = mockRpc.mock.calls[0];

    expect(firstCall).toBeDefined();

    const rpcArgs = firstCall?.[1];

    expect(rpcArgs).not.toHaveProperty('p_device_type');
  });

  it('should return mapped error on RPC failure', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'SURVEY_NOT_FOUND' },
    });

    const { startResponse } = await import('./start-response');
    const result = await startResponse({ surveyId: SURVEY_ID });

    expect(result.error).toBeDefined();
    expect(result.error).toContain('respondent.');
    expect(result).not.toHaveProperty('success');
  });
});
