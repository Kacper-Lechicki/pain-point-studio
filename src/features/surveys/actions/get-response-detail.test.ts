// @vitest-environment node
/** Tests for fetching a single response detail via the getResponseDetail RPC action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_SURVEY_ID as RESPONSE_ID, TEST_USER as USER } from '@/test-utils/action-helpers';

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

const mockGetUser = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────

const VALID_DETAIL = {
  id: RESPONSE_ID,
  status: 'completed',
  startedAt: '2025-01-01T00:00:00Z',
  completedAt: '2025-01-01T00:05:00Z',
  deviceType: 'desktop',
  durationSeconds: 300,
  contactName: 'Jane Doe',
  contactEmail: 'jane@example.com',
  answerCount: 3,
  feedback: null,
  answers: [
    {
      questionId: 'q1',
      questionText: 'How are you?',
      questionType: 'open_text',
      questionConfig: {},
      sortOrder: 0,
      value: { text: 'Good' },
    },
  ],
};

// ── Tests ────────────────────────────────────────────────────────────

describe('Survey Actions – Get Response Detail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return response detail on success', async () => {
    mockRpc.mockResolvedValue({ data: VALID_DETAIL, error: null });

    const { getResponseDetail } = await import('./get-response-detail');
    const result = await getResponseDetail({ responseId: RESPONSE_ID });

    expect(result).toEqual({ success: true, data: VALID_DETAIL });
    expect(mockRpc).toHaveBeenCalledWith('get_response_detail', {
      p_response_id: RESPONSE_ID,
      p_user_id: USER.id,
    });
  });

  it('should return error when rpc fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { getResponseDetail } = await import('./get-response-detail');
    const result = await getResponseDetail({ responseId: RESPONSE_ID });

    expect(result).toHaveProperty('error', 'surveys.errors.unexpected');
  });

  it('should return error when rpc returns null data', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { getResponseDetail } = await import('./get-response-detail');
    const result = await getResponseDetail({ responseId: RESPONSE_ID });

    expect(result).toHaveProperty('error', 'surveys.errors.unexpected');
  });

  it('should return validation error for invalid responseId', async () => {
    const { getResponseDetail } = await import('./get-response-detail');
    const result = await getResponseDetail({ responseId: 'not-a-uuid' });

    expect(result.error).toBeDefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
