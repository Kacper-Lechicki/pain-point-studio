// @vitest-environment node
/** Tests for the fire-and-forget recordView server action. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('@/lib/common/env', () => ({
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ rpc: mockRpc }),
}));

// ── Tests ────────────────────────────────────────────────────────────

describe('recordView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should call record_survey_view RPC with the survey ID', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { recordView } = await import('./record-view');

    await recordView('survey-123');

    expect(mockRpc).toHaveBeenCalledWith('record_survey_view', {
      p_survey_id: 'survey-123',
    });
  });

  it('should not throw when RPC succeeds', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { recordView } = await import('./record-view');

    await expect(recordView('survey-456')).resolves.toBeUndefined();
  });

  it('should propagate RPC errors', async () => {
    mockRpc.mockRejectedValue(new Error('RPC failure'));

    const { recordView } = await import('./record-view');

    await expect(recordView('survey-789')).rejects.toThrow('RPC failure');
  });
});
