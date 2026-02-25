// @vitest-environment node
/** Tests for updating a project insight via the updateInsight action. */
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

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────

function chain(result: { data?: unknown; error?: unknown } = {}) {
  const obj: { data: unknown; error: unknown; [key: string]: unknown } = {
    data: result.data ?? null,
    error: result.error ?? null,
  };

  return new Proxy(obj, {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return Promise.resolve(target)[prop as 'then'].bind(Promise.resolve(target));
      }

      const key = typeof prop === 'string' ? prop : undefined;

      if (key !== undefined && key in target) {
        return target[key];
      }

      if (key !== undefined) {
        target[key] = vi.fn().mockReturnValue(new Proxy(target, this));

        return target[key];
      }

      return undefined;
    },
  });
}

const INSIGHT_ID = '00000000-0000-4000-8000-000000000010';
const USER = { id: 'user-123', email: 'test@example.com' };

// ── Tests ────────────────────────────────────────────────────────────

describe('Project Actions – Update Insight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should update insight with both type and content', async () => {
    const updateChain = chain({ data: { id: INSIGHT_ID } });

    mockFrom.mockReturnValue(updateChain);

    const { updateInsight } = await import('./update-insight');

    const result = await updateInsight({
      insightId: INSIGHT_ID,
      type: 'threat',
      content: 'Updated content',
    });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('project_insights');

    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'threat',
        content: 'Updated content',
      })
    );
  });

  it('should update insight with only content', async () => {
    const updateChain = chain({ data: { id: INSIGHT_ID } });

    mockFrom.mockReturnValue(updateChain);

    const { updateInsight } = await import('./update-insight');

    await updateInsight({
      insightId: INSIGHT_ID,
      content: 'Only content updated',
    });

    expect(updateChain.update).toHaveBeenCalledWith({ content: 'Only content updated' });
  });

  it('should update insight with only type', async () => {
    const updateChain = chain({ data: { id: INSIGHT_ID } });

    mockFrom.mockReturnValue(updateChain);

    const { updateInsight } = await import('./update-insight');

    await updateInsight({
      insightId: INSIGHT_ID,
      type: 'decision',
    });

    expect(updateChain.update).toHaveBeenCalledWith({ type: 'decision' });
  });

  it('should return error when no matching row', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { updateInsight } = await import('./update-insight');

    const result = await updateInsight({
      insightId: INSIGHT_ID,
      content: 'Updated',
    });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should update insight type to opportunity', async () => {
    const updateChain = chain({ data: { id: INSIGHT_ID } });

    mockFrom.mockReturnValue(updateChain);

    const { updateInsight } = await import('./update-insight');

    await updateInsight({
      insightId: INSIGHT_ID,
      type: 'opportunity',
    });

    expect(updateChain.update).toHaveBeenCalledWith({ type: 'opportunity' });
  });

  it('should return validation error for invalid data', async () => {
    const { updateInsight } = await import('./update-insight');

    const result = await updateInsight({
      insightId: 'not-a-uuid',
      content: 'Test',
    });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
