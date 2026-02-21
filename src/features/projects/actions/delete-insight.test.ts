// @vitest-environment node
/** Tests for deleting a project insight via the deleteInsight action. */
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

describe('Project Actions – Delete Insight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should delete insight and return success', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: INSIGHT_ID } }));

    const { deleteInsight } = await import('./delete-insight');
    const result = await deleteInsight({ insightId: INSIGHT_ID });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('project_insights');
  });

  it('should return error when no matching row', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { deleteInsight } = await import('./delete-insight');
    const result = await deleteInsight({ insightId: INSIGHT_ID });

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid insightId', async () => {
    const { deleteInsight } = await import('./delete-insight');
    const result = await deleteInsight({ insightId: 'not-a-uuid' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
